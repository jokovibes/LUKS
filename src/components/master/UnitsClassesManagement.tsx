/**
 * Manajemen Data Unit Sekolah & Kelas - LUKS
 * Features full CRUD (Create, Read, Update, Delete) for Units and Classes.
 */

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  Save,
  X,
  CheckCircle2,
  Upload,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { SchoolUnit, SchoolClass } from '../../types/database';
import { CsvService } from '../../services/csvService';
import { CsvImportModal } from '../common/CsvImportModal';

export const UnitsClassesManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const units = React.useMemo(() => DataService.getUnits(), [reloadKey]);
  const classes = React.useMemo(() => DataService.getClasses(), [reloadKey]);

  const [selectedUnit, setSelectedUnit] = useState<string>(units[1]?.id || units[0]?.id || '');

  // Class Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  // Unit Modal States
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<SchoolUnit | null>(null);
  const [unitNameInput, setUnitNameInput] = useState('');
  const [unitCodeInput, setUnitCodeInput] = useState('');
  const [unitHeadInput, setUnitHeadInput] = useState('');
  const [unitToDelete, setUnitToDelete] = useState<SchoolUnit | null>(null);

  const currentClasses = classes.filter((c) => c.unit_id === selectedUnit);

  // Handle Class Add/Edit
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: SchoolClass) => {
    setEditingClass(cls);
    setClassNameInput(cls.class_name);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !classNameInput.trim()) return;

    DataService.saveClass(
      {
        id: editingClass ? editingClass.id : `cls-${Date.now()}`,
        class_name: classNameInput.trim(),
        unit_id: selectedUnit,
        is_active: true,
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    setClassNameInput('');
    setEditingClass(null);
    setIsClassModalOpen(false);
    setReloadKey((k) => k + 1);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete || !currentUser) return;
    DataService.deleteClass(classToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setClassToDelete(null);
    setReloadKey((k) => k + 1);
  };

  // Handle Unit Add/Edit
  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitNameInput('');
    setUnitCodeInput('');
    setUnitHeadInput('');
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (u: SchoolUnit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUnit(u);
    setUnitNameInput(u.unit_name);
    setUnitCodeInput(u.unit_code);
    setUnitHeadInput(u.head_of_unit || '');
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !unitNameInput.trim() || !unitCodeInput.trim()) return;

    const saved = DataService.saveUnit(
      {
        id: editingUnit ? editingUnit.id : `unit-${Date.now()}`,
        unit_code: unitCodeInput.trim().toUpperCase(),
        unit_name: unitNameInput.trim(),
        head_of_unit: unitHeadInput.trim() || undefined,
        is_active: true,
      },
      {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }
    );

    if (!selectedUnit) setSelectedUnit(saved.id);
    setIsUnitModalOpen(false);
    setEditingUnit(null);
    setReloadKey((k) => k + 1);
  };

  const handleConfirmDeleteUnit = () => {
    if (!unitToDelete || !currentUser) return;
    DataService.deleteUnit(unitToDelete.id, {
      id: currentUser.id,
      name: currentUser.full_name,
      role: currentUser.role,
    });
    setUnitToDelete(null);
    setReloadKey((k) => k + 1);
    if (selectedUnit === unitToDelete.id) {
      const remaining = units.filter((u) => u.id !== unitToDelete.id);
      setSelectedUnit(remaining[0]?.id || '');
    }
  };

  // Batch CSV Import for Units & Classes
  const handleImportUnitsAndClasses = (rows: string[][]): { successCount: number; errors: string[] } => {
    if (!currentUser) return { successCount: 0, errors: ['Pengguna tidak terautentikasi'] };

    let successCount = 0;
    const errors: string[] = [];
    const existingUnits = DataService.getUnits();
    const existingClasses = DataService.getClasses();

    // In-memory map for unit lookup by code
    const unitCodeMap = new Map<string, SchoolUnit>();
    existingUnits.forEach((u) => {
      unitCodeMap.set(u.unit_code.trim().toUpperCase(), u);
    });

    rows.forEach((row, idx) => {
      const lineNum = idx + 2;
      const type = (row[0] || '').trim().toUpperCase();
      const unitCode = (row[1] || '').trim().toUpperCase();
      const unitName = (row[2] || '').trim();
      const headOfUnit = (row[3] || '').trim();
      const className = (row[4] || '').trim();

      if (!type && !unitCode && !className && !unitName) return; // skip blank row

      if (type === 'UNIT' || (!type && unitName && unitCode)) {
        if (!unitCode || !unitName) {
          errors.push(`Baris ${lineNum}: Untuk UNIT, Kode Unit dan Nama Unit wajib diisi.`);
          return;
        }

        const existing = unitCodeMap.get(unitCode);
        const unitPayload: SchoolUnit = {
          id: existing ? existing.id : `unit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          unit_code: unitCode,
          unit_name: unitName,
          head_of_unit: headOfUnit || undefined,
          is_active: true,
        };

        DataService.saveUnit(unitPayload, {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        });

        unitCodeMap.set(unitCode, unitPayload);
        successCount++;
      } else if (type === 'KELAS' || (!type && className)) {
        if (!className) {
          errors.push(`Baris ${lineNum}: Untuk KELAS, Nama Kelas wajib diisi.`);
          return;
        }
        if (!unitCode) {
          errors.push(`Baris ${lineNum}: Kode Unit wajib diisi untuk menentukan unit kelas.`);
          return;
        }

        const targetUnit = unitCodeMap.get(unitCode);
        if (!targetUnit) {
          errors.push(`Baris ${lineNum}: Unit dengan kode "${unitCode}" tidak ditemukan di database.`);
          return;
        }

        // Avoid duplicate class names within the same unit
        const existingClass = existingClasses.find(
          (c) => c.unit_id === targetUnit.id && c.class_name.toLowerCase() === className.toLowerCase()
        );

        const classPayload: SchoolClass = {
          id: existingClass ? existingClass.id : `cls-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          unit_id: targetUnit.id,
          class_name: className,
          is_active: true,
        };

        DataService.saveClass(classPayload, {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        });

        existingClasses.push(classPayload);
        successCount++;
      } else {
        errors.push(`Baris ${lineNum}: Tipe baris harus "UNIT" atau "KELAS".`);
      }
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
            <Building2 className="w-5 h-5 text-blue-700" />
            <span>Data Unit Sekolah & Kelas</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Struktur tingkatan sekolah Pra-TK & TK, SD, SMP, dan SMA Lazuardi Global Compassionate School.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format CSV Button */}
          <button
            onClick={() => CsvService.downloadUnitsClassesTemplateCsv()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            title="Download contoh template format CSV untuk Unit Sekolah & Kelas"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Format CSV</span>
          </button>

          {/* Import CSV Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition shadow-xs"
            title="Upload data unit & kelas secara massal dari file CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import CSV Unit & Kelas</span>
          </button>

          <button
            onClick={handleOpenAddUnit}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            Tambah Unit
          </button>
          <button
            onClick={handleOpenAddClass}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Unit Selector (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pilih Unit Sekolah ({units.length})
            </h3>
          </div>
          <div className="space-y-2">
            {units.map((u) => {
              const count = classes.filter((c) => c.unit_id === u.id).length;
              const isSelected = selectedUnit === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUnit(u.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-700/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs truncate">{u.unit_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Kode: {u.unit_code} {u.head_of_unit ? `• Kepala: ${u.head_of_unit}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-bold">
                      {count} Kelas
                    </span>
                    <button
                      onClick={(e) => handleOpenEditUnit(u, e)}
                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-white rounded transition"
                      title="Ubah Unit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnitToDelete(u);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition"
                      title="Hapus Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Classes in Unit (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              Daftar Kelas di Unit Terpilih ({currentClasses.length})
            </h3>
            <button
              onClick={handleOpenAddClass}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kelas
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentClasses.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                Belum ada kelas yang didaftarkan pada unit ini.
              </div>
            ) : (
              currentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{cls.class_name}</div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold inline-block mt-1">
                      Aktif
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-lg transition"
                      title="Ubah Nama Kelas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setClassToDelete(cls)}
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Class */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {editingClass ? 'Ubah Nama Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 7 Ibnu Sina, 10 IPA 2..."
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Unit */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {editingUnit ? 'Ubah Data Unit Sekolah' : 'Tambah Unit Sekolah Baru'}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SD, SMP, SMA, TK"
                  value={unitCodeInput}
                  onChange={(e) => setUnitCodeInput(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Lazuardi Al-Falah"
                  value={unitNameInput}
                  onChange={(e) => setUnitNameInput(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kepala Unit / Sekolah</label>
                <input
                  type="text"
                  placeholder="Nama Kepala Sekolah"
                  value={unitHeadInput}
                  onChange={(e) => setUnitHeadInput(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Kelas */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Data Kelas</h3>
                <p className="text-[11px] text-slate-500">Master Data Kelas</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus kelas <strong>{classToDelete.class_name}</strong>?</p>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Data kelas akan dihapus dari sistem.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Unit */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Unit Sekolah</h3>
                <p className="text-[11px] text-slate-500">Master Data Unit</p>
              </div>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 text-slate-700 space-y-1.5">
              <p>Apakah Anda yakin ingin menghapus unit <strong>{unitToDelete.unit_name}</strong> ({unitToDelete.unit_code})?</p>
              <p className="text-[10px] text-rose-700 font-semibold pt-1">
                Perhatian: Menghapus unit dapat memengaruhi referensi kelas dan siswa yang terkait.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUnit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV Unit & Kelas */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Data Unit Sekolah & Kelas via CSV"
        description="Gunakan template resmi untuk menambahkan Unit Sekolah dan Kelas sekaligus. Tentukan baris dengan Tipe UNIT atau KELAS."
        expectedHeaders={[
          'Tipe (UNIT/KELAS)',
          'Kode Unit (TK/SD/SMP/SMA)',
          'Nama Unit',
          'Kepala Unit',
          'Nama Kelas',
        ]}
        sampleDownloadFn={() => CsvService.downloadUnitsClassesTemplateCsv()}
        sampleDownloadLabel="Unduh Contoh Format Unit & Kelas"
        onImport={handleImportUnitsAndClasses}
      />
    </div>
  );
};
