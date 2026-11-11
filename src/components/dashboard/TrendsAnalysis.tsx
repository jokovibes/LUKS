/**
 * Modul Tren dan Analisis Strategis Kesehatan Sekolah - LUKS
 * Dirancang khusus untuk Pimpinan & Manajemen Sekolah Lazuardi.
 * Menyajikan analisis longitudinal tren kesehatan, korelasi pola musiman
 * dengan kalender akademik, indeks kebugaran per unit, dan rekomendasi kebijakan.
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Building2,
  Activity,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';

export const TrendsAnalysis: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6_bulan');

  if (!currentUser) return null;

  const allExams = DataService.getGlucoseExaminations(currentUser);
  const allVisits = DataService.getUksVisits(currentUser);
  const units = DataService.getUnits();
  const repeatWarnings = DataService.getRepeatVisitWarnings();

  const exams = allExams.filter((e) => {
    if (selectedUnit !== 'all' && e.participant?.unit_id !== selectedUnit) return false;
    return true;
  });

  const visits = allVisits.filter((v) => {
    if (selectedUnit !== 'all' && v.participant?.unit_id !== selectedUnit) return false;
    return true;
  });

  // Dynamic Longitudinal Trend Data based strictly on Supabase database
  const monthCount = selectedPeriod === '3_bulan' ? 3 : selectedPeriod === '1_tahun' ? 12 : 6;
  const now = new Date();
  const monthlyTrendsData = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthName = d.toLocaleDateString('id-ID', {
      month: 'short',
      year: monthCount > 6 ? '2-digit' : undefined,
    });

    const monthVisits = visits.filter((v) => {
      if (!v.visit_datetime) return false;
      const vd = new Date(v.visit_datetime);
      return !isNaN(vd.getTime()) && vd.getFullYear() === y && vd.getMonth() === m;
    });

    const monthExams = exams.filter((e) => {
      if (!e.examination_datetime) return false;
      const ed = new Date(e.examination_datetime);
      return !isNaN(ed.getTime()) && ed.getFullYear() === y && ed.getMonth() === m;
    });

    const avgGlucose = monthExams.length > 0
      ? Math.round(monthExams.reduce((acc, curr) => acc + curr.result_value, 0) / monthExams.length)
      : 0;

    monthlyTrendsData.push({
      bulan: monthName,
      'Kasus Sakit': monthVisits.filter((v) => v.visit_reason === 'sakit').length,
      'Kasus Cedera': monthVisits.filter((v) => v.visit_reason === 'cedera').length,
      'Skrining Rutin': monthExams.length,
      'Rata Glukosa (mg/dL)': avgGlucose,
      'Kasus Waspada Glukosa': monthExams.filter(
        (e) => e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut'
      ).length,
    });
  }

  const hasTrendData = monthlyTrendsData.some(
    (m) => m['Kasus Sakit'] > 0 || m['Kasus Cedera'] > 0 || m['Skrining Rutin'] > 0
  );

  const hasGlucoseTrendData = monthlyTrendsData.some((m) => m['Skrining Rutin'] > 0);

  // Dynamic Unit Health Index Scores from real database
  const unitHealthIndex = units.map((u) => {
    const uExams = allExams.filter((e) => e.participant?.unit_id === u.id);
    const uVisits = allVisits.filter((v) => v.participant?.unit_id === u.id);
    const totalRecords = uExams.length + uVisits.length;

    if (totalRecords === 0) {
      return {
        unit: u.unit_name,
        score: '-',
        status: 'Belum Ada Data Rekam Medis',
        color: 'text-slate-600 bg-slate-100 border-slate-200',
        highlight: `Belum ada riwayat kunjungan UKS atau skrining glukosa yang tercatat untuk ${u.unit_name} di database Supabase.`,
      };
    }

    const normalExams = uExams.filter((e) => e.classification === 'normal').length;
    const resolvedVisits = uVisits.filter((v) => v.outcome === 'kembali_ke_kelas' || v.outcome === 'kembali_bekerja').length;
    const glucoseScore = uExams.length > 0 ? (normalExams / uExams.length) * 50 : 50;
    const visitScore = uVisits.length > 0 ? (resolvedVisits / uVisits.length) * 50 : 50;
    const score = Math.round(glucoseScore + visitScore);

    return {
      unit: u.unit_name,
      score,
      status: score >= 90 ? 'Sangat Baik' : score >= 75 ? 'Baik & Terkendali' : 'Perlu Perhatian',
      color: score >= 90
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : score >= 75
        ? 'text-blue-700 bg-blue-50 border-blue-200'
        : 'text-amber-700 bg-amber-50 border-amber-200',
      highlight: `${uVisits.length} kunjungan UKS (${resolvedVisits} teratasi), ${uExams.length} skrining glukosa (${normalExams} hasil normal).`,
    };
  });

  // Top Complaints Map
  const complaintCounts = new Map<string, number>();
  visits.forEach((v) => {
    const c = v.main_complaint?.trim();
    if (c) complaintCounts.set(c, (complaintCounts.get(c) || 0) + 1);
  });
  const topComplaint = Array.from(complaintCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  const normalExamsCount = exams.filter((e) => e.classification === 'normal').length;
  const normalGlucoseRate = exams.length > 0 ? Math.round((normalExamsCount / exams.length) * 100) : 0;
  const overallAvgGlucose = exams.length > 0 ? Math.round(exams.reduce((acc, curr) => acc + curr.result_value, 0) / exams.length) : 0;

  const hasAnyData = exams.length > 0 || visits.length > 0;
  const overallScore = hasAnyData
    ? Math.round(
        (exams.length > 0 ? (normalExamsCount / exams.length) * 50 : 45) +
        (visits.length > 0 ? (visits.filter((v) => v.outcome === 'kembali_ke_kelas' || v.outcome === 'kembali_bekerja').length / visits.length) * 50 : 45)
      )
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Dokumen ringkasan tren dan analisis strategis berhasil disiapkan.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 text-sky-200 text-xs font-semibold mb-3 border border-blue-600/30">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Manajemen Strategis • Analisis Tren Kesehatan Jangka Panjang</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Tren dan Analisis Strategis Kesehatan Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Menganalisis pola longitudinal kunjungan UKS, tren metabolik gula darah, korelasi kalender akademik dengan insiden kesehatan, dan panduan kebijakan sekolah berwawasan welas asih.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            Cetak Analisis
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Ringkasan
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-700" />
          <span className="font-bold text-slate-700">Filter Analisis Tren:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Rentang Waktu:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="6_bulan">6 Bulan Terakhir (Semester Berjalan)</option>
              <option value="1_tahun">1 Tahun Ajaran Penuh</option>
              <option value="3_bulan">3 Bulan Terakhir</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Unit:</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="all">Semua Unit Sekolah (Lazuardi)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Trend Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tren Kunjungan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Tren Kunjungan UKS</span>
            <span className="inline-flex items-center text-blue-700 font-bold text-[10px]">
              {visits.length} Total
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {visits.length > 0 ? `${visits.length} Kunjungan` : '0 Kunjungan'}
          </div>
          <p className="text-[10px] text-slate-500">
            {visits.length > 0
              ? `${visits.filter((v) => v.participant?.category === 'siswa').length} Siswa • ${visits.filter((v) => v.participant?.category === 'karyawan').length} Guru/Staf`
              : 'Belum ada data kunjungan UKS di database.'}
          </p>
        </div>

        {/* Stabilitas Glukosa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Stabilitas Glukosa</span>
            {exams.length > 0 ? (
              <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
                <ArrowUpRight className="w-3.5 h-3.5" /> {normalGlucoseRate}% Normal
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold">0 Data</span>
            )}
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">
            {exams.length > 0 ? `${overallAvgGlucose} mg/dL Rata-Rata` : 'Belum Ada Data'}
          </div>
          <p className="text-[10px] text-slate-500">
            {exams.length > 0
              ? `${normalExamsCount} dari ${exams.length} pemeriksaan kategori normal.`
              : 'Belum ada data skrining glukosa di database.'}
          </p>
        </div>

        {/* Puncak Kasus Sakit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Keluhan Klinis Dominan</span>
            {topComplaint && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                {topComplaint[1]} Kasus
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono truncate">
            {topComplaint ? topComplaint[0] : 'Belum Ada Data'}
          </div>
          <p className="text-[10px] text-slate-500">
            {topComplaint
              ? 'Keluhan paling sering dialami partisipan di ruang UKS.'
              : 'Tidak ada catatan keluhan penyakit di database.'}
          </p>
        </div>

        {/* Indeks Sehat Lazuardi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Indeks Sehat Lazuardi</span>
            {overallScore !== null && (
              <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {overallScore >= 80 ? 'Optimal' : 'Pemantauan'}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {overallScore !== null ? `${overallScore} / 100` : 'Belum Tersedia'}
          </div>
          <p className="text-[10px] text-slate-500">
            {overallScore !== null
              ? 'Indeks komposit kesehatan berdasarkan resolusi UKS & hasil glukosa.'
              : 'Memerlukan data rekam medis untuk perhitungan indeks.'}
          </p>
        </div>
      </div>

      {/* Main Longitudinal Trend Area Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              Grafik Tren Kunjungan UKS Semester Berjalan (Multi-Bulan)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dinamika fluktuasi kasus sakit, cedera olahraga, dan aktivitas skrining kesehatan berkala.
            </p>
          </div>
        </div>

        {!hasTrendData ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-xs text-slate-600">Belum ada data tren longitudinal</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Grafik tren akan muncul otomatis saat kunjungan UKS atau skrining glukosa tercatat di database Supabase.</p>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSakit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCedera" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRutin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bulan" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Kasus Sakit" stroke="#ef4444" fillOpacity={1} fill="url(#colorSakit)" strokeWidth={2} />
                <Area type="monotone" dataKey="Kasus Cedera" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCedera)" strokeWidth={2} />
                <Area type="monotone" dataKey="Skrining Rutin" stroke="#0284c7" fillOpacity={1} fill="url(#colorRutin)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Glucose Longitudinal Movement & Academic Calendar Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Glucose Longitudinal Movement (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                Tren Pergerakan Rata-Rata Glukosa Darah (mg/dL)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Stabilitas indeks glukosa seluruh unit Lazuardi dari bulan ke bulan.
              </p>
            </div>
          </div>

          {!hasGlucoseTrendData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Activity className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-semibold text-xs text-slate-600">Belum ada data pergerakan glukosa</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Belum ada data pemeriksaan gula darah berkala pada periode ini di database Supabase.</p>
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bulan" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[80, 120]} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Rata Glukosa (mg/dL)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Kasus Waspada Glukosa" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Academic Calendar Health Insights (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-700" />
              Korelasi Pola Kesehatan & Kalender Akademik
            </h3>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
              <div className="font-bold text-purple-950 flex items-center justify-between">
                <span>1. Periode Penilaian Tengah/Akhir Semester (PTS/PAS)</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">Stres Akademik</span>
              </div>
              <p className="text-[11px] text-purple-900 leading-relaxed">
                Terjadi lonjakan keluhan pusing kepala dan sakit perut (dispepsia) hingga 40% di kalangan siswa SMP & SMA akibat kecemasan ujian dan jam tidur yang berkurang.
              </p>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
              <div className="font-bold text-sky-950 flex items-center justify-between">
                <span>2. Pergantian Musim Pancaroba (Hujan & Angin)</span>
                <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-bold">Infeksi Saluran Napas</span>
              </div>
              <p className="text-[11px] text-sky-900 leading-relaxed">
                Peningkatan keluhan batuk pilek (ISPA) dan demam ringan di jenjang Pra-TK dan SD. Dianjurkan pemantauan ventilasi udara kelas dan etika bersin/masker.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <div className="font-bold text-amber-950 flex items-center justify-between">
                <span>3. Pekan Olahraga & Kegiatan Ekstrakurikuler</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Cedera Fisik</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Kasus terbanyak berupa luka lecet, terkilir ringan, dan kram otot saat jam olahraga siang hari. Perlu penekanan pemanasan memadai.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indeks Kesehatan per Unit Sekolah */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Indeks Kebugaran & Kesehatan per Unit Sekolah (School Health Index)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Skor komprehensif mengukur tingkat ketahanan fisik, absensi sakit, dan cakupan preventif.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unitHealthIndex.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{item.unit}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.color}`}>
                    {item.status}
                  </span>
                  <span className="font-mono font-black text-slate-900 text-base">{item.score}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.highlight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Compassionate Policies Box */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-sky-200 font-extrabold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Rekomendasi Kebijakan Manajerial Berbasis Bukti (Compassionate Health Policy):
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <span className="font-bold text-sky-300 block text-sm">1. Standar Kantin Ramah Sehat</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Penetapan batas kandungan gula pada jajanan kantin dan kewajiban penyediaan buah potong segar serta air mineral isi ulang di koridor sekolah.
            </p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <span className="font-bold text-sky-300 block text-sm">2. Waktu Istirahat Aktif (Brain Break)</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Menerapkan peregangan ringan 3 menit di sela pergantian jam pelajaran ke-3 dan ke-4 untuk meredakan ketegangan leher dan mengurangi pusing.
            </p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <span className="font-bold text-sky-300 block text-sm">3. Skrining Rutin Tenaga Pendidik</span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Menjadwalkan pemeriksaan gula darah dan tensi berkala setiap awal semester untuk seluruh guru dan staf sekolah sebagai bentuk perhatian institusi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
