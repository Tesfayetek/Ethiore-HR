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
  UserCheck,
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

interface SidebarProps {
  currentNav: MainNavId;
  onNavigate: (nav: MainNavId) => void;
  userRole: UserRole;
  counts?: {
    totalEmployees: number;
    totalLeaves?: number;
    pendingLeaves?: number;
    pendingOvertime: number;
  };
}

export const Sidebar = ({
  currentNav,
  onNavigate,
  userRole,
  counts,
}: SidebarProps) => {
  // Navigation for Employee (Self-Service only)
  const employeeNavItems = [
    {
      id: 'my_portal' as MainNavId,
      label: 'My Staff Portal',
      icon: Sparkles,
      description: 'Profile, Leave & Timecard',
      badge: null,
      adminOnly: false,
    },
  ];

  // Navigation for Administrator and HR Admin
  const managementNavItems = [
    {
      id: 'dashboard' as MainNavId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
      badge: null,
      adminOnly: false,
    },
    {
      id: 'employees' as MainNavId,
      label: 'Employee Master Data',
      icon: Users,
      description: 'Directory & Import',
      badge: counts?.totalEmployees ? String(counts.totalEmployees) : null,
      adminOnly: false,
    },
    {
      id: 'leave' as MainNavId,
      label: 'Leave Management',
      icon: CalendarDays,
      description: 'Records, Balance, Calendar',
      badge: counts?.totalLeaves ? `${counts.totalLeaves} logged` : null,
      adminOnly: false,
    },
    {
      id: 'attendance' as MainNavId,
      label: 'Attendance',
      icon: Clock,
      description: 'Register, Kiosk, Overtime',
      badge: counts?.pendingOvertime ? `${counts.pendingOvertime} OT` : null,
      adminOnly: false,
    },
    {
      id: 'reports' as MainNavId,
      label: 'Reports',
      icon: FileText,
      description: 'Directory, Audit & Statutory',
      badge: 'Official',
      adminOnly: false, // Visible to Administrator & HR Admin, hidden for Employee
    },
    {
      id: 'configuration' as MainNavId,
      label: 'Configuration',
      icon: Settings,
      description: 'Company, Policies & RBAC',
      badge: 'Admin',
      adminOnly: true,
    },
  ];

  const activeNavItems =
    userRole === 'Employee'
      ? employeeNavItems
      : managementNavItems.filter((item) => !item.adminOnly || userRole === 'Administrator');

  return (
    <aside className="w-64 bg-[#082836] border-r border-[#0E3D52] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="py-4 px-3 space-y-3">
        {/* Official Brand Emblem in Sidebar */}
        <div className="px-2 pb-3 border-b border-[#0E3D52] flex items-center justify-between">
          <EthioReLogo size="sm" variant="full" theme="dark" />
        </div>

        <div className="px-3 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E2BE6C]">
            {userRole === 'Employee' ? 'Self-Service Space' : 'Enterprise Modules'}
          </p>
        </div>

        <nav className="space-y-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentNav === item.id;
            const isRestricted = item.adminOnly && userRole !== 'Administrator';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#186382] text-white border-l-4 border-[#CCA352] shadow-sm'
                    : 'text-slate-300 hover:bg-[#186382]/60 hover:text-white'
                } ${isRestricted ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center space-x-3 text-left truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#CCA352]' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className={`truncate ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-2">
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
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#CCA352] shrink-0" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Notice & Security Footer */}
      <div className="p-4 border-t border-[#0E3D52] bg-[#051C26]/80 text-xs">
        <div className="flex items-start space-x-2 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-[#CCA352] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <p className="font-bold text-slate-200">Ethiopian Reinsurance S.C.</p>
            <p className="text-[#E2BE6C] text-[10px] font-medium mt-0.5">Enterprise HRMS</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {userRole === 'Administrator'
                ? '• Full admin & config privileges'
                : userRole === 'HR Admin'
                ? '• Authorized HR Admin operations'
                : '• Employee self-service verified'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
