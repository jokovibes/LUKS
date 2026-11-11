/**
 * Dashboard Pimpinan & Manajemen Sekolah - LUKS
 * Provides aggregated health metrics, unit-by-unit comparisons,
 * trend analytics, and executive reports without exposing private confidential notes.
 */

import React from 'react';
import { ShieldCheck, Printer, FileSpreadsheet, Activity, HeartPulse, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { ComparativeHealthCharts } from './ComparativeHealthCharts';
import { SchoolActivityOutcomeCharts } from './SchoolActivityOutcomeCharts';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface PimpinanDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const PimpinanDashboard: React.FC<PimpinanDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const exams = DataService.getGlucoseExaminations(currentUser);
  const visits = DataService.getUksVisits(currentUser);
  const followUps = DataService.getGlucoseFollowUps(currentUser);
  const units = DataService.getUnits();
  const repeatWarnings = DataService.getRepeatVisitWarnings();

  // Personal records corresponding to the logged-in user
  const myExams = exams.filter((e) => e.participant_id === currentUser.id);
  const myVisits = visits.filter((v) => v.participant_id === currentUser.id);

  // Follow-up completion percentage
  const completedFollowUps = followUps.filter((f) => f.follow_up_status === 'selesai').length;
  const followUpRate = followUps.length > 0 ? Math.round((completedFollowUps / followUps.length) * 100) : 100;

  const handleExportManagerial = () => {
    const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));
    ExportService.exportUksVisitsToExcel(visits, new Map(), unitMap, 'manajerial_eksekutif');
  };

  const handleDownloadPdf = () => {
    ExportService.downloadDashboardPdf('pimpinan', currentUser, {
      exams,
      visits,
      followUps,
      units,
      repeatWarnings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle="LAPORAN EKSEKUTIF DASHBOARD PIMPINAN SEKOLAH"
          documentSubtitle="Statistik Agregat Kesehatan, Evaluasi Kunjungan UKS, & Analisis Lintas Unit"
          documentNumber={`LUKS-DIR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        />
      </div>

      {/* Executive Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 text-sky-200 text-xs font-semibold mb-3 border border-blue-600/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dashboard Eksekutif & Statistik Manajerial UKS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Ringkasan Kesehatan Sekolah Lazuardi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Tinjauan agregat kesehatan holistik siswa dan karyawan lintas unit (TK, SD, SMP, SMA). Data disajikan dalam bentuk statistik agregat sesuai prinsip perlindungan data medis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 border border-sky-400/30"
          >
            <Printer className="w-4 h-4" />
            Download PDF Dashboard
          </button>
          <button
            onClick={handleExportManagerial}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab && onNavigateTab('stats_glucose')}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition group ${
            onNavigateTab ? 'cursor-pointer hover:border-emerald-400 hover:shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Total Skrining Glukosa</span>
            <span className="text-emerald-600 text-[10px] group-hover:translate-x-0.5 transition font-semibold">Buka →</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{exams.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            {exams.filter((e) => e.classification === 'normal').length} Normal ({exams.length > 0 ? Math.round((exams.filter((e) => e.classification === 'normal').length / exams.length) * 100) : 0}%)
          </div>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('stats_visits')}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition group ${
            onNavigateTab ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Total Kunjungan UKS</span>
            <span className="text-blue-600 text-[10px] group-hover:translate-x-0.5 transition font-semibold">Buka →</span>
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{visits.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {visits.filter((v) => v.participant?.category === 'siswa').length} Siswa • {visits.filter((v) => v.participant?.category === 'karyawan').length} Karyawan
          </div>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('stats_followups')}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition group ${
            onNavigateTab ? 'cursor-pointer hover:border-purple-400 hover:shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Resolusi Tindak Lanjut</span>
            <span className="text-purple-600 text-[10px] group-hover:translate-x-0.5 transition font-semibold">Buka →</span>
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1 font-mono">{followUpRate}%</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {completedFollowUps} dari {followUps.length} kasus tertangani
          </div>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('trends_analysis')}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs transition group ${
            onNavigateTab ? 'cursor-pointer hover:border-amber-400 hover:shadow-md' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Analisis Tren & Peringatan</span>
            <span className="text-amber-600 text-[10px] group-hover:translate-x-0.5 transition font-semibold">Buka →</span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{repeatWarnings.length} Kasus</div>
          <div className="text-[10px] text-slate-500 mt-1">Klik untuk tren & proyeksi jangka panjang</div>
        </div>
      </div>

      {/* Rekam Medis Pribadi Pimpinan (Akun Login) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rekam Medis Pribadi Saya ({currentUser.full_name})
              </h2>
              <p className="text-[11px] text-slate-500">
                Pemeriksaan kesehatan dan riwayat kunjungan UKS terdaftar untuk akun login Anda.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold self-start sm:self-center">
            ID: {currentUser.employee_or_student_id || currentUser.id}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card Pemeriksaan Gula Darah Saya */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Pemeriksaan Gula Darah Saya
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {myExams.length} Kali Pemeriksaan
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {myExams.length > 0
                  ? `Hasil terakhir: ${myExams[0].result_value} ${myExams[0].result_unit} (${myExams[0].classification.replace('_', ' ')}) pada ${new Date(myExams[0].examination_datetime).toLocaleDateString('id-ID')}`
                  : 'Belum ada catatan pemeriksaan gula darah untuk akun Anda di database Supabase.'}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('my_glucose')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline pt-1 self-start"
            >
              <span>Buka Riwayat Gula Darah Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Kunjungan UKS Saya */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-200/80 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-blue-600" />
                  Kunjungan UKS Saya
                </span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {myVisits.length} Kali Kunjungan
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {myVisits.length > 0
                  ? `Kunjungan terakhir: ${myVisits[0].main_complaint} (${myVisits[0].visit_reason}) pada ${new Date(myVisits[0].visit_datetime).toLocaleDateString('id-ID')}`
                  : 'Belum ada catatan kunjungan ruang UKS untuk akun Anda di database Supabase.'}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('my_visits')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline pt-1 self-start"
            >
              <span>Buka Riwayat Kunjungan UKS Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Managerial Charts */}
      <SchoolActivityOutcomeCharts exams={exams} visits={visits} />

      {/* STATISTIK PEMERIKSAAN GULA DARAH, KUNJUNGAN UKS, & TINDAK LANJUT (SISWA VS GURU & KARYAWAN) */}
      <ComparativeHealthCharts currentUser={currentUser} exams={exams} visits={visits} />
    </div>
  );
};
