/**
 * Statistik Pemeriksaan Gula Darah - Khusus Akun Manajemen/Pimpinan
 * Lazuardi UKS Management System (LUKS)
 * Menyajikan analisis mendalam hasil skrining glukosa, perbandingan Siswa vs Guru/Karyawan,
 * distribusi per unit, kategori pemeriksaan, dan rekomendasi intervensi nutrisi.
 */

import React, { useState } from 'react';
import {
  Activity,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Layers,
  Info,
  Calendar,
  HeartPulse,
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

export const PimpinanGlucoseStats: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  if (!currentUser) return null;

  const allExams = DataService.getGlucoseExaminations(currentUser);
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Filter examinations
  const exams = allExams.filter((e) => {
    if (selectedUnit !== 'all' && e.participant?.unit_id !== selectedUnit) return false;
    return true;
  });

  // Separate Siswa vs Guru/Karyawan
  const studentExams = exams.filter((e) => e.participant?.category === 'siswa');
  const staffExams = exams.filter((e) => e.participant?.category === 'karyawan');

  // Breakdown classifications
  const studentNormal = studentExams.filter((e) => e.classification === 'normal').length;
  const studentAttention = studentExams.filter((e) => e.classification === 'perlu_perhatian').length;
  const studentMonitoring = studentExams.filter((e) => e.classification === 'pemantauan').length;
  const studentFollowUp = studentExams.filter((e) => e.classification === 'tindak_lanjut').length;

  const staffNormal = staffExams.filter((e) => e.classification === 'normal').length;
  const staffAttention = staffExams.filter((e) => e.classification === 'perlu_perhatian').length;
  const staffMonitoring = staffExams.filter((e) => e.classification === 'pemantauan').length;
  const staffFollowUp = staffExams.filter((e) => e.classification === 'tindak_lanjut').length;

  // Average glucose values
  const avgStudentGlucose = studentExams.length > 0
    ? Math.round(studentExams.reduce((sum, e) => sum + e.result_value, 0) / studentExams.length)
    : 0;

  const avgStaffGlucose = staffExams.length > 0
    ? Math.round(staffExams.reduce((sum, e) => sum + e.result_value, 0) / staffExams.length)
    : 0;

  // Breakdown by test type
  const testTypeData = [
    {
      name: 'GDP (Puasa)',
      Siswa: studentExams.filter((e) => e.examination_type === 'puasa').length,
      'Guru & Karyawan': staffExams.filter((e) => e.examination_type === 'puasa').length,
    },
    {
      name: 'GDS (Sewaktu)',
      Siswa: studentExams.filter((e) => e.examination_type === 'sewaktu').length,
      'Guru & Karyawan': staffExams.filter((e) => e.examination_type === 'sewaktu').length,
    },
    {
      name: 'GD2PP (Setelah Makan)',
      Siswa: studentExams.filter((e) => e.examination_type === 'setelah_makan').length,
      'Guru & Karyawan': staffExams.filter((e) => e.examination_type === 'setelah_makan').length,
    },
  ];

  // Comparison Bar Data
  const classificationComparisonData = [
    {
      category: 'Normal',
      Siswa: studentNormal,
      'Guru & Karyawan': staffNormal,
    },
    {
      category: 'Perlu Perhatian',
      Siswa: studentAttention,
      'Guru & Karyawan': staffAttention,
    },
    {
      category: 'Pemantauan',
      Siswa: studentMonitoring,
      'Guru & Karyawan': staffMonitoring,
    },
    {
      category: 'Tindak Lanjut',
      Siswa: studentFollowUp,
      'Guru & Karyawan': staffFollowUp,
    },
  ];

  // Unit breakdown data
  const unitBreakdown = units.map((u) => {
    const uExams = exams.filter((e) => e.participant?.unit_id === u.id);
    const uSiswa = uExams.filter((e) => e.participant?.category === 'siswa');
    const uStaff = uExams.filter((e) => e.participant?.category === 'karyawan');
    const uAtRisk = uExams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut').length;
    const avg = uExams.length > 0 ? Math.round(uExams.reduce((acc, curr) => acc + curr.result_value, 0) / uExams.length) : 0;

    return {
      id: u.id,
      name: u.unit_code,
      fullName: u.unit_name,
      total: uExams.length,
      siswaCount: uSiswa.length,
      staffCount: uStaff.length,
      atRisk: uAtRisk,
      avgGlucose: avg,
      riskPercentage: uExams.length > 0 ? Math.round((uAtRisk / uExams.length) * 100) : 0,
    };
  });

  const handleExport = () => {
    ExportService.exportGlucoseExaminationsToExcel(exams, unitMap, 'statistik_gula_darah_manajemen');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Manajemen Skrining Metabolik • Statistik Glukosa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Statistik Pemeriksaan Gula Darah Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Analisis terpadu hasil pemeriksaan gula darah di seluruh unit Lazuardi. Data dikelompokkan secara terpisah antara Siswa dan Guru/Karyawan guna evaluasi kesehatan preventif dan kebijakan pola konsumsi sekolah.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Data Glukosa (.xlsx)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-700" />
          <span className="font-bold text-slate-700">Filter Analisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Unit:</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="all">Semua Unit Sekolah</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_name} ({u.unit_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards Separating Students & Employees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa Total & Avg */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-blue-900">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Siswa Terperiksa
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {exams.length > 0 ? Math.round((studentExams.length / exams.length) * 100) : 0}% Total
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{studentExams.length}</div>
          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Rata-Rata Glukosa:</span>
            <span className="font-mono font-bold text-blue-900">{avgStudentGlucose} mg/dL</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            {studentNormal} Normal ({studentExams.length > 0 ? Math.round((studentNormal / studentExams.length) * 100) : 0}%)
          </div>
        </div>

        {/* Guru & Karyawan Total & Avg */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-purple-900">
              <Briefcase className="w-4 h-4 text-purple-600" />
              Guru & Karyawan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
              {exams.length > 0 ? Math.round((staffExams.length / exams.length) * 100) : 0}% Total
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{staffExams.length}</div>
          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Rata-Rata Glukosa:</span>
            <span className="font-mono font-bold text-purple-900">{avgStaffGlucose} mg/dL</span>
          </div>
          <div className="text-[10px] text-purple-700 font-semibold">
            {staffNormal} Normal ({staffExams.length > 0 ? Math.round((staffNormal / staffExams.length) * 100) : 0}%)
          </div>
        </div>

        {/* Kasus Perlu Perhatian */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Perlu Perhatian
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
              Amb. Batas
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {studentAttention + staffAttention}
          </div>
          <div className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/50 flex justify-between">
            <span>Siswa: <strong className="text-slate-900">{studentAttention}</strong></span>
            <span>Staf: <strong className="text-slate-900">{staffAttention}</strong></span>
          </div>
          <p className="text-[10px] text-slate-500">Evaluasi pola konsumsi & hidrasi</p>
        </div>

        {/* Kasus Tindak Lanjut Medis */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              Tindak Lanjut Segera
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-extrabold">
              Prioritas
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {studentFollowUp + staffFollowUp}
          </div>
          <div className="text-[11px] text-slate-600 pt-1 border-t border-rose-200/50 flex justify-between">
            <span>Siswa: <strong className="text-slate-900">{studentFollowUp}</strong></span>
            <span>Staf: <strong className="text-slate-900">{staffFollowUp}</strong></span>
          </div>
          <p className="text-[10px] text-rose-700 font-medium">Koordinasi dokter konsultan & keluarga</p>
        </div>
      </div>

      {/* Main Charts: Perbandingan Siswa vs Guru/Karyawan & Jenis Pemeriksaan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Perbandingan Klasifikasi Glukosa (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Perbandingan Klasifikasi: Siswa vs Guru & Karyawan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribusi frekuensi hasil pemeriksaan gula darah berdasarkan kategori partisipan.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1.5 shadow-xl">
                          <div className="font-bold text-sky-300 border-b border-slate-800 pb-1">{label}</div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-300 font-semibold">Siswa:</span>
                            <span className="font-mono font-bold">{payload[0]?.value} orang</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-purple-300 font-semibold">Guru & Karyawan:</span>
                            <span className="font-mono font-bold">{payload[1]?.value} orang</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Metode / Jenis Pemeriksaan (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Jenis Pemeriksaan Dilakukan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                GDP (Puasa), GDS (Sewaktu), dan GD2PP.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={testTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown per Unit Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Tabel Rekapitulasi Glukosa Lintas Unit Sekolah (Lazuardi)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rincian cakupan skrining dan persentase indikasi risiko pada masing-masing unit pendidikan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-3">Unit Sekolah</th>
                <th className="py-3 px-3 text-center">Total Terperiksa</th>
                <th className="py-3 px-3 text-center">Siswa</th>
                <th className="py-3 px-3 text-center">Guru & Staf</th>
                <th className="py-3 px-3 text-center">Rata-Rata Glukosa</th>
                <th className="py-3 px-3 text-center">Kasus Berisiko</th>
                <th className="py-3 px-3 text-center">Rasio Risiko</th>
                <th className="py-3 px-3 text-center">Status Pemantauan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitBreakdown.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    <div>{item.fullName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">Kode: {item.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                    {item.total}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-800 font-semibold font-mono">
                    {item.siswaCount}
                  </td>
                  <td className="py-3 px-3 text-center text-purple-800 font-semibold font-mono">
                    {item.staffCount}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {item.avgGlucose > 0 ? `${item.avgGlucose} mg/dL` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                    {item.atRisk} kasus
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        item.riskPercentage > 20
                          ? 'bg-rose-100 text-rose-800'
                          : item.riskPercentage > 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.riskPercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terkoordinasi
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Management Policy Insight Box */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-emerald-700" />
          Rekomendasi Kebijakan Manajerial Berdasarkan Data Skrining Glukosa:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 pt-1">
          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="font-bold text-emerald-950 block">1. Standarisasi Kantin Sehat</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Membatasi penjualan minuman manis berpemanis buatan dan menyediakan alternatif air mineral higienis gratis di setiap koridor kelas.
            </p>
          </div>
          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="font-bold text-emerald-950 block">2. Program Bugar Staf & Guru</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Memfasilitasi pemeriksaan gula darah berkala tiap triwulan dan sesi peregangan fisik (stretching) sebelum memulai jam belajar mengajar.
            </p>
          </div>
          <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
            <span className="font-bold text-emerald-950 block">3. Edukasi Orang Tua (Parenting)</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Mengirimkan laporan rekapitulasi kesehatan umum dan tips bekal bergizi seimbang kepada wali murid melalui portal sekolah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
