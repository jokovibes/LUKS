/**
 * Local Storage & In-Memory Persistence Layer for LUKS
 * Provides offline-first reliable storage with seed data matching Lazuardi Global Compassionate School
 */

import {
  SchoolUnit,
  SchoolClass,
  UserProfile,
  HealthClassificationParameter,
  GlucoseExamination,
  GlucoseFollowUp,
  UksVisit,
  UksAssessment,
  UksFollowUp,
  AppNotification,
  SystemSetting,
  AuditLog,
  RepeatVisitWarning,
} from '../types/database';

const STORAGE_KEYS = {
  UNITS: 'luks_units_v1',
  CLASSES: 'luks_classes_v1',
  PROFILES: 'luks_profiles_v1',
  HEALTH_PARAMS: 'luks_health_params_v1',
  GLUCOSE_EXAMS: 'luks_glucose_exams_v1',
  GLUCOSE_FOLLOWUPS: 'luks_glucose_followups_v1',
  UKS_VISITS: 'luks_uks_visits_v1',
  UKS_ASSESSMENTS: 'luks_uks_assessments_v1',
  UKS_FOLLOWUPS: 'luks_uks_followups_v1',
  NOTIFICATIONS: 'luks_notifications_v1',
  SYSTEM_SETTINGS: 'luks_system_settings_v1',
  AUDIT_LOGS: 'luks_audit_logs_v1',
  REPEAT_REVIEWS: 'luks_repeat_reviews_v1',
};

// Seed Units
export const INITIAL_UNITS: SchoolUnit[] = [
  { id: 'unit-tk', unit_name: 'Pra-TK & TK Lazuardi', unit_code: 'TK', is_active: true },
  { id: 'unit-sd', unit_name: 'SD Lazuardi Global Compassionate School', unit_code: 'SD', is_active: true },
  { id: 'unit-smp', unit_name: 'SMP Lazuardi Global Compassionate School', unit_code: 'SMP', is_active: true },
  { id: 'unit-sma', unit_name: 'SMA Lazuardi Global Compassionate School', unit_code: 'SMA', is_active: true },
];

// Seed Classes
export const INITIAL_CLASSES: SchoolClass[] = [
  // TK
  { id: 'cls-tk-a', class_name: 'TK A Al-Farabi', unit_id: 'unit-tk', is_active: true },
  { id: 'cls-tk-b', class_name: 'TK B Ibnu Sina', unit_id: 'unit-tk', is_active: true },
  // SD
  { id: 'cls-sd-1', class_name: '1 Abu Bakar', unit_id: 'unit-sd', is_active: true },
  { id: 'cls-sd-2', class_name: '2 Umar bin Khattab', unit_id: 'unit-sd', is_active: true },
  { id: 'cls-sd-3', class_name: '3 Utsman bin Affan', unit_id: 'unit-sd', is_active: true },
  { id: 'cls-sd-4', class_name: '4 Ali bin Abi Thalib', unit_id: 'unit-sd', is_active: true },
  { id: 'cls-sd-5', class_name: '5 Al-Khawarizmi', unit_id: 'unit-sd', is_active: true },
  { id: 'cls-sd-6', class_name: '6 Ibnu Rusyd', unit_id: 'unit-sd', is_active: true },
  // SMP
  { id: 'cls-smp-7', class_name: '7 Al-Ghazali', unit_id: 'unit-smp', is_active: true },
  { id: 'cls-smp-8', class_name: '8 Ibnu Khaldun', unit_id: 'unit-smp', is_active: true },
  { id: 'cls-smp-9', class_name: '9 Averroes', unit_id: 'unit-smp', is_active: true },
  // SMA
  { id: 'cls-sma-10', class_name: '10 MIPA Compassion', unit_id: 'unit-sma', is_active: true },
  { id: 'cls-sma-11', class_name: '11 MIPA Integrity', unit_id: 'unit-sma', is_active: true },
  { id: 'cls-sma-12', class_name: '12 IPS Leadership', unit_id: 'unit-sma', is_active: true },
];

// Seed Profiles (All 5 Roles)
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-admin-1',
    email: 'admin@lazuardi.sch.id',
    employee_or_student_id: 'NIY-2018.01.001',
    full_name: 'Ahmad Fauzi, S.Kom',
    role: 'admin',
    category: 'karyawan',
    unit_id: 'unit-sma',
    work_unit: 'IT & Sistem Informasi Sekolah',
    gender: 'L',
    date_of_birth: '1988-04-12',
    contact_information: '0812-9988-7711',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-nakes-1',
    email: 'suster.siti@lazuardi.sch.id',
    employee_or_student_id: 'NIY-2020.04.015',
    full_name: 'Ns. Siti Rahmah, S.Kep',
    role: 'petugas_uks',
    category: 'karyawan',
    unit_id: 'unit-smp',
    work_unit: 'Unit Kesehatan Sekolah (UKS)',
    gender: 'P',
    date_of_birth: '1992-09-18',
    contact_information: '0813-1122-3344',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-pimpinan-1',
    email: 'pimpinan@lazuardi.sch.id',
    employee_or_student_id: 'NIY-2015.01.002',
    full_name: 'Dr. H. Bambang Irawan, M.Pd',
    role: 'pimpinan',
    category: 'karyawan',
    unit_id: 'unit-sma',
    work_unit: 'Kepala Sekolah & Manajemen Yayasan Lazuardi',
    gender: 'L',
    date_of_birth: '1975-02-10',
    contact_information: '0811-2233-4455',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-karyawan-1',
    email: 'budi.santoso@lazuardi.sch.id',
    employee_or_student_id: 'NIY-2019.07.089',
    full_name: 'Budi Santoso, M.Pd',
    role: 'karyawan',
    category: 'karyawan',
    unit_id: 'unit-sma',
    work_unit: 'Guru Fisika & Sains SMA',
    gender: 'L',
    date_of_birth: '1984-11-23',
    contact_information: '0817-6655-4433',
    emergency_contact: 'Nurul Hidayah (Istri)',
    emergency_phone: '0817-6655-4434',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-karyawan-2',
    email: 'dewi.sartika@lazuardi.sch.id',
    employee_or_student_id: 'NIY-2021.03.042',
    full_name: 'Dewi Sartika, S.Pd',
    role: 'karyawan',
    category: 'karyawan',
    unit_id: 'unit-sd',
    work_unit: 'Guru Wali Kelas 4 SD',
    gender: 'P',
    date_of_birth: '1990-06-14',
    contact_information: '0819-2233-7788',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-siswa-1',
    email: 'aisyah@lazuardi.sch.id',
    employee_or_student_id: 'NIS-242507001',
    full_name: 'Aisyah Putri Rahmadani',
    role: 'siswa',
    category: 'siswa',
    unit_id: 'unit-smp',
    class_id: 'cls-smp-8',
    gender: 'P',
    date_of_birth: '2012-05-15',
    contact_information: '0812-4455-6677',
    emergency_contact: 'Rahmat Subagyo (Ayah)',
    emergency_phone: '0812-4455-6678',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-siswa-2',
    email: 'fadhil@lazuardi.sch.id',
    employee_or_student_id: 'NIS-232408012',
    full_name: 'Muhammad Fadhil Pratama',
    role: 'siswa',
    category: 'siswa',
    unit_id: 'unit-sma',
    class_id: 'cls-sma-11',
    gender: 'L',
    date_of_birth: '2009-08-20',
    contact_information: '0813-7788-9900',
    emergency_contact: 'Hj. Endang Suryati (Ibu)',
    emergency_phone: '0813-7788-9901',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
  {
    id: 'user-siswa-3',
    email: 'rayyan@lazuardi.sch.id',
    employee_or_student_id: 'NIS-252601005',
    full_name: 'Rayyan Arkananta',
    role: 'siswa',
    category: 'siswa',
    unit_id: 'unit-sd',
    class_id: 'cls-sd-4',
    gender: 'L',
    date_of_birth: '2016-03-10',
    contact_information: '0815-1122-4455',
    emergency_contact: 'Dodi Arkananta (Ayah)',
    emergency_phone: '0815-1122-4456',
    is_active: true,
    created_at: '2026-01-01T08:00:00+07:00',
    updated_at: '2026-10-27T08:00:00+07:00',
  },
];

// Approved Clinical Parameters
export const INITIAL_HEALTH_PARAMETERS: HealthClassificationParameter[] = [
  {
    id: 'param-gds-mgdl-v1',
    examination_type: 'sewaktu',
    result_unit: 'mg/dL',
    parameter_configuration: {
      normal_min: 70,
      normal_max: 139.9,
      perlu_perhatian_min: 140,
      perlu_perhatian_max: 199.9,
      tindak_lanjut_min: 200,
      catatan_pedoman: 'Konsensus PERKENI 2021 & Panduan Pelayanan UKS Terpadu Kemenkes RI',
    },
    effective_from: '2026-01-01',
    approved_by: 'dr. Hendra Wijaya, Sp.PD, M.Kes',
    approved_by_title: 'Dokter Konsultan Medis & Komite Kesehatan Sekolah Lazuardi',
    approved_at: '2026-01-02T10:00:00+07:00',
    version: 'V2026.1-RESMI',
    is_active: true,
  },
  {
    id: 'param-gdp-mgdl-v1',
    examination_type: 'puasa',
    result_unit: 'mg/dL',
    parameter_configuration: {
      normal_min: 70,
      normal_max: 99.9,
      perlu_perhatian_min: 100,
      perlu_perhatian_max: 125.9,
      tindak_lanjut_min: 126,
      catatan_pedoman: 'Puasa minimal 8-10 jam (hanya boleh minum air putih). Standar ADA / PERKENI.',
    },
    effective_from: '2026-01-01',
    approved_by: 'dr. Hendra Wijaya, Sp.PD, M.Kes',
    approved_by_title: 'Dokter Konsultan Medis & Komite Kesehatan Sekolah Lazuardi',
    approved_at: '2026-01-02T10:00:00+07:00',
    version: 'V2026.1-RESMI',
    is_active: true,
  },
  {
    id: 'param-gd2pp-mgdl-v1',
    examination_type: 'setelah_makan',
    result_unit: 'mg/dL',
    parameter_configuration: {
      normal_min: 70,
      normal_max: 139.9,
      perlu_perhatian_min: 140,
      perlu_perhatian_max: 179.9,
      tindak_lanjut_min: 180,
      catatan_pedoman: 'Pemeriksaan tepat 2 jam setelah mulai makan utama.',
    },
    effective_from: '2026-01-01',
    approved_by: 'dr. Hendra Wijaya, Sp.PD, M.Kes',
    approved_by_title: 'Dokter Konsultan Medis & Komite Kesehatan Sekolah Lazuardi',
    approved_at: '2026-01-02T10:00:00+07:00',
    version: 'V2026.1-RESMI',
    is_active: true,
  },
];

// Initial System Settings
export const INITIAL_SYSTEM_SETTINGS: SystemSetting[] = [
  {
    id: 'setting-1',
    setting_key: 'repeat_visit_threshold',
    setting_value: '3',
    setting_description: 'Batas jumlah kunjungan UKS per peserta dalam 1 bulan kalender untuk memicu Peringatan Kunjungan Berulang',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'setting-2',
    setting_key: 'repeat_visit_period_days',
    setting_value: '30',
    setting_description: 'Periode rentang hari untuk penghitungan peringatan kunjungan berulang',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'setting-3',
    setting_key: 'school_name',
    setting_value: 'Lazuardi Global Compassionate School',
    setting_description: 'Nama institusi sekolah yang tertera pada laporan dan kop surat',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'setting-4',
    setting_key: 'school_address',
    setting_value: 'Jl. Merpati No. 12, Cinere, Depok, Jawa Barat 16514',
    setting_description: 'Alamat resmi sekolah',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'setting-5',
    setting_key: 'uks_phone',
    setting_value: '(021) 753-4820 ext 105',
    setting_description: 'Nomor telepon langsung ruang UKS',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'setting-6',
    setting_key: 'active_academic_year',
    setting_value: '2026/2027 Ganjil',
    setting_description: 'Semester & Tahun Ajaran aktif',
    updated_by: 'Ahmad Fauzi, S.Kom (Admin)',
    updated_at: '2026-10-01T08:00:00+07:00',
  },
];

// Glucose Examinations & Follow Ups (Hanya data nyata dari Supabase / input baru)
export const INITIAL_GLUCOSE_EXAMINATIONS: GlucoseExamination[] = [];
export const INITIAL_GLUCOSE_FOLLOWUPS: GlucoseFollowUp[] = [];

// Seed UKS Visits (Notice participant user-siswa-3 has 3 visits in October to demonstrate Repeat Visit Detection)
export const INITIAL_UKS_VISITS: UksVisit[] = [
  {
    id: 'visit-001',
    visit_number: 'UKS-20261012-0001',
    participant_id: 'user-siswa-3', // Rayyan Arkananta (SD) - Visit 1
    visit_datetime: '2026-10-12T09:15:00+07:00',
    previous_location: 'Lapangan Basket SD',
    main_complaint: 'Luka lecet pada lutut kanan akibat tersandung saat jam istirahat',
    visit_reason: 'cedera',
    incident_chronology: 'Tersandung tali sepatu saat bermain bola dengan teman sekelas di lapangan rumput/semen',
    accompanying_person: 'Faris (Teman Sekelas)',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Menangis kesakitan, luka lecet berdiameter 3 cm, perdarahan ringan minimal',
    visit_status: 'selesai',
    outcome: 'kembali_ke_kelas',
    rest_start_time: '2026-10-12T09:20:00+07:00',
    rest_end_time: '2026-10-12T09:45:00+07:00',
    checkout_datetime: '2026-10-12T09:50:00+07:00',
    handover_notes: 'Luka telah dibersihkan dengan NaCl 0.9%, diberi povidone iodine dan plester steril.',
    created_at: '2026-10-12T09:15:00+07:00',
    updated_at: '2026-10-12T09:50:00+07:00',
  },
  {
    id: 'visit-002',
    visit_number: 'UKS-20261019-0002',
    participant_id: 'user-siswa-3', // Rayyan Arkananta (SD) - Visit 2
    visit_datetime: '2026-10-19T10:45:00+07:00',
    previous_location: 'Ruang Kelas 4 Ali bin Abi Thalib',
    main_complaint: 'Sakit perut melilit dan mual setelah jam makan snack',
    visit_reason: 'sakit',
    accompanying_person: 'Ibu Dewi Sartika (Wali Kelas)',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Tampak memegangi perut, keringat dingin, lemas',
    visit_status: 'selesai',
    outcome: 'beristirahat_di_uks',
    rest_start_time: '2026-10-19T10:50:00+07:00',
    rest_end_time: '2026-10-19T11:40:00+07:00',
    checkout_datetime: '2026-10-19T11:45:00+07:00',
    handover_notes: 'Diberikan minyak kayu putih pada abdomen, teh hangat manis, istirahat 50 menit. Membaik.',
    created_at: '2026-10-19T10:45:00+07:00',
    updated_at: '2026-10-19T11:45:00+07:00',
  },
  {
    id: 'visit-003',
    visit_number: 'UKS-20261026-0003',
    participant_id: 'user-siswa-3', // Rayyan Arkananta (SD) - Visit 3 -> Peringatan Kunjungan Berulang Aktif!
    visit_datetime: '2026-10-26T08:20:00+07:00',
    previous_location: 'Ruang Kelas 4 Ali bin Abi Thalib',
    main_complaint: 'Demam sumeng-sumeng, pusing berdenyut, nafsu makan berkurang',
    visit_reason: 'sakit',
    accompanying_person: 'Ibu Dewi Sartika (Wali Kelas)',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Suhu tubuh 38.3°C, muka kemerahan, anak tampak lemas',
    visit_status: 'selesai',
    outcome: 'dijemput_keluarga',
    rest_start_time: '2026-10-26T08:25:00+07:00',
    rest_end_time: '2026-10-26T09:30:00+07:00',
    checkout_datetime: '2026-10-26T09:35:00+07:00',
    pickup_person: 'Bapak Dodi Arkananta',
    pickup_relationship: 'Ayah Kandung',
    pickup_contact: '0815-1122-4456',
    parent_contacted_at: '2026-10-26T08:35:00+07:00',
    communicating_staff_name: 'Ns. Siti Rahmah, S.Kep',
    handover_notes: 'Orang tua setuju menjemput untuk berobat ke dokter anak keluarga. Diberikan kompres hangat sebelum dijemput.',
    created_at: '2026-10-26T08:20:00+07:00',
    updated_at: '2026-10-26T09:35:00+07:00',
  },
  {
    id: 'visit-004',
    visit_number: 'UKS-20261027-0001',
    participant_id: 'user-siswa-1', // Aisyah Putri (SMP) - Currently Active in UKS
    visit_datetime: '2026-10-27T10:30:00+07:00',
    previous_location: 'Laboratorium IPA SMP',
    main_complaint: 'Pusing berputar, mata berkunang-kunang setelah praktikum biologi',
    visit_reason: 'sakit',
    accompanying_person: 'Zahra (Teman Sekelas)',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'GCS 15, tensi 100/65 mmHg, belum sarapan pagi',
    visit_status: 'aktif',
    outcome: 'beristirahat_di_uks',
    rest_start_time: '2026-10-27T10:35:00+07:00',
    created_at: '2026-10-27T10:30:00+07:00',
    updated_at: '2026-10-27T10:30:00+07:00',
  },
  {
    id: 'visit-005',
    visit_number: 'UKS-20261027-0002',
    participant_id: 'user-karyawan-1', // Budi Santoso (Guru SMA)
    visit_datetime: '2026-10-27T13:10:00+07:00',
    previous_location: 'Ruang Guru SMA',
    main_complaint: 'Pemeriksaan tensi rutin dan konsultasi keluhan nyeri leher belakang',
    visit_reason: 'pemeriksaan_rutin',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Kondisi baik, tegang pada otot leher belakang',
    visit_status: 'selesai',
    outcome: 'kembali_bekerja',
    checkout_datetime: '2026-10-27T13:30:00+07:00',
    handover_notes: 'Tensi 130/85 mmHg, edukasi peregangan statis tiap 1 jam duduk di depan laptop.',
    created_at: '2026-10-27T13:10:00+07:00',
    updated_at: '2026-10-27T13:30:00+07:00',
  },
  {
    id: 'visit-006',
    visit_number: 'UKS-20261027-0003',
    participant_id: 'user-karyawan-2', // Dewi Sartika (Guru SD)
    visit_datetime: '2026-10-27T14:00:00+07:00',
    previous_location: 'Ruang Guru SD',
    main_complaint: 'Migrain dan pusing sebelah kiri setelah memeriksa berkas ujian',
    visit_reason: 'sakit',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Tampak memijat pelipis, mata sensitif cahaya',
    visit_status: 'selesai',
    outcome: 'kembali_bekerja',
    checkout_datetime: '2026-10-27T14:45:00+07:00',
    handover_notes: 'Istirahat di ruang redup 40 menit, minum air hangat 500ml. Keluhan mereda.',
    created_at: '2026-10-27T14:00:00+07:00',
    updated_at: '2026-10-27T14:45:00+07:00',
  },
  {
    id: 'visit-007',
    visit_number: 'UKS-20261027-0004',
    participant_id: 'user-karyawan-1', // Budi Santoso (Guru SMA)
    visit_datetime: '2026-10-27T15:30:00+07:00',
    previous_location: 'Lapangan Olahraga Guru',
    main_complaint: 'Pergelangan kaki kanan terkilir saat bermain bulutangkis antar guru',
    visit_reason: 'cedera',
    incident_chronology: 'Salah tumpuan saat melompat smash di lapangan indoor',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Bengkak ringan di maleolus lateral, nyeri tekan (+)',
    visit_status: 'selesai',
    outcome: 'dipulangkan',
    checkout_datetime: '2026-10-27T16:15:00+07:00',
    handover_notes: 'Protokol RICE (Rest, Ice pack 20 menit, Compression bandage elastis, Elevation). Disarankan istirahat di rumah.',
    created_at: '2026-10-27T15:30:00+07:00',
    updated_at: '2026-10-27T16:15:00+07:00',
  },
  {
    id: 'visit-008',
    visit_number: 'UKS-20261027-0005',
    participant_id: 'user-siswa-2', // Fadhil (Siswa SMA)
    visit_datetime: '2026-10-27T16:00:00+07:00',
    previous_location: 'Ruang Osis SMA',
    main_complaint: 'Pemeriksaan kesehatan rutin sebelum kegiatan kemah bakti',
    visit_reason: 'pemeriksaan_rutin',
    handling_staff_id: 'user-nakes-1',
    handling_staff_name: 'Ns. Siti Rahmah, S.Kep',
    initial_condition: 'Kondisi prima, fit',
    visit_status: 'selesai',
    outcome: 'kembali_ke_kelas',
    checkout_datetime: '2026-10-27T16:20:00+07:00',
    handover_notes: 'Tanda vital dalam batas normal. Dinyatakan fit untuk kegiatan.',
    created_at: '2026-10-27T16:00:00+07:00',
    updated_at: '2026-10-27T16:20:00+07:00',
  },
];

// Seed UKS Assessments
export const INITIAL_UKS_ASSESSMENTS: UksAssessment[] = [
  {
    id: 'asm-001',
    visit_id: 'visit-001',
    assessment_datetime: '2026-10-12T09:20:00+07:00',
    temperature: 36.6,
    systolic_pressure: 110,
    diastolic_pressure: 70,
    pulse_rate: 88,
    respiratory_rate: 20,
    oxygen_saturation: 99,
    treatment: 'Irigasi luka dengan cairan NaCl 0.9%, antiseptik povidone iodine 10%, tutup kasa steril.',
    medication_or_equipment: 'Kasa hidrofil steril, plester hipoalergenik, NaCl 0.9%',
    examiner_id: 'user-nakes-1',
    examiner_name: 'Ns. Siti Rahmah, S.Kep',
    created_at: '2026-10-12T09:25:00+07:00',
  },
  {
    id: 'asm-002',
    visit_id: 'visit-002',
    assessment_datetime: '2026-10-19T10:50:00+07:00',
    temperature: 36.8,
    pulse_rate: 84,
    respiratory_rate: 18,
    treatment: 'Kompres hangat pada perut, balur minyak telon/kayu putih, minum teh chamomile hangat.',
    medication_or_equipment: 'Minyak kayu putih, kantung kompres air hangat',
    examiner_id: 'user-nakes-1',
    examiner_name: 'Ns. Siti Rahmah, S.Kep',
    created_at: '2026-10-19T10:55:00+07:00',
  },
  {
    id: 'asm-003',
    visit_id: 'visit-003',
    assessment_datetime: '2026-10-26T08:25:00+07:00',
    temperature: 38.3,
    pulse_rate: 104,
    respiratory_rate: 22,
    oxygen_saturation: 98,
    treatment: 'Kompres plester penurun panas pada dahi dan lipatan ketiak, minum air putih 250ml.',
    medication_or_equipment: 'KoolFever plester, termometer infrared UKS-02',
    examiner_id: 'user-nakes-1',
    examiner_name: 'Ns. Siti Rahmah, S.Kep',
    created_at: '2026-10-26T08:30:00+07:00',
  },
  {
    id: 'asm-004',
    visit_id: 'visit-004',
    assessment_datetime: '2026-10-27T10:35:00+07:00',
    temperature: 36.5,
    systolic_pressure: 100,
    diastolic_pressure: 65,
    pulse_rate: 76,
    respiratory_rate: 18,
    oxygen_saturation: 99,
    treatment: 'Baringkan posisi telentang kaki sedikit ditinggikan (Trendelenburg ringan), berikan biskuit dan teh manis hangat.',
    medication_or_equipment: 'Tensimeter digital Omron, Teh manis hangat',
    examiner_id: 'user-nakes-1',
    examiner_name: 'Ns. Siti Rahmah, S.Kep',
    created_at: '2026-10-27T10:40:00+07:00',
  },
  {
    id: 'asm-005',
    visit_id: 'visit-005',
    assessment_datetime: '2026-10-27T13:15:00+07:00',
    temperature: 36.7,
    systolic_pressure: 130,
    diastolic_pressure: 85,
    pulse_rate: 80,
    respiratory_rate: 18,
    treatment: 'Edukasi ergonomi kerja dan anjuran istirahat mata 20-20-20.',
    examiner_id: 'user-nakes-1',
    examiner_name: 'Ns. Siti Rahmah, S.Kep',
    created_at: '2026-10-27T13:20:00+07:00',
  },
];

// Seed UKS Follow Ups (Hanya data nyata dari Supabase / input baru)
export const INITIAL_UKS_FOLLOWUPS: UksFollowUp[] = [];

// Seed Notifications
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    recipient_user_id: 'user-nakes-1',
    notification_type: 'repeat_visit',
    title: 'Peringatan Kunjungan Berulang (Ambang Terlampaui)',
    message: 'Siswa Rayyan Arkananta (SD - Kelas 4 Ali bin Abi Thalib) telah berkunjung ke UKS sebanyak 3 kali dalam bulan Oktober 2026.',
    target_record_type: 'visit',
    target_record_id: 'visit-003',
    is_read: false,
    created_at: '2026-10-26T08:30:00+07:00',
  },
  {
    id: 'notif-002',
    recipient_user_id: 'user-nakes-1',
    notification_type: 'active_visit',
    title: 'Kunjungan UKS Aktif Memerlukan Checkout',
    message: 'Siswa Aisyah Putri Rahmadani sedang beristirahat di UKS sejak pukul 10:30 WIB.',
    target_record_type: 'visit',
    target_record_id: 'visit-004',
    is_read: false,
    created_at: '2026-10-27T10:30:00+07:00',
  },
  {
    id: 'notif-003',
    recipient_user_id: 'user-karyawan-1',
    notification_type: 'followup_scheduled',
    title: 'Pengingat Jadwal Pemeriksaan Evaluasi Gula Darah',
    message: 'Anda memiliki jadwal tindak lanjut evaluasi gula darah puasa pada tanggal 5 November 2026 di UKS Lazuardi.',
    target_record_type: 'glucose',
    target_record_id: 'gds-001',
    is_read: false,
    created_at: '2026-10-25T09:00:00+07:00',
  },
  {
    id: 'notif-004',
    recipient_user_id: 'user-admin-1',
    notification_type: 'system',
    title: 'Audit Log & Parameter Medis Aktif',
    message: 'Parameter klasifikasi pemeriksaan gula darah V2026.1-RESMI disetujui dokter konsultan dan beroperasi aktif.',
    is_read: true,
    created_at: '2026-10-01T08:00:00+07:00',
  },
];

// Seed Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    actor_user_id: 'user-admin-1',
    actor_name: 'Ahmad Fauzi, S.Kom',
    actor_role: 'admin',
    action: 'APPROVE_PARAMETER',
    entity_type: 'health_parameters',
    entity_id: 'param-gds-mgdl-v1',
    timestamp: '2026-01-02T10:00:00+07:00',
    relevant_metadata: { version: 'V2026.1-RESMI', approved_by: 'dr. Hendra Wijaya, Sp.PD, M.Kes' },
  },
  {
    id: 'audit-002',
    actor_user_id: 'user-nakes-1',
    actor_name: 'Ns. Siti Rahmah, S.Kep',
    actor_role: 'petugas_uks',
    action: 'CREATE_RECORD',
    entity_type: 'glucose_examinations',
    entity_id: 'gds-001',
    timestamp: '2026-10-15T08:45:00+07:00',
    relevant_metadata: { number: 'GDS-20261015-0001', participant_id: 'user-karyawan-1' },
  },
  {
    id: 'audit-003',
    actor_user_id: 'user-nakes-1',
    actor_name: 'Ns. Siti Rahmah, S.Kep',
    actor_role: 'petugas_uks',
    action: 'CREATE_RECORD',
    entity_type: 'uks_visits',
    entity_id: 'visit-004',
    timestamp: '2026-10-27T10:30:00+07:00',
    relevant_metadata: { number: 'UKS-20261027-0001', participant_id: 'user-siswa-1' },
  },
  {
    id: 'audit-004',
    actor_user_id: 'user-pimpinan-1',
    actor_name: 'Dr. H. Bambang Irawan, M.Pd',
    actor_role: 'pimpinan',
    action: 'VIEW_RECORD',
    entity_type: 'reports',
    timestamp: '2026-10-27T14:00:00+07:00',
    relevant_metadata: { report_type: 'laporan_agregat_manajemen' },
  },
];

// Seed Repeat Reviews
export const INITIAL_REPEAT_REVIEWS = [
  {
    participant_id: 'user-siswa-3',
    period_year_month: '2026-10',
    visit_count: 3,
    status_review: 'menunggu_telaah',
    internal_notes: 'Siswa mengalami 3 kali kunjungan dalam 1 bulan (cedera lutut, sakit perut, dan demam 38.3C). Perlu koordinasi dengan wali kelas dan peninjauan riwayat daya tahan tubuh.',
    reviewed_by: 'Ns. Siti Rahmah, S.Kep',
    reviewed_at: '2026-10-26T10:00:00+07:00',
  },
];

/**
 * Storage Helper Functions
 */
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading storage key ${key}:`, err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing storage key ${key}:`, err);
  }
}

export const localDb = {
  // Reset database back to default seed state
  resetAll: () => {
    localStorage.clear();
    setStorage(STORAGE_KEYS.UNITS, INITIAL_UNITS);
    setStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setStorage(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    setStorage(STORAGE_KEYS.HEALTH_PARAMS, INITIAL_HEALTH_PARAMETERS);
    setStorage(STORAGE_KEYS.GLUCOSE_EXAMS, INITIAL_GLUCOSE_EXAMINATIONS);
    setStorage(STORAGE_KEYS.GLUCOSE_FOLLOWUPS, INITIAL_GLUCOSE_FOLLOWUPS);
    setStorage(STORAGE_KEYS.UKS_VISITS, INITIAL_UKS_VISITS);
    setStorage(STORAGE_KEYS.UKS_ASSESSMENTS, INITIAL_UKS_ASSESSMENTS);
    setStorage(STORAGE_KEYS.UKS_FOLLOWUPS, INITIAL_UKS_FOLLOWUPS);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStorage(STORAGE_KEYS.SYSTEM_SETTINGS, INITIAL_SYSTEM_SETTINGS);
    setStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStorage(STORAGE_KEYS.REPEAT_REVIEWS, INITIAL_REPEAT_REVIEWS);
  },

  getUnits: () => getStorage<SchoolUnit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS),
  setUnits: (data: SchoolUnit[]) => setStorage(STORAGE_KEYS.UNITS, data),

  getClasses: () => getStorage<SchoolClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES),
  setClasses: (data: SchoolClass[]) => setStorage(STORAGE_KEYS.CLASSES, data),

  getProfiles: () => getStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES),
  setProfiles: (data: UserProfile[]) => setStorage(STORAGE_KEYS.PROFILES, data),

  getHealthParams: () => getStorage<HealthClassificationParameter[]>(STORAGE_KEYS.HEALTH_PARAMS, INITIAL_HEALTH_PARAMETERS),
  setHealthParams: (data: HealthClassificationParameter[]) => setStorage(STORAGE_KEYS.HEALTH_PARAMS, data),

  getGlucoseExams: () => {
    const exams = getStorage<GlucoseExamination[]>(STORAGE_KEYS.GLUCOSE_EXAMS, INITIAL_GLUCOSE_EXAMINATIONS);
    // Bersihkan data mock lama yang ber-ID gds-001 s.d gds-009 agar hanya data nyata Supabase yang tampil
    const cleaned = exams.filter((e) => !e.id.startsWith('gds-00'));
    if (cleaned.length !== exams.length) {
      setStorage(STORAGE_KEYS.GLUCOSE_EXAMS, cleaned);
    }
    return cleaned;
  },
  setGlucoseExams: (data: GlucoseExamination[]) => {
    const cleaned = data.filter((e) => !e.id.startsWith('gds-00'));
    setStorage(STORAGE_KEYS.GLUCOSE_EXAMS, cleaned);
  },

  getGlucoseFollowUps: () => {
    const list = getStorage<GlucoseFollowUp[]>(STORAGE_KEYS.GLUCOSE_FOLLOWUPS, INITIAL_GLUCOSE_FOLLOWUPS);
    const cleaned = list.filter((f) => !f.id.startsWith('gfu-00'));
    if (cleaned.length !== list.length) {
      setStorage(STORAGE_KEYS.GLUCOSE_FOLLOWUPS, cleaned);
    }
    return cleaned;
  },
  setGlucoseFollowUps: (data: GlucoseFollowUp[]) => {
    const cleaned = data.filter((f) => !f.id.startsWith('gfu-00'));
    setStorage(STORAGE_KEYS.GLUCOSE_FOLLOWUPS, cleaned);
  },

  getUksVisits: () => getStorage<UksVisit[]>(STORAGE_KEYS.UKS_VISITS, INITIAL_UKS_VISITS),
  setUksVisits: (data: UksVisit[]) => setStorage(STORAGE_KEYS.UKS_VISITS, data),

  getUksAssessments: () => getStorage<UksAssessment[]>(STORAGE_KEYS.UKS_ASSESSMENTS, INITIAL_UKS_ASSESSMENTS),
  setUksAssessments: (data: UksAssessment[]) => setStorage(STORAGE_KEYS.UKS_ASSESSMENTS, data),

  getUksFollowUps: () => {
    const list = getStorage<UksFollowUp[]>(STORAGE_KEYS.UKS_FOLLOWUPS, INITIAL_UKS_FOLLOWUPS);
    const cleaned = list.filter((f) => !f.id.startsWith('ufu-00'));
    if (cleaned.length !== list.length) {
      setStorage(STORAGE_KEYS.UKS_FOLLOWUPS, cleaned);
    }
    return cleaned;
  },
  setUksFollowUps: (data: UksFollowUp[]) => {
    const cleaned = data.filter((f) => !f.id.startsWith('ufu-00'));
    setStorage(STORAGE_KEYS.UKS_FOLLOWUPS, cleaned);
  },

  getNotifications: () => getStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  setNotifications: (data: AppNotification[]) => setStorage(STORAGE_KEYS.NOTIFICATIONS, data),

  getSystemSettings: () => getStorage<SystemSetting[]>(STORAGE_KEYS.SYSTEM_SETTINGS, INITIAL_SYSTEM_SETTINGS),
  setSystemSettings: (data: SystemSetting[]) => setStorage(STORAGE_KEYS.SYSTEM_SETTINGS, data),

  getAuditLogs: () => getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  setAuditLogs: (data: AuditLog[]) => setStorage(STORAGE_KEYS.AUDIT_LOGS, data),

  getRepeatReviews: () => getStorage<any[]>(STORAGE_KEYS.REPEAT_REVIEWS, INITIAL_REPEAT_REVIEWS),
  setRepeatReviews: (data: any[]) => setStorage(STORAGE_KEYS.REPEAT_REVIEWS, data),
};
