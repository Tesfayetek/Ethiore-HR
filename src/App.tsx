import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import { storageService } from './services/storage';
import { auth, onAuthStateChanged, db, doc, getDoc } from './services/firebase';
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
import { EthioReLogo } from './components/common/EthioReLogo';
import { Shield } from 'lucide-react';

/**
 * Parses the current route from window.location.hash or window.location.pathname.
 */
function parseCurrentRoute(): { rawRoute: string; navId: MainNavId | 'login' | 'unknown'; subTab?: string } {
  // Check hash first (e.g. #/dashboard, #/employees, #/portal, #/login)
  let path = window.location.hash.replace(/^#\/?/, '').trim();

  // If no hash, inspect pathname
  if (!path) {
    const rawPath = window.location.pathname.replace(/^\//, '').trim();
    if (rawPath && rawPath !== 'index.html') {
      path = rawPath;
    }
  }

  const [routePart, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const subTab = params.get('tab') || undefined;
  const cleanRoute = (routePart || '').toLowerCase();

  switch (cleanRoute) {
    case 'login':
    case 'signin':
    case 'auth':
      return { rawRoute: 'login', navId: 'login', subTab };
    case 'dashboard':
    case 'home':
      return { rawRoute: 'dashboard', navId: 'dashboard', subTab };
    case 'employees':
    case 'staff':
      return { rawRoute: 'employees', navId: 'employees', subTab };
    case 'leave':
    case 'leaves':
      return { rawRoute: 'leave', navId: 'leave', subTab };
    case 'attendance':
    case 'timeclock':
      return { rawRoute: 'attendance', navId: 'attendance', subTab };
    case 'reports':
    case 'audits':
      return { rawRoute: 'reports', navId: 'reports', subTab };
    case 'configuration':
    case 'settings':
      return { rawRoute: 'configuration', navId: 'configuration', subTab };
    case 'portal':
    case 'my_portal':
    case 'self-service':
      return { rawRoute: 'portal', navId: 'my_portal', subTab };
    default:
      return { rawRoute: cleanRoute, navId: 'unknown', subTab };
  }
}

/**
 * Corporate branded loading screen to prevent protected content flashing
 * while checking session & authentication status.
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#082836] flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
        <EthioReLogo size="lg" variant="full" theme="dark" />

        <div className="relative flex items-center justify-center py-3">
          <div className="w-12 h-12 rounded-full border-3 border-[#CCA352]/20 border-t-[#CCA352] animate-spin" />
          <div className="absolute w-5 h-5 rounded-full bg-[#0E3D52] flex items-center justify-center shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#E2BE6C] animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Verifying Enterprise Session
          </h2>
          <p className="text-xs text-slate-400">
            Checking authentication and security policies...
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 w-full text-[11px] text-slate-500 font-mono tracking-tight">
          Ethiopian Reinsurance S.C. HRMS
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Authentication checking state — prevents any protected content from flashing
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authenticated user state (strictly null until Firebase confirms session)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active navigation module
  const [currentNav, setCurrentNav] = useState<MainNavId>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quick modals state triggered from dashboard
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [openAddLeave, setOpenAddLeave] = useState(false);

  // Metric counts for sidebar badges
  const [counts, setCounts] = useState(() => ({
    totalEmployees: storageService.getEmployees().length,
    totalLeaves: storageService.getLeaveRecords().length,
    pendingOvertime: storageService.getOvertimeRecords().filter((o) => o.status === 'Pending').length,
  }));

  const updateCounts = useCallback(() => {
    setCounts({
      totalEmployees: storageService.getEmployees().length,
      totalLeaves: storageService.getLeaveRecords().length,
      pendingOvertime: storageService.getOvertimeRecords().filter((o) => o.status === 'Pending').length,
    });
  }, []);

  // Global Security Guard: Enforce Administrator-only printing at the window/browser level
  useEffect(() => {
    const nativePrint = window.print;
    const securePrint = function () {
      const activeUser = storageService.getCurrentUser();
      if (!activeUser || activeUser.role !== 'Administrator') {
        storageService.addAuditLog(
          'UNAUTHORIZED_PRINT_ATTEMPT',
          'Reports',
          `SECURITY ALERT: Direct window.print() execution blocked. User: ${activeUser?.displayName || 'Unknown'}, Role: '${activeUser?.role || 'Guest'}'. Administrator role is strictly required.`,
          undefined,
          activeUser || undefined
        );
        alert(
          `Access Denied: Only users with the Administrator role are authorized to print reports in Ethiopian Reinsurance HRMS. (Current role: ${activeUser?.role || 'Unauthenticated'})`
        );
        return;
      }
      nativePrint.call(window);
    };
    window.print = securePrint;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        const activeUser = storageService.getCurrentUser();
        if (!activeUser || activeUser.role !== 'Administrator') {
          e.preventDefault();
          e.stopPropagation();
          storageService.addAuditLog(
            'UNAUTHORIZED_PRINT_ATTEMPT',
            'Reports',
            `SECURITY ALERT: Keyboard print shortcut (Ctrl/Cmd+P) blocked. User: ${activeUser?.displayName || 'Unknown'}, Role: '${activeUser?.role || 'Guest'}'.`,
            undefined,
            activeUser || undefined
          );
          alert('Access Denied: Only users with the Administrator role are authorized to print reports in Ethiopian Reinsurance HRMS.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.print = nativePrint;
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  /**
   * Enforces role-based route protection and synchronizes browser URL.
   */
  const enforceRouteAndUrl = useCallback(
    (user: User | null, targetNav?: MainNavId, targetSubTab?: string, replaceUrl = false) => {
      // SCENARIO 1: Unauthenticated user — require login for ALL protected pages
      if (!user) {
        if (window.location.hash !== '#/login') {
          window.history.replaceState({ authenticated: false, route: 'login' }, '', '#/login');
        }
        return;
      }

      // SCENARIO 2: Authenticated user — enforce role permissions
      let resolvedNav: MainNavId = targetNav || 'dashboard';

      if (user.role === 'Employee') {
        // Employees are strictly restricted to My Staff Portal
        resolvedNav = 'my_portal';
      } else if (user.role === 'HR Admin' || user.role === 'HR Officer') {
        // HR Admin & HR Officer cannot access Configuration Settings
        if (resolvedNav === 'configuration') {
          resolvedNav = 'dashboard';
        }
      }

      setCurrentNav(resolvedNav);
      setActiveSubTab(targetSubTab);

      // Build target hash
      const hashPath = resolvedNav === 'my_portal' ? 'portal' : resolvedNav;
      const targetHash = targetSubTab ? `#/${hashPath}?tab=${targetSubTab}` : `#/${hashPath}`;

      if (window.location.hash !== targetHash) {
        if (replaceUrl) {
          window.history.replaceState({ authenticated: true, nav: resolvedNav }, '', targetHash);
        } else {
          window.history.pushState({ authenticated: true, nav: resolvedNav }, '', targetHash);
        }
      }
    },
    []
  );

  // Navigation handler invoked by Sidebar, Dashboard shortcuts, etc.
  const handleNavigate = useCallback(
    (nav: MainNavId, subTab?: string) => {
      if (!currentUser) {
        enforceRouteAndUrl(null);
        return;
      }
      enforceRouteAndUrl(currentUser, nav, subTab, false);
    },
    [currentUser, enforceRouteAndUrl]
  );

  // Sign out handler: signs out Firebase session, clears state, and redirects to Login page
  const handleSignOut = async () => {
    await storageService.logoutUser();
    setCurrentUser(null);
    setActiveSubTab(undefined);
    setIsMobileSidebarOpen(false);
    setOpenAddEmployee(false);
    setOpenAddLeave(false);

    // Prevent back-button access to protected pages
    window.history.replaceState({ authenticated: false, route: 'login' }, '', '#/login');
  };

  // Initial authentication check & URL route resolution on app load
  useEffect(() => {
    let isMounted = true;

    const checkInitialAuth = async () => {
      const routeInfo = parseCurrentRoute();

      // Listen to Firebase authentication state
      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;

        if (fbUser) {
          const users = storageService.getUsers();
          let matchedUser = users.find(
            (u) =>
              u.id === fbUser.uid ||
              u.email.toLowerCase() === fbUser.email?.toLowerCase()
          );

          if (!matchedUser) {
            try {
              const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
              if (userDoc.exists()) {
                matchedUser = userDoc.data() as User;
                storageService.addUser(matchedUser);
              }
            } catch (e) {
              console.warn('Notice checking Firestore user on auth restore:', e);
            }
          }

          if (matchedUser && matchedUser.status === 'Active') {
            // Check employee email verification requirement
            if (matchedUser.role === 'Employee' && !fbUser.emailVerified) {
              await storageService.logoutUser();
              setCurrentUser(null);
              enforceRouteAndUrl(null);
            } else {
              storageService.setCurrentUser(matchedUser.id);
              setCurrentUser(matchedUser);

              // Determine destination: honor direct URL if permitted, else role default
              let destNav: MainNavId = matchedUser.role === 'Employee' ? 'my_portal' : 'dashboard';
              if (routeInfo.navId !== 'login' && routeInfo.navId !== 'unknown') {
                destNav = routeInfo.navId as MainNavId;
              }
              enforceRouteAndUrl(matchedUser, destNav, routeInfo.subTab, true);

              // Background Firestore sync for authenticated user
              storageService.syncWithFirestore().then(updateCounts).catch(() => {});
            }
          } else {
            // Not in company directory or deactivated
            await storageService.logoutUser();
            setCurrentUser(null);
            enforceRouteAndUrl(null);
          }
        } else {
          // Strictly unauthenticated when no active Firebase user
          storageService.clearSession();
          setCurrentUser(null);
          enforceRouteAndUrl(null);
        }

        setIsAuthChecking(false);
      });

      return () => {
        unsubscribeAuth();
      };
    };

    checkInitialAuth();

    return () => {
      isMounted = false;
    };
  }, [enforceRouteAndUrl, updateCounts]);

  // Handle URL change, browser Back / Forward buttons, and storage synchronization
  useEffect(() => {
    const handleStorageUpdate = () => {
      updateCounts();
    };

    const handleUserChange = () => {
      const updated = storageService.getAuthenticatedUser();
      setCurrentUser(updated);
      if (updated) {
        enforceRouteAndUrl(updated, currentNav, activeSubTab, true);
      } else {
        enforceRouteAndUrl(null);
      }
    };

    // Prevent Back-button access to protected pages when unauthenticated
    const handlePopState = () => {
      const authUser = storageService.getAuthenticatedUser();
      if (!authUser) {
        setCurrentUser(null);
        if (window.location.hash !== '#/login') {
          window.history.replaceState({ authenticated: false, route: 'login' }, '', '#/login');
        }
        return;
      }

      const routeInfo = parseCurrentRoute();
      if (routeInfo.navId === 'login') {
        // Authenticated user navigating back to login -> redirect to their role home
        const dest: MainNavId = authUser.role === 'Employee' ? 'my_portal' : 'dashboard';
        enforceRouteAndUrl(authUser, dest, undefined, true);
      } else if (routeInfo.navId !== 'unknown') {
        enforceRouteAndUrl(authUser, routeInfo.navId as MainNavId, routeInfo.subTab, true);
      } else {
        const dest: MainNavId = authUser.role === 'Employee' ? 'my_portal' : 'dashboard';
        enforceRouteAndUrl(authUser, dest, undefined, true);
      }
    };

    window.addEventListener('ethiore_storage_update', handleStorageUpdate);
    window.addEventListener('ethiore_user_change', handleUserChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('ethiore_storage_update', handleStorageUpdate);
      window.removeEventListener('ethiore_user_change', handleUserChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [currentNav, activeSubTab, enforceRouteAndUrl, updateCounts]);

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

  const handleUserSwitch = useCallback(
    (targetRole: UserRole) => {
      const users = storageService.getUsers();
      const targetUser = users.find((u) => u.role === targetRole) || users[0];
      if (targetUser) {
        storageService.setCurrentUser(targetUser.id);
        setCurrentUser(targetUser);
        const dest: MainNavId = targetUser.role === 'Employee' ? 'my_portal' : 'dashboard';
        enforceRouteAndUrl(targetUser, dest, undefined, false);
      }
    },
    [enforceRouteAndUrl]
  );

  // 1. Loading screen while checking authentication state to prevent any protected content from flashing
  if (isAuthChecking) {
    return <AuthLoadingScreen />;
  }

  // 2. Unauthenticated state — render ONLY the corporate Login page as default entry point
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // Redirect to appropriate dashboard according to role and permissions
          const dest: MainNavId = user.role === 'Employee' ? 'my_portal' : 'dashboard';
          enforceRouteAndUrl(user, dest, undefined, false);
        }}
      />
    );
  }

  // 3. Authenticated state — protected modules & layout
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Application Header with User Info, Mobile Toggle and Sign Out */}
      <Header
        currentUser={currentUser}
        onUserSwitch={handleUserSwitch}
        activeModuleTitle={getModuleTitle()}
        onLogout={handleSignOut}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Accordion Sidebar */}
        <Sidebar
          currentNav={currentNav}
          activeSubTab={activeSubTab}
          onNavigate={(nav, subTab) => handleNavigate(nav, subTab)}
          userRole={currentUser.role}
          counts={counts}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/90">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* EMPLOYEE PORTAL VIEW (For role === 'Employee') */}
            {(currentUser.role === 'Employee' || currentNav === 'my_portal') && (
              <EmployeePortalView currentUser={currentUser} initialSubTab={activeSubTab} />
            )}

            {/* MANAGEMENT VIEWS (Only for Administrator & HR Admin) */}
            {currentUser.role !== 'Employee' && (
              <>
                {currentNav === 'dashboard' && (
                  <DashboardView
                    userRole={currentUser.role}
                    onNavigate={(module, subTab) => handleNavigate(module as MainNavId, subTab)}
                    onOpenNewLeaveModal={() => {
                      handleNavigate('leave', 'records');
                      setOpenAddLeave(true);
                    }}
                    onOpenNewEmployeeModal={() => {
                      handleNavigate('employees');
                      setOpenAddEmployee(true);
                    }}
                  />
                )}

                {currentNav === 'employees' && (
                  <EmployeeMasterView
                    userRole={currentUser.role}
                    initialSubTab={activeSubTab}
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

                {/* REPORTS MODULE (Administrator and HR Admin) */}
                {currentNav === 'reports' && (
                  <ReportsView
                    userRole={currentUser.role}
                    initialReportId={(activeSubTab as any) || 'emp_directory'}
                  />
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
    </div>
  );
}
