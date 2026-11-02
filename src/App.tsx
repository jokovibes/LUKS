/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lazuardi UKS Management System (LUKS)
 * Lazuardi Global Compassionate School
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationModal } from './components/common/NotificationModal';
import { QrScannerModal } from './components/common/QrScannerModal';
import { LoginPage } from './components/auth/LoginPage';
import { ProfilePage } from './components/auth/ProfilePage';
import { PetugasDashboard } from './components/dashboard/PetugasDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { PimpinanDashboard } from './components/dashboard/PimpinanDashboard';
import { PimpinanGlucoseStats } from './components/dashboard/PimpinanGlucoseStats';
import { PimpinanVisitsStats } from './components/dashboard/PimpinanVisitsStats';
import { PimpinanFollowUpsStats } from './components/dashboard/PimpinanFollowUpsStats';
import { TrendsAnalysis } from './components/dashboard/TrendsAnalysis';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { GlucoseExamForm } from './components/glucose/GlucoseExamForm';
import { GlucoseExamList } from './components/glucose/GlucoseExamList';
import { UksVisitForm } from './components/uks/UksVisitForm';
import { UksVisitList } from './components/uks/UksVisitList';
import { RepeatVisitAlerts } from './components/uks/RepeatVisitAlerts';
import { StudentsManagement } from './components/master/StudentsManagement';
import { EmployeesManagement } from './components/master/EmployeesManagement';
import { UnitsClassesManagement } from './components/master/UnitsClassesManagement';
import { HealthParametersSettings } from './components/master/HealthParametersSettings';
import { UserManagement } from './components/master/UserManagement';
import { AuditLogViewer } from './components/master/AuditLogViewer';
import { SupabaseSetupGuide } from './components/master/SupabaseSetupGuide';
import { ReportsPage } from './components/reports/ReportsPage';
import { UserProfile, UserRole } from './types/database';
import { DataService } from './services/dataService';

const getDefaultDashboard = (userRole: UserRole | null | undefined): string => {
  switch (userRole) {
    case 'admin':
      return 'admin_dashboard';
    case 'pimpinan':
      return 'pimpinan_dashboard';
    case 'siswa':
    case 'karyawan':
      return 'user_dashboard';
    case 'petugas_uks':
    default:
      return 'petugas_dashboard';
  }
};

function MainApp() {
  const { currentUser, role, isAuthenticated, isLoading } = useAuth();

  // Navigation state - defaults directly to the user's role dashboard
  const [activeTab, setActiveTab] = useState<string>(() => getDefaultDashboard(role));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Pre-selected participant for examination/visit form
  const [preSelectedParticipant, setPreSelectedParticipant] = useState<UserProfile | undefined>();
  const [, setSyncVersion] = useState(0);

  // Initialize Supabase sync on app launch
  React.useEffect(() => {
    DataService.syncWithSupabase();

    const handleSync = () => {
      setSyncVersion((v) => v + 1);
    };
    window.addEventListener('luks-supabase-synced', handleSync);
    return () => {
      window.removeEventListener('luks-supabase-synced', handleSync);
    };
  }, []);

  // Track user session to ensure immediate landing on role's dashboard upon login or user change
  const prevUserRef = React.useRef<{ id: string; role: string } | null>(null);

  React.useEffect(() => {
    if (currentUser && role) {
      if (!prevUserRef.current || prevUserRef.current.id !== currentUser.id || prevUserRef.current.role !== role) {
        setActiveTab(getDefaultDashboard(role));
        prevUserRef.current = { id: currentUser.id, role };
      }
    } else {
      prevUserRef.current = null;
    }
  }, [currentUser?.id, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center animate-spin">
            ✚
          </div>
          <span className="font-semibold text-slate-300">Memuat Sistem UKS Lazuardi...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // Handle QR scanner select
  const handleQrParticipantSelect = (participant: UserProfile) => {
    setPreSelectedParticipant(participant);
    setIsQrScannerOpen(false);
    // Switch to registration form depending on role
    if (role === 'petugas_uks' || role === 'admin') {
      setActiveTab('glucose_register');
    }
  };

  // Render content according to active tab
  const renderContent = () => {
    switch (activeTab) {
      // Administrator Tabs
      case 'admin_dashboard':
        return (
          <AdminDashboard
            onNavigateTab={setActiveTab}
            onOpenSupabaseGuide={() => setIsSupabaseModalOpen(true)}
          />
        );
      case 'students':
        return <StudentsManagement />;
      case 'employees':
        return <EmployeesManagement />;
      case 'units_classes':
        return <UnitsClassesManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <HealthParametersSettings />;
      case 'audit_logs':
        return <AuditLogViewer />;

      // Petugas UKS Tabs
      case 'petugas_dashboard':
        return (
          <PetugasDashboard
            onNavigateTab={setActiveTab}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
          />
        );
      case 'glucose_exams':
      case 'glucose_history':
        return <GlucoseExamList onOpenRegister={() => setActiveTab('glucose_register')} />;
      case 'glucose_register':
        return (
          <GlucoseExamForm
            onSuccess={() => setActiveTab('glucose_history')}
            preSelectedParticipant={preSelectedParticipant}
          />
        );
      case 'uks_visits':
      case 'uks_handling':
        return <UksVisitList onOpenRegister={() => setActiveTab('uks_register')} />;
      case 'uks_register':
        return (
          <UksVisitForm
            onSuccess={() => setActiveTab('uks_visits')}
            preSelectedParticipant={preSelectedParticipant}
          />
        );
      case 'reminders':
        return <RepeatVisitAlerts />;

      // Shared / General Tabs
      case 'follow_ups':
      case 'my_followups':
        return <GlucoseExamList onOpenRegister={() => setActiveTab('glucose_register')} />;
      case 'reports':
        return <ReportsPage />;
      case 'reports_by_unit':
        return <ReportsPage initialReportType="laporan_statistik_unit" />;
      case 'trends_analysis':
        return <TrendsAnalysis />;

      // Siswa & Karyawan Tabs
      case 'user_dashboard':
        return <UserDashboard />;
      case 'my_profile':
        return <ProfilePage />;
      case 'my_glucose':
        return <GlucoseExamList />;
      case 'my_visits':
        return <UksVisitList />;

      // Pimpinan Tabs
      case 'pimpinan_dashboard':
        return <PimpinanDashboard onNavigateTab={setActiveTab} />;
      case 'stats_glucose':
        return <PimpinanGlucoseStats />;
      case 'stats_visits':
        return <PimpinanVisitsStats />;
      case 'stats_followups':
        return <PimpinanFollowUpsStats />;

      default:
        if (role === 'admin') return <AdminDashboard onNavigateTab={setActiveTab} onOpenSupabaseGuide={() => setIsSupabaseModalOpen(true)} />;
        if (role === 'pimpinan') return <PimpinanDashboard onNavigateTab={setActiveTab} />;
        if (role === 'siswa' || role === 'karyawan') return <UserDashboard />;
        return (
          <PetugasDashboard
            onNavigateTab={setActiveTab}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Dynamic Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            activeTab={activeTab}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenSupabaseGuide={() => setIsSupabaseModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Global In-App Notifications Drawer */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToRecord={(type) => {
          if (type === 'glucose') setActiveTab('glucose_history');
          if (type === 'visit') setActiveTab('uks_visits');
        }}
      />

      {/* Global QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onSelectParticipant={handleQrParticipantSelect}
        title="Pemindai Kartu Identitas Siswa / Karyawan"
      />

      {/* Supabase PostgreSQL Setup & SQL Runner Modal */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Status Supabase & Skema PostgreSQL LUKS</span>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <SupabaseSetupGuide />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
