import { useState } from 'react';
import {
  X,
  User,
  CalendarDays,
  Clock,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { Employee } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeDetailModal = ({
  employee,
  isOpen,
  onClose,
  onEdit,
}: EmployeeDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'leaves' | 'attendance'>('profile');

  if (!isOpen || !employee) return null;

  // Retrieve employee leave records
  const allLeaves = storageService.getLeaveRecords();
  const employeeLeaves = allLeaves.filter((l) => l.employeeId === employee.employeeId);

  // Retrieve employee leave balances
  const balances = storageService.getEmployeeLeaveBalances(employee.employeeId);

  // Retrieve employee attendance records
  const allAttendance = storageService.getAttendanceRecords();
  const employeeAttendance = allAttendance.filter((a) => a.employeeId === employee.employeeId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500 no-print">
          <div className="flex items-center space-x-4">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-800 text-amber-400 border-2 border-amber-500 flex items-center justify-center font-bold text-lg shadow-md">
                {employee.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{employee.fullName}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    employee.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {employee.status}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">{employee.position}</p>
              <p className="text-xs text-amber-300 font-mono mt-0.5">
                {employee.employeeId} • {employee.department}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#082836] hover:bg-[#227D9E] text-white border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="px-3.5 py-1.5 bg-[#227D9E] hover:bg-[#1A4F8B] text-white border border-amber-500/40 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer"
            >
              Edit Details
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#227D9E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-medium no-print">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-amber-500 text-[#186382] font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            <span>Profile & Employment Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'leaves'
                ? 'border-amber-500 text-[#186382] font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-amber-600" />
            <span>Leave History & Balance ({employeeLeaves.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-amber-500 text-[#186382] font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Attendance Records ({employeeAttendance.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          <ReportPrintHeader
            title={`Employee Personnel Dossier: ${employee.fullName}`}
            subtitle={`ID: ${employee.employeeId} • ${employee.department} • Position: ${employee.position}`}
            filters={[
              { label: 'Status', value: employee.status },
              { label: 'Employment Type', value: employee.employmentType },
              { label: 'Work Location', value: employee.workLocation },
            ]}
          />
          {/* TAB 1: Profile Overview */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card with 120x120px photo and Official Leave Balance */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* 120x120 px responsive photo display per Requirement #8 */}
                <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border-2 border-amber-500/60 bg-slate-100 shadow-xs shrink-0 flex items-center justify-center">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={employee.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#186382]/10 text-[#186382] flex flex-col items-center justify-center font-bold">
                      <User className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-xs">{employee.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-base font-bold text-slate-900">{employee.fullName}</h3>
                      <span className="font-mono text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {employee.employeeId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {employee.position} • {employee.department}
                    </p>
                  </div>

                  {/* Prominent Official Leave Balance Card per Requirement #10 */}
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                        Leave Balance (Employee Master Data)
                      </span>
                      <div className="text-xl font-black text-amber-950 mt-0.5 font-mono">
                        {typeof employee.leaveBalance === 'number'
                          ? `${employee.leaveBalance} Days`
                          : `${balances.find((b) => b.leaveType === 'Annual Leave')?.remaining ?? 16} Days`}
                      </div>
                      <span className="text-[10px] text-amber-800">
                        Available leave entitlement directly synchronized with Employee Master record
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-amber-700" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block mb-1">Employment Details</span>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Type: <strong>{employee.employmentType}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Department: <strong>{employee.department}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Joined: <strong>{employee.employmentDate}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Supervisor: <strong>{employee.manager}</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block mb-1">Contact & Location</span>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Email: <strong>{employee.emailAddress}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Phone: <strong className="font-mono">{employee.phoneNumber}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Location: <strong>{employee.workLocation}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Gender: <strong>{employee.gender}</strong> • DOB: {employee.dateOfBirth}</span>
                  </div>
                </div>
              </div>

              {/* Status Advisory */}
              {employee.status === 'Inactive' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Inactive Employee Status:</strong>
                    <p className="mt-0.5">
                      This staff member is deactivated. In accordance with system policy, inactive employees
                      cannot be selected for new leave applications or biometric attendance entries.
                      Historical records remain strictly preserved.
                    </p>
                  </div>
                </div>
              )}

              {/* Leave Entitlements Summary */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#186382]" />
                    <span>Statutory Leave Entitlements & Balances</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">{balances.length} categories</span>
                </div>
                {balances.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No leave balance records initialized for this profile.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {balances.map((b) => (
                      <div key={b.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700 block truncate text-[11px]">{b.leaveType}</span>
                        <div className="mt-1 flex items-baseline space-x-1">
                          <span className="text-base font-bold text-emerald-700 font-mono">{b.remaining}</span>
                          <span className="text-[10px] text-slate-500">/ {b.entitled} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance & Working Hours Summary */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#186382]" />
                    <span>Attendance & Timecard Log Summary</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">{employeeAttendance.length} records on file</span>
                </div>
                {employeeAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No attendance records logged for this employee.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Check In</th>
                          <th className="p-2">Check Out</th>
                          <th className="p-2">Hours</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeAttendance.slice(0, 5).map((att) => (
                          <tr key={att.id}>
                            <td className="p-2 font-mono">{att.date}</td>
                            <td className="p-2 font-mono text-emerald-700">{att.checkIn || '—'}</td>
                            <td className="p-2 font-mono text-slate-700">{att.checkOut || '—'}</td>
                            <td className="p-2 font-semibold">{att.workingHours > 0 ? `${att.workingHours}h` : '—'}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Employee Leave Records & Balances */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              {/* Leave Balances Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Leave Balance Summary
                </h4>
                {balances.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No balance records initialized.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {balances.map((bal) => (
                      <div key={bal.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-800 block truncate">{bal.leaveType}</span>
                        <div className="mt-2 flex items-baseline space-x-1">
                          <span className="text-xl font-bold text-amber-600">{bal.remaining}</span>
                          <span className="text-[10px] text-slate-500">/ {bal.entitled} days left</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                          <span>Used: {bal.taken} days</span>
                          <span>Entitled: {bal.entitled} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Records Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Leave History ({employeeLeaves.length})
                </h4>
                {employeeLeaves.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg">
                    No leave records found for this employee.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5">Leave Type</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Dates</th>
                          <th className="p-2.5">Reason</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeLeaves.map((leave) => (
                          <tr key={leave.id} className="hover:bg-slate-50/60">
                            <td className="p-2.5 font-medium text-slate-900">{leave.leaveType}</td>
                            <td className="p-2.5 font-bold text-slate-800">{leave.days} days</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
                              {leave.startDate} → {leave.endDate}
                            </td>
                            <td className="p-2.5 text-slate-600 max-w-[160px] truncate" title={leave.reason}>
                              {leave.reason}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  leave.status === 'Recorded'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : leave.status === 'Active'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : leave.status === 'Completed'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Employee Attendance Records */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Attendance Log ({employeeAttendance.length} records)
                </h4>
              </div>

              {employeeAttendance.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg">
                  No attendance records logged for this employee yet.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Check In</th>
                        <th className="p-2.5">Check Out</th>
                        <th className="p-2.5">Hours</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employeeAttendance.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-mono text-[11px] font-semibold text-slate-900">
                            {att.date}
                          </td>
                          <td className="p-2.5 font-mono text-emerald-700">{att.checkIn || '—'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{att.checkOut || '—'}</td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {att.workingHours > 0 ? `${att.workingHours}h` : '—'}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : att.status === 'Late'
                                  ? 'bg-amber-50 text-amber-700'
                                  : att.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px] truncate max-w-[140px]" title={att.notes}>
                            {att.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <ReportPrintFooter />
        </div>
      </div>
    </div>
  );
};
