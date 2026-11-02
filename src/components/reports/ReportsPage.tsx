/**
 * Modul Laporan dan Ekspor (Excel & PDF) - LUKS
 * Implements 12 distinct report types with comprehensive filters and official school letterhead.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Download,
  FileText,
  Building2,
  CheckCircle2,
  Search,
  Activity,
  HeartPulse,
  TrendingUp,
  PenLine,
  RotateCcw,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { ExportService } from '../../services/exportService';
import {
  GlucoseExamination,
  UksVisit,
  UksAssessment,
  RepeatVisitWarning,
} from '../../types/database';
import { SchoolLetterhead } from '../common/SchoolLetterhead';

interface ReportsPageProps {
  initialReportType?: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialReportType }) => {
  const { currentUser, role } = useAuth();

  // Selected Report Type (1 to 12)
  const [reportType, setReportType] = useState<string>(initialReportType || 'laporan_gula_darah');

  // Filters
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Signature & Document Sign-Off Manual Customization
  const [penyusunDokumen, setPenyusunDokumen] = useState<string>(currentUser?.full_name || '');
  const [approverTitle, setApproverTitle] = useState<string>('Kepala Sekolah Lazuardi');
  const [approverName, setApproverName] = useState<string>('Dr. H. Bambang Irawan, M.Pd');
  const [approverNiy, setApproverNiy] = useState<string>('NIY: 2015.01.002');

  const [staffTitle, setStaffTitle] = useState<string>('Petugas / Penanggung Jawab UKS');
  const [staffName, setStaffName] = useState<string>(currentUser?.full_name || '');
  const [staffNiy, setStaffNiy] = useState<string>(
    currentUser?.employee_or_student_id ? `NIY: ${currentUser.employee_or_student_id}` : 'NIY: 201908-UKS-042'
  );
  const [signingLocationAndDate, setSigningLocationAndDate] = useState<string>(
    `Depok, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`
  );

  const [showSignSettings, setShowSignSettings] = useState<boolean>(false);

  // Print view state
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  if (!currentUser) return null;

  const exams = DataService.getGlucoseExaminations(currentUser);
  const visits = DataService.getUksVisits(currentUser);
  const followUps = DataService.getGlucoseFollowUps(currentUser);
  const warnings = DataService.getRepeatVisitWarnings();
  const units = DataService.getUnits();
  const unitMap = new Map(units.map((u) => [u.id, u.unit_name]));

  // Assessments map
  const assessmentsMap = new Map<string, UksAssessment>();
  visits.forEach((v) => {
    const asms = DataService.getAssessmentsForVisit(v.id);
    if (asms.length > 0) assessmentsMap.set(v.id, asms[0]);
  });

  // Filtered examinations
  const filteredExams = exams.filter((e) => {
    if (selectedUnitId && e.participant?.unit_id !== selectedUnitId) return false;
    if (selectedCategory && e.participant?.category !== selectedCategory) return false;
    if (startDate && new Date(e.examination_datetime) < new Date(startDate)) return false;
    if (endDate && new Date(e.examination_datetime) > new Date(`${endDate}T23:59:59`)) return false;
    return true;
  });

  // Filtered visits
  const filteredVisits = visits.filter((v) => {
    if (selectedUnitId && v.participant?.unit_id !== selectedUnitId) return false;
    if (selectedCategory && v.participant?.category !== selectedCategory) return false;
    if (startDate && new Date(v.visit_datetime) < new Date(startDate)) return false;
    if (endDate && new Date(v.visit_datetime) > new Date(`${endDate}T23:59:59`)) return false;
    return true;
  });

  // 12 Report Categories
  const reportOptions = [
    { id: 'laporan_gula_darah', label: '1. Laporan Pemeriksaan Gula Darah' },
    { id: 'laporan_per_peserta', label: '2. Laporan Hasil Pemeriksaan per Peserta' },
    { id: 'laporan_tren_gula_darah', label: '3. Laporan Tren Pemeriksaan Berulang' },
    { id: 'laporan_kunjungan_uks', label: '4. Laporan Kunjungan UKS' },
    { id: 'laporan_kunjungan_berulang', label: '5. Laporan Kunjungan Berulang (Ambang Batas)' },
    { id: 'laporan_keluhan', label: '6. Laporan Rekap Jenis Keluhan' },
    { id: 'laporan_penanganan', label: '7. Laporan Hasil Penanganan UKS' },
    { id: 'laporan_rujukan', label: '8. Laporan Rujukan ke Fasilitas Kesehatan' },
    { id: 'laporan_tindak_lanjut', label: '9. Laporan Tindak Lanjut & Jadwal Evaluasi' },
    { id: 'laporan_statistik_unit', label: '10. Laporan Statistik per Unit Sekolah' },
    { id: 'laporan_semester', label: '11. Laporan Semester & Bulanan' },
    { id: 'laporan_audit', label: '12. Laporan Aktivitas Petugas & Audit Log' },
  ];

  const handleExportExcel = () => {
    DataService.logAudit(
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
      'EXPORT_DATA',
      'reports',
      undefined,
      { report_type: reportType }
    );

    if (reportType.includes('gula') || reportType === 'laporan_per_peserta' || reportType === 'laporan_tren_gula_darah') {
      ExportService.exportGlucoseExaminationsToExcel(filteredExams, unitMap, reportType);
    } else if (reportType === 'laporan_kunjungan_berulang') {
      ExportService.exportRepeatVisitsToExcel(warnings, unitMap);
    } else {
      ExportService.exportUksVisitsToExcel(filteredVisits, assessmentsMap, unitMap, reportType);
    }
  };

  const getReportTitle = () => {
    const opt = reportOptions.find((r) => r.id === reportType);
    return opt ? opt.label.replace(/^\d+\.\s*/, '') : 'Laporan UKS';
  };

  const handleDownloadPdf = () => {
    DataService.logAudit(
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
      'EXPORT_DATA',
      'reports',
      undefined,
      { report_type: reportType, format: 'PDF' }
    );

    const unitName = selectedUnitId ? unitMap.get(selectedUnitId) : undefined;
    ExportService.downloadReportPdf(reportType, getReportTitle(), {
      exams: filteredExams,
      visits: filteredVisits,
      warnings,
      unitMap,
      assessmentsMap,
      startDate,
      endDate,
      unitName,
      categoryName: selectedCategory,
      signatures: {
        preparerName: penyusunDokumen || currentUser.full_name,
        approverTitle: approverTitle || 'Kepala Sekolah Lazuardi',
        approverName: approverName || 'Dr. H. Bambang Irawan, M.Pd',
        approverNiy: approverNiy,
        staffTitle: staffTitle || 'Petugas / Penanggung Jawab UKS',
        staffName: staffName || currentUser.full_name,
        staffNiy: staffNiy,
        locationDate: signingLocationAndDate || `Depok, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Pusat Laporan & Ekspor Dokumen UKS</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak laporan resmi ber-kop surat sekolah atau unduh format Excel (.xlsx) untuk 12 jenis laporan UKS terintegrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSignSettings(!showSignSettings)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs border ${
              showSignSettings
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Kustomisasi tanda tangan, pengesah, dan penyusun dokumen"
          >
            <PenLine className="w-3.5 h-3.5 text-amber-600" />
            <span>Kustomisasi Tanda Tangan ({approverTitle})</span>
            {showSignSettings ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Download PDF Laporan
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pilih Jenis Laporan:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold text-blue-900"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Unit Sekolah:</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
            >
              <option value="">Semua Unit (TK, SD, SMP, SMA)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} - {u.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Kategori Peserta:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
            >
              <option value="">Semua (Siswa & Karyawan)</option>
              <option value="siswa">Siswa</option>
              <option value="karyawan">Guru & Karyawan</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Rentang Tanggal:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 border border-slate-300 rounded-xl p-2 text-[11px]"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 border border-slate-300 rounded-xl p-2 text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Signature & Sign-Off Configuration Panel */}
      {showSignSettings && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 no-print shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <PenLine className="w-4 h-4 text-amber-700" />
                <span>Pengaturan Manual Penandatangan & Pengesahan Laporan</span>
              </div>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Kustomisasi nama Penyusun Dokumen, Jabatan Pengesah (contoh: Kepala Sekolah diganti Manager FM), serta Petugas Penanggung Jawab UKS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-900 mr-1 hidden lg:inline">Pilihan Cepat:</span>
              <button
                type="button"
                onClick={() => {
                  setApproverTitle('Manager FM');
                  setApproverName('Ahmad Fauzi, S.Kom');
                  setApproverNiy('NIY: 2018.04.015');
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-300 transition shadow-2xs"
                title="Ganti pengesah menjadi Manager FM"
              >
                Ganti ke Manager FM
              </button>
              <button
                type="button"
                onClick={() => {
                  setApproverTitle('Kepala Sekolah Lazuardi');
                  setApproverName('Dr. H. Bambang Irawan, M.Pd');
                  setApproverNiy('NIY: 2015.01.002');
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-300 transition shadow-2xs"
                title="Ganti pengesah menjadi Kepala Sekolah Lazuardi"
              >
                Kepala Sekolah
              </button>
              <button
                type="button"
                onClick={() => {
                  setPenyusunDokumen(currentUser.full_name);
                  setApproverTitle('Kepala Sekolah Lazuardi');
                  setApproverName('Dr. H. Bambang Irawan, M.Pd');
                  setApproverNiy('NIY: 2015.01.002');
                  setStaffTitle('Petugas / Penanggung Jawab UKS');
                  setStaffName(currentUser.full_name);
                  setStaffNiy(currentUser.employee_or_student_id ? `NIY: ${currentUser.employee_or_student_id}` : 'NIY: 201908-UKS-042');
                  setSigningLocationAndDate(`Depok, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition shadow-2xs"
                title="Reset semua ke pengaturan asal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Section 1: Penyusun Dokumen */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2.5 shadow-2xs">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>1. Penyusun Dokumen</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Penyusun Dokumen:</label>
                <input
                  type="text"
                  value={penyusunDokumen}
                  onChange={(e) => setPenyusunDokumen(e.target.value)}
                  placeholder="Nama Penyusun Dokumen"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Kota & Tanggal Pengesahan:</label>
                <input
                  type="text"
                  value={signingLocationAndDate}
                  onChange={(e) => setSigningLocationAndDate(e.target.value)}
                  placeholder="Depok, 30 Oktober 2026"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Section 2: Pihak Mengetahui (Kepala Sekolah / Manager FM / Direktur) */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2.5 shadow-2xs">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>2. Mengetahui (Pimpinan / Manager FM)</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Jabatan Pengesah (Bisa Diubah):</label>
                <input
                  type="text"
                  value={approverTitle}
                  onChange={(e) => setApproverTitle(e.target.value)}
                  placeholder="Kepala Sekolah Lazuardi / Manager FM"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Lengkap & Gelar (Bisa Diubah):</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Dr. H. Bambang Irawan, M.Pd"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">NIP / NIY:</label>
                <input
                  type="text"
                  value={approverNiy}
                  onChange={(e) => setApproverNiy(e.target.value)}
                  placeholder="NIY: 2015.01.002"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Section 3: Petugas / Penanggung Jawab UKS */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2.5 shadow-2xs">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Activity className="w-3.5 h-3.5 text-emerald-700" />
                <span>3. Petugas / Penanggung Jawab UKS</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Jabatan Petugas (Bisa Diubah):</label>
                <input
                  type="text"
                  value={staffTitle}
                  onChange={(e) => setStaffTitle(e.target.value)}
                  placeholder="Petugas / Penanggung Jawab UKS"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold text-blue-950 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Lengkap Petugas (Bisa Diubah):</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Ns. Siti Rahmah, S.Kep"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">NIP / NIY:</label>
                <input
                  type="text"
                  value={staffNiy}
                  onChange={(e) => setStaffNiy(e.target.value)}
                  placeholder="NIY: 201908-UKS-042"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Report Container (Printable with Letterhead) */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none">
        {/* Official Kop Surat */}
        <SchoolLetterhead
          documentTitle={getReportTitle().toUpperCase()}
          documentSubtitle={`Periode Laporan: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'} • Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`}
          documentNumber={`LAP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${reportType.substring(0, 8).toUpperCase()}`}
        />

        {/* Statistical Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Data Laporan</div>
            <div className="font-bold text-base text-slate-900 mt-0.5">
              {reportType.includes('gula') ? filteredExams.length : filteredVisits.length} Rekaman
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Unit Sekolah</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {selectedUnitId ? unitMap.get(selectedUnitId) : 'Seluruh Unit'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Kategori Peserta</div>
            <div className="font-bold text-slate-900 capitalize mt-0.5">
              {selectedCategory || 'Siswa & Karyawan'}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
              <span>Penyusun Dokumen</span>
              <button
                type="button"
                onClick={() => setShowSignSettings(true)}
                className="text-blue-600 hover:text-blue-800 text-[10px] font-bold no-print inline-flex items-center gap-0.5"
                title="Klik untuk ubah manual nama penyusun"
              >
                <PenLine className="w-2.5 h-2.5" />
                <span>Ubah</span>
              </button>
            </div>
            <div className="font-bold text-slate-900 mt-0.5">{penyusunDokumen || currentUser.full_name}</div>
          </div>
        </div>

        {/* Table Content based on Selected Report Type */}
        <div className="overflow-x-auto text-xs">
          {reportType.includes('gula') || reportType === 'laporan_per_peserta' ? (
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">No. Pemeriksaan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nama Peserta</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">NIS/NIY</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Jenis Tes</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right">Hasil</th>
                  <th className="py-2.5 px-3">Klasifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExams.map((exam, idx) => (
                  <tr key={exam.id}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold">
                      {exam.examination_number}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      {new Date(exam.examination_datetime).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">
                      {exam.participant?.full_name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono">
                      {exam.participant?.employee_or_student_id}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 capitalize">
                      {exam.examination_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold">
                      {exam.result_value} {exam.result_unit}
                    </td>
                    <td className="py-2 px-3 uppercase font-bold text-[10px]">
                      {exam.classification.replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : reportType === 'laporan_kunjungan_berulang' ? (
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nama Peserta</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">NIS/NIY</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Unit</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Jumlah Kunjungan</th>
                  <th className="py-2.5 px-3">Status Telaah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {warnings.map((w, idx) => (
                  <tr key={w.participant_id}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">
                      {w.participant.full_name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono">
                      {w.participant.employee_or_student_id}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      {unitMap.get(w.participant.unit_id) || '-'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-bold font-mono">
                      {w.visit_count} kali
                    </td>
                    <td className="py-2 px-3 capitalize font-semibold">
                      {w.status_review.replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">No. Kunjungan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Pengunjung</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Keluhan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Penyebab</th>
                  <th className="py-2.5 px-3">Hasil Penanganan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVisits.map((v, idx) => (
                  <tr key={v.id}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold">
                      {v.visit_number}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      {new Date(v.visit_datetime).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold">
                      {v.participant?.full_name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">{v.main_complaint}</td>
                    <td className="py-2 px-3 border-r border-slate-200 capitalize font-medium">
                      {v.visit_reason}
                    </td>
                    <td className="py-2 px-3 font-semibold capitalize">
                      {v.outcome ? v.outcome.replace(/_/g, ' ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formal Signature Area */}
        <div className="pt-16 border-t border-slate-100 mt-8 relative">
          <div className="flex justify-end mb-3 no-print">
            <button
              type="button"
              onClick={() => setShowSignSettings(!showSignSettings)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-300 transition shadow-2xs"
              title="Kustomisasi manual jabatan dan nama penandatangan"
            >
              <PenLine className="w-3.5 h-3.5 text-amber-700" />
              <span>{showSignSettings ? 'Tutup Pengaturan Tanda Tangan' : 'Ubah Manual Tanda Tangan & Pejabat'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-800">{approverTitle || 'Kepala Sekolah Lazuardi'}</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{approverName || 'Dr. H. Bambang Irawan, M.Pd'}</p>
              {approverNiy && <p className="text-[10px] text-slate-500 font-mono">{approverNiy}</p>}
            </div>
            <div>
              <p className="text-slate-600">{signingLocationAndDate || `Depok, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`}</p>
              <p className="font-semibold text-slate-800">{staffTitle || 'Petugas / Penanggung Jawab UKS'}</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{staffName || currentUser.full_name}</p>
              {staffNiy && (
                <p className="text-[10px] text-slate-500 font-mono">
                  {staffNiy}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
