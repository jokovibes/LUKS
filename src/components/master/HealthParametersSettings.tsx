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
  Plus,
  X,
  Sliders,
  Building2,
  MapPin,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { HealthClassificationParameter, GlucoseExamType, GlucoseUnit } from '../../types/database';

export const HealthParametersSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingSchoolSettings, setIsSavingSchoolSettings] = useState(false);

  // System settings from database
  const settings = DataService.getSystemSettings();
  const schoolNameSetting = settings.find((s) => s.setting_key === 'school_name');
  const schoolAddressSetting = settings.find((s) => s.setting_key === 'school_address');
  const uksPhoneSetting = settings.find((s) => s.setting_key === 'uks_phone');
  const academicYearSetting = settings.find((s) => s.setting_key === 'active_academic_year');
  const thresholdSetting = settings.find((s) => s.setting_key === 'repeat_visit_threshold');
  const periodSetting = settings.find((s) => s.setting_key === 'repeat_visit_period_days');

  const [schoolName, setSchoolName] = useState(schoolNameSetting?.setting_value || 'Lazuardi Global Compassionate School');
  const [schoolAddress, setSchoolAddress] = useState(schoolAddressSetting?.setting_value || 'Jl. Merpati No. 12, Cinere, Depok, Jawa Barat 16514');
  const [uksPhone, setUksPhone] = useState(uksPhoneSetting?.setting_value || '(021) 753-4820 ext 105');
  const [academicYear, setAcademicYear] = useState(academicYearSetting?.setting_value || '2026/2027 Ganjil');
  const [thresholdValue, setThresholdValue] = useState(thresholdSetting?.setting_value || '3');
  const [periodDays, setPeriodDays] = useState(periodSetting?.setting_value || '30');

  // Keep state updated if data arrives from Supabase sync
  React.useEffect(() => {
    const handleSync = () => {
      const freshSettings = DataService.getSystemSettings();
      const sn = freshSettings.find((s) => s.setting_key === 'school_name');
      const sa = freshSettings.find((s) => s.setting_key === 'school_address');
      const up = freshSettings.find((s) => s.setting_key === 'uks_phone');
      const ay = freshSettings.find((s) => s.setting_key === 'active_academic_year');
      const th = freshSettings.find((s) => s.setting_key === 'repeat_visit_threshold');
      const pd = freshSettings.find((s) => s.setting_key === 'repeat_visit_period_days');
      if (sn) setSchoolName(sn.setting_value);
      if (sa) setSchoolAddress(sa.setting_value);
      if (up) setUksPhone(up.setting_value);
      if (ay) setAcademicYear(ay.setting_value);
      if (th) setThresholdValue(th.setting_value);
      if (pd) setPeriodDays(pd.setting_value);
      setReloadKey((k) => k + 1);
    };

    window.addEventListener('luks-supabase-synced', handleSync);
    return () => window.removeEventListener('luks-supabase-synced', handleSync);
  }, []);

  // Parameters
  const params = React.useMemo(() => DataService.getHealthParameters(), [reloadKey]);

  // Modal State for Add & Edit Parameter
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<HealthClassificationParameter | null>(null);

  // Form Fields
  const [examType, setExamType] = useState<GlucoseExamType>('puasa');
  const [resultUnit, setResultUnit] = useState<GlucoseUnit>('mg/dL');
  const [normalMin, setNormalMin] = useState<string>('70');
  const [normalMax, setNormalMax] = useState<string>('100');
  const [perluMin, setPerluMin] = useState<string>('101');
  const [perluMax, setPerluMax] = useState<string>('125');
  const [tindakLanjutMin, setTindakLanjutMin] = useState<string>('126');
  const [catatanPedoman, setCatatanPedoman] = useState<string>('Standar acuan konsensus medis UKS Lazuardi');
  const [approverName, setApproverName] = useState<string>('dr. Hendra Wijaya, Sp.PD, M.Kes');
  const [approverTitle, setApproverTitle] = useState<string>('Dokter Konsultan Medis UKS Lazuardi');
  const [versionString, setVersionString] = useState<string>(`V${new Date().getFullYear()}.2-RESMI`);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete confirmation
  const [paramToDelete, setParamToDelete] = useState<HealthClassificationParameter | null>(null);

  const handleOpenAdd = () => {
    setEditingParam(null);
    setExamType('puasa');
    setResultUnit('mg/dL');
    setNormalMin('70');
    setNormalMax('100');
    setPerluMin('101');
    setPerluMax('125');
    setTindakLanjutMin('126');
    setCatatanPedoman('Standar acuan konsensus medis UKS Lazuardi');
    setApproverName('dr. Hendra Wijaya, Sp.PD, M.Kes');
    setApproverTitle('Dokter Konsultan Medis UKS Lazuardi');
    setVersionString(`V${new Date().getFullYear()}.${params.length + 1}-RESMI`);
    setIsActive(true);
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (param: HealthClassificationParameter) => {
    setEditingParam(param);
    setExamType(param.examination_type);
    setResultUnit(param.result_unit);
    setNormalMin(String(param.parameter_configuration?.normal_min ?? 70));
    setNormalMax(String(param.parameter_configuration?.normal_max ?? 100));
    setPerluMin(String(param.parameter_configuration?.perlu_perhatian_min ?? 101));
    setPerluMax(String(param.parameter_configuration?.perlu_perhatian_max ?? 125));
    setTindakLanjutMin(String(param.parameter_configuration?.tindak_lanjut_min ?? 126));
    setCatatanPedoman(param.parameter_configuration?.catatan_pedoman || '');
    setApproverName(param.approved_by || 'dr. Hendra Wijaya, Sp.PD, M.Kes');
    setApproverTitle(param.approved_by_title || 'Dokter Konsultan Medis UKS Lazuardi');
    setVersionString(param.version || `V${new Date().getFullYear()}.1-RESMI`);
    setIsActive(param.is_active);
    setErrorMessage(null);
    setIsEditorOpen(true);
  };

  const handleSaveParameter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const nMin = parseFloat(normalMin);
    const nMax = parseFloat(normalMax);
    const pMin = parseFloat(perluMin);
    const pMax = parseFloat(perluMax);
    const tMin = parseFloat(tindakLanjutMin);

    if (isNaN(nMin) || isNaN(nMax) || isNaN(pMin) || isNaN(pMax) || isNaN(tMin)) {
      setErrorMessage('Semua nilai ambang batas rentang harus berupa angka yang valid.');
      return;
    }

    if (nMin >= nMax) {
      setErrorMessage('Nilai minimum rentang Normal harus lebih kecil dari nilai maksimum Normal.');
      return;
    }

    if (pMin > pMax) {
      setErrorMessage('Nilai minimum Perlu Perhatian harus lebih kecil atau sama dengan maksimum Perlu Perhatian.');
      return;
    }

    if (tMin <= nMax) {
      setErrorMessage('Ambang batas Tindak Lanjut harus lebih besar dari batas nilai normal.');
      return;
    }

    const payload: Partial<HealthClassificationParameter> = {
      id: editingParam ? editingParam.id : undefined,
      examination_type: examType,
      result_unit: resultUnit,
      parameter_configuration: {
        normal_min: nMin,
        normal_max: nMax,
        perlu_perhatian_min: pMin,
        perlu_perhatian_max: pMax,
        tindak_lanjut_min: tMin,
        catatan_pedoman: catatanPedoman.trim(),
      },
      approved_by: approverName.trim() || 'dr. Hendra Wijaya, Sp.PD, M.Kes',
      approved_by_title: approverTitle.trim() || 'Dokter Konsultan Medis UKS Lazuardi',
      approved_at: new Date().toISOString(),
      version: versionString.trim() || `V${new Date().getFullYear()}.1-RESMI`,
      is_active: isActive,
      effective_from: editingParam?.effective_from || new Date().toISOString().split('T')[0],
    };

    DataService.saveHealthParameter(payload, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });

    setIsEditorOpen(false);
    setEditingParam(null);
    setReloadKey((k) => k + 1);

    const examLabel =
      examType === 'puasa' ? 'GDP (Puasa)' : examType === 'sewaktu' ? 'GDS (Sewaktu)' : 'GD2PP (Setelah Makan)';
    setSuccessMessage(
      editingParam
        ? `Parameter klasifikasi ${examLabel} versi ${versionString} berhasil diperbarui & disimpan ke database.`
        : `Parameter klasifikasi baru ${examLabel} versi ${versionString} berhasil ditambahkan & disimpan ke database.`
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSaveSchoolIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!schoolName.trim()) {
      setErrorMessage('Nama sekolah tidak boleh kosong.');
      return;
    }

    setIsSavingSchoolSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await DataService.saveSchoolIdentitySettings(
        schoolName,
        schoolAddress,
        uksPhone,
        academicYear,
        {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        }
      );

      if (res.success) {
        setSuccessMessage('Pengaturan Nama Sekolah, Alamat, No Telp UKS, dan Tahun Ajaran berhasil disimpan ke database Supabase!');
        setReloadKey((k) => k + 1);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan pengaturan identitas sekolah ke database Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan ke Supabase.');
    } finally {
      setIsSavingSchoolSettings(false);
      setTimeout(() => setSuccessMessage(null), 4500);
    }
  };

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
            <span>Pengaturan Sistem, Identitas Sekolah & Parameter Medis</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola identitas sekolah, kontak UKS, semester aktif, dan parameter klasifikasi medis yang tersinkronisasi langsung ke database Supabase.
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

      {/* SECTION 1: School Identity & Active Academic Year (Supabase System Settings) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              1. Identitas Sekolah & Semester / Tahun Ajaran Aktif
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Data identitas ini langsung tersimpan ke database Supabase dan otomatis tampil pada kop surat laporan resmi, slip rujukan, serta dokumen UKS.
            </p>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tersambung ke Supabase (system_settings)
          </span>
        </div>

        <form onSubmit={handleSaveSchoolIdentity} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Nama Sekolah / Institusi</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Lazuardi Global Compassionate School"
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Nama resmi sekolah yang tercantum pada judul laporan dan kop surat resmi.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                <span>Semester & Tahun Ajaran Aktif</span>
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026/2027 Ganjil"
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Periode tahun ajaran aktif yang sedang berjalan di lingkungan sekolah.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>No. Telepon / Kontak UKS</span>
              </label>
              <input
                type="text"
                value={uksPhone}
                onChange={(e) => setUksPhone(e.target.value)}
                placeholder="(021) 753-4820 ext 105"
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Nomor saluran telepon langsung ke ruang UKS untuk komunikasi darurat.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Alamat Lengkap Sekolah</span>
              </label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Jl. Merpati No. 12, Cinere, Depok, Jawa Barat 16514"
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-rose-600 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Alamat domisili fisik sekolah yang tercetak pada kop surat resmi.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              Perubahan identitas sekolah akan otomatis tersinkronisasi ke database Supabase dan seluruh cetakan dokumen.
            </span>
            <button
              type="submit"
              disabled={isSavingSchoolSettings}
              className={`px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs shrink-0 ${
                isSavingSchoolSettings ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSavingSchoolSettings ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Identitas Sekolah</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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

      {/* SECTION 2: Health Classification Parameters (Approved by Medical Authority) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-700" />
              2. Parameter Klasifikasi Pemeriksaan Gula Darah (Standar Medis)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Atur tipe pemeriksaan (GDP, GDS, GD2PP), rentang ambang normal, perhatian, dan tindak lanjut.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Parameter Medis Baru</span>
          </button>
        </div>

        {params.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">Belum ada parameter klasifikasi medis.</p>
            <p className="text-[11px] text-slate-400 mt-1">Klik tombol di atas untuk menambahkan parameter baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {params.map((param) => (
              <div
                key={param.id}
                className={`p-4 rounded-2xl border-2 transition space-y-3 text-xs flex flex-col justify-between ${
                  param.is_active ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
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
                      <span>
                        {param.parameter_configuration?.normal_min ?? 70} - {param.parameter_configuration?.normal_max ?? 100} {param.result_unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-bold">Perlu Perhatian:</span>
                      <span>
                        {param.parameter_configuration?.perlu_perhatian_min ?? 101} - {param.parameter_configuration?.perlu_perhatian_max ?? 125} {param.result_unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-bold">Tindak Lanjut:</span>
                      <span>≥ {param.parameter_configuration?.tindak_lanjut_min ?? 126} {param.result_unit}</span>
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
                    {param.parameter_configuration?.catatan_pedoman && (
                      <div className="text-[10px] italic text-slate-500 line-clamp-2 pt-0.5">
                        "{param.parameter_configuration.catatan_pedoman}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(param)}
                    className="flex-1 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[11px] transition shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Parameter & Rentang</span>
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
        )}
      </div>

      {/* SECTION 3: Repeat Visit Detection Settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            3. Konfigurasi Ambang Batas Peringatan Kunjungan Berulang (Repeat Visit)
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

      {/* Modal: Tambah & Edit Parameter Klasifikasi Medis */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>
                  {editingParam ? 'Edit Parameter Klasifikasi Medis' : 'Tambah Parameter Medis Baru'}
                </span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-blue-200 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParameter} className="p-6 space-y-4 text-xs">
              {/* Type and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jenis Pemeriksaan Gula Darah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as GlucoseExamType)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="puasa">GDP (Gula Darah Puasa)</option>
                    <option value="sewaktu">GDS (Gula Darah Sewaktu)</option>
                    <option value="setelah_makan">GD2PP (2 Jam Post Prandial / Setelah Makan)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih tipe pemeriksaan medis yang diatur.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Satuan Hasil <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={resultUnit}
                    onChange={(e) => setResultUnit(e.target.value as GlucoseUnit)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="mg/dL">mg/dL (Standar Indonesia)</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Satuan standar pengukuran di UKS.
                  </p>
                </div>
              </div>

              {/* Range Configuration Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-700" />
                  <span>Konfigurasi Ambang Batas Medis ({resultUnit})</span>
                </div>

                {/* Normal Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-emerald-700 block mb-1">
                      Normal Minimum
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={normalMin}
                        onChange={(e) => setNormalMin(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                        {resultUnit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-emerald-700 block mb-1">
                      Normal Maksimum
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={normalMax}
                        onChange={(e) => setNormalMax(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                        {resultUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perlu Perhatian Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-amber-700 block mb-1">
                      Perlu Perhatian Min
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={perluMin}
                        onChange={(e) => setPerluMin(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                        {resultUnit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-amber-700 block mb-1">
                      Perlu Perhatian Maks
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={perluMax}
                        onChange={(e) => setPerluMax(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                        {resultUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tindak Lanjut Range */}
                <div>
                  <label className="font-semibold text-rose-700 block mb-1">
                    Ambang Tindak Lanjut Medis (Nilai ≥ Batas Ini)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      value={tindakLanjutMin}
                      onChange={(e) => setTindakLanjutMin(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white text-rose-700"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">
                      {resultUnit}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Peserta dengan hasil gula darah di atas atau sama dengan nilai ini akan dikategorikan butuh rujukan / tindak lanjut.
                  </p>
                </div>
              </div>

              {/* Medical Authority & Version */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Dokter / Tenaga Medis Pengesah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jabatan / Kompetensi Nakes <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={approverTitle}
                    onChange={(e) => setApproverTitle(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor Versi Pedoman <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={versionString}
                    onChange={(e) => setVersionString(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Status Parameter
                  </label>
                  <div className="h-10 flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-800">
                        {isActive ? 'Aktif (Digunakan untuk klasifikasi)' : 'Non-Aktif (Disimpan sementara)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan / Pedoman Klinis Acuan
                </label>
                <textarea
                  rows={2}
                  value={catatanPedoman}
                  onChange={(e) => setCatatanPedoman(e.target.value)}
                  placeholder="Contoh: Konsensus PERKENI / ADA untuk skrining populasi sekolah."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                Parameter ini akan tersimpan ke database dan secara otomatis dijadikan rujukan penghitungan klasifikasi pemeriksaan gula darah UKS.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{editingParam ? 'Simpan Perubahan Parameter' : 'Tambahkan & Sahkan Parameter'}</span>
                </button>
              </div>
            </form>
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
