/**
 * Dashboard Utama Petugas UKS - LUKS
 * Features real-time statistics, active resting visits tracker, repeat visit alerts,
 * Recharts visualization, and quick action buttons.
 */

import React from 'react';
import {
  Activity,
  HeartPulse,
  Users,
  Bed,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CalendarCheck,
  CheckCircle2,
  QrCode,
  FileText,
  ChevronRight,
  Stethoscope,
  Printer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { UksVisit, GlucoseExamination } from '../../types/database';
import { ComparativeHealthCharts } from './ComparativeHealthCharts';
import { SchoolActivityOutcomeCharts } from './SchoolActivityOutcomeCharts';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface PetugasDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenQrScanner: () => void;
}

export const PetugasDashboard: React.FC<PetugasDashboardProps> = ({
  onNavigateTab,
  onOpenQrScanner,
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const exams = DataService.getGlucoseExaminations(currentUser);
  const visits = DataService.getUksVisits(currentUser);
  const followUps = DataService.getGlucoseFollowUps(currentUser);
  const repeatWarnings = DataService.getRepeatVisitWarnings();
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Active resting visits
  const activeVisits = visits.filter((v) => v.visit_status === 'aktif');

  // Stats: Glucose
  const totalExams = exams.length;
  const studentExams = exams.filter((e) => e.participant?.category === 'siswa').length;
  const staffExams = exams.filter((e) => e.participant?.category === 'karyawan').length;
  const attentionCount = exams.filter((e) => e.classification === 'perlu_perhatian').length;
  const followUpCount = exams.filter((e) => e.classification === 'tindak_lanjut').length;

  // Stats: Visits
  const todayVisits = visits.filter((v) => {
    const d = new Date(v.visit_datetime);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const referredCount = visits.filter((v) => v.outcome === 'dirujuk').length;
  const resolvedCount = visits.filter((v) => v.outcome === 'kembali_ke_kelas' || v.outcome === 'kembali_bekerja').length;

  // Recharts: Distribution of Glucose Classifications
  const glucosePieData = [
    { name: 'Normal', value: exams.filter((e) => e.classification === 'normal').length, color: '#10b981' },
    { name: 'Perlu Perhatian', value: attentionCount, color: '#f59e0b' },
    { name: 'Pemantauan', value: exams.filter((e) => e.classification === 'pemantauan').length, color: '#f97316' },
    { name: 'Tindak Lanjut', value: followUpCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Recharts: Visits by Reason
  const reasonBarData = [
    { name: 'Sakit', total: visits.filter((v) => v.visit_reason === 'sakit').length },
    { name: 'Cedera', total: visits.filter((v) => v.visit_reason === 'cedera').length },
    { name: 'Cek Rutin', total: visits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length },
    { name: 'Lainnya', total: visits.filter((v) => v.visit_reason === 'lainnya').length },
  ];

  const handleDownloadPdf = () => {
    ExportService.downloadDashboardPdf('petugas', currentUser, {
      exams,
      visits,
      followUps,
      units,
      activeVisits,
      repeatWarnings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle="LAPORAN OPERASIONAL DASHBOARD PETUGAS UKS"
          documentSubtitle="Monitoring Kunjungan UKS, Skrining Glukosa, & Rekapitulasi Pasien Lazuardi"
          documentNumber={`LUKS-UKS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        />
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden no-print">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 text-sky-200 text-xs font-semibold mb-3 border border-blue-500/30">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Unit Kesehatan Sekolah • Lazuardi Global Compassionate School</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Selamat Bertugas, {currentUser.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1.5 leading-relaxed">
            Pantau kondisi kesehatan siswa dan karyawan secara terpadu, catat hasil pemeriksaan gula darah, dan tangani kunjungan UKS dengan standar pelayanan penuh empati.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => onNavigateTab('glucose_register')}
              className="px-4 py-2 bg-white text-blue-900 hover:bg-sky-50 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-blue-700" />
              Pemeriksaan Gula Darah Baru
            </button>
            <button
              onClick={() => onNavigateTab('uks_register')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <HeartPulse className="w-4 h-4 text-white" />
              Pendaftaran Kunjungan UKS
            </button>
            <button
              onClick={onOpenQrScanner}
              className="px-3.5 py-2 bg-blue-950/60 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold border border-blue-400/30 transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-sky-300" />
              Pindai QR Identitas
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold border border-indigo-400/30 transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-white" />
              Download PDF Dashboard
            </button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kunjungan Hari Ini */}
        <div
          onClick={() => onNavigateTab('uks_visits')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kunjungan Hari Ini
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{todayVisits}</div>
            <div className="text-[10px] text-slate-500 mt-1">Total riwayat: {visits.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Sedang Istirahat di UKS (Active) */}
        <div
          onClick={() => onNavigateTab('uks_visits')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang di UKS (Aktif)
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
              {activeVisits.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Perlu pemantauan & checkout</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Pemeriksaan Glukosa */}
        <div
          onClick={() => onNavigateTab('glucose_exams')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pemeriksaan Gula Darah
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{totalExams}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              {studentExams} Siswa • {staffExams} Guru/Karyawan
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition shrink-0">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Peringatan Kunjungan Berulang */}
        <div
          onClick={() => onNavigateTab('reminders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 cursor-pointer transition flex items-center justify-between group"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Kunjungan Berulang
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {repeatWarnings.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">≥ 3 kali dalam 30 hari</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row: Active UKS Visits Banner & Repeat Visits Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Visits Box (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Pengunjung Sedang Beristirahat di UKS ({activeVisits.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('uks_visits')}
              className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeVisits.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                Tidak ada siswa atau karyawan yang sedang beristirahat di UKS saat ini.
              </div>
            ) : (
              activeVisits.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{v.participant?.full_name}</div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      Keluhan: {v.main_complaint}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Mulai istirahat:{' '}
                      {v.rest_start_time
                        ? new Date(v.rest_start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '-'}{' '}
                      WIB
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('uks_visits')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-2xs transition"
                  >
                    Kelola / Checkout
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Peringatan Kunjungan Berulang (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Peringatan Kunjungan Berulang ({repeatWarnings.length})
            </h3>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="text-[11px] text-rose-700 font-bold hover:underline"
            >
              Telaah Detail
            </button>
          </div>

          <div className="space-y-2.5">
            {repeatWarnings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada pengunjung yang melampaui ambang batas 30 hari.
              </div>
            ) : (
              repeatWarnings.slice(0, 3).map((w) => (
                <div
                  key={w.participant_id}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{w.participant.full_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                      {w.visit_count}x Kunjungan
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {w.participant.category === 'siswa' ? 'Siswa' : 'Karyawan'} •{' '}
                    {unitMap.get(w.participant.unit_id) || '-'}
                  </div>
                  {w.internal_notes && (
                    <div className="text-[10px] text-purple-900 italic line-clamp-1 bg-white p-1 rounded border border-purple-200">
                      Catatan: {w.internal_notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GRAFIK PERBANDINGAN AKTIVITAS UKS ANTAR UNIT SEKOLAH & DISTRIBUSI PENANGANAN */}
      <SchoolActivityOutcomeCharts exams={exams} visits={visits} />

      {/* STATISTIK PEMERIKSAAN GULA DARAH, KUNJUNGAN UKS & TINDAK LANJUT (SISWA VS GURU & KARYAWAN) */}
      <ComparativeHealthCharts currentUser={currentUser} exams={exams} visits={visits} />
    </div>
  );
};
