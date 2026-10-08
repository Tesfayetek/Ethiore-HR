import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  User,
  Search,
  Filter,
  Download,
  Printer,
  Clock,
  Briefcase,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { LeaveRecord, Employee } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface LeaveHistoryTabProps {
  leaveRecords: LeaveRecord[];
  onViewRecord?: (record: LeaveRecord) => void;
}

export const LeaveHistoryTab: React.FC<LeaveHistoryTabProps> = ({
  leaveRecords,
  onViewRecord,
}) => {
  const employees = storageService.getEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === 'All') return null;
    return employees.find((e) => e.employeeId === selectedEmployeeId) || null;
  }, [selectedEmployeeId, employees]);

  // Leave balances for selected employee
  const employeeBalances = useMemo(() => {
    if (!selectedEmployeeId || selectedEmployeeId === 'All') return [];
    return storageService.getEmployeeLeaveBalances(selectedEmployeeId);
  }, [selectedEmployeeId]);

  // Filtered records
  const historyList = useMemo(() => {
    return leaveRecords
      .filter((rec) => {
        const matchesEmployee =
          selectedEmployeeId === 'All' || rec.employeeId === selectedEmployeeId;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          rec.employeeName.toLowerCase().includes(q) ||
          rec.employeeId.toLowerCase().includes(q) ||
          rec.leaveType.toLowerCase().includes(q) ||
          rec.reason.toLowerCase().includes(q) ||
          rec.id.toLowerCase().includes(q);

        return matchesEmployee && matchesSearch;
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [leaveRecords, selectedEmployeeId, searchQuery]);

  // Statistics for the employee
  const totalEmployeeDaysTaken = useMemo(() => {
    return historyList.reduce((acc, r) => acc + r.days, 0);
  }, [historyList]);

  const handleExportCSV = () => {
    const title = selectedEmployee
      ? `${selectedEmployee.fullName}_${selectedEmployee.employeeId}_Leave_History`
      : 'EthioRe_Company_Leave_History';
    const header =
      'Leave ID,Employee ID,Employee Name,Department,Leave Type,Start Date,End Date,Days,Reason,Status,Created By,Created Date\n';
    const rows = historyList
      .map(
        (r) =>
          `"${r.id}","${r.employeeId}","${r.employeeName}","${r.department}","${r.leaveType}","${r.startDate}","${r.endDate}",${r.days},"${r.reason.replace(/"/g, '""')}","${r.status}","${r.createdBy}","${r.createdDate}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header and Employee Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>5.3 Leave History Ledger</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              {historyList.length} historical records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Display all past and current leave records for each employee across their entire tenure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Employee dropdown selector */}
          <div className="w-64">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              <option value="All">All Employees (Company Ledger)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employeeId}>
                  {e.employeeId} - {e.fullName} ({e.department})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Selected Employee Card Banner (if single employee selected) */}
      {selectedEmployee && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3.5">
              {selectedEmployee.photo ? (
                <img
                  src={selectedEmployee.photo}
                  alt={selectedEmployee.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#186382] text-amber-300 font-bold text-base flex items-center justify-center border-2 border-amber-400 shadow-xs shrink-0">
                  {selectedEmployee.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedEmployee.fullName}
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {selectedEmployee.employeeId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      selectedEmployee.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-3">
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedEmployee.department}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedEmployee.position}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined: {selectedEmployee.joinDate}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total Leaves Logged
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {historyList.length} events
                </span>
              </div>
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Total Days Taken
                </span>
                <span className="font-mono font-bold text-amber-900 text-sm">
                  {totalEmployeeDaysTaken} days
                </span>
              </div>
            </div>
          </div>

          {/* Current Remaining Balances Grid for Employee */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Current Balances for {selectedEmployee.fullName}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {employeeBalances.map((bal) => (
                <div
                  key={bal.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60"
                >
                  <span className="font-semibold text-slate-800 block truncate">
                    {bal.leaveType}
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-mono font-bold text-amber-800">
                      {bal.remaining} d
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Used {bal.taken} of {bal.entitled}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leave history by ID, employee, type, or reason..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Chronological History Table */}
      <ReportPrintHeader
        title="Chronological Leave Movement & History Report"
        subtitle="Historical audit log of workforce leaves, entitlement changes, and durations"
        filters={[
          ...(selectedEmployeeId !== 'All' ? [{ label: 'Employee', value: selectedEmployee?.fullName || selectedEmployeeId }] : []),
          ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
        ]}
        recordCount={historyList.length}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Leave ID</th>
                {selectedEmployeeId === 'All' && (
                  <>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Department</th>
                  </>
                )}
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4 text-center">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedEmployeeId === 'All' ? 11 : 8}
                    className="py-10 text-center text-slate-400"
                  >
                    No historical leave records found for this view.
                  </td>
                </tr>
              ) : (
                historyList.map((rec) => {
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onViewRecord?.(rec)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        {rec.id}
                      </td>

                      {selectedEmployeeId === 'All' && (
                        <>
                          <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                            {rec.employeeId}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {rec.employeeName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {rec.department}
                          </td>
                        </>
                      )}

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {rec.leaveType}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec.startDate}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {rec.endDate}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-800">
                        {rec.days}
                      </td>

                      <td
                        className="py-3 px-4 text-slate-600 max-w-[200px] truncate"
                        title={rec.reason}
                      >
                        {rec.reason}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rec.status === 'Recorded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.status === 'Active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : rec.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {rec.createdBy || 'HR Admin'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {rec.createdDate || rec.appliedDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportPrintFooter />
    </div>
  );
};
