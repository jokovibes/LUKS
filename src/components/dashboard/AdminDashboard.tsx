/**
 * Dashboard Administrator - LUKS
 * Administrative overview of master data, active users, clinical parameter approvals,
 * and comparative health statistics separating Siswa vs Guru & Karyawan.
 */

import React from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Settings,
  Activity,
  HeartPulse,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  ClipboardList,
  Shield,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { ComparativeHealthCharts } from './ComparativeHealthCharts';
import { SchoolActivityOutcomeCharts } from './SchoolActivityOutcomeCharts';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenSupabaseGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenSupabaseGuide,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const profiles = DataService.getProfiles();
  const students = profiles.filter((p) => p.category === 'siswa');
  const employees = profiles.filter((p) => p.category === 'karyawan');
  const units = DataService.getUnits();
  const classes = DataService.getClasses();
  const exams = DataService.getGlucoseExaminations(currentUser);
  const visits = DataService.getUksVisits(currentUser);
  const followUps = DataService.getAllFollowUps(currentUser);

  const handleDownloadPdf = () => {
    ExportService.downloadDashboardPdf('admin', currentUser, {
      exams,
      visits,
      followUps,
      units,
      studentsCount: students.length,
      employeesCount: employees.length,
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle="LAPORAN EKSEKUTIF DASHBOARD ADMINISTRATOR"
          documentSubtitle="Ikhtisar Master Data, Aktivitas UKS Antar Unit, & Statistik Kesehatan Terpadu Lazuardi"
          documentNumber={`LUKS-ADM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        />
      </div>

      {/* Admin Hero Card */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-800/60 text-purple-200 text-xs font-semibold mb-3 border border-purple-600/30">
            <Shield className="w-3.5 h-3.5" />
            <span>Hak Akses Administrator • Kendali Sistem LUKS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Panel Administrasi & Konfigurasi Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Kelola data master siswa, karyawan, kelas, parameter batas medis yang telah disetujui, serta pantau statistik kesehatan terpadu sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 border border-purple-400/30"
          >
            <Printer className="w-4 h-4" />
            Download PDF Dashboard
          </button>
          <button
            onClick={onOpenSupabaseGuide}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Status Supabase & SQL
          </button>
        </div>
      </div>

      {/* Stats Cards (Without Jejak Audit Log) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Siswa Terdaftar
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{students.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">NIS & Data Kelas Aktif</div>
        </div>

        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 cursor-pointer transition"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Guru & Karyawan
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1 font-mono">{employees.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">NIY & Unit Kerja</div>
        </div>

        <div
          onClick={() => onNavigateTab('units_classes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Unit & Kelas Sekolah
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
            {units.length} Unit / {classes.length} Kelas
          </div>
          <div className="text-[10px] text-slate-500 mt-1">TK, SD, SMP, SMA Lazuardi</div>
        </div>

        <div
          onClick={() => onNavigateTab('follow_ups')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Tindak Lanjut Aktif
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{followUps.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {followUps.filter((f) => f.follow_up_status === 'selesai').length} Selesai •{' '}
            {followUps.filter((f) => f.follow_up_status !== 'selesai').length} Berjalan
          </div>
        </div>
      </div>

      {/* GRAFIK PERBANDINGAN AKTIVITAS UKS ANTAR UNIT SEKOLAH & DISTRIBUSI PENANGANAN */}
      <SchoolActivityOutcomeCharts exams={exams} visits={visits} />

      {/* COMPARATIVE CHARTS: GULA DARAH, KUNJUNGAN UKS, TINDAK LANJUT (SISWA VS GURU & KARYAWAN) */}
      <ComparativeHealthCharts currentUser={currentUser} exams={exams} visits={visits} />

      {/* Quick Action Master Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('settings')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold group-hover:bg-blue-800 group-hover:text-white transition">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
            Pengaturan Parameter Klasifikasi Medis
          </h4>
          <p className="text-[11px] text-slate-500">
            Atur ambang batas glukosa yang disetujui dokter konsultan medis sekolah beserta nomor versi resminya.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('settings')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-900">
            Konfigurasi Ambang Kunjungan Berulang
          </h4>
          <p className="text-[11px] text-slate-500">
            Sesuaikan ambang batas jumlah kunjungan berulang (default 3 kali / 30 hari) sesuai kebijakan UKS.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('users')}
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold group-hover:bg-purple-700 group-hover:text-white transition">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-900">
            Manajemen Akun & Role Pengguna
          </h4>
          <p className="text-[11px] text-slate-500">
            Tambah, aktifkan, atau nonaktifkan pengguna, dan atur penugasan role sesuai prinsip least privilege.
          </p>
        </div>
      </div>
    </div>
  );
};
