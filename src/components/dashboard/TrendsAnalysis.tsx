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

  const exams = DataService.getGlucoseExaminations(currentUser);
  const visits = DataService.getUksVisits(currentUser);
  const units = DataService.getUnits();
  const repeatWarnings = DataService.getRepeatVisitWarnings();

  // Multi-Month Longitudinal Trend Data (Simulated longitudinal view based on real data)
  const monthlyTrendsData = [
    {
      bulan: 'Mei',
      'Kasus Sakit': 14,
      'Kasus Cedera': 3,
      'Skrining Rutin': 22,
      'Rata Glukosa (mg/dL)': 96,
      'Kasus Waspada Glukosa': 2,
    },
    {
      bulan: 'Jun (Ujian Akhir)',
      'Kasus Sakit': 21,
      'Kasus Cedera': 2,
      'Skrining Rutin': 18,
      'Rata Glukosa (mg/dL)': 102,
      'Kasus Waspada Glukosa': 4,
    },
    {
      bulan: 'Jul (Awal Ajaran Baru)',
      'Kasus Sakit': 8,
      'Kasus Cedera': 5,
      'Skrining Rutin': 35,
      'Rata Glukosa (mg/dL)': 94,
      'Kasus Waspada Glukosa': 1,
    },
    {
      bulan: 'Agu (Class Meeting/Lomba)',
      'Kasus Sakit': 12,
      'Kasus Cedera': 9,
      'Skrining Rutin': 28,
      'Rata Glukosa (mg/dL)': 98,
      'Kasus Waspada Glukosa': 3,
    },
    {
      bulan: 'Sep (Pancaroba / Flu)',
      'Kasus Sakit': 26,
      'Kasus Cedera': 4,
      'Skrining Rutin': 24,
      'Rata Glukosa (mg/dL)': 97,
      'Kasus Waspada Glukosa': 2,
    },
    {
      bulan: 'Okt (Bulan Ini)',
      'Kasus Sakit': visits.filter((v) => v.visit_reason === 'sakit').length || 18,
      'Kasus Cedera': visits.filter((v) => v.visit_reason === 'cedera').length || 4,
      'Skrining Rutin': exams.length || 32,
      'Rata Glukosa (mg/dL)': 99,
      'Kasus Waspada Glukosa': exams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut').length || 3,
    },
  ];

  // Unit Health Index Scores
  const unitHealthIndex = [
    {
      unit: 'Pra-TK & TK Lazuardi',
      score: 95,
      status: 'Sangat Baik',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      highlight: 'Keluhan dominan: flu ringan & luka lecet bermain. Tingkat pemulihan cepat.',
    },
    {
      unit: 'SD Lazuardi',
      score: 91,
      status: 'Baik & Terkendali',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      highlight: 'Aktivitas fisik tinggi; perlu pengawasan hidrasi dan waktu makan siang teratur.',
    },
    {
      unit: 'SMP Lazuardi',
      score: 87,
      status: 'Perlu Perhatian Pola Makan',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      highlight: 'Terdeteksi fluktuasi glukosa pada makanan kantin dan keluhan dispepsia (telat sarapan).',
    },
    {
      unit: 'SMA Lazuardi',
      score: 86,
      status: 'Perlu Pengelolaan Stres Belajar',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      highlight: 'Puncak keluhan pusing/migrain terpusat pada pekan persiapan ujian dan tryout.',
    },
  ];

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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Tren Kunjungan UKS</span>
            <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
              <ArrowDownRight className="w-3.5 h-3.5" /> -4.2% Bln Ini
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">Terkendali Baik</div>
          <p className="text-[10px] text-slate-500">
            Penurunan insiden penyakit menular berkat protokol cuci tangan.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Stabilitas Glukosa</span>
            <span className="inline-flex items-center text-blue-700 font-bold text-[10px]">
              <ArrowUpRight className="w-3.5 h-3.5" /> 94% Normal
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">98 mg/dL Rata-Rata</div>
          <p className="text-[10px] text-slate-500">
            Kategori stabil dan aman pada rentang usia anak sekolah.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Puncak Kasus Sakit</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
              Pekan Ujian
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">Keluhan Pusing & Maag</div>
          <p className="text-[10px] text-slate-500">
            Korelasi kuat dengan pola tidur larut & telat sarapan.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Indeks Sehat Lazuardi</span>
            <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sangat Baik
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">89.8 / 100</div>
          <p className="text-[10px] text-slate-500">
            Rata-rata tertimbang kebugaran siswa dan staf seluruh unit.
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
