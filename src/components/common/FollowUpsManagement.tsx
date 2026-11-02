/**
 * Modul Manajemen Tindak Lanjut (Follow-Up) Pasien UKS & Skrining Glukosa
 * Lazuardi UKS Management System (LUKS)
 * Mendukung pencatatan pemantauan, penjadwalan evaluasi, rujukan ke RS, dan komunikasi keluarga.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Activity,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Calendar,
  User,
  Phone,
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  Hospital,
  ChevronRight,
  Shield,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import {
  GlucoseFollowUp,
  UksFollowUp,
  UserProfile,
  GlucoseExamination,
  UksVisit,
} from '../../types/database';

interface FollowUpsManagementProps {
  onOpenRegister?: () => void;
}

interface UnifiedFollowUpItem {
  id: string;
  source: 'glucose' | 'visit';
  follow_up_status: string;
  scheduled_date?: string;
  completed_at?: string;
  responsible_staff_id?: string;
  responsible_staff_name: string;
  recommended_action?: string;
  communication_notes?: string;
  referral_details?: string;
  referral_destination?: string;
  handover_notes?: string;
  contact_person?: string;
  pickup_contact?: string;
  created_at: string;
  updated_at?: string;
  participant?: UserProfile;
  examination?: GlucoseExamination;
  visit?: UksVisit;
}

export const FollowUpsManagement: React.FC<FollowUpsManagementProps> = ({ onOpenRegister }) => {
  const { currentUser, role } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  // Sync listener
  useEffect(() => {
    const handleSync = () => {
      setReloadKey((k) => k + 1);
    };
    window.addEventListener('luks-supabase-synced', handleSync);
    return () => window.removeEventListener('luks-supabase-synced', handleSync);
  }, []);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'glucose' | 'visit'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<UnifiedFollowUpItem | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<UnifiedFollowUpItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnifiedFollowUpItem | null>(null);

  // Success / Error message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for editing / updating status
  const [editStatus, setEditStatus] = useState<string>('sedang_dipantau');
  const [editScheduledDate, setEditScheduledDate] = useState<string>('');
  const [editCompletedAt, setEditCompletedAt] = useState<string>('');
  const [editAction, setEditAction] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editReferral, setEditReferral] = useState<string>('');

  // Form state for creating new follow-up
  const [newSource, setNewSource] = useState<'glucose' | 'visit'>('glucose');
  const [newParticipantId, setNewParticipantId] = useState<string>('');
  const [newTargetRecordId, setNewTargetRecordId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('sedang_dipantau');
  const [newScheduledDate, setNewScheduledDate] = useState<string>('');
  const [newAction, setNewAction] = useState<string>('');
  const [newReferral, setNewReferral] = useState<string>('');
  const [newContactPerson, setNewContactPerson] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const isStaffOrAdmin = role === 'admin' || role === 'petugas_uks';

  // Load unified data
  const { unifiedList, units, profiles, exams, visits } = useMemo(() => {
    if (!currentUser) return { unifiedList: [], units: [], profiles: [], exams: [], visits: [] };

    const u = DataService.getUnits();
    const p = DataService.getProfiles();
    const e = DataService.getGlucoseExaminations(currentUser);
    const v = DataService.getUksVisits(currentUser);
    const gfu = DataService.getGlucoseFollowUps(currentUser);
    const ufu = DataService.getUksFollowUps(currentUser);

    const list: UnifiedFollowUpItem[] = [];

    // 1. Glucose Follow-Ups
    gfu.forEach((g) => {
      const exam = e.find((ex) => ex.id === g.examination_id);
      const participant = exam ? p.find((pr) => pr.id === exam.participant_id) : undefined;
      list.push({
        id: g.id,
        source: 'glucose',
        follow_up_status: g.follow_up_status,
        scheduled_date: g.scheduled_date,
        completed_at: g.completed_at,
        responsible_staff_id: g.responsible_staff_id,
        responsible_staff_name: g.responsible_staff_name || 'Petugas UKS',
        recommended_action: g.recommended_action,
        communication_notes: g.communication_notes,
        referral_details: g.referral_details,
        created_at: g.created_at,
        updated_at: g.updated_at,
        participant,
        examination: exam,
      });
    });

    // 2. UKS Visit Follow-Ups
    ufu.forEach((uItem) => {
      const visit = v.find((vs) => vs.id === uItem.visit_id);
      const participant = visit ? p.find((pr) => pr.id === visit.participant_id) : undefined;
      list.push({
        id: uItem.id,
        source: 'visit',
        follow_up_status: uItem.follow_up_status,
        scheduled_date: uItem.scheduled_date,
        completed_at: uItem.completed_at,
        responsible_staff_id: uItem.responsible_staff_id,
        responsible_staff_name: uItem.responsible_staff_name || 'Petugas UKS',
        recommended_action: uItem.handover_notes,
        communication_notes: uItem.handover_notes,
        referral_details: uItem.referral_destination,
        referral_destination: uItem.referral_destination,
        contact_person: uItem.contact_person,
        pickup_contact: uItem.pickup_contact,
        created_at: uItem.created_at,
        updated_at: uItem.updated_at,
        participant,
        visit,
      });
    });

    // Sort descending by created_at or scheduled_date
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { unifiedList: list, units: u, profiles: p, exams: e, visits: v };
  }, [currentUser, reloadKey]);

  // Filtered List
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // Source filter
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'sedang_dipantau' && item.follow_up_status !== 'sedang_dipantau' && item.follow_up_status !== 'belum_dilakukan') return false;
        if (statusFilter === 'dirujuk' && item.follow_up_status !== 'dirujuk') return false;
        if (statusFilter === 'selesai' && item.follow_up_status !== 'selesai') return false;
      }

      // Unit filter
      if (unitFilter !== 'all' && item.participant?.unit_id !== unitFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const pName = item.participant?.full_name?.toLowerCase() || '';
        const pId = item.participant?.employee_or_student_id?.toLowerCase() || '';
        const staff = item.responsible_staff_name.toLowerCase();
        const action = (item.recommended_action || '').toLowerCase();
        const notes = (item.communication_notes || '').toLowerCase();
        return pName.includes(q) || pId.includes(q) || staff.includes(q) || action.includes(q) || notes.includes(q);
      }

      return true;
    });
  }, [unifiedList, sourceFilter, statusFilter, unitFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = unifiedList.length;
    const monitoring = unifiedList.filter(
      (i) => i.follow_up_status === 'sedang_dipantau' || i.follow_up_status === 'belum_dilakukan'
    ).length;
    const referred = unifiedList.filter((i) => i.follow_up_status === 'dirujuk').length;
    const completed = unifiedList.filter((i) => i.follow_up_status === 'selesai').length;
    return { total, monitoring, referred, completed };
  }, [unifiedList]);

  // Detected examinations that require follow-up but have not been assigned yet
  const pendingExaminations = useMemo(() => {
    const existingExamFollowUpIds = new Set(
      unifiedList.filter((i) => i.source === 'glucose' && i.examination?.id).map((i) => i.examination!.id)
    );
    return exams.filter(
      (e) =>
        (e.classification === 'tindak_lanjut' || e.classification === 'perlu_perhatian') &&
        !existingExamFollowUpIds.has(e.id)
    );
  }, [exams, unifiedList]);

  const handleActionFromExam = (exam: GlucoseExamination) => {
    setNewParticipantId(exam.participant_id);
    setNewSource('glucose');
    setNewTargetRecordId(exam.id);
    setNewStatus('sedang_dipantau');
    setNewAction(
      `Pemeriksaan ulang berkala dan evaluasi medis atas hasil gula darah ${exam.result_value} ${exam.result_unit} (Klasifikasi: ${
        exam.classification === 'tindak_lanjut' ? 'Tindak Lanjut Segera' : 'Perlu Perhatian'
      })`
    );
    setNewScheduledDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: UnifiedFollowUpItem) => {
    setSelectedItemForEdit(item);
    setEditStatus(item.follow_up_status);
    setEditScheduledDate(item.scheduled_date || '');
    setEditCompletedAt(item.completed_at || '');
    setEditAction(item.recommended_action || '');
    setEditNotes(item.communication_notes || item.handover_notes || '');
    setEditReferral(item.referral_details || item.referral_destination || '');
  };

  // Save Edit Status to Supabase
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit || !currentUser) return;

    try {
      if (selectedItemForEdit.source === 'glucose') {
        DataService.saveGlucoseFollowUp(
          {
            id: selectedItemForEdit.id,
            follow_up_status: editStatus as any,
            scheduled_date: editScheduledDate || undefined,
            completed_at: editStatus === 'selesai' ? (editCompletedAt || new Date().toISOString()) : undefined,
            recommended_action: editAction,
            communication_notes: editNotes,
            referral_details: editReferral,
          },
          { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
        );
      } else {
        DataService.saveUksFollowUp(
          {
            id: selectedItemForEdit.id,
            follow_up_status: editStatus as any,
            scheduled_date: editScheduledDate || undefined,
            completed_at: editStatus === 'selesai' ? (editCompletedAt || new Date().toISOString()) : undefined,
            handover_notes: editNotes || editAction,
            referral_destination: editReferral,
          },
          { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
        );
      }

      setSelectedItemForEdit(null);
      setReloadKey((k) => k + 1);
      setSuccessMessage('Status tindak lanjut berhasil diperbarui dan tersimpan ke Supabase.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan pembaruan tindak lanjut ke Supabase.');
    }
  };

  // Handle Create New Follow-Up to Supabase
  const handleCreateNewFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newParticipantId) {
      setErrorMessage('Silakan pilih nama peserta / pasien terlebih dahulu.');
      return;
    }

    try {
      if (newSource === 'glucose') {
        let targetExamId = newTargetRecordId;
        if (!targetExamId) {
          const partExams = exams.filter((ex) => ex.participant_id === newParticipantId);
          if (partExams.length > 0) {
            targetExamId = partExams[0].id;
          } else {
            const newExam = DataService.saveGlucoseExamination(
              {
                participant_id: newParticipantId,
                examination_type: 'sewaktu',
                result_value: 0,
                result_unit: 'mg/dL',
                notes: 'Pencatatan rujukan/tindak lanjut medis langsung dari menu evaluasi UKS',
                classification: 'tindak_lanjut',
                record_status: 'resmi',
              },
              { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
            );
            targetExamId = newExam.id;
          }
        }

        DataService.saveGlucoseFollowUp(
          {
            examination_id: targetExamId,
            responsible_staff_id: currentUser.id,
            responsible_staff_name: currentUser.full_name,
            follow_up_status: newStatus as any,
            scheduled_date: newScheduledDate || undefined,
            recommended_action: newAction || 'Pemantauan berkala nilai glukosa darah di UKS',
            communication_notes: newNotes,
            referral_details: newReferral,
          },
          { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
        );
      } else {
        let targetVisitId = newTargetRecordId;
        if (!targetVisitId) {
          const partVisits = visits.filter((vs) => vs.participant_id === newParticipantId);
          if (partVisits.length > 0) {
            targetVisitId = partVisits[0].id;
          } else {
            const newVisitResult = DataService.saveUksVisit(
              {
                participant_id: newParticipantId,
                main_complaint: newNotes || newAction || 'Pemeriksaan & Tindak Lanjut Medis UKS',
                visit_reason: 'pemeriksaan_rutin',
                visit_status: 'selesai',
                outcome: 'pemantauan_lanjutan',
              },
              undefined,
              { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
            );
            targetVisitId = newVisitResult.visit.id;
          }
        }

        DataService.saveUksFollowUp(
          {
            visit_id: targetVisitId,
            responsible_staff_id: currentUser.id,
            responsible_staff_name: currentUser.full_name,
            follow_up_status: newStatus as any,
            scheduled_date: newScheduledDate || undefined,
            contact_person: newContactPerson,
            handover_notes: newNotes || newAction,
            referral_destination: newReferral,
          },
          { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
        );
      }

      setIsCreateModalOpen(false);
      setReloadKey((k) => k + 1);
      setSuccessMessage('Catatan tindak lanjut baru berhasil ditambahkan dan tersimpan ke Supabase.');
      setTimeout(() => setSuccessMessage(null), 3500);

      // Reset form
      setNewParticipantId('');
      setNewTargetRecordId('');
      setNewAction('');
      setNewNotes('');
      setNewReferral('');
      setNewContactPerson('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal membuat tindak lanjut baru.');
    }
  };

  // Handle Delete Follow-Up from Supabase
  const handleConfirmDelete = () => {
    if (!itemToDelete || !currentUser) return;

    if (itemToDelete.source === 'glucose') {
      DataService.deleteGlucoseFollowUp(itemToDelete.id, {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      });
    } else {
      DataService.deleteUksFollowUp(itemToDelete.id, {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      });
    }

    setItemToDelete(null);
    setReloadKey((k) => k + 1);
    setSuccessMessage('Data tindak lanjut berhasil dihapus dari database Supabase.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dirujuk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Hospital className="w-3 h-3 text-rose-600" />
            Dirujuk ke RS / Faskes
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai / Teratasi
          </span>
        );
      case 'sedang_dipantau':
      case 'belum_dilakukan':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Sedang Dipantau
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <span>Manajemen Tindak Lanjut Pasien & Evaluasi UKS</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStaffOrAdmin
              ? 'Pantau perkembangan pasien yang membutuhkan rujukan, observasi berkelanjutan, atau evaluasi gula darah berkala.'
              : 'Informasi tindak lanjut, instruksi perawatan mandiri, dan jadwal evaluasi kesehatan Anda dengan Petugas UKS.'}
          </p>
        </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Catat Tindak Lanjut Baru
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Tindak Lanjut</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Sedang Dipantau</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{stats.monitoring}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Rujukan Faskes/RS</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{stats.referred}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Selesai & Pulih</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Kasus Pemeriksaan Gula Darah yang Perlu Ditindaklanjuti */}
      {pendingExaminations.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                Hasil Pemeriksaan Terdeteksi Perlu Tindak Lanjut Medis ({pendingExaminations.length} Kasus)
              </span>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Dari Database Supabase
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingExaminations.map((pExam) => {
              const part = profiles.find((p) => p.id === pExam.participant_id);
              const unitObj = units.find((u) => u.id === part?.unit_id);
              return (
                <div
                  key={pExam.id}
                  className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">
                        {part?.full_name || 'Pasien UKS'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-slate-100 text-slate-700">
                        {unitObj?.unit_code || 'UKS'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                      <span>{pExam.examination_number}</span>
                      <span>•</span>
                      <span className="font-bold text-rose-700">
                        {pExam.result_value} {pExam.result_unit}
                      </span>
                      <span>•</span>
                      <span className="capitalize text-slate-600">
                        {pExam.examination_type === 'puasa'
                          ? 'GDP (Puasa)'
                          : pExam.examination_type === 'sewaktu'
                          ? 'GDS (Sewaktu)'
                          : 'GD2PP (Setelah Makan)'}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-800">
                      Tanggal Periksa: {new Date(pExam.examination_datetime).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  {isStaffOrAdmin && (
                    <button
                      onClick={() => handleActionFromExam(pExam)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Jadwalkan Tindak Lanjut</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama pasien, NIS/NIY, atau keluhan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">Semua Kategori (Glukosa & UKS)</option>
              <option value="glucose">Skrining Gula Darah</option>
              <option value="visit">Kunjungan UKS</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">Semua Status Penanganan</option>
              <option value="sedang_dipantau">Sedang Dipantau</option>
              <option value="dirujuk">Dirujuk ke RS / Faskes</option>
              <option value="selesai">Selesai / Teratasi</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">Semua Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Daftar Kasus & Rencana Tindak Lanjut Medis ({filteredList.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Diperbarui secara real-time
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">Tidak ada data tindak lanjut ditemukan</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                ? 'Coba sesuaikan kata kunci atau filter pencarian Anda di atas.'
                : 'Belum ada kasus medis atau pemeriksaan yang memerlukan tindak lanjut khusus saat ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Pasien / Peserta</th>
                  <th className="py-3 px-4">Kategori / Unit</th>
                  <th className="py-3 px-4">Sumber Kasus</th>
                  <th className="py-3 px-4">Rencana Tindakan / Rujukan</th>
                  <th className="py-3 px-4 text-center">Jadwal Evaluasi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => {
                  const part = item.participant;
                  const unitObj = units.find((u) => u.id === part?.unit_id);
                  const isGlucose = item.source === 'glucose';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {part?.full_name || 'Pasien UKS'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {part?.employee_or_student_id || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {unitObj?.unit_name || 'Lazuardi'}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {part?.category === 'siswa' ? 'Siswa' : 'Guru / Staf'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isGlucose ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold">
                            <Activity className="w-3 h-3 text-sky-600" />
                            Skrining Gula Darah
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-semibold">
                            <HeartPulse className="w-3 h-3 text-purple-600" />
                            Kunjungan UKS
                          </div>
                        )}
                        {item.examination && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Hasil: {item.examination.result_value} {item.examination.result_unit} ({item.examination.classification.toUpperCase()})
                          </div>
                        )}
                        {item.visit && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                            Keluhan: {item.visit.main_complaint}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-2 max-w-xs leading-relaxed">
                          {item.recommended_action || item.handover_notes || '-'}
                        </div>
                        {item.referral_details && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                            <Hospital className="w-3 h-3" />
                            Tujuan: {item.referral_details}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.scheduled_date ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            {new Date(item.scheduled_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(item.follow_up_status)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedItemForDetail(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isStaffOrAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Ubah Status & Catatan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Ubah Status & Catatan Tindak Lanjut */}
      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Pembaruan Status Tindak Lanjut</h3>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Pasien: {selectedItemForEdit.participant?.full_name || 'Pasien UKS'}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForEdit(null)}
                className="p-1 text-blue-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Penanganan Saat Ini</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 bg-white"
                >
                  <option value="sedang_dipantau">Sedang Dipantau (Observasi / Pemantauan Rutin)</option>
                  <option value="dirujuk">Dirujuk ke Fasilitas Kesehatan / RS</option>
                  <option value="selesai">Selesai & Kondisi Teratasi</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rekomendasi Tindakan Medis</label>
                <textarea
                  rows={2}
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  placeholder="Misal: Kurangi asupan gula harian, anjurkan cek HbA1c, istirahat cukup..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Evaluasi Ulang</label>
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                {editStatus === 'selesai' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai Penanganan</label>
                    <input
                      type="date"
                      value={editCompletedAt ? editCompletedAt.split('T')[0] : new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditCompletedAt(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    />
                  </div>
                )}
              </div>

              {editStatus === 'dirujuk' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fasilitas Rujukan / Rumah Sakit Tujuan</label>
                  <input
                    type="text"
                    value={editReferral}
                    onChange={(e) => setEditReferral(e.target.value)}
                    placeholder="Misal: RS Puri Cinere, Puskesmas Cinere, dsb."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Komunikasi & Evaluasi Pasien</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan komunikasi dengan orang tua/pasien atau perkembangan gejala..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Tindak Lanjut Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Pencatatan Tindak Lanjut Pasien Baru</h3>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Tambahkan rencana observasi, evaluasi glukosa, atau rujukan
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-blue-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFollowUp} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Kasus</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                  >
                    <option value="glucose">Skrining Gula Darah</option>
                    <option value="visit">Kunjungan UKS</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Awal</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-800"
                  >
                    <option value="sedang_dipantau">Sedang Dipantau</option>
                    <option value="dirujuk">Dirujuk ke RS / Faskes</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Pasien / Peserta *</label>
                <select
                  required
                  value={newParticipantId}
                  onChange={(e) => {
                    setNewParticipantId(e.target.value);
                    setNewTargetRecordId('');
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                >
                  <option value="">-- Pilih Siswa atau Karyawan --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.employee_or_student_id}) - {p.category.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Record Selector */}
              {newParticipantId && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {newSource === 'glucose'
                      ? 'Hubungkan ke Riwayat Pemeriksaan Gula Darah'
                      : 'Hubungkan ke Catatan Kunjungan UKS'}
                  </label>
                  {newSource === 'glucose' ? (
                    <select
                      value={newTargetRecordId}
                      onChange={(e) => setNewTargetRecordId(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-mono text-slate-800"
                    >
                      <option value="">
                        {exams.filter((e) => e.participant_id === newParticipantId).length > 0
                          ? '-- Pilih Riwayat Pemeriksaan Terkait (Opsional) --'
                          : '-- Tidak ada riwayat, sistem otomatis membuatkan dasar rujukan --'}
                      </option>
                      {exams
                        .filter((e) => e.participant_id === newParticipantId)
                        .map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.examination_number} ({new Date(ex.examination_datetime).toLocaleDateString('id-ID')} • {ex.result_value} {ex.result_unit} • {ex.classification})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <select
                      value={newTargetRecordId}
                      onChange={(e) => setNewTargetRecordId(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-mono text-slate-800"
                    >
                      <option value="">
                        {visits.filter((v) => v.participant_id === newParticipantId).length > 0
                          ? '-- Pilih Catatan Kunjungan Terkait (Opsional) --'
                          : '-- Tidak ada kunjungan, sistem otomatis membuatkan dasar penanganan --'}
                      </option>
                      {visits
                        .filter((v) => v.participant_id === newParticipantId)
                        .map((vs) => (
                          <option key={vs.id} value={vs.id}>
                            {vs.visit_number} ({new Date(vs.visit_datetime).toLocaleDateString('id-ID')} • Keluhan: {vs.main_complaint})
                          </option>
                        ))}
                    </select>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Data tindak lanjut tersambung dengan foreign key relasi database Supabase ({newSource === 'glucose' ? 'glucose_follow_ups' : 'uks_follow_ups'}).
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rekomendasi Tindakan Medis *</label>
                <textarea
                  required
                  rows={2}
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Misal: Cek ulang gula darah 1 minggu, batasi makanan manis, konsul dokter anak..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jadwal Evaluasi Ulang</label>
                  <input
                    type="date"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fasilitas Rujukan (Opsional)</label>
                  <input
                    type="text"
                    value={newReferral}
                    onChange={(e) => setNewReferral(e.target.value)}
                    placeholder="Misal: RS Puri Cinere"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kontak Orang Tua / Keluarga yang Dihubungi</label>
                <input
                  type="text"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                  placeholder="Misal: Ibu Nani (0812-xxxx-xxxx)"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan perkembangan medis, keluhan yang masih ada..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Tindak Lanjut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Tindak Lanjut Lengkap */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Lembar Rincian Tindak Lanjut Pasien</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ID Catatan: {selectedItemForDetail.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Identitas Pasien</span>
                  {getStatusBadge(selectedItemForDetail.follow_up_status)}
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {selectedItemForDetail.participant?.full_name || 'Pasien UKS'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>NIS/NIY: <span className="font-mono font-bold">{selectedItemForDetail.participant?.employee_or_student_id || '-'}</span></div>
                  <div>Kategori: <span className="font-semibold">{selectedItemForDetail.participant?.category === 'siswa' ? 'Siswa Aktif' : 'Guru / Karyawan'}</span></div>
                  <div>Kontak: <span className="font-mono">{selectedItemForDetail.participant?.contact_information || '-'}</span></div>
                  <div>Petugas: <span className="font-semibold">{selectedItemForDetail.responsible_staff_name}</span></div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Rekomendasi Tindakan Medis</div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 leading-relaxed font-medium">
                  {selectedItemForDetail.recommended_action || selectedItemForDetail.handover_notes || '-'}
                </div>
              </div>

              {selectedItemForDetail.referral_details && (
                <div>
                  <div className="text-[11px] font-bold text-rose-700 uppercase mb-1 flex items-center gap-1">
                    <Hospital className="w-3.5 h-3.5" />
                    Fasilitas Rujukan Rumah Sakit / Faskes
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-semibold">
                    {selectedItemForDetail.referral_details}
                  </div>
                </div>
              )}

              {selectedItemForDetail.communication_notes && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">Catatan Komunikasi & Orang Tua</div>
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-800 leading-relaxed">
                    {selectedItemForDetail.communication_notes}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">Jadwal Evaluasi Ulang:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedItemForDetail.scheduled_date
                      ? new Date(selectedItemForDetail.scheduled_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Tidak dijadwalkan'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">Tanggal Pencatatan:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {new Date(selectedItemForDetail.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForDetail(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Hapus Data Tindak Lanjut?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan menghapus catatan tindak lanjut pasien{' '}
                <span className="font-bold text-slate-800">{itemToDelete.participant?.full_name}</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
