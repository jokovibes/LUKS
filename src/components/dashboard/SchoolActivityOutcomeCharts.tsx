/**
 * Komponen Grafik Aktivitas UKS Antar Unit Sekolah & Distribusi Penanganan
 * Digunakan secara konsisten pada Dashboard Administrator, Petugas UKS, dan Pimpinan.
 */

import React, { useState } from 'react';
import { Layers, Activity, Info, GraduationCap, Briefcase, Users } from 'lucide-react';
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
import { GlucoseExamination, UksVisit } from '../../types/database';
import { DataService } from '../../services/dataService';

interface SchoolActivityOutcomeChartsProps {
  exams: GlucoseExamination[];
  visits: UksVisit[];
  titleSuffix?: string;
}

export const SchoolActivityOutcomeCharts: React.FC<SchoolActivityOutcomeChartsProps> = ({
  exams,
  visits,
  titleSuffix,
}) => {
  const units = DataService.getUnits();
  const [categoryFilter, setCategoryFilter] = useState<'semua' | 'siswa' | 'karyawan'>('semua');
  const [displayMode, setDisplayMode] = useState<'grouped' | 'stacked'>('grouped');

  const isEmployeeExam = (e: GlucoseExamination) =>
    e.participant?.category === 'karyawan' || (e as any).participant_category === 'karyawan';
  const isStudentExam = (e: GlucoseExamination) => !isEmployeeExam(e);

  const isEmployeeVisit = (v: UksVisit) =>
    v.participant?.category === 'karyawan' || (v as any).patient_category === 'karyawan';
  const isStudentVisit = (v: UksVisit) => !isEmployeeVisit(v);

  // 1. Data Perbandingan Aktivitas UKS Antar Unit Sekolah (Dipisahkan Siswa vs Karyawan)
  const unitStats = units.map((u) => {
    const unitExams = exams.filter(
      (e) => e.participant?.unit_id === u.id || (e as any).unit_id === u.id
    );
    const unitVisits = visits.filter(
      (v) => v.participant?.unit_id === u.id || (v as any).unit_id === u.id
    );

    const studentVisits = unitVisits.filter(isStudentVisit).length;
    const employeeVisits = unitVisits.filter(isEmployeeVisit).length;

    const studentExams = unitExams.filter(isStudentExam).length;
    const employeeExams = unitExams.filter(isEmployeeExam).length;

    return {
      name: u.unit_code,
      unitFullName: u.unit_name,
      studentVisits,
      employeeVisits,
      totalVisits: unitVisits.length,
      studentExams,
      employeeExams,
      totalExams: unitExams.length,
    };
  });

  // Overall sums
  const totalStudentVisits = unitStats.reduce((acc, u) => acc + u.studentVisits, 0);
  const totalEmployeeVisits = unitStats.reduce((acc, u) => acc + u.employeeVisits, 0);
  const totalStudentExams = unitStats.reduce((acc, u) => acc + u.studentExams, 0);
  const totalEmployeeExams = unitStats.reduce((acc, u) => acc + u.employeeExams, 0);

  // 2. Data Distribusi Hasil Penanganan Kunjungan
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

  const outcomeLabels: Record<string, string> = {
    kembali_ke_kelas: 'Kembali ke Kelas',
    kembali_bekerja: 'Kembali Bekerja',
    beristirahat_di_uks: 'Istirahat di UKS',
    dijemput_keluarga: 'Dijemput Keluarga',
    dipulangkan: 'Dipulangkan',
    dirujuk: 'Dirujuk ke RS / Faskes',
    dalam_observasi: 'Dalam Observasi',
  };

  const outcomePieData = Array.from(outcomesMap.entries()).map(([key, val]) => ({
    name: outcomeLabels[key] || key.replace(/_/g, ' '),
    rawKey: key,
    value: val,
    color: outcomeColors[key] || '#94a3b8',
  }));

  const totalOutcomes = outcomePieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Bar Chart: Perbandingan Aktivitas UKS Antar Unit Sekolah (7 cols) */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Perbandingan Aktivitas UKS Antar Unit Sekolah {titleSuffix ? `(${titleSuffix})` : ''}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pemisahan volume kunjungan UKS dan pemeriksaan glukosa antara siswa dan guru/karyawan
              </p>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0 self-start sm:self-auto">
              {units.length} Unit Sekolah
            </span>
          </div>

          {/* Filter Pills: Kategori Siswa vs Karyawan & Mode Batang */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCategoryFilter('semua')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  categoryFilter === 'semua'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Semua (Terpisah)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('siswa')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  categoryFilter === 'siswa'
                    ? 'bg-sky-700 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Hanya Siswa ({totalStudentVisits + totalStudentExams})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('karyawan')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  categoryFilter === 'karyawan'
                    ? 'bg-indigo-700 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Hanya Karyawan ({totalEmployeeVisits + totalEmployeeExams})
              </button>
            </div>

            {categoryFilter === 'semua' && (
              <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDisplayMode('grouped')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    displayMode === 'grouped' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                  title="Tampilkan batang berdampingan"
                >
                  Berjajar
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('stacked')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    displayMode === 'stacked' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                  title="Tampilkan batang bertumpuk total"
                >
                  Bertumpuk
                </button>
              </div>
            )}
          </div>
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
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-2 shadow-xl border border-slate-700 min-w-[210px]">
                        <div className="font-bold text-sky-300 border-b border-slate-700 pb-1 flex items-center justify-between">
                          <span>{d.unitFullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({d.name})</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Aktivitas Kunjungan UKS
                          </div>
                          <div className="flex justify-between items-center text-sky-200">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                              Siswa:
                            </span>
                            <span className="font-bold">{d.studentVisits}</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-200">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                              Guru & Karyawan:
                            </span>
                            <span className="font-bold">{d.employeeVisits}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300 font-semibold border-t border-slate-800 pt-0.5 text-[11px]">
                            <span>Total Kunjungan:</span>
                            <span>{d.totalVisits}</span>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-slate-700">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Pemeriksaan Gula Darah
                          </div>
                          <div className="flex justify-between items-center text-emerald-200">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                              Siswa:
                            </span>
                            <span className="font-bold">{d.studentExams}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-200">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                              Guru & Karyawan:
                            </span>
                            <span className="font-bold">{d.employeeExams}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300 font-semibold border-t border-slate-800 pt-0.5 text-[11px]">
                            <span>Total Pemeriksaan:</span>
                            <span>{d.totalExams}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {/* Mode: Semua (Terpisah) */}
              {categoryFilter === 'semua' && (
                <>
                  <Bar
                    dataKey="studentVisits"
                    name="Kunjungan Siswa"
                    fill="#0284c7"
                    stackId={displayMode === 'stacked' ? 'visits' : undefined}
                    radius={displayMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="employeeVisits"
                    name="Kunjungan Karyawan"
                    fill="#6366f1"
                    stackId={displayMode === 'stacked' ? 'visits' : undefined}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="studentExams"
                    name="Glukosa Siswa"
                    fill="#10b981"
                    stackId={displayMode === 'stacked' ? 'exams' : undefined}
                    radius={displayMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="employeeExams"
                    name="Glukosa Karyawan"
                    fill="#f59e0b"
                    stackId={displayMode === 'stacked' ? 'exams' : undefined}
                    radius={[4, 4, 0, 0]}
                  />
                </>
              )}

              {/* Mode: Hanya Siswa */}
              {categoryFilter === 'siswa' && (
                <>
                  <Bar dataKey="studentVisits" name="Kunjungan UKS Siswa" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="studentExams" name="Pemeriksaan Glukosa Siswa" fill="#10b981" radius={[6, 6, 0, 0]} />
                </>
              )}

              {/* Mode: Hanya Karyawan */}
              {categoryFilter === 'karyawan' && (
                <>
                  <Bar dataKey="employeeVisits" name="Kunjungan UKS Guru & Karyawan" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="employeeExams" name="Pemeriksaan Glukosa Guru & Karyawan" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Pie Chart: Distribusi Hasil Penanganan Kunjungan (5 cols) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-700" />
              Distribusi Hasil Penanganan Kunjungan
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Proporsi hasil akhir (disposisi) penanganan pasien di UKS
            </p>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 shrink-0 self-start sm:self-auto">
            {totalOutcomes} Penanganan
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          {outcomePieData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada data penanganan kunjungan
            </div>
          ) : (
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
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val} kunjungan (${totalOutcomes > 0 ? Math.round((Number(val) / totalOutcomes) * 100) : 0}%)`,
                    name,
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
