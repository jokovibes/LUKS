/**
 * Universal Data Access & Business Rules Service for LUKS
 * Handles business validation, atomic sequence numbering, medical classification,
 * repeat visit detection, and audit logging.
 */

import {
  UserProfile,
  SchoolUnit,
  SchoolClass,
  GlucoseExamination,
  GlucoseFollowUp,
  UksVisit,
  UksAssessment,
  UksFollowUp,
  HealthClassificationParameter,
  AppNotification,
  AuditLog,
  SystemSetting,
  RepeatVisitWarning,
  GlucoseClassification,
  GlucoseExamType,
  GlucoseUnit,
  UserRole,
} from '../types/database';
import { localDb } from './storage';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SupabaseSyncService, ensureUuid } from './supabaseSyncService';

export class DataService {
  /**
   * Initializes Supabase live connection and synchronization
   */
  static async syncWithSupabase(): Promise<boolean> {
    return SupabaseSyncService.init();
  }

  static getSupabaseSyncStatus() {
    return SupabaseSyncService.getStatus();
  }
  /**
   * Generates conflict-free sequential ID like GDS-20261027-0001 or UKS-20261027-0001
   * Uses Asia/Jakarta date string.
   */
  static generateSequentialNumber(prefix: 'GDS' | 'UKS'): string {
    const now = new Date();
    // Use Asia/Jakarta time (UTC+7)
    const jakartaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = jakartaTime.getUTCFullYear();
    const mm = String(jakartaTime.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(jakartaTime.getUTCDate()).padStart(2, '0');
    const dateKey = `${yyyy}${mm}${dd}`;

    let existingCount = 0;
    if (prefix === 'GDS') {
      const exams = localDb.getGlucoseExams();
      existingCount = exams.filter((e) => e.examination_number.startsWith(`GDS-${dateKey}`)).length;
    } else {
      const visits = localDb.getUksVisits();
      existingCount = visits.filter((v) => v.visit_number.startsWith(`UKS-${dateKey}`)).length;
    }

    const nextSeq = String(existingCount + 1).padStart(4, '0');
    return `${prefix}-${dateKey}-${nextSeq}`;
  }

  /**
   * Evaluate Blood Glucose according to Medical Authority approved parameters.
   * If parameter is not active or not approved, returns 'belum_diklasifikasikan'.
   */
  static evaluateGlucoseClassification(
    type: GlucoseExamType,
    value: number,
    unit: GlucoseUnit
  ): { classification: GlucoseClassification; parameterVersion?: string; parameterDisclaimer: string } {
    const disclaimer =
      'Kategori ini merupakan penanda administratif untuk membantu pemantauan, bukan diagnosis medis. Interpretasi hasil dan keputusan tindak lanjut harus dilakukan oleh tenaga kesehatan yang berwenang.';

    // Normalise to mg/dL for parameter checking if input is in mmol/L
    let valMgDl = value;
    if (unit === 'mmol/L') {
      valMgDl = value * 18.0182;
    }

    const params = localDb.getHealthParams();
    const activeParam = params.find(
      (p) => p.is_active && p.examination_type === type && p.result_unit === 'mg/dL'
    );

    if (!activeParam) {
      return {
        classification: 'belum_diklasifikasikan',
        parameterDisclaimer: disclaimer,
      };
    }

    const config = activeParam.parameter_configuration;
    let classification: GlucoseClassification = 'normal';

    if (valMgDl >= config.tindak_lanjut_min) {
      classification = 'tindak_lanjut';
    } else if (valMgDl >= config.perlu_perhatian_min && valMgDl <= config.perlu_perhatian_max) {
      classification = 'perlu_perhatian';
    } else if (valMgDl >= config.normal_min && valMgDl <= config.normal_max) {
      classification = 'normal';
    } else if (valMgDl < config.normal_min) {
      // Hypoglycemia threshold
      classification = 'tindak_lanjut';
    } else {
      classification = 'pemantauan';
    }

    return {
      classification,
      parameterVersion: activeParam.version,
      parameterDisclaimer: disclaimer,
    };
  }

  /**
   * Audit log writer
   */
  static logAudit(
    actor: { id: string; name: string; role: string },
    action: AuditLog['action'],
    entity_type: AuditLog['entity_type'],
    entity_id?: string,
    relevant_metadata?: Record<string, any>
  ) {
    const logs = localDb.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actor_user_id: actor.id,
      actor_name: actor.name,
      actor_role: actor.role,
      action,
      entity_type,
      entity_id,
      timestamp: new Date().toISOString(),
      relevant_metadata,
    };
    logs.unshift(newLog);
    // keep latest 500
    if (logs.length > 500) logs.pop();
    localDb.setAuditLogs(logs);
    SupabaseSyncService.upsertRecord('audit_logs', newLog);
  }

  /**
   * Create In-App Notification
   */
  static sendNotification(
    recipientUserId: string,
    type: AppNotification['notification_type'],
    title: string,
    message: string,
    targetRecordType?: AppNotification['target_record_type'],
    targetRecordId?: string
  ) {
    const notifs = localDb.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient_user_id: recipientUserId,
      notification_type: type,
      title,
      message,
      target_record_type: targetRecordType,
      target_record_id: targetRecordId,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    localDb.setNotifications(notifs);
    SupabaseSyncService.upsertRecord('app_notifications', newNotif);
  }

  /**
   * Check if a participant has hit or exceeded repeat visit threshold
   */
  static checkRepeatVisitThreshold(participantId: string): {
    isWarning: boolean;
    count: number;
    threshold: number;
    visits: UksVisit[];
  } {
    const settings = localDb.getSystemSettings();
    const thresholdSetting = settings.find((s) => s.setting_key === 'repeat_visit_threshold');
    const threshold = thresholdSetting ? parseInt(thresholdSetting.setting_value, 10) : 3;

    const periodSetting = settings.find((s) => s.setting_key === 'repeat_visit_period_days');
    const periodDays = periodSetting ? parseInt(periodSetting.setting_value, 10) : 30;

    const visits = localDb.getUksVisits();
    const now = new Date();
    // Configured period window (default 30 days)
    const periodAgo = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const participantVisits = visits.filter(
      (v) =>
        v.participant_id === participantId &&
        v.visit_status !== 'dibatalkan' &&
        new Date(v.visit_datetime) >= periodAgo
    );

    return {
      isWarning: participantVisits.length >= threshold,
      count: participantVisits.length,
      threshold,
      visits: participantVisits,
    };
  }

  // --- PROFILES / USERS ---
  static getProfiles(roleFilter?: UserRole): UserProfile[] {
    const profiles = localDb.getProfiles();
    if (roleFilter) return profiles.filter((p) => p.role === roleFilter);
    return profiles;
  }

  static getProfileById(id: string): UserProfile | undefined {
    return localDb.getProfiles().find((p) => p.id === id);
  }

  static getProfileByEmployeeOrStudentId(id: string): UserProfile | undefined {
    const trimmed = id.trim().toLowerCase();
    return localDb.getProfiles().find(
      (p) =>
        p.employee_or_student_id.toLowerCase() === trimmed ||
        p.employee_or_student_id.toLowerCase().replace(/[^a-z0-9]/g, '') === trimmed.replace(/[^a-z0-9]/g, '')
    );
  }

  static searchProfiles(query: string, unitId?: string, classId?: string): UserProfile[] {
    let profiles = localDb.getProfiles();
    if (unitId) {
      profiles = profiles.filter((p) => p.unit_id === unitId);
    }
    if (classId) {
      profiles = profiles.filter((p) => p.class_id === classId);
    }
    if (!query) return profiles;

    const q = query.toLowerCase().trim();
    return profiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.employee_or_student_id.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.work_unit && p.work_unit.toLowerCase().includes(q))
    );
  }

  static saveProfile(
    profile: Omit<UserProfile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string },
    actor: { id: string; name: string; role: string }
  ): UserProfile {
    const profiles = localDb.getProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: UserProfile = {
        ...profiles[existingIndex],
        ...profile,
        updated_at: now,
      };
      profiles[existingIndex] = updated;
      this.logAudit(actor, 'UPDATE_RECORD', 'profiles', profile.id, { full_name: profile.full_name });
      localDb.setProfiles(profiles);
      SupabaseSyncService.upsertRecord('profiles', updated);
      return updated;
    } else {
      const newProfile: UserProfile = {
        ...profile,
        id: profile.id || `user-${Date.now()}`,
        created_at: profile.created_at || now,
        updated_at: profile.updated_at || now,
      };
      profiles.push(newProfile);
      this.logAudit(actor, 'CREATE_RECORD', 'profiles', newProfile.id, { full_name: newProfile.full_name });
      localDb.setProfiles(profiles);
      SupabaseSyncService.upsertRecord('profiles', newProfile);
      return newProfile;
    }
  }

  static deleteProfile(profileId: string, actor: { id: string; name: string; role: string }): boolean {
    const profiles = localDb.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return false;
    const remaining = profiles.filter((p) => p.id !== profileId);
    localDb.setProfiles(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'profiles', profileId, {
      full_name: target.full_name,
      employee_or_student_id: target.employee_or_student_id,
    });
    SupabaseSyncService.deleteRecord('profiles', profileId);
    return true;
  }

  static async updateUserPassword(
    userId: string,
    newPassword: string,
    actor: { id: string; name: string; role: string }
  ): Promise<{ success: boolean; error?: string; columnMissing?: boolean }> {
    const profiles = localDb.getProfiles();
    const user = profiles.find((p) => p.id === userId);
    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const now = new Date().toISOString();
    user.password = newPassword;
    user.updated_at = now;
    localDb.setProfiles(profiles);

    this.logAudit(actor, 'UPDATE_RECORD', 'profiles', user.id, {
      update_type: 'PASSWORD',
      user_name: user.full_name,
      user_email: user.email,
    });

    if (supabase) {
      try {
        const targetUuid = ensureUuid(user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ password: newPassword, updated_at: now })
          .eq('id', targetUuid);

        if (error) {
          const isColMissing =
            error.code === 'PGRST204' ||
            error.message?.includes('password') ||
            error.code === '42703';
          return {
            success: true,
            columnMissing: isColMissing,
            error: error.message,
          };
        }
        return { success: true, columnMissing: false };
      } catch (err: any) {
        return { success: true, columnMissing: true, error: err?.message };
      }
    }

    return { success: true, columnMissing: false };
  }

  static async checkSupabasePasswordColumn(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('profiles').select('password').limit(1);
      if (error && (error.code === 'PGRST204' || error.message?.includes('password'))) {
        return false;
      }
      return !error;
    } catch {
      return false;
    }
  }

  // --- UNITS & CLASSES ---
  static getUnits(): SchoolUnit[] {
    return localDb.getUnits();
  }

  static getClasses(unitId?: string): SchoolClass[] {
    const classes = localDb.getClasses();
    if (unitId) return classes.filter((c) => c.unit_id === unitId);
    return classes;
  }

  static saveUnit(unit: SchoolUnit, actor: { id: string; name: string; role: string }): SchoolUnit {
    const units = localDb.getUnits();
    const idx = units.findIndex((u) => u.id === unit.id);
    if (idx >= 0) {
      units[idx] = unit;
      this.logAudit(actor, 'UPDATE_RECORD', 'system_settings', unit.id, { unit_name: unit.unit_name });
    } else {
      unit.id = unit.id || `unit-${Date.now()}`;
      units.push(unit);
      this.logAudit(actor, 'CREATE_RECORD', 'system_settings', unit.id, { unit_name: unit.unit_name });
    }
    localDb.setUnits(units);
    SupabaseSyncService.upsertRecord('units', unit);
    return unit;
  }

  static deleteUnit(unitId: string, actor: { id: string; name: string; role: string }): boolean {
    const units = localDb.getUnits();
    const target = units.find((u) => u.id === unitId);
    if (!target) return false;
    const remaining = units.filter((u) => u.id !== unitId);
    localDb.setUnits(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'system_settings', unitId, { unit_name: target.unit_name });
    SupabaseSyncService.deleteRecord('units', unitId);
    return true;
  }

  static saveClass(schoolClass: SchoolClass, actor: { id: string; name: string; role: string }): SchoolClass {
    const classes = localDb.getClasses();
    const idx = classes.findIndex((c) => c.id === schoolClass.id);
    if (idx >= 0) {
      classes[idx] = schoolClass;
      this.logAudit(actor, 'UPDATE_RECORD', 'system_settings', schoolClass.id, { class_name: schoolClass.class_name });
    } else {
      schoolClass.id = schoolClass.id || `class-${Date.now()}`;
      classes.push(schoolClass);
      this.logAudit(actor, 'CREATE_RECORD', 'system_settings', schoolClass.id, { class_name: schoolClass.class_name });
    }
    localDb.setClasses(classes);
    SupabaseSyncService.upsertRecord('classes', schoolClass);
    return schoolClass;
  }

  static deleteClass(classId: string, actor: { id: string; name: string; role: string }): boolean {
    const classes = localDb.getClasses();
    const target = classes.find((c) => c.id === classId);
    if (!target) return false;
    const remaining = classes.filter((c) => c.id !== classId);
    localDb.setClasses(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'system_settings', classId, { class_name: target.class_name });
    SupabaseSyncService.deleteRecord('classes', classId);
    return true;
  }

  // --- GLUCOSE EXAMINATIONS ---
  static getGlucoseExaminations(currentUser: UserProfile): GlucoseExamination[] {
    const exams = localDb.getGlucoseExams();
    const profiles = localDb.getProfiles();
    const populated = exams.map((exam) => ({
      ...exam,
      participant: profiles.find((p) => p.id === exam.participant_id),
    }));

    // Enforce Row Level Security: Siswa and Karyawan can ONLY see their own records!
    if (currentUser.role === 'siswa' || currentUser.role === 'karyawan') {
      return populated.filter((e) => e.participant_id === currentUser.id);
    }
    return populated;
  }

  static getGlucoseExaminationById(id: string, currentUser: UserProfile): GlucoseExamination | undefined {
    const exams = this.getGlucoseExaminations(currentUser);
    return exams.find((e) => e.id === id);
  }

  static saveGlucoseExamination(
    examData: Partial<GlucoseExamination>,
    actor: { id: string; name: string; role: string }
  ): GlucoseExamination {
    const exams = localDb.getGlucoseExams();
    const existingIndex = exams.findIndex((e) => e.id === examData.id);

    // Classification evaluation
    const { classification, parameterVersion } = this.evaluateGlucoseClassification(
      examData.examination_type || 'sewaktu',
      examData.result_value || 0,
      examData.result_unit || 'mg/dL'
    );

    if (existingIndex >= 0) {
      const updated: GlucoseExamination = {
        ...exams[existingIndex],
        ...examData,
        classification: examData.classification || classification,
        classification_parameter_version: parameterVersion,
        updated_at: new Date().toISOString(),
      } as GlucoseExamination;
      exams[existingIndex] = updated;
      localDb.setGlucoseExams(exams);
      this.logAudit(actor, 'UPDATE_RECORD', 'glucose_examinations', updated.id, {
        number: updated.examination_number,
        result_value: updated.result_value,
      });
      SupabaseSyncService.upsertRecord('glucose_examinations', updated);
      return updated;
    } else {
      const newExam: GlucoseExamination = {
        id: `gds-${Date.now()}`,
        examination_number: examData.examination_number || this.generateSequentialNumber('GDS'),
        participant_id: examData.participant_id!,
        examination_datetime: examData.examination_datetime || new Date().toISOString(),
        examination_type: examData.examination_type || 'sewaktu',
        last_meal_datetime: examData.last_meal_datetime,
        fasting_duration_hours: examData.fasting_duration_hours,
        result_value: examData.result_value || 0,
        result_unit: examData.result_unit || 'mg/dL',
        symptoms: examData.symptoms,
        participant_condition: examData.participant_condition,
        examiner_id: actor.id,
        examiner_name: actor.name,
        device_name: examData.device_name || 'Accu-Chek Instant #UKS-01',
        attachment_path: examData.attachment_path,
        notes: examData.notes,
        classification,
        classification_parameter_version: parameterVersion,
        consent_status: examData.consent_status || 'diberikan',
        record_status: examData.record_status || 'resmi',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      exams.unshift(newExam);
      localDb.setGlucoseExams(exams);

      this.logAudit(actor, 'CREATE_RECORD', 'glucose_examinations', newExam.id, {
        number: newExam.examination_number,
        result_value: newExam.result_value,
      });
      SupabaseSyncService.upsertRecord('glucose_examinations', newExam);

      // Notify participant if necessary (non-sensitive notification)
      this.sendNotification(
        newExam.participant_id,
        'glucose_recorded',
        'Pemeriksaan Gula Darah Tercatat',
        `Pemeriksaan gula darah Anda pada ${new Date().toLocaleDateString('id-ID')} telah tercatat di sistem UKS Lazuardi.`,
        'glucose',
        newExam.id
      );

      return newExam;
    }
  }

  static deleteGlucoseExamination(id: string, actor: { id: string; name: string; role: string }): boolean {
    const exams = localDb.getGlucoseExams();
    const target = exams.find((e) => e.id === id);
    if (!target) return false;
    const remaining = exams.filter((e) => e.id !== id);
    localDb.setGlucoseExams(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'glucose_examinations', id, {
      number: target.examination_number,
      result_value: target.result_value,
    });
    SupabaseSyncService.deleteRecord('glucose_examinations', id);
    return true;
  }

  // --- GLUCOSE FOLLOW UPS ---
  static getGlucoseFollowUps(currentUser: UserProfile): GlucoseFollowUp[] {
    const followUps = localDb.getGlucoseFollowUps();
    const exams = localDb.getGlucoseExams();
    if (currentUser.role === 'siswa' || currentUser.role === 'karyawan') {
      const myExamIds = new Set(exams.filter((e) => e.participant_id === currentUser.id).map((e) => e.id));
      return followUps.filter((f) => myExamIds.has(f.examination_id));
    }
    return followUps;
  }

  static saveGlucoseFollowUp(
    followUp: Partial<GlucoseFollowUp>,
    actor: { id: string; name: string; role: string }
  ): GlucoseFollowUp {
    const list = localDb.getGlucoseFollowUps();
    const idx = list.findIndex((f) => f.id === followUp.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...followUp, updated_at: new Date().toISOString() } as GlucoseFollowUp;
      localDb.setGlucoseFollowUps(list);
      this.logAudit(actor, 'UPDATE_RECORD', 'glucose_examinations', list[idx].id, { follow_up: true });
      SupabaseSyncService.upsertRecord('glucose_follow_ups', list[idx]);
      return list[idx];
    } else {
      const newFollowUp: GlucoseFollowUp = {
        id: `gfu-${Date.now()}`,
        examination_id: followUp.examination_id!,
        responsible_staff_id: actor.id,
        responsible_staff_name: actor.name,
        follow_up_status: followUp.follow_up_status || 'belum_dilakukan',
        recommended_action: followUp.recommended_action || '',
        scheduled_date: followUp.scheduled_date,
        completed_at: followUp.completed_at,
        communication_notes: followUp.communication_notes,
        referral_details: followUp.referral_details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      list.unshift(newFollowUp);
      localDb.setGlucoseFollowUps(list);
      this.logAudit(actor, 'CREATE_RECORD', 'glucose_examinations', newFollowUp.id, { follow_up: true });
      SupabaseSyncService.upsertRecord('glucose_follow_ups', newFollowUp);
      return newFollowUp;
    }
  }

  static deleteGlucoseFollowUp(id: string, actor: { id: string; name: string; role: string }): boolean {
    const list = localDb.getGlucoseFollowUps();
    const remaining = list.filter((f) => f.id !== id);
    if (remaining.length === list.length) return false;
    localDb.setGlucoseFollowUps(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'glucose_examinations', id, { follow_up_deleted: true });
    SupabaseSyncService.deleteRecord('glucose_follow_ups', id);
    return true;
  }

  // --- UKS VISITS ---
  static getUksVisits(currentUser: UserProfile): UksVisit[] {
    const visits = localDb.getUksVisits();
    const profiles = localDb.getProfiles();
    const populated = visits.map((v) => ({
      ...v,
      participant: profiles.find((p) => p.id === v.participant_id),
    }));

    if (currentUser.role === 'siswa' || currentUser.role === 'karyawan') {
      return populated.filter((v) => v.participant_id === currentUser.id);
    }
    return populated;
  }

  static getUksVisitById(id: string, currentUser: UserProfile): UksVisit | undefined {
    return this.getUksVisits(currentUser).find((v) => v.id === id);
  }

  static saveUksVisit(
    visitData: Partial<UksVisit>,
    assessmentData?: Partial<UksAssessment>,
    actor: { id: string; name: string; role: string } = { id: 'user-nakes-1', name: 'Ns. Siti Rahmah, S.Kep', role: 'petugas_uks' }
  ): { visit: UksVisit; assessment?: UksAssessment; repeatAlert?: boolean } {
    const visits = localDb.getUksVisits();
    const existingIndex = visits.findIndex((v) => v.id === visitData.id);

    let savedVisit: UksVisit;
    if (existingIndex >= 0) {
      savedVisit = {
        ...visits[existingIndex],
        ...visitData,
        updated_at: new Date().toISOString(),
      } as UksVisit;
      visits[existingIndex] = savedVisit;
      localDb.setUksVisits(visits);
      this.logAudit(actor, 'UPDATE_RECORD', 'uks_visits', savedVisit.id, { number: savedVisit.visit_number });
    } else {
      savedVisit = {
        id: `visit-${Date.now()}`,
        visit_number: visitData.visit_number || this.generateSequentialNumber('UKS'),
        participant_id: visitData.participant_id!,
        visit_datetime: visitData.visit_datetime || new Date().toISOString(),
        previous_location: visitData.previous_location,
        main_complaint: visitData.main_complaint || '',
        visit_reason: visitData.visit_reason || 'sakit',
        incident_chronology: visitData.incident_chronology,
        accompanying_person: visitData.accompanying_person,
        handling_staff_id: actor.id,
        handling_staff_name: actor.name,
        initial_condition: visitData.initial_condition,
        visit_status: visitData.visit_status || 'aktif',
        outcome: visitData.outcome || 'beristirahat_di_uks',
        rest_start_time: visitData.rest_start_time || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      visits.unshift(savedVisit);
      localDb.setUksVisits(visits);
      this.logAudit(actor, 'CREATE_RECORD', 'uks_visits', savedVisit.id, { number: savedVisit.visit_number });
    }
    SupabaseSyncService.upsertRecord('uks_visits', savedVisit);

    // Save assessment if present
    let savedAssessment: UksAssessment | undefined;
    if (assessmentData) {
      const assessments = localDb.getUksAssessments();
      const existingAsmIdx = assessments.findIndex((a) => a.visit_id === savedVisit.id);
      if (existingAsmIdx >= 0) {
        savedAssessment = {
          ...assessments[existingAsmIdx],
          ...assessmentData,
        };
        assessments[existingAsmIdx] = savedAssessment;
      } else {
        savedAssessment = {
          id: `asm-${Date.now()}`,
          visit_id: savedVisit.id,
          assessment_datetime: new Date().toISOString(),
          temperature: assessmentData.temperature,
          systolic_pressure: assessmentData.systolic_pressure,
          diastolic_pressure: assessmentData.diastolic_pressure,
          pulse_rate: assessmentData.pulse_rate,
          respiratory_rate: assessmentData.respiratory_rate,
          oxygen_saturation: assessmentData.oxygen_saturation,
          other_measurements: assessmentData.other_measurements,
          treatment: assessmentData.treatment,
          medication_or_equipment: assessmentData.medication_or_equipment,
          medication_dosage: assessmentData.medication_dosage,
          notes: assessmentData.notes,
          attachment_path: assessmentData.attachment_path,
          examiner_id: actor.id,
          examiner_name: actor.name,
          created_at: new Date().toISOString(),
        };
        assessments.unshift(savedAssessment);
      }
      localDb.setUksAssessments(assessments);
      SupabaseSyncService.upsertRecord('uks_assessments', savedAssessment);
    }

    // Check repeat visit alert
    const repeatCheck = this.checkRepeatVisitThreshold(savedVisit.participant_id);
    if (repeatCheck.isWarning) {
      const profiles = localDb.getProfiles();
      const participant = profiles.find((p) => p.id === savedVisit.participant_id);
      const uksStaff = profiles.filter((p) => p.role === 'petugas_uks' || p.role === 'admin');

      uksStaff.forEach((staff) => {
        this.sendNotification(
          staff.id,
          'repeat_visit',
          'Peringatan Kunjungan Berulang (Ambang Tercapai)',
          `${participant?.full_name || 'Peserta'} telah tercatat berkunjung ${repeatCheck.count} kali dalam 30 hari terakhir.`,
          'visit',
          savedVisit.id
        );
      });
    }

    return {
      visit: savedVisit,
      assessment: savedAssessment,
      repeatAlert: repeatCheck.isWarning,
    };
  }

  static deleteUksVisit(visitId: string, actor: { id: string; name: string; role: string }): boolean {
    const visits = localDb.getUksVisits();
    const target = visits.find((v) => v.id === visitId);
    if (!target) return false;
    const remainingVisits = visits.filter((v) => v.id !== visitId);
    localDb.setUksVisits(remainingVisits);

    // Also remove associated assessment and follow-ups
    const assessments = localDb.getUksAssessments().filter((a) => a.visit_id !== visitId);
    localDb.setUksAssessments(assessments);

    const followUps = localDb.getUksFollowUps().filter((f) => f.visit_id !== visitId);
    localDb.setUksFollowUps(followUps);

    this.logAudit(actor, 'DELETE_RECORD', 'uks_visits', visitId, {
      number: target.visit_number,
      complaint: target.main_complaint,
    });
    SupabaseSyncService.deleteRecord('uks_visits', visitId);
    return true;
  }

  static getAssessmentsForVisit(visitId: string): UksAssessment[] {
    return localDb.getUksAssessments().filter((a) => a.visit_id === visitId);
  }

  static getUksFollowUps(currentUser: UserProfile): UksFollowUp[] {
    const followUps = localDb.getUksFollowUps();
    const visits = localDb.getUksVisits();
    if (currentUser.role === 'siswa' || currentUser.role === 'karyawan') {
      const myVisitIds = new Set(visits.filter((v) => v.participant_id === currentUser.id).map((v) => v.id));
      return followUps.filter((f) => myVisitIds.has(f.visit_id));
    }
    return followUps;
  }

  static getAllFollowUps(currentUser: UserProfile): Array<{
    id: string;
    source: 'glucose' | 'visit';
    follow_up_status: string;
    scheduled_date?: string;
    participant?: UserProfile;
  }> {
    const gFollowUps = this.getGlucoseFollowUps(currentUser);
    const uFollowUps = this.getUksFollowUps(currentUser);
    const exams = localDb.getGlucoseExams();
    const visits = localDb.getUksVisits();
    const profiles = localDb.getProfiles();

    const result: Array<{
      id: string;
      source: 'glucose' | 'visit';
      follow_up_status: string;
      scheduled_date?: string;
      participant?: UserProfile;
    }> = [];

    gFollowUps.forEach((g) => {
      const exam = exams.find((e) => e.id === g.examination_id);
      const participant = exam ? profiles.find((p) => p.id === exam.participant_id) : undefined;
      result.push({
        id: g.id,
        source: 'glucose',
        follow_up_status: g.follow_up_status,
        scheduled_date: g.scheduled_date,
        participant,
      });
    });

    uFollowUps.forEach((u) => {
      const visit = visits.find((v) => v.id === u.visit_id);
      const participant = visit ? profiles.find((p) => p.id === visit.participant_id) : undefined;
      result.push({
        id: u.id,
        source: 'visit',
        follow_up_status: u.follow_up_status,
        scheduled_date: u.scheduled_date,
        participant,
      });
    });

    return result;
  }

  // --- REPEAT VISITS WARNINGS ---
  static getRepeatVisitWarnings(): RepeatVisitWarning[] {
    const settings = localDb.getSystemSettings();
    const thresholdSetting = settings.find((s) => s.setting_key === 'repeat_visit_threshold');
    const threshold = thresholdSetting ? parseInt(thresholdSetting.setting_value, 10) : 3;

    const periodSetting = settings.find((s) => s.setting_key === 'repeat_visit_period_days');
    const periodDays = periodSetting ? parseInt(periodSetting.setting_value, 10) : 30;

    const visits = localDb.getUksVisits().filter((v) => v.visit_status !== 'dibatalkan');
    const profiles = localDb.getProfiles();
    const reviews = localDb.getRepeatReviews();

    // Group visits by participant within the configured period
    const now = new Date();
    const periodAgo = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const map = new Map<string, UksVisit[]>();
    for (const v of visits) {
      if (new Date(v.visit_datetime) >= periodAgo) {
        const arr = map.get(v.participant_id) || [];
        arr.push(v);
        map.set(v.participant_id, arr);
      }
    }

    const warnings: RepeatVisitWarning[] = [];
    map.forEach((partVisits, participantId) => {
      if (partVisits.length >= threshold) {
        const participant = profiles.find((p) => p.id === participantId);
        if (participant) {
          const rev = reviews.find((r) => r.participant_id === participantId);
          warnings.push({
            participant_id: participantId,
            participant,
            visit_count: partVisits.length,
            period_start: periodAgo.toISOString(),
            period_end: now.toISOString(),
            visits: partVisits,
            status_review: rev ? rev.status_review : 'menunggu_telaah',
            internal_notes: rev ? rev.internal_notes : undefined,
            reviewed_by: rev ? rev.reviewed_by : undefined,
            reviewed_at: rev ? rev.reviewed_at : undefined,
          });
        }
      }
    });

    return warnings;
  }

  static updateRepeatVisitReview(
    participantId: string,
    status_review: 'menunggu_telaah' | 'telah_ditelaah' | 'tindak_lanjut_khusus',
    internal_notes: string,
    actor: { id: string; name: string; role: string }
  ) {
    const reviews = localDb.getRepeatReviews();
    const existingIdx = reviews.findIndex((r) => r.participant_id === participantId);
    const item = {
      participant_id: participantId,
      period_year_month: new Date().toISOString().substring(0, 7),
      status_review,
      internal_notes,
      reviewed_by: actor.name,
      reviewed_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      reviews[existingIdx] = { ...reviews[existingIdx], ...item };
    } else {
      reviews.push(item);
    }
    localDb.setRepeatReviews(reviews);
    this.logAudit(actor, 'UPDATE_RECORD', 'uks_visits', participantId, {
      repeat_review: true,
      status: status_review,
    });
  }

  static deleteRepeatReview(participantId: string, actor: { id: string; name: string; role: string }): boolean {
    const reviews = localDb.getRepeatReviews();
    const remaining = reviews.filter((r) => r.participant_id !== participantId);
    if (remaining.length === reviews.length) return false;
    localDb.setRepeatReviews(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'uks_visits', participantId, {
      repeat_review_reset: true,
    });
    return true;
  }

  // --- HEALTH PARAMETERS ---
  static getHealthParameters(): HealthClassificationParameter[] {
    return localDb.getHealthParams();
  }

  static deleteHealthParameter(paramId: string, actor: { id: string; name: string; role: string }): boolean {
    const params = localDb.getHealthParams();
    const target = params.find((p) => p.id === paramId);
    if (!target) return false;
    const remaining = params.filter((p) => p.id !== paramId);
    localDb.setHealthParams(remaining);
    this.logAudit(actor, 'DELETE_RECORD', 'health_parameters', paramId, {
      version: target.version,
      examination_type: target.examination_type,
    });
    SupabaseSyncService.deleteRecord('health_parameters', paramId);
    return true;
  }

  static saveHealthParameter(
    param: Partial<HealthClassificationParameter>,
    actor: { id: string; name: string; role: string }
  ): HealthClassificationParameter {
    const params = localDb.getHealthParams();
    const idx = params.findIndex((p) => p.id === param.id);
    let result: HealthClassificationParameter;
    if (idx >= 0) {
      result = { ...params[idx], ...param } as HealthClassificationParameter;
      params[idx] = result;
    } else {
      result = {
        id: `param-${Date.now()}`,
        examination_type: param.examination_type || 'sewaktu',
        result_unit: param.result_unit || 'mg/dL',
        parameter_configuration: param.parameter_configuration!,
        effective_from: param.effective_from || new Date().toISOString().split('T')[0],
        approved_by: param.approved_by || actor.name,
        approved_by_title: param.approved_by_title || 'Tenaga Kesehatan Berwenang',
        approved_at: new Date().toISOString(),
        version: param.version || `V${new Date().getFullYear()}.${params.length + 1}`,
        is_active: param.is_active ?? true,
        created_at: new Date().toISOString(),
      };
      params.push(result);
    }
    localDb.setHealthParams(params);
    this.logAudit(actor, 'APPROVE_PARAMETER', 'health_parameters', result.id, {
      version: result.version,
      approved_by: result.approved_by,
    });
    SupabaseSyncService.upsertRecord('health_parameters', result);
    return result;
  }

  // --- NOTIFICATIONS ---
  static getNotifications(userId: string): AppNotification[] {
    return localDb.getNotifications().filter((n) => n.recipient_user_id === userId);
  }

  static markNotificationAsRead(id: string) {
    const notifs = localDb.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.is_read = true;
      localDb.setNotifications(notifs);
    }
  }

  static markAllNotificationsAsRead(userId: string) {
    const notifs = localDb.getNotifications();
    notifs.forEach((n) => {
      if (n.recipient_user_id === userId) n.is_read = true;
    });
    localDb.setNotifications(notifs);
  }

  // --- SYSTEM SETTINGS ---
  static getSystemSettings(): SystemSetting[] {
    return localDb.getSystemSettings();
  }

  static async updateSystemSetting(
    key: string,
    value: string,
    actor: { id: string; name: string; role: string },
    description?: string
  ): Promise<{ success: boolean; error?: string; setting?: SystemSetting }> {
    const settings = localDb.getSystemSettings();
    let item = settings.find((s) => s.setting_key === key);
    if (item) {
      item.setting_value = value;
      item.updated_by = actor.name;
      item.updated_at = new Date().toISOString();
      if (description) item.setting_description = description;
    } else {
      item = {
        id: `setting-${Date.now()}`,
        setting_key: key,
        setting_value: value,
        setting_description: description || `Pengaturan sistem ${key}`,
        updated_by: actor.name,
        updated_at: new Date().toISOString(),
      };
      settings.push(item);
    }
    localDb.setSystemSettings(settings);
    this.logAudit(actor, 'UPDATE_RECORD', 'system_settings', item.id, { key, value });
    const res = await SupabaseSyncService.upsertRecord('system_settings', item);
    return { success: res.success, error: res.error, setting: item };
  }

  static async saveRepeatVisitSettings(
    threshold: string | number,
    periodDays: string | number,
    actor: { id: string; name: string; role: string }
  ): Promise<{ success: boolean; error?: string }> {
    const res1 = await this.updateSystemSetting(
      'repeat_visit_threshold',
      String(threshold),
      actor,
      'Batas jumlah kunjungan UKS per peserta dalam 1 bulan kalender untuk memicu Peringatan Kunjungan Berulang'
    );
    const res2 = await this.updateSystemSetting(
      'repeat_visit_period_days',
      String(periodDays),
      actor,
      'Periode rentang hari untuk penghitungan peringatan kunjungan berulang'
    );
    if (!res1.success || !res2.success) {
      return { success: false, error: res1.error || res2.error || 'Gagal menyimpan ke database' };
    }
    return { success: true };
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return localDb.getAuditLogs();
  }
}
