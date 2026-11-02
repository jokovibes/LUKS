/**
 * Dashboard Pimpinan & Manajemen Sekolah - LUKS
 * Provides aggregated health metrics, unit-by-unit comparisons,
 * trend analytics, and executive reports without exposing private confidential notes.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Layers,
  Activity,
  HeartPulse,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { ComparativeHealthCharts } from './ComparativeHealthCharts';
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

  // Aggregate metrics per School Unit
  const unitStats = units.map((u) => {
    const unitExams = exams.filter((e) => e.participant?.unit_id === u.id);
    const unitVisits = visits.filter((v) => v.participant?.unit_id === u.id);
    return {
      name: u.unit_code,
      unitFullName: u.unit_name,
      totalExams: unitExams.length,
      totalVisits: unitVisits.length,
      attentionGlucose: unitExams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut').length,
    };
  });

  // Follow-up completion percentage
  const completedFollowUps = followUps.filter((f) => f.follow_up_status === 'selesai').length;
  const followUpRate = followUps.length > 0 ? Math.round((completedFollowUps / followUps.length) * 100) : 100;

  // Outcome distribution for management
  const outcomesMap = new Map<string, number>();
  visits.forEach((v) => {
    const key = v.outcome || 'dalam_observasi';
    outcomesMap.set(key, (outcomesMap.get(key) || 0) + 1);
  });

  const outcomeColors: Record<string, string> = {
    kembali_ke_kelas: '#10b981',
    kembali_bekerja: '#059669',
    beristirahat_di_uks: '#3b82f6',
    dijemput_keluarga: '#8b5cf6',
    dipulangkan: '#f59e0b',
    dirujuk: '#ef4444',
    dalam_observasi: '#64748b',
  };

  const outcomePieData = Array.from(outcomesMap.entries()).map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    value: val,
    color: outcomeColors[key] || '#94a3b8',
  }));

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unit Breakdown Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Perbandingan Aktivitas UKS Antar Unit Sekolah
            </h3>
            <span className="text-[10px] text-slate-400">Agregat Lazuardi</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                          <div className="font-bold text-sky-300">{d.unitFullName}</div>
                          <div>Kunjungan UKS: {d.totalVisits}</div>
                          <div>Pemeriksaan Gula Darah: {d.totalExams}</div>
                          <div>Perlu Pemantauan: {d.attentionGlucose}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalVisits" name="Kunjungan UKS" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalExams" name="Pemeriksaan Glukosa" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-700" />
              Distribusi Hasil Penanganan Kunjungan
            </h3>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                >
                  {outcomePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* STATISTIK PEMERIKSAAN GULA DARAH, KUNJUNGAN UKS, & TINDAK LANJUT (SISWA VS GURU & KARYAWAN) */}
      <ComparativeHealthCharts currentUser={currentUser} exams={exams} visits={visits} />
    </div>
  );
};
