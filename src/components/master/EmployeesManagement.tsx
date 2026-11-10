/**
 * Master Data Karyawan & Guru - LUKS
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Phone,
  Briefcase,
  Upload,
  Download,
  Building2,
  ArrowRightLeft,
  Info,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';
import { UserProfile, SchoolUnit, UserRole } from '../../types/database';

export const EmployeesManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<UserProfile | null>(null);

  // Transfer / Mutasi State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<UserProfile | null>(null);
  const [transferTargetUnitId, setTransferTargetUnitId] = useState('');
  const [transferNewPosition, setTransferNewPosition] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [unitId, setUnitId] = useState('');
  const [workUnit, setWorkUnit] = useState('');
  const [role, setRole] = useState<'karyawan' | 'petugas_uks' | 'admin' | 'pimpinan'>('karyawan');
  const [contact, setContact] = useState('');
  const [dob, setDob] = useState('');

  const units = DataService.getUnits();
  const employees = React.useMemo(() => {
    return DataService.getProfiles('karyawan')
      .concat(DataService.getProfiles('petugas_uks'))
      .concat(DataService.getProfiles('admin'))
      .concat(DataService.getProfiles('pimpinan'));
  }, [reloadKey]);

  const filtered = employees.filter((e) => {
    if (selectedUnitId && e.unit_id !== selectedUnitId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.employee_or_student_id.toLowerCase().includes(q) ||
        (e.work_unit && e.work_unit.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenTransfer = (emp?: UserProfile) => {
    setTransferSuccessMsg('');
    const target = emp || filtered[0] || employees[0] || null;
    setTransferEmployee(target);
    setTransferTargetUnitId(target ? target.unit_id : units[0]?.id || '');
    setTransferNewPosition(target ? target.work_unit || '' : '');
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmployee || !currentUser) return;
    if (!transferTargetUnitId) {
      alert('Silakan pilih unit penempatan baru.');
      return;
    }

    const oldUnit = units.find((u) => u.id === transferEmployee.unit_id);
    const newUnit = units.find((u) => u.id === transferTargetUnitId);

    DataService.saveProfile(
      {
        ...transferEmployee,
        unit_id: transferTargetUnitId,
        work_unit: transferNewPosition.trim() || transferEmployee.work_unit,
        updated_at: new Date().toISOString(),
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    DataService.logAudit(
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
      'UPDATE_RECORD',
      'profiles',
      transferEmployee.id,
      {
        event: 'MUTASI_UNIT_KARYAWAN',
        nama_karyawan: transferEmployee.full_name,
        unit_lama: oldUnit?.unit_name || transferEmployee.unit_id,
        unit_baru: newUnit?.unit_name || transferTargetUnitId,
        jabatan_baru: transferNewPosition,
        catatan: transferNotes || undefined,
      }
    );

    setTransferSuccessMsg(`Berhasil memutasi ${transferEmployee.full_name} ke unit ${newUnit?.unit_name || 'baru'}`);
    setReloadKey((k) => k + 1);
    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferSuccessMsg('');
    }, 1200);
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFullName('');
    setEmployeeId(`NIY-${new Date().getFullYear()}.${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}`);
    setEmail('');
    setGender('L');
    setDob('1988-08-17');
    setUnitId(units[0]?.id || '');
    setWorkUnit('Guru Mata Pelajaran');
    setRole('karyawan');
    setContact('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: UserProfile) => {
    setEditingEmployee(emp);
    setFullName(emp.full_name);
    setEmployeeId(emp.employee_or_student_id);
    setEmail(emp.email);
    setGender(emp.gender);
    setDob(emp.date_of_birth || '');
    setUnitId(emp.unit_id);
    setWorkUnit(emp.work_unit || '');
    setRole(emp.role as any);
    setContact(emp.contact_information || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    DataService.saveProfile(
      {
        id: editingEmployee ? editingEmployee.id : `user-emp-${Date.now()}`,
        email: email || `${employeeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@lazuardi.sch.id`,
        employee_or_student_id: employeeId,
        full_name: fullName,
        role,
        category: 'karyawan',
        unit_id: unitId,
        work_unit: workUnit,
        gender,
        date_of_birth: dob || undefined,
        contact_information: contact,
        is_active: true,
        created_at: editingEmployee ? editingEmployee.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setIsModalOpen(false);
    setReloadKey((k) => k + 1);
  };

  const handleConfirmDelete = () => {
    if (!employeeToDelete || !currentUser) return;
    DataService.deleteProfile(employeeToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setEmployeeToDelete(null);
    setReloadKey((k) => k + 1);
  };

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleImportEmployees = (rows: string[][]) => {
    let successCount = 0;
    const errors: string[] = [];
    const allUnits = DataService.getUnits();
    const unitMapByCode = new Map(allUnits.map((u) => [u.unit_code.toUpperCase(), u.id]));

    rows.forEach((rawRow, idx) => {
      const lineNum = idx + 2;

      // Smart alignment: jika gelar/koma pada nama menyebabkan kolom bergeser sehingga email bergeser ke kolom 3 atau lebih
      let row = rawRow;
      const emailIdx = row.findIndex((c, i) => i >= 2 && c.includes('@'));
      if (emailIdx > 2) {
        const shift = emailIdx - 2;
        const nameParts = row.slice(0, shift + 1).map((s) => s.trim()).filter(Boolean);
        const fullName = nameParts.join(', ');
        const niy = row[shift + 1]?.trim() || '';
        const email = row[emailIdx]?.trim() || '';
        const rest = row.slice(emailIdx + 1);
        row = [fullName, niy, email, ...rest];
      }

      const empName = row[0]?.trim();
      const niy = row[1]?.trim().toUpperCase();
      const empEmail = row[2]?.trim().toLowerCase();
      const roleRaw = row[3]?.trim().toLowerCase();
      const unitCode = row[4]?.trim().toUpperCase();
      const position = row[5]?.trim();
      const genderRaw = row[6]?.trim().toUpperCase();
      const dobRaw = row[7]?.trim();
      const phone = row[8]?.trim();
      const emgContact = row[9]?.trim();
      const emgPhone = row[10]?.trim();

      // Gunakan parseFlexibleDate (mendukung YYYY-MM-DD, DD/MM/YYYY, dan Excel Serial Number seperti 36458)
      let dobVal: string | undefined = CsvService.parseFlexibleDate(dobRaw);
      let phoneVal = phone;
      if (!dobVal && dobRaw && !phone) {
        // Fallback kompatibilitas format lama dimana kolom 7 adalah no telepon
        phoneVal = dobRaw;
      }

      if (!empName) {
        errors.push(`Baris ${lineNum}: Nama karyawan wajib diisi.`);
        return;
      }

      const validRoles: UserRole[] = ['karyawan', 'petugas_uks', 'admin', 'pimpinan'];
      const assignedRole: UserRole = validRoles.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : 'karyawan';
      const assignedUnitId = unitMapByCode.get(unitCode) || allUnits[0]?.id || '';

      const empId = niy || `NIY-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
      const email = empEmail || `${empId.toLowerCase().replace(/[^a-z0-9]/g, '')}@lazuardi.sch.id`;

      const existing = employees.find((p) => p.employee_or_student_id === empId || p.email.toLowerCase() === email);

      if (currentUser) {
        DataService.saveProfile(
          {
            id: existing ? existing.id : `user-emp-csv-${Date.now()}-${idx}`,
            full_name: empName,
            employee_or_student_id: empId,
            email: email,
            role: assignedRole,
            category: 'karyawan',
            unit_id: assignedUnitId,
            work_unit: position || undefined,
            gender: genderRaw === 'P' ? 'P' : 'L',
            date_of_birth: dobVal,
            contact_information: phoneVal || undefined,
            emergency_contact: emgContact || undefined,
            emergency_phone: emgPhone || undefined,
            is_active: true,
          },
          {
            id: currentUser.id,
            name: currentUser.full_name,
            role: currentUser.role,
          }
        );
        successCount++;
      }
    });

    setReloadKey((k) => k + 1);
    return { successCount, errors };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-lg">
            <Users className="w-5 h-5 text-purple-700" />
            <span>Manajemen Data Guru & Karyawan</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Data tenaga pendidik dan kependidikan Lazuardi Global Compassionate School.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenTransfer()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="Mutasi penempatan unit sekolah atau posisi penugasan baru bagi guru & karyawan"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Mutasi Unit Karyawan
          </button>
          <button
            onClick={() => CsvService.downloadEmployeeTemplateCsv()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300"
            title="Unduh contoh template CSV data guru & karyawan"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Format CSV
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Import CSV Karyawan
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama karyawan, NIY, atau unit kerja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="w-56">
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
          >
            <option value="">Semua Unit Sekolah</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_code} - {u.unit_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Banner Mutasi Karyawan */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 px-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-950">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Mutasi Unit & Penugasan:</strong> Guru dan staf yang berpindah unit penempatan (TK/SD/SMP/SMA/Yayasan) dapat dimutasi secara langsung. Riwayat pemeriksaan gula darah, kunjungan UKS, dan jejak audit masa lalu <strong>tetap tersimpan utuh dan terhubung</strong>.
          </span>
        </div>
        <button
          onClick={() => handleOpenTransfer()}
          className="shrink-0 text-[11px] font-bold text-purple-800 hover:text-purple-950 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1.5 transition"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-700" />
          Mutasi Unit Sekarang
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">NIY</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Tanggal Lahir</th>
                <th className="py-3.5 px-4">Unit Kerja & Penugasan</th>
                <th className="py-3.5 px-4">Hak Akses Role</th>
                <th className="py-3.5 px-4">Kontak Telepon</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data guru atau karyawan.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-950">
                      {emp.employee_or_student_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {emp.date_of_birth
                        ? new Date(emp.date_of_birth).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{emp.work_unit || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {emp.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {emp.contact_information || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenTransfer(emp)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-700 rounded-lg transition"
                          title="Mutasi Unit Karyawan Ini"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 hover:bg-purple-50 text-purple-700 rounded-lg transition"
                          title="Ubah Data Karyawan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                          title="Hapus Data Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEmployee ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-purple-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    if (!editingEmployee && (!email || email.endsWith('@lazuardi.sch.id'))) {
                      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                      if (clean) setEmail(`${clean}@lazuardi.sch.id`);
                    }
                  }}
                  placeholder="Contoh: Budi Santoso, M.Pd"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email Akun Guru / Karyawan (Login & Google) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.karyawan@lazuardi.sch.id"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Email ini digunakan untuk login sistem LUKS dan Google Workspace (langsung aktif tanpa perlu diedit ulang di Manajemen Pengguna).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Yayasan (NIY) *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Kerja / Jabatan</label>
                  <input
                    type="text"
                    value={workUnit}
                    onChange={(e) => setWorkUnit(e.target.value)}
                    placeholder="Contoh: Guru Fisika SMA, Petugas UKS, Staff TU..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Penempatan</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role Sistem</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                  >
                    <option value="karyawan">Karyawan / Guru Biasa</option>
                    <option value="petugas_uks">Petugas UKS</option>
                    <option value="admin">Administrator</option>
                    <option value="pimpinan">Pimpinan Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor Kontak Telepon / WA</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Karyawan */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Guru/Karyawan</h3>
                <p className="text-[11px] text-slate-500">Master Data Karyawan</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus data karyawan berikut?</p>
              <div className="font-bold text-slate-900">{employeeToDelete.full_name}</div>
              <div className="text-[11px] font-mono text-slate-600">
                NIY/NIP: {employeeToDelete.employee_or_student_id} • Unit: {employeeToDelete.work_unit || '-'}
              </div>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Data profil ini akan dihapus dari sistem. Tindakan ini dicatat dalam jejak audit administrator.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
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
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mutasi Unit Karyawan */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Mutasi Unit Kerja & Penugasan</h3>
                  <p className="text-[11px] text-indigo-200">
                    Pindahkan unit penempatan atau posisi penugasan guru dan staf
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-indigo-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              {transferSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{transferSuccessMsg}</span>
                </div>
              )}

              {/* 1. Pilih Karyawan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Guru / Karyawan *</label>
                <select
                  value={transferEmployee?.id || ''}
                  onChange={(e) => {
                    const found = employees.find((x) => x.id === e.target.value);
                    if (found) {
                      setTransferEmployee(found);
                      setTransferTargetUnitId(found.unit_id);
                      setTransferNewPosition(found.work_unit || '');
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_or_student_id}) - {emp.work_unit || 'Karyawan'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Saat Ini */}
              {transferEmployee && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    Penempatan Saat Ini
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Unit Sekolah:</span>{' '}
                      <span className="font-bold text-slate-800">
                        {units.find((u) => u.id === transferEmployee.unit_id)?.unit_name || transferEmployee.unit_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Jabatan/Unit Kerja:</span>{' '}
                      <span className="font-bold text-slate-800">{transferEmployee.work_unit || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Unit Penempatan Baru */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Penempatan Baru *</label>
                <select
                  required
                  value={transferTargetUnitId}
                  onChange={(e) => setTransferTargetUnitId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_code} - {u.unit_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Posisi / Jabatan Baru */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Posisi / Jabatan Penugasan Baru *</label>
                <input
                  type="text"
                  required
                  value={transferNewPosition}
                  onChange={(e) => setTransferNewPosition(e.target.value)}
                  placeholder="Contoh: Guru Matematika SMA, Pembina UKS SMP..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* 4. Catatan Mutasi */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan SK / Keterangan Mutasi (Opsional)</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Nomor SK mutasi atau dasar pemindahan..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Info Medis */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan Riwayat UKS:</strong> Seluruh riwayat kunjungan UKS, pemeriksaan gula darah, dan jejak audit karyawan di unit terdahulu tetap tersimpan permanen dan terhubung dengan NIY karyawan.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!transferEmployee}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Simpan Mutasi Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal Karyawan */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Guru & Karyawan Massal (CSV)"
        description="Unggah berkas CSV untuk mendaftarkan banyak guru dan karyawan sekolah sekaligus beserta NIY, unit kerja, dan peran."
        expectedHeaders={[
          'Nama Lengkap',
          'NIY',
          'Email',
          'Role',
          'Kode Unit (TK/SD/SMP/SMA)',
          'Unit Kerja',
          'Jenis Kelamin (L/P)',
          'Tanggal Lahir (YYYY-MM-DD)',
          'No Telepon',
          'Kontak Darurat',
          'HP Darurat',
        ]}
        sampleDownloadFn={() => CsvService.downloadEmployeeTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format CSV Guru & Karyawan"
        onImport={handleImportEmployees}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
};
