/**
 * In-Memory Persistence Layer for LUKS - Supabase Authoritative
 * Lazuardi Global Compassionate School
 * 
 * Local storage persistence dan seluruh data dummy telah dihapus.
 * Aplikasi kini sepenuhnya mengandalkan data nyata dari database Supabase.
 */

import {
  SchoolUnit,
  SchoolClass,
  UserProfile,
  HealthClassificationParameter,
  GlucoseExamination,
  GlucoseFollowUp,
  UksVisit,
  UksAssessment,
  UksFollowUp,
  AppNotification,
  SystemSetting,
  AuditLog,
} from '../types/database';

export const STORAGE_KEYS = {
  UNITS: 'luks_units_v1',
  CLASSES: 'luks_classes_v1',
  PROFILES: 'luks_profiles_v1',
  HEALTH_PARAMS: 'luks_health_params_v1',
  GLUCOSE_EXAMS: 'luks_glucose_exams_v1',
  GLUCOSE_FOLLOWUPS: 'luks_glucose_followups_v1',
  UKS_VISITS: 'luks_uks_visits_v1',
  UKS_ASSESSMENTS: 'luks_uks_assessments_v1',
  UKS_FOLLOWUPS: 'luks_uks_followups_v1',
  NOTIFICATIONS: 'luks_notifications_v1',
  SYSTEM_SETTINGS: 'luks_system_settings_v1',
  AUDIT_LOGS: 'luks_audit_logs_v1',
  REPEAT_REVIEWS: 'luks_repeat_reviews_v1',
};

// Data Dummy telah dikosongkan secara permanen
export const INITIAL_UNITS: SchoolUnit[] = [];
export const INITIAL_CLASSES: SchoolClass[] = [];
export const INITIAL_PROFILES: UserProfile[] = [];
export const INITIAL_HEALTH_PARAMETERS: HealthClassificationParameter[] = [];
export const INITIAL_SYSTEM_SETTINGS: SystemSetting[] = [];
export const INITIAL_GLUCOSE_EXAMINATIONS: GlucoseExamination[] = [];
export const INITIAL_GLUCOSE_FOLLOWUPS: GlucoseFollowUp[] = [];
export const INITIAL_UKS_VISITS: UksVisit[] = [];
export const INITIAL_UKS_ASSESSMENTS: UksAssessment[] = [];
export const INITIAL_UKS_FOLLOWUPS: UksFollowUp[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_REPEAT_REVIEWS: any[] = [];

/**
 * Hapus seluruh data usang di localStorage browser
 */
export function purgeLocalStorageData(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const allKeys = Object.values(STORAGE_KEYS);
      allKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem('luks_current_user_id_v1');
      localStorage.removeItem('luks_current_user_id');
      localStorage.removeItem('luks_storage_purged_flag_v4');
      localStorage.removeItem('luks_storage_purged_flag_v3');
      localStorage.removeItem('luks_storage_purged_flag_v2');
      localStorage.removeItem('luks_storage_purged_flag_v1');
    }
  } catch (err) {
    console.warn('Gagal membersihkan data localStorage:', err);
  }
}

// Jalankan pembersihan localStorage saat modul ini dimuat
purgeLocalStorageData();

/**
 * In-Memory Runtime Store (Bukan LocalStorage)
 * Menyimpan data di memori aplikasi yang langsung ditarik dari Supabase.
 */
interface MemoryStoreState {
  units: SchoolUnit[];
  classes: SchoolClass[];
  profiles: UserProfile[];
  healthParams: HealthClassificationParameter[];
  glucoseExams: GlucoseExamination[];
  glucoseFollowUps: GlucoseFollowUp[];
  uksVisits: UksVisit[];
  uksAssessments: UksAssessment[];
  uksFollowUps: UksFollowUp[];
  notifications: AppNotification[];
  systemSettings: SystemSetting[];
  auditLogs: AuditLog[];
  repeatReviews: any[];
}

const memoryStore: MemoryStoreState = {
  units: [],
  classes: [],
  profiles: [],
  healthParams: [],
  glucoseExams: [],
  glucoseFollowUps: [],
  uksVisits: [],
  uksAssessments: [],
  uksFollowUps: [],
  notifications: [],
  systemSettings: [],
  auditLogs: [],
  repeatReviews: [],
};

export const localDb = {
  resetAll: () => {
    purgeLocalStorageData();
    memoryStore.units = [];
    memoryStore.classes = [];
    memoryStore.profiles = [];
    memoryStore.healthParams = [];
    memoryStore.glucoseExams = [];
    memoryStore.glucoseFollowUps = [];
    memoryStore.uksVisits = [];
    memoryStore.uksAssessments = [];
    memoryStore.uksFollowUps = [];
    memoryStore.notifications = [];
    memoryStore.systemSettings = [];
    memoryStore.auditLogs = [];
    memoryStore.repeatReviews = [];
  },

  getUnits: (): SchoolUnit[] => [...memoryStore.units],
  setUnits: (data: SchoolUnit[]) => {
    memoryStore.units = [...data];
  },

  getClasses: (): SchoolClass[] => [...memoryStore.classes],
  setClasses: (data: SchoolClass[]) => {
    memoryStore.classes = [...data];
  },

  getProfiles: (): UserProfile[] => [...memoryStore.profiles],
  setProfiles: (data: UserProfile[]) => {
    memoryStore.profiles = [...data];
  },

  getHealthParams: (): HealthClassificationParameter[] => [...memoryStore.healthParams],
  setHealthParams: (data: HealthClassificationParameter[]) => {
    memoryStore.healthParams = [...data];
  },

  getGlucoseExams: (): GlucoseExamination[] => [...memoryStore.glucoseExams],
  setGlucoseExams: (data: GlucoseExamination[]) => {
    memoryStore.glucoseExams = [...data];
  },

  getGlucoseFollowUps: (): GlucoseFollowUp[] => [...memoryStore.glucoseFollowUps],
  setGlucoseFollowUps: (data: GlucoseFollowUp[]) => {
    memoryStore.glucoseFollowUps = [...data];
  },

  getUksVisits: (): UksVisit[] => [...memoryStore.uksVisits],
  setUksVisits: (data: UksVisit[]) => {
    memoryStore.uksVisits = [...data];
  },

  getUksAssessments: (): UksAssessment[] => [...memoryStore.uksAssessments],
  setUksAssessments: (data: UksAssessment[]) => {
    memoryStore.uksAssessments = [...data];
  },

  getUksFollowUps: (): UksFollowUp[] => [...memoryStore.uksFollowUps],
  setUksFollowUps: (data: UksFollowUp[]) => {
    memoryStore.uksFollowUps = [...data];
  },

  getNotifications: (): AppNotification[] => [...memoryStore.notifications],
  setNotifications: (data: AppNotification[]) => {
    memoryStore.notifications = [...data];
  },

  getSystemSettings: (): SystemSetting[] => [...memoryStore.systemSettings],
  setSystemSettings: (data: SystemSetting[]) => {
    memoryStore.systemSettings = [...data];
  },

  getAuditLogs: (): AuditLog[] => [...memoryStore.auditLogs],
  setAuditLogs: (data: AuditLog[]) => {
    memoryStore.auditLogs = [...data];
  },

  getRepeatReviews: (): any[] => [...memoryStore.repeatReviews],
  setRepeatReviews: (data: any[]) => {
    memoryStore.repeatReviews = [...data];
  },
};
