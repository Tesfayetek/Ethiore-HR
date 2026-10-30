import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building,
  Users,
  Layers,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';
import { LeaveRecord, LeaveBalance } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface LeaveReportsTabProps {
  leaveRecords: LeaveRecord[];
  leaveBalances: LeaveBalance[];
}

type ReportType =
  | 'employee'
  | 'department'
  | 'leaveType'
  | 'balance'
  | 'history'
  | 'monthly';

export const LeaveReportsTab: React.FC<LeaveReportsTabProps> = ({
  leaveRecords,
  leaveBalances,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('employee');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const employees = storageService.getEmployees();
  const departments = storageService.getDepartments();
  const leaveTypes = storageService.getLeaveTypes();

  // Active leave records (non-cancelled)
  const validRecords = useMemo(
    () => leaveRecords.filter((l) => l.status !== 'Cancelled'),
    [leaveRecords]
  );

  // 1. Employee Leave Report
  const employeeReportData = useMemo(() => {
    return employees
      .map((emp) => {
        const empLeaves = validRecords.filter((l) => l.employeeId === emp.employeeId);
        const totalDays = empLeaves.reduce((acc, curr) => acc + curr.days, 0);
        const balances = leaveBalances.filter((b) => b.employeeId === emp.employeeId);
        const totalEntitled = balances.reduce((acc, b) => acc + b.entitled, 0);
        const totalRemaining = balances.reduce((acc, b) => acc + b.remaining, 0);

        return {
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          department: emp.department,
          position: emp.position,
          status: emp.status,
          recordsCount: empLeaves.length,
          totalDaysTaken: totalDays,
          totalEntitled,
          totalRemaining,
        };
      })
      .filter((row) => {
        const q = searchQuery.toLowerCase();
        return (
          row.employeeId.toLowerCase().includes(q) ||
          row.employeeName.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q)
        );
      });
  }, [employees, validRecords, leaveBalances, searchQuery]);

  // 2. Department Leave Report
  const departmentReportData = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept.name);
      const deptEmpIds = new Set(deptEmployees.map((e) => e.employeeId));
      const deptLeaves = validRecords.filter((l) => deptEmpIds.has(l.employeeId));
      const totalDays = deptLeaves.reduce((acc, curr) => acc + curr.days, 0);
      const avgDaysPerEmp =
        deptEmployees.length > 0 ? (totalDays / deptEmployees.length).toFixed(1) : '0';

      return {
        departmentName: dept.name,
        manager: dept.headOfDepartment,
        staffCount: deptEmployees.length,
        leavesCount: deptLeaves.length,
        totalDaysTaken: totalDays,
        avgDaysPerEmployee: avgDaysPerEmp,
      };
    });
  }, [departments, employees, validRecords]);

  // 3. Leave Type Report
  const leaveTypeReportData = useMemo(() => {
    return leaveTypes.map((lt) => {
      const recordsOfType = validRecords.filter((l) => l.leaveType === lt.name);
      const totalDays = recordsOfType.reduce((acc, curr) => acc + curr.days, 0);
      const uniqueEmployees = new Set(recordsOfType.map((l) => l.employeeId)).size;

      return {
        leaveTypeName: lt.name,
        defaultDays: lt.defaultDays,
        statutoryRule: lt.description,
        filingsCount: recordsOfType.length,
        uniqueStaffCount: uniqueEmployees,
        totalDaysUtilized: totalDays,
      };
    });
  }, [leaveTypes, validRecords]);

  // 4. Leave Balance Report
  const balanceReportData = useMemo(() => {
    return leaveBalances
      .map((bal) => {
        const emp = employees.find((e) => e.employeeId === bal.employeeId);
        const bd = bal.carryForwardBreakdown;
        return {
          employeeId: bal.employeeId,
          employeeName: bal.employeeName || emp?.fullName || bal.employeeId,
          department: emp?.department || 'N/A',
          leaveType: bal.leaveType,
          entitled: bd?.currentYearEntitlement ?? bal.currentYearEntitlement ?? bal.entitled,
          taken: bd?.currentYearUsed ?? bal.currentYearUsed ?? bal.taken,
          remaining: bd?.availableAnnualLeave ?? bal.availableAnnualLeave ?? bal.remaining,
          currentLeaveYear: bd?.currentLeaveYear ?? bal.currentLeaveYear ?? 2026,
          previousYearUnused: bd?.previousYearUnused ?? bal.previousYearUnused ?? 0,
          secondPreviousYearUnused: bd?.secondPreviousYearUnused ?? bal.secondPreviousYearUnused ?? 0,
          totalEligibleCarryForward: bd?.totalEligibleCarryForward ?? bal.totalEligibleCarryForward ?? 0,
          expiredOlderLeave: bd?.expiredOlderLeave ?? bal.expiredOlderLeave ?? 0,
          carryForwardBreakdown: bd,
        };
      })
      .filter((row) => {
        const q = searchQuery.toLowerCase();
        return (
          row.employeeId.toLowerCase().includes(q) ||
          row.employeeName.toLowerCase().includes(q) ||
          row.leaveType.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q)
        );
      });
  }, [leaveBalances, employees, searchQuery]);

  // 5. Leave History Report
  const historyReportData = useMemo(() => {
    return [...leaveRecords]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      });
  }, [leaveRecords, searchQuery]);

  // 6. Monthly Leave Summary
  const monthlySummaryData = useMemo(() => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return months.map((monthName, idx) => {
      const monthPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const recordsInMonth = validRecords.filter((l) =>
        l.startDate.startsWith(monthPrefix)
      );
      const totalDays = recordsInMonth.reduce((acc, curr) => acc + curr.days, 0);
      const uniqueEmployees = new Set(recordsInMonth.map((l) => l.employeeId)).size;

      return {
        month: monthName,
        monthPrefix,
        year: selectedYear,
        totalLeaves: recordsInMonth.length,
        totalDays,
        employeesOnLeave: uniqueEmployees,
      };
    });
  }, [validRecords, selectedYear]);

  const currentUser = storageService.getCurrentUser();
  const isAdministrator = currentUser?.role === 'Administrator';

  // Administrator-Only Print
  const handlePrint = () => {
    storageService.triggerPrint({
      reportType: `Leave Management - ${selectedReport.toUpperCase()} Report`,
      customTitle: `Statutory & Operational Leave Report (${selectedReport})`,
    });
  };

  // Administrator-Only CSV Export
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (selectedReport === 'employee') {
      headers = ['Employee ID', 'Employee Name', 'Department', 'Position', 'Status', 'Records Count', 'Total Days Taken', 'Entitled Days', 'Remaining Days'];
      rows = employeeReportData.map((r) => [
        r.employeeId,
        r.employeeName,
        r.department,
        r.position,
        r.status,
        r.recordsCount,
        r.totalDaysTaken,
        r.totalEntitled,
        r.totalRemaining,
      ]);
    } else if (selectedReport === 'department') {
      headers = ['Department Name', 'Manager', 'Staff Count', 'Leaves Recorded', 'Total Days Taken', 'Average Days Per Employee'];
      rows = departmentReportData.map((r) => [
        r.departmentName,
        r.manager,
        r.staffCount,
        r.leavesCount,
        r.totalDaysTaken,
        r.avgDaysPerEmployee,
      ]);
    } else if (selectedReport === 'leaveType') {
      headers = ['Leave Type Name', 'Default Days', 'Statutory Rule', 'Filings Count', 'Unique Staff Count', 'Total Days Utilized'];
      rows = leaveTypeReportData.map((r) => [
        r.leaveTypeName,
        r.defaultDays,
        r.statutoryRule,
        r.filingsCount,
        r.uniqueStaffCount,
        r.totalDaysUtilized,
      ]);
    } else if (selectedReport === 'balance') {
      headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Leave Type',
        'Current Leave Year',
        'Current Entitlement',
        'Prev Year Unused (N-1)',
        'Second Prev Unused (N-2)',
        'Total Eligible Carry Forward',
        'Current Year Used',
        'Total Available Days',
        'Expired Older Days',
      ];
      rows = balanceReportData.map((r) => [
        r.employeeId,
        r.employeeName,
        r.department,
        r.leaveType,
        r.currentLeaveYear,
        r.entitled,
        r.previousYearUnused,
        r.secondPreviousYearUnused,
        r.totalEligibleCarryForward,
        r.taken,
        r.remaining,
        r.expiredOlderLeave,
      ]);
    } else if (selectedReport === 'history') {
      headers = ['Leave ID', 'Employee ID', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Created By', 'Created Date'];
      rows = historyReportData.map((r) => [
        r.id,
        r.employeeId,
        r.employeeName,
        r.department,
        r.leaveType,
        r.startDate,
        r.endDate,
        r.days,
        r.status,
        r.reason,
        r.createdBy,
        r.createdDate,
      ]);
    } else if (selectedReport === 'monthly') {
      headers = ['Month', 'Year', 'Total Leaves Logged', 'Total Days Taken', 'Unique Staff on Leave'];
      rows = monthlySummaryData.map((r) => [
        r.month,
        r.year,
        r.totalLeaves,
        r.totalDays,
        r.employeesOnLeave,
      ]);
    }

    storageService.exportDataToCsv({
      filename: `EthioRe_${selectedReport}_leave_report_${new Date().toISOString().split('T')[0]}.csv`,
      headers,
      rows,
      reportType: `Leave ${selectedReport.toUpperCase()} Report`,
    });
  };

  const reportButtons: { id: ReportType; label: string; icon: any }[] = [
    { id: 'employee', label: 'Employee Leave Report', icon: Users },
    { id: 'department', label: 'Department Leave Report', icon: Building },
    { id: 'leaveType', label: 'Leave Type Report', icon: Layers },
    { id: 'balance', label: 'Leave Balance Report', icon: BarChart3 },
    { id: 'history', label: 'Leave History Report', icon: Calendar },
    { id: 'monthly', label: 'Monthly Leave Summary', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner and Report Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>5.5 Statutory & Operational Leave Reports</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              6 Modules
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready reporting conforming to Ethiopian Reinsurance operations and Ministry of Labor oversight.
          </p>
        </div>

        {isAdministrator && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Export active report to CSV (Administrator Only)"
            >
              <Download className="w-3.5 h-3.5 text-[#186382]" />
              <span>Export Active Report</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Print active leave report (Administrator Only)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
          </div>
        )}
      </div>

      {/* 6 Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {reportButtons.map((btn) => {
          const Icon = btn.icon;
          const isSelected = selectedReport === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedReport(btn.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
              </div>
              <span className="text-xs font-medium leading-tight">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters (Search and Year where applicable) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative grow max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report records..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {selectedReport === 'monthly' && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-medium">Reporting Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        )}
      </div>

      {/* REPORT 1: EMPLOYEE LEAVE REPORT */}
      {selectedReport === 'employee' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Employee Leave Consumption & Entitlements Report"
            subtitle="Centralized workforce leave balances and statutory entitlement utilization"
            filters={searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []}
            recordCount={employeeReportData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Employee Leave Consumption & Entitlements
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {employeeReportData.length} employees listed
              </span>
            </div>
            {employeeReportData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-sm text-slate-700">No records found matching the selected report criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting the search filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Position</th>
                      <th className="p-3 text-center">Leaves Recorded</th>
                      <th className="p-3 text-center">Total Days Taken</th>
                      <th className="p-3 text-center">Total Entitled</th>
                      <th className="p-3 text-center">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeReportData.map((row) => (
                      <tr key={row.employeeId} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-amber-900">{row.employeeId}</td>
                        <td className="p-3 font-bold text-slate-900">{row.employeeName}</td>
                        <td className="p-3 text-slate-700">{row.department}</td>
                        <td className="p-3 text-slate-600">{row.position}</td>
                        <td className="p-3 text-center font-mono">{row.recordsCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700">
                          {row.totalDaysTaken} days
                        </td>
                        <td className="p-3 text-center font-mono">{row.totalEntitled} days</td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {row.totalRemaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* REPORT 2: DEPARTMENT LEAVE REPORT */}
      {selectedReport === 'department' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Departmental Absence & Leave Utilization Report"
            subtitle="Department-level absence metrics, total working days absent, and staffing impacts"
            recordCount={departmentReportData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Departmental Absence & Leave Utilization
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {departmentReportData.length} departments
              </span>
            </div>
            {departmentReportData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-sm text-slate-700">No records found matching the selected report criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Department</th>
                      <th className="p-3">Department Head</th>
                      <th className="p-3 text-center">Staff Count</th>
                      <th className="p-3 text-center">Leaves Recorded</th>
                      <th className="p-3 text-center">Total Working Days Away</th>
                      <th className="p-3 text-center">Avg Days / Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentReportData.map((row) => (
                      <tr key={row.departmentName} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.departmentName}</td>
                        <td className="p-3 text-slate-600">{row.manager}</td>
                        <td className="p-3 text-center font-mono">{row.staffCount}</td>
                        <td className="p-3 text-center font-mono">{row.leavesCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-800">
                          {row.totalDaysTaken} days
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-700">
                          {row.avgDaysPerEmployee} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* REPORT 3: LEAVE TYPE REPORT */}
      {selectedReport === 'leaveType' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Leave Classification & Frequency Analysis Report"
            subtitle="Breakdown of leave categories under Ethiopian Labor Proclamation No. 1156/2019"
            recordCount={leaveTypeReportData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Leave Classification & Frequency Analysis
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {leaveTypeReportData.length} leave types
              </span>
            </div>
            {leaveTypeReportData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-sm text-slate-700">No records found matching the selected report criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Statutory Basis</th>
                      <th className="p-3 text-center">Default Entitlement</th>
                      <th className="p-3 text-center">Recorded Incidents</th>
                      <th className="p-3 text-center">Beneficiary Staff</th>
                      <th className="p-3 text-center">Total Days Utilized</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaveTypeReportData.map((row) => (
                      <tr key={row.leaveTypeName} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.leaveTypeName}</td>
                        <td className="p-3 text-slate-600 text-[11px] max-w-xs">{row.statutoryRule}</td>
                        <td className="p-3 text-center font-mono">{row.defaultDays} days</td>
                        <td className="p-3 text-center font-mono">{row.filingsCount}</td>
                        <td className="p-3 text-center font-mono">{row.uniqueStaffCount}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-800">
                          {row.totalDaysUtilized} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* REPORT 4: LEAVE BALANCE REPORT */}
      {selectedReport === 'balance' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Comprehensive Staff Leave Balances Report"
            subtitle="Current statutory balance entitlement, days taken, and outstanding days per staff member"
            filters={searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []}
            recordCount={balanceReportData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Comprehensive Staff Leave Balances
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {balanceReportData.length} records
              </span>
            </div>
            {balanceReportData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-sm text-slate-700">No records found matching the selected report criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting the search filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3 text-center">Entitled Days</th>
                      <th className="p-3 text-center">Eligible Carry-Fwd</th>
                      <th className="p-3 text-center">Used Days</th>
                      <th className="p-3 text-center">Available Balance</th>
                      <th className="p-3 text-center">Expired (&gt;2 yrs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {balanceReportData.map((row, idx) => (
                      <tr key={`${row.employeeId}-${row.leaveType}-${idx}`} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-amber-900">{row.employeeId}</td>
                        <td className="p-3 font-bold text-slate-900">{row.employeeName}</td>
                        <td className="p-3 text-slate-700">{row.department}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          <span>{row.leaveType}</span>
                          {row.leaveType === 'Annual Leave' && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-[#186382]/10 text-[#186382] font-bold">
                              2-Yr Policy
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">{row.entitled}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          {row.leaveType === 'Annual Leave' ? `+${row.totalEligibleCarryForward}d` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-700">{row.taken}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">
                            {row.remaining} d
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-[11px]">
                          {row.expiredOlderLeave > 0 ? (
                            <span className="text-rose-600 font-bold" title="Expired older leave beyond 2 years excluded">
                              {row.expiredOlderLeave} d
                            </span>
                          ) : (
                            <span className="text-slate-400">0 d</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* REPORT 5: LEAVE HISTORY REPORT */}
      {selectedReport === 'history' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Chronological Leave Audit History Report"
            subtitle="Complete operational audit trail of all approved and historical leave movements"
            filters={searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []}
            recordCount={historyReportData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Chronological Leave Audit History
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {historyReportData.length} historical entries
              </span>
            </div>
            {historyReportData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-sm text-slate-700">No records found matching the selected report criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting the search filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Leave ID</th>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Period</th>
                      <th className="p-3 text-center">Days</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyReportData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-amber-900">{row.id}</td>
                        <td className="p-3 font-mono text-slate-700">{row.employeeId}</td>
                        <td className="p-3 font-bold text-slate-900">{row.employeeName}</td>
                        <td className="p-3 text-slate-700">{row.department}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.leaveType}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {row.startDate} → {row.endDate}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-800">{row.days}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={row.reason}>
                          {row.reason}
                        </td>
                        <td className="p-3 text-slate-600">{row.createdBy || 'HR Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* REPORT 6: MONTHLY LEAVE SUMMARY */}
      {selectedReport === 'monthly' && (
        <div className="space-y-4">
          <ReportPrintHeader
            title="Monthly Absence Trajectory Report"
            subtitle="Annualized aggregation of monthly leave requests and staff days away"
            filters={[{ label: 'Reporting Year', value: selectedYear.toString() }]}
            recordCount={monthlySummaryData.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Monthly Absence Trajectory ({selectedYear})
              </h3>
              <span className="text-xs text-slate-500 font-mono">12 Months</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Calendar Month</th>
                    <th className="p-3 text-center">Leaves Logged</th>
                    <th className="p-3 text-center">Total Working Days Absent</th>
                    <th className="p-3 text-center">Distinct Employees on Leave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlySummaryData.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{row.month}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700">
                        {row.totalLeaves}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-800">
                        {row.totalDays} working days
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700">
                        {row.employeesOnLeave}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ReportPrintFooter />
        </div>
      )}
    </div>
  );
};
