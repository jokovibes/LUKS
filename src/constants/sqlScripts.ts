/**
 * SQL Scripts and Migrations for Supabase Database
 * Lazuardi UKS Management System (LUKS)
 * Project: LUKS (ID: ijtkkvtywmxzsorhazqi)
 */

export const PASSWORD_COLUMN_SQL = `-- =========================================================================
-- SKRIP PENAMBAHAN KOLOM PASSWORD PADA TABEL PROFILES (LUKS)
-- Target: Supabase PostgreSQL (Project ID: ijtkkvtywmxzsorhazqi)
-- Jalankan skrip ini pada SQL Editor di Dashboard Supabase
-- =========================================================================

-- 1. Tambahkan kolom password ke tabel public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'lazuardi123';

-- 2. Berikan komentar dokumentasi kolom
COMMENT ON COLUMN public.profiles.password IS 'Kata sandi akun pengguna LUKS (Default: lazuardi123)';

-- 3. Reload cache skema API PostgREST Supabase
NOTIFY pgrst, 'reload schema';
`;
