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
  TrendingUp,
  ArrowRight,
  CheckSquare,
  Square,
  Users,
  Info,
  Mail,
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

  // Kenaikan / Pindah Kelas State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSourceUnitId, setPromoteSourceUnitId] = useState('');
  const [promoteSourceClassId, setPromoteSourceClassId] = useState('');
  const [promoteTargetUnitId, setPromoteTargetUnitId] = useState('');
  const [promoteTargetClassId, setPromoteTargetClassId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isGraduate, setIsGraduate] = useState(false);
  const [promoteSuccessMsg, setPromoteSuccessMsg] = useState('');

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
  const promoteSourceClasses = DataService.getClasses(promoteSourceUnitId);
  const promoteTargetClasses = DataService.getClasses(promoteTargetUnitId);

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

  const candidatePromoteStudents = students.filter((s) => {
    if (promoteSourceUnitId && s.unit_id !== promoteSourceUnitId) return false;
    if (promoteSourceClassId && s.class_id !== promoteSourceClassId) return false;
    return true;
  });

  const handleOpenPromote = (singleStudent?: UserProfile) => {
    setPromoteSuccessMsg('');
    if (singleStudent) {
      setPromoteSourceUnitId(singleStudent.unit_id);
      setPromoteSourceClassId(singleStudent.class_id || '');
      setSelectedStudentIds([singleStudent.id]);
      setPromoteTargetUnitId(singleStudent.unit_id);
      setPromoteTargetClassId('');
      setIsGraduate(false);
    } else {
      const initUnit = selectedUnitId || units[1]?.id || units[0]?.id || '';
      setPromoteSourceUnitId(initUnit);
      setPromoteSourceClassId(selectedClassId || '');
      const initialCandidates = students.filter((s) => {
        if (initUnit && s.unit_id !== initUnit) return false;
        if (selectedClassId && s.class_id !== selectedClassId) return false;
        return true;
      });
      setSelectedStudentIds(initialCandidates.map((s) => s.id));
      setPromoteTargetUnitId(initUnit);
      setPromoteTargetClassId('');
      setIsGraduate(false);
    }
    setIsPromoteModalOpen(true);
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCandidates = (candidateIds: string[]) => {
    if (selectedStudentIds.length === candidateIds.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds([...candidateIds]);
    }
  };

  const handleExecutePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || selectedStudentIds.length === 0) return;
    if (!isGraduate && (!promoteTargetUnitId || !promoteTargetClassId)) {
      alert('Silakan pilih unit dan kelas tujuan kenaikan kelas.');
      return;
    }

    const targetUnit = units.find((u) => u.id === promoteTargetUnitId);
    const targetClass = promoteTargetClasses.find((c) => c.id === promoteTargetClassId);

    selectedStudentIds.forEach((stdId) => {
      const studentObj = students.find((s) => s.id === stdId);
      if (studentObj) {
        DataService.saveProfile(
          {
            ...studentObj,
            unit_id: isGraduate ? studentObj.unit_id : promoteTargetUnitId,
            class_id: isGraduate ? undefined : promoteTargetClassId,
            is_active: isGraduate ? false : true,
            updated_at: new Date().toISOString(),
          },
          {
            id: currentUser.id,
            name: currentUser.full_name,
            role: currentUser.role,
          }
        );
      }
    });

    const targetDesc = isGraduate
      ? 'Status Lulus / Alumni'
      : `${targetUnit?.unit_code || ''} - ${targetClass?.class_name || ''}`;

    DataService.logAudit(
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role },
      'UPDATE_RECORD',
      'profiles',
      undefined,
      {
        event: 'KENAIKAN_MUTASI_KELAS',
        jumlah_siswa: selectedStudentIds.length,
        tujuan: targetDesc,
      }
    );

    setPromoteSuccessMsg(`Berhasil memproses kenaikan/mutasi ${selectedStudentIds.length} siswa ke: ${targetDesc}`);
    setReloadKey((k) => k + 1);
    setTimeout(() => {
      setIsPromoteModalOpen(false);
      setPromoteSuccessMsg('');
    }, 1200);
  };

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

    rows.forEach((rawRow, idx) => {
      const lineNum = idx + 2;

      // Smart alignment: jika nama siswa memiliki koma/suffix yang membuat kolom bergeser
      let row = rawRow;
      const emailIdx = row.findIndex((c, i) => i >= 2 && c.includes('@'));
      if (emailIdx > 2) {
        const shift = emailIdx - 2;
        const nameParts = row.slice(0, shift + 1).map((s) => s.trim()).filter(Boolean);
        const fullName = nameParts.join(', ');
        const nis = row[shift + 1]?.trim() || '';
        const email = row[emailIdx]?.trim() || '';
        const rest = row.slice(emailIdx + 1);
        row = [fullName, nis, email, ...rest];
      }

      const stdName = row[0]?.trim();
      const stdId = row[1]?.trim().toUpperCase();
      const stdEmail = row[2]?.trim().toLowerCase();
      const unitCode = row[3]?.trim().toUpperCase();
      const className = row[4]?.trim();
      const genderRaw = row[5]?.trim().toUpperCase();
      const dobRaw = row[6]?.trim();
      const contact = row[7]?.trim();
      const emgContact = row[8]?.trim();
      const emgPhone = row[9]?.trim();
      const dob = CsvService.parseFlexibleDate(dobRaw);

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
            onClick={() => handleOpenPromote()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="Kenaikan kelas atau mutasi rombel belajar secara individu maupun massal"
          >
            <TrendingUp className="w-4 h-4" />
            Naik / Pindah Kelas
          </button>
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

      {/* Notice Banner Kenaikan Kelas */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 px-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-950">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Kenaikan / Mutasi Rombel Belajar:</strong> Siswa yang naik kelas atau pindah jenjang akan otomatis diperbarui kelasnya. Seluruh riwayat kunjungan UKS dan pemeriksaan gula darah terdahulu <strong>tetap tersimpan utuh dan tidak akan hilang</strong>.
          </span>
        </div>
        <button
          onClick={() => handleOpenPromote()}
          className="shrink-0 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition"
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          Proses Kenaikan Kelas
        </button>
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
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{std.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{std.email}</span>
                        </div>
                      </td>
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
                            onClick={() => handleOpenPromote(std)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-700 rounded-lg transition"
                            title="Naik / Pindah Kelas Siswa Ini"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    if (!editingStudent && (!email || email.endsWith('@siswa.lazuardi.sch.id'))) {
                      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                      if (clean) setEmail(`${clean}@siswa.lazuardi.sch.id`);
                    }
                  }}
                  placeholder="Nama lengkap sesuai akta lahir..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Email Akun Siswa (Login & Google) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@siswa.lazuardi.sch.id"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Email akun ini digunakan untuk login siswa dan integrasi Google (langsung aktif tanpa perlu diedit ulang di Manajemen Pengguna).
                </p>
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
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon Siswa</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
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

      {/* Modal Kenaikan & Pindah Kelas Siswa */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kenaikan & Mutasi Kelas Siswa</h3>
                  <p className="text-[11px] text-indigo-200">
                    Proses pemindahan rombel belajar atau naik jenjang kelas perorangan maupun massal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="p-1 text-indigo-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePromotion} className="p-6 space-y-4 overflow-y-auto text-xs">
              {promoteSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{promoteSuccessMsg}</span>
                </div>
              )}

              {/* 1. Asal Kelas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  <span>Pilih Rombongan Belajar (Asal)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Unit Sekolah Asal</label>
                    <select
                      value={promoteSourceUnitId}
                      onChange={(e) => {
                        setPromoteSourceUnitId(e.target.value);
                        setPromoteSourceClassId('');
                        setSelectedStudentIds([]);
                      }}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                    >
                      <option value="">Semua Unit</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unit_code} - {u.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Kelas Asal</label>
                    <select
                      value={promoteSourceClassId}
                      onChange={(e) => {
                        setPromoteSourceClassId(e.target.value);
                        setSelectedStudentIds([]);
                      }}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                    >
                      <option value="">Semua Kelas</option>
                      {promoteSourceClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Daftar Siswa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Pilih Siswa yang Naik / Pindah Kelas</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ({selectedStudentIds.length} dari {candidatePromoteStudents.length} terpilih)
                    </span>
                  </div>

                  {candidatePromoteStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllCandidates(candidatePromoteStudents.map((s) => s.id))}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      {selectedStudentIds.length === candidatePromoteStudents.length
                        ? 'Batalkan Semua'
                        : 'Pilih Semua Siswa'}
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {candidatePromoteStudents.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      Tidak ada siswa pada unit & kelas asal yang dipilih.
                    </div>
                  ) : (
                    candidatePromoteStudents.map((std) => {
                      const isSelected = selectedStudentIds.includes(std.id);
                      const stdCls = classes.find((c) => c.id === std.class_id);
                      return (
                        <div
                          key={std.id}
                          onClick={() => handleToggleSelectStudent(std.id)}
                          className={`p-2.5 px-3 flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50/70 font-bold text-indigo-950' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(std.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <div className="text-xs">{std.full_name}</div>
                              <div className="text-[10px] font-mono text-slate-400">NIS: {std.employee_or_student_id}</div>
                            </div>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {stdCls?.class_name || 'Umum'}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. Tujuan Kenaikan Kelas */}
              <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-200/80 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  <span>Tujuan Kenaikan / Mutasi Rombel</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isGraduate}
                      onChange={(e) => setIsGraduate(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Tandai Siswa Telah Lulus Jenjang Akhir / Alumni (Non-aktifkan Rombel)</span>
                  </label>
                </div>

                {!isGraduate && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Unit Sekolah Tujuan *</label>
                      <select
                        required
                        value={promoteTargetUnitId}
                        onChange={(e) => {
                          setPromoteTargetUnitId(e.target.value);
                          setPromoteTargetClassId('');
                        }}
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                      >
                        <option value="">Pilih Unit Sekolah</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_code} - {u.unit_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Kelas Tujuan *</label>
                      <select
                        required
                        value={promoteTargetClassId}
                        onChange={(e) => setPromoteTargetClassId(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                      >
                        <option value="">Pilih Kelas Tujuan</option>
                        {promoteTargetClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.class_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan Riwayat Medis:</strong> Seluruh riwayat kunjungan UKS, pemeriksaan gula darah, catatan alergi, dan tindak lanjut siswa di masa lalu tidak akan terhapus ataupun berubah, dan tetap melekat pada NIS siswa secara permanen.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIds.length === 0}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <TrendingUp className="w-4 h-4" />
                  Proses Kenaikan Kelas ({selectedStudentIds.length} Siswa)
                </button>
              </div>
            </form>
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
