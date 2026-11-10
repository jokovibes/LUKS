/**
 * Layanan Pengolahan CSV (Parser & Generator Template) - LUKS
 * Lazuardi UKS Management System
 * Menghasilkan berkas CSV standar RFC 4180 dengan UTF-8 BOM untuk kompatibilitas penuh Excel.
 */

export class CsvService {
  /**
   * Mengunduh konten teks CSV sebagai berkas fisik
   */
  static downloadCsv(filename: string, csvContent: string) {
    // Tambahkan UTF-8 BOM (\uFEFF) agar Microsoft Excel membuka aksen dan karakter Indonesia secara presisi
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
  /**
   * Normalisasi satu baris CSV untuk menangani variasi format Microsoft Excel / Google Sheets:
   * 1. Baris berformat pembungkus kutip ganda Excel (seluruh baris dibungkus kutip luar,
   *    kolom selanjutnya diawali `,""` atau `;""`, dan nama bergelar seperti "Joko Maryanto, S.Si"
   *    berisi koma tanpa tanda kutip penutup sendiri sebelum koma pembatas).
   * 2. Baris yang tidak diawali tanda kutip, namun kolom pertama berisi gelar/koma diikuti kolom bertanda kutip
   *    (misal: Joko Maryanto, S.Si,"10.15.505","joko@lazuardi.sch.id",...).
   * 3. Seluruh baris diapit tanda kutip luar oleh Excel dengan tanda kutip ganda standar di dalamnya.
   */
  static normalizeCsvLine(line: string): string {
    let s = line.trim().replace(/^\uFEFF/, '');
    if (!s) return s;

    // Kasus 1: Baris diapit tanda kutip luar oleh Excel dengan tanda kutip ganda di kolom-kolom berikutnya
    // Contoh: "Nama Lengkap,""NIY"",""Email""..."
    // Contoh: "Abdaah Alifah, A.Md, I.Kom,""10.24.758"",""abda@lazuardi.sch.id""..."
    // Contoh: "Abdul Ghofar, A.Md.OT, S.Pd M.H., C.M.Ph.,""12.01.058""..."
    if (s.startsWith('"') && s.endsWith('"') && (s.includes(',""') || s.includes(';""'))) {
      const inner = s.slice(1, -1);
      const firstSepIndex = inner.search(/[,;]""/);
      if (firstSepIndex !== -1) {
        const field0 = inner.slice(0, firstSepIndex).replace(/""/g, '"');
        const sepChar = inner[firstSepIndex];
        const rest = inner.slice(firstSepIndex + 1);
        return JSON.stringify(field0) + sepChar + rest.replace(/""/g, '"');
      }
    }

    // Kasus 2: Baris tidak diawali tanda kutip, namun kolom pertama berisi gelar/koma diikuti kolom bertanda kutip
    // Contoh: Joko Maryanto, S.Si,"10.15.505","joko@lazuardi.sch.id",...
    if (!s.startsWith('"') && (s.includes(',"') || s.includes(';"'))) {
      const firstQuotedSep = s.search(/[,;]"/);
      if (firstQuotedSep !== -1) {
        const field0 = s.slice(0, firstQuotedSep);
        if (field0.includes(',') || field0.includes(';')) {
          const rest = s.slice(firstQuotedSep);
          return JSON.stringify(field0) + rest;
        }
      }
    }

    // Kasus 3: Seluruh baris diapit tanda kutip luar oleh Excel dengan tanda kutip ganda standar di dalamnya
    if (s.startsWith('"') && s.endsWith('"')) {
      const unwrapped = s.slice(1, -1).replace(/""/g, '"');
      if (unwrapped.includes(',') || unwrapped.includes(';')) {
        return unwrapped;
      }
    }

    return s;
  }

  /**
   * Mengonversi format tanggal yang fleksibel (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, atau Excel Serial Number seperti 36458)
   * menjadi format standar ISO YYYY-MM-DD.
   */
  static parseFlexibleDate(val?: string): string | undefined {
    if (!val) return undefined;
    const trimmed = String(val).trim();
    if (!trimmed) return undefined;

    // Format ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Format Indonesia / Eropa: DD/MM/YYYY atau DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    // Nomor seri tanggal Excel (Excel Epoch serial date, contoh 36458 -> 1999-10-25)
    const num = Number(trimmed);
    if (!isNaN(num) && num >= 1000 && num <= 60000 && Number.isInteger(num)) {
      // 25569 adalah selisih hari antara 1899-12-30 (Excel epoch) dan 1970-01-01 (Unix epoch)
      const utcDays = num - 25569;
      const date = new Date(utcDays * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    return undefined;
  }

  /**
   * Parser untuk satu baris CSV tunggal dengan normalisasi cerdas
   */
  static parseSingleCsvLine(line: string): string[] {
    const s = CsvService.normalizeCsvLine(line);
    const row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      const nextChar = s[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    return row;
  }

  /**
   * Parser CSV cerdas yang menangani koma di dalam tanda kutip, UTF-8 BOM,
   * gelar nama (koma di dalam nama), pembungkus kutip ganda Microsoft Excel, spasi, dan CRLF/LF.
   */
  static parseCsv(text: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    // Hapus UTF-8 BOM jika ada
    let standardized = text;
    if (standardized.charCodeAt(0) === 0xfeff) {
      standardized = standardized.slice(1);
    }

    // Standarisasi baris baru
    const rawLines = standardized.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    // Normalisasi setiap baris agar nama bergelar dan pembungkus Excel dipulihkan dengan benar
    const normalizedLines = rawLines.map((line) => CsvService.normalizeCsvLine(line));

    const cleanText = normalizedLines.join('\n');

    const pushRow = (r: string[]) => {
      let targetRow = r;
      // Jika suatu baris hanya memiliki 1 kolom tetapi berisi pemisah koma/titik koma, uraikan ulang baris tersebut
      if (targetRow.length === 1 && (targetRow[0].includes(',') || targetRow[0].includes(';'))) {
        targetRow = CsvService.parseSingleCsvLine(targetRow[0]);
      }
      if (targetRow.some((col) => col.length > 0)) {
        lines.push(targetRow);
      }
    };

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i++; // Lewati quote kedua
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        // Mendukung pembatas koma maupun titik koma (standar Excel regional Indonesia)
        row.push(field.trim());
        field = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(field.trim());
        pushRow(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    if (field || row.length > 0) {
      row.push(field.trim());
      pushRow(row);
    }

    return lines;
  }

  // =========================================================================
  // 1. TEMPLATE CSV PENGGUNA & ROLE
  // =========================================================================
  static downloadUserTemplateCsv() {
    const headers = [
      'Nama Lengkap',
      'Email',
      'Nomor Identitas (NIS/NIY)',
      'Role (admin/petugas_uks/pimpinan/karyawan/siswa)',
      'Kategori (karyawan/siswa)',
      'Kode Unit (TK/SD/SMP/SMA)',
      'Jenis Kelamin (L/P)',
      'Unit Kerja / Jabatan',
    ];

    const sampleRows = [
      ['Rahmat Hidayat, S.Pd', 'rahmat.hidayat@lazuardi.sch.id', 'NIY-2026-081', 'karyawan', 'karyawan', 'SMP', 'L', 'Guru Olahraga & Pembina UKS'],
      ['Ns. Dewi Sartika, S.Kep', 'dewi.sartika@lazuardi.sch.id', 'UKS-002', 'petugas_uks', 'karyawan', 'SD', 'P', 'Perawat UKS SD'],
      ['Muhammad Fajar Ramadhan', 'fajar.ramadhan@lazuardi.sch.id', 'NIS-2026-101', 'siswa', 'siswa', 'SMA', 'L', 'Siswa Kelas 10'],
      ['Zahra Aulia Putri', 'zahra.aulia@lazuardi.sch.id', 'NIS-2026-102', 'siswa', 'siswa', 'SD', 'P', 'Siswa Kelas 4'],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Pengguna_LUKS.csv', csvString);
  }

  // =========================================================================
  // 2. TEMPLATE CSV SISWA
  // =========================================================================
  static downloadStudentTemplateCsv() {
    const headers = [
      'Nama Lengkap',
      'NIS',
      'Email',
      'Kode Unit (TK/SD/SMP/SMA)',
      'Nama Kelas',
      'Jenis Kelamin (L/P)',
      'Tanggal Lahir (YYYY-MM-DD)',
      'No Telepon / Kontak',
      'Nama Orang Tua / Kontak Darurat',
      'No HP Darurat',
    ];

    const sampleRows = [
      ['Muhammad Fatih Al-Ayyubi', 'NIS-2026-001', 'fatih@siswa.lazuardi.sch.id', 'SD', '1 Abu Bakar', 'L', '2019-03-15', '081234567891', 'Bapak Hendra', '081298765432'],
      ['Khadijah Nurul Izzah', 'NIS-2026-002', 'khadijah@siswa.lazuardi.sch.id', 'SD', '1 Abu Bakar', 'P', '2019-07-20', '081234567892', 'Ibu Fatimah', '081298765433'],
      ['Rayhan Athallah Pratama', 'NIS-2026-003', 'rayhan@siswa.lazuardi.sch.id', 'SMP', '7 Al-Khawarizmi', 'L', '2013-11-10', '081234567893', 'Bapak Pratama', '081298765434'],
      ['Syifa Anindya Putri', 'NIS-2026-004', 'syifa@siswa.lazuardi.sch.id', 'SMA', '10 IPA 1 - Ibnu Sina', 'P', '2010-09-05', '081234567894', 'Ibu Dewi', '081298765435'],
      ['Adam Malik Al-Faris', 'NIS-2026-005', 'adam@siswa.lazuardi.sch.id', 'TK', 'TK A - Al-Fatih', 'L', '2021-04-12', '081234567895', 'Bapak Malik', '081298765436'],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Data_Siswa_LUKS.csv', csvString);
  }

  // =========================================================================
  // 3. TEMPLATE CSV GURU & KARYAWAN
  // =========================================================================
  static downloadEmployeeTemplateCsv() {
    const headers = [
      'Nama Lengkap',
      'NIY',
      'Email',
      'Role (karyawan/petugas_uks/admin/pimpinan)',
      'Kode Unit (TK/SD/SMP/SMA)',
      'Unit Kerja / Posisi',
      'Jenis Kelamin (L/P)',
      'Tanggal Lahir (YYYY-MM-DD)',
      'No Telepon',
      'Nama Kontak Darurat',
      'No HP Darurat',
    ];

    const sampleRows = [
      ['Drs. Hendro Wibowo, M.Si', 'NIY-2026-011', 'hendro.wibowo@lazuardi.sch.id', 'karyawan', 'SMA', 'Guru Fisika & Wakil Kurikulum', 'L', '1980-04-12', '081311223344', 'Ibu Retno', '081399887766'],
      ['Siti Khadijah, S.Pd', 'NIY-2026-012', 'siti.khadijah@lazuardi.sch.id', 'karyawan', 'SD', 'Wali Kelas 1 SD', 'P', '1987-11-23', '081311223345', 'Bapak Yusuf', '081399887767'],
      ['Ns. Ratna Wulandari, A.Md.Kep', 'NIY-2026-013', 'ratna.uks@lazuardi.sch.id', 'petugas_uks', 'SMP', 'Petugas UKS SMP', 'P', '1992-06-19', '081311223346', 'Bapak Wawan', '081399887768'],
      ['Ir. Bambang Sutejo', 'NIY-2026-014', 'bambang.sutejo@lazuardi.sch.id', 'pimpinan', 'SMA', 'Kepala Sekolah SMA', 'L', '1975-02-08', '081311223347', 'Ibu Diana', '081399887769'],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Guru_Karyawan_LUKS.csv', csvString);
  }

  // =========================================================================
  // 4. TEMPLATE CSV UNIT SEKOLAH & KELAS
  // =========================================================================
  static downloadUnitsClassesTemplateCsv() {
    const headers = [
      'Tipe (UNIT/KELAS)',
      'Kode Unit (TK/SD/SMP/SMA)',
      'Nama Unit',
      'Kepala Unit',
      'Nama Kelas',
    ];

    const sampleRows = [
      ['UNIT', 'TK', 'Pra-TK & TK Lazuardi', 'Dra. Hj. Nurul Hidayati', ''],
      ['UNIT', 'SD', 'SD Lazuardi Global Compassionate', 'H. Ahmad Syarif, M.Pd', ''],
      ['UNIT', 'SMP', 'SMP Lazuardi Global Compassionate', 'Siti Mariam, S.Pd', ''],
      ['UNIT', 'SMA', 'SMA Lazuardi Global Compassionate', 'Ir. H. Muhammad Ridwan, M.M', ''],
      ['KELAS', 'TK', '', '', 'TK A - Al-Fatih'],
      ['KELAS', 'TK', '', '', 'TK B - Ar-Rasyid'],
      ['KELAS', 'SD', '', '', '1 Abu Bakar'],
      ['KELAS', 'SD', '', '', '1 Umar Bin Khattab'],
      ['KELAS', 'SMP', '', '', '7 Al-Khawarizmi'],
      ['KELAS', 'SMP', '', '', '8 Ibnu Rusyd'],
      ['KELAS', 'SMA', '', '', '10 IPA 1 - Ibnu Sina'],
      ['KELAS', 'SMA', '', '', '11 IPS 1 - Al-Biruni'],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Unit_Kelas_LUKS.csv', csvString);
  }

  // =========================================================================
  // 5. TEMPLATE CSV KUNJUNGAN UKS
  // =========================================================================
  static downloadUksVisitsTemplateCsv() {
    const headers = [
      'NIS atau NIY Pasien',
      'Nama Pasien',
      'Tanggal & Waktu (YYYY-MM-DD HH:MM)',
      'Alasan Kunjungan (sakit/cedera_insiden/pemeriksaan_rutin/istirahat/konsultasi_obat/lainnya)',
      'Keluhan Utama',
      'Kronologi / Lokasi Kejadian',
      'Pengantar / Teman',
      'Suhu Tubuh (°C)',
      'Tekanan Darah (Sistol/Diastol)',
      'Detak Nadi (bpm)',
      'Saturasi Oksigen (%)',
      'Tindakan / Penanganan',
      'Obat Diberikan',
      'Hasil Disposisi (kembali_ke_kelas/kembali_bekerja/beristirahat_di_uks/dijemput_orang_tua/rujuk_ke_faskes)',
      'Petugas Pemeriksa',
    ];

    const sampleRows = [
      [
        'NIS-2026-001',
        'Muhammad Fatih Al-Ayyubi',
        '2026-10-30 08:30',
        'sakit',
        'Demam dan sakit kepala saat pelajaran Matematika',
        'Kelas 1 SD Abu Bakar',
        'Wali Kelas Bu Siti',
        '38.2',
        '100/65',
        '88',
        '98',
        'Kompres dahi dan observasi di bed UKS',
        'Paracetamol Sirup 5ml',
        'beristirahat_di_uks',
        'Ns. Siti Rahmah, S.Kep',
      ],
      [
        'NIS-2026-003',
        'Rayhan Athallah Pratama',
        '2026-10-30 09:45',
        'cedera_insiden',
        'Lutut kanan lecet terjatuh saat main basket',
        'Lapangan Basket SMP',
        'Teman Sekelas',
        '36.6',
        '115/75',
        '82',
        '99',
        'Pembersihan luka dengan antiseptik dan perban steril',
        'Betadine & Kassa Steril',
        'kembali_ke_kelas',
        'Ns. Siti Rahmah, S.Kep',
      ],
      [
        'NIY-2026-011',
        'Drs. Hendro Wibowo, M.Si',
        '2026-10-30 10:15',
        'pemeriksaan_rutin',
        'Cek tekanan darah rutin dan rasa pegal di tengkuk',
        'Ruang Guru SMA',
        '',
        '36.5',
        '135/85',
        '76',
        '98',
        'Istirahat dan relaksasi 15 menit',
        '-',
        'kembali_bekerja',
        'Ns. Siti Rahmah, S.Kep',
      ],
      [
        'NIS-2026-004',
        'Syifa Anindya Putri',
        '2026-10-30 11:00',
        'sakit',
        'Sakit perut melilit dan mual (nyeri maag)',
        'Kantin Sekolah',
        'Ketua Kelas',
        '36.7',
        '105/70',
        '80',
        '98',
        'Diberikan air hangat dan kompres perut',
        'Antasida Doen 1 tablet',
        'dijemput_orang_tua',
        'Ns. Siti Rahmah, S.Kep',
      ],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Kunjungan_UKS_LUKS.csv', csvString);
  }

  // =========================================================================
  // 6. TEMPLATE CSV PEMERIKSAAN GULA DARAH
  // =========================================================================
  static downloadGlucoseExaminationsTemplateCsv() {
    const headers = [
      'NIS atau NIY Peserta',
      'Nama Peserta',
      'Tanggal & Waktu (YYYY-MM-DD HH:MM)',
      'Jenis Tes (puasa/sewaktu/setelah_makan)',
      'Hasil Glukosa',
      'Satuan (mg/dL / mmol/L)',
      'Lama Puasa (Jam)',
      'Keluhan / Gejala Fisik',
      'Kondisi Saat Tes',
      'Alat Tes Glukometer',
      'Petugas Pemeriksa',
      'Catatan Tambahan',
    ];

    const sampleRows = [
      [
        'NIS-2026-001',
        'Muhammad Fatih Al-Ayyubi',
        '2026-10-30 07:30',
        'puasa',
        '88',
        'mg/dL',
        '10',
        'Tidak ada keluhan fisik',
        'Puasa malam 10 jam',
        'Accu-Chek Instant',
        'Ns. Siti Rahmah, S.Kep',
        'Skrining rutin siswa berkala',
      ],
      [
        'NIY-2026-011',
        'Drs. Hendro Wibowo, M.Si',
        '2026-10-30 08:00',
        'puasa',
        '118',
        'mg/dL',
        '12',
        'Sering merasa haus malam hari',
        'Puasa 12 jam',
        'Accu-Chek Guide',
        'Ns. Siti Rahmah, S.Kep',
        'Kategori Perlu Perhatian (Pre-diabetes)',
      ],
      [
        'NIY-2026-012',
        'Siti Khadijah, S.Pd',
        '2026-10-30 10:30',
        'sewaktu',
        '105',
        'mg/dL',
        '',
        'Kondisi bugar, tidak ada keluhan',
        '2 jam setelah sarapan roti',
        'OneTouch Select Plus',
        'Ns. Siti Rahmah, S.Kep',
        'Hasil dalam batas normal',
      ],
      [
        'NIS-2026-004',
        'Syifa Anindya Putri',
        '2026-10-30 13:00',
        'setelah_makan',
        '135',
        'mg/dL',
        '',
        'Sedikit mengantuk setelah makan siang',
        '2 jam setelah makan siang',
        'Accu-Chek Instant',
        'Ns. Siti Rahmah, S.Kep',
        'Hasil glukosa postprandial normal',
      ],
    ];

    const csvString = [
      headers.map((h) => `"${h}"`).join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    this.downloadCsv('Format_Import_Pemeriksaan_Gula_Darah_LUKS.csv', csvString);
  }
}
