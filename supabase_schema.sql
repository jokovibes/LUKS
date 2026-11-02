-- =========================================================================
-- LAZUARDI UKS MANAGEMENT SYSTEM (LUKS)
-- Target Database: PostgreSQL / Supabase
-- Project: LUKS (ID: ijtkkvtywmxzsorhazqi)
-- URL: https://ijtkkvtywmxzsorhazqi.supabase.co
-- Timezone: Asia/Jakarta (WIB)
-- =========================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. UNITS (Unit Sekolah: TK, SD, SMP, SMA Lazuardi)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR(100) NOT NULL,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    head_of_unit VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 2. CLASSES (Kelas Sekolah)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(100) NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 3. PROFILES (Pengguna: Siswa, Guru & Karyawan, Petugas UKS, Admin, Pimpinan)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    employee_or_student_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'petugas_uks', 'karyawan', 'siswa', 'pimpinan')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('siswa', 'karyawan')),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    work_unit VARCHAR(100),
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    date_of_birth DATE,
    contact_information VARCHAR(100),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 4. CODE SEQUENCES & DOCUMENT NUMBER GENERATOR FUNCTION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.code_sequences (
    prefix VARCHAR(10) NOT NULL,
    date_key CHAR(8) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (prefix, date_key)
);

CREATE OR REPLACE FUNCTION public.generate_document_code(p_prefix VARCHAR(10))
RETURNS VARCHAR(35) AS $$
DECLARE
    v_today CHAR(8);
    v_seq INTEGER;
    v_result VARCHAR(35);
BEGIN
    v_today := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
    INSERT INTO public.code_sequences (prefix, date_key, current_value)
    VALUES (p_prefix, v_today, 1)
    ON CONFLICT (prefix, date_key)
    DO UPDATE SET current_value = public.code_sequences.current_value + 1
    RETURNING current_value INTO v_seq;
    v_result := p_prefix || '-' || v_today || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 5. HEALTH PARAMETERS (Parameter Batas Medis Resmi)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.health_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_type VARCHAR(30) NOT NULL CHECK (examination_type IN ('puasa', 'sewaktu', 'setelah_makan')),
    result_unit VARCHAR(10) NOT NULL CHECK (result_unit IN ('mg/dL', 'mmol/L')),
    parameter_configuration JSONB NOT NULL,
    effective_from DATE NOT NULL,
    approved_by VARCHAR(150) NOT NULL,
    approved_by_title VARCHAR(150) NOT NULL,
    approved_at TIMESTAMPTZ NOT NULL,
    version VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 6. GLUCOSE EXAMINATIONS (Pemeriksaan Gula Darah)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.glucose_examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_number VARCHAR(35) NOT NULL UNIQUE,
    participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    examination_datetime TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    examination_type VARCHAR(30) NOT NULL CHECK (examination_type IN ('puasa', 'sewaktu', 'setelah_makan')),
    last_meal_datetime TIMESTAMPTZ,
    fasting_duration_hours NUMERIC(4,1),
    result_value NUMERIC(6,2) NOT NULL,
    result_unit VARCHAR(10) NOT NULL CHECK (result_unit IN ('mg/dL', 'mmol/L')),
    symptoms TEXT,
    participant_condition TEXT,
    examiner_id UUID NOT NULL REFERENCES public.profiles(id),
    examiner_name VARCHAR(150) NOT NULL,
    device_name VARCHAR(100),
    attachment_path TEXT,
    notes TEXT,
    classification VARCHAR(40) NOT NULL DEFAULT 'belum_diklasifikasikan',
    classification_parameter_version VARCHAR(30),
    consent_status VARCHAR(20) NOT NULL DEFAULT 'diberikan',
    record_status VARCHAR(20) NOT NULL DEFAULT 'resmi',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 7. GLUCOSE FOLLOW UPS (Tindak Lanjut Pemeriksaan Gula Darah)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.glucose_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_id UUID NOT NULL REFERENCES public.glucose_examinations(id) ON DELETE CASCADE,
    responsible_staff_id UUID NOT NULL REFERENCES public.profiles(id),
    responsible_staff_name VARCHAR(150) NOT NULL,
    follow_up_status VARCHAR(30) NOT NULL DEFAULT 'belum_dilakukan' CHECK (follow_up_status IN ('belum_dilakukan', 'sedang_dipantau', 'selesai', 'dirujuk')),
    recommended_action TEXT NOT NULL,
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    communication_notes TEXT,
    referral_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 8. UKS VISITS (Buku Register Kunjungan UKS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.uks_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_number VARCHAR(35) NOT NULL UNIQUE,
    participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    visit_datetime TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    previous_location VARCHAR(100),
    main_complaint TEXT NOT NULL,
    visit_reason VARCHAR(30) NOT NULL CHECK (visit_reason IN ('sakit', 'cedera', 'pemeriksaan_rutin', 'lainnya')),
    incident_chronology TEXT,
    accompanying_person VARCHAR(100),
    handling_staff_id UUID NOT NULL REFERENCES public.profiles(id),
    handling_staff_name VARCHAR(150) NOT NULL,
    initial_condition TEXT,
    visit_status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (visit_status IN ('aktif', 'selesai', 'dibatalkan')),
    outcome VARCHAR(40),
    rest_start_time TIMESTAMPTZ,
    rest_end_time TIMESTAMPTZ,
    checkout_datetime TIMESTAMPTZ,
    pickup_person VARCHAR(100),
    pickup_relationship VARCHAR(50),
    pickup_contact VARCHAR(50),
    parent_contacted_at TIMESTAMPTZ,
    communicating_staff_name VARCHAR(150),
    referral_destination VARCHAR(150),
    handover_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 9. UKS ASSESSMENTS (Pengukuran Tanda Vital & Penanganan Medis)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.uks_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.uks_visits(id) ON DELETE CASCADE,
    assessment_datetime TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    temperature NUMERIC(4,1),
    systolic_pressure INTEGER,
    diastolic_pressure INTEGER,
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    other_measurements TEXT,
    treatment TEXT,
    medication_or_equipment TEXT,
    medication_dosage VARCHAR(100),
    notes TEXT,
    attachment_path TEXT,
    examiner_id UUID NOT NULL REFERENCES public.profiles(id),
    examiner_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 10. UKS FOLLOW UPS (Tindak Lanjut & Rujukan Kunjungan)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.uks_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.uks_visits(id) ON DELETE CASCADE,
    responsible_staff_id UUID NOT NULL REFERENCES public.profiles(id),
    responsible_staff_name VARCHAR(150) NOT NULL,
    follow_up_status VARCHAR(30) NOT NULL DEFAULT 'belum_dilakukan' CHECK (follow_up_status IN ('belum_dilakukan', 'sedang_dipantau', 'selesai', 'dirujuk')),
    scheduled_date DATE,
    parent_or_contact_called_at TIMESTAMPTZ,
    contact_person VARCHAR(100),
    pickup_person VARCHAR(100),
    pickup_contact VARCHAR(50),
    approval_person VARCHAR(100),
    referral_destination VARCHAR(150),
    handover_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 11. SYSTEM SETTINGS (Pengaturan Sistem: Ambang Kunjungan Berulang)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_description TEXT,
    updated_by VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 12. AUDIT LOGS (Jejak Audit Aktivitas & Privasi Medis)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    relevant_metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- 13. APP NOTIFICATIONS (Notifikasi Sistem & Pengingat)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_record_type VARCHAR(50),
    target_record_id VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =========================================================================
-- INDEXES UNTUK PERFORMA QUERY CEPAT
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_participant ON public.glucose_examinations(participant_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_datetime ON public.glucose_examinations(examination_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_classification ON public.glucose_examinations(classification);
CREATE INDEX IF NOT EXISTS idx_uks_visits_participant ON public.uks_visits(participant_id);
CREATE INDEX IF NOT EXISTS idx_uks_visits_datetime ON public.uks_visits(visit_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_uks_visits_status ON public.uks_visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_uks_visits_outcome ON public.uks_visits(outcome);
CREATE INDEX IF NOT EXISTS idx_uks_assessments_visit ON public.uks_assessments(visit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses Terbuka untuk Aplikasi Web (Anon & Authenticated)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'units', 'classes', 'profiles', 'health_parameters',
        'glucose_examinations', 'glucose_follow_ups', 'uks_visits',
        'uks_assessments', 'uks_follow_ups', 'system_settings',
        'audit_logs', 'app_notifications', 'code_sequences'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access policy for %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Public access policy for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- =========================================================================
-- DATA AWAL (SEED DATA: UNIT, PARAMETER, PENGGUNA RESMI)
-- =========================================================================

-- 1. Insert Unit Sekolah
INSERT INTO public.units (id, unit_name, unit_code, head_of_unit, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Pra-TK & TK Lazuardi', 'TK', 'Dra. Hj. Nurul Hidayati', true),
    ('22222222-2222-2222-2222-222222222222', 'SD Lazuardi Global Compassionate', 'SD', 'H. Ahmad Syarif, M.Pd', true),
    ('33333333-3333-3333-3333-333333333333', 'SMP Lazuardi Global Compassionate', 'SMP', 'Siti Mariam, S.Pd', true),
    ('44444444-4444-4444-4444-444444444444', 'SMA Lazuardi Global Compassionate', 'SMA', 'Ir. H. Muhammad Ridwan, M.M', true)
ON CONFLICT (unit_code) DO NOTHING;

-- 2. Insert Kelas Contoh
INSERT INTO public.classes (id, class_name, unit_id, is_active) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'TK A - Al-Fatih', '11111111-1111-1111-1111-111111111111', true),
    ('a2222222-2222-2222-2222-222222222222', '1 Abu Bakar', '22222222-2222-2222-2222-222222222222', true),
    ('a3333333-3333-3333-3333-333333333333', '7 Al-Khawarizmi', '33333333-3333-3333-3333-333333333333', true),
    ('a4444444-4444-4444-4444-444444444444', '10 IPA 1 - Ibnu Sina', '44444444-4444-4444-4444-444444444444', true)
ON CONFLICT DO NOTHING;

-- 3. Insert Profil Awal Akun 5 Role LUKS
INSERT INTO public.profiles (id, email, employee_or_student_id, full_name, role, category, unit_id, class_id, work_unit, gender, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@lazuardi.sch.id', 'ADM-001', 'Ahmad Fauzi, S.Kom', 'admin', 'karyawan', '44444444-4444-4444-4444-444444444444', NULL, 'Biro IT & Sistem Informasi', 'L', true),
    ('00000000-0000-0000-0000-000000000002', 'suster.siti@lazuardi.sch.id', 'UKS-001', 'Ns. Siti Rahmah, S.Kep', 'petugas_uks', 'karyawan', '22222222-2222-2222-2222-222222222222', NULL, 'Unit Kesehatan Sekolah (UKS)', 'P', true),
    ('00000000-0000-0000-0000-000000000003', 'pimpinan@lazuardi.sch.id', 'DIR-001', 'Dr. H. Bambang Irawan, M.Ed', 'pimpinan', 'karyawan', '44444444-4444-4444-4444-444444444444', NULL, 'Direktorat Pendidikan Lazuardi', 'L', true),
    ('00000000-0000-0000-0000-000000000004', 'budi.santoso@lazuardi.sch.id', 'GUR-089', 'Budi Santoso, M.Pd', 'karyawan', 'karyawan', '33333333-3333-3333-3333-333333333333', NULL, 'Guru Sains SMP', 'L', true),
    ('00000000-0000-0000-0000-000000000005', 'aisyah@lazuardi.sch.id', 'SIS-2024-001', 'Aisyah Putri Rahmadani', 'siswa', 'siswa', '44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', NULL, 'P', true)
ON CONFLICT (email) DO NOTHING;

-- 4. Insert Parameter Klinis Ambang Batas Gula Darah Resmi
INSERT INTO public.health_parameters (id, examination_type, result_unit, parameter_configuration, effective_from, approved_by, approved_by_title, approved_at, version, is_active) VALUES
    (
        'b1111111-1111-1111-1111-111111111111',
        'puasa',
        'mg/dL',
        '{"normal_min": 70, "normal_max": 99, "perlu_perhatian_min": 100, "perlu_perhatian_max": 125, "tindak_lanjut_min": 126, "catatan_pedoman": "Pedoman Konsensus Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 di Indonesia (PERKENI & Konsultan Medis Lazuardi)"}'::jsonb,
        '2026-07-01',
        'dr. Farida Rahmawati, Sp.A, M.Kes',
        'Dokter Spesialis Anak & Konsultan Medis Sekolah',
        '2026-06-25 10:00:00+07',
        'v2.4-MED-2026',
        true
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'sewaktu',
        'mg/dL',
        '{"normal_min": 70, "normal_max": 139, "perlu_perhatian_min": 140, "perlu_perhatian_max": 199, "tindak_lanjut_min": 200, "catatan_pedoman": "Pedoman Skrining Glukosa Darah Sewaktu Lingkungan Sekolah Lazuardi (PERKENI / IDAI)"}'::jsonb,
        '2026-07-01',
        'dr. Farida Rahmawati, Sp.A, M.Kes',
        'Dokter Spesialis Anak & Konsultan Medis Sekolah',
        '2026-06-25 10:00:00+07',
        'v2.4-MED-2026',
        true
    ),
    (
        'b3333333-3333-3333-3333-333333333333',
        'setelah_makan',
        'mg/dL',
        '{"normal_min": 70, "normal_max": 139, "perlu_perhatian_min": 140, "perlu_perhatian_max": 199, "tindak_lanjut_min": 200, "catatan_pedoman": "Pedoman Tes Toleransi Glukosa Oral / 2 Jam Post-Prandial Konsultan Medis UKS Lazuardi"}'::jsonb,
        '2026-07-01',
        'dr. Farida Rahmawati, Sp.A, M.Kes',
        'Dokter Spesialis Anak & Konsultan Medis Sekolah',
        '2026-06-25 10:00:00+07',
        'v2.4-MED-2026',
        true
    )
ON CONFLICT DO NOTHING;

-- 5. Insert Pengaturan Sistem Default
INSERT INTO public.system_settings (id, setting_key, setting_value, setting_description, updated_by) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'ambang_kunjungan_berulang', '3', 'Batas jumlah kunjungan UKS dalam 30 hari untuk memicu peringatan otomatis', 'Administrator'),
    ('c2222222-2222-2222-2222-222222222222', 'periode_evaluasi_hari', '30', 'Rentang periode perhitungan kunjungan berulang dalam satuan hari', 'Administrator'),
    ('c3333333-3333-3333-3333-333333333333', 'nama_sekolah', 'Lazuardi Global Compassionate School', 'Nama resmi institusi pendidikan pengelola sistem UKS', 'Administrator'),
    ('c4444444-4444-4444-4444-444444444444', 'kontak_darurat_uks', '(021) 753-4820 ext 105', 'Nomor telepon siaga UKS untuk panggilan darurat orang tua / wali', 'Administrator')
ON CONFLICT (setting_key) DO NOTHING;

-- =========================================================================
-- SELESAI: Skema Database LUKS Siap Digunakan di Supabase
-- =========================================================================
