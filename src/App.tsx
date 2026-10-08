import { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { storageService } from './services/storage';
import { auth, onAuthStateChanged } from './services/firebase';
import { Header } from './components/layout/Header';
import { Sidebar, MainNavId } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeMasterView } from './components/employees/EmployeeMasterView';
import { LeaveManagementView } from './components/leave/LeaveManagementView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ConfigurationView } from './components/configuration/ConfigurationView';
import { ReportsView } from './components/reports/ReportsView';
import { EmployeePortalView } from './components/employee-portal/EmployeePortalView';
import { LoginPage } from './components/auth/LoginPage';
import { Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getAuthenticatedUser());
  const [currentNav, setCurrentNav] = useState<MainNavId>(() =>
    currentUser?.role === 'Employee' ? 'my_portal' : 'dashboard'
  );
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Quick modals state triggered from dashboard
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [openAddLeave, setOpenAddLeave] = useState(false);

  // Metric counts for sidebar badges
  const [counts, setCounts] = useState(() => ({
    totalEmployees: storageService.getEmployees().length,
    totalLeaves: storageService.getLeaveRecords().length,
    pendingOvertime: storageService.getOvertimeRecords().filter((o) => o.status === 'Pending').length,
  }));

  const updateCounts = () => {
    setCounts({
      totalEmployees: storageService.getEmployees().length,
      totalLeaves: storageService.getLeaveRecords().length,
      pendingOvertime: storageService.getOvertimeRecords().filter((o) => o.status === 'Pending').length,
    });
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      updateCounts();
    };

    const handleUserChange = () => {
      const updated = storageService.getAuthenticatedUser();
      setCurrentUser(updated);
      if (updated) {
        if (updated.role === 'Employee') {
          setCurrentNav('my_portal');
        } else if (currentNav === 'my_portal') {
          setCurrentNav('dashboard');
        }
      }
    };

    const handlePopState = () => {
      if (!storageService.isAuthenticated()) {
        setCurrentUser(null);
      }
    };

    window.addEventListener('ethiore_storage_update', handleStorageUpdate);
    window.addEventListener('ethiore_user_change', handleUserChange);
    window.addEventListener('popstate', handlePopState);

    // Background synchronization with Firebase backend (hrms-d9d43) when authenticated
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        storageService.syncWithFirestore().then(() => {
          updateCounts();
        });
      }
    });

    if (auth.currentUser) {
      storageService.syncWithFirestore().then(() => {
        updateCounts();
      });
    }

    return () => {
      unsubscribeAuth();
      window.removeEventListener('ethiore_storage_update', handleStorageUpdate);
      window.removeEventListener('ethiore_user_change', handleUserChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentNav]);

  // Sign out handler: signs out Firebase session, clears state, and redirects to Login page
  const handleSignOut = async () => {
    await storageService.logoutUser();
    setCurrentUser(null);
    setActiveSubTab(undefined);
    setOpenAddEmployee(false);
    setOpenAddLeave(false);
    setIsLoginModalOpen(false);
    // Prevent back-button access to protected pages
    window.history.replaceState({ authenticated: false }, '', window.location.pathname);
  };

  const handleNavigate = (nav: MainNavId, subTab?: string) => {
    if (!currentUser) return;
    // Permission boundary check
    if (currentUser.role === 'Employee') {
      setCurrentNav('my_portal');
      return;
    }

    if (nav === 'configuration' && currentUser.role !== 'Administrator') {
      // HR Admin cannot access configuration
      return;
    }

    setCurrentNav(nav);
    setActiveSubTab(subTab);
  };

  const getModuleTitle = () => {
    if (!currentUser) return 'Ethiopian Reinsurance HRMS';
    if (currentUser.role === 'Employee' || currentNav === 'my_portal') {
      return 'Staff Self-Service Portal';
    }
    switch (currentNav) {
      case 'dashboard':
        return 'Executive Overview';
      case 'employees':
        return 'Employee Master Data';
      case 'leave':
        return 'Leave Management';
      case 'attendance':
        return 'Attendance & Time Clock';
      case 'reports':
        return 'Official HR Reports & Audits';
      case 'configuration':
        return 'Configuration Settings';
      default:
        return 'Ethiopian Reinsurance HRMS';
    }
  };

  // If user is not authenticated or has signed out, render corporate Login page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'Employee') {
            setCurrentNav('my_portal');
          } else {
            setCurrentNav('dashboard');
          }
          window.history.pushState({ authenticated: true }, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Application Header with User Info and Sign Out (No role selector) */}
      <Header
        currentUser={currentUser}
        activeModuleTitle={getModuleTitle()}
        onLogout={handleSignOut}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentNav={currentNav}
          onNavigate={(nav) => handleNavigate(nav)}
          userRole={currentUser.role}
          counts={counts}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/90">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* EMPLOYEE PORTAL VIEW (For role === 'Employee') */}
            {(currentUser.role === 'Employee' || currentNav === 'my_portal') && (
              <EmployeePortalView currentUser={currentUser} />
            )}

            {/* MANAGEMENT VIEWS (Only for Administrator & HR Officer) */}
            {currentUser.role !== 'Employee' && (
              <>
                {currentNav === 'dashboard' && (
                  <DashboardView
                    userRole={currentUser.role}
                    onNavigate={(module, subTab) => handleNavigate(module as MainNavId, subTab)}
                    onOpenNewLeaveModal={() => {
                      setCurrentNav('leave');
                      setOpenAddLeave(true);
                    }}
                    onOpenNewEmployeeModal={() => {
                      setCurrentNav('employees');
                      setOpenAddEmployee(true);
                    }}
                  />
                )}

                {currentNav === 'employees' && (
                  <EmployeeMasterView
                    userRole={currentUser.role}
                    isAddModalOpenInitially={openAddEmployee}
                    onCloseAddModal={() => setOpenAddEmployee(false)}
                  />
                )}

                {currentNav === 'leave' && (
                  <LeaveManagementView
                    userRole={currentUser.role}
                    initialSubTab={activeSubTab || 'records'}
                    isAddModalOpenInitially={openAddLeave}
                    onCloseAddModal={() => setOpenAddLeave(false)}
                  />
                )}

                {currentNav === 'attendance' && (
                  <AttendanceView
                    userRole={currentUser.role}
                    initialSubTab={activeSubTab || 'register'}
                  />
                )}

                {/* REPORTS MODULE (Only Administrator and HR Officer) */}
                {currentNav === 'reports' && (
                  <ReportsView userRole={currentUser.role} />
                )}

                {/* CONFIGURATION MODULE (Strictly Administrator) */}
                {currentNav === 'configuration' && currentUser.role === 'Administrator' && (
                  <ConfigurationView
                    userRole={currentUser.role}
                    initialSubTab={activeSubTab || 'company'}
                  />
                )}

                {currentNav === 'configuration' && currentUser.role !== 'Administrator' && (
                  <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">Administrator Access Required</h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Configuration settings and RBAC management are restricted to Ethiopian Reinsurance Administrators.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Corporate Login & Registration Modal */}
      {isLoginModalOpen && (
        <LoginPage
          isModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            if (user.role === 'Employee') {
              setCurrentNav('my_portal');
            } else {
              setCurrentNav('dashboard');
            }
          }}
          onCancel={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
