/**
 * Supabase Synchronization & Real-Time Data Service for LUKS
 * Bridges local in-memory/localStorage with remote Supabase database.
 * Provides offline-first reactivity, automatic initial data seeding,
 * real-time background sync, and bi-directional updates.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localDb, INITIAL_UNITS, INITIAL_CLASSES, INITIAL_PROFILES, INITIAL_HEALTH_PARAMETERS, INITIAL_SYSTEM_SETTINGS, INITIAL_GLUCOSE_EXAMINATIONS, INITIAL_GLUCOSE_FOLLOWUPS, INITIAL_UKS_VISITS, INITIAL_UKS_ASSESSMENTS, INITIAL_UKS_FOLLOWUPS } from './storage';
import {
  UserProfile,
  SchoolUnit,
  SchoolClass,
  HealthClassificationParameter,
  GlucoseExamination,
  GlucoseFollowUp,
  UksVisit,
  UksAssessment,
  UksFollowUp,
  SystemSetting,
  AuditLog,
  AppNotification,
} from '../types/database';

// Helper to guarantee valid RFC 4122 v4 UUID for PostgreSQL
export function ensureUuid(input?: string): string {
  if (!input) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return '00000000-0000-4000-a000-000000000000';
  }
  // If already standard UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    return input.toLowerCase();
  }

  // Pre-mapped common system IDs for perfect consistency
  const standardMap: Record<string, string> = {
    'unit-tk': '11111111-1111-1111-1111-111111111111',
    'unit-sd': '22222222-2222-2222-2222-222222222222',
    'unit-smp': '33333333-3333-3333-3333-333333333333',
    'unit-sma': '44444444-4444-4444-4444-444444444444',
    'user-admin-1': '00000000-0000-0000-0000-000000000001',
    'user-nakes-1': '00000000-0000-0000-0000-000000000002',
    'user-uks-1': '00000000-0000-0000-0000-000000000002',
    'user-pimpinan-1': '00000000-0000-0000-0000-000000000003',
    'user-karyawan-1': '00000000-0000-0000-0000-000000000004',
    'user-guru-1': '00000000-0000-0000-0000-000000000004',
    'user-karyawan-2': '00000000-0000-0000-0000-000000000042',
    'user-siswa-1': '00000000-0000-0000-0000-000000000005',
    'user-siswa-2': '00000000-0000-0000-0000-000000000006',
    'user-siswa-3': '00000000-0000-0000-0000-000000000007',
    'cls-tk-a': 'a1111111-1111-1111-1111-111111111111',
    'cls-tk-b': 'a1111111-1111-1111-1111-222222222222',
    'cls-sd-1': 'a2222222-2222-2222-2222-111111111111',
    'cls-sd-2': 'a2222222-2222-2222-2222-222222222222',
    'cls-sd-3': 'a2222222-2222-2222-2222-333333333333',
    'cls-sd-4': 'a2222222-2222-2222-2222-444444444444',
    'cls-sd-5': 'a2222222-2222-2222-2222-555555555555',
    'cls-sd-6': 'a2222222-2222-2222-2222-666666666666',
    'cls-smp-7': 'a3333333-3333-3333-3333-111111111111',
    'cls-smp-8': 'a3333333-3333-3333-3333-222222222222',
    'cls-smp-9': 'a3333333-3333-3333-3333-333333333333',
    'cls-sma-10': 'a4444444-4444-4444-4444-111111111111',
    'cls-sma-11': 'a4444444-4444-4444-4444-222222222222',
    'cls-sma-12': 'a4444444-4444-4444-4444-333333333333',
  };

  if (standardMap[input]) return standardMap[input];

  // Deterministic 128-bit hash to UUID v4
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).repeat(2);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  errorMessage?: string;
  totalRecordsSynced?: number;
}

class SupabaseSyncServiceClass {
  private syncStatus: SyncStatus = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    isSyncing: false,
    lastSyncedAt: null,
  };

  private listeners: Array<(status: SyncStatus) => void> = [];
  private initialised = false;

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getStatus()));
  }

  /**
   * Initialize sync service: verify connection, seed remote if empty, and pull latest data.
   */
  async init(): Promise<boolean> {
    if (this.initialised) return this.syncStatus.isConnected;
    this.initialised = true;

    if (!isSupabaseConfigured || !supabase) {
      this.syncStatus.isConfigured = false;
      this.syncStatus.isConnected = false;
      this.syncStatus.errorMessage = 'Supabase credentials not configured';
      this.notify();
      return false;
    }

    try {
      this.syncStatus.isSyncing = true;
      this.notify();

      // Test connection
      const { data: testUnits, error: testErr } = await supabase.from('units').select('id').limit(5);
      if (testErr) {
        throw new Error(testErr.message);
      }

      this.syncStatus.isConnected = true;
      this.syncStatus.errorMessage = undefined;

      // Check if remote database needs seeding
      const { data: profileCheck } = await supabase.from('profiles').select('id').limit(1);
      if (!profileCheck || profileCheck.length === 0) {
        await this.seedRemoteDatabase();
      } else {
        // Ensure system settings exist in Supabase even if profiles were seeded
        const { data: settingsCheck } = await supabase.from('system_settings').select('id').limit(1);
        if (!settingsCheck || settingsCheck.length === 0) {
          const settingsPayload = INITIAL_SYSTEM_SETTINGS.map((s) => ({
            id: ensureUuid(s.id),
            setting_key: s.setting_key,
            setting_value: s.setting_value,
            setting_description: s.setting_description || null,
            updated_by: s.updated_by || null,
            updated_at: s.updated_at || new Date().toISOString(),
          }));
          await supabase.from('system_settings').upsert(settingsPayload, { onConflict: 'setting_key' });
        }
      }

      // Pull latest from Supabase into local memory
      await this.pullAllFromSupabase();

      this.syncStatus.isSyncing = false;
      this.syncStatus.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Supabase sync init error:', err);
      this.syncStatus.isSyncing = false;
      this.syncStatus.isConnected = false;
      this.syncStatus.errorMessage = err?.message || 'Gagal tersambung ke Supabase';
      this.notify();
      return false;
    }
  }

  /**
   * Seed all initial default data into Supabase if empty.
   */
  async seedRemoteDatabase(): Promise<void> {
    if (!supabase) return;

    // 1. Units
    const unitsPayload = INITIAL_UNITS.map((u) => ({
      id: ensureUuid(u.id),
      unit_name: u.unit_name,
      unit_code: u.unit_code,
      head_of_unit: u.head_of_unit || null,
      is_active: u.is_active ?? true,
    }));
    await supabase.from('units').upsert(unitsPayload, { onConflict: 'id' });

    // 2. Classes
    const classesPayload = INITIAL_CLASSES.map((c) => ({
      id: ensureUuid(c.id),
      class_name: c.class_name,
      unit_id: ensureUuid(c.unit_id),
      is_active: c.is_active ?? true,
    }));
    await supabase.from('classes').upsert(classesPayload, { onConflict: 'id' });

    // 3. Profiles
    const profilesPayload = INITIAL_PROFILES.map((p) => ({
      id: ensureUuid(p.id),
      email: p.email,
      employee_or_student_id: p.employee_or_student_id,
      full_name: p.full_name,
      role: p.role,
      category: p.category,
      unit_id: ensureUuid(p.unit_id),
      class_id: p.class_id ? ensureUuid(p.class_id) : null,
      work_unit: p.work_unit || null,
      gender: p.gender,
      date_of_birth: p.date_of_birth || null,
      contact_information: p.contact_information || null,
      emergency_contact: p.emergency_contact || null,
      emergency_phone: p.emergency_phone || null,
      is_active: p.is_active ?? true,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
    }));
    await supabase.from('profiles').upsert(profilesPayload, { onConflict: 'id' });

    // 4. Health Parameters
    const hpPayload = INITIAL_HEALTH_PARAMETERS.map((hp) => ({
      id: ensureUuid(hp.id),
      examination_type: hp.examination_type,
      result_unit: hp.result_unit,
      parameter_configuration: hp.parameter_configuration,
      effective_from: hp.effective_from,
      approved_by: hp.approved_by,
      approved_by_title: hp.approved_by_title,
      approved_at: hp.approved_at,
      version: hp.version,
      is_active: hp.is_active ?? true,
    }));
    await supabase.from('health_parameters').upsert(hpPayload, { onConflict: 'id' });

    // 5. System Settings
    const settingsPayload = INITIAL_SYSTEM_SETTINGS.map((s) => ({
      id: ensureUuid(s.id),
      setting_key: s.setting_key,
      setting_value: s.setting_value,
      setting_description: s.setting_description || null,
      updated_by: s.updated_by || null,
      updated_at: s.updated_at || new Date().toISOString(),
    }));
    await supabase.from('system_settings').upsert(settingsPayload, { onConflict: 'id' });

    // 6. Glucose Exams
    // 6. Glucose Examinations (Hanya jika ada initial data)
    if (INITIAL_GLUCOSE_EXAMINATIONS.length > 0) {
      const examsPayload = INITIAL_GLUCOSE_EXAMINATIONS.map((e) => ({
        id: ensureUuid(e.id),
        examination_number: e.examination_number,
        participant_id: ensureUuid(e.participant_id),
        examination_datetime: e.examination_datetime,
        examination_type: e.examination_type,
        last_meal_datetime: e.last_meal_datetime || null,
        fasting_duration_hours: e.fasting_duration_hours || null,
        result_value: e.result_value,
        result_unit: e.result_unit,
        symptoms: e.symptoms || null,
        participant_condition: e.participant_condition || null,
        examiner_id: ensureUuid(e.examiner_id),
        examiner_name: e.examiner_name,
        device_name: e.device_name || null,
        attachment_path: e.attachment_path || null,
        notes: e.notes || null,
        classification: e.classification,
        classification_parameter_version: e.classification_parameter_version || null,
        consent_status: e.consent_status,
        record_status: e.record_status,
        created_at: e.created_at,
        updated_at: e.updated_at,
      }));
      await supabase.from('glucose_examinations').upsert(examsPayload, { onConflict: 'id' });
    }

    // 7. Glucose Follow Ups
    if (INITIAL_GLUCOSE_FOLLOWUPS.length > 0) {
      const gfuPayload = INITIAL_GLUCOSE_FOLLOWUPS.map((f) => ({
        id: ensureUuid(f.id),
        examination_id: ensureUuid(f.examination_id),
        responsible_staff_id: ensureUuid(f.responsible_staff_id),
        responsible_staff_name: f.responsible_staff_name,
        follow_up_status: f.follow_up_status,
        recommended_action: f.recommended_action,
        scheduled_date: f.scheduled_date || null,
        completed_at: f.completed_at || null,
        communication_notes: f.communication_notes || null,
        referral_details: f.referral_details || null,
        created_at: f.created_at,
        updated_at: f.updated_at,
      }));
      await supabase.from('glucose_follow_ups').upsert(gfuPayload, { onConflict: 'id' });
    }

    // 8. UKS Visits
    const visitsPayload = INITIAL_UKS_VISITS.map((v) => ({
      id: ensureUuid(v.id),
      visit_number: v.visit_number,
      participant_id: ensureUuid(v.participant_id),
      visit_datetime: v.visit_datetime,
      previous_location: v.previous_location || null,
      main_complaint: v.main_complaint,
      visit_reason: v.visit_reason,
      incident_chronology: v.incident_chronology || null,
      accompanying_person: v.accompanying_person || null,
      handling_staff_id: ensureUuid(v.handling_staff_id),
      handling_staff_name: v.handling_staff_name,
      initial_condition: v.initial_condition || null,
      visit_status: v.visit_status,
      outcome: v.outcome || null,
      rest_start_time: v.rest_start_time || null,
      rest_end_time: v.rest_end_time || null,
      checkout_datetime: v.checkout_datetime || null,
      pickup_person: v.pickup_person || null,
      pickup_relationship: v.pickup_relationship || null,
      pickup_contact: v.pickup_contact || null,
      parent_contacted_at: v.parent_contacted_at || null,
      communicating_staff_name: v.communicating_staff_name || null,
      referral_destination: v.referral_destination || null,
      handover_notes: v.handover_notes || null,
      created_at: v.created_at,
      updated_at: v.updated_at,
    }));
    await supabase.from('uks_visits').upsert(visitsPayload, { onConflict: 'id' });

    // 9. UKS Assessments
    if (INITIAL_UKS_ASSESSMENTS.length > 0) {
      const assPayload = INITIAL_UKS_ASSESSMENTS.map((a) => ({
        id: ensureUuid(a.id),
        visit_id: ensureUuid(a.visit_id),
        assessment_datetime: a.assessment_datetime,
        temperature: a.temperature || null,
        systolic_pressure: a.systolic_pressure || null,
        diastolic_pressure: a.diastolic_pressure || null,
        pulse_rate: a.pulse_rate || null,
        respiratory_rate: a.respiratory_rate || null,
        oxygen_saturation: a.oxygen_saturation || null,
        other_measurements: a.other_measurements || null,
        treatment: a.treatment || null,
        medication_or_equipment: a.medication_or_equipment || null,
        medication_dosage: a.medication_dosage || null,
        notes: a.notes || null,
        attachment_path: a.attachment_path || null,
        examiner_id: ensureUuid(a.examiner_id),
        examiner_name: a.examiner_name,
        created_at: a.created_at,
      }));
      await supabase.from('uks_assessments').upsert(assPayload, { onConflict: 'id' });
    }

    // 10. UKS Follow Ups
    if (INITIAL_UKS_FOLLOWUPS.length > 0) {
      const ufuPayload = INITIAL_UKS_FOLLOWUPS.map((u) => ({
        id: ensureUuid(u.id),
        visit_id: ensureUuid(u.visit_id),
        responsible_staff_id: ensureUuid(u.responsible_staff_id),
        responsible_staff_name: u.responsible_staff_name,
        follow_up_status: u.follow_up_status,
        scheduled_date: u.scheduled_date || null,
        parent_or_contact_called_at: u.parent_or_contact_called_at || null,
        contact_person: u.contact_person || null,
        pickup_person: u.pickup_person || null,
        pickup_contact: u.pickup_contact || null,
        approval_person: u.approval_person || null,
        referral_destination: u.referral_destination || null,
        handover_notes: u.handover_notes || null,
        completed_at: u.completed_at || null,
        created_at: u.created_at,
        updated_at: u.updated_at,
      }));
      await supabase.from('uks_follow_ups').upsert(ufuPayload, { onConflict: 'id' });
    }
  }

  /**
   * Pull all tables from Supabase into local memory.
   */
  async pullAllFromSupabase(): Promise<void> {
    if (!supabase) return;

    try {
      this.syncStatus.isSyncing = true;
      this.notify();

      const [
        { data: units },
        { data: classes },
        { data: profiles },
        { data: healthParams },
        { data: exams },
        { data: examFollowUps },
        { data: visits },
        { data: assessments },
        { data: visitFollowUps },
        { data: settings },
        { data: auditLogs },
        { data: notifs },
      ] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('health_parameters').select('*'),
        supabase.from('glucose_examinations').select('*'),
        supabase.from('glucose_follow_ups').select('*'),
        supabase.from('uks_visits').select('*'),
        supabase.from('uks_assessments').select('*'),
        supabase.from('uks_follow_ups').select('*'),
        supabase.from('system_settings').select('*'),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('app_notifications').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      let count = 0;

      if (units && units.length > 0) {
        localDb.setUnits(units as SchoolUnit[]);
        count += units.length;
      }
      if (classes && classes.length > 0) {
        localDb.setClasses(classes as SchoolClass[]);
        count += classes.length;
      }
      if (profiles && profiles.length > 0) {
        localDb.setProfiles(profiles as UserProfile[]);
        count += profiles.length;
      }
      if (healthParams && healthParams.length > 0) {
        localDb.setHealthParams(healthParams as HealthClassificationParameter[]);
        count += healthParams.length;
      }
      if (exams) {
        localDb.setGlucoseExams(exams as GlucoseExamination[]);
        count += exams.length;
      }
      if (examFollowUps) {
        localDb.setGlucoseFollowUps(examFollowUps as GlucoseFollowUp[]);
        count += examFollowUps.length;
      }
      if (visits && visits.length > 0) {
        localDb.setUksVisits(visits as UksVisit[]);
        count += visits.length;
      }
      if (assessments && assessments.length > 0) {
        localDb.setUksAssessments(assessments as UksAssessment[]);
        count += assessments.length;
      }
      if (visitFollowUps) {
        localDb.setUksFollowUps(visitFollowUps as UksFollowUp[]);
        count += visitFollowUps.length;
      }
      if (settings && settings.length > 0) {
        localDb.setSystemSettings(settings as SystemSetting[]);
        count += settings.length;
      }
      if (auditLogs && auditLogs.length > 0) {
        localDb.setAuditLogs(auditLogs as AuditLog[]);
        count += auditLogs.length;
      }
      if (notifs && notifs.length > 0) {
        localDb.setNotifications(notifs as AppNotification[]);
        count += notifs.length;
      }

      this.syncStatus.totalRecordsSynced = count;
      this.syncStatus.isConnected = true;
      this.syncStatus.lastSyncedAt = new Date().toISOString();
      this.syncStatus.errorMessage = undefined;

      // Dispatch event to re-render React components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('luks-supabase-synced'));
      }
    } catch (err: any) {
      console.warn('Failed to pull from Supabase:', err);
      this.syncStatus.errorMessage = err?.message || 'Gagal sinkronisasi dari Supabase';
    } finally {
      this.syncStatus.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Asynchronously upsert a single record to Supabase.
   */
  async upsertRecord(tableName: string, record: any): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase belum terkonfigurasi' };
    }

    try {
      const sanitized = { ...record };
      delete sanitized.participant;
      delete sanitized.examination;
      delete sanitized.visit;
      delete sanitized.source;
      if (sanitized.id) sanitized.id = ensureUuid(sanitized.id);

      // Foreign key sanitize
      if (sanitized.unit_id) sanitized.unit_id = ensureUuid(sanitized.unit_id);
      if (sanitized.class_id) sanitized.class_id = ensureUuid(sanitized.class_id);
      if (sanitized.participant_id) sanitized.participant_id = ensureUuid(sanitized.participant_id);
      if (sanitized.examiner_id) sanitized.examiner_id = ensureUuid(sanitized.examiner_id);
      if (sanitized.handling_staff_id) sanitized.handling_staff_id = ensureUuid(sanitized.handling_staff_id);
      if (sanitized.responsible_staff_id) sanitized.responsible_staff_id = ensureUuid(sanitized.responsible_staff_id);
      if (sanitized.examination_id) sanitized.examination_id = ensureUuid(sanitized.examination_id);
      if (sanitized.visit_id) sanitized.visit_id = ensureUuid(sanitized.visit_id);
      if (sanitized.recipient_user_id) sanitized.recipient_user_id = ensureUuid(sanitized.recipient_user_id);

      const onConflict = tableName === 'system_settings' ? 'setting_key' : 'id';
      let { error } = await supabase.from(tableName).upsert(sanitized, { onConflict });
      if (error && (error.code === 'PGRST204' || error.message?.includes('password')) && sanitized.password !== undefined) {
        const withoutPassword = { ...sanitized };
        delete withoutPassword.password;
        const retryResult = await supabase.from(tableName).upsert(withoutPassword, { onConflict });
        if (!retryResult.error) {
          this.syncStatus.isConnected = true;
          return {
            success: true,
            error: 'Kolom password belum ada di tabel Supabase profiles. Jalankan skrip SQL migrasi di SQL Editor.',
          };
        }
        error = retryResult.error;
      }
      if (error) {
        console.warn(`Supabase upsert to ${tableName} failed:`, error.message);
        return { success: false, error: error.message };
      }
      this.syncStatus.isConnected = true;
      return { success: true };
    } catch (err: any) {
      console.warn(`Supabase upsert error (${tableName}):`, err);
      return { success: false, error: err?.message || 'Gagal menyimpan ke database' };
    }
  }

  /**
   * Asynchronously delete a record in Supabase.
   */
  async deleteRecord(tableName: string, id: string): Promise<void> {
    if (!supabase || !this.syncStatus.isConnected) return;

    try {
      const targetUuid = ensureUuid(id);
      const { error } = await supabase.from(tableName).delete().eq('id', targetUuid);
      if (error) {
        console.warn(`Supabase delete from ${tableName} failed:`, error.message);
      }
    } catch (err) {
      console.warn(`Supabase delete error (${tableName}):`, err);
    }
  }
}

export const SupabaseSyncService = new SupabaseSyncServiceClass();
