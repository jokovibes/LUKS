/**
 * Layanan Pembuatan & Unduh Dokumen PDF Resmi - LUKS
 * Lazuardi UKS Management System
 * Menggunakan jsPDF & jspdf-autotable untuk menghasilkan file PDF nyata
 * yang dapat diunduh langsung di lingkungan browser maupun iframe.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  GlucoseExamination,
  UksVisit,
  UksAssessment,
  RepeatVisitWarning,
  UserProfile,
  SchoolUnit,
} from '../types/database';
import { DataService } from './dataService';

export class PdfService {
  /**
   * Menggambar Kop Surat Resmi Lazuardi Global Compassionate School
   */
  private static drawLetterhead(
    doc: jsPDF,
    documentTitle: string,
    documentSubtitle: string,
    documentNumber?: string
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Read dynamic school settings from database
    const schoolSettings = DataService.getSystemSettings();
    const schoolName = (schoolSettings.find((s) => s.setting_key === 'school_name')?.setting_value || 'Lazuardi Global Compassionate School').toUpperCase();
    const schoolAddress = schoolSettings.find((s) => s.setting_key === 'school_address')?.setting_value || 'Jl. Merpati No. 12, Cinere, Depok 16514';
    const uksPhone = schoolSettings.find((s) => s.setting_key === 'uks_phone')?.setting_value || '(021) 753-4820 ext 105';

    // Header Background Accent Bar
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(14, 10, pageWidth - 28, 3, 'F');

    // Logo Box Emblem
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(14, 16, 16, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LUKS', 22, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.text('+', 22, 29, { align: 'center' });

    // School Name & Header Text
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(schoolName, 34, 21);

    doc.setFontSize(9);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text('UNIT KESEHATAN SEKOLAH (UKS) TERPADU', 34, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `${schoolAddress} | Telp: ${uksPhone} | Email: uks@lazuardi.sch.id`,
      34,
      31
    );

    // Document Number Box (Right aligned)
    const docNum =
      documentNumber ||
      `LUKS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        1000 + Math.random() * 9000
      )}`;
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Nomor Dokumen:', pageWidth - 14, 21, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(docNum, pageWidth - 14, 26, { align: 'right' });

    // Horizontal Divider
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(14, 35, pageWidth - 14, 35);
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.line(14, 35.8, pageWidth - 14, 35.8);

    // Document Title Banner
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, 38, pageWidth - 28, 14, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 38, pageWidth - 28, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(documentTitle.toUpperCase(), pageWidth / 2, 45, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(documentSubtitle, pageWidth / 2, 50, { align: 'center' });

    return 56; // Return start Y position for body content
  }

  /**
   * Menggambar Tanda Tangan Resmi di Bagian Bawah Halaman Terakhir
   */
  private static drawSignatures(
    doc: jsPDF,
    staffName?: string,
    roleLabel: string = 'Petugas UKS Sekolah',
    customSig?: {
      approverTitle?: string;
      approverName?: string;
      approverNiy?: string;
      staffTitle?: string;
      staffName?: string;
      staffNiy?: string;
      locationDate?: string;
    }
  ) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Check if we have enough space; if not, add page
    let sigY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 220;
    if (sigY + 38 > pageHeight - 15) {
      doc.addPage();
      sigY = 25;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const approverTitle = customSig?.approverTitle || (customSig ? 'Kepala Care' : 'Dokter Konsultan / Kepala UKS');
    const approverName = customSig?.approverName || (customSig ? 'Zaronah, SE' : '(......................................................)');
    const approverNiy = customSig?.approverNiy !== undefined ? customSig.approverNiy : (customSig ? 'NIY: 10.00.017' : 'SIP: 446.1/029/Dinkes-DPK/2024');

    const staffTitle = customSig?.staffTitle || roleLabel;
    const finalStaffName = customSig?.staffName || staffName || 'dr. Imania';
    const finalStaffNiy = customSig?.staffNiy !== undefined ? customSig.staffNiy : 'NIY: 10.18.586';
    const locDate = customSig?.locationDate || `Depok, ${todayStr}`;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Left Column: Penanggung Jawab / Pimpinan
    doc.text(`Mengetahui,`, 20, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text(approverTitle, 20, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(approverName, 20, sigY + 28);
    if (approverNiy) {
      doc.setFontSize(7);
      doc.text(approverNiy, 20, sigY + 32);
    }

    // Right Column: Petugas Pemeriksa / Pelapor
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(locDate, pageWidth - 70, sigY);
    doc.setFont('helvetica', 'bold');
    doc.text(staffTitle, pageWidth - 70, sigY + 4);
    doc.text(finalStaffName, pageWidth - 70, sigY + 28);
    if (finalStaffNiy) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(finalStaffNiy, pageWidth - 70, sigY + 32);
    }

    // Footer note
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.text(
      `Dokumen ini dicetak secara otomatis melalui Sistem Informasi UKS Terpadu (LUKS) Lazuardi. Sah tanpa stempel basah jika terverifikasi digital.`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // =========================================================================
  // 1. UNDUH PDF RIWAYAT PEMERIKSAAN GULA DARAH
  // =========================================================================
  static downloadGlucoseHistoryPdf(
    exams: GlucoseExamination[],
    unitMap: Map<string, string>,
    filterDescription: string = 'Seluruh Catatan Skrining Gula Darah Terdaftar'
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const startY = this.drawLetterhead(
      doc,
      'Laporan Riwayat Pemeriksaan Gula Darah',
      `${filterDescription} • Total ${exams.length} Catatan Pemeriksaan`,
      `LUKS/GLU/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );

    // Ringkasan Statistik Singkat
    const total = exams.length;
    const normalCount = exams.filter((e) => e.classification === 'normal').length;
    const attentionCount = exams.filter((e) => e.classification === 'perlu_perhatian').length;
    const followUpCount = exams.filter((e) => e.classification === 'tindak_lanjut').length;
    const studentCount = exams.filter((e) => e.participant?.category === 'siswa').length;
    const employeeCount = exams.filter((e) => e.participant?.category === 'karyawan').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 14, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    const normalPct = total > 0 ? Math.round((normalCount / total) * 100) : 0;
    const summaryText = `Total Skrining: ${total} (${studentCount} Siswa, ${employeeCount} Guru & Karyawan) | Normal: ${normalCount} (${normalPct}%) | Perlu Perhatian: ${attentionCount} | Tindak Lanjut: ${followUpCount}`;
    doc.text(summaryText, 18, startY + 8);

    const typeLabelMap: Record<string, string> = {
      puasa: 'Puasa (GDP)',
      sewaktu: 'Sewaktu (GDS)',
      setelah_makan: '2 Jam PP',
    };

    const classLabelMap: Record<string, string> = {
      normal: 'Normal',
      perlu_perhatian: 'Perhatian',
      pemantauan: 'Pemantauan',
      tindak_lanjut: 'Tindak Lanjut',
    };

    const tableRows = exams.map((exam, index) => {
      const part = exam.participant;
      const unitName = part?.unit_id ? unitMap.get(part.unit_id) || part.unit_id : '-';
      const dateFormatted = new Date(exam.examination_datetime).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted = new Date(exam.examination_datetime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return [
        index + 1,
        `${dateFormatted}\n${timeFormatted} WIB`,
        part?.employee_or_student_id || '-',
        part?.full_name || '-',
        part?.category === 'siswa' ? 'Siswa' : 'Karyawan',
        unitName,
        typeLabelMap[exam.examination_type] || exam.examination_type,
        `${exam.result_value} ${exam.result_unit}`,
        classLabelMap[exam.classification] || exam.classification,
        exam.examiner_name,
      ];
    });

    autoTable(doc, {
      startY: startY + 18,
      head: [
        [
          'No',
          'Waktu',
          'NIS/NIY',
          'Nama Peserta',
          'Kategori',
          'Unit',
          'Jenis Tes',
          'Hasil',
          'Klasifikasi',
          'Pemeriksa',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [15, 23, 42],
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 16 },
        3: { cellWidth: 32, fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        8: { halign: 'center', cellWidth: 18 },
        9: { cellWidth: 20 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    this.drawSignatures(doc);
    doc.save(`LUKS_Riwayat_Gula_Darah_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // =========================================================================
  // 2. UNDUH PDF RIWAYAT KUNJUNGAN UKS
  // =========================================================================
  static downloadUksVisitsPdf(
    visits: UksVisit[],
    assessmentsMap: Map<string, UksAssessment>,
    unitMap: Map<string, string>,
    filterDescription: string = 'Buku Register & Riwayat Kunjungan Pasien UKS'
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const startY = this.drawLetterhead(
      doc,
      'Buku Register Kunjungan UKS Terpadu',
      `${filterDescription} • Total ${visits.length} Kunjungan Pasien`,
      `LUKS/VST/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );

    // Ringkasan Statistik
    const total = visits.length;
    const sickCount = visits.filter((v) => v.visit_reason === 'sakit').length;
    const injuryCount = visits.filter((v) => v.visit_reason === 'cedera').length;
    const routineCount = visits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length;
    const referredCount = visits.filter((v) => v.outcome === 'dirujuk').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 14, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    const summaryText = `Total Kunjungan: ${total} | Sakit: ${sickCount} | Cedera/Insiden: ${injuryCount} | Cek Rutin: ${routineCount} | Rujukan ke RS: ${referredCount}`;
    doc.text(summaryText, 18, startY + 8);

    const outcomeLabels: Record<string, string> = {
      kembali_ke_kelas: 'Kembali Kelas',
      kembali_bekerja: 'Kembali Kerja',
      beristirahat_di_uks: 'Istirahat UKS',
      dijemput_keluarga: 'Dijemput Keluarga',
      dipulangkan: 'Dipulangkan',
      dirujuk: 'Dirujuk ke RS',
    };

    const tableRows = visits.map((v, index) => {
      const part = v.participant;
      const asm = assessmentsMap.get(v.id);
      const unitName = part?.unit_id ? unitMap.get(part.unit_id) || part.unit_id : '-';
      const dateFormatted = new Date(v.visit_datetime).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });
      const timeFormatted = new Date(v.visit_datetime).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const vitalsText = asm
        ? [
            asm.temperature ? `${asm.temperature}°C` : null,
            asm.systolic_pressure && asm.diastolic_pressure
              ? `${asm.systolic_pressure}/${asm.diastolic_pressure}`
              : null,
            asm.pulse_rate ? `${asm.pulse_rate}bpm` : null,
          ]
            .filter(Boolean)
            .join(' • ') || '-'
        : '-';

      const treatmentText = asm?.treatment || '-';
      const outcomeText = v.outcome ? outcomeLabels[v.outcome] || v.outcome.replace(/_/g, ' ') : 'Dalam Proses';

      return [
        index + 1,
        `${dateFormatted}\n${timeFormatted}`,
        part?.employee_or_student_id || '-',
        part?.full_name || '-',
        unitName,
        v.main_complaint || '-',
        vitalsText,
        treatmentText,
        outcomeText,
        v.handling_staff_name,
      ];
    });

    autoTable(doc, {
      startY: startY + 18,
      head: [
        [
          'No',
          'Waktu',
          'NIS/NIY',
          'Nama Pasien',
          'Unit',
          'Keluhan Utama',
          'Tanda Vital',
          'Tindakan / Obat',
          'Hasil Akhir',
          'Petugas',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [15, 23, 42],
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 16 },
        3: { cellWidth: 30, fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 15 },
        5: { cellWidth: 30 },
        6: { halign: 'center', cellWidth: 22 },
        7: { cellWidth: 25 },
        8: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        9: { cellWidth: 18 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    this.drawSignatures(doc);
    doc.save(`LUKS_Riwayat_Kunjungan_UKS_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // =========================================================================
  // HELPER: PENGGAMBARAN GRAFIK VEKTOR UNTUK PDF (CHARTS ENGINE)
  // =========================================================================

  /**
   * Menggambar Grafik Batang Berkelompok (Grouped Bar Chart) Vektor Nyata di jsPDF
   */
  private static drawGroupedBarChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    subtitle: string,
    categories: string[],
    series: { name: string; color: [number, number, number]; data: number[] }[]
  ) {
    // 1. Background Card & Border
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');

    // Accent line at top of card
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(x + 2, y, width - 4, 1.2, 'F');

    // 2. Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, x + 4, y + 10);

    // 3. Legend on Top Right
    let curLegendX = x + width - 4;
    for (let s = series.length - 1; s >= 0; s--) {
      const item = series[s];
      const textWidth = (doc.getStringUnitWidth(item.name) * 5.2) / doc.internal.scaleFactor;
      curLegendX -= textWidth + 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(71, 85, 105);
      doc.text(item.name, curLegendX, y + 6);

      curLegendX -= 3.5;
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.roundedRect(curLegendX, y + 3.8, 2.5, 2.3, 0.4, 0.4, 'F');
      curLegendX -= 2.5;
    }

    // 4. Plot Area Geometry
    const plotLeft = x + 11;
    const plotRight = x + width - 6;
    const plotTop = y + 15;
    const plotBottom = y + height - 9;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    // Determine nice scale
    const allVals = series.flatMap((s) => s.data);
    const maxValRaw = Math.max(1, ...allVals);
    let maxScale = 5;
    if (maxValRaw > 50) {
      maxScale = Math.ceil(maxValRaw / 20) * 20;
    } else if (maxValRaw > 20) {
      maxScale = Math.ceil(maxValRaw / 10) * 10;
    } else if (maxValRaw > 10) {
      maxScale = Math.ceil(maxValRaw / 5) * 5;
    } else if (maxValRaw > 5) {
      maxScale = 10;
    } else {
      maxScale = 5;
    }

    // Grid lines (0, 50%, 100%)
    const ticks = [0, Math.round(maxScale / 2), maxScale];
    ticks.forEach((tickVal) => {
      const tickY = plotBottom - (tickVal / maxScale) * plotH;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(plotLeft, tickY, plotRight, tickY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text(String(tickVal), plotLeft - 1.5, tickY + 1.2, { align: 'right' });
    });

    // Base axis line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(plotLeft, plotBottom, plotRight, plotBottom);

    // 5. Bars Rendering
    const numCats = categories.length;
    if (numCats === 0) return;
    const slotW = plotW / numCats;
    const groupW = Math.min(slotW * 0.72, 38);
    const numSeries = series.length;
    const barW = (groupW - (numSeries - 1) * 0.8) / numSeries;

    categories.forEach((catName, catIdx) => {
      const slotCenterX = plotLeft + (catIdx + 0.5) * slotW;
      const groupStartX = slotCenterX - groupW / 2;

      series.forEach((s, sIdx) => {
        const val = s.data[catIdx] || 0;
        const barH = (val / maxScale) * (plotH - 2);
        const bx = groupStartX + sIdx * (barW + 0.8);
        const by = plotBottom - barH;

        if (barH > 0.4) {
          doc.setFillColor(s.color[0], s.color[1], s.color[2]);
          doc.roundedRect(bx, by, barW, barH, 0.4, 0.4, 'F');

          // Number above bar
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(4.5);
          doc.setTextColor(30, 41, 59);
          doc.text(String(val), bx + barW / 2, Math.max(plotTop + 1, by - 0.8), { align: 'center' });
        } else {
          // Subtle zero bar base indicator
          doc.setFillColor(226, 232, 240);
          doc.rect(bx, plotBottom - 0.4, barW, 0.4, 'F');
        }
      });

      // Category label below axis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(51, 65, 85);
      doc.text(catName, slotCenterX, plotBottom + 4.2, { align: 'center' });
    });
  }

  /**
   * Menggambar Grafik Donat (Donut Chart) Vektor Nyata di jsPDF
   */
  private static drawDonutChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    subtitle: string,
    data: { name: string; value: number; color: [number, number, number] }[],
    centerText?: { value: string; label: string }
  ) {
    // 1. Background Card & Border
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');

    // Accent line at top
    doc.setFillColor(124, 58, 237); // purple-600
    doc.rect(x + 2, y, width - 4, 1.2, 'F');

    // 2. Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, x + 4, y + 10);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    // 3. Geometry
    const cx = x + 23;
    const cy = y + 33;
    const R = 14;
    const r = 8.2;

    if (total === 0) {
      doc.setFillColor(241, 245, 249);
      doc.circle(cx, cy, R, 'F');
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy, r, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada data', cx, cy + 1, { align: 'center' });
      return;
    }

    // Draw Slices using small angular triangles
    let currentAngle = -Math.PI / 2; // start from top (12 o'clock)
    data.forEach((item) => {
      if (item.value <= 0) return;
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const steps = Math.max(2, Math.ceil(sliceAngle / 0.05));
      const stepAngle = sliceAngle / steps;

      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      for (let s = 0; s < steps; s++) {
        const a1 = currentAngle + s * stepAngle;
        const a2 = currentAngle + (s + 1) * stepAngle;
        const x1 = cx + R * Math.cos(a1);
        const y1 = cy + R * Math.sin(a1);
        const x2 = cx + R * Math.cos(a2);
        const y2 = cy + R * Math.sin(a2);
        doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
      }
      currentAngle += sliceAngle;
    });

    // Punch out inner hole
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.circle(cx, cy, r, 'S');

    // Center text inside donut
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(centerText?.value || String(total), cx, cy + 0.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.setTextColor(100, 116, 139);
    doc.text(centerText?.label || 'Pasien', cx, cy + 3.8, { align: 'center' });

    // 4. Legend on the right side
    const legendX = x + 42;
    let curLegendY = y + 16;
    const maxItems = Math.min(6, data.length);

    for (let i = 0; i < maxItems; i++) {
      const item = data[i];
      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

      // Color indicator box
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.roundedRect(legendX, curLegendY - 2.2, 2.5, 2.4, 0.4, 0.4, 'F');

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(51, 65, 85);
      doc.text(item.name, legendX + 3.8, curLegendY);

      // Count & percentage
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.value} (${pct}%)`, x + width - 3.5, curLegendY, { align: 'right' });

      curLegendY += 6.2;
    }
  }

  /**
   * Menggambar Grafik Tren Garis (Line Chart) Glukosa Pribadi di jsPDF
   */
  private static drawTrendChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    subtitle: string,
    exams: GlucoseExamination[]
  ) {
    // 1. Background Card & Border
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, width, height, 2, 2, 'S');

    // Accent line at top
    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(x + 2, y, width - 4, 1.2, 'F');

    // 2. Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, x + 4, y + 10);

    // Legend on the right
    doc.setFontSize(5);
    doc.setTextColor(22, 101, 52);
    doc.setFillColor(16, 185, 129);
    doc.circle(x + width - 54, y + 5.5, 1.2, 'F');
    doc.text('Normal (70-140)', x + width - 51, y + 6.5);

    doc.setTextColor(180, 83, 9);
    doc.setFillColor(245, 158, 11);
    doc.circle(x + width - 29, y + 5.5, 1.2, 'F');
    doc.text('Pemantauan', x + width - 26, y + 6.5);

    doc.setTextColor(185, 28, 28);
    doc.setFillColor(239, 68, 68);
    doc.circle(x + width - 11, y + 5.5, 1.2, 'F');
    doc.text('Atensi', x + width - 8, y + 6.5);

    if (!exams || exams.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Belum ada riwayat hasil pemeriksaan glukosa yang tercatat.',
        x + width / 2,
        y + height / 2 + 3,
        { align: 'center' }
      );
      return;
    }

    // Sort ascending by date
    const sorted = [...exams].sort(
      (a, b) => new Date(a.examination_datetime).getTime() - new Date(b.examination_datetime).getTime()
    );
    // Take up to 10 latest entries for clean layout
    const chartData = sorted.slice(-10);

    const plotLeft = x + 16;
    const plotRight = x + width - 8;
    const plotTop = y + 15;
    const plotBottom = y + height - 9;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const values = chartData.map((e) => e.result_value);
    const minVal = 40;
    const maxVal = Math.max(200, ...values) + 20;

    // Highlight Normal Band (70 - 140 mg/dL)
    const yNormalTop = plotBottom - ((140 - minVal) / (maxVal - minVal)) * plotH;
    const yNormalBottom = plotBottom - ((70 - minVal) / (maxVal - minVal)) * plotH;
    const bandHeight = yNormalBottom - yNormalTop;

    if (bandHeight > 0) {
      doc.setFillColor(240, 253, 244); // light green
      doc.rect(plotLeft, yNormalTop, plotW, bandHeight, 'F');

      // 140 line
      doc.setDrawColor(187, 247, 208);
      doc.setLineWidth(0.3);
      doc.line(plotLeft, yNormalTop, plotRight, yNormalTop);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(22, 101, 52);
      doc.text('Batas Normal: 140 mg/dL', plotLeft + 2, yNormalTop - 1);

      // 70 line
      doc.line(plotLeft, yNormalBottom, plotRight, yNormalBottom);
      doc.text('70 mg/dL', plotLeft + 2, yNormalBottom + 3);
    }

    // Grid lines for Y-axis (50, 100, 150, 200)
    [50, 100, 150, 200].forEach((gVal) => {
      if (gVal <= maxVal) {
        const gy = plotBottom - ((gVal - minVal) / (maxVal - minVal)) * plotH;
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(plotLeft, gy, plotRight, gy);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.5);
        doc.setTextColor(148, 163, 184);
        doc.text(String(gVal), plotLeft - 1.5, gy + 1.2, { align: 'right' });
      }
    });

    // Base axis line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(plotLeft, plotBottom, plotRight, plotBottom);

    // Calculate point coordinates
    const points = chartData.map((e, idx) => {
      const px = chartData.length === 1 ? plotLeft + plotW / 2 : plotLeft + (idx / (chartData.length - 1)) * plotW;
      const py = plotBottom - ((e.result_value - minVal) / (maxVal - minVal)) * plotH;
      const d = new Date(e.examination_datetime);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

      let color: [number, number, number] = [16, 185, 129]; // emerald
      if (e.classification === 'pemantauan') {
        color = [245, 158, 11]; // amber
      } else if (e.classification === 'perlu_perhatian' || e.classification === 'tindak_lanjut') {
        color = [239, 68, 68]; // rose
      }

      return { x: px, y: py, val: e.result_value, dateStr, color };
    });

    // Draw connecting line
    for (let i = 0; i < points.length - 1; i++) {
      doc.setDrawColor(2, 132, 199); // sky-600
      doc.setLineWidth(0.7);
      doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    // Draw point circles and labels
    points.forEach((pt) => {
      // Outer colored circle
      doc.setFillColor(pt.color[0], pt.color[1], pt.color[2]);
      doc.circle(pt.x, pt.y, 2, 'F');
      // Inner white dot
      doc.setFillColor(255, 255, 255);
      doc.circle(pt.x, pt.y, 0.9, 'F');

      // Value label above point
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${pt.val}`, pt.x, pt.y - 2.8, { align: 'center' });

      // Date label below axis
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(100, 116, 139);
      doc.text(pt.dateStr, pt.x, plotBottom + 4.5, { align: 'center' });
    });
  }

  // =========================================================================
  // 3. UNDUH PDF DASHBOARD RESMI (ADMIN, PETUGAS UKS, PIMPINAN, USER)
  // =========================================================================
  static downloadDashboardPdf(
    dashboardRole: 'admin' | 'petugas' | 'pimpinan' | 'user',
    user: UserProfile,
    data: {
      exams: GlucoseExamination[];
      visits: UksVisit[];
      followUps?: any[];
      units?: SchoolUnit[];
      studentsCount?: number;
      employeesCount?: number;
      activeVisits?: UksVisit[];
      repeatWarnings?: RepeatVisitWarning[];
    }
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    let title = 'Laporan Dashboard UKS';
    let subtitle = `Ringkasan Eksekutif & Statistik Operasional • Pengguna: ${user.full_name}`;
    let docCode = 'LUKS/DASH';

    if (dashboardRole === 'admin') {
      title = 'Laporan Eksekutif Dashboard Administrator';
      subtitle = `Status Master Data, Infrastruktur UKS, & Agregat Kesehatan Seluruh Unit`;
      docCode = 'LUKS/ADM';
    } else if (dashboardRole === 'petugas') {
      title = 'Laporan Operasional Dashboard Petugas UKS';
      subtitle = `Aktivitas Kunjungan Hari Ini, Pasien Istirahat di UKS, & Skrining Glukosa`;
      docCode = 'LUKS/OPS';
    } else if (dashboardRole === 'pimpinan') {
      title = 'Laporan Eksekutif Dashboard Manajemen & Pimpinan';
      subtitle = `Analisis Manajerial Kesehatan Sekolah Lintas Unit TK, SD, SMP, SMA`;
      docCode = 'LUKS/DIR';
    } else if (dashboardRole === 'user') {
      title = 'Buku Kesehatan & Catatan Medis UKS Pribadi';
      subtitle = `Rekam Medis Individu: ${user.full_name} (${user.employee_or_student_id})`;
      docCode = 'LUKS/USR';
    }

    const startY = this.drawLetterhead(
      doc,
      title,
      subtitle,
      `${docCode}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );

    let currentY = startY;

    // =========================================================================
    // A. USER PERSONAL DASHBOARD (BUKU KESEHATAN PRIBADI)
    // =========================================================================
    if (dashboardRole === 'user') {
      // 1. Identity Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      doc.text('INFORMASI IDENTITAS PESERTA UKS', 18, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      doc.text(`Nama Lengkap: ${user.full_name}`, 18, currentY + 12);
      doc.text(`Nomor Induk (NIS/NIY): ${user.employee_or_student_id}`, 18, currentY + 17);
      doc.text(`Kategori: ${user.category === 'siswa' ? 'Siswa Aktif' : 'Guru / Karyawan'}`, 18, currentY + 22);

      const unitObj = data.units?.find((u) => u.id === user.unit_id);
      doc.text(`Unit Sekolah: ${unitObj?.unit_name || 'Lazuardi Global School'}`, 110, currentY + 12);
      doc.text(`Jenis Kelamin: ${user.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`, 110, currentY + 17);
      doc.text(`Email Resmi: ${user.email}`, 110, currentY + 22);

      currentY += 30;

      // 2. GRAFIK TREN GULA DARAH PRIBADI (VISUAL CHART)
      this.drawTrendChart(
        doc,
        14,
        currentY,
        pageWidth - 28,
        48,
        'Grafik Tren Skrining Gula Darah Pribadi',
        'Kurva riwayat glukosa berkala dengan batas normal klinis (70 - 140 mg/dL)',
        data.exams
      );

      currentY += 52;

      // 3. Table 1: Riwayat Gula Darah Pribadi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`1. Riwayat Skrining Gula Darah Pribadi (${data.exams.length} Catatan)`, 14, currentY);

      const examRows = data.exams.map((e, idx) => [
        idx + 1,
        new Date(e.examination_datetime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        e.examination_type.toUpperCase(),
        `${e.result_value} ${e.result_unit}`,
        e.classification.replace(/_/g, ' ').toUpperCase(),
        e.examiner_name,
      ]);

      autoTable(doc, {
        startY: currentY + 2.5,
        head: [['No', 'Tanggal', 'Jenis Tes', 'Hasil', 'Klasifikasi', 'Pemeriksa']],
        body: examRows.length > 0 ? examRows : [['-', '-', '-', 'Belum ada data skrining', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 4. Table 2: Riwayat Kunjungan UKS Pribadi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. Riwayat Kunjungan ke UKS (${data.visits.length} Kunjungan)`, 14, currentY);

      const visitRows = data.visits.map((v, idx) => [
        idx + 1,
        new Date(v.visit_datetime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        v.visit_reason.toUpperCase(),
        v.main_complaint,
        v.outcome ? v.outcome.replace(/_/g, ' ').toUpperCase() : 'SELESAI',
        v.handling_staff_name,
      ]);

      autoTable(doc, {
        startY: currentY + 2.5,
        head: [['No', 'Tanggal', 'Alasan', 'Keluhan Utama', 'Hasil Penanganan', 'Petugas UKS']],
        body: visitRows.length > 0 ? visitRows : [['-', '-', '-', 'Belum ada data kunjungan UKS', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });

      this.drawSignatures(doc, user.full_name, 'Tanda Tangan Pemilik Rekam Medis');
      doc.save(`LUKS_Buku_Kesehatan_${user.employee_or_student_id}.pdf`);
      return;
    }

    // =========================================================================
    // B. EXECUTIVE & OPERATIONAL DASHBOARDS (ADMIN / PETUGAS / PIMPINAN)
    // =========================================================================

    // 1. KPI Box Grid (4 Ringkasan Angka Kunci)
    const totalVisits = data.visits.length;
    const totalExams = data.exams.length;
    const normalExams = data.exams.filter((e) => e.classification === 'normal').length;
    const normalPct = totalExams > 0 ? Math.round((normalExams / totalExams) * 100) : 0;
    const repeatCount = data.repeatWarnings ? data.repeatWarnings.length : 0;
    const activeRestingCount = data.activeVisits ? data.activeVisits.length : 0;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 23, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 23, 2, 2, 'S');

    const colW = (pageWidth - 28) / 4;
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');

    // KPI 1: Kunjungan UKS
    doc.text('TOTAL KUNJUNGAN UKS', 18, currentY + 5.5);
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199);
    doc.text(`${totalVisits}`, 18, currentY + 13);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Kunjungan terdata', 18, currentY + 18);

    // KPI 2: Skrining Gula Darah
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('SKRINING GULA DARAH', 18 + colW, currentY + 5.5);
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(`${totalExams}`, 18 + colW, currentY + 13);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`${normalPct}% Normal (${normalExams} Peserta)`, 18 + colW, currentY + 18);

    // KPI 3: Pasien Sedang di UKS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('PASIEN SEDANG DI UKS', 18 + colW * 2, currentY + 5.5);
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11);
    doc.text(`${activeRestingCount}`, 18 + colW * 2, currentY + 13);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Observasi & Pemantauan', 18 + colW * 2, currentY + 18);

    // KPI 4: Peringatan Berulang
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('PERINGATAN BERULANG', 18 + colW * 3, currentY + 5.5);
    doc.setFontSize(13);
    doc.setTextColor(239, 68, 68);
    doc.text(`${repeatCount}`, 18 + colW * 3, currentY + 13);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('≥ 3 kali dalam 30 hari', 18 + colW * 3, currentY + 18);

    currentY += 27;

    // 2. BAGIAN I: VISUALISASI GRAFIK AKTIVITAS OPERASIONAL & PENANGANAN UKS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. VISUALISASI GRAFIK AKTIVITAS OPERASIONAL & PENANGANAN UKS', 14, currentY);

    currentY += 3.5;

    // Units dataset
    const units: SchoolUnit[] =
      data.units && data.units.length > 0
        ? data.units
        : [
            { id: 'unit-tk', unit_name: 'TK Lazuardi Compassionate', unit_code: 'TK', is_active: true },
            { id: 'unit-sd', unit_name: 'SD Lazuardi Compassionate', unit_code: 'SD', is_active: true },
            { id: 'unit-smp', unit_name: 'SMP Lazuardi Compassionate', unit_code: 'SMP', is_active: true },
            { id: 'unit-sma', unit_name: 'SMA Lazuardi Compassionate', unit_code: 'SMA', is_active: true },
          ];

    // Helper untuk memisahkan kategori Siswa vs Karyawan/Guru
    const isEmpVisit = (v: UksVisit) =>
      v.participant?.category === 'karyawan' || (v as any).patient_category === 'karyawan';
    const isEmpExam = (e: GlucoseExamination) =>
      e.participant?.category === 'karyawan' || (e as any).participant_category === 'karyawan';

    // Data for Bar Chart: Aktivitas Antar Unit (Pemisahan Siswa & Karyawan)
    const unitCodes = units.map((u) => u.unit_code);
    const unitVisitsSiswa = units.map(
      (u) =>
        data.visits.filter(
          (v) => (v.participant?.unit_id === u.id || (v as any).unit_id === u.id) && !isEmpVisit(v)
        ).length
    );
    const unitVisitsKaryawan = units.map(
      (u) =>
        data.visits.filter(
          (v) => (v.participant?.unit_id === u.id || (v as any).unit_id === u.id) && isEmpVisit(v)
        ).length
    );
    const unitExamsSiswa = units.map(
      (u) =>
        data.exams.filter(
          (e) => (e.participant?.unit_id === u.id || (e as any).unit_id === u.id) && !isEmpExam(e)
        ).length
    );
    const unitExamsKaryawan = units.map(
      (u) =>
        data.exams.filter(
          (e) => (e.participant?.unit_id === u.id || (e as any).unit_id === u.id) && isEmpExam(e)
        ).length
    );

    // Data for Donut Chart: Distribusi Penanganan
    const outcomeCounts: Record<string, number> = {
      kembali_ke_kelas: 0,
      beristirahat_di_uks: 0,
      dijemput_keluarga: 0,
      dipulangkan: 0,
      dirujuk: 0,
    };

    data.visits.forEach((v) => {
      const o = v.outcome || 'beristirahat_di_uks';
      if (o === 'kembali_ke_kelas' || o === 'kembali_bekerja') {
        outcomeCounts.kembali_ke_kelas++;
      } else if (o === 'dirujuk') {
        outcomeCounts.dirujuk++;
      } else if (o === 'dipulangkan') {
        outcomeCounts.dipulangkan++;
      } else if (o === 'dijemput_keluarga') {
        outcomeCounts.dijemput_keluarga++;
      } else {
        outcomeCounts.beristirahat_di_uks++;
      }
    });

    const outcomePieData: { name: string; value: number; color: [number, number, number] }[] = [
      { name: 'Kembali Kelas/Kerja', value: outcomeCounts.kembali_ke_kelas, color: [16, 185, 129] }, // emerald
      { name: 'Istirahat di UKS', value: outcomeCounts.beristirahat_di_uks, color: [2, 132, 199] }, // sky
      { name: 'Dijemput Keluarga', value: outcomeCounts.dijemput_keluarga, color: [139, 92, 246] }, // violet
      { name: 'Dipulangkan', value: outcomeCounts.dipulangkan, color: [245, 158, 11] }, // amber
      { name: 'Dirujuk ke RS/Klinik', value: outcomeCounts.dirujuk, color: [239, 68, 68] }, // rose
    ];

    // GAMBAR DUA GRAFIK BERSEBELAHAN (SIDE-BY-SIDE):
    // Kiri: Grouped Bar Chart (width: 104mm, height: 55mm) - Siswa vs Karyawan
    this.drawGroupedBarChart(
      doc,
      14,
      currentY,
      104,
      55,
      'Aktivitas UKS Antar Unit',
      'Pemisahan Kunjungan & Skrining Glukosa (Siswa vs Karyawan)',
      unitCodes,
      [
        { name: 'Kunj. Siswa', color: [2, 132, 199], data: unitVisitsSiswa },
        { name: 'Kunj. Kary.', color: [99, 102, 241], data: unitVisitsKaryawan },
        { name: 'Gula Siswa', color: [16, 185, 129], data: unitExamsSiswa },
        { name: 'Gula Kary.', color: [245, 158, 11], data: unitExamsKaryawan },
      ]
    );

    // Kanan: Donut Chart (width: 74mm, height: 55mm)
    this.drawDonutChart(
      doc,
      122,
      currentY,
      74,
      55,
      'Distribusi Penanganan Pasien',
      'Proporsi hasil akhir & disposisi',
      outcomePieData,
      { value: String(totalVisits), label: 'Kunjungan' }
    );

    currentY += 59;

    // 3. Tabel 1: Komparasi Aktivitas UKS Antar Unit Sekolah (Rincian Siswa & Karyawan)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Tabel Rekapitulasi Komparasi Antar Unit Sekolah (Siswa & Karyawan)', 14, currentY);

    const unitComparisonRows = units.map((u, idx) => {
      const uVisits = data.visits.filter(
        (v) => v.participant?.unit_id === u.id || (v as any).unit_id === u.id
      );
      const vSiswa = uVisits.filter((v) => !isEmpVisit(v)).length;
      const vKary = uVisits.filter((v) => isEmpVisit(v)).length;

      const uExams = data.exams.filter(
        (e) => e.participant?.unit_id === u.id || (e as any).unit_id === u.id
      );
      const eSiswa = uExams.filter((e) => !isEmpExam(e)).length;
      const eKary = uExams.filter((e) => isEmpExam(e)).length;

      return [
        idx + 1,
        u.unit_code,
        u.unit_name,
        `${vSiswa} Siswa`,
        `${vKary} Kary.`,
        `${eSiswa} Siswa`,
        `${eKary} Kary.`,
        uVisits.filter((v) => v.outcome === 'dirujuk').length,
      ];
    });

    autoTable(doc, {
      startY: currentY + 2.5,
      head: [
        [
          'No',
          'Kode',
          'Nama Unit Sekolah',
          'Kunj. Siswa',
          'Kunj. Kary.',
          'Glukosa Siswa',
          'Glukosa Kary.',
          'Rujukan',
        ],
      ],
      body: unitComparisonRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 6.2, cellPadding: 1.6, halign: 'center' },
      columnStyles: {
        2: { halign: 'left', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // 4. Tabel 2: Distribusi Hasil Penanganan Kunjungan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Tabel Rekapitulasi Distribusi Hasil Penanganan UKS', 14, currentY);

    const outcomeLabelsFull: Record<string, string> = {
      kembali_ke_kelas: 'Kembali ke Kelas / Kembali Bekerja',
      beristirahat_di_uks: 'Sedang / Telah Beristirahat di Ruang UKS',
      dijemput_keluarga: 'Dijemput oleh Orang Tua / Keluarga Pasien',
      dipulangkan: 'Dipulangkan oleh Pihak Sekolah',
      dirujuk: 'Dirujuk ke Fasilitas Pelayanan Kesehatan / Rumah Sakit',
    };

    const outcomeRows = outcomePieData.map((d, idx) => {
      const fullLabel =
        idx === 0
          ? outcomeLabelsFull.kembali_ke_kelas
          : idx === 1
          ? outcomeLabelsFull.beristirahat_di_uks
          : idx === 2
          ? outcomeLabelsFull.dijemput_keluarga
          : idx === 3
          ? outcomeLabelsFull.dipulangkan
          : outcomeLabelsFull.dirujuk;
      const pct = totalVisits > 0 ? Math.round((d.value / totalVisits) * 100) : 0;
      return [idx + 1, fullLabel, `${d.value} Pasien`, `${pct}%`];
    });

    autoTable(doc, {
      startY: currentY + 2.5,
      head: [['No', 'Kategori Disposisi / Hasil Akhir Penanganan', 'Jumlah Pasien', 'Proporsi (%)']],
      body: outcomeRows,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], fontSize: 6.8, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 1.8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 28 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Catatan Kaki Halaman 1
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Halaman 1 dari 2 • Grafik Komparatif Demografis Siswa vs Guru & Karyawan serta Lembar Pengesahan tercantum pada Halaman 2.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );

    // =========================================================================
    // HALAMAN 2: GRAFIK STATISTIK KOMPARATIF SISWA VS GURU & KARYAWAN
    // =========================================================================
    doc.addPage();

    // Top Accent Strip
    doc.setFillColor(30, 58, 138);
    doc.rect(14, 10, pageWidth - 28, 2.5, 'F');

    // Running Header Halaman 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('LAZUARDI GLOBAL COMPASSIONATE SCHOOL • UKS TERPADU', 14, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Halaman 2: Analisis Statistik Komparatif Kesehatan (Siswa vs Guru & Karyawan)', 14, 21);

    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`${docCode} • ${printDate}`, pageWidth - 14, 17, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, 23.5, pageWidth - 14, 23.5);

    // Section Header Halaman 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('II. ANALISIS STATISTIK KOMPARATIF: SISWA VS GURU & KARYAWAN', 14, 29);

    // Demographic data breakdown
    const studentExams = data.exams.filter((e) => e.participant?.category === 'siswa');
    const staffExams = data.exams.filter((e) => e.participant?.category === 'karyawan');

    const studentVisits = data.visits.filter((v) => v.participant?.category === 'siswa');
    const staffVisits = data.visits.filter((v) => v.participant?.category === 'karyawan');

    // GRAFIK 3: Wide Grouped Bar Chart - Komparasi Skrining Glukosa (width: 182, height: 48)
    this.drawGroupedBarChart(
      doc,
      14,
      32,
      pageWidth - 28,
      48,
      '1. Komparasi Status Skrining Gula Darah (Siswa vs Guru & Karyawan)',
      'Distribusi klasifikasi hasil pemeriksaan glukosa pada kelompok peserta didik dan tenaga pengajar/karyawan',
      ['Normal', 'Perlu Perhatian', 'Pemantauan', 'Tindak Lanjut'],
      [
        {
          name: `Siswa (${studentExams.length} Tes)`,
          color: [2, 132, 199], // sky-600
          data: [
            studentExams.filter((e) => e.classification === 'normal').length,
            studentExams.filter((e) => e.classification === 'perlu_perhatian').length,
            studentExams.filter((e) => e.classification === 'pemantauan').length,
            studentExams.filter((e) => e.classification === 'tindak_lanjut').length,
          ],
        },
        {
          name: `Guru & Karyawan (${staffExams.length} Tes)`,
          color: [16, 185, 129], // emerald-600
          data: [
            staffExams.filter((e) => e.classification === 'normal').length,
            staffExams.filter((e) => e.classification === 'perlu_perhatian').length,
            staffExams.filter((e) => e.classification === 'pemantauan').length,
            staffExams.filter((e) => e.classification === 'tindak_lanjut').length,
          ],
        },
      ]
    );

    // GRAFIK 4: Wide Grouped Bar Chart - Komparasi Alasan Kunjungan UKS (width: 182, height: 48)
    this.drawGroupedBarChart(
      doc,
      14,
      83,
      pageWidth - 28,
      48,
      '2. Komparasi Alasan Kunjungan UKS (Siswa vs Guru & Karyawan)',
      'Perbandingan volume keluhan dan alasan kedatangan ke ruang UKS antara siswa dan pendidik/staf',
      ['Sakit', 'Cedera / Insiden', 'Cek Rutin', 'Lainnya'],
      [
        {
          name: `Siswa (${studentVisits.length} Kunjungan)`,
          color: [99, 102, 241], // indigo-500
          data: [
            studentVisits.filter((v) => v.visit_reason === 'sakit').length,
            studentVisits.filter((v) => v.visit_reason === 'cedera').length,
            studentVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
            studentVisits.filter((v) => v.visit_reason === 'lainnya').length,
          ],
        },
        {
          name: `Guru & Karyawan (${staffVisits.length} Kunjungan)`,
          color: [245, 158, 11], // amber-500
          data: [
            staffVisits.filter((v) => v.visit_reason === 'sakit').length,
            staffVisits.filter((v) => v.visit_reason === 'cedera').length,
            staffVisits.filter((v) => v.visit_reason === 'pemeriksaan_rutin').length,
            staffVisits.filter((v) => v.visit_reason === 'lainnya').length,
          ],
        },
      ]
    );

    // 5. Tabel 3: Matriks Rekapitulasi Data Kesehatan Demografis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Matriks Rekapitulasi Data Kesehatan Demografis', 14, 135);

    const compRows = [
      [
        '1',
        'Total Skrining Gula Darah Terdaftar',
        `${studentExams.length} peserta`,
        `${staffExams.length} peserta`,
        `${data.exams.length} skrining`,
        'Skrining berkala & insidental',
      ],
      [
        '2',
        'Glukosa Darah Normal',
        `${studentExams.filter((e) => e.classification === 'normal').length}`,
        `${staffExams.filter((e) => e.classification === 'normal').length}`,
        `${data.exams.filter((e) => e.classification === 'normal').length}`,
        'Sesuai nilai acuan parameter klinis',
      ],
      [
        '3',
        'Glukosa Perlu Perhatian / Pemantauan',
        `${studentExams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'pemantauan').length}`,
        `${staffExams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'pemantauan').length}`,
        `${data.exams.filter((e) => e.classification === 'perlu_perhatian' || e.classification === 'pemantauan').length}`,
        'Edukasi pola hidup & cek berkala',
      ],
      [
        '4',
        'Glukosa Memerlukan Tindak Lanjut Medis',
        `${studentExams.filter((e) => e.classification === 'tindak_lanjut').length}`,
        `${staffExams.filter((e) => e.classification === 'tindak_lanjut').length}`,
        `${data.exams.filter((e) => e.classification === 'tindak_lanjut').length}`,
        'Rujukan konsultasi dokter faskes',
      ],
      [
        '5',
        'Total Kunjungan UKS Terdata',
        `${studentVisits.length} kunjungan`,
        `${staffVisits.length} kunjungan`,
        `${data.visits.length} kunjungan`,
        'Buku register rekam medis UKS',
      ],
      [
        '6',
        'Kunjungan Pasien Keluhan Sakit',
        `${studentVisits.filter((v) => v.visit_reason === 'sakit').length}`,
        `${staffVisits.filter((v) => v.visit_reason === 'sakit').length}`,
        `${data.visits.filter((v) => v.visit_reason === 'sakit').length}`,
        'Keluhan demam, pusing, mag, flu',
      ],
      [
        '7',
        'Kunjungan Cedera / Trauma Fisik',
        `${studentVisits.filter((v) => v.visit_reason === 'cedera').length}`,
        `${staffVisits.filter((v) => v.visit_reason === 'cedera').length}`,
        `${data.visits.filter((v) => v.visit_reason === 'cedera').length}`,
        'Pertolongan pertama (P3K) di sekolah',
      ],
    ];

    autoTable(doc, {
      startY: 138,
      head: [['No', 'Indikator Kesehatan UKS', 'Kelompok Siswa', 'Guru & Karyawan', 'Total Gabungan', 'Catatan Klinis']],
      body: compRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], fontSize: 6.8, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 6.5, cellPadding: 1.6 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 32 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 28 },
        5: { halign: 'left' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Tanda Tangan Resmi Pengesahan di Bawah Halaman 2
    this.drawSignatures(doc, user.full_name, `Dicetak oleh: ${user.full_name} (${user.role.toUpperCase()})`);

    doc.save(`LUKS_Dashboard_${dashboardRole.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // =========================================================================
  // 4. UNDUH PDF LAPORAN RESMI (12 JENIS LAPORAN PADA REPORTSPAGE)
  // =========================================================================
  static downloadReportPdf(
    reportType: string,
    reportTitle: string,
    data: {
      exams: GlucoseExamination[];
      visits: UksVisit[];
      warnings: RepeatVisitWarning[];
      unitMap: Map<string, string>;
      assessmentsMap: Map<string, UksAssessment>;
      startDate?: string;
      endDate?: string;
      unitName?: string;
      categoryName?: string;
      signatures?: {
        preparerName?: string;
        approverTitle?: string;
        approverName?: string;
        approverNiy?: string;
        staffTitle?: string;
        staffName?: string;
        staffNiy?: string;
        locationDate?: string;
      };
    }
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let filterText = 'Periode: Seluruh Data Terdaftar';
    if (data.startDate || data.endDate) {
      filterText = `Periode: ${data.startDate || 'Awal'} s.d. ${data.endDate || 'Sekarang'}`;
    }
    if (data.unitName) filterText += ` • Unit: ${data.unitName}`;
    if (data.categoryName) filterText += ` • Kategori: ${data.categoryName === 'siswa' ? 'Siswa' : 'Karyawan'}`;
    if (data.signatures?.preparerName) filterText += ` • Penyusun: ${data.signatures.preparerName}`;

    const startY = this.drawLetterhead(
      doc,
      reportTitle,
      filterText,
      `LUKS/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );

    // Build specific table columns based on reportType
    if (
      reportType === 'laporan_gula_darah' ||
      reportType === 'laporan_per_peserta' ||
      reportType === 'laporan_tren_gula_darah'
    ) {
      const rows = data.exams.map((e, idx) => [
        idx + 1,
        new Date(e.examination_datetime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        e.participant?.employee_or_student_id || '-',
        e.participant?.full_name || '-',
        e.participant?.unit_id ? data.unitMap.get(e.participant.unit_id) || '-' : '-',
        e.examination_type.toUpperCase(),
        `${e.result_value} ${e.result_unit}`,
        e.classification.replace(/_/g, ' ').toUpperCase(),
        e.examiner_name,
      ]);

      autoTable(doc, {
        startY,
        head: [['No', 'Tanggal', 'NIS/NIY', 'Nama Peserta', 'Unit', 'Jenis Tes', 'Hasil', 'Klasifikasi', 'Pemeriksa']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });
    } else if (reportType === 'laporan_kunjungan_berulang') {
      const rows = data.warnings.map((w, idx) => [
        idx + 1,
        w.participant.employee_or_student_id,
        w.participant.full_name,
        w.participant.category === 'siswa' ? 'Siswa' : 'Karyawan',
        data.unitMap.get(w.participant.unit_id) || '-',
        `${w.visit_count} Kali`,
        w.status_review === 'telah_ditelaah' ? 'Telah Ditelaah' : 'Menunggu',
        w.internal_notes || '-',
      ]);

      autoTable(doc, {
        startY,
        head: [['No', 'NIS/NIY', 'Nama Pasien', 'Kategori', 'Unit', 'Kunjungan (30 Hr)', 'Status Telaah', 'Catatan Medis']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });
    } else {
      // General UKS visits, complaints, outcomes, referrals
      const rows = data.visits.map((v, idx) => {
        const asm = data.assessmentsMap.get(v.id);
        const vitals = asm?.temperature ? `${asm.temperature}°C` : '-';
        return [
          idx + 1,
          new Date(v.visit_datetime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          v.participant?.employee_or_student_id || '-',
          v.participant?.full_name || '-',
          v.participant?.unit_id ? data.unitMap.get(v.participant.unit_id) || '-' : '-',
          v.main_complaint,
          vitals,
          asm?.treatment || '-',
          v.outcome ? v.outcome.replace(/_/g, ' ') : 'Dalam Proses',
          v.handling_staff_name,
        ];
      });

      autoTable(doc, {
        startY,
        head: [['No', 'Tanggal', 'NIS/NIY', 'Nama Pasien', 'Unit', 'Keluhan Utama', 'Suhu', 'Tindakan', 'Hasil', 'Petugas']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
      });
    }

    this.drawSignatures(doc, undefined, undefined, data.signatures);
    doc.save(`LUKS_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
