/**
 * Komponen Grafik Statistik Perbandingan: Guru & Karyawan vs Siswa
 * Menampilkan 3 grafik terpisah dengan komparasi:
 * 1. Statistik Pemeriksaan Gula Darah
 * 2. Statistik Kunjungan UKS
 * 3. Statistik Tindak Lanjut
 */

import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  ClipboardList,
  GraduationCap,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
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
} from 'recharts';
import { UserProfile, GlucoseExamination, UksVisit } from '../../types/database';
import { DataService } from '../../services/dataService';

interface ComparativeHealthChartsProps {
  currentUser: UserProfile;
  exams?: GlucoseExamination[];
  visits?: UksVisit[];
}

export const ComparativeHealthCharts: React.FC<ComparativeHealthChartsProps> = ({
  currentUser,
  exams: propExams,
  visits: propVisits,
}) => {
  const exams = propExams || DataService.getGlucoseExaminations(currentUser);
  const visits = propVisits || DataService.getUksVisits(currentUser);
  const allFollowUps = DataService.getAllFollowUps(currentUser);

  // Filter datasets for Siswa vs Guru & Karyawan
  const studentExams = exams.filter((e) => e.participant?.category === 'siswa');
  const staffExams = exams.filter((e) => e.participant?.category === 'karyawan');

  const studentVisits = visits.filter((v) => v.participant?.category === 'siswa');
  const staffVisits = visits.filter((v) => v.participant?.category === 'karyawan');

  const studentFollowUps = allFollowUps.filter((f) => f.participant?.category === 'siswa');
  const staffFollowUps = allFollowUps.filter((f) => f.participant?.category === 'karyawan');

  // 1. Data Grafik Pemeriksaan Gula Darah (Siswa vs Guru & Karyawan)
  const glucoseData = [
    {
      kategori: 'Normal',
      Siswa: studentExams.filter((e) => e.classification === 'normal').length,
      'Guru & Karyawan': staffExams.filter((e) => e.classification === 'normal').length,
    },
    {
      kategori: 'Perlu Perhatian',
      Siswa: studentExams.filter((e) => e.classification === 'perlu_perhatian').length,
      'Guru & Karyawan': staffExams.filter((e) => e.classification === 'perlu_perhatian').length,
    },
    {
      kategori: 'Pemantauan',
      Siswa: studentExams.filter((e) => e.classification === 'pemantauan').length,
      'Guru & Karyawan': staffExams.filter((e) => e.classification === 'pemantauan').length,
    },
    {
      kategori: 'Tindak Lanjut',
      Siswa: studentExams.filter((e) => e.classification === 'tindak_lanjut').length,
      'Guru & Karyawan': staffExams.filter((e) => e.classification === 'tindak_lanjut').length,
    },
  ];

  // 2. Data Grafik Kunjungan UKS (Siswa vs Guru & Karyawan)
  const visitData = [
    {
      alasan: 'Sakit',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'sakit').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'sakit').length,
    },
    {
      alasan: 'Cedera / Insiden',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'cedera').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'cedera').length,
    },
    {
      alasan: 'Cek Rutin',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
    },
    {
      alasan: 'Lainnya',
      Siswa: studentVisits.filter((v) => v.visit_reason === 'lainnya').length,
      'Guru & Karyawan': staffVisits.filter((v) => v.visit_reason === 'lainnya').length,
    },
  ];

  // 3. Data Grafik Tindak Lanjut (Siswa vs Guru & Karyawan)
  const followUpData = [
    {
      status: 'Belum Dilakukan',
      Siswa: studentFollowUps.filter((f) => f.follow_up_status === 'belum_dilakukan').length,
      'Guru & Karyawan': staffFollowUps.filter((f) => f.follow_up_status === 'belum_dilakukan').length,
    },
    {
      status: 'Sedang Dipantau',
      Siswa: studentFollowUps.filter((f) => f.follow_up_status === 'sedang_dipantau').length,
      'Guru & Karyawan': staffFollowUps.filter((f) => f.follow_up_status === 'sedang_dipantau').length,
    },
    {
      status: 'Selesai',
      Siswa: studentFollowUps.filter((f) => f.follow_up_status === 'selesai').length,
      'Guru & Karyawan': staffFollowUps.filter((f) => f.follow_up_status === 'selesai').length,
    },
    {
      status: 'Dirujuk ke RS/Faskes',
      Siswa: studentFollowUps.filter((f) => f.follow_up_status === 'dirujuk').length,
      'Guru & Karyawan': staffFollowUps.filter((f) => f.follow_up_status === 'dirujuk').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Category Legend */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            Statistik Komparatif: Siswa vs Guru & Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan komprehensif data pemeriksaan gula darah, kunjungan UKS, dan progres tindak lanjut.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 self-start md:self-center">
          <div className="flex items-center gap-1.5 font-bold text-sky-800">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-2xs"></span>
            <span>Siswa ({studentExams.length} Glukosa / {studentVisits.length} Kunjungan)</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-bold text-purple-800">
            <span className="w-3 h-3 rounded-full bg-purple-600 inline-block shadow-2xs"></span>
            <span>Guru & Karyawan ({staffExams.length} Glukosa / {staffVisits.length} Kunjungan)</span>
          </div>
        </div>
      </div>

      {/* 3 Main Comparison Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Statistik Pemeriksaan Gula Darah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Statistik Pemeriksaan Gula Darah
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {exams.length} Total
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>Siswa: <strong>{studentExams.length}</strong></span>
              <span>Guru & Karyawan: <strong>{staffExams.length}</strong></span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={glucoseData} margin={{ top: 15, right: 10, left: -25, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="kategori"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                          <div className="font-bold text-sky-300">{label}</div>
                          <div className="text-sky-200">
                            Siswa: <span className="font-bold font-mono text-white">{payload[0].value}</span> orang
                          </div>
                          <div className="text-purple-300">
                            Guru & Karyawan: <span className="font-bold font-mono text-white">{payload[1].value}</span> orang
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500 border border-slate-200 leading-tight">
            Klasifikasi terpisah berdasarkan pedoman medis resmi sekolah (Normal, Perlu Perhatian, Pemantauan, Tindak Lanjut).
          </div>
        </div>

        {/* CHART 2: Statistik Kunjungan UKS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Statistik Kunjungan UKS
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {visits.length} Total
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>Siswa: <strong>{studentVisits.length}</strong></span>
              <span>Guru & Karyawan: <strong>{staffVisits.length}</strong></span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitData} margin={{ top: 15, right: 10, left: -25, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="alasan"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                          <div className="font-bold text-sky-300">{label}</div>
                          <div className="text-sky-200">
                            Siswa: <span className="font-bold font-mono text-white">{payload[0].value}</span> kunjungan
                          </div>
                          <div className="text-purple-300">
                            Guru & Karyawan: <span className="font-bold font-mono text-white">{payload[1].value}</span> kunjungan
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500 border border-slate-200 leading-tight">
            Perbandingan kedatangan berdasarkan kategori penyebab kunjungan (Sakit, Cedera saat olahraga/aktivitas, Cek Rutin).
          </div>
        </div>

        {/* CHART 3: Statistik Tindak Lanjut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                Statistik Tindak Lanjut
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {allFollowUps.length} Total
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>Siswa: <strong>{studentFollowUps.length}</strong></span>
              <span>Guru & Karyawan: <strong>{staffFollowUps.length}</strong></span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={followUpData} margin={{ top: 15, right: 10, left: -25, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="status"
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                          <div className="font-bold text-sky-300">{label}</div>
                          <div className="text-sky-200">
                            Siswa: <span className="font-bold font-mono text-white">{payload[0].value}</span> kasus
                          </div>
                          <div className="text-purple-300">
                            Guru & Karyawan: <span className="font-bold font-mono text-white">{payload[1].value}</span> kasus
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Siswa" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Guru & Karyawan" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500 border border-slate-200 leading-tight">
            Status penyelesaian tindak lanjut dan rujukan faskes untuk siswa maupun tenaga pendidik & kependidikan.
          </div>
        </div>
      </div>
    </div>
  );
};
