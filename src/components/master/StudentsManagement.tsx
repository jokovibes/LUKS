/**
 * Master Data Siswa - LUKS
 * Handles student registry, search by NIS and Name, Unit & Class filters, and modal to add/edit students.
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Phone,
  Calendar,
  Building2,
  Upload,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';
import { UserProfile, SchoolUnit, SchoolClass } from '../../types/database';

export const StudentsManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [unitId, setUnitId] = useState('');
  const [classId, setClassId] = useState('');
  const [dob, setDob] = useState('');
  const [contact, setContact] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const units = DataService.getUnits();
  const classes = DataService.getClasses(unitId || selectedUnitId);

  const students = React.useMemo(() => DataService.getProfiles('siswa'), [reloadKey]);

  const filteredStudents = students.filter((s) => {
    if (selectedUnitId && s.unit_id !== selectedUnitId) return false;
    if (selectedClassId && s.class_id !== selectedClassId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.employee_or_student_id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFullName('');
    setStudentId(`NIS-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    setEmail('');
    setGender('L');
    setUnitId(units[1]?.id || units[0]?.id || '');
    setClassId('');
    setDob('2014-05-10');
    setContact('');
    setEmergencyContact('');
    setEmergencyPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: UserProfile) => {
    setEditingStudent(student);
    setFullName(student.full_name);
    setStudentId(student.employee_or_student_id);
    setEmail(student.email);
    setGender(student.gender);
    setUnitId(student.unit_id);
    setClassId(student.class_id || '');
    setDob(student.date_of_birth || '');
    setContact(student.contact_information || '');
    setEmergencyContact(student.emergency_contact || '');
    setEmergencyPhone(student.emergency_phone || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    DataService.saveProfile(
      {
        id: editingStudent ? editingStudent.id : `user-std-${Date.now()}`,
        email: email || `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@siswa.lazuardi.sch.id`,
        employee_or_student_id: studentId,
        full_name: fullName,
        role: 'siswa',
        category: 'siswa',
        unit_id: unitId,
        class_id: classId || undefined,
        gender,
        date_of_birth: dob,
        contact_information: contact,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone,
        is_active: true,
        created_at: editingStudent ? editingStudent.created_at : new Date().toISOString(),
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
    if (!studentToDelete || !currentUser) return;
    DataService.deleteProfile(studentToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setStudentToDelete(null);
    setReloadKey((k) => k + 1);
  };

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleImportStudents = (rows: string[][]) => {
    let successCount = 0;
    const errors: string[] = [];
    const allUnits = DataService.getUnits();
    const unitMapByCode = new Map(allUnits.map((u) => [u.unit_code.toUpperCase(), u.id]));
    const allClasses = DataService.getClasses();

    rows.forEach((row, idx) => {
      const lineNum = idx + 2;
      const stdName = row[0]?.trim();
      const stdId = row[1]?.trim().toUpperCase();
      const stdEmail = row[2]?.trim().toLowerCase();
      const unitCode = row[3]?.trim().toUpperCase();
      const className = row[4]?.trim();
      const genderRaw = row[5]?.trim().toUpperCase();
      const dob = row[6]?.trim();
      const contact = row[7]?.trim();
      const emgContact = row[8]?.trim();
      const emgPhone = row[9]?.trim();

      if (!stdName) {
        errors.push(`Baris ${lineNum}: Nama siswa wajib diisi.`);
        return;
      }

      const assignedUnitId = unitMapByCode.get(unitCode) || allUnits[1]?.id || allUnits[0]?.id || '';

      // Match or resolve class
      let assignedClassId: string | undefined = undefined;
      if (className) {
        const foundClass = allClasses.find(
          (c) => c.unit_id === assignedUnitId && c.class_name.toLowerCase() === className.toLowerCase()
        );
        if (foundClass) {
          assignedClassId = foundClass.id;
        } else if (currentUser) {
          const newClass = DataService.saveClass(
            {
              id: `cls-${Date.now()}-${idx}`,
              class_name: className,
              unit_id: assignedUnitId,
              is_active: true,
            },
            { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
          );
          assignedClassId = newClass.id;
          allClasses.push(newClass);
        }
      }

      const nis = stdId || `NIS-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
      const email = stdEmail || `${nis.toLowerCase().replace(/[^a-z0-9]/g, '')}@siswa.lazuardi.sch.id`;

      const existing = students.find((p) => p.employee_or_student_id === nis || p.email.toLowerCase() === email);

      if (currentUser) {
        DataService.saveProfile(
          {
            id: existing ? existing.id : `user-std-csv-${Date.now()}-${idx}`,
            full_name: stdName,
            employee_or_student_id: nis,
            email: email,
            role: 'siswa',
            category: 'siswa',
            unit_id: assignedUnitId,
            class_id: assignedClassId,
            gender: genderRaw === 'P' ? 'P' : 'L',
            date_of_birth: dob || undefined,
            contact_information: contact || undefined,
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
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <GraduationCap className="w-5 h-5 text-blue-700" />
            <span>Manajemen Data Siswa</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar data induk siswa sekolah Lazuardi untuk integrasi pemeriksaan UKS dan riwayat kesehatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => CsvService.downloadStudentTemplateCsv()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300"
            title="Unduh contoh template CSV data siswa"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Format CSV
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Import CSV Siswa
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="w-44">
          <select
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setSelectedClassId('');
            }}
            className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
          >
            <option value="">Semua Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_code}
              </option>
            ))}
          </select>
        </div>

        <div className="w-44">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
            disabled={!selectedUnitId}
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">Unit & Kelas</th>
                <th className="py-3.5 px-4">Tanggal Lahir</th>
                <th className="py-3.5 px-4">Jenis Kelamin</th>
                <th className="py-3.5 px-4">Kontak Darurat Ortu</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data siswa.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const unit = units.find((u) => u.id === std.unit_id);
                  const cls = classes.find((c) => c.id === std.class_id);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                        {std.employee_or_student_id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{std.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {unit?.unit_code} - {cls?.class_name || 'Umum'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {std.date_of_birth
                          ? new Date(std.date_of_birth).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {std.emergency_contact ? `${std.emergency_contact} (${std.emergency_phone || '-'})` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(std)}
                            className="p-1.5 hover:bg-blue-50 text-blue-700 rounded-lg transition"
                            title="Ubah Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(std)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            title="Hapus Data Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-blue-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap sesuai akta lahir..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Siswa (NIS) *</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
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
                  <label className="font-bold text-slate-700 block mb-1">Email Siswa (Opsional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@siswa.lazuardi.sch.id"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Sekolah</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Kelas</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Contoh: Rahmat Subagyo (Ayah)"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon Darurat</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
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
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Siswa */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Data Siswa</h3>
                <p className="text-[11px] text-slate-500">Master Data Siswa</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus data siswa berikut?</p>
              <div className="font-bold text-slate-900">{studentToDelete.full_name}</div>
              <div className="text-[11px] font-mono text-slate-600">
                NIS: {studentToDelete.employee_or_student_id} • Email: {studentToDelete.email}
              </div>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Data profil ini akan dihapus dari sistem. Tindakan ini dicatat dalam jejak audit administrator.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
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
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal Siswa */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Siswa Massal (CSV)"
        description="Unggah berkas CSV untuk mendaftarkan banyak siswa sekolah sekaligus beserta NIS, unit sekolah, dan kelas."
        expectedHeaders={[
          'Nama Lengkap',
          'NIS',
          'Email',
          'Kode Unit (TK/SD/SMP/SMA)',
          'Nama Kelas',
          'Jenis Kelamin (L/P)',
          'Tanggal Lahir',
          'Kontak',
          'Kontak Darurat',
          'HP Darurat',
        ]}
        sampleDownloadFn={() => CsvService.downloadStudentTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format CSV Siswa"
        onImport={handleImportStudents}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
};
