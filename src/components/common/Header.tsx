/**
 * Application Top Header for LUKS
 * Features real-time clock (Asia/Jakarta WIB), Supabase connection indicator,
 * notification bell, fast role switcher, and user profile drawer.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  Shield,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
import { AppNotification, UserRole } from '../../types/database';
import { LAZUARDI_LOGO_URL } from '../../constants/assets';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  onOpenSupabaseGuide: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNotifications,
  onOpenSupabaseGuide,
}) => {
  const { currentUser, role, logout, clearLocalStorageAndLogout } = useAuth();
  const [wibTime, setWibTime] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Update clock every second in Asia/Jakarta time
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const formatted = date.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dayFormatted = date.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setWibTime(`${dayFormatted}, ${formatted} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check notifications & Supabase connection
  useEffect(() => {
    if (currentUser) {
      const notifs = DataService.getNotifications(currentUser.id);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    }

    const unsubscribe = SupabaseSyncService.subscribe((status) => {
      setSupabaseConnected(status.isConnected);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const roleLabelMap: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    petugas_uks: { label: 'Petugas UKS', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    pimpinan: { label: 'Pimpinan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    karyawan: { label: 'Guru / Karyawan', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    siswa: { label: 'Siswa', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Toggle & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition"
            title="Buka / Tutup Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={LAZUARDI_LOGO_URL}
                alt="Logo Lazuardi"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/lazuardi.png';
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-blue-950 text-sm tracking-tight">LUKS</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Lazuardi UKS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Integrated School Health Information System</p>
            </div>
          </div>
        </div>

        {/* Center: Live WIB Asia/Jakarta Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/70 rounded-full text-xs text-slate-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span className="font-mono text-[11px]">{wibTime || 'Memuat WIB...'}</span>
        </div>

        {/* Right Actions: Supabase Status, Role Switcher, Notification, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseGuide}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
              supabaseConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-850 border-amber-300 hover:bg-amber-100'
            }`}
            title="Klik untuk melihat status koneksi Supabase & Sinkronisasi"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{supabaseConnected ? 'Database Supabase Terhubung' : 'Menghubungkan ke Supabase...'}</span>
            {supabaseConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </button>

          {/* Status Hak Akses */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Hak Akses:</span>
            <span className="font-extrabold text-blue-950">
              {role ? roleLabelMap[role].label : 'Pengguna'}
            </span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Pusat Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.full_name || 'Pengguna'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.employee_or_student_id || '-'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900">{currentUser?.full_name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        role ? roleLabelMap[role].color : ''
                      }`}
                    >
                      {role ? roleLabelMap[role].label : '-'}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenSupabaseGuide();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <Database className="w-4 h-4 text-blue-700" />
                    Status Supabase & SQL Schema
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (window.confirm('Keluar dan reset sesi aplikasi?')) {
                        clearLocalStorageAndLogout();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4 text-amber-600" />
                    Reset Sesi & Halaman Login
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar Sistem (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
