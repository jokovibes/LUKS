/**
 * Halaman Login Profesional - LUKS
 * Lazuardi UKS Management System
 * Lazuardi Global Compassionate School
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Activity,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LAZUARDI_LOGO_URL } from '../../constants/assets';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Login gagal.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Gagal masuk dengan Google.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat masuk dengan Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white p-2.5 shadow-xl shadow-blue-950/60 border border-blue-400/40 overflow-hidden">
            <img
              src={LAZUARDI_LOGO_URL}
              alt="Logo Lazuardi"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/lazuardi.png';
              }}
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              LUKS
            </h1>
            <p className="text-sm font-bold text-sky-400">
              Lazuardi UKS Management System
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Lazuardi Global Compassionate School
            </p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Masuk ke Sistem UKS</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan masuk menggunakan akun Google resmi atau kredensial sekolah Anda.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Gagal Masuk</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Google Sign-in Button with Firebase */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              * Khusus email Google yang telah terdaftar di <span className="font-semibold text-slate-600">Manajemen Pengguna</span> LUKS
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white px-2.5 text-slate-400 font-semibold uppercase tracking-wider">
                atau gunakan email & kata sandi
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Sekolah / Username:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@lazuardi.sch.id"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Kata Sandi:</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-blue-700 hover:underline font-semibold"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memproses Masuk...' : 'Masuk Aplikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-xs">
          <p>© 2026 Lazuardi Global Compassionate School</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Integrated School Health Information System (LUKS) • Hak Cipta Dilindungi • Jokovibes
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-xs space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Pemulihan Akun Sekolah</h3>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Untuk keamanan data medis sekolah, perubahan kata sandi dikelola secara tersentralisasi oleh tim Administrator IT Lazuardi.
              </p>
              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                Hubungi: <strong>admin@lazuardi.sch.id</strong> atau kunjungi ruang IT Sekolah.
              </div>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
