/**
 * Modul A: Riwayat Pemeriksaan Gula Darah Siswa & Karyawan
 * Features multi-parameter filtering, individual trend line chart (Recharts),
 * comparison against previous records, and printable slip preview.
 */

import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  Clock,
  Eye,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  ChevronRight,
  Info,
  Edit2,
  Trash2,
  Save,
  Upload,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';
import {
  GlucoseExamination,
  GlucoseClassification,
  GlucoseExamType,
  UserProfile,
} from '../../types/database';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface GlucoseExamListProps {
  onOpenRegister?: () => void;
  personalOnly?: boolean;
}

export const GlucoseExamList: React.FC<GlucoseExamListProps> = ({
  onOpenRegister,
  personalOnly = false,
}) => {
  const { currentUser, role } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected exam for Detail Modal or Print Slip
  const [selectedExam, setSelectedExam] = useState<GlucoseExamination | null>(null);
  const [trendParticipant, setTrendParticipant] = useState<UserProfile | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Edit & Delete State
  const [editingExam, setEditingExam] = useState<GlucoseExamination | null>(null);
  const [editDatetime, setEditDatetime] = useState('');
  const [editType, setEditType] = useState<GlucoseExamType>('sewaktu');
  const [editValue, setEditValue] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');
  const [editFastingHours, setEditFastingHours] = useState<number | undefined>();
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editDevice, setEditDevice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [examToDelete, setExamToDelete] = useState<GlucoseExamination | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  if (!currentUser) return null;

  // Retrieve examinations with RLS check
  const allExams = React.useMemo(() => {
    const list = DataService.getGlucoseExaminations(currentUser);
    if (personalOnly) {
      return list.filter((e) => e.participant_id === currentUser.id);
    }
    return list;
  }, [currentUser, reloadKey, personalOnly]);
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Apply filters
  const filteredExams = allExams.filter((exam) => {
    const part = exam.participant;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = part?.full_name?.toLowerCase().includes(q);
      const matchId = part?.employee_or_student_id?.toLowerCase().includes(q);
      const matchExamNum = exam.examination_number.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchExamNum) return false;
    }

    if (selectedUnitId && part?.unit_id !== selectedUnitId) return false;
    if (selectedType && exam.examination_type !== selectedType) return false;
    if (selectedClassification && exam.classification !== selectedClassification) return false;
    if (selectedStatus && exam.record_status !== selectedStatus) return false;

    if (startDate) {
      const start = new Date(startDate);
      if (new Date(exam.examination_datetime) < start) return false;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      if (new Date(exam.examination_datetime) > end) return false;
    }

    return true;
  });

  const classificationColorMap: Record<GlucoseClassification, { bg: string; text: string; label: string }> = {
    normal: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-800', label: 'Normal' },
    perlu_perhatian: { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-800', label: 'Perlu Perhatian' },
    pemantauan: { bg: 'bg-orange-100 text-orange-800 border-orange-200', text: 'text-orange-800', label: 'Pemantauan' },
    tindak_lanjut: { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-800', label: 'Tindak Lanjut' },
    belum_diklasifikasikan: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'Belum Klasifikasi' },
  };

  const typeLabelMap: Record<GlucoseExamType, string> = {
    puasa: 'Puasa (GDP)',
    sewaktu: 'Sewaktu (GDS)',
    setelah_makan: 'Setelah Makan (GD2PP)',
  };

  const handleExportExcel = () => {
    ExportService.exportGlucoseExaminationsToExcel(filteredExams, unitMap);
  };

  // Prepare trend data for a participant
  const getParticipantTrendData = (partId: string) => {
    return allExams
      .filter((e) => e.participant_id === partId && e.record_status === 'resmi')
      .sort((a, b) => new Date(a.examination_datetime).getTime() - new Date(b.examination_datetime).getTime())
      .map((e) => ({
        date: new Date(e.examination_datetime).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        }),
        fullDate: new Date(e.examination_datetime).toLocaleString('id-ID'),
        value: e.result_value,
        unit: e.result_unit,
        type: typeLabelMap[e.examination_type],
        number: e.examination_number,
      }));
  };

  // Find previous checkup for comparison
  const getPreviousExam = (currentExam: GlucoseExamination) => {
    const sorted = allExams
      .filter(
        (e) =>
          e.participant_id === currentExam.participant_id &&
          new Date(e.examination_datetime) < new Date(currentExam.examination_datetime)
      )
      .sort((a, b) => new Date(b.examination_datetime).getTime() - new Date(a.examination_datetime).getTime());
    return sorted[0];
  };

  const handleOpenEdit = (exam: GlucoseExamination) => {
    setEditingExam(exam);
    const d = new Date(exam.examination_datetime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditDatetime(localISOTime);
    setEditType(exam.examination_type);
    setEditValue(exam.result_value);
    setEditUnit(exam.result_unit);
    setEditFastingHours(exam.fasting_duration_hours);
    setEditSymptoms(exam.symptoms || '');
    setEditCondition(exam.participant_condition || '');
    setEditDevice(exam.device_name || 'Accu-Chek Instant #UKS-01');
    setEditNotes(exam.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !currentUser) return;
    DataService.saveGlucoseExamination(
      {
        id: editingExam.id,
        examination_datetime: new Date(editDatetime).toISOString(),
        examination_type: editType,
        result_value: Number(editValue),
        result_unit: editUnit,
        fasting_duration_hours: editType === 'puasa' ? Number(editFastingHours) || undefined : undefined,
        symptoms: editSymptoms,
        participant_condition: editCondition,
        device_name: editDevice,
        notes: editNotes,
      },
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
    );
    setEditingExam(null);
    setReloadKey((prev) => prev + 1);
    if (selectedExam && selectedExam.id === editingExam.id) {
      setSelectedExam(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!examToDelete || !currentUser) return;
    DataService.deleteGlucoseExamination(examToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setExamToDelete(null);
    if (selectedExam && selectedExam.id === examToDelete.id) {
      setSelectedExam(null);
    }
    setReloadKey((prev) => prev + 1);
  };

  const handleImportGlucoseExams = (rows: string[][]): { successCount: number; errors: string[] } => {
    let successCount = 0;
    const errors: string[] = [];
    const profiles = DataService.getProfiles();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const nisNiy = row[0]?.trim() || '';
      const patientName = row[1]?.trim() || '';
      const dateStr = row[2]?.trim() || '';
      const typeRaw = row[3]?.trim().toLowerCase() || 'sewaktu';
      const valueRaw = row[4]?.trim() || '';
      const unitRaw = row[5]?.trim() || 'mg/dL';
      const fastingRaw = row[6]?.trim() || '';
      const symptoms = row[7]?.trim() || '';
      const condition = row[8]?.trim() || '';
      const device = row[9]?.trim() || '';
      const examinerName = row[10]?.trim() || currentUser?.full_name || 'Petugas UKS';
      const notes = row[11]?.trim() || '';

      if (!nisNiy && !patientName) {
        errors.push(`Baris ${rowNum}: NIS/NIY atau Nama Peserta wajib diisi.`);
        return;
      }

      const numVal = parseFloat(valueRaw.replace(',', '.'));
      if (isNaN(numVal) || numVal <= 0) {
        errors.push(`Baris ${rowNum}: Hasil Glukosa harus berupa angka valid (contoh: 95, 110).`);
        return;
      }

      // Find participant
      let participant = profiles.find(
        (p) =>
          (nisNiy && p.employee_or_student_id?.toLowerCase() === nisNiy.toLowerCase()) ||
          (patientName && p.full_name.toLowerCase() === patientName.toLowerCase())
      );

      // Auto-create participant profile if not found
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
        errors.push(`Baris ${rowNum}: Peserta tidak ditemukan dan gagal dibuat.`);
        return;
      }

      // Parse datetime
      let examDateTime = new Date().toISOString();
      if (dateStr) {
        const parsedD = new Date(dateStr);
        if (!isNaN(parsedD.getTime())) {
          examDateTime = parsedD.toISOString();
        }
      }

      // Normalize type
      let examType: GlucoseExamType = 'sewaktu';
      if (typeRaw.includes('puasa') || typeRaw === 'gdp') {
        examType = 'puasa';
      } else if (typeRaw.includes('setelah') || typeRaw.includes('makan') || typeRaw === 'gd2pp') {
        examType = 'setelah_makan';
      }

      const fastingHours = fastingRaw ? parseInt(fastingRaw, 10) : undefined;
      const unit = unitRaw.toLowerCase().includes('mmol') ? 'mmol/L' : 'mg/dL';

      // Save glucose exam (classification is automatically evaluated by DataService)
      DataService.saveGlucoseExamination(
        {
          participant_id: participant.id,
          examination_datetime: examDateTime,
          examination_type: examType,
          result_value: numVal,
          result_unit: unit,
          fasting_duration_hours: !isNaN(fastingHours as number) ? fastingHours : undefined,
          symptoms: symptoms || undefined,
          participant_condition: condition || undefined,
          device_name: device || 'Accu-Chek Instant',
          examiner_name: examinerName,
          notes: notes || undefined,
          record_status: 'resmi',
        },
        { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
      );

      successCount++;
    });

    setReloadKey((prev) => prev + 1);
    return { successCount, errors };
  };

  return (
    <div className="space-y-6">
      {/* Printable Letterhead (Only visible in Print/PDF export) */}
      <div className="hidden print-only">
        <SchoolLetterhead
          documentTitle="LAPORAN RIWAYAT PEMERIKSAAN GULA DARAH"
          documentSubtitle={`Rekapitulasi Skrining Glukosa Darah Siswa & Karyawan • Total ${filteredExams.length} Data`}
          documentNumber={`LUKS-GLU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
        />
      </div>

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>
              {personalOnly ? 'Riwayat Pemeriksaan Gula Darah Saya' : 'Riwayat Pemeriksaan Gula Darah'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {personalOnly
              ? `Rekam medis pemeriksaan gula darah pribadi untuk akun: ${currentUser.full_name} (${currentUser.employee_or_student_id})`
              : 'Daftar pemeriksaan, tren glukosa berulang, dan status tindak lanjut kesehatan sekolah.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              ExportService.downloadGlucoseExaminationsPdf(
                filteredExams,
                unitMap,
                personalOnly
                  ? `Rekam Medis Gula Darah - ${currentUser.full_name}`
                  : `Data Skrining Gula Darah (${filteredExams.length} Catatan)`
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
                onClick={() => CsvService.downloadGlucoseExaminationsTemplateCsv()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition border border-slate-200"
                title="Unduh contoh format CSV Pemeriksaan Gula Darah"
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
                <span>Import CSV Gula Darah</span>
              </button>
            </>
          )}

          {!personalOnly && (role === 'petugas_uks' || role === 'admin') && onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Pemeriksaan Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, NIS, NIY, nomor tes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Tes */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Jenis Tes</option>
              <option value="puasa">Puasa (GDP)</option>
              <option value="sewaktu">Sewaktu (GDS)</option>
              <option value="setelah_makan">2 Jam PP</option>
            </select>
          </div>

          {/* Klasifikasi */}
          <div>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Klasifikasi</option>
              <option value="normal">Normal</option>
              <option value="perlu_perhatian">Perlu Perhatian</option>
              <option value="pemantauan">Pemantauan</option>
              <option value="tindak_lanjut">Tindak Lanjut</option>
            </select>
          </div>

          {/* Status Record */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="resmi">Resmi</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Date Range Sub-row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-[11px] text-slate-500">Rentang Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
          />
          <span>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
          />
          {(searchQuery || selectedUnitId || selectedType || selectedClassification || selectedStatus || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedUnitId('');
                setSelectedType('');
                setSelectedClassification('');
                setSelectedStatus('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-blue-700 hover:underline font-semibold ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table of Results */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Pemeriksaan</th>
                <th className="py-3.5 px-4">Tanggal & Jam (WIB)</th>
                <th className="py-3.5 px-4">Nama Peserta</th>
                <th className="py-3.5 px-4">Jenis Tes</th>
                <th className="py-3.5 px-4 text-right">Hasil Pengukuran</th>
                <th className="py-3.5 px-4">Klasifikasi</th>
                <th className="py-3.5 px-4">Pemeriksa</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Tidak ada catatan pemeriksaan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const part = exam.participant;
                  const unitName = part?.unit_id ? unitMap.get(part.unit_id) || '' : '';
                  return (
                    <tr key={exam.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                        {exam.examination_number}
                        {exam.record_status === 'draft' && (
                          <span className="ml-1 text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-sans">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(exam.examination_datetime).toLocaleDateString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(exam.examination_datetime).toLocaleTimeString('id-ID', {
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
                      <td className="py-3.5 px-4 text-slate-700">
                        {typeLabelMap[exam.examination_type]}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {exam.result_value}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500">{exam.result_unit}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            classificationColorMap[exam.classification].bg
                          }`}
                        >
                          {classificationColorMap[exam.classification].label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {exam.examiner_name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedExam(exam)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-900 rounded-lg transition"
                            title="Lihat Detail & Perbandingan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(role === 'petugas_uks' || role === 'admin') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(exam)}
                                className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition"
                                title="Ubah Pemeriksaan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setExamToDelete(exam)}
                                className="p-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition"
                                title="Hapus Pemeriksaan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {part && (
                            <button
                              onClick={() => setTrendParticipant(part)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition"
                              title="Grafik Tren Peserta"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedExam(exam);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-purple-700 rounded-lg transition"
                            title="Cetak Slip Hasil"
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

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Menampilkan {filteredExams.length} dari total {allExams.length} data pemeriksaan</span>
          <div className="text-[11px] text-slate-400">
            * Seluruh interpretasi klinis harus dikonfirmasi oleh tenaga kesehatan berwenang.
          </div>
        </div>
      </div>

      {/* MODAL 1: Detail Pemeriksaan & Perbandingan dengan Sebelumnya */}
      {selectedExam && !isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Detail Pemeriksaan Gula Darah</h3>
                <p className="text-xs text-sky-200 font-mono">{selectedExam.examination_number}</p>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Participant Profile Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Nama Peserta:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedExam.participant?.full_name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">NIS / NIY:</span>
                  <div className="font-mono font-bold text-slate-900">
                    {selectedExam.participant?.employee_or_student_id}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Kategori:</span>
                  <div className="capitalize font-semibold text-slate-800">
                    {selectedExam.participant?.category}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Waktu Pemeriksaan:</span>
                  <div className="font-semibold text-slate-800">
                    {new Date(selectedExam.examination_datetime).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                    })}{' '}
                    WIB
                  </div>
                </div>
              </div>

              {/* Current Measurement */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-blue-800 font-semibold">Jenis Tes:</div>
                    <div className="text-sm font-bold text-blue-950">
                      {typeLabelMap[selectedExam.examination_type]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-blue-800 font-semibold">Hasil Pengukuran:</div>
                    <div className="text-2xl font-mono font-bold text-blue-950">
                      {selectedExam.result_value}{' '}
                      <span className="text-sm font-normal">{selectedExam.result_unit}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Klasifikasi Administratif:</span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold uppercase text-[11px] border ${
                      classificationColorMap[selectedExam.classification].bg
                    }`}
                  >
                    {classificationColorMap[selectedExam.classification].label}
                  </span>
                </div>
              </div>

              {/* Comparison with Previous Checkup */}
              {(() => {
                const prev = getPreviousExam(selectedExam);
                if (!prev) return null;
                const diff = (selectedExam.result_value - prev.result_value).toFixed(1);
                const isHigher = Number(diff) > 0;
                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-700" />
                      Perbandingan dengan Pemeriksaan Sebelumnya
                    </h4>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Pemeriksaan Lalu</div>
                        <div className="font-mono font-bold text-slate-800">
                          {prev.result_value} {prev.result_unit}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {new Date(prev.examination_datetime).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Pemeriksaan Saat Ini</div>
                        <div className="font-mono font-bold text-blue-900">
                          {selectedExam.result_value} {selectedExam.result_unit}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {new Date(selectedExam.examination_datetime).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500">Selisih Perubahan</div>
                        <div
                          className={`font-mono font-bold ${
                            Number(diff) === 0
                              ? 'text-slate-600'
                              : isHigher
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {Number(diff) > 0 ? `+${diff}` : diff} {selectedExam.result_unit}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {typeLabelMap[prev.examination_type]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Symptoms & Notes */}
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-slate-500">Keluhan yang Dirasakan:</span>
                  <p className="text-slate-800 mt-0.5">{selectedExam.symptoms || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Kondisi Fisik Saat Diperiksa:</span>
                  <p className="text-slate-800 mt-0.5">{selectedExam.participant_condition || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Catatan Petugas:</span>
                  <p className="text-slate-800 mt-0.5">{selectedExam.notes || '-'}</p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Kategori ini merupakan penanda administratif untuk membantu pemantauan, bukan diagnosis medis.
                  Interpretasi hasil dan keputusan tindak lanjut harus dilakukan oleh tenaga kesehatan yang berwenang.
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Lembar Hasil
                </button>
                {(role === 'petugas_uks' || role === 'admin') && (
                  <>
                    <button
                      onClick={() => {
                        const ex = selectedExam;
                        setSelectedExam(null);
                        handleOpenEdit(ex);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah Data
                    </button>
                    <button
                      onClick={() => {
                        const ex = selectedExam;
                        setSelectedExam(null);
                        setExamToDelete(ex);
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
                onClick={() => setSelectedExam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Medical Slip */}
      {selectedExam && isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-8 my-8 print:p-0 print:border-none print:shadow-none print:w-full">
            <div className="flex justify-between items-center mb-4 no-print">
              <span className="text-xs font-bold text-slate-400 uppercase">Pratinjau Cetak Lembar Hasil</span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Slip Content */}
            <div className="p-2 text-slate-900 font-sans">
              <SchoolLetterhead
                documentTitle="SURAT HASIL PEMERIKSAAN GULA DARAH"
                documentSubtitle="Unit Kesehatan Sekolah (UKS) Terpadu"
                documentNumber={selectedExam.examination_number}
              />

              <div className="space-y-4 text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600 w-44">Nama Peserta</td>
                      <td className="py-1.5 font-bold">{selectedExam.participant?.full_name}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Nomor Identitas (NIS/NIY)</td>
                      <td className="py-1.5 font-mono">{selectedExam.participant?.employee_or_student_id}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Kategori / Unit</td>
                      <td className="py-1.5 capitalize">
                        {selectedExam.participant?.category} •{' '}
                        {unitMap.get(selectedExam.participant?.unit_id || '') || '-'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Tanggal & Jam Pemeriksaan</td>
                      <td className="py-1.5">
                        {new Date(selectedExam.examination_datetime).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                        })}{' '}
                        WIB
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Jenis Pemeriksaan</td>
                      <td className="py-1.5 font-semibold text-blue-900">
                        {typeLabelMap[selectedExam.examination_type]}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-blue-50/50">
                      <td className="py-2.5 font-bold text-blue-950">Hasil Pemeriksaan</td>
                      <td className="py-2.5 font-mono font-extrabold text-base text-blue-950">
                        {selectedExam.result_value} {selectedExam.result_unit}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Klasifikasi Administratif</td>
                      <td className="py-1.5 font-bold uppercase">
                        {classificationColorMap[selectedExam.classification].label}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-600">Keluhan / Gejala</td>
                      <td className="py-1.5">{selectedExam.symptoms || 'Tidak ada'}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-slate-600">Catatan Petugas</td>
                      <td className="py-1.5">{selectedExam.notes || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Official Medical Disclaimer */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 leading-relaxed italic">
                  <strong>Pemberitahuan Resmi:</strong> Kategori ini merupakan penanda administratif
                  untuk membantu pemantauan di lingkungan sekolah, bukan diagnosis medis. Interpretasi hasil
                  dan keputusan pengobatan harus dilakukan oleh dokter atau tenaga kesehatan yang berwenang.
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 pt-8 text-center text-xs">
                  <div>
                    <p className="text-slate-500 text-[11px]">Peserta / Orang Tua / Wali,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-800">
                      ( {selectedExam.participant?.full_name} )
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">
                      Depok, {new Date(selectedExam.examination_datetime).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-slate-500 text-[11px]">Petugas Pemeriksa UKS,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-800">
                      ( {selectedExam.examiner_name} )
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

      {/* MODAL 3: Individual Trend Chart (Recharts) */}
      {trendParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  Tren Riwayat Gula Darah Peserta
                </h3>
                <p className="text-xs text-emerald-200">
                  {trendParticipant.full_name} ({trendParticipant.employee_or_student_id})
                </p>
              </div>
              <button
                onClick={() => setTrendParticipant(null)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">Kategori:</span>{' '}
                  <span className="capitalize">{trendParticipant.category}</span> •{' '}
                  <span className="font-semibold text-slate-800">Unit:</span>{' '}
                  {unitMap.get(trendParticipant.unit_id) || '-'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Grafik menampilkan hasil pemeriksaan resmi
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-72 w-full pt-2">
                {(() => {
                  const chartData = getParticipantTrendData(trendParticipant.id);
                  if (chartData.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        Belum ada riwayat pemeriksaan resmi untuk peserta ini.
                      </div>
                    );
                  }
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                                  <div className="font-bold text-sky-300">{data.fullDate}</div>
                                  <div>
                                    No: <span className="font-mono text-slate-300">{data.number}</span>
                                  </div>
                                  <div>Jenis: {data.type}</div>
                                  <div className="text-base font-bold text-white font-mono">
                                    {data.value} {data.unit}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Reference Line for normal threshold */}
                        <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Ambang Batas GDS 140', fontSize: 10, fill: '#b45309' }} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ fill: '#059669', r: 5 }}
                          activeDot={{ r: 8, stroke: '#047857', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-tight">
                💡 <strong>Catatan:</strong> Titik pada grafik merefleksikan nilai hasil pemeriksaan berkala.
                Perbedaan jenis pemeriksaan (puasa vs sewaktu) dicantumkan pada label titik agar perbandingan akurat dan objektif.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setTrendParticipant(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ubah / Edit Pemeriksaan Gula Darah */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Ubah Data Pemeriksaan Gula Darah</h3>
                <p className="text-xs text-sky-200 font-mono">
                  {editingExam.examination_number} • {editingExam.participant?.full_name}
                </p>
              </div>
              <button
                onClick={() => setEditingExam(null)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Pemeriksaan *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDatetime}
                    onChange={(e) => setEditDatetime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Pemeriksaan *</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as GlucoseExamType)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="sewaktu">Sewaktu (GDS)</option>
                    <option value="puasa">Puasa (GDP)</option>
                    <option value="setelah_makan">2 Jam Setelah Makan (GD2PP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nilai Glukosa *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="1000"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan Hasil *</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as 'mg/dL' | 'mmol/L')}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="mg/dL">mg/dL</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                </div>
              </div>

              {editType === 'puasa' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lama Durasi Puasa (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Contoh: 8.5"
                    value={editFastingHours || ''}
                    onChange={(e) => setEditFastingHours(parseFloat(e.target.value) || undefined)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gejala yang Dirasakan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pusing, lemas, haus berlebih..."
                  value={editSymptoms}
                  onChange={(e) => setEditSymptoms(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik Saat Diperiksa</label>
                <input
                  type="text"
                  placeholder="Contoh: Sadar penuh, tampak pucat..."
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Alat Glukometer</label>
                <input
                  type="text"
                  value={editDevice}
                  onChange={(e) => setEditDevice(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan Petugas</label>
                <textarea
                  rows={2}
                  placeholder="Catatan klinis atau instruksi tindak lanjut..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Konfirmasi Hapus Pemeriksaan Gula Darah */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Data</h3>
                <p className="text-[11px] text-slate-500">Pemeriksaan Gula Darah</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus data pemeriksaan berikut?</p>
              <div className="font-bold text-slate-900">{examToDelete.participant?.full_name}</div>
              <div className="text-[11px] font-mono text-slate-600">
                No: {examToDelete.examination_number} • Hasil: {examToDelete.result_value} {examToDelete.result_unit}
              </div>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Tindakan ini tidak dapat dibatalkan dan akan dicatat dalam jejak audit sistem.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
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

      {/* CSV Import Modal Pemeriksaan Gula Darah */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Pemeriksaan Gula Darah Massal (CSV)"
        description="Unggah berkas CSV untuk mencatat hasil skrining dan pemeriksaan kadar glukosa darah peserta secara massal."
        expectedHeaders={[
          'NIS/NIY Peserta',
          'Nama Peserta',
          'Tanggal & Waktu',
          'Jenis Tes (puasa/sewaktu/setelah_makan)',
          'Hasil Glukosa',
          'Satuan (mg/dL)',
          'Lama Puasa (Jam)',
          'Keluhan / Gejala',
          'Kondisi Saat Tes',
          'Alat Glukometer',
          'Petugas Pemeriksa',
          'Catatan',
        ]}
        sampleDownloadFn={() => CsvService.downloadGlucoseExaminationsTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format CSV Pemeriksaan Gula Darah"
        onImport={handleImportGlucoseExams}
        onSuccess={() => setReloadKey((prev) => prev + 1)}
      />
    </div>
  );
};
