import {
  Users,
  CalendarDays,
  Clock,
  AlertCircle,
  Briefcase,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  Printer,
} from 'lucide-react';
import { UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { EthioReLogo } from '../common/EthioReLogo';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface DashboardViewProps {
  userRole: UserRole;
  onNavigate: (module: 'employees' | 'leave' | 'attendance' | 'configuration', subTab?: string) => void;
  onOpenNewLeaveModal: () => void;
  onOpenNewEmployeeModal: () => void;
}

export const DashboardView = ({
  userRole,
  onNavigate,
  onOpenNewLeaveModal,
  onOpenNewEmployeeModal,
}: DashboardViewProps) => {
  const employees = storageService.getEmployees();
  const activeEmployees = employees.filter((e) => e.status === 'Active');
  const inactiveEmployees = employees.filter((e) => e.status === 'Inactive');

  const leaveRecords = storageService.getLeaveRecords();
  const totalLeaveDays = leaveRecords.reduce((acc, l) => acc + l.days, 0);

  const today = new Date().toISOString().split('T')[0];
  const leavesToday = leaveRecords.filter(
    (l) => l.status !== 'Cancelled' && l.startDate <= today && l.endDate >= today
  );

  const attendanceRecords = storageService.getAttendanceRecords();
  const todayAttendance = attendanceRecords.filter((a) => a.date === today);
  const presentCount = todayAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;

  const overtimeRecords = storageService.getOvertimeRecords();
  const pendingOvertime = overtimeRecords.filter((o) => o.status === 'Pending');

  const holidays = storageService.getHolidays();
  const upcomingHolidays = holidays
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const departments = storageService.getDepartments();

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#186382] via-[#0E3D52] to-[#082836] rounded-xl p-6 border-b-2 border-amber-500 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-4">
          <EthioReLogo size="lg" variant="mark" theme="dark" className="hidden sm:flex shrink-0" />
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold tracking-wide">Ethiopian Reinsurance S.C. (EthioRe) HRMS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Operational HR Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Centralized management of Employee Master Data, Leave Entitlements, and Daily Attendance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewLeaveModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#082836] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold border border-amber-500/50 shadow-sm transition-all active:scale-[0.99]"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>Record Leave</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance', 'checkin')}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#082836] hover:bg-[#227D9E] text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Kiosk Check-In</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewEmployeeModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#082836] hover:bg-[#227D9E] text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Add Employee</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#082836] hover:bg-[#227D9E] text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <ReportPrintHeader
        title="Executive HR Operations Summary Report"
        subtitle="Workforce headcount, active leaves, and daily attendance status overview"
        filters={[
          { label: 'Report Date', value: today },
          { label: 'Total Workforce', value: `${employees.length} employees` },
          { label: 'Active Staff', value: `${activeEmployees.length} staff` },
        ]}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-[#186382] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Workforce
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#EBF3F7] text-[#186382] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{employees.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{activeEmployees.length} Active</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{inactiveEmployees.length} Inactive records</span>
            <span className="text-[#186382] font-semibold flex items-center group-hover:underline">
              View Directory <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance', 'register')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-[#186382] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today&apos;s Attendance
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{presentCount}</span>
            <span className="text-xs text-slate-500">/ {activeEmployees.length} Staff</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span className={lateCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
              {lateCount} Late arrivals
            </span>
            <span className="text-[#186382] font-semibold flex items-center group-hover:underline">
              Register <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* On Leave Today */}
        <div
          onClick={() => onNavigate('leave', 'records')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-[#186382] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              On Leave Today
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{leavesToday.length}</span>
            <span className="text-xs text-slate-500">Employees</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{leaveRecords.length} Records registered</span>
            <span className="text-[#186382] font-semibold flex items-center group-hover:underline">
              Leave Desk <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Pending Overtime & Actions */}
        <div
          onClick={() => onNavigate('attendance', 'overtime')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-[#186382] hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Overtime
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#EBF3F7] text-[#186382] flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{pendingOvertime.length}</span>
            <span className="text-xs text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Action Req.</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>1.5x / 2.0x Rates</span>
            <span className="text-[#186382] font-semibold flex items-center group-hover:underline">
              Review OT <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Recent Leave Records & Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Leave Records */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Leave Records</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('leave', 'records')}
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              View all ({leaveRecords.length}) →
            </button>
          </div>

          {leaveRecords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No leave records registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Leave applications and approved entitlements will appear here.</p>
              <button
                type="button"
                onClick={onOpenNewLeaveModal}
                className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>Record New Leave</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaveRecords.slice(0, 4).map((record) => {
                const emp = employees.find((e) => e.employeeId === record.employeeId);
                return (
                  <div key={record.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {emp?.photo ? (
                          <img
                            src={emp.photo}
                            alt={record.employeeName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          record.employeeName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{record.employeeName}</span>
                          <span className="text-[11px] font-mono text-slate-500">({record.employeeId})</span>
                          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {record.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{record.leaveType}</span> • {record.days} days ({record.startDate} to {record.endDate})
                        </div>
                        {record.reason && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                            "{record.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {record.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('leave', 'records')}
                        className="text-xs font-medium text-amber-600 hover:text-amber-800"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Ethiopian Holidays & Quick Structure */}
        <div className="space-y-6">
          {/* Upcoming Ethiopian Public Holidays */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Upcoming Holidays (Ethiopia)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">2026/2027</span>
            </div>

            <div className="space-y-2.5">
              {upcomingHolidays.map((hol) => (
                <div
                  key={hol.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{hol.name}</p>
                    <p className="text-[11px] text-amber-700">{hol.amharicName}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium font-mono text-[11px]">
                      {hol.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Departments ({departments.length})
                </h3>
              </div>
            </div>

            {departments.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">No departments configured yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('configuration', 'departments')}
                  className="text-xs text-[#186382] font-semibold hover:underline mt-1 inline-block"
                >
                  Configure departments →
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {departments.slice(0, 5).map((dept) => {
                  const count = employees.filter((e) => e.department === dept.name).length;
                  return (
                    <div key={dept.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-700 truncate max-w-[180px]">{dept.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {count} staff
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportPrintFooter />
    </div>
  );
};
