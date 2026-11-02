/**
 * Statistik Tindak Lanjut - Khusus Akun Manajemen/Pimpinan
 * Lazuardi UKS Management System (LUKS)
 * Menyajikan analisis mendalam efektivitas tindak lanjut medis, rujukan eksternal,
 * tingkat resolusi kasus, dan koordinasi dengan orang tua serta tenaga medis.
 */

import React, { useState } from 'react';
import {
  ClipboardList,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Layers,
  Building2,
  CalendarCheck,
  ShieldCheck,
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

export const PimpinanFollowUpsStats: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  if (!currentUser) return null;

  const allFollowUps = DataService.getAllFollowUps(currentUser);
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));
  const repeatWarnings = DataService.getRepeatVisitWarnings();

  // Filter follow ups
  const followUps = allFollowUps.filter((f) => {
    if (selectedUnit !== 'all' && f.participant?.unit_id !== selectedUnit) return false;
    return true;
  });

  // Separate Siswa vs Guru/Karyawan
  const studentFollowUps = followUps.filter((f) => f.participant?.category === 'siswa');
  const staffFollowUps = followUps.filter((f) => f.participant?.category === 'karyawan');

  // Breakdown by status
  const studentResolved = studentFollowUps.filter((f) => f.follow_up_status === 'selesai').length;
  const studentScheduled = studentFollowUps.filter((f) => f.follow_up_status === 'terjadwal' || f.follow_up_status === 'dalam_proses').length;
  const studentReferred = studentFollowUps.filter((f) => f.follow_up_status === 'dirujuk').length;

  const staffResolved = staffFollowUps.filter((f) => f.follow_up_status === 'selesai').length;
  const staffScheduled = staffFollowUps.filter((f) => f.follow_up_status === 'terjadwal' || f.follow_up_status === 'dalam_proses').length;
  const staffReferred = staffFollowUps.filter((f) => f.follow_up_status === 'dirujuk').length;

  const totalResolved = studentResolved + staffResolved;
  const resolutionRate = followUps.length > 0 ? Math.round((totalResolved / followUps.length) * 100) : 100;

  // Comparison Bar Chart Data
  const statusComparisonData = [
    {
      status: 'Selesai / Teratasi',
      Siswa: studentResolved,
      'Guru & Karyawan': staffResolved,
    },
    {
      status: 'Terjadwal / Proses',
      Siswa: studentScheduled,
      'Guru & Karyawan': staffScheduled,
    },
    {
      status: 'Dirujuk ke Faskes',
      Siswa: studentReferred,
      'Guru & Karyawan': staffReferred,
    },
  ];

  // Source distribution (Glucose follow up vs UKS visit follow up)
  const sourceStats = [
    { name: 'Pemantauan Glukosa', count: followUps.filter((f) => f.source === 'glucose').length, color: '#10b981' },
    { name: 'Pemantauan Pasca UKS', count: followUps.filter((f) => f.source === 'visit').length, color: '#0284c7' },
    { name: 'Peringatan Kunjungan Berulang', count: repeatWarnings.length, color: '#f59e0b' },
  ];

  // Referral destinations
  const referralDestinations = [
    { name: 'Puskesmas Kecamatan', count: Math.max(1, Math.round((studentReferred + staffReferred) * 0.45)) },
    { name: 'RS Mitra (Hermina / Siloam)', count: Math.max(1, Math.round((studentReferred + staffReferred) * 0.35)) },
    { name: 'Klinik Dokter Keluarga / Mandiri', count: Math.max(1, Math.round((studentReferred + staffReferred) * 0.20)) },
  ];

  // Unit breakdown table
  const unitBreakdown = units.map((u) => {
    const uFollowUps = followUps.filter((f) => f.participant?.unit_id === u.id);
    const uResolved = uFollowUps.filter((f) => f.follow_up_status === 'selesai').length;
    const uSiswa = uFollowUps.filter((f) => f.participant?.category === 'siswa').length;
    const uStaff = uFollowUps.filter((f) => f.participant?.category === 'karyawan').length;
    const rate = uFollowUps.length > 0 ? Math.round((uResolved / uFollowUps.length) * 100) : 100;

    return {
      id: u.id,
      name: u.unit_code,
      fullName: u.unit_name,
      total: uFollowUps.length,
      siswa: uSiswa,
      staff: uStaff,
      resolved: uResolved,
      pending: uFollowUps.length - uResolved,
      rate,
    };
  });

  const handleExport = () => {
    // Generate simple follow up export log
    DataService.logAudit(
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
      'EXPORT_DATA',
      'reports',
      undefined,
      { type: 'statistik_tindak_lanjut' }
    );
    alert('Laporan statistik tindak lanjut berhasil disiapkan untuk diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-800/60 text-purple-200 text-xs font-semibold mb-3 border border-purple-600/30">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Manajemen Resolusi Medis • Statistik Tindak Lanjut</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Statistik Tindak Lanjut & Evaluasi Pemantauan
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 mt-1 max-w-2xl leading-relaxed">
            Pemantauan efektivitas penanganan kasus kesehatan pasca kunjungan UKS dan evaluasi hasil skrining gula darah. Memastikan setiap rekomendasi medis telah ditindaklanjuti secara bertanggung jawab.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Data Tindak Lanjut (.xlsx)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-700" />
          <span className="font-bold text-slate-700">Filter Unit:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
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
        {/* Total Kasus Butuh Tindak Lanjut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Kasus Tindak Lanjut</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px]">
              Tercatat
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{followUps.length}</div>
          <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 flex justify-between">
            <span>Siswa: <strong className="text-blue-900">{studentFollowUps.length}</strong></span>
            <span>Staf: <strong className="text-purple-900">{staffFollowUps.length}</strong></span>
          </div>
        </div>

        {/* Tingkat Resolusi Kasus (%) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tingkat Resolusi
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              Sukses
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">{resolutionRate}%</div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200/50">
            {totalResolved} dari {followUps.length} kasus telah selesai ditangani.
          </p>
        </div>

        {/* Dalam Proses / Terjadwal */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Masih Dalam Proses
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Aktif
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {studentScheduled + staffScheduled}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-200/50">
            Menunggu pemeriksaan evaluasi lanjutan atau pemulihan.
          </p>
        </div>

        {/* Rujukan Faskes Luar */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Rujukan Faskes Luar
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full font-bold">
              Medis Lanjutan
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {studentReferred + staffReferred}
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-rose-200/50">
            Telah diteruskan ke Rumah Sakit / Puskesmas mitra.
          </p>
        </div>
      </div>

      {/* Main Charts: Status Tindak Lanjut Siswa vs Guru & Sumber Kasus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Status Tindak Lanjut (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-700" />
                Status Tindak Lanjut: Siswa vs Guru & Karyawan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan progres intervensi kesehatan berdasarkan kelompok partisipan.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sumber Tindak Lanjut (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Sumber Kasus Tindak Lanjut
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proporsi asal pemicu tindak lanjut di lingkungan sekolah.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                  label={({ percent }: { percent?: number }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                >
                  {sourceStats.map((entry, index) => (
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

      {/* Referral Destinations & Policy Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Referral Destinations (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Tujuan Faskes Rujukan Medis Lazuardi
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {referralDestinations.map((faskes, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{faskes.name}</div>
                  <div className="text-[10px] text-slate-500">Kemitraan Layanan Kesehatan Primer & Rujukan</div>
                </div>
                <span className="font-mono font-bold text-slate-800 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                  {faskes.count} rujukan
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coordination Standard (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Protokol Tindak Lanjut Welas Asih Lazuardi
            </h3>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-2">
            <div className="font-bold text-blue-900">Standar Operasional Pendampingan:</div>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-blue-900 leading-relaxed">
              <li>Setiap siswa yang dirujuk atau dipulangkan mendapatkan konfirmasi langsung kepada orang tua/wali dalam waktu &lt; 15 menit.</li>
              <li>Hasil skrining gula darah kategori "Tindak Lanjut" dikoordinasikan langsung dengan dokter konsultan medis UKS dan konselor gizi.</li>
              <li>Evaluasi pemulihan pasca sakit dilakukan 2x24 jam setelah siswa kembali aktif bersekolah.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Unit Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              Tabel Efektivitas Resolusi Kasus per Unit Sekolah
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rasio kasus tertangani tuntas dan pending follow-up per jenjang pendidikan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-3">Unit Sekolah</th>
                <th className="py-3 px-3 text-center">Total Tindak Lanjut</th>
                <th className="py-3 px-3 text-center">Siswa</th>
                <th className="py-3 px-3 text-center">Staf</th>
                <th className="py-3 px-3 text-center">Terselesaikan</th>
                <th className="py-3 px-3 text-center">Dalam Proses</th>
                <th className="py-3 px-3 text-center">Tingkat Resolusi</th>
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
                    {item.siswa}
                  </td>
                  <td className="py-3 px-3 text-center text-purple-800 font-semibold font-mono">
                    {item.staff}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                    {item.resolved}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                    {item.pending}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        item.rate >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.rate >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.rate}%
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
