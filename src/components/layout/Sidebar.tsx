import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  Settings,
  ShieldAlert,
  ChevronRight,
  FileText,
  Sparkles,
  FileSpreadsheet,
  UserCheck,
  Layers,
  Calendar,
  History,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Briefcase,
  ShieldCheck,
  Database,
  Bell,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';
import { EthioReLogo } from '../common/EthioReLogo';

export type MainNavId =
  | 'dashboard'
  | 'employees'
  | 'leave'
  | 'attendance'
  | 'reports'
  | 'configuration'
  | 'my_portal';

export interface SubNavMenuItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
}

export interface MainNavMenuItem {
  id: MainNavId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string | null;
  adminOnly: boolean;
  submenus?: SubNavMenuItem[];
}

interface SidebarProps {
  currentNav: MainNavId;
  activeSubTab?: string;
  onNavigate: (nav: MainNavId, subTab?: string) => void;
  userRole: UserRole;
  counts?: {
    totalEmployees: number;
    totalLeaves?: number;
    pendingLeaves?: number;
    pendingOvertime: number;
  };
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  activeSubTab,
  onNavigate,
  userRole,
  counts,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Accordion state: null by default (all submenus collapsed on initial page load)
  const [expandedModuleId, setExpandedModuleId] = useState<MainNavId | null>(null);

  // Self-Service Navigation for Employee Role
  const employeeNavItems: MainNavMenuItem[] = [
    {
      id: 'my_portal',
      label: 'My Staff Portal',
      icon: Sparkles,
      description: 'Profile, Leave & Timecard',
      badge: null,
      adminOnly: false,
      submenus: [
        {
          id: 'overview',
          label: 'My Overview',
          description: 'Daily punch & status',
          icon: Sparkles,
        },
        {
          id: 'profile',
          label: 'My Master Profile',
          description: 'Personnel dossier & ID',
          icon: Briefcase,
        },
        {
          id: 'leave',
          label: 'My Leave & Balances',
          description: 'Entitlements & requests',
          icon: CalendarDays,
        },
        {
          id: 'attendance',
          label: 'My Attendance & Timecard',
          description: 'Daily logs & hours',
          icon: Clock,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          description: 'System alerts & notices',
          icon: Bell,
        },
      ],
    },
  ];

  // Management Navigation for Administrator and HR Admin
  const managementNavItems: MainNavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Executive overview & metrics',
      badge: null,
      adminOnly: false,
      // Dashboard has NO submenus: direct destination page
    },
    {
      id: 'employees',
      label: 'Employee Master Data',
      icon: Users,
      description: 'Directory & Onboarding',
      badge: counts?.totalEmployees ? String(counts.totalEmployees) : null,
      adminOnly: false,
      submenus: [
        {
          id: 'directory',
          label: 'Employee Directory',
          description: 'Search & personnel records',
          icon: Users,
        },
        {
          id: 'import',
          label: 'Import Employees',
          description: 'Excel bulk onboarding',
          icon: FileSpreadsheet,
        },
        {
          id: 'new',
          label: 'Register New Employee',
          description: 'Add personnel dossier',
          icon: UserCheck,
        },
      ],
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: CalendarDays,
      description: 'Records, Balance, Calendar',
      badge: counts?.totalLeaves ? `${counts.totalLeaves} logged` : null,
      adminOnly: false,
      submenus: [
        {
          id: 'records',
          label: 'Leave Records',
          description: 'Logged requests & status',
          icon: CalendarDays,
        },
        {
          id: 'balance',
          label: 'Leave Balances',
          description: 'Statutory entitlements',
          icon: Layers,
        },
        {
          id: 'calendar',
          label: 'Leave Calendar',
          description: 'Departmental schedule',
          icon: Calendar,
        },
        {
          id: 'history',
          label: 'Employee History',
          description: 'Individual leave dossier',
          icon: History,
        },
        {
          id: 'reports',
          label: 'Leave Analytics',
          description: 'Statutory utilization metrics',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Clock,
      description: 'Register, Kiosk, Overtime',
      badge: counts?.pendingOvertime ? `${counts.pendingOvertime} OT` : null,
      adminOnly: false,
      submenus: [
        {
          id: 'register',
          label: 'Attendance Register',
          description: 'Daily arrival log',
          icon: Clock,
        },
        {
          id: 'calendar',
          label: 'Attendance Calendar',
          description: 'Monthly shift schedule',
          icon: Calendar,
        },
        {
          id: 'exceptions',
          label: 'Attendance Exceptions',
          description: 'Late & absence tracking',
          icon: AlertTriangle,
        },
        {
          id: 'corrections',
          label: 'Attendance Corrections',
          description: 'Adjustments & audits',
          icon: CheckCircle2,
        },
        {
          id: 'checkin',
          label: 'Kiosk Terminal',
          description: 'Punch In / Punch Out',
          icon: UserCheck,
        },
        {
          id: 'summary',
          label: 'Attendance Summary',
          description: 'Monthly hours summary',
          icon: FileText,
        },
        {
          id: 'overtime',
          label: 'Overtime Tracking',
          description: 'Overtime logs & approvals',
          icon: Clock,
        },
        {
          id: 'reports',
          label: 'Attendance Reports',
          description: 'Statutory export reports',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Directory, Audit & Statutory',
      badge: 'Official',
      adminOnly: false,
      submenus: [
        {
          id: 'emp_directory',
          label: 'Staff Directory Report',
          description: 'Active personnel directory',
          icon: Users,
        },
        {
          id: 'emp_details',
          label: 'Employee Dossier Report',
          description: 'Comprehensive personnel report',
          icon: FileText,
        },
        {
          id: 'att_daily',
          label: 'Daily Attendance Report',
          description: 'Arrivals & departures',
          icon: Clock,
        },
        {
          id: 'att_monthly',
          label: 'Monthly Attendance Report',
          description: 'Monthly time attendance',
          icon: Calendar,
        },
        {
          id: 'att_exceptions',
          label: 'Exceptions & Lateness',
          description: 'Tardiness & absences',
          icon: AlertTriangle,
        },
        {
          id: 'att_overtime',
          label: 'Overtime Report',
          description: 'Overtime hours & multiplier',
          icon: BarChart3,
        },
        {
          id: 'leave_on_leave',
          label: 'Staff on Leave Today',
          description: 'Current active leaves',
          icon: CalendarDays,
        },
        {
          id: 'leave_employee_info',
          label: 'Leave Balance Report',
          description: 'Statutory entitlement report',
          icon: Layers,
        },
      ],
    },
    {
      id: 'configuration',
      label: 'Configuration',
      icon: Settings,
      description: 'Company, Policies & RBAC',
      badge: 'Admin',
      adminOnly: true,
      submenus: [
        {
          id: 'company',
          label: 'Company Information',
          description: 'Legal name & registration',
          icon: Building2,
        },
        {
          id: 'departments',
          label: 'Departments',
          description: 'Organizational hierarchy',
          icon: Building2,
        },
        {
          id: 'positions',
          label: 'Positions & Job Titles',
          description: 'Job titles & grades',
          icon: Briefcase,
        },
        {
          id: 'leavetypes',
          label: 'Leave Types Setup',
          description: 'Statutory policy policies',
          icon: CalendarDays,
        },
        {
          id: 'holidays',
          label: 'Public Holidays',
          description: 'Ethiopian statutory holidays',
          icon: Calendar,
        },
        {
          id: 'shifts',
          label: 'Working Hours & Shifts',
          description: 'Operational shift rules',
          icon: Clock,
        },
        {
          id: 'users',
          label: 'User Roles & Access',
          description: 'RBAC user management',
          icon: ShieldCheck,
        },
        {
          id: 'audit',
          label: 'Security Audit Log',
          description: 'Tamper-evident logs',
          icon: History,
        },
        {
          id: 'cloud',
          label: 'Cloud & Database',
          description: 'Firestore synchronization',
          icon: Database,
        },
      ],
    },
  ];

  // Filter navigation items by role
  const activeNavItems =
    userRole === 'Employee'
      ? employeeNavItems
      : managementNavItems.filter((item) => !item.adminOnly || userRole === 'Administrator');

  /**
   * Handle parent module click:
   * 1. If module has no submenus -> navigate directly and collapse any open accordion
   * 2. If module has submenus and is already expanded -> collapse it
   * 3. If module has submenus and is collapsed -> expand it, collapse others (single-open), and navigate to module
   */
  const handleModuleClick = (item: MainNavMenuItem) => {
    const hasSubmenus = Boolean(item.submenus && item.submenus.length > 0);

    if (!hasSubmenus) {
      // Direct destination
      setExpandedModuleId(null);
      onNavigate(item.id);
      onCloseMobile?.();
      return;
    }

    if (expandedModuleId === item.id) {
      // Toggle collapse on same expanded item
      setExpandedModuleId(null);
    } else {
      // Single-open accordion: open clicked one, close others
      setExpandedModuleId(item.id);
      if (currentNav !== item.id) {
        onNavigate(item.id);
      }
    }
  };

  /**
   * Handle submenu item click: navigates to parent module with specific subTab
   */
  const handleSubmenuClick = (moduleId: MainNavId, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(moduleId, subId);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Left-Side Accordion Sidebar */}
      <aside
        aria-label="Sidebar Navigation"
        className={`fixed md:sticky top-16 left-0 z-40 md:z-20 w-64 bg-[#082836] border-r border-[#0E3D52] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out select-none shadow-xl md:shadow-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Scrollable Navigation Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#186382] scrollbar-track-[#082836]">
          {/* Mobile Header with Close Button */}
          <div className="md:hidden p-3.5 border-b border-[#0E3D52] flex items-center justify-between bg-[#051C26]">
            <EthioReLogo size="sm" variant="full" theme="dark" />
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#186382] transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-3 px-3 space-y-2.5">
            {/* Section Category Title */}
            <div className="px-2 pt-1 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#E2BE6C]">
                {userRole === 'Employee' ? 'Self-Service Space' : 'Enterprise Modules'}
              </p>
              <span className="text-[9px] font-mono text-slate-400">
                {activeNavItems.length} Modules
              </span>
            </div>

            {/* Accordion Menu List */}
            <nav className="space-y-1" aria-label="Main Navigation">
              {activeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentNav === item.id;
                const hasSubmenus = Boolean(item.submenus && item.submenus.length > 0);
                const isExpanded = expandedModuleId === item.id;
                const isRestricted = item.adminOnly && userRole !== 'Administrator';

                return (
                  <div key={item.id} className="rounded-xl overflow-hidden transition-all duration-200">
                    {/* Main Module Parent Item */}
                    <button
                      type="button"
                      id={`nav-item-${item.id}`}
                      aria-expanded={hasSubmenus ? isExpanded : undefined}
                      aria-controls={hasSubmenus ? `submenu-${item.id}` : undefined}
                      onClick={() => handleModuleClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#CCA352] ${
                        isActive
                          ? 'bg-[#186382] text-white border-l-4 border-[#CCA352] shadow-sm'
                          : isExpanded
                          ? 'bg-[#0E3D52] text-white border-l-4 border-[#CCA352]/80 shadow-xs ring-1 ring-[#CCA352]/20'
                          : 'text-slate-300 hover:bg-[#186382]/40 hover:text-white border-l-4 border-transparent'
                      } ${isRestricted ? 'opacity-70' : ''}`}
                    >
                      <div className="flex items-center space-x-3 text-left truncate min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                            isActive || isExpanded ? 'text-[#CCA352]' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <div className="truncate">
                          <div
                            className={`truncate ${
                              isActive || isExpanded
                                ? 'font-bold text-white'
                                : 'font-semibold text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {/* Right Indicator: Count Badge + Chevron Toggle */}
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.adminOnly
                                ? 'bg-[#0E3D52] text-[#E2BE6C] border border-[#CCA352]/40'
                                : 'bg-[#0E3D52] text-[#E2BE6C] border border-[#CCA352]/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {hasSubmenus && (
                          <span
                            className="p-1 text-slate-400 group-hover:text-slate-200 transition-colors"
                            aria-hidden="true"
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-in-out ${
                                isExpanded
                                  ? 'rotate-90 text-[#CCA352]'
                                  : 'rotate-0 text-slate-400'
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Submenu Accordion Panel (Rendered directly beneath the parent module) */}
                    {hasSubmenus && item.submenus && (
                      <div
                        id={`submenu-${item.id}`}
                        role="region"
                        aria-labelledby={`nav-item-${item.id}`}
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isExpanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden pl-2 pr-1">
                          <div className="pt-1.5 pb-2 space-y-1 border-l-2 border-[#186382]/60 ml-3.5 pl-2.5">
                            {item.submenus.map((sub, sIdx) => {
                              const SubIcon = sub.icon;
                              // Submenu is active if parent is active and this subTab is selected
                              const isSubActive =
                                currentNav === item.id &&
                                (activeSubTab === sub.id || (!activeSubTab && sIdx === 0));

                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => handleSubmenuClick(item.id, sub.id, e)}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all duration-150 cursor-pointer group/sub focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#CCA352] ${
                                    isSubActive
                                      ? 'bg-[#CCA352]/20 text-[#E2BE6C] font-bold border border-[#CCA352]/40 shadow-2xs'
                                      : 'text-slate-300 hover:text-white hover:bg-[#186382]/40 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate min-w-0">
                                    {SubIcon ? (
                                      <SubIcon
                                        className={`w-3.5 h-3.5 shrink-0 transition-colors duration-150 ${
                                          isSubActive
                                            ? 'text-[#CCA352]'
                                            : 'text-slate-400 group-hover/sub:text-slate-200'
                                        }`}
                                      />
                                    ) : (
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          isSubActive ? 'bg-[#CCA352]' : 'bg-slate-500'
                                        }`}
                                      />
                                    )}
                                    <div className="truncate">
                                      <div className="truncate text-[11px] leading-tight">
                                        {sub.label}
                                      </div>
                                      {sub.description && (
                                        <div className="text-[9px] text-slate-400 truncate font-normal">
                                          {sub.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {sub.badge !== undefined && sub.badge !== null && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#0E3D52] text-[#E2BE6C] ml-1 shrink-0">
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Corporate Role Notice & Security Footer */}
        <div className="p-3.5 border-t border-[#0E3D52] bg-[#051C26]/90 text-xs shrink-0">
          <div className="flex items-start space-x-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-[#CCA352] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight truncate">
              <p className="font-bold text-slate-200">Ethiopian Reinsurance S.C.</p>
              <p className="text-[#E2BE6C] text-[10px] font-medium mt-0.5">Enterprise HRMS</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {userRole === 'Administrator'
                  ? '• Administrator privilege'
                  : userRole === 'HR Admin'
                  ? '• HR Operations authorized'
                  : '• Staff self-service verified'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
