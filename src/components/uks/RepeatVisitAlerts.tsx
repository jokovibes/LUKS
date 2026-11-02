/**
 * Modul B.E: Peringatan Kunjungan Berulang (Repeat Visit Detection)
 * Lazuardi UKS Management System (LUKS)
 * Detects frequent UKS visitors (default >= 3 visits in 30 days) and enables
 * clinical reviews with confidential internal staff notes.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  FileSpreadsheet,
  Lock,
  MessageSquare,
  User,
  Shield,
  Save,
  Info,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { RepeatVisitWarning, UksVisit } from '../../types/database';

export const RepeatVisitAlerts: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarning, setSelectedWarning] = useState<RepeatVisitWarning | null>(null);
  const [warningToDeleteReview, setWarningToDeleteReview] = useState<RepeatVisitWarning | null>(null);

  // Review state
  const [reviewStatus, setReviewStatus] = useState<'menunggu_telaah' | 'telah_ditelaah' | 'tindak_lanjut_khusus'>('telah_ditelaah');
  const [internalNotes, setInternalNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentUser) return null;

  // Repeat visit warnings can be reviewed by UKS staff, admin, and pimpinan (aggregate)
  const warnings = React.useMemo(() => DataService.getRepeatVisitWarnings(), [reloadKey]);
  const units = React.useMemo(() => DataService.getUnits(), [reloadKey]);
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  const filteredWarnings = warnings.filter((w) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      w.participant.full_name.toLowerCase().includes(q) ||
      w.participant.employee_or_student_id.toLowerCase().includes(q)
    );
  });

  const handleOpenReview = (w: RepeatVisitWarning) => {
    setSelectedWarning(w);
    setReviewStatus(w.status_review);
    setInternalNotes(w.internal_notes || '');
    setSaveSuccess(false);
  };

  const handleSaveReview = () => {
    if (!selectedWarning) return;
    DataService.updateRepeatVisitReview(
      selectedWarning.participant_id,
      reviewStatus,
      internalNotes,
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );
    setSaveSuccess(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => {
      setSaveSuccess(false);
      setSelectedWarning(null);
    }, 1000);
  };

  const handleConfirmDeleteReview = () => {
    if (!warningToDeleteReview || !currentUser) return;
    DataService.deleteRepeatReview(warningToDeleteReview.participant_id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setWarningToDeleteReview(null);
    if (selectedWarning?.participant_id === warningToDeleteReview.participant_id) {
      setSelectedWarning(null);
    }
    setReloadKey((k) => k + 1);
  };

  const handleExportExcel = () => {
    ExportService.exportRepeatVisitsToExcel(filteredWarnings, unitMap);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Peringatan Kunjungan Berulang (Repeat Visit Alerts)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendeteksi siswa atau karyawan dengan frekuensi kunjungan tinggi (≥ 3 kali dalam 30 hari) untuk evaluasi kesehatan preventif.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Daftar (.xlsx)
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Ketentuan Kebijakan UKS Sekolah:</span>
          <p className="leading-relaxed text-amber-900">
            Peringatan ini merupakan indikator pemantauan administratif agar petugas UKS dan pihak sekolah dapat berkoordinasi secara terpadu. Peringatan ini <strong>bukan merupakan diagnosis medis</strong>, dan catatan tindak lanjut internal bersifat rahasia.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama atau NIS/NIY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Warning Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarnings.length === 0 ? (
          <div className="col-span-full py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            Tidak ada peserta yang memenuhi kriteria kunjungan berulang saat ini.
          </div>
        ) : (
          filteredWarnings.map((warning) => {
            const part = warning.participant;
            const unitName = unitMap.get(part.unit_id) || '-';

            return (
              <div
                key={warning.participant_id}
                className="bg-white rounded-2xl border-2 border-amber-300 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm shrink-0">
                        {part.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{part.full_name}</h4>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {part.employee_or_student_id} • {part.category}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase border border-red-200">
                      {warning.visit_count} Kunjungan
                    </span>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500">Unit:</span> <span className="font-semibold">{unitName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status Telaah:</span>{' '}
                      <span className="font-bold capitalize text-amber-800">
                        {warning.status_review.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Summary of visits */}
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Riwayat 30 Hari Terakhir:
                    </div>
                    <div className="space-y-1">
                      {warning.visits.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          className="text-[10px] flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-slate-700"
                        >
                          <span className="truncate max-w-[180px]">{v.main_complaint}</span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {new Date(v.visit_datetime).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {warning.internal_notes && (
                    <div className="mt-3 p-2 bg-purple-50/70 border border-purple-200 rounded-lg text-[10px] text-purple-900">
                      <div className="font-bold flex items-center gap-1 mb-0.5 text-purple-950">
                        <Lock className="w-3 h-3" />
                        Catatan Internal Petugas:
                      </div>
                      <p className="line-clamp-2 italic">{warning.internal_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleOpenReview(warning)}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {warning.status_review !== 'menunggu_telaah' ? 'Ubah Catatan Telaah' : 'Telaah & Catat'}
                  </button>
                  {(warning.internal_notes || warning.status_review !== 'menunggu_telaah') && (
                    <button
                      onClick={() => setWarningToDeleteReview(warning)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-slate-200 hover:border-rose-300"
                      title="Hapus / Reset Catatan Telaah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Telaah Peringatan Kunjungan Berulang</h3>
                <p className="text-xs text-amber-200">
                  {selectedWarning.participant.full_name} ({selectedWarning.participant.employee_or_student_id})
                </p>
              </div>
              <button
                onClick={() => setSelectedWarning(null)}
                className="p-1.5 text-amber-200 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-800">Total Kunjungan 30 Hari:</div>
                  <div className="font-bold text-base text-amber-950 font-mono">
                    {selectedWarning.visit_count} Kali Kunjungan
                  </div>
                </div>
                <div className="text-right text-[11px] text-amber-900">
                  {selectedWarning.participant.category === 'siswa' ? 'Siswa Sekolah' : 'Karyawan / Guru'}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Status Peninjauan / Telaah:
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                >
                  <option value="menunggu_telaah">Menunggu Telaah</option>
                  <option value="telah_ditelaah">Telah Ditelaah & Terkoordinasi</option>
                  <option value="tindak_lanjut_khusus">Memerlukan Tindak Lanjut Khusus / Konsultasi Dokter</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Catatan Tindak Lanjut Internal (Rahasia):
                </label>
                <textarea
                  rows={4}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Tuliskan catatan internal, evaluasi pola keluhan, komunikasi dengan wali kelas atau orang tua... (Catatan ini tidak dapat dilihat oleh siswa atau pihak umum)."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                />
              </div>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Telaah berhasil disimpan ke audit log dan database.
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {(selectedWarning.internal_notes || selectedWarning.status_review !== 'menunggu_telaah') && (
                  <button
                    type="button"
                    onClick={() => setWarningToDeleteReview(selectedWarning)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1 transition border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Catatan
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedWarning(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSaveReview}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Catatan Telaah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Reset Review Confirmation Modal */}
      {warningToDeleteReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-800">Hapus Catatan Telaah Peringatan</h3>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menghapus catatan telaah internal untuk{' '}
                  <span className="font-bold text-slate-900">
                    {warningToDeleteReview.participant.full_name}
                  </span>? Status peringatan akan dikembalikan ke "Menunggu Telaah". Tindakan ini dicatat dalam audit trail.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningToDeleteReview(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteReview}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Ya, Hapus Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
