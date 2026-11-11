/**
 * Dynamic Role-Based Navigation Sidebar for LUKS
 * Implements the exact 4 menu specifications for Administrator, Petugas UKS,
 * Karyawan/Siswa, and Pimpinan.
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Activity,
  HeartPulse,
  ClipboardList,
  CalendarCheck,
  FileSpreadsheet,
  UserCog,
  Settings,
  ShieldAlert,
  UserPlus,
  Stethoscope,
  BellRing,
  User,
  History,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LAZUARDI_LOGO_URL } from '../../constants/assets';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { role } = useAuth();

  // 1. Menu Administrator (11 items)
  const adminMenuItems: MenuItem[] = [
    { id: 'admin_dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'students', label: '2. Data Siswa', icon: GraduationCap },
    { id: 'employees', label: '3. Data Karyawan', icon: Users },
    { id: 'units_classes', label: '4. Data Unit dan Kelas', icon: Building2 },
    { id: 'glucose_exams', label: '5. Pemeriksaan Gula Darah', icon: Activity },
    { id: 'uks_visits', label: '6. Kunjungan UKS', icon: HeartPulse },
    { id: 'follow_ups', label: '7. Tindak Lanjut', icon: ClipboardList },
    { id: 'reports', label: '8. Laporan', icon: FileSpreadsheet },
    { id: 'users', label: '9. Manajemen Pengguna', icon: UserCog },
    { id: 'settings', label: '10. Pengaturan', icon: Settings },
    { id: 'audit_logs', label: '11. Audit Log', icon: ShieldAlert },
  ];

  // 2. Menu Petugas UKS (10 items)
  const petugasMenuItems: MenuItem[] = [
    { id: 'petugas_dashboard', label: '1. Dashboard UKS', icon: LayoutDashboard },
    { id: 'glucose_exams', label: '2. Pemeriksaan Gula Darah', icon: Activity },
    { id: 'glucose_register', label: '3. Pendaftaran Pemeriksaan', icon: UserPlus },
    { id: 'glucose_history', label: '4. Riwayat Pemeriksaan', icon: History },
    { id: 'uks_visits', label: '5. Kunjungan UKS', icon: HeartPulse },
    { id: 'uks_register', label: '6. Pendaftaran Kunjungan', icon: HeartPulse },
    { id: 'uks_handling', label: '7. Penanganan UKS', icon: Stethoscope },
    { id: 'follow_ups', label: '8. Tindak Lanjut', icon: ClipboardList },
    { id: 'reminders', label: '9. Pengingat', icon: BellRing },
    { id: 'reports', label: '10. Laporan', icon: FileSpreadsheet },
  ];

  // 3. Menu Karyawan dan Siswa (6 items)
  const userMenuItems: MenuItem[] = [
    { id: 'user_dashboard', label: '1. Dashboard Saya', icon: LayoutDashboard },
    { id: 'my_profile', label: '2. Profil Saya', icon: User },
    { id: 'my_glucose', label: '3. Riwayat Pemeriksaan Gula Darah', icon: Activity },
    { id: 'my_visits', label: '4. Riwayat Kunjungan UKS', icon: HeartPulse },
    { id: 'my_followups', label: '5. Tindak Lanjut Saya', icon: ClipboardList },
    { id: 'notifications', label: '6. Notifikasi', icon: BellRing },
  ];

  // 4. Menu Pimpinan (8 items)
  const pimpinanMenuItems: MenuItem[] = [
    { id: 'pimpinan_dashboard', label: '1. Dashboard Manajemen', icon: LayoutDashboard },
    { id: 'stats_glucose', label: '2. Statistik Pemeriksaan Gula Darah', icon: Activity },
    { id: 'stats_visits', label: '3. Statistik Kunjungan UKS', icon: HeartPulse },
    { id: 'stats_followups', label: '4. Statistik Tindak Lanjut', icon: ClipboardList },
    { id: 'reports_by_unit', label: '5. Laporan per Unit', icon: Layers },
    { id: 'trends_analysis', label: '6. Tren dan Analisis', icon: TrendingUp },
    { id: 'my_glucose', label: '7. Pemeriksaan Gula Darah Saya', icon: Activity },
    { id: 'my_visits', label: '8. Kunjungan UKS Saya', icon: HeartPulse },
  ];

  let currentMenuItems: MenuItem[] = petugasMenuItems;
  let roleTitle = 'Petugas UKS';

  if (role === 'admin') {
    currentMenuItems = adminMenuItems;
    roleTitle = 'Administrator';
  } else if (role === 'pimpinan') {
    currentMenuItems = pimpinanMenuItems;
    roleTitle = 'Pimpinan Sekolah';
  } else if (role === 'karyawan' || role === 'siswa') {
    currentMenuItems = userMenuItems;
    roleTitle = role === 'siswa' ? 'Portal Siswa' : 'Portal Karyawan';
  }

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 no-print ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Logo & School Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={LAZUARDI_LOGO_URL}
                alt="Logo Lazuardi"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/lazuardi.png';
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="font-extrabold text-sm text-white tracking-wide">LUKS</div>
                <div className="text-[10px] text-sky-400 font-semibold truncate">Lazuardi UKS Terpadu</div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isCollapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Header Badge */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Hak Akses Aktif:
            </span>
            <span className="text-[11px] font-bold text-sky-300 capitalize">{roleTitle}</span>
          </div>
        )}

        {/* Menu Navigation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.badge !== undefined && !isCollapsed && (
                  <span className="ml-auto px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom School Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          {!isCollapsed ? (
            <div className="text-[10px] text-slate-400 text-center leading-tight">
              <p className="font-semibold text-slate-300">Lazuardi Global School</p>
              <p className="text-slate-500 mt-0.5">Versi 2.4.0 • TA 2026/2027</p>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
              UKS
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
