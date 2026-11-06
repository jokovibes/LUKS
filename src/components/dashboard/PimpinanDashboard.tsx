/**
 * Dashboard Pimpinan & Manajemen Sekolah - LUKS
 * Provides aggregated health metrics, unit-by-unit comparisons,
 * trend analytics, and executive reports without exposing private confidential notes.
 */

import React from 'react';
import { ShieldCheck, Printer, FileSpreadsheet } from 'lucide-react';
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

      {/* Recharts Managerial Charts */}
      <SchoolActivityOutcomeCharts exams={exams} visits={visits} />

      {/* STATISTIK PEMERIKSAAN GULA DARAH, KUNJUNGAN UKS, & TINDAK LANJUT (SISWA VS GURU & KARYAWAN) */}
      <ComparativeHealthCharts currentUser={currentUser} exams={exams} visits={visits} />
    </div>
  );
};
