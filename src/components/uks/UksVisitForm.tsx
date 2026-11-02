/**
 * Modul B: Formulir Pendaftaran & Penanganan Kunjungan UKS
 * Lazuardi UKS Management System (LUKS)
 */

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  QrCode,
  Search,
  User,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Shield,
  Stethoscope,
  PhoneCall,
  Bed,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import {
  UserProfile,
  VisitReason,
  VisitOutcome,
  VisitStatus,
  UksVisit,
} from '../../types/database';
import { QrScannerModal } from '../common/QrScannerModal';

interface UksVisitFormProps {
  onSuccess: (visit: UksVisit) => void;
  preSelectedParticipant?: UserProfile;
}

export const UksVisitForm: React.FC<UksVisitFormProps> = ({
  onSuccess,
  preSelectedParticipant,
}) => {
  const { currentUser } = useAuth();

  // Visit auto number & datetime
  const [visitNumber, setVisitNumber] = useState('');
  const [visitDateTime, setVisitDateTime] = useState('');

  // Participant selection
  const [participant, setParticipant] = useState<UserProfile | null>(preSelectedParticipant || null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Visit registration fields
  const [previousLocation, setPreviousLocation] = useState('');
  const [mainComplaint, setMainComplaint] = useState('');
  const [visitReason, setVisitReason] = useState<VisitReason>('sakit');
  const [incidentChronology, setIncidentChronology] = useState('');
  const [accompanyingPerson, setAccompanyingPerson] = useState('');

  // Initial Assessment / Vital signs (Optional - do not autofill)
  const [temperature, setTemperature] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulseRate, setPulseRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medication, setMedication] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Outcome & Rest
  const [outcome, setOutcome] = useState<VisitOutcome>('beristirahat_di_uks');
  const [isRestingInUks, setIsRestingInUks] = useState(true);
  const [restStartTime, setRestStartTime] = useState('');
  const [restEndTime, setRestEndTime] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');

  // Pickup / Referral details
  const [pickupPerson, setPickupPerson] = useState('');
  const [pickupRelationship, setPickupRelationship] = useState('');
  const [pickupContact, setPickupContact] = useState('');
  const [parentContactedAt, setParentContactedAt] = useState('');
  const [referralDestination, setReferralDestination] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');

  // Repeat visit warning status
  const [repeatWarning, setRepeatWarning] = useState<{
    isWarning: boolean;
    count: number;
    threshold: number;
  } | null>(null);

  // Status message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const units = DataService.getUnits();
  const classes = DataService.getClasses(selectedUnitId);

  useEffect(() => {
    setVisitNumber(DataService.generateSequentialNumber('UKS'));
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;
    setVisitDateTime(localIso);
    setRestStartTime(localIso);
  }, []);

  // When participant changes, check for repeat visit threshold
  useEffect(() => {
    if (participant) {
      const check = DataService.checkRepeatVisitThreshold(participant.id);
      setRepeatWarning(check);
    } else {
      setRepeatWarning(null);
    }
  }, [participant]);

  // Adjust outcome and status
  useEffect(() => {
    if (outcome === 'beristirahat_di_uks' || outcome === 'masih_dalam_penanganan') {
      setIsRestingInUks(true);
    } else {
      setIsRestingInUks(false);
      if (!checkoutTime) {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        setCheckoutTime(
          `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
            now.getHours()
          )}:${pad(now.getMinutes())}`
        );
      }
    }
  }, [outcome]);

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
      setFormError('Silakan pilih peserta (siswa atau karyawan) yang berkunjung ke UKS.');
      return;
    }

    if (!mainComplaint.trim()) {
      setFormError('Keluhan utama kunjungan wajib diisi.');
      return;
    }

    try {
      const isStillActive = outcome === 'beristirahat_di_uks' || outcome === 'masih_dalam_penanganan';

      const result = DataService.saveUksVisit(
        {
          visit_number: visitNumber,
          participant_id: participant.id,
          visit_datetime: new Date(visitDateTime).toISOString(),
          previous_location: previousLocation.trim() || undefined,
          main_complaint: mainComplaint.trim(),
          visit_reason: visitReason,
          incident_chronology: incidentChronology.trim() || undefined,
          accompanying_person: accompanyingPerson.trim() || undefined,
          visit_status: isDraft ? 'aktif' : isStillActive ? 'aktif' : 'selesai',
          outcome: outcome,
          rest_start_time: restStartTime ? new Date(restStartTime).toISOString() : undefined,
          rest_end_time: restEndTime ? new Date(restEndTime).toISOString() : undefined,
          checkout_datetime: !isStillActive && checkoutTime ? new Date(checkoutTime).toISOString() : undefined,
          pickup_person: pickupPerson.trim() || undefined,
          pickup_relationship: pickupRelationship.trim() || undefined,
          pickup_contact: pickupContact.trim() || undefined,
          parent_contacted_at: parentContactedAt ? new Date(parentContactedAt).toISOString() : undefined,
          communicating_staff_name: currentUser?.full_name,
          referral_destination: referralDestination.trim() || undefined,
          handover_notes: handoverNotes.trim() || undefined,
        },
        // Assessment
        {
          temperature: temperature ? parseFloat(temperature) : undefined,
          systolic_pressure: systolic ? parseInt(systolic, 10) : undefined,
          diastolic_pressure: diastolic ? parseInt(diastolic, 10) : undefined,
          pulse_rate: pulseRate ? parseInt(pulseRate, 10) : undefined,
          respiratory_rate: respiratoryRate ? parseInt(respiratoryRate, 10) : undefined,
          oxygen_saturation: oxygenSaturation ? parseInt(oxygenSaturation, 10) : undefined,
          treatment: treatment.trim() || undefined,
          medication_or_equipment: medication.trim() || undefined,
          medication_dosage: medicationDosage.trim() || undefined,
          notes: assessmentNotes.trim() || undefined,
        },
        {
          id: currentUser?.id || 'staff-1',
          name: currentUser?.full_name || 'Petugas UKS',
          role: currentUser?.role || 'petugas_uks',
        }
      );

      setFormSuccess(
        isDraft
          ? `Kunjungan ${result.visit.visit_number} disimpan sebagai Draft.`
          : isStillActive
          ? `Kunjungan ${result.visit.visit_number} berhasil dicatat (Status: Aktif beristirahat di UKS).`
          : `Kunjungan ${result.visit.visit_number} selesai dan berhasil dicatat.`
      );

      onSuccess(result.visit);

      // Reset
      setVisitNumber(DataService.generateSequentialNumber('UKS'));
      setMainComplaint('');
      setIncidentChronology('');
      setAccompanyingPerson('');
      setPreviousLocation('');
      setTemperature('');
      setSystolic('');
      setDiastolic('');
      setPulseRate('');
      setRespiratoryRate('');
      setOxygenSaturation('');
      setTreatment('');
      setMedication('');
      setMedicationDosage('');
      setAssessmentNotes('');
      setPickupPerson('');
      setPickupContact('');
      setHandoverNotes('');
    } catch (err: any) {
      setFormError(`Gagal mencatat kunjungan: ${err?.message || 'Kesalahan sistem'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <span>Pendaftaran & Penanganan Kunjungan UKS</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan keluhan, pemeriksaan tanda vital, penanganan medis pertama, serta pemantauan istirahat.
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
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

      {/* Repeat Visit Alert Banner if threshold reached */}
      {repeatWarning && repeatWarning.isWarning && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3.5 text-amber-950 text-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900">
              ⚠️ Peringatan Kunjungan Berulang (Ambang Batas Terpenuhi)
            </div>
            <p className="text-amber-800 leading-relaxed">
              Peserta ini telah berkunjung ke UKS sebanyak <strong>{repeatWarning.count} kali</strong> dalam 30 hari terakhir (ambang batas sekolah: {repeatWarning.threshold} kali).
            </p>
            <p className="text-[11px] text-amber-700 italic">
              * Indikator ini bertujuan untuk peninjauan kesehatan berkala oleh petugas UKS, bukan merupakan diagnosis medis.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Identitas & Pendaftaran Kunjungan (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Peserta */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Data Pengunjung UKS
              </h3>
              {participant && (
                <button
                  onClick={() => setParticipant(null)}
                  className="text-[11px] text-blue-700 hover:underline font-semibold"
                >
                  Ganti Pengunjung
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
                        ? `Siswa • ${classes.find((c) => c.id === participant.class_id)?.class_name || 'Lazuardi'}`
                        : `Karyawan • ${participant.work_unit || 'Lazuardi'}`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-500">Kontak Darurat:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {participant.emergency_contact || participant.contact_information || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">No. Telepon:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">
                      {participant.emergency_phone || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Cari siswa atau karyawan yang datang ke ruang UKS:
                </p>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama, NIS, atau NIY..."
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
                        {u.unit_code}
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

          {/* Metadata Kunjungan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Metadata Kedatangan
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nomor Kunjungan (Otomatis & Unik)
                </label>
                <input
                  type="text"
                  readOnly
                  value={visitNumber}
                  className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Tanggal & Jam Kedatangan (WIB)
                </label>
                <input
                  type="datetime-local"
                  value={visitDateTime}
                  onChange={(e) => setVisitDateTime(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Lokasi Sebelum Datang ke UKS
                </label>
                <input
                  type="text"
                  value={previousLocation}
                  onChange={(e) => setPreviousLocation(e.target.value)}
                  placeholder="Contoh: Lapangan Basket, Ruang Kelas 8, Lab Komputer..."
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pengantar / Guru Pendamping
                </label>
                <input
                  type="text"
                  value={accompanyingPerson}
                  onChange={(e) => setAccompanyingPerson(e.target.value)}
                  placeholder="Nama guru piket, wali kelas, atau teman sekelas..."
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Keluhan, Tanda Vital, Penanganan & Hasil (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Keluhan & Penyebab Kunjungan
            </h3>

            {/* Penyebab Kunjungan */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Penyebab Utama Datang ke UKS:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sakit', label: 'Sakit' },
                  { id: 'cedera', label: 'Cedera / Jatuh' },
                  { id: 'pemeriksaan_rutin', label: 'Cek Rutin' },
                  { id: 'lainnya', label: 'Lainnya' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVisitReason(item.id as VisitReason)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                      visitReason === item.id
                        ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-700/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keluhan Utama */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Keluhan Utama <span className="text-rose-600">*</span>:
              </label>
              <textarea
                rows={2}
                value={mainComplaint}
                onChange={(e) => setMainComplaint(e.target.value)}
                placeholder="Jelaskan keluhan yang dirasakan, letak sakit, intensitas..."
                className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Kronologi jika Cedera */}
            {visitReason === 'cedera' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in">
                <label className="text-xs font-bold text-amber-900 block">
                  Kronologi Singkat Kejadian / Kecelakaan:
                </label>
                <textarea
                  rows={2}
                  value={incidentChronology}
                  onChange={(e) => setIncidentChronology(e.target.value)}
                  placeholder="Ceritakan bagaimana cedera terjadi, lokasi benturan, saksi mata..."
                  className="w-full text-xs border border-amber-300 rounded-lg p-2.5 bg-white"
                />
              </div>
            )}
          </div>

          {/* PEMERIKSAAN AWAL & TANDA VITAL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-700" />
                3. Pemeriksaan Tanda Vital (Opsional Sesuai Pemeriksaan)
              </h3>
              <span className="text-[10px] text-slate-400">Kosongkan jika tidak diperiksa</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Suhu Tubuh (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Tensi Sistolik (mmHg):
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Tensi Diastolik (mmHg):
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Denyut Nadi (bpm):
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Laju Napas (/menit):
                </label>
                <input
                  type="number"
                  placeholder="20"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Saturasi Oksigen SpO2 (%):
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2"
                />
              </div>
            </div>

            {/* Tindakan Medis & Obat */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jenis Tindakan / Pertolongan yang Diberikan:
                </label>
                <textarea
                  rows={2}
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Contoh: Bersihkan luka dengan NaCl 0.9%, kompres hangat, posisikan baring..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Obat / Perlengkapan yang Diberikan:
                  </label>
                  <input
                    type="text"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    placeholder="Contoh: Paracetamol sirup, minyak kayu putih..."
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dosis & Cara Pemberian:
                  </label>
                  <input
                    type="text"
                    value={medicationDosage}
                    onChange={(e) => setMedicationDosage(e.target.value)}
                    placeholder="Contoh: 1 tablet 500mg setelah makan..."
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HASIL KUNJUNGAN & DISPOSISI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              4. Hasil Akhir Kunjungan & Disposisi
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Pilihan Hasil Kunjungan:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'beristirahat_di_uks', label: '1. Beristirahat di UKS (Kunjungan Aktif)' },
                  { id: 'kembali_ke_kelas', label: '2. Kembali ke Kelas' },
                  { id: 'kembali_bekerja', label: '3. Kembali Bekerja' },
                  { id: 'dijemput_keluarga', label: '4. Dijemput Orang Tua / Keluarga' },
                  { id: 'dipulangkan', label: '5. Dipulangkan' },
                  { id: 'dirujuk', label: '6. Dirujuk ke Klinik / RS' },
                  { id: 'pemantauan_lanjutan', label: '7. Memerlukan Pemantauan Lanjutan' },
                  { id: 'masih_dalam_penanganan', label: '8. Masih dalam Penanganan' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOutcome(item.id as VisitOutcome)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-left ${
                      outcome === item.id
                        ? 'border-blue-900 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-900/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field tambahan jika beristirahat */}
            {isRestingInUks && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Bed className="w-4 h-4 text-blue-700" />
                  Waktu Mulai Istirahat di UKS
                </div>
                <input
                  type="datetime-local"
                  value={restStartTime}
                  onChange={(e) => setRestStartTime(e.target.value)}
                  className="w-full text-xs border border-blue-300 rounded-lg p-2 bg-white"
                />
                <p className="text-[10px] text-blue-700 italic">
                  Status kunjungan akan tetap AKTIF di dashboard UKS hingga petugas melakukan checkout atau memperbarui disposisi.
                </p>
              </div>
            )}

            {/* Field tambahan jika dijemput / dipulangkan / dirujuk */}
            {(outcome === 'dijemput_keluarga' || outcome === 'dipulangkan' || outcome === 'dirujuk') && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-purple-700" />
                  Informasi Penjemputan / Rujukan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                      Nama Penjemput:
                    </label>
                    <input
                      type="text"
                      value={pickupPerson}
                      onChange={(e) => setPickupPerson(e.target.value)}
                      placeholder="Nama ayah / ibu / wali..."
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                      Hubungan:
                    </label>
                    <input
                      type="text"
                      value={pickupRelationship}
                      onChange={(e) => setPickupRelationship(e.target.value)}
                      placeholder="Ayah kandung, paman, supir..."
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                      No. Kontak Penjemput:
                    </label>
                    <input
                      type="text"
                      value={pickupContact}
                      onChange={(e) => setPickupContact(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white font-mono"
                    />
                  </div>
                </div>

                {outcome === 'dirujuk' && (
                  <div>
                    <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                      Tujuan Rujukan (Klinik / RS):
                    </label>
                    <input
                      type="text"
                      value={referralDestination}
                      onChange={(e) => setReferralDestination(e.target.value)}
                      placeholder="Contoh: RS Puri Cinere, Puskesmas Cinere..."
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                    Catatan Serah Terima / Pesan untuk Orang Tua:
                  </label>
                  <input
                    type="text"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="Siswa telah diberikan kompres, disarankan istirahat di rumah..."
                    className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Simpan sebagai Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition"
              >
                <Save className="w-4 h-4" />
                Simpan Kunjungan & Penanganan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSelectParticipant={handleSelectParticipant}
        title="Pindai Kartu UKS Pengunjung"
      />
    </div>
  );
};
