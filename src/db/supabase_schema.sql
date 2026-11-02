-- =========================================================================
-- LAZUARDI UKS MANAGEMENT SYSTEM (LUKS) - DATABASE SCHEMA & RLS POLICIES
-- Lazuardi Global Compassionate School
-- Target Engine: PostgreSQL / Supabase
-- Timezone: Asia/Jakarta (WIB)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UNITS (Unit Sekolah: TK, SD, SMP, SMA Lazuardi)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_name VARCHAR(100) NOT NULL,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 2. CLASSES (Kelas Sekolah)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 3. PROFILES (Pengguna: Siswa, Karyawan, Petugas UKS, Admin, Pimpinan)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- REFERENCES auth.users(id) in Supabase Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT 'lazuardi123', -- Kata sandi akun pengguna LUKS
    employee_or_student_id VARCHAR(50) NOT NULL UNIQUE, -- NIS atau NIY
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'petugas_uks', 'karyawan', 'siswa', 'pimpinan')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('siswa', 'karyawan')),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    class_id UUID REFERENCES public.classes(id),
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

-- Migrasi jika tabel profiles sudah ada sebelumnya di Supabase
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'lazuardi123';
COMMENT ON COLUMN public.profiles.password IS 'Kata sandi akun pengguna LUKS (Default: lazuardi123)';

-- Sequence counters for atomic auto-generated numbers
CREATE TABLE IF NOT EXISTS public.code_sequences (
    prefix VARCHAR(10) NOT NULL,
    date_key CHAR(8) NOT NULL, -- e.g. '20261027'
    current_value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (prefix, date_key)
);

-- Function to atomically generate GDS-YYYYMMDD-0001 or UKS-YYYYMMDD-0001
CREATE OR REPLACE FUNCTION public.generate_document_code(p_prefix VARCHAR(10))
RETURNS VARCHAR(30) AS $$
DECLARE
    v_today CHAR(8);
    v_seq INTEGER;
    v_result VARCHAR(30);
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

-- 4. GLUCOSE EXAMINATIONS (Pemeriksaan Gula Darah Siswa & Karyawan)
CREATE TABLE IF NOT EXISTS public.glucose_examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_number VARCHAR(30) NOT NULL UNIQUE,
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
    classification VARCHAR(40) NOT NULL DEFAULT 'belum_diklasifikasikan' 
        CHECK (classification IN ('normal', 'perlu_perhatian', 'pemantauan', 'tindak_lanjut', 'belum_diklasifikasikan')),
    classification_parameter_version VARCHAR(30),
    consent_status VARCHAR(20) NOT NULL DEFAULT 'diberikan' 
        CHECK (consent_status IN ('diberikan', 'tidak_diperlukan', 'ditolak')),
    record_status VARCHAR(20) NOT NULL DEFAULT 'resmi' 
        CHECK (record_status IN ('draft', 'resmi', 'dikoreksi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 5. GLUCOSE FOLLOW UPS (Tindak Lanjut Pemeriksaan Gula Darah)
CREATE TABLE IF NOT EXISTS public.glucose_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID NOT NULL REFERENCES public.glucose_examinations(id) ON DELETE CASCADE,
    responsible_staff_id UUID NOT NULL REFERENCES public.profiles(id),
    responsible_staff_name VARCHAR(150) NOT NULL,
    follow_up_status VARCHAR(30) NOT NULL DEFAULT 'belum_dilakukan' 
        CHECK (follow_up_status IN ('belum_dilakukan', 'sedang_dipantau', 'selesai', 'dirujuk')),
    recommended_action TEXT NOT NULL,
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    communication_notes TEXT,
    referral_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 6. UKS VISITS (Pencatatan Kunjungan UKS)
CREATE TABLE IF NOT EXISTS public.uks_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_number VARCHAR(30) NOT NULL UNIQUE,
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
    outcome VARCHAR(40) CHECK (outcome IN (
        'kembali_ke_kelas',
        'kembali_bekerja',
        'beristirahat_di_uks',
        'dijemput_keluarga',
        'dipulangkan',
        'dirujuk',
        'pemantauan_lanjutan',
        'masih_dalam_penanganan'
    )),
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

-- 7. UKS ASSESSMENTS (Pemeriksaan Tanda Vital & Penanganan Kunjungan UKS)
CREATE TABLE IF NOT EXISTS public.uks_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES public.uks_visits(id) ON DELETE CASCADE,
    assessment_datetime TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    temperature NUMERIC(4,1), -- in Celcius
    systolic_pressure INTEGER,
    diastolic_pressure INTEGER,
    pulse_rate INTEGER, -- bpm
    respiratory_rate INTEGER, -- per minute
    oxygen_saturation INTEGER, -- %
    other_measurements TEXT,
    treatment TEXT,
    medication_or_equipment TEXT,
    medication_dosage TEXT,
    notes TEXT,
    attachment_path TEXT,
    examiner_id UUID NOT NULL REFERENCES public.profiles(id),
    examiner_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 8. UKS FOLLOW UPS (Tindak Lanjut Kunjungan UKS)
CREATE TABLE IF NOT EXISTS public.uks_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES public.uks_visits(id) ON DELETE CASCADE,
    responsible_staff_id UUID NOT NULL REFERENCES public.profiles(id),
    responsible_staff_name VARCHAR(150) NOT NULL,
    follow_up_status VARCHAR(30) NOT NULL DEFAULT 'belum_dilakukan' 
        CHECK (follow_up_status IN ('belum_dilakukan', 'sedang_dipantau', 'selesai', 'dirujuk')),
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

-- 9. HEALTH CLASSIFICATION PARAMETERS (Parameter Klasifikasi yang Disetujui Tenaga Medis)
CREATE TABLE IF NOT EXISTS public.health_classification_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_type VARCHAR(30) NOT NULL CHECK (examination_type IN ('puasa', 'sewaktu', 'setelah_makan')),
    result_unit VARCHAR(10) NOT NULL CHECK (result_unit IN ('mg/dL', 'mmol/L')),
    parameter_configuration JSONB NOT NULL,
    effective_from DATE NOT NULL,
    approved_by VARCHAR(150) NOT NULL,
    approved_by_title VARCHAR(100) NOT NULL,
    approved_at TIMESTAMPTZ NOT NULL,
    version VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 10. NOTIFICATIONS (Pusat Notifikasi Aplikasi)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    target_record_type VARCHAR(30),
    target_record_id VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 11. SYSTEM SETTINGS (Pengaturan Konfigurasi Sistem)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_description TEXT,
    updated_by VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 12. AUDIT LOGS (Pencatatan Jejak Aktivitas & Akses Data Sensitif)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    relevant_metadata JSONB
);

-- Repeat Visit Warnings Review Notes (Internal to UKS Staff)
CREATE TABLE IF NOT EXISTS public.repeat_visit_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.profiles(id),
    period_year_month CHAR(7) NOT NULL, -- e.g. '2026-10'
    visit_count INTEGER NOT NULL,
    status_review VARCHAR(30) NOT NULL DEFAULT 'menunggu_telaah',
    internal_notes TEXT,
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    UNIQUE(participant_id, period_year_month)
);

-- =========================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & COMPLIANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_emp_std_id ON public.profiles(employee_or_student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_part_id ON public.glucose_examinations(participant_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_date ON public.glucose_examinations(examination_datetime);
CREATE INDEX IF NOT EXISTS idx_uks_visits_part_id ON public.uks_visits(participant_id);
CREATE INDEX IF NOT EXISTS idx_uks_visits_datetime ON public.uks_visits(visit_datetime);
CREATE INDEX IF NOT EXISTS idx_uks_visits_status ON public.uks_visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uks_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user profile
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.profiles AS $$
    SELECT * FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can view their own profile, UKS staff and Admin can view all
CREATE POLICY "Profiles view policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = auth_user_id 
        OR (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks', 'pimpinan')
    );

-- Glucose Examinations: 
-- 1. Siswa/Karyawan: ONLY their own records
-- 2. Petugas UKS: Can view, insert, update
-- 3. Admin: Can view according to school policy
-- 4. Pimpinan: Aggregates only (or authorized via specific view)
CREATE POLICY "Glucose exams participant select" ON public.glucose_examinations
    FOR SELECT USING (
        participant_id = (SELECT id FROM public.current_profile())
        OR (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

CREATE POLICY "Glucose exams staff insert" ON public.glucose_examinations
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

CREATE POLICY "Glucose exams staff update" ON public.glucose_examinations
    FOR UPDATE USING (
        (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

-- UKS Visits:
CREATE POLICY "UKS visits participant select" ON public.uks_visits
    FOR SELECT USING (
        participant_id = (SELECT id FROM public.current_profile())
        OR (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

CREATE POLICY "UKS visits staff insert" ON public.uks_visits
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

CREATE POLICY "UKS visits staff update" ON public.uks_visits
    FOR UPDATE USING (
        (SELECT role FROM public.current_profile()) IN ('admin', 'petugas_uks')
    );

-- Notifications: Only recipient can see their notifications
CREATE POLICY "Notifications select" ON public.notifications
    FOR SELECT USING (
        recipient_user_id = (SELECT id FROM public.current_profile())
    );

-- =========================================================================
-- SEED DATA (Default Settings, Units, Classes & Approved Parameters)
-- =========================================================================

-- Insert System Settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_description, updated_by)
VALUES 
('repeat_visit_threshold', '3', 'Batas jumlah kunjungan UKS dalam 1 bulan untuk memicu peringatan berulang', 'Administrator'),
('repeat_visit_period_days', '30', 'Rentang periode perhitungan kunjungan berulang dalam hari', 'Administrator'),
('school_name', 'Lazuardi Global Compassionate School', 'Nama resmi sekolah', 'Administrator'),
('school_address', 'Jl. Merpati No. 12, Cinere, Depok, Jawa Barat', 'Alamat sekolah', 'Administrator'),
('uks_phone', '(021) 753-4820', 'Nomor telepon resmi UKS', 'Administrator'),
('school_year', '2026/2027', 'Tahun Ajaran Aktif', 'Administrator')
ON CONFLICT (setting_key) DO NOTHING;
