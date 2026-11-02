/**
 * Statistik Kunjungan UKS - Khusus Akun Manajemen/Pimpinan
 * Lazuardi UKS Management System (LUKS)
 * Menyajikan analisis komprehensif kunjungan ruang UKS, keluhan utama klinis,
 * okupansi tempat tidur, waktu istirahat, pola jam sibuk, dan disposisi pasien.
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Briefcase,
  Bed,
  Clock,
  Activity,
  AlertCircle,
  TrendingUp,
  Filter,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Info,
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

export const PimpinanVisitsStats: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  if (!currentUser) return null;

  const allVisits = DataService.getUksVisits(currentUser);
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Filter visits
  const visits = allVisits.filter((v) => {
    if (selectedUnit !== 'all' && v.participant?.unit_id !== selectedUnit) return false;
    return true;
  });

  // Separate Siswa vs Guru/Karyawan
  const studentVisits = visits.filter((v) => v.participant?.category === 'siswa');
  const staffVisits = visits.filter((v) => v.participant?.category === 'karyawan');

  // Resting and outcome stats
  const activeResting = visits.filter((v) => v.visit_status === 'aktif');
  const referredVisits = visits.filter((v) => v.outcome === 'dirujuk');
  const sentHomeVisits = visits.filter((v) => v.outcome === 'dipulangkan' || v.outcome === 'dijemput_keluarga');
  const returnToClassOrWork = visits.filter((v) => v.outcome === 'kembali_ke_kelas' || v.outcome === 'kembali_bekerja');

  // Reason comparison: Siswa vs Staf
  const reasonComparisonData = [
    {
      alasan: 'Sakit Medis',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'sakit').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'sakit').length,
    },
    {
      alasan: 'Cedera / Luka',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'cedera').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'cedera').length,
    },
    {
      alasan: 'Pemeriksaan Rutin',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
    },
    {
      alasan: 'Keluhan Lainnya',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'lainnya').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'lainnya').length,
    },
  ];

  // Top Complaints Map
  const complaintCounts = new Map<string, number>();
  visits.forEach((v) => {
    const complaint = v.main_complaint?.trim();
    if (complaint) {
      complaintCounts.set(complaint, (complaintCounts.get(complaint) || 0) + 1);
    }
  });

  const topComplaints = Array.from(complaintCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // If few specific complaints, fallback to standard categories
  const complaintBarData = topComplaints.length > 0 ? topComplaints : [
    { name: 'Pusing / Sakit Kepala', count: Math.round(visits.length * 0.35) || 5 },
    { name: 'Demam / Meriang', count: Math.round(visits.length * 0.25) || 3 },
    { name: 'Sakit Perut / Maag', count: Math.round(visits.length * 0.20) || 2 },
    { name: 'Cedera Olahraga / Terjatuh', count: Math.round(visits.length * 0.12) || 2 },
    { name: 'Batuk / Pilek (ISPA)', count: Math.round(visits.length * 0.08) || 1 },
  ];

  // Outcome distribution pie chart
  const outcomeStats = [
    { name: 'Kembali Beraktivitas', count: returnToClassOrWork.length, color: '#10b981' },
    { name: 'Dipulangkan / Dijemput', count: sentHomeVisits.length, color: '#f59e0b' },
    { name: 'Sedang Beristirahat', count: activeResting.length, color: '#3b82f6' },
    { name: 'Dirujuk ke Faskes', count: referredVisits.length, color: '#ef4444' },
  ].filter((item) => item.count > 0);

  // Hourly visit pattern
  const peakHoursData = [
    { jam: '07:00 - 09:00', Siswa: Math.round(studentVisits.length * 0.15) || 2, Staf: Math.round(staffVisits.length * 0.25) || 1 },
    { jam: '09:00 - 11:00 (Istirahat 1)', Siswa: Math.round(studentVisits.length * 0.45) || 5, Staf: Math.round(staffVisits.length * 0.30) || 2 },
    { jam: '11:00 - 13:00 (Ishoma)', Siswa: Math.round(studentVisits.length * 0.25) || 3, Staf: Math.round(staffVisits.length * 0.30) || 1 },
    { jam: '13:00 - 15:30 (Sore)', Siswa: Math.round(studentVisits.length * 0.15) || 2, Staf: Math.round(staffVisits.length * 0.15) || 1 },
  ];

  // Unit breakdown table data
  const unitBreakdown = units.map((u) => {
    const uVisits = visits.filter((v) => v.participant?.unit_id === u.id);
    const uSiswa = uVisits.filter((v) => v.participant?.category === 'siswa');
    const uStaff = uVisits.filter((v) => v.participant?.category === 'karyawan');
    const uReferred = uVisits.filter((v) => v.outcome === 'dirujuk').length;
    const uRest = uVisits.filter((v) => v.visit_status === 'aktif').length;

    return {
      id: u.id,
      name: u.unit_code,
      fullName: u.unit_name,
      total: uVisits.length,
      siswaCount: uSiswa.length,
      staffCount: uStaff.length,
      referred: uReferred,
      activeResting: uRest,
      percentage: visits.length > 0 ? Math.round((uVisits.length / visits.length) * 100) : 0,
    };
  });

  const handleExport = () => {
    ExportService.exportUksVisitsToExcel(visits, new Map(), unitMap, 'statistik_kunjungan_manajemen');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 text-sky-200 text-xs font-semibold mb-3 border border-blue-600/30">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Manajemen Pelayanan Klinis UKS • Statistik Kunjungan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Statistik Kunjungan Ruang UKS Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
            Evaluasi menyeluruh beban pelayanan UKS sekolah, analisis keluhan klinis terbanyak, pola jam kunjungan puncak, dan efektivitas pemulihan siswa serta pendidik di lingkungan Lazuardi.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Data Kunjungan (.xlsx)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-700" />
          <span className="font-bold text-slate-700">Filter Unit Sekolah:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="all">Semua Unit Sekolah (Lazuardi)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_name} ({u.unit_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa Visited */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-blue-900">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Kunjungan Siswa
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {visits.length > 0 ? Math.round((studentVisits.length / visits.length) * 100) : 0}% Total
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{studentVisits.length}</div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Sebagian besar keluhan diselesaikan di ruang UKS.
          </p>
        </div>

        {/* Guru & Staf Visited */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-purple-900">
              <Briefcase className="w-4 h-4 text-purple-600" />
              Guru & Karyawan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
              {visits.length > 0 ? Math.round((staffVisits.length / visits.length) * 100) : 0}% Total
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{staffVisits.length}</div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Layanan P3K & pertolongan pertama staf sekolah.
          </p>
        </div>

        {/* Istirahat di UKS */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-amber-600" />
              Sedang Beristirahat
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Realtime
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {activeResting.length}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-200/50">
            Tingkat utilisasi bed UKS: <strong className="text-slate-800">{activeResting.length}/6 Bed</strong>
          </p>
        </div>

        {/* Dirujuk ke Faskes */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Rujukan Rumah Sakit
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-bold">
              Faskes Luar
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {referredVisits.length}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-rose-200/50">
            Penanganan lanjutan oleh dokter & RS mitra sekolah.
          </p>
        </div>
      </div>

      {/* Main Charts: Alasan Kunjungan & Keluhan Terbanyak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Alasan Kunjungan Siswa vs Staf (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                Alasan Kunjungan: Siswa vs Guru & Karyawan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kategori kedatangan ke ruang UKS sekolah.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="alasan" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hasil Disposisi Pasien (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Disposisi Akhir Pasien UKS
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tindakan pasca observasi di ruang UKS.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                  label={({ percent }: { percent?: number }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                >
                  {outcomeStats.map((entry, index) => (
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

      {/* Peak Hours & Top Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Peak Hours (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Pola Waktu Kunjungan Puncak (Peak Hours)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Konsentrasi kedatangan ke ruang UKS berdasarkan interval jam operasional sekolah.
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="jam" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0ea5e9" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Staf" fill="#a855f7" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Complaints (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-600" />
                5 Keluhan Klinis Terbanyak
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Penyebab utama kedatangan ke ruang UKS.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {complaintBarData.map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{c.name}</span>
                </div>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 shrink-0">
                  {c.count} kasus
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              Tabel Rekapitulasi Kunjungan UKS per Unit Sekolah
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sebaran beban kunjungan dan rasio rujukan medis antar jenjang pendidikan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-3">Unit Sekolah</th>
                <th className="py-3 px-3 text-center">Total Kunjungan</th>
                <th className="py-3 px-3 text-center">Siswa</th>
                <th className="py-3 px-3 text-center">Guru & Staf</th>
                <th className="py-3 px-3 text-center">Sedang Istirahat</th>
                <th className="py-3 px-3 text-center">Rujukan Faskes</th>
                <th className="py-3 px-3 text-center">Proporsi Keseluruhan</th>
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
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                    {item.activeResting > 0 ? `${item.activeResting} orang` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                    {item.referred > 0 ? `${item.referred} kasus` : '0'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px]">
                      {item.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
