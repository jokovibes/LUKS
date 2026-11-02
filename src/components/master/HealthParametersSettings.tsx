/**
 * Pengaturan Parameter Klasifikasi Medis & Ambang Kunjungan Berulang - LUKS
 * Mandates explicit medical authority approval and versioning before parameters take effect.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  HeartPulse,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Info,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { HealthClassificationParameter } from '../../types/database';

export const HealthParametersSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // System settings for repeat visit
  const settings = DataService.getSystemSettings();
  const thresholdSetting = settings.find((s) => s.setting_key === 'repeat_visit_threshold');
  const periodSetting = settings.find((s) => s.setting_key === 'repeat_visit_period_days');

  const [thresholdValue, setThresholdValue] = useState(thresholdSetting?.setting_value || '3');
  const [periodDays, setPeriodDays] = useState(periodSetting?.setting_value || '30');

  // Keep state updated if data arrives from Supabase sync
  React.useEffect(() => {
    const handleSync = () => {
      const freshSettings = DataService.getSystemSettings();
      const th = freshSettings.find((s) => s.setting_key === 'repeat_visit_threshold');
      const pd = freshSettings.find((s) => s.setting_key === 'repeat_visit_period_days');
      if (th) setThresholdValue(th.setting_value);
      if (pd) setPeriodDays(pd.setting_value);
      setReloadKey((k) => k + 1);
    };

    window.addEventListener('luks-supabase-synced', handleSync);
    return () => window.removeEventListener('luks-supabase-synced', handleSync);
  }, []);

  // Parameters
  const params = React.useMemo(() => DataService.getHealthParameters(), [reloadKey]);

  // Approval Modal state
  const [selectedParam, setSelectedParam] = useState<HealthClassificationParameter | null>(null);
  const [approverName, setApproverName] = useState('dr. Hendra Wijaya, Sp.PD, M.Kes');
  const [approverTitle, setApproverTitle] = useState('Dokter Konsultan Medis UKS Lazuardi');
  const [versionString, setVersionString] = useState(`V${new Date().getFullYear()}.2-RESMI`);
  const [paramToDelete, setParamToDelete] = useState<HealthClassificationParameter | null>(null);

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await DataService.saveRepeatVisitSettings(thresholdValue, periodDays, {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      });

      if (res.success) {
        setSuccessMessage('Konfigurasi ambang kunjungan berulang berhasil disimpan ke database Supabase!');
        setReloadKey((k) => k + 1);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan konfigurasi ke database Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan ke Supabase.');
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }
  };

  const handleApproveParameter = (param: HealthClassificationParameter) => {
    if (!currentUser) return;

    DataService.saveHealthParameter(
      {
        ...param,
        approved_by: approverName,
        approved_by_title: approverTitle,
        approved_at: new Date().toISOString(),
        version: versionString,
        is_active: true,
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setSelectedParam(null);
    setReloadKey((k) => k + 1);
    setSuccessMessage(`Parameter klasifikasi ${param.examination_type} versi ${versionString} resmi disetujui & aktif.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleConfirmDeleteParam = () => {
    if (!paramToDelete || !currentUser) return;
    DataService.deleteHealthParameter(paramToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setParamToDelete(null);
    setReloadKey((k) => k + 1);
    setSuccessMessage('Parameter klasifikasi berhasil dihapus.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Pengaturan Parameter Medis & Kunjungan Berulang</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi ambang batas klasifikasi gula darah yang disetujui tenaga kesehatan berwenang dan parameter deteksi UKS.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Ketentuan Regulasi Medis & Keamanan Pasien:</span>
          <p className="leading-relaxed text-amber-900">
            “Kategori ini merupakan penanda administratif untuk membantu pemantauan di lingkungan sekolah, bukan diagnosis medis. Interpretasi hasil dan keputusan tindak lanjut harus dilakukan oleh tenaga kesehatan yang berwenang.”
          </p>
          <p className="text-[11px] text-amber-800">
            Sistem LUKS tidak mengizinkan klasifikasi medis otomatis beroperasi tanpa adanya verifikasi dan persetujuan resmi dari dokter/tenaga medis yang berwenang.
          </p>
        </div>
      </div>

      {/* SECTION 1: Health Classification Parameters (Approved by Medical Authority) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-700" />
            1. Parameter Klasifikasi Pemeriksaan Gula Darah (Standar Medis)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {params.map((param) => (
            <div
              key={param.id}
              className={`p-4 rounded-2xl border-2 transition space-y-3 text-xs ${
                param.is_active ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-slate-900">
                  {param.examination_type === 'sewaktu'
                    ? 'GDS (Sewaktu)'
                    : param.examination_type === 'puasa'
                    ? 'GDP (Puasa)'
                    : 'GD2PP (Setelah Makan)'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    param.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {param.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] bg-white p-3 rounded-xl border border-slate-200 font-mono">
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-bold">Normal:</span>
                  <span>{param.parameter_configuration.normal_min} - {param.parameter_configuration.normal_max} {param.result_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-bold">Perlu Perhatian:</span>
                  <span>{param.parameter_configuration.perlu_perhatian_min} - {param.parameter_configuration.perlu_perhatian_max} {param.result_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700 font-bold">Tindak Lanjut:</span>
                  <span>≥ {param.parameter_configuration.tindak_lanjut_min} {param.result_unit}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                <div>
                  <span className="font-semibold text-slate-700">Versi:</span> {param.version}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Disetujui Oleh:</span> {param.approved_by}
                </div>
                <div className="truncate text-slate-400">{param.approved_by_title}</div>
                <div>
                  <span className="font-semibold text-slate-700">Tanggal:</span>{' '}
                  {new Date(param.approved_at).toLocaleDateString('id-ID')}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedParam(param)}
                  className="flex-1 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[11px] transition shadow-2xs flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Ubah / Sahkan
                </button>
                <button
                  onClick={() => setParamToDelete(param)}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-slate-200 hover:border-rose-300"
                  title="Hapus Parameter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Repeat Visit Detection Settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            2. Konfigurasi Ambang Batas Peringatan Kunjungan Berulang (Repeat Visit)
          </h3>
        </div>

        <form onSubmit={handleSaveSystemSettings} className="space-y-4 text-xs max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Batas Kunjungan (Default: 3 kali)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5 bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Peserta yang mencapai jumlah kunjungan ini akan memicu peringatan untuk petugas UKS.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Rentang Periode Perhitungan (Hari)
              </label>
              <input
                type="number"
                min="7"
                max="90"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5 bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Standar: 30 hari kalender (1 bulan).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSavingSettings}
              className={`px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                isSavingSettings ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSavingSettings ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Konfigurasi Ambang Kunjungan</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tersambung langsung ke database Supabase
            </span>
          </div>
        </form>
      </div>

      {/* Approval Modal */}
      {selectedParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Formulir Persetujuan Tenaga Kesehatan</h3>
              <button
                onClick={() => setSelectedParam(null)}
                className="p-1 text-blue-200 hover:text-white rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Dokter / Tenaga Medis Pengesah</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jabatan / Kompetensi Tenaga Kesehatan</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Versi Parameter</label>
                <input
                  type="text"
                  value={versionString}
                  onChange={(e) => setVersionString(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                Dengan menyetujui parameter ini, Anda mengesahkan bahwa ambang batas pemeriksaan gula darah tersebut telah sesuai dengan konsensus medis resmi dan dapat dijadikan acuan skrining UKS Lazuardi.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedParam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleApproveParameter(selectedParam)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck className="w-4 h-4" />
                Sahkan & Aktifkan Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Parameter Confirmation Modal */}
      {paramToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-800">Konfirmasi Hapus Parameter</h3>
                <p className="text-xs text-slate-600">
                  Apakah Anda yakin ingin menghapus parameter klasifikasi{' '}
                  <span className="font-bold text-slate-900 uppercase">
                    {paramToDelete.examination_type} (Versi: {paramToDelete.version})
                  </span>? Tindakan ini akan dicatat dalam audit log sistem.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setParamToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteParam}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Ya, Hapus Parameter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
