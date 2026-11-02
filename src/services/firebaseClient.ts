/**
 * Google Firebase Authentication Service for LUKS
 * Project: gen-lang-client-0833935200 (Lazuardi Global Compassionate School)
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  Auth,
  UserCredential,
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

try {
  if (isFirebaseConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

export { app, auth, googleProvider };

/**
 * Triggers Google Sign-In popup with Firebase Auth
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  uid?: string;
  error?: string;
}> {
  if (!auth || !googleProvider) {
    return {
      success: false,
      error: 'Firebase Authentication belum terkonfigurasi pada sistem.',
    };
  }

  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (!user.email) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: 'Akun Google Anda tidak menyediakan alamat email yang valid.',
      };
    }

    return {
      success: true,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
    };
  } catch (err: any) {
    console.error('Firebase Google Sign-In Error:', err);

    let friendlyMessage = 'Gagal masuk dengan Google.';
    if (err?.code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Proses masuk Google dibatalkan karena jendela popup ditutup.';
    } else if (err?.code === 'auth/popup-blocked') {
      friendlyMessage = 'Jendela popup Google diblokir browser. Mohon izinkan popup untuk situs ini.';
    } else if (err?.code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Permintaan popup masuk Google dibatalkan.';
    } else if (err?.code === 'auth/unauthorized-domain') {
      friendlyMessage = 'Domain aplikasi ini belum diizinkan pada konsol Firebase Authentication.';
    } else if (err?.message) {
      friendlyMessage = err.message;
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  }
}

/**
 * Signs out from Firebase Authentication
 */
export async function signOutFromFirebase(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
  }
}
