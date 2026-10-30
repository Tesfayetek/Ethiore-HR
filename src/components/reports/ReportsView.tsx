import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Search,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  Employee,
  LeaveRecord,
  AttendanceRecord,
  UserRole,
  Department,
  LeaveBalance,
} from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { ethioReTheme } from '../../theme/colors';

export type ReportCategory = 'employee' | 'attendance' | 'leave';

export type ReportId =
  // Employee Reports
  | 'emp_directory'
  | 'emp_details'
  | 'emp_department'
  | 'emp_position'
  // Attendance Reports
  | 'att_daily'
  | 'att_monthly'
  | 'att_employee'
  | 'att_department'
  | 'att_late'
  | 'att_absence'
  | 'att_exceptions'
  | 'att_corrections'
  // Leave Reports
  | 'leave_on_leave'
  | 'leave_employee_info';

interface ReportsViewProps {
  userRole: UserRole;
  initialReportId?: ReportId;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  userRole,
  initialReportId = 'emp_directory',
}) => {
  // Master Data
  const employees = storageService.getEmployees();
  const departments = storageService.getDepartments();
  const attendanceRecords = storageService.getAttendanceRecords();
  const leaveRecords = storageService.getLeaveRecords();
  const leaveBalances = storageService.getLeaveBalances();

  // State
  const [selectedReport, setSelectedReport] = useState<ReportId>(initialReportId);

  useEffect(() => {
    if (initialReportId) {
      setSelectedReport(initialReportId);
    }
  }, [initialReportId]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('2026-09-01');
  const [dateTo, setDateTo] = useState<string>('2026-09-30');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const reportDefinitions: Array<{
    id: ReportId;
    category: ReportCategory;
    title: string;
    description: string;
  }> = [
    // Employee Reports
    {
      id: 'emp_directory',
      category: 'employee',
      title: 'Employee Directory Report',
      description: 'Comprehensive roster of active and inactive Ethiopian Reinsurance staff.',
    },
    {
      id: 'emp_details',
      category: 'employee',
      title: 'Employee Detailed Master Report',
      description: 'In-depth profile records including work location, supervisor, and contacts.',
    },
    {
      id: 'emp_department',
      category: 'employee',
      title: 'Employee by Department Report',
      description: 'Staff allocation, departmental headcount distribution, and unit listings.',
    },
    {
      id: 'emp_position',
      category: 'employee',
      title: 'Employee by Position Report',
      description: 'Staff distribution by designated job title, rank, and employment tenure.',
    },
    // Attendance Reports
    {
      id: 'att_daily',
      category: 'attendance',
      title: 'Daily Attendance Report',
      description: 'Day-by-day biometric check-in/out records, arrival times, and status.',
    },
    {
      id: 'att_monthly',
      category: 'attendance',
      title: 'Monthly Attendance Summary Report',
      description: 'Aggregated monthly working hours, presence, and overtime counts.',
    },
    {
      id: 'att_employee',
      category: 'attendance',
      title: 'Individual Employee Attendance Report',
      description: 'Granular timecard register and shift logs for a specific team member.',
    },
    {
      id: 'att_department',
      category: 'attendance',
      title: 'Department Attendance Report',
      description: 'Cross-departmental attendance adherence, presence rate, and trends.',
    },
    {
      id: 'att_late',
      category: 'attendance',
      title: 'Late Attendance Audit Report',
      description: 'Lateness infractions exceeding the 15-minute corporate grace threshold.',
    },
    {
      id: 'att_absence',
      category: 'attendance',
      title: 'Absence & Unscheduled Non-Attendance Report',
      description: 'Unaccounted absences, half-day departures, and workforce shortages.',
    },
    {
      id: 'att_exceptions',
      category: 'attendance',
      title: 'Attendance Exceptions & Infractions Audit Report',
      description: 'Lateness infractions exceeding grace threshold, unauthorized absences, and missing punch events.',
    },
    {
      id: 'att_corrections',
      category: 'attendance',
      title: 'Attendance Corrections & Adjustments Audit Log',
      description: 'Official record of manual check-in entries, supervisory timecard adjustments, and audit justifications.',
    },
    // Leave Reports
    {
      id: 'leave_on_leave',
      category: 'leave',
      title: 'On-Leave Workforce Report',
      description: 'Currently active statutory and approved leaves across Ethiopian Re departments.',
    },
    {
      id: 'leave_employee_info',
      category: 'leave',
      title: 'Employee Leave Information & Balances Report',
      description: 'Statutory leave entitlements, consumed days, pending requests, and balances.',
    },
  ];

  const currentReportDef = reportDefinitions.find((r) => r.id === selectedReport)!;

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDepartment !== 'ALL' && emp.department !== selectedDepartment) return false;
      if (selectedEmployeeId !== 'ALL' && emp.employeeId !== selectedEmployeeId) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.position.toLowerCase().includes(q) ||
          emp.emailAddress.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [employees, selectedDepartment, selectedEmployeeId, searchTerm]);

  // Filtered attendance
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      if (dateFrom && rec.date < dateFrom) return false;
      if (dateTo && rec.date > dateTo) return false;
      if (selectedDepartment !== 'ALL' && rec.department !== selectedDepartment) return false;
      if (selectedEmployeeId !== 'ALL' && rec.employeeId !== selectedEmployeeId) return false;

      // Report-specific filtering criteria
      if (selectedReport === 'att_late' && rec.status !== 'Late') return false;
      if (selectedReport === 'att_absence' && rec.status !== 'Absent') return false;
      if (
        selectedReport === 'att_exceptions' &&
        rec.status !== 'Late' &&
        rec.status !== 'Absent' &&
        !(rec.checkIn && !rec.checkOut)
      ) {
        return false;
      }
      if (selectedReport === 'att_corrections' && (!rec.notes || !rec.notes.trim())) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !rec.employeeName.toLowerCase().includes(q) &&
          !rec.employeeId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [attendanceRecords, dateFrom, dateTo, selectedDepartment, selectedEmployeeId, searchTerm, selectedReport]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaveRecords.filter((l) => {
      if (dateFrom && l.endDate < dateFrom) return false;
      if (dateTo && l.startDate > dateTo) return false;
      if (selectedEmployeeId !== 'ALL' && l.employeeId !== selectedEmployeeId) return false;
      if (selectedDepartment !== 'ALL') {
        const emp = employees.find((e) => e.employeeId === l.employeeId);
        if (emp && emp.department !== selectedDepartment) return false;
      }

      // Report-specific filtering
      if (selectedReport === 'leave_on_leave' && l.status !== 'Active' && l.status !== 'Recorded') {
        return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !l.employeeName.toLowerCase().includes(q) &&
          !l.employeeId.toLowerCase().includes(q) &&
          !l.leaveType.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [leaveRecords, dateFrom, dateTo, selectedEmployeeId, selectedDepartment, searchTerm, employees, selectedReport]);

  // Filtered Leave Balances with Carry-Forward Breakdown
  const filteredLeaveBalances = useMemo(() => {
    return leaveBalances.filter((bal) => {
      const emp = employees.find((e) => e.employeeId === bal.employeeId);
      if (selectedDepartment !== 'ALL' && emp?.department !== selectedDepartment) {
        return false;
      }
      if (selectedEmployeeId !== 'ALL' && bal.employeeId !== selectedEmployeeId) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const empName = bal.employeeName || emp?.fullName || '';
        if (
          !bal.employeeId.toLowerCase().includes(q) &&
          !empName.toLowerCase().includes(q) &&
          !bal.leaveType.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [leaveBalances, selectedDepartment, selectedEmployeeId, searchTerm, employees]);

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `EthioRe_${selectedReport}_${new Date().toISOString().slice(0, 10)}.csv`;

    switch (selectedReport) {
      case 'emp_directory':
      case 'emp_details':
      case 'emp_department':
      case 'emp_position':
        rows.push([
          'Employee ID',
          'Full Name',
          'Department',
          'Position',
          'Gender',
          'Employment Type',
          'Employment Date',
          'Work Location',
          'Corporate Email',
          'Status',
        ]);
        filteredEmployees.forEach((e) => {
          rows.push([
            e.employeeId,
            `"${e.fullName}"`,
            `"${e.department}"`,
            `"${e.position}"`,
            e.gender,
            e.employmentType,
            e.employmentDate,
            `"${e.workLocation}"`,
            e.emailAddress,
            e.status,
          ]);
        });
        break;

      case 'att_daily':
      case 'att_monthly':
      case 'att_employee':
      case 'att_department':
      case 'att_late':
      case 'att_absence':
        rows.push([
          'Date',
          'Employee ID',
          'Employee Name',
          'Department',
          'Check In',
          'Check Out',
          'Working Hours',
          'Status',
          'Notes',
        ]);
        filteredAttendance.forEach((a) => {
          rows.push([
            a.date,
            a.employeeId,
            `"${a.employeeName}"`,
            `"${a.department}"`,
            a.checkIn || '-',
            a.checkOut || '-',
            String(a.workingHours || 0),
            a.status,
            `"${a.notes || ''}"`,
          ]);
        });
        break;

      case 'leave_on_leave':
        rows.push([
          'Record ID',
          'Employee ID',
          'Employee Name',
          'Leave Type',
          'Start Date',
          'End Date',
          'Days',
          'Status',
          'Reason',
          'Applied Date',
        ]);
        filteredLeaves.forEach((l) => {
          rows.push([
            l.id,
            l.employeeId,
            `"${l.employeeName}"`,
            `"${l.leaveType}"`,
            l.startDate,
            l.endDate,
            String(l.days),
            l.status,
            `"${l.reason}"`,
            l.appliedDate,
          ]);
        });
        break;

      case 'leave_employee_info':
        rows.push([
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
        ]);
        filteredLeaveBalances.forEach((b) => {
          const emp = employees.find((e) => e.employeeId === b.employeeId);
          const name = b.employeeName || emp?.fullName || b.employeeId;
          const dept = emp?.department || 'N/A';
          const bd = b.carryForwardBreakdown;
          rows.push([
            b.employeeId,
            `"${name}"`,
            `"${dept}"`,
            `"${b.leaveType}"`,
            String(bd?.currentLeaveYear ?? b.currentLeaveYear ?? 2026),
            String(bd?.currentYearEntitlement ?? b.currentYearEntitlement ?? b.entitled),
            String(bd?.previousYearUnused ?? b.previousYearUnused ?? 0),
            String(bd?.secondPreviousYearUnused ?? b.secondPreviousYearUnused ?? 0),
            String(bd?.totalEligibleCarryForward ?? b.totalEligibleCarryForward ?? 0),
            String(bd?.currentYearUsed ?? b.currentYearUsed ?? b.taken),
            String(bd?.availableAnnualLeave ?? b.availableAnnualLeave ?? b.remaining),
            String(bd?.expiredOlderLeave ?? b.expiredOlderLeave ?? 0),
          ]);
        });
        break;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFilters = [
    { label: 'Category', value: currentReportDef.category.toUpperCase() },
    ...(selectedDepartment !== 'ALL' ? [{ label: 'Department', value: selectedDepartment }] : []),
    ...(selectedEmployeeId !== 'ALL' ? [{ label: 'Employee ID', value: selectedEmployeeId }] : []),
    ...(currentReportDef.category !== 'employee'
      ? [{ label: 'Date Range', value: `${dateFrom} to ${dateTo}` }]
      : []),
  ];

  if (userRole !== 'Administrator' && userRole !== 'HR Admin') {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          The Ethiopian Reinsurance HRMS Reports module is restricted to authorized
          Administrators and HR Admins. Your account role ({userRole}) does not have
          privileges to access these organizational records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Official Print Header */}
      <ReportPrintHeader
        title={currentReportDef.title}
        subtitle={`${currentReportDef.description} • Corporate HRMS Documentation`}
        filters={activeFilters}
        recordCount={
          currentReportDef.category === 'employee'
            ? filteredEmployees.length
            : currentReportDef.category === 'attendance'
            ? filteredAttendance.length
            : filteredLeaves.length
        }
      />

      {/* Screen Title & Report Selection Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#186382] text-white tracking-wider uppercase">
                Enterprise Module
              </span>
              <span className="text-xs text-slate-400 font-mono">HR-RPT-01</span>
            </div>
            <h1 className="text-xl font-bold text-[#0E3D52] tracking-tight mt-1 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#CCA352]" />
              <span>Official Reports Center</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Generate, audit, and print statutory Ethiopian Reinsurance human resource reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#186382]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0E3D52] hover:bg-[#186382] text-white text-xs font-bold rounded-lg shadow-sm transition-all border border-[#CCA352]/40 active:scale-[0.99] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#CCA352]" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Report Selector & Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Report Selector */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block font-bold text-slate-700">
              Select HRMS Report <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as ReportId)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-[#0E3D52] focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden cursor-pointer"
              >
                <optgroup label="📋 Employee Reports">
                  <option value="emp_directory">Employee Directory (Full Roster)</option>
                  <option value="emp_details">Employee Details & Master Profiles</option>
                  <option value="emp_department">Employee by Department Allocation</option>
                  <option value="emp_position">Employee by Position & Hierarchy</option>
                </optgroup>
                <optgroup label="⏱️ Attendance Reports">
                  <option value="att_daily">Daily Attendance Register</option>
                  <option value="att_monthly">Monthly Attendance Aggregation</option>
                  <option value="att_employee">Individual Employee Attendance</option>
                  <option value="att_department">Department Attendance Analysis</option>
                  <option value="att_late">Late Attendance Audit Report</option>
                  <option value="att_absence">Absence & Leave of Absence Report</option>
                  <option value="att_exceptions">Attendance Exceptions & Infractions Audit</option>
                  <option value="att_corrections">Attendance Corrections & Adjustments Log</option>
                </optgroup>
                <optgroup label="🏖️ Leave Reports">
                  <option value="leave_on_leave">On-Leave Personnel Report</option>
                  <option value="leave_employee_info">Employee Leave Balances & History</option>
                </optgroup>
              </select>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              {currentReportDef.description}
            </p>
          </div>

          {/* 2. Department Filter */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-[#186382] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Employee Filter */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Specific Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-[#186382] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Personnel ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.employeeId}>
                  {emp.employeeId} - {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Ranges (for Attendance & Leave reports) */}
        {currentReportDef.category !== 'employee' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-700">Date Range:</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-slate-600">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-[#186382] outline-hidden"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-slate-600">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-[#186382] outline-hidden"
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search report rows..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-[#186382] outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* ================= REPORT CONTENT TABLE ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#0E3D52]">{currentReportDef.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#186382]/10 text-[#186382] font-semibold text-[11px]">
              {currentReportDef.category === 'employee'
                ? `${filteredEmployees.length} Personnel`
                : currentReportDef.category === 'attendance'
                ? `${filteredAttendance.length} Attendance Logs`
                : `${filteredLeaves.length} Leave Records`}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Generated by {storageService.getCurrentUser().displayName} ({storageService.getCurrentUser().role})
          </div>
        </div>

        {/* 1. EMPLOYEE REPORTS TABLE */}
        {currentReportDef.category === 'employee' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0E3D52] text-white border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Emp ID</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Full Name</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Department</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Position</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Gender</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Tenure / Join Date</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Work Location</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Contact Email</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {employees.length === 0 ? 'No employee records found.' : 'No employee records found matching current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#186382]">
                        {emp.employeeId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {emp.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{emp.department}</td>
                      <td className="py-2.5 px-3 text-slate-700">{emp.position}</td>
                      <td className="py-2.5 px-3 text-slate-600">{emp.gender}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {emp.employmentDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[150px]">
                        {emp.workLocation}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {emp.emailAddress}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. ATTENDANCE REPORTS TABLE */}
        {currentReportDef.category === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0E3D52] text-white border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Emp ID</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Employee Name</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Department</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Check In</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Check Out</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Hours</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {attendanceRecords.length === 0 ? 'No attendance records available.' : 'No attendance entries logged for the selected timeframe.'}
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {att.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#186382]">
                        {att.employeeId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {att.employeeName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{att.department}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                        {att.checkIn || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                        {att.checkOut || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {att.workingHours?.toFixed(1) || '0.0'} hrs
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : att.status === 'Absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] italic truncate max-w-[180px]">
                        {att.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. LEAVE BALANCES REPORT TABLE */}
        {selectedReport === 'leave_employee_info' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0E3D52] text-white border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Emp ID</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Employee Name</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Department</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Leave Type</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100 text-center">Entitled</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100 text-center">Eligible Carry-Fwd</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100 text-center">Used</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100 text-center">Available Balance</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100 text-center">Expired (&gt;2 yrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaveBalances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No leave balance records matching the selected parameters.
                    </td>
                  </tr>
                ) : (
                  filteredLeaveBalances.map((b, idx) => {
                    const emp = employees.find((e) => e.employeeId === b.employeeId);
                    const name = b.employeeName || emp?.fullName || b.employeeId;
                    const dept = emp?.department || 'N/A';
                    const bd = b.carryForwardBreakdown;
                    return (
                      <tr key={`${b.employeeId}-${b.leaveType}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#186382]">{b.employeeId}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{dept}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {b.leaveType}
                          {b.leaveType === 'Annual Leave' && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-[#186382]/10 text-[#186382] font-bold">
                              2-Yr Policy
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-700">
                          {bd?.currentYearEntitlement ?? b.currentYearEntitlement ?? b.entitled}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-center text-emerald-700">
                          {b.leaveType === 'Annual Leave' ? `+${bd?.totalEligibleCarryForward ?? b.totalEligibleCarryForward ?? 0}d` : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-center text-amber-700">
                          {bd?.currentYearUsed ?? b.currentYearUsed ?? b.taken}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-center text-emerald-700">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">
                            {bd?.availableAnnualLeave ?? b.availableAnnualLeave ?? b.remaining} d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-center">
                          {(bd?.expiredOlderLeave ?? b.expiredOlderLeave ?? 0) > 0 ? (
                            <span className="text-rose-600 font-bold" title="Expired older leave beyond 2 years excluded">
                              {bd?.expiredOlderLeave ?? b.expiredOlderLeave} d
                            </span>
                          ) : (
                            <span className="text-slate-400">0 d</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. ON-LEAVE REPORTS TABLE */}
        {selectedReport === 'leave_on_leave' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0E3D52] text-white border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Record ID</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Emp ID</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Employee Name</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Leave Type</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Start Date</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">End Date</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Days</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-100">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {leaveRecords.length === 0 ? 'No records available.' : 'No leave records registered for the specified parameters.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{l.id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#186382]">
                        {l.employeeId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {l.employeeName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{l.leaveType}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {l.startDate}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {l.endDate}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {l.days} days
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'Recorded'
                              ? 'bg-blue-100 text-blue-800'
                              : l.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] italic truncate max-w-[200px]">
                        {l.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Print Footer */}
      <ReportPrintFooter />
    </div>
  );
};
