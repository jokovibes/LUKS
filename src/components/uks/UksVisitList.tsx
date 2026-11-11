/**
 * Modul B: Riwayat Kunjungan UKS & Pemantauan Kunjungan Aktif
 * Features live checkout for active visits, triage details, print slip, and Excel export.
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Bed,
  Check,
  Stethoscope,
  PhoneCall,
  Edit2,
  Trash2,
  Save,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';
import {
  UksVisit,
  UksAssessment,
  VisitReason,
  VisitOutcome,
} from '../../types/database';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface UksVisitListProps {
  onOpenRegister?: () => void;
  filterActiveOnly?: boolean;
  personalOnly?: boolean;
}

export const UksVisitList: React.FC<UksVisitListProps> = ({
  onOpenRegister,
  filterActiveOnly = false,
  personalOnly = false,
}) => {
  const { currentUser, role } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const [activeTabFilter, setActiveTabFilter] = useState<'semua' | 'aktif' | 'siswa' | 'karyawan' | 'cedera'>(
    filterActiveOnly ? 'aktif' : 'semua'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected visit for Detail or Checkout Modal
  const [selectedVisit, setSelectedVisit] = useState<UksVisit | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutOutcome, setCheckoutOutcome] = useState<VisitOutcome>('kembali_ke_kelas');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Edit & Delete Visit State
  const [editingVisit, setEditingVisit] = useState<UksVisit | null>(null);
  const [editDatetime, setEditDatetime] = useState('');
  const [editReason, setEditReason] = useState<VisitReason>('sakit');
  const [editComplaint, setEditComplaint] = useState('');
  const [editIncident, setEditIncident] = useState('');
  const [editAccompanying, setEditAccompanying] = useState('');
  const [editInitialCondition, setEditInitialCondition] = useState('');
  const [editOutcome, setEditOutcome] = useState<VisitOutcome>('beristirahat_di_uks');
  const [editStatus, setEditStatus] = useState<'aktif' | 'selesai' | 'dibatalkan'>('aktif');
  const [editTemperature, setEditTemperature] = useState<number | undefined>();
  const [editSystolic, setEditSystolic] = useState<number | undefined>();
  const [editDiastolic, setEditDiastolic] = useState<number | undefined>();
  const [editPulse, setEditPulse] = useState<number | undefined>();
  const [editOxygen, setEditOxygen] = useState<number | undefined>();
  const [editTreatment, setEditTreatment] = useState('');
  const [editMedication, setEditMedication] = useState('');
  const [editAsmNotes, setEditAsmNotes] = useState('');
  const [visitToDelete, setVisitToDelete] = useState<UksVisit | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  if (!currentUser) return null;

  const allVisits = React.useMemo(() => {
    const list = DataService.getUksVisits(currentUser);
    if (personalOnly) {
      return list.filter((v) => v.participant_id === currentUser.id);
    }
    return list;
  }, [currentUser, reloadKey, personalOnly]);
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Assessments map
  const assessmentsMap = React.useMemo(() => {
    const map = new Map<string, UksAssessment>();
    allVisits.forEach((v) => {
      const asms = DataService.getAssessmentsForVisit(v.id);
      if (asms.length > 0) map.set(v.id, asms[0]);
    });
    return map;
  }, [allVisits]);

  // Filter logic
  const filteredVisits = allVisits.filter((v) => {
    const part = v.participant;

    // Tab filter
    if (activeTabFilter === 'aktif' && v.visit_status !== 'aktif') return false;
    if (activeTabFilter === 'siswa' && part?.category !== 'siswa') return false;
    if (activeTabFilter === 'karyawan' && part?.category !== 'karyawan') return false;
    if (activeTabFilter === 'cedera' && v.visit_reason !== 'cedera') return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = part?.full_name?.toLowerCase().includes(q);
      const matchId = part?.employee_or_student_id?.toLowerCase().includes(q);
      const matchNum = v.visit_number.toLowerCase().includes(q);
      const matchComplaint = v.main_complaint.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchNum && !matchComplaint) return false;
    }

    if (selectedUnitId && part?.unit_id !== selectedUnitId) return false;
    if (selectedReason && v.visit_reason !== selectedReason) return false;
    if (selectedOutcome && v.outcome !== selectedOutcome) return false;

    if (startDate) {
      const start = new Date(startDate);
      if (new Date(v.visit_datetime) < start) return false;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      if (new Date(v.visit_datetime) > end) return false;
    }

    return true;
  });

  const activeCount = allVisits.filter((v) => v.visit_status === 'aktif').length;

  const outcomeLabelMap: Record<VisitOutcome, { label: string; color: string }> = {
    kembali_ke_kelas: { label: 'Kembali ke Kelas', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    kembali_bekerja: { label: 'Kembali Bekerja', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    beristirahat_di_uks: { label: 'Beristirahat di UKS', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    dijemput_keluarga: { label: 'Dijemput Keluarga', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    dipulangkan: { label: 'Dipulangkan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    dirujuk: { label: 'Dirujuk ke RS / Faskes', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    pemantauan_lanjutan: { label: 'Pemantauan Lanjutan', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    masih_dalam_penanganan: { label: 'Dalam Penanganan', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  };

  const handleExportExcel = () => {
    ExportService.exportUksVisitsToExcel(filteredVisits, assessmentsMap, unitMap);
  };

  const handleCheckoutSubmit = () => {
    if (!selectedVisit) return;

    DataService.saveUksVisit(
      {
        ...selectedVisit,
        visit_status: 'selesai',
        outcome: checkoutOutcome,
        checkout_datetime: new Date().toISOString(),
        handover_notes: checkoutNotes.trim()
          ? `${selectedVisit.handover_notes || ''} [Checkout]: ${checkoutNotes.trim()}`
          : selectedVisit.handover_notes,
      },
      undefined,
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setIsCheckoutModalOpen(false);
    setSelectedVisit(null);
    setCheckoutNotes('');
    setReloadKey((k) => k + 1);
  };

  const handleOpenEdit = (visit: UksVisit) => {
    setEditingVisit(visit);
    const d = new Date(visit.visit_datetime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditDatetime(localISOTime);
    setEditReason(visit.visit_reason);
    setEditComplaint(visit.main_complaint);
    setEditIncident(visit.incident_chronology || '');
    setEditAccompanying(visit.accompanying_person || '');
    setEditInitialCondition(visit.initial_condition || '');
    setEditOutcome(visit.outcome || 'beristirahat_di_uks');
    setEditStatus(visit.visit_status);

    const asm = assessmentsMap.get(visit.id);
    if (asm) {
      setEditTemperature(asm.temperature);
      setEditSystolic(asm.systolic_pressure);
      setEditDiastolic(asm.diastolic_pressure);
      setEditPulse(asm.pulse_rate);
      setEditOxygen(asm.oxygen_saturation);
      setEditTreatment(asm.treatment || '');
      setEditMedication(asm.medication_or_equipment || '');
      setEditAsmNotes(asm.notes || '');
    } else {
      setEditTemperature(undefined);
      setEditSystolic(undefined);
      setEditDiastolic(undefined);
      setEditPulse(undefined);
      setEditOxygen(undefined);
      setEditTreatment('');
      setEditMedication('');
      setEditAsmNotes('');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit || !currentUser) return;

    DataService.saveUksVisit(
      {
        id: editingVisit.id,
        participant_id: editingVisit.participant_id,
        visit_datetime: new Date(editDatetime).toISOString(),
        visit_reason: editReason,
        main_complaint: editComplaint,
        incident_chronology: editIncident,
        accompanying_person: editAccompanying,
        initial_condition: editInitialCondition,
        outcome: editOutcome,
        visit_status: editStatus,
      },
      {
        temperature: editTemperature ? Number(editTemperature) : undefined,
        systolic_pressure: editSystolic ? Number(editSystolic) : undefined,
        diastolic_pressure: editDiastolic ? Number(editDiastolic) : undefined,
        pulse_rate: editPulse ? Number(editPulse) : undefined,
        oxygen_saturation: editOxygen ? Number(editOxygen) : undefined,
        treatment: editTreatment,
        medication_or_equipment: editMedication,
        notes: editAsmNotes,
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setEditingVisit(null);
    setReloadKey((k) => k + 1);
    if (selectedVisit && selectedVisit.id === editingVisit.id) {
      setSelectedVisit(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!visitToDelete || !currentUser) return;
    DataService.deleteUksVisit(visitToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setVisitToDelete(null);
    if (selectedVisit && selectedVisit.id === visitToDelete.id) {
      setSelectedVisit(null);
    }
    setReloadKey((k) => k + 1);
  };

  const handleImportVisits = (rows: string[][]): { successCount: number; errors: string[] } => {
    let successCount = 0;
    const errors: string[] = [];
    const profiles = DataService.getProfiles();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const nisNiy = row[0]?.trim() || '';
      const patientName = row[1]?.trim() || '';
      const dateStr = row[2]?.trim() || '';
      const reasonRaw = row[3]?.trim().toLowerCase() || 'sakit';
      const complaint = row[4]?.trim() || '';
      const location = row[5]?.trim() || '';
      const companion = row[6]?.trim() || '';
      const tempRaw = row[7]?.trim() || '';
      const bpRaw = row[8]?.trim() || '';
      const pulseRaw = row[9]?.trim() || '';
      const oxygenRaw = row[10]?.trim() || '';
      const treatment = row[11]?.trim() || '';
      const medication = row[12]?.trim() || '';
      const outcomeRaw = row[13]?.trim().toLowerCase() || 'kembali_ke_kelas';
      const examinerName = row[14]?.trim() || currentUser?.full_name || 'Petugas UKS';

      if (!nisNiy && !patientName) {
        errors.push(`Baris ${rowNum}: NIS/NIY atau Nama Pasien wajib diisi.`);
        return;
      }

      // Find participant profile
      let participant = profiles.find(
        (p) =>
          (nisNiy && p.employee_or_student_id?.toLowerCase() === nisNiy.toLowerCase()) ||
          (patientName && p.full_name.toLowerCase() === patientName.toLowerCase())
      );

      // If participant not found, auto-create participant profile
      if (!participant && currentUser) {
        const isEmployee = nisNiy.toUpperCase().includes('NIY') || nisNiy.toUpperCase().includes('NIP');
        participant = DataService.saveProfile(
          {
            id: `user-csv-${Date.now()}-${idx}`,
            full_name: patientName || nisNiy,
            employee_or_student_id: nisNiy || `ID-${Date.now()}`,
            email: `${(nisNiy || patientName).toLowerCase().replace(/[^a-z0-9]/g, '')}@lazuardi.sch.id`,
            role: isEmployee ? 'karyawan' : 'siswa',
            category: isEmployee ? 'karyawan' : 'siswa',
            unit_id: units[0]?.id || 'unit-sd',
            gender: 'L',
            is_active: true,
          },
          { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
        );
      }

      if (!participant) {
        errors.push(`Baris ${rowNum}: Pasien tidak ditemukan dan gagal dibuat.`);
        return;
      }

      // Parse datetime
      let visitDateTime = new Date().toISOString();
      if (dateStr) {
        const parsedD = new Date(dateStr);
        if (!isNaN(parsedD.getTime())) {
          visitDateTime = parsedD.toISOString();
        }
      }

      // Normalize reason to valid VisitReason
      let reason: VisitReason = 'sakit';
      if (reasonRaw.includes('cedera') || reasonRaw.includes('insiden') || reasonRaw.includes('luka')) {
        reason = 'cedera';
      } else if (reasonRaw.includes('rutin') || reasonRaw.includes('skrining')) {
        reason = 'pemeriksaan_rutin';
      } else if (reasonRaw.includes('istirahat') || reasonRaw.includes('konsultasi') || reasonRaw.includes('lainnya')) {
        reason = 'lainnya';
      }

      // Normalize outcome to valid VisitOutcome
      let outcome: VisitOutcome = 'kembali_ke_kelas';
      if (outcomeRaw.includes('bekerja') || outcomeRaw.includes('kantor')) {
        outcome = 'kembali_bekerja';
      } else if (outcomeRaw.includes('istirahat') || outcomeRaw.includes('bed')) {
        outcome = 'beristirahat_di_uks';
      } else if (outcomeRaw.includes('jemput') || outcomeRaw.includes('orang_tua') || outcomeRaw.includes('keluarga')) {
        outcome = 'dijemput_keluarga';
      } else if (outcomeRaw.includes('pulang') || outcomeRaw.includes('dipulangkan')) {
        outcome = 'dipulangkan';
      } else if (outcomeRaw.includes('rujuk') || outcomeRaw.includes('faskes') || outcomeRaw.includes('rs')) {
        outcome = 'dirujuk';
      }

      // Parse blood pressure
      let systolic: number | undefined;
      let diastolic: number | undefined;
      if (bpRaw.includes('/')) {
        const [sys, dia] = bpRaw.split('/').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(sys)) systolic = sys;
        if (!isNaN(dia)) diastolic = dia;
      }

      const tempNum = tempRaw ? parseFloat(tempRaw.replace(',', '.')) : undefined;
      const pulseNum = pulseRaw ? parseInt(pulseRaw, 10) : undefined;
      const oxygenNum = oxygenRaw ? parseInt(oxygenRaw, 10) : undefined;

      // Save visit and assessment
      DataService.saveUksVisit(
        {
          participant_id: participant.id,
          visit_datetime: visitDateTime,
          main_complaint: complaint || 'Pemeriksaan UKS',
          visit_reason: reason,
          incident_chronology: location || undefined,
          accompanying_person: companion || undefined,
          outcome: outcome,
          visit_status: outcome === 'beristirahat_di_uks' ? 'aktif' : 'selesai',
          handling_staff_name: examinerName,
        },
        {
          temperature: !isNaN(tempNum as number) ? tempNum : undefined,
          systolic_pressure: systolic,
          diastolic_pressure: diastolic,
          pulse_rate: !isNaN(pulseNum as number) ? pulseNum : undefined,
          oxygen_saturation: !isNaN(oxygenNum as number) ? oxygenNum : undefined,
          treatment: treatment || undefined,
          medication_or_equipment: medication || undefined,
        },
        {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        }
      );

      successCount++;
    });

    setReloadKey((k) => k + 1);
    return { successCount, errors };
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle="LAPORAN BUKU REGISTER & RIWAYAT KUNJUNGAN UKS"
          documentSubtitle={`Rekapitulasi Kunjungan, Pemeriksaan Fisik, & Disposisi Pasien UKS • Total ${filteredVisits.length} Data`}
          documentNumber={`LUKS-VST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        />
      </div>

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <span>
              {personalOnly ? 'Riwayat Kunjungan UKS Saya' : 'Pencatatan & Riwayat Kunjungan UKS'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {personalOnly
              ? `Catatan riwayat kunjungan ke ruang UKS sekolah untuk akun: ${currentUser.full_name} (${currentUser.employee_or_student_id})`
              : 'Manajemen alur kedatangan, penanganan keluhan, observasi tanda vital, dan disposisi kepulangan.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              ExportService.downloadUksVisitsPdf(
                filteredVisits,
                assessmentsMap,
                unitMap,
                personalOnly
                  ? `Catatan Kunjungan UKS - ${currentUser.full_name}`
                  : `Buku Register Kunjungan UKS (${filteredVisits.length} Catatan)`
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Download PDF Riwayat
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>

          {!personalOnly && (role === 'petugas_uks' || role === 'admin') && (
            <>
              <button
                type="button"
                onClick={() => CsvService.downloadUksVisitsTemplateCsv()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition border border-slate-200"
                title="Unduh contoh format CSV Kunjungan UKS"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Format CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV Kunjungan</span>
              </button>
            </>
          )}

          {!personalOnly && (role === 'petugas_uks' || role === 'admin') && onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Kunjungan Baru
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 no-print">
        {[
          { id: 'semua', label: 'Semua Kunjungan' },
          { id: 'aktif', label: `Kunjungan Aktif (${activeCount})`, alert: activeCount > 0 },
          { id: 'siswa', label: 'Siswa' },
          { id: 'karyawan', label: 'Karyawan' },
          { id: 'cedera', label: 'Cedera / Insiden' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTabFilter === tab.id
                ? 'bg-white text-blue-950 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
            {tab.alert && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIS, NIY, keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Unit Sekolah</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} - {u.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Penyebab</option>
              <option value="sakit">Sakit</option>
              <option value="cedera">Cedera / Insiden</option>
              <option value="pemeriksaan_rutin">Cek Rutin</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Hasil Akhir</option>
              <option value="kembali_ke_kelas">Kembali ke Kelas</option>
              <option value="kembali_bekerja">Kembali Bekerja</option>
              <option value="beristirahat_di_uks">Beristirahat di UKS</option>
              <option value="dijemput_keluarga">Dijemput Keluarga</option>
              <option value="dipulangkan">Dipulangkan</option>
              <option value="dirujuk">Dirujuk ke Faskes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Visits */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Kunjungan</th>
                <th className="py-3.5 px-4">Waktu Datang</th>
                <th className="py-3.5 px-4">Pengunjung</th>
                <th className="py-3.5 px-4">Penyebab & Keluhan</th>
                <th className="py-3.5 px-4">Tanda Vital</th>
                <th className="py-3.5 px-4">Hasil Penanganan</th>
                <th className="py-3.5 px-4">Petugas</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Tidak ada catatan kunjungan UKS yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => {
                  const part = visit.participant;
                  const asm = assessmentsMap.get(visit.id);
                  const isAktif = visit.visit_status === 'aktif';

                  return (
                    <tr
                      key={visit.id}
                      className={`hover:bg-blue-50/40 transition ${
                        isAktif ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-900">{visit.visit_number}</div>
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            Sedang Beristirahat
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Selesai</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(visit.visit_datetime).toLocaleDateString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        •{' '}
                        {new Date(visit.visit_datetime).toLocaleTimeString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{part?.full_name || '-'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {part?.employee_or_student_id} • {part?.category === 'siswa' ? 'Siswa' : 'Karyawan'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5">
                          {visit.visit_reason}
                        </span>
                        <span className="text-slate-800">{visit.main_complaint}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {asm ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {asm.temperature && <div>Suhu: {asm.temperature}°C</div>}
                            {asm.systolic_pressure && (
                              <div>TD: {asm.systolic_pressure}/{asm.diastolic_pressure}</div>
                            )}
                            {asm.oxygen_saturation && <div>SpO2: {asm.oxygen_saturation}%</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {visit.outcome ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              outcomeLabelMap[visit.outcome]?.color || 'bg-slate-100'
                            }`}
                          >
                            {outcomeLabelMap[visit.outcome]?.label || visit.outcome}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Dalam Penanganan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {visit.handling_staff_name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAktif && (role === 'petugas_uks' || role === 'admin') && (
                            <button
                              onClick={() => {
                                setSelectedVisit(visit);
                                setIsCheckoutModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition shadow-2xs"
                              title="Checkout / Selesaikan Istirahat"
                            >
                              Checkout
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedVisit(visit)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-900 rounded-lg transition"
                            title="Detail Kunjungan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(role === 'petugas_uks' || role === 'admin') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(visit)}
                                className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition"
                                title="Ubah Data Kunjungan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setVisitToDelete(visit)}
                                className="p-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition"
                                title="Hapus Kunjungan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedVisit(visit);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-purple-700 rounded-lg transition"
                            title="Cetak Ringkasan"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Menampilkan {filteredVisits.length} catatan kunjungan UKS</span>
          <span className="font-semibold text-slate-700">
            Kunjungan aktif saat ini: {activeCount} orang
          </span>
        </div>
      </div>

      {/* MODAL 1: Detail Kunjungan */}
      {selectedVisit && !isCheckoutModalOpen && !isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Detail Kunjungan & Penanganan UKS</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedVisit.visit_number}</p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Nama Pengunjung:</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedVisit.participant?.full_name}</div>
                </div>
                <div>
                  <span className="text-slate-500">NIS / NIY:</span>
                  <div className="font-mono font-bold text-slate-900">{selectedVisit.participant?.employee_or_student_id}</div>
                </div>
                <div>
                  <span className="text-slate-500">Waktu Kedatangan:</span>
                  <div className="font-semibold text-slate-800">
                    {new Date(selectedVisit.visit_datetime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Lokasi Sebelumnya:</span>
                  <div className="font-semibold text-slate-800">{selectedVisit.previous_location || '-'}</div>
                </div>
              </div>

              {/* Complaint & Incident */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Keluhan Utama:</div>
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-slate-800">
                  {selectedVisit.main_complaint}
                </div>
                {selectedVisit.incident_chronology && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="font-bold text-amber-900">Kronologi Kejadian:</span>
                    <p className="text-amber-800">{selectedVisit.incident_chronology}</p>
                  </div>
                )}
              </div>

              {/* Assessment / Vitals */}
              {(() => {
                const asm = assessmentsMap.get(selectedVisit.id);
                if (!asm) return null;
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-700" />
                      Hasil Pemeriksaan Tanda Vital & Penanganan
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {asm.temperature && (
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">Suhu</div>
                          <div className="font-mono font-bold text-slate-900">{asm.temperature}°C</div>
                        </div>
                      )}
                      {asm.systolic_pressure && (
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">Tekanan Darah</div>
                          <div className="font-mono font-bold text-slate-900">
                            {asm.systolic_pressure}/{asm.diastolic_pressure}
                          </div>
                        </div>
                      )}
                      {asm.pulse_rate && (
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-500">Nadi</div>
                          <div className="font-mono font-bold text-slate-900">{asm.pulse_rate} bpm</div>
                        </div>
                      )}
                    </div>
                    {asm.treatment && (
                      <div>
                        <span className="font-semibold text-slate-600">Tindakan Pertolongan:</span>
                        <p className="text-slate-800 mt-0.5">{asm.treatment}</p>
                      </div>
                    )}
                    {asm.medication_or_equipment && (
                      <div>
                        <span className="font-semibold text-slate-600">Obat / Perlengkapan Diberikan:</span>
                        <p className="text-slate-800 mt-0.5">{asm.medication_or_equipment} ({asm.medication_dosage || 'Sesuai SOP'})</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Outcome & Checkout */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950">Hasil Akhir:</span>
                  <span className="font-bold text-purple-900 capitalize">
                    {selectedVisit.outcome ? outcomeLabelMap[selectedVisit.outcome]?.label : 'Dalam Penanganan'}
                  </span>
                </div>
                {selectedVisit.checkout_datetime && (
                  <div className="text-[11px] text-purple-800">
                    Waktu Checkout: {new Date(selectedVisit.checkout_datetime).toLocaleTimeString('id-ID')} WIB
                  </div>
                )}
                {selectedVisit.pickup_person && (
                  <div className="text-[11px] text-purple-800">
                    Dijemput oleh: {selectedVisit.pickup_person} ({selectedVisit.pickup_relationship || 'Keluarga'}) - Telp: {selectedVisit.pickup_contact || '-'}
                  </div>
                )}
                {selectedVisit.handover_notes && (
                  <div className="text-[11px] text-purple-800">
                    Catatan Serah Terima: {selectedVisit.handover_notes}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {(role === 'petugas_uks' || role === 'admin') && (
                  <>
                    <button
                      onClick={() => {
                        const v = selectedVisit;
                        setSelectedVisit(null);
                        handleOpenEdit(v);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah Data
                    </button>
                    <button
                      onClick={() => {
                        const v = selectedVisit;
                        setSelectedVisit(null);
                        setVisitToDelete(v);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout Kunjungan Aktif */}
      {selectedVisit && isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Checkout Kunjungan UKS</h3>
                <p className="text-xs text-amber-100">{selectedVisit.visit_number} - {selectedVisit.participant?.full_name}</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 text-amber-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Pilih Hasil Disposisi Akhir:
                </label>
                <select
                  value={checkoutOutcome}
                  onChange={(e) => setCheckoutOutcome(e.target.value as VisitOutcome)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                >
                  <option value="kembali_ke_kelas">Kembali ke Kelas</option>
                  <option value="kembali_bekerja">Kembali Bekerja</option>
                  <option value="dijemput_keluarga">Dijemput Orang Tua / Keluarga</option>
                  <option value="dipulangkan">Dipulangkan</option>
                  <option value="dirujuk">Dirujuk ke Klinik / RS</option>
                  <option value="pemantauan_lanjutan">Memerlukan Pemantauan Lanjutan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Catatan Serah Terima / Kondisi Saat Checkout:
                </label>
                <textarea
                  rows={3}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Contoh: Kondisi membaik setelah istirahat 45 menit, suhu turun menjadi 36.6°C, diizinkan kembali ke kelas..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleCheckoutSubmit}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Konfirmasi Selesai & Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Visit Slip */}
      {selectedVisit && isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-8 my-8 print:p-0 print:border-none print:shadow-none print:w-full">
            <div className="flex justify-between items-center mb-4 no-print">
              <span className="text-xs font-bold text-slate-400 uppercase">Pratinjau Lembar Kunjungan UKS</span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 text-slate-900 font-sans">
              <SchoolLetterhead
                documentTitle="SURAT RINGKASAN KUNJUNGAN & PENANGANAN UKS"
                documentSubtitle="Unit Kesehatan Sekolah (UKS) Terpadu"
                documentNumber={selectedVisit.visit_number}
              />

              <div className="space-y-4 text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600 w-44">Nama Pengunjung</td>
                      <td className="py-1.5 font-bold">{selectedVisit.participant?.full_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Nomor Identitas (NIS/NIY)</td>
                      <td className="py-1.5 font-mono">{selectedVisit.participant?.employee_or_student_id}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Waktu Kedatangan</td>
                      <td className="py-1.5">
                        {new Date(selectedVisit.visit_datetime).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                        })}{' '}
                        WIB
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Penyebab Kunjungan</td>
                      <td className="py-1.5 font-bold uppercase text-blue-900">{selectedVisit.visit_reason}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Keluhan Utama</td>
                      <td className="py-1.5">{selectedVisit.main_complaint}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Hasil Penanganan / Disposisi</td>
                      <td className="py-1.5 font-bold">
                        {selectedVisit.outcome ? outcomeLabelMap[selectedVisit.outcome]?.label : 'Dalam Observasi'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-slate-600">Catatan Serah Terima</td>
                      <td className="py-1.5">{selectedVisit.handover_notes || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 pt-8 text-center text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px]">Orang Tua / Penjemput / Wali,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-800">
                      ( {selectedVisit.pickup_person || selectedVisit.participant?.full_name} )
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">
                      Depok, {new Date(selectedVisit.visit_datetime).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-slate-500 text-[11px]">Petugas UKS yang Menangani,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-800">
                      ( {selectedVisit.handling_staff_name} )
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2 no-print">
              <button
                onClick={() => ExportService.printCurrentView()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-800 transition"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ubah / Edit Kunjungan UKS */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Ubah Catatan Kunjungan UKS</h3>
                <p className="text-xs text-rose-200 font-mono">
                  {editingVisit.visit_number} • {editingVisit.participant?.full_name}
                </p>
              </div>
              <button
                onClick={() => setEditingVisit(null)}
                className="p-1.5 text-rose-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Row 1: Datetime & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Datang *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDatetime}
                    onChange={(e) => setEditDatetime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penyebab Kunjungan *</label>
                  <select
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value as VisitReason)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="sakit">Sakit</option>
                    <option value="cedera">Cedera / Insiden Fisik</option>
                    <option value="pemeriksaan_rutin">Pemeriksaan Rutin</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Keluhan & Kronologi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Keluhan Utama *</label>
                <input
                  type="text"
                  required
                  value={editComplaint}
                  onChange={(e) => setEditComplaint(e.target.value)}
                  placeholder="Contoh: Pusing berputar, luka lecet di lutut kanan..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              {editReason === 'cedera' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kronologi Kejadian Cedera</label>
                  <textarea
                    rows={2}
                    value={editIncident}
                    onChange={(e) => setEditIncident(e.target.value)}
                    placeholder="Lokasi dan kronologi insiden..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white resize-none"
                  />
                </div>
              )}

              {/* Tanda-tanda Vital */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-800 text-[11px] block">Observasi Tanda Vital</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Suhu (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={editTemperature ?? ''}
                      onChange={(e) => setEditTemperature(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tekanan Darah</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="120"
                        value={editSystolic ?? ''}
                        onChange={(e) => setEditSystolic(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="80"
                        value={editDiastolic ?? ''}
                        onChange={(e) => setEditDiastolic(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Nadi (x/mnt)</label>
                    <input
                      type="number"
                      placeholder="80"
                      value={editPulse ?? ''}
                      onChange={(e) => setEditPulse(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="98"
                      value={editOxygen ?? ''}
                      onChange={(e) => setEditOxygen(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tindakan & Obat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tindakan / Penanganan</label>
                  <input
                    type="text"
                    value={editTreatment}
                    onChange={(e) => setEditTreatment(e.target.value)}
                    placeholder="Contoh: Kompres hangat, istirahat..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Obat / Perlengkapan</label>
                  <input
                    type="text"
                    value={editMedication}
                    onChange={(e) => setEditMedication(e.target.value)}
                    placeholder="Contoh: Paracetamol 500mg, Betadine..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              </div>

              {/* Status & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Kunjungan *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'aktif' | 'selesai' | 'dibatalkan')}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="aktif">Sedang Beristirahat (Aktif)</option>
                    <option value="selesai">Selesai / Sudah Checkout</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hasil Akhir Penanganan *</label>
                  <select
                    value={editOutcome}
                    onChange={(e) => setEditOutcome(e.target.value as VisitOutcome)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="beristirahat_di_uks">Beristirahat di UKS</option>
                    <option value="kembali_ke_kelas">Kembali ke Kelas</option>
                    <option value="kembali_bekerja">Kembali Bekerja</option>
                    <option value="dijemput_keluarga">Dijemput Keluarga</option>
                    <option value="dipulangkan">Dipulangkan</option>
                    <option value="dirujuk">Dirujuk ke RS / Faskes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Konfirmasi Hapus Kunjungan UKS */}
      {visitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Kunjungan</h3>
                <p className="text-[11px] text-slate-500">Kunjungan UKS</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus data kunjungan UKS berikut?</p>
              <div className="font-bold text-slate-900">{visitToDelete.participant?.full_name}</div>
              <div className="text-[11px] font-mono text-slate-600">
                No: {visitToDelete.visit_number} • Keluhan: {visitToDelete.main_complaint}
              </div>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Data pemeriksaan vital dan tindakan terkait kunjungan ini juga akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVisitToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal Kunjungan UKS */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Kunjungan UKS Massal (CSV)"
        description="Unggah berkas CSV untuk mencatat data riwayat kedatangan pasien UKS, keluhan, tanda vital, tindakan medis, dan disposisi sekaligus."
        expectedHeaders={[
          'NIS/NIY Pasien',
          'Nama Pasien',
          'Tanggal (YYYY-MM-DD HH:MM)',
          'Alasan Kunjungan',
          'Keluhan Utama',
          'Lokasi Kejadian',
          'Pengantar',
          'Suhu (°C)',
          'Tensi Darah',
          'Detak Nadi',
          'SpO2 (%)',
          'Tindakan',
          'Obat Diberikan',
          'Disposisi',
          'Pemeriksa',
        ]}
        sampleDownloadFn={() => CsvService.downloadUksVisitsTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format CSV Kunjungan UKS"
        onImport={handleImportVisits}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
};
