/**
 * Komponen Grafik Aktivitas UKS Antar Unit Sekolah & Distribusi Penanganan
 * Digunakan secara konsisten pada Dashboard Administrator, Petugas UKS, dan Pimpinan.
 */

import React from 'react';
import { Layers, Activity, Info } from 'lucide-react';
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

  // 1. Data Perbandingan Aktivitas UKS Antar Unit Sekolah
  const unitStats = units.map((u) => {
    const unitExams = exams.filter((e) => e.participant?.unit_id === u.id);
    const unitVisits = visits.filter((v) => v.participant?.unit_id === u.id);
    return {
      name: u.unit_code,
      unitFullName: u.unit_name,
      totalExams: unitExams.length,
      totalVisits: unitVisits.length,
      attentionGlucose: unitExams.filter(
        (e) => e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut'
      ).length,
    };
  });

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
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Perbandingan Aktivitas UKS Antar Unit Sekolah {titleSuffix ? `(${titleSuffix})` : ''}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Komparasi volume kunjungan UKS dan pemeriksaan glukosa lintas jenjang TK, SD, SMP, SMA
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0 self-start sm:self-auto">
            {units.length} Unit Sekolah
          </span>
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
                        <div>Kunjungan UKS: <span className="font-bold">{d.totalVisits}</span></div>
                        <div>Pemeriksaan Glukosa: <span className="font-bold">{d.totalExams}</span></div>
                        <div>Perlu Perhatian: <span className="font-bold text-amber-300">{d.attentionGlucose}</span></div>
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
