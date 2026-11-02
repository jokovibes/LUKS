/**
 * Modul A: Formulir Pendaftaran & Pencatatan Pemeriksaan Gula Darah
 * Lazuardi UKS Management System (LUKS)
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  QrCode,
  Search,
  User,
  Calendar,
  Clock,
  Save,
  FileText,
  Printer,
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import {
  UserProfile,
  GlucoseExamType,
  GlucoseUnit,
  GlucoseClassification,
  GlucoseExamination,
  SchoolUnit,
  SchoolClass,
} from '../../types/database';
import { QrScannerModal } from '../common/QrScannerModal';

interface GlucoseExamFormProps {
  onSuccess: (newExam: GlucoseExamination) => void;
  onOpenPrintSlip?: (exam: GlucoseExamination) => void;
  preSelectedParticipant?: UserProfile;
}

export const GlucoseExamForm: React.FC<GlucoseExamFormProps> = ({
  onSuccess,
  onOpenPrintSlip,
  preSelectedParticipant,
}) => {
  const { currentUser } = useAuth();

  // Sequential exam number
  const [examNumber, setExamNumber] = useState<string>('');
  const [examDateTime, setExamDateTime] = useState<string>('');

  // Participant selection state
  const [participant, setParticipant] = useState<UserProfile | null>(preSelectedParticipant || null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Examination fields
  const [examType, setExamType] = useState<GlucoseExamType>('sewaktu');
  const [lastMealDateTime, setLastMealDateTime] = useState<string>('');
  const [fastingDurationHours, setFastingDurationHours] = useState<string>('');
  const [resultValue, setResultValue] = useState<string>('');
  const [resultUnit, setResultUnit] = useState<GlucoseUnit>('mg/dL');
  const [symptoms, setSymptoms] = useState('');
  const [participantCondition, setParticipantCondition] = useState('');
  const [deviceName, setDeviceName] = useState('Accu-Chek Instant #UKS-01');
  const [notes, setNotes] = useState('');
  const [consentStatus, setConsentStatus] = useState<'diberikan' | 'tidak_diperlukan' | 'ditolak'>('diberikan');

  // Follow-up recommendation modal triggers
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Real-time evaluation
  const [evaluation, setEvaluation] = useState<{
    classification: GlucoseClassification;
    parameterVersion?: string;
    parameterDisclaimer: string;
  } | null>(null);

  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const units = DataService.getUnits();
  const classes = DataService.getClasses(selectedUnitId);

  // Initialize automatic sequence code & datetime
  useEffect(() => {
    const nextCode = DataService.generateSequentialNumber('GDS');
    setExamNumber(nextCode);

    // Current time in ISO format formatted for datetime-local input
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;
    setExamDateTime(localIso);
  }, []);

  // Update classification live when value, type, or unit changes
  useEffect(() => {
    const num = parseFloat(resultValue);
    if (!isNaN(num) && num > 0) {
      const evalRes = DataService.evaluateGlucoseClassification(examType, num, resultUnit);
      setEvaluation(evalRes);
    } else {
      setEvaluation(null);
    }
  }, [resultValue, examType, resultUnit]);

  // Handle participant search
  const searchedParticipants = searchQuery || selectedUnitId || selectedClassId
    ? DataService.searchProfiles(searchQuery, selectedUnitId || undefined, selectedClassId || undefined)
    : [];

  const handleSelectParticipant = (p: UserProfile) => {
    setParticipant(p);
    setSearchQuery('');
    setFormError(null);
  };

  const handleSave = (isDraft: boolean) => {
    setFormError(null);
    setFormSuccess(null);

    if (!participant) {
      setFormError('Silakan pilih peserta (siswa atau karyawan) terlebih dahulu.');
      return;
    }

    const numValue = parseFloat(resultValue);
    if (!isDraft && (isNaN(numValue) || numValue <= 0 || numValue > 1000)) {
      setFormError('Masukkan angka hasil pemeriksaan gula darah yang valid (misal: 110 mg/dL).');
      return;
    }

    try {
      const saved = DataService.saveGlucoseExamination(
        {
          examination_number: examNumber,
          participant_id: participant.id,
          examination_datetime: new Date(examDateTime).toISOString(),
          examination_type: examType,
          last_meal_datetime: lastMealDateTime ? new Date(lastMealDateTime).toISOString() : undefined,
          fasting_duration_hours: fastingDurationHours ? parseFloat(fastingDurationHours) : undefined,
          result_value: isNaN(numValue) ? 0 : numValue,
          result_unit: resultUnit,
          symptoms: symptoms.trim() || undefined,
          participant_condition: participantCondition.trim() || undefined,
          device_name: deviceName,
          notes: notes.trim() || undefined,
          consent_status: consentStatus,
          record_status: isDraft ? 'draft' : 'resmi',
        },
        {
          id: currentUser?.id || 'staff-1',
          name: currentUser?.full_name || 'Petugas UKS',
          role: currentUser?.role || 'petugas_uks',
        }
      );

      // Save follow-up if requested
      if (scheduleFollowUp && followUpDate) {
        DataService.saveGlucoseFollowUp(
          {
            examination_id: saved.id,
            scheduled_date: followUpDate,
            recommended_action: followUpNotes || 'Pemeriksaan ulang gula darah berkala',
            follow_up_status: 'belum_dilakukan',
          },
          {
            id: currentUser?.id || 'staff-1',
            name: currentUser?.full_name || 'Petugas UKS',
            role: currentUser?.role || 'petugas_uks',
          }
        );
      }

      setFormSuccess(
        isDraft
          ? `Pemeriksaan ${saved.examination_number} berhasil disimpan sebagai Draft.`
          : `Hasil pemeriksaan ${saved.examination_number} resmi tersimpan di database.`
      );

      onSuccess(saved);

      // Reset form
      setExamNumber(DataService.generateSequentialNumber('GDS'));
      setResultValue('');
      setSymptoms('');
      setParticipantCondition('');
      setNotes('');
      setScheduleFollowUp(false);
      setFollowUpDate('');
      setFollowUpNotes('');
    } catch (err: any) {
      setFormError(`Gagal menyimpan pemeriksaan: ${err?.message || 'Kesalahan sistem'}`);
    }
  };

  // Convert unit helper
  const handleUnitToggle = (targetUnit: GlucoseUnit) => {
    if (targetUnit === resultUnit) return;
    const num = parseFloat(resultValue);
    if (!isNaN(num) && num > 0) {
      if (targetUnit === 'mmol/L') {
        // mg/dL to mmol/L (divide by 18.0182)
        setResultValue((num / 18.0182).toFixed(2));
      } else {
        // mmol/L to mg/dL (multiply by 18.0182)
        setResultValue((num * 18.0182).toFixed(1));
      }
    }
    setResultUnit(targetUnit);
  };

  const classificationColorMap: Record<GlucoseClassification, { bg: string; text: string; label: string }> = {
    normal: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Normal' },
    perlu_perhatian: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Perlu Perhatian' },
    pemantauan: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', label: 'Pemantauan' },
    tindak_lanjut: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: 'Tindak Lanjut Segera' },
    belum_diklasifikasikan: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', label: 'Belum Diklasifikasikan' },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Pendaftaran & Pemeriksaan Gula Darah</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Skrining berkala dan pencatatan hasil pemeriksaan gula darah siswa serta karyawan Lazuardi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <QrCode className="w-4 h-4 text-sky-300" />
            Pindai QR Identitas
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Identitas & Pencarian Peserta (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Peserta Terpilih */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Data Peserta Terdaftar
              </h3>
              {participant && (
                <button
                  onClick={() => setParticipant(null)}
                  className="text-[11px] text-blue-700 hover:underline font-semibold"
                >
                  Ganti Peserta
                </button>
              )}
            </div>

            {participant ? (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-xs">
                    {participant.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {participant.full_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-200 text-blue-900">
                        {participant.category}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-blue-800 mt-0.5">
                      {participant.employee_or_student_id}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {participant.category === 'siswa'
                        ? `Kelas: ${classes.find((c) => c.id === participant.class_id)?.class_name || 'Siswa Lazuardi'}`
                        : `Unit Kerja: ${participant.work_unit || 'Karyawan Lazuardi'}`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-500">Jenis Kelamin:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {participant.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Kontak:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">
                      {participant.contact_information || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Cari peserta dengan nama, NIS / NIY, atau gunakan pemindaian QR Code:
                </p>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIS, atau NIY..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedUnitId}
                    onChange={(e) => {
                      setSelectedUnitId(e.target.value);
                      setSelectedClassId('');
                    }}
                    className="text-xs border border-slate-300 rounded-xl p-2 bg-white"
                  >
                    <option value="">Semua Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_code} - {u.unit_name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="text-xs border border-slate-300 rounded-xl p-2 bg-white"
                    disabled={!selectedUnitId}
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                {searchedParticipants.length > 0 && (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {searchedParticipants.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectParticipant(p)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.employee_or_student_id} • {p.work_unit || 'Siswa'}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata Pemeriksaan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Metadata & Waktu Pemeriksaan
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nomor Pemeriksaan (Otomatis & Unik)
                </label>
                <input
                  type="text"
                  readOnly
                  value={examNumber}
                  className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Waktu Pemeriksaan (WIB)
                </label>
                <input
                  type="datetime-local"
                  value={examDateTime}
                  onChange={(e) => setExamDateTime(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Alat Glukometer yang Digunakan
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Contoh: Accu-Chek Instant #UKS-01"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Petugas Pemeriksa
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.full_name || 'Petugas UKS'}
                  className="w-full text-xs font-semibold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hasil Pengukuran, Parameter & Penanganan (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Parameter & Hasil Pengukuran Gula Darah
            </h3>

            {/* Jenis Pemeriksaan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Jenis Pemeriksaan Gula Darah:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'sewaktu', label: 'Gula Darah Sewaktu (GDS)', desc: 'Kapan saja tanpa puasa' },
                  { id: 'puasa', label: 'Gula Darah Puasa (GDP)', desc: 'Puasa min. 8-10 jam' },
                  { id: 'setelah_makan', label: 'Setelah Makan (GD2PP)', desc: '2 jam pasca makan utama' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExamType(item.id as GlucoseExamType)}
                    className={`p-3 rounded-xl border text-left transition ${
                      examType === item.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Waktu Makan & Lama Puasa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Waktu Terakhir Makan / Minum Berkalori:
                </label>
                <input
                  type="datetime-local"
                  value={lastMealDateTime}
                  onChange={(e) => setLastMealDateTime(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              {examType === 'puasa' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Lama Puasa (Jam):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={fastingDurationHours}
                    onChange={(e) => setFastingDurationHours(e.target.value)}
                    placeholder="Contoh: 10.5"
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              )}
            </div>

            {/* HASIL PEMERIKSAAN & SATUAN */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Nilai Hasil Pemeriksaan:
                </label>
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('mg/dL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      resultUnit === 'mg/dL'
                        ? 'bg-blue-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    mg/dL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle('mmol/L')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      resultUnit === 'mmol/L'
                        ? 'bg-blue-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    mmol/L
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="800"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder="Masukkan angka hasil (misal: 115.0)"
                  className="w-full text-2xl font-mono font-bold px-4 py-3 bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900"
                />
                <span className="absolute right-4 top-4 font-mono font-bold text-slate-400 text-sm">
                  {resultUnit}
                </span>
              </div>

              {/* KLASIFIKASI OPERASIONAL DENGAN DISCLAIMER MEDIS */}
              {evaluation && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                    classificationColorMap[evaluation.classification].bg
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 text-[11px]">
                      Klasifikasi Administratif:
                    </span>
                    <span
                      className={`font-extrabold px-2.5 py-0.5 rounded-full border text-xs uppercase ${
                        classificationColorMap[evaluation.classification].text
                      }`}
                    >
                      {classificationColorMap[evaluation.classification].label}
                    </span>
                  </div>

                  {evaluation.parameterVersion && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Parameter Disetujui: {evaluation.parameterVersion}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-600 leading-tight bg-white/70 p-2 rounded-lg border border-slate-200/60 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <span>{evaluation.parameterDisclaimer}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Gejala & Kondisi Saat Diperiksa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Keluhan / Gejala yang Dirasakan:
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Contoh: Pusing, lemas setelah olahraga, sering haus..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kondisi Peserta Saat Diperiksa:
                </label>
                <textarea
                  rows={2}
                  value={participantCondition}
                  onChange={(e) => setParticipantCondition(e.target.value)}
                  placeholder="Contoh: Sadar baik (compos mentis), tampak agak pucat..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Petugas Tambahan:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan internal pengamatan atau riwayat keluarga..."
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            {/* Opsi Jadwal Pemeriksaan Ulang & Tindak Lanjut */}
            <div className="pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFollowUp}
                  onChange={(e) => setScheduleFollowUp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  Buat Jadwal Pemeriksaan Ulang / Tindak Lanjut Pemantauan
                </span>
              </label>

              {scheduleFollowUp && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                        Tanggal Jadwal Cek Ulang:
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                        Rekomendasi Tindakan:
                      </label>
                      <input
                        type="text"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Contoh: Cek GDP 10 hari, edukasi diet nutrisi"
                        className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Simpan sebagai Draft
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 transition"
                >
                  <Save className="w-4 h-4" />
                  Simpan Hasil Pemeriksaan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSelectParticipant={handleSelectParticipant}
        title="Pindai Kartu Identitas Peserta"
      />
    </div>
  );
};
