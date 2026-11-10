/**
 * Types & Data Model for Lazuardi UKS Management System (LUKS)
 * Lazuardi Global Compassionate School
 */

export type UserRole = 'admin' | 'petugas_uks' | 'karyawan' | 'siswa' | 'pimpinan';
export type ParticipantCategory = 'siswa' | 'karyawan';
export type GlucoseExamType = 'puasa' | 'sewaktu' | 'setelah_makan';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type GlucoseClassification = 'normal' | 'perlu_perhatian' | 'pemantauan' | 'tindak_lanjut' | 'belum_diklasifikasikan';
export type FollowUpStatus = 'belum_dilakukan' | 'sedang_dipantau' | 'selesai' | 'dirujuk';

export type VisitReason = 'sakit' | 'cedera' | 'pemeriksaan_rutin' | 'lainnya';
export type VisitStatus = 'aktif' | 'selesai' | 'dibatalkan';
export type VisitOutcome =
  | 'kembali_ke_kelas'
  | 'kembali_bekerja'
  | 'beristirahat_di_uks'
  | 'dijemput_keluarga'
  | 'dipulangkan'
  | 'dirujuk'
  | 'pemantauan_lanjutan'
  | 'masih_dalam_penanganan';

export interface SchoolUnit {
  id: string;
  unit_name: string; // e.g. Pra-TK & TK Lazuardi, SD Lazuardi, SMP Lazuardi, SMA Lazuardi
  unit_code: string; // TK, SD, SMP, SMA
  head_of_unit?: string;
  is_active: boolean;
}

export interface SchoolClass {
  id: string;
  class_name: string; // e.g. 1 Abu Bakar, 7 Al-Khawarizmi, 10 IPA 1
  unit_id: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  auth_user_id?: string;
  email: string;
  password?: string;
  employee_or_student_id: string; // NIS or NIY
  full_name: string;
  role: UserRole;
  category: ParticipantCategory;
  unit_id: string;
  class_id?: string;
  work_unit?: string;
  gender: 'L' | 'P';
  date_of_birth?: string;
  contact_information?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthClassificationParameter {
  id: string;
  examination_type: GlucoseExamType;
  result_unit: GlucoseUnit;
  parameter_configuration: {
    normal_min: number;
    normal_max: number;
    perlu_perhatian_min: number;
    perlu_perhatian_max: number;
    tindak_lanjut_min: number;
    tindak_lanjut_max?: number;
    catatan_pedoman: string;
  };
  effective_from: string;
  approved_by: string;
  approved_by_title: string;
  approved_at: string;
  version: string;
  is_active: boolean;
  created_at?: string;
}

export interface GlucoseExamination {
  id: string;
  examination_number: string; // GDS-YYYYMMDD-0001
  participant_id: string;
  participant?: UserProfile;
  examination_datetime: string;
  examination_type: GlucoseExamType;
  last_meal_datetime?: string;
  fasting_duration_hours?: number;
  result_value: number; // e.g. 115.5
  result_unit: GlucoseUnit; // mg/dL or mmol/L
  symptoms?: string;
  participant_condition?: string;
  examiner_id: string;
  examiner_name: string;
  device_name?: string;
  attachment_path?: string;
  notes?: string;
  classification: GlucoseClassification;
  classification_parameter_version?: string;
  consent_status: 'diberikan' | 'tidak_diperlukan' | 'ditolak';
  record_status: 'draft' | 'resmi' | 'dikoreksi';
  created_at: string;
  updated_at: string;
}

export interface GlucoseFollowUp {
  id: string;
  examination_id: string;
  responsible_staff_id: string;
  responsible_staff_name: string;
  follow_up_status: FollowUpStatus;
  recommended_action: string;
  scheduled_date?: string;
  completed_at?: string;
  communication_notes?: string;
  referral_details?: string;
  created_at: string;
  updated_at: string;
}

export interface UksVisit {
  id: string;
  visit_number: string; // UKS-YYYYMMDD-0001
  participant_id: string;
  participant?: UserProfile;
  visit_datetime: string;
  previous_location?: string;
  main_complaint: string;
  visit_reason: VisitReason;
  incident_chronology?: string;
  accompanying_person?: string;
  handling_staff_id: string;
  handling_staff_name: string;
  initial_condition?: string;
  visit_status: VisitStatus;
  outcome?: VisitOutcome;
  rest_start_time?: string;
  rest_end_time?: string;
  checkout_datetime?: string;
  pickup_person?: string;
  pickup_relationship?: string;
  pickup_contact?: string;
  parent_contacted_at?: string;
  communicating_staff_name?: string;
  referral_destination?: string;
  handover_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UksAssessment {
  id: string;
  visit_id: string;
  assessment_datetime: string;
  temperature?: number; // Celcius
  systolic_pressure?: number; // mmHg
  diastolic_pressure?: number; // mmHg
  pulse_rate?: number; // bpm
  respiratory_rate?: number; // /min
  oxygen_saturation?: number; // %
  other_measurements?: string;
  treatment?: string;
  medication_or_equipment?: string;
  medication_dosage?: string;
  notes?: string;
  attachment_path?: string;
  examiner_id: string;
  examiner_name: string;
  created_at: string;
}

export interface UksFollowUp {
  id: string;
  visit_id: string;
  responsible_staff_id: string;
  responsible_staff_name: string;
  follow_up_status: FollowUpStatus;
  scheduled_date?: string;
  parent_or_contact_called_at?: string;
  contact_person?: string;
  pickup_person?: string;
  pickup_contact?: string;
  approval_person?: string;
  referral_destination?: string;
  handover_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  recipient_user_id: string;
  notification_type: 'glucose_recorded' | 'followup_scheduled' | 'followup_overdue' | 'active_visit' | 'repeat_visit' | 'status_updated' | 'system';
  title: string;
  message: string;
  target_record_type?: 'glucose' | 'visit' | 'followup';
  target_record_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_description: string;
  updated_by: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: 'LOGIN' | 'LOGOUT' | 'VIEW_RECORD' | 'CREATE_RECORD' | 'UPDATE_RECORD' | 'EXPORT_DATA' | 'DELETE_RECORD' | 'APPROVE_PARAMETER';
  entity_type: 'glucose_examinations' | 'uks_visits' | 'profiles' | 'health_parameters' | 'reports' | 'system_settings' | 'audit_logs';
  entity_id?: string;
  timestamp: string;
  relevant_metadata?: Record<string, any>;
}

export interface RepeatVisitWarning {
  participant_id: string;
  participant: UserProfile;
  visit_count: number;
  period_start: string;
  period_end: string;
  visits: UksVisit[];
  status_review: 'menunggu_telaah' | 'telah_ditelaah' | 'tindak_lanjut_khusus';
  internal_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}
