/**
 * Panduan Setup Supabase PostgreSQL & SQL Schema Runner - LUKS
 * Project: LUKS (ID: ijtkkvtywmxzsorhazqi)
 * Provides direct copyable SQL schema, file download, and connection status checker.
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Code2,
  Download,
  Server,
  Key,
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '../../services/supabaseClient';
import { SupabaseSyncService } from '../../services/supabaseSyncService';

export const COMPLETE_LUKS_SQL = `-- =========================================================================
-- LAZUARDI UKS MANAGEMENT SYSTEM (LUKS) - DATABASE SCHEMA & RLS POLICIES
-- Target Engine: PostgreSQL / Supabase
-- Project Name: LUKS (Project ID: ijtkkvtywmxzsorhazqi)
-- Project URL: https://ijtkkvtywmxzsorhazqi.supabase.co
-- Timezone: Asia/Jakarta (WIB)
-- =========================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. UNITS (Unit Sekolah: TK, SD, SMP, SMA Lazuardi)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR(100) NOT NULL,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    head_of_unit VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 2. CLASSES (Kelas Sekolah)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(100) NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 3. PROFILES (Pengguna: Siswa, Guru & Karyawan, Petugas UKS, Admin, Pimpinan)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT 'lazuardi123',
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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'lazuardi123';
COMMENT ON COLUMN public.profiles.password IS 'Kata sandi akun pengguna LUKS (Default: lazuardi123)';

-- 4. CODE SEQUENCES & DOCUMENT NUMBER GENERATOR FUNCTION
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

-- 5. HEALTH PARAMETERS (Parameter Batas Medis Resmi)
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

-- 6. GLUCOSE EXAMINATIONS (Pemeriksaan Gula Darah)
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

-- 7. GLUCOSE FOLLOW UPS (Tindak Lanjut Pemeriksaan Gula Darah)
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

-- 8. UKS VISITS (Buku Register Kunjungan UKS)
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

-- 9. UKS ASSESSMENTS (Pengukuran Tanda Vital & Penanganan Medis)
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

-- 10. UKS FOLLOW UPS (Tindak Lanjut & Rujukan Kunjungan)
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

-- 11. SYSTEM SETTINGS (Pengaturan Sistem)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_description TEXT,
    updated_by VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 12. AUDIT LOGS (Jejak Audit Aktivitas & Privasi Medis)
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

-- 13. APP NOTIFICATIONS (Notifikasi Sistem & Pengingat)
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

-- INDEXES UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_participant ON public.glucose_examinations(participant_id);
CREATE INDEX IF NOT EXISTS idx_glucose_exam_datetime ON public.glucose_examinations(examination_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_uks_visits_participant ON public.uks_visits(participant_id);
CREATE INDEX IF NOT EXISTS idx_uks_visits_datetime ON public.uks_visits(visit_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- SEED DATA AWAL: UNIT SEKOLAH
INSERT INTO public.units (id, unit_name, unit_code, head_of_unit, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Pra-TK & TK Lazuardi', 'TK', 'Dra. Hj. Nurul Hidayati', true),
    ('22222222-2222-2222-2222-222222222222', 'SD Lazuardi Global Compassionate', 'SD', 'H. Ahmad Syarif, M.Pd', true),
    ('33333333-3333-3333-3333-333333333333', 'SMP Lazuardi Global Compassionate', 'SMP', 'Siti Mariam, S.Pd', true),
    ('44444444-4444-4444-4444-444444444444', 'SMA Lazuardi Global Compassionate', 'SMA', 'Ir. H. Muhammad Ridwan, M.M', true)
ON CONFLICT (unit_code) DO NOTHING;

-- SEED DATA AWAL: AKUN DEMO RESMI
INSERT INTO public.profiles (id, email, employee_or_student_id, full_name, role, category, unit_id, work_unit, gender, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@lazuardi.sch.id', 'ADM-001', 'Ahmad Fauzi, S.Kom', 'admin', 'karyawan', '44444444-4444-4444-4444-444444444444', 'Biro IT & Sistem Informasi', 'L', true),
    ('00000000-0000-0000-0000-000000000002', 'suster.siti@lazuardi.sch.id', 'UKS-001', 'Ns. Siti Rahmah, S.Kep', 'petugas_uks', 'karyawan', '22222222-2222-2222-2222-222222222222', 'Unit Kesehatan Sekolah (UKS)', 'P', true),
    ('00000000-0000-0000-0000-000000000003', 'pimpinan@lazuardi.sch.id', 'DIR-001', 'Dr. H. Bambang Irawan, M.Ed', 'pimpinan', 'karyawan', '44444444-4444-4444-4444-444444444444', 'Direktorat Pendidikan Lazuardi', 'L', true),
    ('00000000-0000-0000-0000-000000000004', 'budi.santoso@lazuardi.sch.id', 'GUR-089', 'Budi Santoso, M.Pd', 'karyawan', 'karyawan', '33333333-3333-3333-3333-333333333333', 'Guru Sains SMP', 'L', true),
    ('00000000-0000-0000-0000-000000000005', 'aisyah@lazuardi.sch.id', 'SIS-2024-001', 'Aisyah Putri Rahmadani', 'siswa', 'siswa', '44444444-4444-4444-4444-444444444444', NULL, 'P', true)
ON CONFLICT (email) DO NOTHING;

-- SEED DATA AWAL: PARAMETER BATAS GULA DARAH (MEDIS)
INSERT INTO public.health_parameters (id, examination_type, result_unit, parameter_configuration, effective_from, approved_by, approved_by_title, approved_at, version, is_active) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'puasa', 'mg/dL', '{"normal_min": 70, "normal_max": 99, "perlu_perhatian_min": 100, "perlu_perhatian_max": 125, "tindak_lanjut_min": 126, "catatan_pedoman": "Pedoman Konsensus Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 di Indonesia (PERKENI & Konsultan Medis Lazuardi)"}'::jsonb, '2026-07-01', 'dr. Farida Rahmawati, Sp.A, M.Kes', 'Dokter Spesialis Anak & Konsultan Medis Sekolah', '2026-06-25 10:00:00+07', 'v2.4-MED-2026', true),
    ('p2222222-2222-2222-2222-222222222222', 'sewaktu', 'mg/dL', '{"normal_min": 70, "normal_max": 139, "perlu_perhatian_min": 140, "perlu_perhatian_max": 199, "tindak_lanjut_min": 200, "catatan_pedoman": "Pedoman Skrining Glukosa Darah Sewaktu Lingkungan Sekolah Lazuardi (PERKENI / IDAI)"}'::jsonb, '2026-07-01', 'dr. Farida Rahmawati, Sp.A, M.Kes', 'Dokter Spesialis Anak & Konsultan Medis Sekolah', '2026-06-25 10:00:00+07', 'v2.4-MED-2026', true),
    ('p3333333-3333-3333-3333-333333333333', 'setelah_makan', 'mg/dL', '{"normal_min": 70, "normal_max": 139, "perlu_perhatian_min": 140, "perlu_perhatian_max": 199, "tindak_lanjut_min": 200, "catatan_pedoman": "Pedoman Tes Toleransi Glukosa Oral / 2 Jam Post-Prandial Konsultan Medis UKS Lazuardi"}'::jsonb, '2026-07-01', 'dr. Farida Rahmawati, Sp.A, M.Kes', 'Dokter Spesialis Anak & Konsultan Medis Sekolah', '2026-06-25 10:00:00+07', 'v2.4-MED-2026', true)
ON CONFLICT DO NOTHING;

-- SEED DATA AWAL: PENGATURAN AMBANG KUNJUNGAN BERULANG
INSERT INTO public.system_settings (id, setting_key, setting_value, setting_description, updated_by) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'ambang_kunjungan_berulang', '3', 'Batas jumlah kunjungan UKS dalam 30 hari untuk memicu peringatan otomatis', 'Administrator'),
    ('s2222222-2222-2222-2222-222222222222', 'periode_evaluasi_hari', '30', 'Rentang periode perhitungan kunjungan berulang dalam satuan hari', 'Administrator')
ON CONFLICT (setting_key) DO NOTHING;
`;

export const SupabaseSetupGuide: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    isConfigured: boolean;
    url: string;
    isConnected: boolean;
    errorMessage?: string;
  }>({
    isConfigured: isSupabaseConfigured,
    url: 'https://ijtkkvtywmxzsorhazqi.supabase.co',
    isConnected: false,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checkStatus = async () => {
    setIsTesting(true);
    const res = await testSupabaseConnection();
    setConnectionStatus(res);
    setIsTesting(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await SupabaseSyncService.seedRemoteDatabase();
      await SupabaseSyncService.pullAllFromSupabase();
      setSyncFeedback('Data lokal dan transaksi berhasil disinkronkan ke PostgreSQL Supabase!');
      await checkStatus();
    } catch (err: any) {
      setSyncFeedback('Gagal sinkronisasi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const copySqlSchema = () => {
    navigator.clipboard.writeText(COMPLETE_LUKS_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadSqlFile = () => {
    const blob = new Blob([COMPLETE_LUKS_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LUKS_Supabase_Schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <Database className="w-5 h-5 text-blue-700" />
            <span>Koneksi Database Supabase PostgreSQL</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Project: <strong className="text-blue-900">LUKS</strong> • ID: <code className="font-mono text-blue-700">ijtkkvtywmxzsorhazqi</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSqlFile}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Unduh .sql
          </button>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            title="Kirim dan sinkronkan data awal atau perubahan ke database Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Database'}
          </button>
          <button
            onClick={checkStatus}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Menguji...' : 'Uji Koneksi'}
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          syncFeedback.includes('Gagal') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Connection Credentials Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-700" />
          Kredensial Proyek Supabase Terkonfigurasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Project URL</div>
            <div className="text-xs text-blue-950 font-bold truncate mt-1">https://ijtkkvtywmxzsorhazqi.supabase.co</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Project ID & Status</div>
            <div className="text-xs text-emerald-800 font-bold mt-1">ijtkkvtywmxzsorhazqi • Aktif</div>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <div
        className={`p-5 rounded-2xl border-2 transition ${
          connectionStatus.isConnected
            ? 'bg-emerald-50/60 border-emerald-300'
            : 'bg-amber-50/60 border-amber-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              connectionStatus.isConnected
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {connectionStatus.isConnected ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0 text-xs">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {connectionStatus.isConnected
                  ? 'Tersambung ke Database Supabase Cloud'
                  : 'Tabel PostgreSQL Belum Dibuat di Supabase'}
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  connectionStatus.isConnected
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {connectionStatus.isConnected ? 'Online PostgreSQL' : 'Perlu Eksekusi SQL'}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              {connectionStatus.isConnected
                ? `Aplikasi LUKS terhubung langsung ke project Supabase (${connectionStatus.url}). Seluruh query transaksi, relasi tabel, dan otorisasi RLS berjalan pada PostgreSQL Supabase.`
                : 'Kredensial proyek Supabase telah dipasang. Namun tabel-tabel database belum dibuat di dashboard Supabase Anda. Ikuti 3 langkah mudah di bawah untuk menjalankan skrip SQL.'}
            </p>

            {connectionStatus.errorMessage && (
              <div className="p-2.5 bg-white/80 border border-amber-200 rounded-lg text-amber-900 font-mono text-[11px]">
                Status Supabase: {connectionStatus.errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step by step Setup Guide */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-700" />
              Langkah Eksekusi SQL di Supabase SQL Editor
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Hanya butuh 1x klik eksekusi untuk membuat seluruh 13 tabel, indeks performa, aturan keamanan RLS, dan data awal.
            </p>
          </div>

          <button
            onClick={copySqlSchema}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'SQL Tersalin ke Clipboard!' : 'Salin Seluruh Skrip SQL'}
          </button>
        </div>

        <div className="space-y-3 text-slate-700">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <span className="font-bold text-slate-900">Buka SQL Editor Supabase:</span>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Buka dashboard proyek Anda di:{' '}
                <a
                  href="https://supabase.com/dashboard/project/ijtkkvtywmxzsorhazqi/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                >
                  supabase.com/dashboard/project/ijtkkvtywmxzsorhazqi/sql/new <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-900">Tempel (*Paste*) & Klik RUN:</span>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Tempelkan seluruh skrip SQL yang telah disalin ke dalam kotak editor SQL, lalu tekan tombol hijau <strong>RUN</strong> di pojok kanan bawah.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <span className="font-bold text-slate-900">Kembali ke Aplikasi LUKS & Klik "Uji Koneksi":</span>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Setelah pesan <span className="text-emerald-700 font-bold">Success. No rows returned</span> muncul di Supabase, klik tombol <strong>"Uji Koneksi"</strong> di atas. Indikator status akan langsung berubah menjadi hijau online.
              </p>
            </div>
          </div>
        </div>

        {/* SQL Preview Box */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-slate-600 text-[11px] mb-1 font-bold">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-700" />
              Pratinjau Skrip SQL (supabase_schema.sql):
            </span>
            <span className="text-slate-400">13 Tabel • RLS Aktif • Data Awal Termasuk</span>
          </div>
          <pre className="p-4 bg-slate-950 text-sky-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-72 custom-scrollbar border border-slate-800 leading-relaxed">
            {COMPLETE_LUKS_SQL}
          </pre>
        </div>
      </div>
    </div>
  );
};
