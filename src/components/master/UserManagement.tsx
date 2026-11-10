/**
 * Manajemen Pengguna & Hak Akses Role - LUKS
 * Administrator control for user roles (admin, petugas_uks, karyawan, siswa, pimpinan)
 * Features Add User, Edit, Delete, and Batch CSV Import with downloadable format.
 */

import React, { useState } from 'react';
import {
  UserCog,
  Search,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  AlertTriangle,
  Save,
  X,
  Check,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  Terminal,
  Copy,
  ExternalLink,
  RefreshCw,
  FileCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';
import { UserProfile, UserRole, ParticipantCategory } from '../../types/database';
import { PASSWORD_COLUMN_SQL } from '../../constants/sqlScripts';

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Add User Form State
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addIdentityId, setAddIdentityId] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('karyawan');
  const [addCategory, setAddCategory] = useState<ParticipantCategory>('karyawan');
  const [addUnitId, setAddUnitId] = useState('');
  const [addGender, setAddGender] = useState<'L' | 'P'>('L');
  const [addWorkUnit, setAddWorkUnit] = useState('');
  const [addIsActive, setAddIsActive] = useState<boolean>(true);
  const [addError, setAddError] = useState<string | null>(null);

  // Selected User for Edit Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIdentityId, setEditIdentityId] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('karyawan');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Selected User for Delete Modal
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Password Edit Modal State
  const [userForPassword, setUserForPassword] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showSqlEditorNotice, setShowSqlEditorNotice] = useState(false);

  // SQL Editor Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isCheckingColumn, setIsCheckingColumn] = useState(false);
  const [passwordColExists, setPasswordColExists] = useState<boolean | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Add & Edit modal password state
  const [addPassword, setAddPassword] = useState('lazuardi123');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Check on mount if password column exists in Supabase
  React.useEffect(() => {
    DataService.checkSupabasePasswordColumn().then((exists) => {
      setPasswordColExists(exists);
    });
  }, [reloadKey]);

  const units = React.useMemo(() => DataService.getUnits(), [reloadKey]);
  const profiles = React.useMemo(() => DataService.getProfiles(), [reloadKey]);

  if (!currentUser) return null;

  const filtered = profiles.filter((p) => {
    if (roleFilter && p.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.employee_or_student_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setAddFullName('');
    setAddEmail('');
    setAddPassword('lazuardi123');
    setShowAddPassword(false);
    setAddIdentityId(`ID-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    setAddRole('karyawan');
    setAddCategory('karyawan');
    setAddUnitId(units[0]?.id || '');
    setAddGender('L');
    setAddWorkUnit('');
    setAddIsActive(true);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addFullName.trim() || !addEmail.trim() || !addIdentityId.trim()) {
      setAddError('Nama Lengkap, Email, dan Nomor Identitas wajib diisi.');
      return;
    }

    // Check email uniqueness
    const exists = profiles.some(
      (p) => p.email.toLowerCase().trim() === addEmail.toLowerCase().trim()
    );
    if (exists) {
      setAddError('Email ini sudah terdaftar untuk pengguna lain.');
      return;
    }

    // Determine category based on role
    const finalCategory: ParticipantCategory = addRole === 'siswa' ? 'siswa' : 'karyawan';

    DataService.saveProfile(
      {
        id: `user-${Date.now()}`,
        full_name: addFullName.trim(),
        email: addEmail.trim().toLowerCase(),
        password: addPassword.trim() || 'lazuardi123',
        employee_or_student_id: addIdentityId.trim().toUpperCase(),
        role: addRole,
        category: finalCategory,
        unit_id: addUnitId || units[0]?.id || '',
        gender: addGender,
        work_unit: addWorkUnit.trim() || undefined,
        is_active: addIsActive,
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setIsAddModalOpen(false);
    setReloadKey((k) => k + 1);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email);
    setEditIdentityId(user.employee_or_student_id);
    setEditRole(user.role);
    setIsActive(user.is_active);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    DataService.saveProfile(
      {
        ...selectedUser,
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        employee_or_student_id: editIdentityId.trim(),
        role: editRole,
        category: editRole === 'siswa' ? 'siswa' : 'karyawan',
        is_active: isActive,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );
    setSelectedUser(null);
    setReloadKey((k) => k + 1);
  };

  const handleOpenChangePassword = (user: UserProfile) => {
    setUserForPassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordSuccess(null);
    setPasswordError(null);
    setShowSqlEditorNotice(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPassword || !currentUser) return;
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowSqlEditorNotice(false);

    if (!newPassword.trim()) {
      setPasswordError('Kata sandi baru tidak boleh kosong.');
      return;
    }
    if (newPassword.length < 5) {
      setPasswordError('Kata sandi minimal 5 karakter untuk keamanan.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok. Mohon periksa kembali pengetikan.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await DataService.updateUserPassword(userForPassword.id, newPassword.trim(), {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      });

      if (res.columnMissing) {
        setPasswordColExists(false);
        setShowSqlEditorNotice(true);
        setPasswordSuccess('Kata sandi berhasil diperbarui secara lokal. Kolom password belum ada di Supabase profiles, mohon jalankan skrip SQL di bawah.');
      } else if (res.success) {
        setPasswordColExists(true);
        setPasswordSuccess('Kata sandi berhasil disimpan dan tersinkronisasi langsung ke database Supabase!');
        setTimeout(() => {
          setUserForPassword(null);
        }, 2200);
      } else {
        setPasswordError(res.error || 'Gagal menyimpan kata sandi ke database.');
      }
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      setPasswordError(err?.message || 'Terjadi kesalahan sistem saat memperbarui password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCheckColumnInSupabase = async () => {
    setIsCheckingColumn(true);
    try {
      const exists = await DataService.checkSupabasePasswordColumn();
      setPasswordColExists(exists);
    } finally {
      setIsCheckingColumn(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(PASSWORD_COLUMN_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([PASSWORD_COLUMN_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tambah_kolom_password_profiles.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    DataService.deleteProfile(userToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setUserToDelete(null);
    setReloadKey((k) => k + 1);
  };

  // Batch CSV Import Handler
  const handleImportUsers = (rows: string[][]) => {
    let successCount = 0;
    const errors: string[] = [];
    const unitMapByCode = new Map(units.map((u) => [u.unit_code.toUpperCase(), u.id]));

    rows.forEach((rawRow, idx) => {
      const lineNum = idx + 2; // header is line 1

      // Smart alignment jika nama bergelar membelah kolom sehingga email bergeser
      let row = rawRow;
      const emailIdx = row.findIndex((c, i) => i >= 1 && c.includes('@'));
      if (emailIdx > 1) {
        const shift = emailIdx - 1;
        const nameParts = row.slice(0, shift + 1).map((s) => s.trim()).filter(Boolean);
        const fullName = nameParts.join(', ');
        const email = row[emailIdx]?.trim() || '';
        const rest = row.slice(emailIdx + 1);
        row = [fullName, email, ...rest];
      }

      const fullName = row[0]?.trim();
      const email = row[1]?.trim().toLowerCase();
      const identityId = row[2]?.trim().toUpperCase();
      const roleRaw = row[3]?.trim().toLowerCase();
      const categoryRaw = row[4]?.trim().toLowerCase();
      const unitCode = row[5]?.trim().toUpperCase();
      const genderRaw = row[6]?.trim().toUpperCase();
      const workUnit = row[7]?.trim();

      if (!fullName || !email) {
        errors.push(`Baris ${lineNum}: Nama lengkap dan email wajib diisi.`);
        return;
      }

      // Validate or resolve Role
      const validRoles: UserRole[] = ['admin', 'petugas_uks', 'pimpinan', 'karyawan', 'siswa'];
      const role: UserRole = validRoles.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : 'karyawan';
      const category: ParticipantCategory = role === 'siswa' || categoryRaw === 'siswa' ? 'siswa' : 'karyawan';

      // Resolve unit id
      const unitId = unitMapByCode.get(unitCode) || units[0]?.id || '';
      const gender: 'L' | 'P' = genderRaw === 'P' ? 'P' : 'L';

      const existing = profiles.find((p) => p.email.toLowerCase() === email || p.employee_or_student_id === identityId);

      DataService.saveProfile(
        {
          id: existing ? existing.id : `user-csv-${Date.now()}-${idx}`,
          full_name: fullName,
          email: email,
          employee_or_student_id: identityId || `ID-${Date.now()}-${idx}`,
          role: role,
          category: category,
          unit_id: unitId,
          gender: gender,
          work_unit: workUnit || undefined,
          is_active: true,
        },
        {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        }
      );
      successCount++;
    });

    setReloadKey((k) => k + 1);
    return { successCount, errors };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <UserCog className="w-5 h-5 text-blue-700" />
            <span>Manajemen Pengguna & Otorisasi Role</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan akun, penugasan role (Administrator, Petugas UKS, Karyawan, Siswa, Pimpinan) sesuai prinsip least privilege.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-xs"
            title="Buka SQL Editor untuk menambahkan kolom password di Supabase"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>SQL Editor Password</span>
            {passwordColExists === false && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500 text-white font-extrabold animate-pulse">
                Perlu SQL
              </span>
            )}
            {passwordColExists === true && (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
          <button
            onClick={() => CsvService.downloadUserTemplateCsv()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300"
            title="Unduh contoh template CSV untuk diisi"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Format CSV
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Import CSV Pengguna
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Migration Notice Banner if Password Column Missing in Supabase */}
      {passwordColExists === false && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">Kolom 'password' belum ada di tabel Supabase profiles:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Perubahan kata sandi telah aktif di memori/aplikasi lokal. Agar kata sandi tersimpan permanen di database Supabase PostgreSQL, silakan jalankan skrip di SQL Editor Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 self-start sm:self-center shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5" />
            Buka SQL Editor Migrasi
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, email, NIS, NIY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
          >
            <option value="">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="petugas_uks">Petugas UKS</option>
            <option value="pimpinan">Pimpinan</option>
            <option value="karyawan">Karyawan / Guru</option>
            <option value="siswa">Siswa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Email / Akun</th>
                <th className="py-3.5 px-4">Nomor Identitas</th>
                <th className="py-3.5 px-4">Hak Akses Role</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((user) => {
                const isSelf = user.id === currentUser.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {user.full_name}
                      {isSelf && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {user.employee_or_student_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === 'petugas_uks'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : user.role === 'pimpinan'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : user.role === 'karyawan'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <UserCheck className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold">
                          <UserX className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenChangePassword(user)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-amber-200 shadow-2xs"
                          title="Ganti / Edit Kata Sandi Pengguna"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          Password
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-blue-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={isSelf}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Tambah Pengguna Baru</h3>
                  <p className="text-[11px] text-slate-500">Buat akun akses sistem informasi UKS</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddUser} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Fauzi, S.Kom"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@lazuardi.sch.id"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Identitas (NIS/NIY) *</label>
                  <input
                    type="text"
                    required
                    value={addIdentityId}
                    onChange={(e) => setAddIdentityId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kata Sandi Akun (Password) *</label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Minimal 5 karakter"
                    className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default standar sistem: <code className="text-blue-700 font-mono font-bold">lazuardi123</code> (dapat diubah kapan saja).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hak Akses (Role) *</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-blue-900 bg-white"
                  >
                    <option value="karyawan">Karyawan / Guru</option>
                    <option value="petugas_uks">Petugas UKS</option>
                    <option value="pimpinan">Pimpinan</option>
                    <option value="admin">Administrator</option>
                    <option value="siswa">Siswa</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Sekolah *</label>
                  <select
                    value={addUnitId}
                    onChange={(e) => setAddUnitId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_name} ({u.unit_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin *</label>
                  <select
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value as 'L' | 'P')}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Kerja / Posisi</label>
                  <input
                    type="text"
                    placeholder="e.g. Guru Kelas / Staff TU"
                    value={addWorkUnit}
                    onChange={(e) => setAddWorkUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Status Akun Aktif</div>
                  <div className="text-[10px] text-slate-500">Pengguna dapat login dan mengakses sistem</div>
                </div>
                <input
                  type="checkbox"
                  checked={addIsActive}
                  onChange={(e) => setAddIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Pengguna Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Ubah Data & Otorisasi Pengguna</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Identitas (NIS/NIY)</label>
                <input
                  type="text"
                  required
                  value={editIdentityId}
                  onChange={(e) => setEditIdentityId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hak Akses Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-blue-900 bg-white"
                >
                  <option value="karyawan">Karyawan / Guru</option>
                  <option value="petugas_uks">Petugas UKS</option>
                  <option value="pimpinan">Pimpinan</option>
                  <option value="admin">Administrator</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ganti Kata Sandi (Opsional)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Masukkan minimal 5 karakter jika ingin mereset/mengganti sandi pengguna ini.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Status Akun</div>
                  <div className="text-[10px] text-slate-500">Nonaktifkan untuk menangguhkan login</div>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Pengguna</h3>
                <p className="text-[11px] text-slate-500">Manajemen Pengguna</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus akun pengguna berikut?</p>
              <div className="font-bold text-slate-900">{userToDelete.full_name}</div>
              <div className="text-[11px] font-mono text-slate-600">
                Email: {userToDelete.email} • Role: {userToDelete.role}
              </div>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Akun ini tidak akan dapat login lagi ke sistem LUKS.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Pengguna Massal (CSV)"
        description="Unggah berkas CSV untuk mendaftarkan akun siswa, guru, petugas UKS, atau administrator sekaligus."
        expectedHeaders={[
          'Nama Lengkap',
          'Email',
          'Nomor Identitas (NIS/NIY)',
          'Role',
          'Kategori',
          'Kode Unit',
          'Jenis Kelamin (L/P)',
          'Unit Kerja',
        ]}
        sampleDownloadFn={() => CsvService.downloadUserTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format CSV Pengguna"
        onImport={handleImportUsers}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />

      {/* Modal Ganti / Edit Kata Sandi Pengguna */}
      {userForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Ganti / Edit Kata Sandi</h3>
                  <p className="text-[11px] text-slate-500">Pembaruan kredensial login akun</p>
                </div>
              </div>
              <button
                onClick={() => setUserForPassword(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Target Card */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900">{userForPassword.full_name}</div>
                <div className="text-[11px] font-mono text-slate-500">{userForPassword.email}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {userForPassword.employee_or_student_id}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                {userForPassword.role.replace('_', ' ')}
              </span>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {showSqlEditorNotice && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-[11px] text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Database className="w-4 h-4 text-amber-700" />
                  <span>Perlu Eksekusi SQL di Supabase:</span>
                </div>
                <p className="leading-relaxed">
                  Tabel <code className="font-bold">profiles</code> di Supabase belum memiliki kolom <code className="font-bold">password</code>. Jalankan skrip migrasi agar kata sandi tersimpan permanen di cloud Supabase.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Buka Skrip SQL Editor
                </button>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Kata Sandi Baru *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNewPassword('lazuardi123');
                        setConfirmPassword('lazuardi123');
                      }}
                      className="text-[10px] text-blue-700 font-bold hover:underline"
                    >
                      Gunakan 'lazuardi123'
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan sandi baru (min. 5 karakter)"
                    className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ulangi Kata Sandi Baru *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang sandi baru"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserForPassword(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className={`px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    passwordSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {passwordSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Password ke Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal SQL Editor Kolom Password Supabase */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    SQL Editor: Migrasi Kolom Password di Supabase
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Project: <strong className="text-blue-900">LUKS</strong> • ID: <code className="font-mono text-blue-700">ijtkkvtywmxzsorhazqi</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Status Database Column Badge */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Status Kolom Supabase:</span>
                  {passwordColExists === true ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3.5 h-3.5" /> Kolom 'password' Aktif di Database
                    </span>
                  ) : passwordColExists === false ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" /> Kolom Belum Ada (Jalankan SQL)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                      Memeriksa status...
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Tabel target: <code className="font-mono font-bold text-slate-700">public.profiles</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckColumnInSupabase}
                disabled={isCheckingColumn}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingColumn ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isCheckingColumn ? 'Memeriksa...' : 'Uji Kolom Database'}</span>
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-1.5 text-slate-700">
              <div className="font-bold text-slate-900">Langkah Menjalankan di Supabase:</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Klik tombol <strong>"Salin Skrip SQL"</strong> atau <strong>"Buka Supabase SQL Editor"</strong>.</li>
                <li>Pada tab baru, tempelkan (*paste*) kueri SQL di bawah ke SQL Editor Supabase.</li>
                <li>Klik tombol <strong>RUN</strong> di Supabase, lalu kembali ke sini dan klik <strong>"Uji Kolom Database"</strong>.</li>
              </ol>
            </div>

            {/* SQL Code Box */}
            <div className="relative group">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 rounded-t-xl border border-slate-800 text-[11px] text-slate-300">
                <span className="font-mono flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  tambah_kolom_password_profiles.sql
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-b-xl border-x border-b border-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed select-all">
                {PASSWORD_COLUMN_SQL}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download .sql</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/ijtkkvtywmxzsorhazqi/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Supabase SQL Editor</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition self-end sm:self-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
