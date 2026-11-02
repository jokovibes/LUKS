/**
 * Export Service for LUKS
 * Handles real Excel (.xlsx) file generation using the xlsx library
 * and print/PDF ready layout formatting.
 */

import * as XLSX from 'xlsx';
import {
  GlucoseExamination,
  UksVisit,
  UksAssessment,
  RepeatVisitWarning,
  SchoolUnit,
} from '../types/database';
import { PdfService } from './pdfService';

export class ExportService {
  /**
   * Helper to download an XLSX workbook
   */
  private static saveWorkbook(workbook: XLSX.WorkBook, fileName: string) {
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * 1. Export Laporan Pemeriksaan Gula Darah (Excel)
   */
  static exportGlucoseExaminationsToExcel(
    exams: GlucoseExamination[],
    unitMap: Map<string, string>,
    fileNameSuffix: string = 'semua_periode'
  ) {
    const rows = exams.map((exam, index) => {
      const part = exam.participant;
      const unitName = part?.unit_id ? unitMap.get(part.unit_id) || part.unit_id : '-';
      
      const typeLabelMap: Record<string, string> = {
        puasa: 'Gula Darah Puasa (GDP)',
        sewaktu: 'Gula Darah Sewaktu (GDS)',
        setelah_makan: 'Gula Darah 2 Jam PP',
      };

      const classLabelMap: Record<string, string> = {
        normal: 'Normal',
        perlu_perhatian: 'Perlu Perhatian',
        pemantauan: 'Pemantauan',
        tindak_lanjut: 'Tindak Lanjut',
        belum_diklasifikasikan: 'Belum Diklasifikasikan',
      };

      return {
        'No': index + 1,
        'No. Pemeriksaan': exam.examination_number,
        'Tanggal & Jam (WIB)': new Date(exam.examination_datetime).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        'Kategori': part?.category === 'siswa' ? 'Siswa' : 'Karyawan',
        'NIS / NIY': part?.employee_or_student_id || '-',
        'Nama Peserta': part?.full_name || '-',
        'Unit Sekolah': unitName,
        'Jenis Kelamin': part?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        'Jenis Tes': typeLabelMap[exam.examination_type] || exam.examination_type,
        'Lama Puasa (Jam)': exam.fasting_duration_hours || '-',
        'Hasil': exam.result_value,
        'Satuan': exam.result_unit,
        'Klasifikasi Administratif': classLabelMap[exam.classification] || exam.classification,
        'Keluhan / Gejala': exam.symptoms || '-',
        'Kondisi Peserta': exam.participant_condition || '-',
        'Petugas Pemeriksa': exam.examiner_name,
        'Alat Digunakan': exam.device_name || '-',
        'Status Rekaman': exam.record_status.toUpperCase(),
        'Catatan': exam.notes || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    // Set auto column width
    const colWidths = [
      { wch: 5 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
      { wch: 26 }, { wch: 24 }, { wch: 14 }, { wch: 24 }, { wch: 18 },
      { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 30 },
      { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemeriksaan Gula Darah');

    const fileName = `LUKS_Laporan_Gula_Darah_${fileNameSuffix}_${Date.now()}`;
    this.saveWorkbook(workbook, fileName);
  }

  /**
   * 2. Export Laporan Kunjungan UKS (Excel)
   */
  static exportUksVisitsToExcel(
    visits: UksVisit[],
    assessmentsMap: Map<string, UksAssessment>,
    unitMap: Map<string, string>,
    fileNameSuffix: string = 'semua_periode'
  ) {
    const outcomeLabelMap: Record<string, string> = {
      kembali_ke_kelas: 'Kembali ke Kelas',
      kembali_bekerja: 'Kembali Bekerja',
      beristirahat_di_uks: 'Beristirahat di UKS',
      dijemput_keluarga: 'Dijemput Keluarga',
      dipulangkan: 'Dipulangkan',
      dirujuk: 'Dirujuk ke Faskes',
      pemantauan_lanjutan: 'Pemantauan Lanjutan',
      masih_dalam_penanganan: 'Masih dalam Penanganan',
    };

    const reasonLabelMap: Record<string, string> = {
      sakit: 'Sakit',
      cedera: 'Cedera / Kecelakaan',
      pemeriksaan_rutin: 'Pemeriksaan Rutin',
      lainnya: 'Lainnya',
    };

    const rows = visits.map((v, index) => {
      const part = v.participant;
      const asm = assessmentsMap.get(v.id);
      const unitName = part?.unit_id ? unitMap.get(part.unit_id) || part.unit_id : '-';

      return {
        'No': index + 1,
        'No. Kunjungan': v.visit_number,
        'Waktu Datang (WIB)': new Date(v.visit_datetime).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        'Kategori': part?.category === 'siswa' ? 'Siswa' : 'Karyawan',
        'NIS / NIY': part?.employee_or_student_id || '-',
        'Nama Pengunjung': part?.full_name || '-',
        'Unit Sekolah': unitName,
        'Lokasi Sebelumnya': v.previous_location || '-',
        'Penyebab Kunjungan': reasonLabelMap[v.visit_reason] || v.visit_reason,
        'Keluhan Utama': v.main_complaint,
        'Kronologi Insiden': v.incident_chronology || '-',
        'Pengantar': v.accompanying_person || '-',
        'Suhu (°C)': asm?.temperature ?? '-',
        'Tensi (mmHg)': asm?.systolic_pressure && asm?.diastolic_pressure ? `${asm.systolic_pressure}/${asm.diastolic_pressure}` : '-',
        'Nadi (bpm)': asm?.pulse_rate ?? '-',
        'SpO2 (%)': asm?.oxygen_saturation ?? '-',
        'Tindakan Diberikan': asm?.treatment || '-',
        'Obat / Perlengkapan': asm?.medication_or_equipment || '-',
        'Status Kunjungan': v.visit_status.toUpperCase(),
        'Hasil Akhir': v.outcome ? (outcomeLabelMap[v.outcome] || v.outcome) : 'Dalam Proses',
        'Waktu Checkout': v.checkout_datetime ? new Date(v.checkout_datetime).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
        'Penjemput': v.pickup_person ? `${v.pickup_person} (${v.pickup_relationship || 'Keluarga'})` : '-',
        'Petugas UKS': v.handling_staff_name,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = [
      { wch: 5 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 16 },
      { wch: 26 }, { wch: 24 }, { wch: 20 }, { wch: 18 }, { wch: 30 },
      { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 30 }, { wch: 24 }, { wch: 14 }, { wch: 22 },
      { wch: 16 }, { wch: 24 }, { wch: 24 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kunjungan UKS');

    const fileName = `LUKS_Laporan_Kunjungan_UKS_${fileNameSuffix}_${Date.now()}`;
    this.saveWorkbook(workbook, fileName);
  }

  /**
   * 3. Export Laporan Peringatan Kunjungan Berulang (Excel)
   */
  static exportRepeatVisitsToExcel(
    warnings: RepeatVisitWarning[],
    unitMap: Map<string, string>
  ) {
    const rows = warnings.map((w, index) => ({
      'No': index + 1,
      'NIS / NIY': w.participant.employee_or_student_id,
      'Nama Peserta': w.participant.full_name,
      'Kategori': w.participant.category === 'siswa' ? 'Siswa' : 'Karyawan',
      'Unit Sekolah': unitMap.get(w.participant.unit_id) || w.participant.unit_id,
      'Jumlah Kunjungan (30 Hari)': w.visit_count,
      'Status Telaah': w.status_review === 'telah_ditelaah' ? 'Telah Ditelaah' : 'Menunggu Telaah',
      'Catatan Internal Nakes': w.internal_notes || '-',
      'Penelaah': w.reviewed_by || '-',
      'Waktu Telaah': w.reviewed_at ? new Date(w.reviewed_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kunjungan Berulang');
    this.saveWorkbook(workbook, `LUKS_Laporan_Kunjungan_Berulang_${Date.now()}`);
  }

  /**
   * Unduh Berkas PDF Resmi (jsPDF)
   */
  static downloadGlucoseExaminationsPdf = PdfService.downloadGlucoseHistoryPdf.bind(PdfService);
  static downloadUksVisitsPdf = PdfService.downloadUksVisitsPdf.bind(PdfService);
  static downloadDashboardPdf = PdfService.downloadDashboardPdf.bind(PdfService);
  static downloadReportPdf = PdfService.downloadReportPdf.bind(PdfService);

  /**
   * Trigger native browser print dialog for high-resolution print fallback
   */
  static printCurrentView() {
    try {
      window.print();
    } catch (e) {
      console.warn('Print not supported in current frame context:', e);
    }
  }
}
