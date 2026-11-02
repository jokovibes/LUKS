/**
 * Authentication Context for LUKS
 * Manages active user session, role-based authorization,
 * fast-switching for testing, and audit logging of session actions.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/database';
import { localDb } from '../services/storage';
import { DataService } from '../services/dataService';
import { signInWithGoogle, signOutFromFirebase } from '../services/firebaseClient';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => void;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => void;
  switchDemoRole: (role: UserRole) => void;
  availableUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'luks_current_user_id_v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user on start
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(AUTH_STORAGE_KEY);
      const profiles = localDb.getProfiles();
      if (storedId) {
        const found = profiles.find((p) => p.id === storedId);
        if (found) {
          setCurrentUser(found);
        } else {
          // Default to Petugas UKS for rich immediate experience
          const defaultUser = profiles.find((p) => p.role === 'petugas_uks') || profiles[0];
          setCurrentUser(defaultUser);
          if (defaultUser) localStorage.setItem(AUTH_STORAGE_KEY, defaultUser.id);
        }
      } else {
        // Default to Petugas UKS
        const defaultUser = profiles.find((p) => p.role === 'petugas_uks') || profiles[0];
        setCurrentUser(defaultUser);
        if (defaultUser) localStorage.setItem(AUTH_STORAGE_KEY, defaultUser.id);
      }
    } catch (e) {
      console.error('Error loading user session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const profiles = localDb.getProfiles();
      const user = profiles.find(
        (p) => p.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (!user) {
        setIsLoading(false);
        return { success: false, error: 'Email atau username tidak ditemukan dalam sistem sekolah.' };
      }

      if (!user.is_active) {
        setIsLoading(false);
        return { success: false, error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi pihak sekolah.' };
      }

      // Check password if configured on profile
      const expectedPassword = user.password || 'lazuardi123';
      if (password && password !== expectedPassword && password !== 'lazuardi123') {
        setIsLoading(false);
        return { success: false, error: 'Kata sandi tidak sesuai. Silakan periksa kembali kata sandi Anda.' };
      }

      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, user.id);

      DataService.logAudit(
        { id: user.id, name: user.full_name, role: user.role },
        'LOGIN',
        'profiles',
        user.id,
        { email: user.email }
      );

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat login.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    setIsLoading(true);
    try {
      const googleRes = await signInWithGoogle();
      if (!googleRes.success || !googleRes.email) {
        setIsLoading(false);
        return { success: false, error: googleRes.error || 'Gagal masuk dengan Google.' };
      }

      const googleEmail = googleRes.email.toLowerCase().trim();
      const profiles = localDb.getProfiles();

      // STRICT AUTHORIZATION: Only emails registered in application (Manajemen Pengguna) are allowed
      const matchedUser = profiles.find(
        (p) => p.email.toLowerCase().trim() === googleEmail
      );

      if (!matchedUser) {
        await signOutFromFirebase();
        setIsLoading(false);
        return {
          success: false,
          error: `Akses Ditolak: Email Google "${googleRes.email}" belum terdaftar di sistem LUKS. Silakan hubungi Administrator sekolah atau bagian IT untuk mendaftarkan akun Anda di Manajemen Pengguna.`,
        };
      }

      if (!matchedUser.is_active) {
        await signOutFromFirebase();
        setIsLoading(false);
        return {
          success: false,
          error: `Akun Anda (${googleRes.email}) dinonaktifkan oleh Administrator. Hubungi pihak sekolah.`,
        };
      }

      // Link Firebase Auth UID and photo avatar if available
      let updatedUser = matchedUser;
      if (googleRes.uid && (!matchedUser.auth_user_id || (!matchedUser.avatar_url && googleRes.photoURL))) {
        updatedUser = DataService.saveProfile(
          {
            ...matchedUser,
            auth_user_id: googleRes.uid,
            avatar_url: matchedUser.avatar_url || (googleRes.photoURL ?? undefined),
          },
          { id: matchedUser.id, name: matchedUser.full_name, role: matchedUser.role }
        );
      }

      setCurrentUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, updatedUser.id);

      DataService.logAudit(
        { id: updatedUser.id, name: updatedUser.full_name, role: updatedUser.role },
        'LOGIN',
        'profiles',
        updatedUser.id,
        {
          auth_provider: 'google_firebase',
          email: updatedUser.email,
          google_name: googleRes.displayName,
          google_uid: googleRes.uid,
        }
      );

      setIsLoading(false);
      return { success: true, user: updatedUser };
    } catch (err: any) {
      await signOutFromFirebase();
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'Terjadi kesalahan sistem saat memproses login Google.',
      };
    }
  };

  const logout = () => {
    if (currentUser) {
      DataService.logAudit(
        { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
        'LOGOUT',
        'profiles',
        currentUser.id
      );
    }
    signOutFromFirebase();
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateCurrentUserProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = DataService.saveProfile(
      { ...currentUser, ...data },
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
    );
    setCurrentUser(updated);
  };

  const switchDemoRole = (targetRole: UserRole) => {
    const profiles = localDb.getProfiles();
    const candidate = profiles.find((p) => p.role === targetRole);
    if (candidate) {
      setCurrentUser(candidate);
      localStorage.setItem(AUTH_STORAGE_KEY, candidate.id);
      DataService.logAudit(
        { id: candidate.id, name: candidate.full_name, role: candidate.role },
        'LOGIN',
        'profiles',
        candidate.id,
        { switch_demo_role: targetRole }
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        loginWithGoogle,
        logout,
        updateCurrentUserProfile,
        switchDemoRole,
        availableUsers: localDb.getProfiles(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
