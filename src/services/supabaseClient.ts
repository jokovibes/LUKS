/**
 * Supabase Client Configuration for LUKS
 * Safely initialises connection when environment variables are supplied.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with LUKS project credentials as default
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ijtkkvtywmxzsorhazqi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdGtrdnR5d214enNvcmhhenFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMjIzNTMsImV4cCI6MjEwODc5ODM1M30.hBjE89A3FpuGV397AO8LjQgjzs_xosYra6-N0z-y0-c';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseAnonKey.includes('...')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialise Supabase client:', err);
    supabase = null;
  }
}

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  url: string;
  isConnected: boolean;
  errorMessage?: string;
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      url: supabaseUrl || 'Belum Dikonfigurasi',
      isConnected: false,
      errorMessage: 'Variabel lingkungan VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi.',
    };
  }

  try {
    const { data, error } = await supabase.from('units').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        isConfigured: true,
        url: supabaseUrl,
        isConnected: false,
        errorMessage: error.message,
      };
    }
    return {
      isConfigured: true,
      url: supabaseUrl,
      isConnected: true,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      url: supabaseUrl,
      isConnected: false,
      errorMessage: err?.message || 'Gagal tersambung ke server Supabase',
    };
  }
}
