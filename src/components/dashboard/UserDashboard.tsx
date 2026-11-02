/**
 * Dashboard Siswa & Karyawan - LUKS
 * Personalized private health dashboard. Enforces strict privacy: users can ONLY
 * see their own health examinations, visits, and personal upcoming checkups.
 */

import React, { useState } from 'react';
import {
  User,
  Activity,
  HeartPulse,
  CalendarCheck,
  QrCode,
  ShieldCheck,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

export const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [isQrCardOpen, setIsQrCardOpen] = useState(false);

  if (!currentUser) return null;

  // Retrieve strictly personal records
  const myExams = DataService.getGlucoseExaminations(currentUser);
  const myVisits = DataService.getUksVisits(currentUser);
  const myFollowUps = DataService.getGlucoseFollowUps(currentUser);
  const units = DataService.getUnits();
  const unitName = units.find((u) => u.id === currentUser.unit_id)?.unit_name || 'Lazuardi Global School';

  const isStudent = currentUser.category === 'siswa';

  const handleDownloadPdf = () => {
    ExportService.downloadDashboardPdf('user', currentUser, {
      exams: myExams,
      visits: myVisits,
      units,
    });
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle={`BUKU KESEHATAN & RIWAYAT UKS PRIBADI`}
          documentSubtitle={`Rekam Medis Pribadi Siswa / Karyawan: ${currentUser.full_name} (${currentUser.employee_or_student_id})`}
          documentNumber={`LUKS-USER-${currentUser.employee_or_student_id}-${new Date().getFullYear()}`}
        />
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden no-print">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/60 text-sky-200 text-xs font-semibold mb-3 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portal Kesehatan Pribadi • Data Terenkripsi & Privat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Selamat Datang, {currentUser.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1.5 leading-relaxed">
            {isStudent
              ? 'Pantau catatan kesehatan dan pemeriksaan fisik berkala Anda di lingkungan sekolah Lazuardi Global Compassionate School.'
              : 'Pantau riwayat skrining gula darah, riwayat kunjungan ke UKS sekolah, serta jadwal evaluasi kesehatan Anda.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => setIsQrCardOpen(true)}
              className="px-4 py-2 bg-white text-blue-900 hover:bg-sky-50 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-blue-700" />
              Lihat Kartu UKS Digital Saya
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 border border-sky-400/30"
            >
              <Printer className="w-4 h-4 text-white" />
              Download PDF Riwayat Saya
            </button>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Ringkasan Identitas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Nomor Identitas</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
              {currentUser.employee_or_student_id}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Unit Sekolah</div>
            <div className="font-bold text-slate-900 truncate mt-0.5">{unitName}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">{isStudent ? 'Status' : 'Unit Kerja'}</div>
            <div className="font-semibold text-slate-800 mt-0.5">
              {currentUser.work_unit || (isStudent ? 'Siswa Aktif' : 'Staff')}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Kontak Terdaftar</div>
            <div className="font-semibold text-slate-800 font-mono mt-0.5">
              {currentUser.contact_information || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Blood Glucose History & UKS Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Blood Glucose History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Riwayat Pemeriksaan Gula Darah Saya ({myExams.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {myExams.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Belum ada data pemeriksaan gula darah yang tercatat untuk Anda.
              </div>
            ) : (
              myExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 text-xs">
                      {exam.examination_number}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(exam.examination_datetime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-slate-500 text-[11px]">Jenis:</span>{' '}
                      <span className="font-semibold text-slate-800 capitalize">
                        {exam.examination_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-base text-slate-900">
                        {exam.result_value} {exam.result_unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Klasifikasi UKS:</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      {exam.classification.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: My UKS Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Riwayat Kunjungan UKS Saya ({myVisits.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {myVisits.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Belum ada catatan kunjungan UKS Anda.
              </div>
            ) : (
              myVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900">{visit.visit_number}</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(visit.visit_datetime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px]">Keluhan:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{visit.main_complaint}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Hasil:</span>
                    <span className="font-bold text-blue-900 capitalize">
                      {visit.outcome ? visit.outcome.replace(/_/g, ' ') : 'Selesai'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Follow Ups & Reminders */}
      {myFollowUps.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-purple-700" />
            Tindak Lanjut & Pemantauan Kesehatan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myFollowUps.map((fu) => (
              <div
                key={fu.id}
                className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950">Rekomendasi UKS:</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold uppercase text-[10px]">
                    {fu.follow_up_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-purple-900 leading-relaxed">{fu.recommended_action}</p>
                {fu.scheduled_date && (
                  <div className="text-[11px] font-mono text-purple-800 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-purple-700" />
                    Jadwal Cek Ulang: {new Date(fu.scheduled_date).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIGITAL UKS ID CARD MODAL */}
      {isQrCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 text-center space-y-4">
            <div className="flex justify-between items-center no-print">
              <span className="text-xs font-bold text-slate-400 uppercase">Kartu UKS Digital</span>
              <button
                onClick={() => setIsQrCardOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Visual Card */}
            <div className="p-6 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg border border-blue-800 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
                <div className="text-left">
                  <div className="text-xs font-black tracking-wider uppercase text-sky-300">
                    Lazuardi School
                  </div>
                  <div className="text-[9px] text-blue-200">Kartu Layanan UKS Terpadu</div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center text-xs font-bold text-sky-200">
                  ✚
                </div>
              </div>

              {/* QR Code representation */}
              <div className="p-4 bg-white rounded-xl mx-auto w-44 h-44 flex flex-col items-center justify-center shadow-inner">
                <div className="w-36 h-36 border-4 border-slate-900 p-2 flex flex-col justify-between rounded-lg">
                  <div className="flex justify-between">
                    <div className="w-7 h-7 bg-slate-900 rounded-xs flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                    <div className="w-7 h-7 bg-slate-900 rounded-xs flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                  </div>
                  <div className="text-center font-mono text-[9px] font-bold text-slate-900">
                    {currentUser.employee_or_student_id}
                  </div>
                  <div className="flex justify-between">
                    <div className="w-7 h-7 bg-slate-900 rounded-xs flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono self-end">LUKS</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="font-extrabold text-sm text-white tracking-wide">
                  {currentUser.full_name}
                </div>
                <div className="text-xs font-mono text-sky-300 mt-0.5">
                  {currentUser.employee_or_student_id}
                </div>
                <div className="text-[10px] text-blue-300 mt-1 uppercase tracking-wider">
                  {isStudent ? 'Siswa Sekolah' : 'Karyawan / Guru'} • {unitName}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Tunjukkan kartu ini kepada Petugas UKS saat berkunjung untuk pemindaian identitas cepat.
            </p>

            <div className="flex justify-center gap-2 pt-2 no-print">
              <button
                onClick={() => ExportService.printCurrentView()}
                className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu
              </button>
              <button
                onClick={() => setIsQrCardOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
