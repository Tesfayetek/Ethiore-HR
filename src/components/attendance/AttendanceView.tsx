import { useState, useMemo, useEffect, FormEvent } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Printer,
  ArrowRight,
  UserCheck,
  Sparkles,
  AlertCircle,
  Building,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileSpreadsheet,
  Edit3,
} from 'lucide-react';
import {
  AttendanceRecord,
  OvertimeRecord,
  AttendanceStatus,
  UserRole,
} from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface AttendanceViewProps {
  userRole: UserRole;
  initialSubTab?: string;
}

export const AttendanceView = ({
  userRole,
  initialSubTab = 'register',
}: AttendanceViewProps) => {
  const [activeTab, setActiveTab] = useState<
    'register' | 'calendar' | 'exceptions' | 'corrections' | 'checkin' | 'summary' | 'overtime' | 'reports'
  >((initialSubTab as any) || 'register');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendanceRecords()
  );
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() =>
    storageService.getOvertimeRecords()
  );

  // Register filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Calendar state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 8, 1)); // September 2026 default
  const [calendarDept, setCalendarDept] = useState('All');
  const [calendarEmpId, setCalendarEmpId] = useState('All');

  // Attendance Exceptions state
  const [exceptionCategory, setExceptionCategory] = useState<'All' | 'Late' | 'Absent' | 'Missing Check-Out'>('All');
  const [exceptionDept, setExceptionDept] = useState('All');
  const [exceptionDateFrom, setExceptionDateFrom] = useState('');
  const [exceptionDateTo, setExceptionDateTo] = useState('');
  const [exceptionSearch, setExceptionSearch] = useState('');

  // Attendance Corrections state
  const [correctionDept, setCorrectionDept] = useState('All');
  const [correctionDateFrom, setCorrectionDateFrom] = useState('');
  const [correctionDateTo, setCorrectionDateTo] = useState('');
  const [correctionSearch, setCorrectionSearch] = useState('');

  // Kiosk / Terminal checkin state
  const [kioskEmployeeId, setKioskEmployeeId] = useState('');
  const [kioskNotes, setKioskNotes] = useState('');
  const [kioskMessage, setKioskMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [kioskTime, setKioskTime] = useState('');

  // Manual record modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00',
    workingHours: 8.0,
    status: 'Present' as AttendanceStatus,
    notes: '',
  });

  // Overtime Modal
  const [isNewOvertimeOpen, setIsNewOvertimeOpen] = useState(false);
  const [otData, setOtData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    normalHours: 8,
    overtimeHours: 2,
    rateMultiplier: 1.5,
    reason: '',
  });
  const [otError, setOtError] = useState<string | null>(null);

  const employees = storageService.getEmployees();
  // STRICT RULE: Inactive employees must not be selectable for new operational records.
  const activeEmployees = employees.filter((e) => e.status === 'Active');
  const departments = storageService.getDepartments();
  const settings = storageService.getAttendanceSettings();

  // Attendance Reports Sub-State
  type AttendanceReportType = 'daily' | 'monthly' | 'department' | 'late_absence' | 'employee';
  const [selectedAttReport, setSelectedAttReport] = useState<AttendanceReportType>('daily');
  const [attReportDate, setAttReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [attReportDept, setAttReportDept] = useState('All');
  const [attReportEmployeeId, setAttReportEmployeeId] = useState('');
  const [attReportMonth, setAttReportMonth] = useState('2026-09');
  const [attReportSearch, setAttReportSearch] = useState('');

  // 1. Daily Attendance Report Data
  const dailyReportData = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const matchDate = rec.date === attReportDate;
      const matchDept = attReportDept === 'All' || rec.department === attReportDept;
      const matchSearch =
        !attReportSearch ||
        rec.employeeName.toLowerCase().includes(attReportSearch.toLowerCase()) ||
        rec.employeeId.toLowerCase().includes(attReportSearch.toLowerCase());
      return matchDate && matchDept && matchSearch;
    });
  }, [attendanceRecords, attReportDate, attReportDept, attReportSearch]);

  // 2. Monthly Attendance Report Data
  const monthlyReportData = useMemo(() => {
    return employees
      .filter((emp) => attReportDept === 'All' || emp.department === attReportDept)
      .map((emp) => {
        const empRecs = attendanceRecords.filter(
          (a) => a.employeeId === emp.employeeId && a.date.startsWith(attReportMonth)
        );
        const presentDays = empRecs.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const lateDays = empRecs.filter((a) => a.status === 'Late').length;
        const halfDays = empRecs.filter((a) => a.status === 'Half Day').length;
        const absentDays = empRecs.filter((a) => a.status === 'Absent').length;
        const totalHours = empRecs.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
        const punctuality = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;
        return {
          employeeId: emp.employeeId,
          employeeName: emp.fullName,
          department: emp.department,
          position: emp.position,
          presentDays,
          lateDays,
          halfDays,
          absentDays,
          totalHours: Math.round(totalHours * 10) / 10,
          punctuality,
        };
      })
      .filter((row) => {
        if (!attReportSearch) return true;
        const q = attReportSearch.toLowerCase();
        return (
          row.employeeName.toLowerCase().includes(q) ||
          row.employeeId.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q)
        );
      });
  }, [employees, attendanceRecords, attReportMonth, attReportDept, attReportSearch]);

  // 3. Department Attendance Report Data
  const departmentReportData = useMemo(() => {
    return departments.map((dept) => {
      const deptStaff = employees.filter((e) => e.department === dept.name);
      const deptStaffIds = new Set(deptStaff.map((e) => e.employeeId));
      const deptRecs = attendanceRecords.filter(
        (a) => a.date === attReportDate && deptStaffIds.has(a.employeeId)
      );
      const presentCount = deptRecs.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const lateCount = deptRecs.filter((a) => a.status === 'Late').length;
      const absentCount = deptRecs.filter((a) => a.status === 'Absent').length;
      const attendanceRate =
        deptStaff.length > 0 ? Math.round((presentCount / deptStaff.length) * 100) : 0;
      return {
        departmentName: dept.name,
        manager: dept.headOfDepartment,
        staffCount: deptStaff.length,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate,
      };
    });
  }, [departments, employees, attendanceRecords, attReportDate]);

  // 4. Late Arrival & Absence Audit Report Data
  const lateAbsenceReportData = useMemo(() => {
    return attendanceRecords
      .filter((rec) => {
        const isLateOrAbsent = rec.status === 'Late' || rec.status === 'Absent' || rec.status === 'Half Day';
        const matchDept = attReportDept === 'All' || rec.department === attReportDept;
        const matchSearch =
          !attReportSearch ||
          rec.employeeName.toLowerCase().includes(attReportSearch.toLowerCase()) ||
          rec.employeeId.toLowerCase().includes(attReportSearch.toLowerCase());
        return isLateOrAbsent && matchDept && matchSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, attReportDept, attReportSearch]);

  // 5. Employee Specific Attendance Report Data
  const currentReportEmployee = useMemo(() => {
    const targetId = attReportEmployeeId || activeEmployees[0]?.employeeId;
    return employees.find((e) => e.employeeId === targetId) || null;
  }, [employees, attReportEmployeeId, activeEmployees]);

  const employeeAttendanceData = useMemo(() => {
    if (!currentReportEmployee) return [];
    return attendanceRecords
      .filter((a) => a.employeeId === currentReportEmployee.employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, currentReportEmployee]);

  const handleExportActiveAttendanceReportCSV = () => {
    let header = '';
    let rows = '';
    if (selectedAttReport === 'daily') {
      header = 'Date,Employee ID,Employee Name,Department,Check-In,Check-Out,Hours,Status,Notes\\n';
      rows = dailyReportData.map(r => `"${r.date}","${r.employeeId}","${r.employeeName}","${r.department}","${r.checkIn}","${r.checkOut}",${r.workingHours},"${r.status}","${r.notes || ''}"`).join('\\n');
    } else if (selectedAttReport === 'monthly') {
      header = 'Employee ID,Employee Name,Department,Position,Present Days,Late Days,Half Days,Absent Days,Total Hours,Punctuality %\\n';
      rows = monthlyReportData.map(r => `"${r.employeeId}","${r.employeeName}","${r.department}","${r.position}",${r.presentDays},${r.lateDays},${r.halfDays},${r.absentDays},${r.totalHours},${r.punctuality}%`).join('\\n');
    } else if (selectedAttReport === 'department') {
      header = 'Department,Department Head,Staff Count,Present,Late,Absent,Attendance Rate %\\n';
      rows = departmentReportData.map(r => `"${r.departmentName}","${r.manager}",${r.staffCount},${r.presentCount},${r.lateCount},${r.absentCount},${r.attendanceRate}%`).join('\\n');
    } else if (selectedAttReport === 'late_absence') {
      header = 'Date,Employee ID,Employee Name,Department,Check-In,Status,Notes\\n';
      rows = lateAbsenceReportData.map(r => `"${r.date}","${r.employeeId}","${r.employeeName}","${r.department}","${r.checkIn}","${r.status}","${r.notes || ''}"`).join('\\n');
    } else if (selectedAttReport === 'employee') {
      header = 'Date,Employee ID,Employee Name,Check-In,Check-Out,Hours,Status,Notes\\n';
      rows = employeeAttendanceData.map(r => `"${r.date}","${r.employeeId}","${r.employeeName}","${r.checkIn}","${r.checkOut}",${r.workingHours},"${r.status}","${r.notes || ''}"`).join('\\n');
    }
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_attendance_${selectedAttReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setKioskTime(
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    setAttendanceRecords(storageService.getAttendanceRecords());
    setOvertimeRecords(storageService.getOvertimeRecords());
  };

  // Filtered attendance for register
  const filteredRegister = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const matchesDate = !selectedDate || rec.date === selectedDate;
      const matchesDept = departmentFilter === 'All' || rec.department === departmentFilter;
      const matchesSearch =
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesDept && matchesSearch;
    });
  }, [attendanceRecords, selectedDate, departmentFilter, searchQuery]);

  // Filtered attendance exceptions
  const filteredExceptions = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const isLate = rec.status === 'Late';
      const isAbsent = rec.status === 'Absent';
      const isMissingCheckout = Boolean(rec.checkIn && !rec.checkOut);
      const isException = isLate || isAbsent || isMissingCheckout;
      if (!isException) return false;

      if (exceptionCategory === 'Late' && !isLate) return false;
      if (exceptionCategory === 'Absent' && !isAbsent) return false;
      if (exceptionCategory === 'Missing Check-Out' && !isMissingCheckout) return false;

      if (exceptionDept !== 'All' && rec.department !== exceptionDept) return false;
      if (exceptionDateFrom && rec.date < exceptionDateFrom) return false;
      if (exceptionDateTo && rec.date > exceptionDateTo) return false;

      if (exceptionSearch) {
        const q = exceptionSearch.toLowerCase();
        if (
          !rec.employeeName.toLowerCase().includes(q) &&
          !rec.employeeId.toLowerCase().includes(q) &&
          !(rec.notes || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [attendanceRecords, exceptionCategory, exceptionDept, exceptionDateFrom, exceptionDateTo, exceptionSearch]);

  // Filtered attendance corrections
  const filteredCorrections = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const hasNote = Boolean(rec.notes && rec.notes.trim() !== '');
      if (!hasNote) return false;

      if (correctionDept !== 'All' && rec.department !== correctionDept) return false;
      if (correctionDateFrom && rec.date < correctionDateFrom) return false;
      if (correctionDateTo && rec.date > correctionDateTo) return false;

      if (correctionSearch) {
        const q = correctionSearch.toLowerCase();
        if (
          !rec.employeeName.toLowerCase().includes(q) &&
          !rec.employeeId.toLowerCase().includes(q) &&
          !(rec.notes || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [attendanceRecords, correctionDept, correctionDateFrom, correctionDateTo, correctionSearch]);

  const exceptionCount = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.status === 'Late' || r.status === 'Absent' || (r.checkIn && !r.checkOut)
    ).length;
  }, [attendanceRecords]);

  const correctionCount = useMemo(() => {
    return attendanceRecords.filter((r) => Boolean(r.notes && r.notes.trim() !== '')).length;
  }, [attendanceRecords]);

  const handleExportExceptionsCSV = () => {
    const header = 'Date,Employee ID,Employee Name,Department,Check-In,Check-Out,Status,Exception Reason/Notes\n';
    const rows = filteredExceptions
      .map(
        (r) =>
          `"${r.date}","${r.employeeId}","${r.employeeName}","${r.department}","${r.checkIn || '-'}","${
            r.checkOut || '-'
          }","${r.status}","${r.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_attendance_exceptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportCorrectionsCSV = () => {
    const header = 'Date,Employee ID,Employee Name,Department,Check-In,Check-Out,Hours,Status,Correction Notes\n';
    const rows = filteredCorrections
      .map(
        (r) =>
          `"${r.date}","${r.employeeId}","${r.employeeName}","${r.department}","${r.checkIn || '-'}","${
            r.checkOut || '-'
          }",${r.workingHours || 0},"${r.status}","${r.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_attendance_corrections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Handle Kiosk Check-In
  const handleKioskCheckIn = () => {
    setKioskMessage(null);
    if (!kioskEmployeeId) {
      setKioskMessage({ type: 'error', text: 'Please select an active employee.' });
      return;
    }
    const res = storageService.recordCheckIn(kioskEmployeeId, kioskNotes);
    if (res.success) {
      setKioskMessage({ type: 'success', text: res.message });
      setKioskNotes('');
      refreshData();
    } else {
      setKioskMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Kiosk Check-Out
  const handleKioskCheckOut = () => {
    setKioskMessage(null);
    if (!kioskEmployeeId) {
      setKioskMessage({ type: 'error', text: 'Please select an active employee.' });
      return;
    }
    const res = storageService.recordCheckOut(kioskEmployeeId, kioskNotes);
    if (res.success) {
      setKioskMessage({ type: 'success', text: res.message });
      setKioskNotes('');
      refreshData();
    } else {
      setKioskMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Manual Attendance Submit
  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!manualRecord.employeeId) {
      alert('Please select an active employee.');
      return;
    }
    const emp = storageService.getEmployeeById(manualRecord.employeeId);
    if (!emp) return;

    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveAttendanceRecord(
      {
        date: manualRecord.date,
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        department: emp.department,
        checkIn: manualRecord.checkIn,
        checkOut: manualRecord.checkOut,
        workingHours: Number(manualRecord.workingHours) || 8,
        status: manualRecord.status,
        notes: manualRecord.notes,
      },
      currentUser
    );

    if (res.success) {
      refreshData();
      setIsManualModalOpen(false);
    } else {
      alert(res.message);
    }
  };

  // Handle Overtime Submit
  const handleOvertimeSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOtError(null);
    if (!otData.employeeId) {
      setOtError('Please select an active employee.');
      return;
    }
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveOvertimeRecord(
      {
        employeeId: otData.employeeId,
        date: otData.date,
        normalHours: Number(otData.normalHours) || 8,
        overtimeHours: Number(otData.overtimeHours) || 1,
        rateMultiplier: Number(otData.rateMultiplier) || 1.5,
        reason: otData.reason || 'Operational requirements',
      },
      currentUser
    );

    if (res.success) {
      refreshData();
      setIsNewOvertimeOpen(false);
    } else {
      setOtError(res.message);
    }
  };

  // Handle Overtime Status
  const handleOvertimeStatus = (id: string, status: 'Approved' | 'Rejected') => {
    const currentUser = storageService.getCurrentUser();
    storageService.updateOvertimeStatus(id, status, currentUser);
    refreshData();
  };

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    const header = 'Date,Employee ID,Employee Name,Department,Check-In,Check-Out,Hours,Status,Notes\n';
    const rows = attendanceRecords
      .map(
        (r) =>
          `"${r.date}","${r.employeeId}","${r.employeeName}","${r.department}","${r.checkIn}","${r.checkOut}",${r.workingHours},"${r.status}","${r.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
              Daily Register & Time Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Biometric check-in synchronization, punctuality tracking (grace period 15m), and Ethiopian labor overtime rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#082836] hover:bg-[#227D9E] text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 shadow-2xs transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Kiosk Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeEmployees.length > 0) {
                setManualRecord((prev) => ({ ...prev, employeeId: activeEmployees[0].employeeId }));
              }
              setIsManualModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Record Attendance</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 text-xs font-medium overflow-x-auto shadow-2xs">
        {[
          { id: 'register', label: 'Attendance Register', count: attendanceRecords.length },
          { id: 'calendar', label: 'Attendance Calendar', count: null },
          { id: 'exceptions', label: 'Attendance Exceptions', count: exceptionCount },
          { id: 'corrections', label: 'Attendance Corrections', count: correctionCount },
          { id: 'checkin', label: 'Check-In / Check-Out', count: null },
          { id: 'summary', label: 'Attendance Summary', count: null },
          { id: 'overtime', label: 'Overtime', count: overtimeRecords.length },
          { id: 'reports', label: 'Attendance Reports', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-[#186382] font-bold bg-[#EBF3F7]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ATTENDANCE REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Action and Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Attendance Register</h3>
              <p className="text-xs text-slate-500">Live operational registry of arrivals, departures, and active statuses.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportAttendanceCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Register Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 text-xs no-print">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Employee</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID or Name..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Printable Header */}
          <ReportPrintHeader
            title="Daily Attendance Register Report"
            subtitle="Official workforce daily clock-in/out log and recorded working hours"
            filters={[
              { label: 'Date', value: selectedDate || 'All Dates' },
              ...(departmentFilter !== 'All' ? [{ label: 'Department', value: departmentFilter }] : []),
              ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
            ]}
            recordCount={filteredRegister.length}
          />

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Working Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegister.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        {attendanceRecords.length === 0
                          ? 'No attendance records available.'
                          : `No attendance entries recorded for ${selectedDate || 'the selected date'}.`}
                      </td>
                    </tr>
                  ) : (
                    filteredRegister.map((rec) => {
                      const emp = employees.find((e) => e.employeeId === rec.employeeId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <FacelessAvatar
                                src={emp?.photo}
                                alt={rec.employeeName}
                                size="sm"
                                className="border border-slate-200"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{rec.employeeName}</div>
                                <span className="font-mono text-[11px] text-slate-500">{rec.employeeId}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 truncate max-w-[170px]">{rec.department}</td>

                          <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                            {rec.checkIn || '—'}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOut || '—'}</td>

                          <td className="py-3 px-4 font-bold text-slate-800">
                            {rec.workingHours > 0 ? `${rec.workingHours}h` : '—'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : rec.status === 'Half Day'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : rec.status === 'On Leave'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[180px] truncate" title={rec.notes}>
                            {rec.notes || '—'}
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
      )}

      {/* TAB: ATTENDANCE CALENDAR */}
      {activeTab === 'calendar' && (() => {
        const calYear = calendarDate.getFullYear();
        const calMonth = calendarDate.getMonth();
        const firstDayIndex = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Monday as 0
        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
        const monthLabel = calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const pad = (n: number) => String(n).padStart(2, '0');

        return (
          <div className="space-y-4">
            {/* Calendar Controls */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div>
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-[#186382]" />
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {monthLabel}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                    Attendance Calendar
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Monthly visual distribution of staff presence, arrival punctuality, and duty schedules.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(2026, 8, 1))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sep 2026
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ml-1"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Calendar</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Month</label>
                <input
                  type="month"
                  value={`${calYear}-${pad(calMonth + 1)}`}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m] = e.target.value.split('-').map(Number);
                      setCalendarDate(new Date(y, m - 1, 1));
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department Filter</label>
                <select
                  value={calendarDept}
                  onChange={(e) => setCalendarDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Employee View</label>
                <select
                  value={calendarEmpId}
                  onChange={(e) => setCalendarEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden"
                >
                  <option value="All">All Personnel (Consolidated Headcount)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.employeeId} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Print Header */}
            <ReportPrintHeader
              title="Monthly Attendance Calendar Schedule"
              subtitle={`Official Ethiopian Reinsurance S.C. staff duty schedule for ${monthLabel}`}
              filters={[
                { label: 'Reporting Month', value: monthLabel },
                ...(calendarDept !== 'All' ? [{ label: 'Department', value: calendarDept }] : []),
                ...(calendarEmpId !== 'All'
                  ? [{ label: 'Employee', value: employees.find((e) => e.employeeId === calendarEmpId)?.fullName || calendarEmpId }]
                  : []),
              ]}
            />

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-bold text-xs text-slate-700 py-2.5">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="tracking-wide">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 text-xs">
                {/* Blank days before first day */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[90px] bg-slate-50/50 p-2 text-slate-300" />
                ))}

                {/* Days of month */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(dayNum)}`;
                  const dayDate = new Date(calYear, calMonth, dayNum);
                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                  // Daily records matching filters
                  const dayRecords = attendanceRecords.filter((r) => {
                    if (r.date !== dateStr) return false;
                    if (calendarDept !== 'All' && r.department !== calendarDept) return false;
                    if (calendarEmpId !== 'All' && r.employeeId !== calendarEmpId) return false;
                    return true;
                  });

                  const presentCount = dayRecords.filter((r) => r.status === 'Present').length;
                  const lateCount = dayRecords.filter((r) => r.status === 'Late').length;
                  const absentCount = dayRecords.filter((r) => r.status === 'Absent').length;

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[90px] p-2 transition-colors flex flex-col justify-between ${
                        isWeekend ? 'bg-slate-50/70 text-slate-400' : 'bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isWeekend ? 'text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isWeekend && (
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Weekend</span>
                        )}
                      </div>

                      <div className="space-y-1 my-1">
                        {calendarEmpId === 'All' ? (
                          <>
                            {presentCount > 0 && (
                              <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold flex items-center justify-between">
                                <span>Present:</span>
                                <span className="font-mono font-bold">{presentCount}</span>
                              </div>
                            )}
                            {lateCount > 0 && (
                              <div className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center justify-between">
                                <span>Late:</span>
                                <span className="font-mono font-bold">{lateCount}</span>
                              </div>
                            )}
                            {absentCount > 0 && (
                              <div className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold flex items-center justify-between">
                                <span>Absent:</span>
                                <span className="font-mono font-bold">{absentCount}</span>
                              </div>
                            )}
                            {dayRecords.length === 0 && !isWeekend && (
                              <span className="text-[10px] text-slate-300 italic block text-center py-2">
                                No logs
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {dayRecords.length > 0 ? (
                              dayRecords.map((r) => (
                                <div
                                  key={r.id}
                                  className={`p-1 rounded text-[10px] border ${
                                    r.status === 'Present'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : r.status === 'Late'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  <div className="font-bold flex justify-between">
                                    <span>{r.status}</span>
                                    <span className="font-mono">{r.workingHours > 0 ? `${r.workingHours}h` : ''}</span>
                                  </div>
                                  <div className="font-mono text-[9px] text-slate-600">
                                    {r.checkIn || '—'} - {r.checkOut || '—'}
                                  </div>
                                </div>
                              ))
                            ) : !isWeekend ? (
                              <span className="text-[10px] text-slate-300 italic block py-2">Off-duty</span>
                            ) : null}
                          </>
                        )}
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono text-right">
                        {dayRecords.length > 0 ? `${dayRecords.length} records` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Print Footer */}
            <ReportPrintFooter />
          </div>
        );
      })()}

      {/* TAB: ATTENDANCE EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Attendance Exceptions & Infractions Audit
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 font-mono">
                  {filteredExceptions.length} Discrepancies
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official audit register of arrivals exceeding the 15-minute grace period, unexcused non-attendance, and missing punches.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportExceptionsCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Exceptions</span>
              </button>
            </div>
          </div>

          {/* Exceptions Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs no-print">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exception Category</label>
              <select
                value={exceptionCategory}
                onChange={(e) => setExceptionCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden font-semibold text-[#0E3D52]"
              >
                <option value="All">All Exceptions ({exceptionCount})</option>
                <option value="Late">Late Arrivals (After 08:15 EAT)</option>
                <option value="Absent">Unexcused Absences</option>
                <option value="Missing Check-Out">Missing Check-Outs</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
              <select
                value={exceptionDept}
                onChange={(e) => setExceptionDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Range (From - To)</label>
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={exceptionDateFrom}
                  onChange={(e) => setExceptionDateFrom(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  placeholder="From"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={exceptionDateTo}
                  onChange={(e) => setExceptionDateTo(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  placeholder="To"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Staff / Notes</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={exceptionSearch}
                  onChange={(e) => setExceptionSearch(e.target.value)}
                  placeholder="Search staff, ID, notes..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Printable Header */}
          <ReportPrintHeader
            title="Attendance Exceptions & Non-Compliance Audit Report"
            subtitle="Ethiopian Reinsurance S.C. punctuality infractions and attendance discrepancies"
            filters={[
              { label: 'Category', value: exceptionCategory },
              ...(exceptionDept !== 'All' ? [{ label: 'Department', value: exceptionDept }] : []),
              ...(exceptionDateFrom || exceptionDateTo
                ? [{ label: 'Date Range', value: `${exceptionDateFrom || 'Start'} to ${exceptionDateTo || 'End'}` }]
                : []),
              ...(exceptionSearch ? [{ label: 'Search Query', value: exceptionSearch }] : []),
            ]}
            recordCount={filteredExceptions.length}
          />

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-[#0E3D52] text-white font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 text-slate-100">Date</th>
                    <th className="py-3 px-4 text-slate-100">Employee ID</th>
                    <th className="py-3 px-4 text-slate-100">Full Name</th>
                    <th className="py-3 px-4 text-slate-100">Department</th>
                    <th className="py-3 px-4 text-slate-100">Scheduled Shift</th>
                    <th className="py-3 px-4 text-slate-100">Recorded Check-In</th>
                    <th className="py-3 px-4 text-slate-100">Recorded Check-Out</th>
                    <th className="py-3 px-4 text-slate-100">Exception Category</th>
                    <th className="py-3 px-4 text-slate-100">Justification & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExceptions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        {attendanceRecords.length === 0
                          ? 'No attendance records available.'
                          : 'No attendance exceptions recorded for the selected parameters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredExceptions.map((rec) => {
                      const isMissingCheckout = Boolean(rec.checkIn && !rec.checkOut);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">{rec.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#186382]">{rec.employeeId}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{rec.employeeName}</td>
                          <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">08:00 - 17:00</td>
                          <td className="py-3 px-4 font-mono">
                            <span className={rec.status === 'Late' ? 'font-bold text-amber-700' : 'text-slate-800'}>
                              {rec.checkIn || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={isMissingCheckout ? 'font-bold text-rose-600' : 'text-slate-800'}>
                              {rec.checkOut || (isMissingCheckout ? 'MISSING PUNCH' : '—')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                rec.status === 'Late'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : rec.status === 'Absent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-purple-100 text-purple-800 border border-purple-300'
                              }`}
                            >
                              {isMissingCheckout && rec.status !== 'Absent' ? 'Missing Check-Out' : rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic text-[11px] max-w-[220px] truncate" title={rec.notes}>
                            {rec.notes || 'No explanation submitted'}
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
      )}

      {/* TAB: ATTENDANCE CORRECTIONS */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div>
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#186382]" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Attendance Corrections & Manual Adjustments Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 font-mono">
                  {filteredCorrections.length} Adjustments
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authoritative compliance trail for manual biometric overrides, supervisory corrections, and official adjustments.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportCorrectionsCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Corrections</span>
              </button>
            </div>
          </div>

          {/* Corrections Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department Filter</label>
              <select
                value={correctionDept}
                onChange={(e) => setCorrectionDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date Range (From - To)</label>
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={correctionDateFrom}
                  onChange={(e) => setCorrectionDateFrom(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  placeholder="From"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={correctionDateTo}
                  onChange={(e) => setCorrectionDateTo(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  placeholder="To"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Staff / Note Text</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={correctionSearch}
                  onChange={(e) => setCorrectionSearch(e.target.value)}
                  placeholder="Filter by staff, employee ID, or notes..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Printable Header */}
          <ReportPrintHeader
            title="Attendance Corrections & Timecard Adjustments Register"
            subtitle="Official audit log of adjusted check-in timestamps and supervisory justifications"
            filters={[
              ...(correctionDept !== 'All' ? [{ label: 'Department', value: correctionDept }] : []),
              ...(correctionDateFrom || correctionDateTo
                ? [{ label: 'Date Range', value: `${correctionDateFrom || 'Start'} to ${correctionDateTo || 'End'}` }]
                : []),
              ...(correctionSearch ? [{ label: 'Search Query', value: correctionSearch }] : []),
            ]}
            recordCount={filteredCorrections.length}
          />

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-[#0E3D52] text-white font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 text-slate-100">Date</th>
                    <th className="py-3 px-4 text-slate-100">Employee ID</th>
                    <th className="py-3 px-4 text-slate-100">Full Name</th>
                    <th className="py-3 px-4 text-slate-100">Department</th>
                    <th className="py-3 px-4 text-slate-100">Adjusted In</th>
                    <th className="py-3 px-4 text-slate-100">Adjusted Out</th>
                    <th className="py-3 px-4 text-slate-100">Working Hours</th>
                    <th className="py-3 px-4 text-slate-100">Status</th>
                    <th className="py-3 px-4 text-slate-100">Supervisory Justification & Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCorrections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No manual corrections or timecard adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredCorrections.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">{rec.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#186382]">{rec.employeeId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{rec.employeeName}</td>
                        <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                        <td className="py-3 px-4 font-mono text-emerald-700">{rec.checkIn || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOut || '—'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rec.workingHours > 0 ? `${rec.workingHours.toFixed(1)}h` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-[11px] max-w-[280px]">
                          <span className="font-medium text-[#186382] mr-1">📝 Adjustment:</span>
                          {rec.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* TAB 2: CHECK-IN / CHECK-OUT (KIOSK TERMINAL) */}
      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Terminal Column */}
          <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                  EthioRe Tower • Biometric Terminal
                </span>
                <h2 className="text-xl font-bold tracking-tight">Staff Time Clock Kiosk</h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
                  {kioskTime || '08:00:00'}
                </div>
                <div className="text-xs text-slate-400">Standard shift: 08:00 - 17:00 (Grace: 15m)</div>
              </div>
            </div>

            {kioskMessage && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 ${
                  kioskMessage.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-700 text-rose-300'
                }`}
              >
                {kioskMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{kioskMessage.text}</span>
              </div>
            )}

            {/* Select Active Employee */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Employee (Active Staff Only)
                </label>
                <select
                  value={kioskEmployeeId}
                  onChange={(e) => setKioskEmployeeId(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="">-- Choose Employee to Punch --</option>
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.employeeId}>
                      {e.employeeId} - {e.fullName} ({e.department})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Inactive personnel are prevented from registering check-ins.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Optional Notes (Reason for lateness, field duty, etc.)
                </label>
                <input
                  type="text"
                  value={kioskNotes}
                  onChange={(e) => setKioskNotes(e.target.value)}
                  placeholder="e.g. Attending external regulatory meeting at NBE..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              {/* Punch Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleKioskCheckIn}
                  className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex flex-col items-center justify-center space-y-1 shadow-lg transition-all active:scale-98"
                >
                  <div className="flex items-center space-x-2 text-base">
                    <UserCheck className="w-5 h-5" />
                    <span>Check IN</span>
                  </div>
                  <span className="text-[11px] font-normal text-emerald-200">
                    Record morning entry time
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleKioskCheckOut}
                  className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold flex flex-col items-center justify-center space-y-1 shadow-lg transition-all active:scale-98"
                >
                  <div className="flex items-center space-x-2 text-base">
                    <ArrowRight className="w-5 h-5" />
                    <span>Check OUT</span>
                  </div>
                  <span className="text-[11px] font-normal text-amber-200">
                    Calculate & lock hours
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Today's Kiosk Activity Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Today's Live Punches ({attendanceRecords.filter((a) => a.date === new Date().toISOString().split('T')[0]).length})
            </h3>

            <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
              {attendanceRecords
                .filter((a) => a.date === new Date().toISOString().split('T')[0])
                .map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{rec.employeeName}</div>
                      <div className="text-[11px] text-slate-500">
                        In: <strong className="text-emerald-700">{rec.checkIn || '—'}</strong> | Out:{' '}
                        <strong>{rec.checkOut || '—'}</strong>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs no-print">
            <div>
              <h3 className="font-bold text-slate-900">Monthly Attendance Aggregation</h3>
              <p className="text-slate-500">
                Summary of days present, lateness incidents, and total working hours per employee.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportAttendanceCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Summary CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>
            </div>
          </div>

          <ReportPrintHeader
            title="Monthly Attendance Summary & Aggregation Report"
            subtitle="Workforce aggregated attendance, punctuality quotient, and working hours"
            recordCount={employees.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Days Present</th>
                    <th className="py-3 px-4 text-center">Late Counts</th>
                    <th className="py-3 px-4 text-center">Half Days</th>
                    <th className="py-3 px-4 text-center">Total Hours</th>
                    <th className="py-3 px-4 text-center">Punctuality %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const empRecords = attendanceRecords.filter((a) => a.employeeId === emp.employeeId);
                    const presentCount = empRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
                    const lateCount = empRecords.filter((a) => a.status === 'Late').length;
                    const halfDayCount = empRecords.filter((a) => a.status === 'Half Day').length;
                    const totalHours = empRecords.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
                    const punctuality =
                      presentCount > 0
                        ? Math.round(((presentCount - lateCount) / presentCount) * 100)
                        : 100;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{emp.fullName}</div>
                          <span className="font-mono text-[11px] text-slate-500">{emp.employeeId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{presentCount}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-600 font-semibold">{lateCount}</td>
                        <td className="py-3 px-4 text-center font-mono text-blue-600">{halfDayCount}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          {Math.round(totalHours * 10) / 10}h
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              punctuality >= 90
                                ? 'bg-emerald-100 text-emerald-800'
                                : punctuality >= 75
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {punctuality}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* TAB 4: OVERTIME */}
      {activeTab === 'overtime' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Overtime Management</h3>
              <p className="text-xs text-slate-500">
                Ethiopian Labor Proclamation No. 1156/2019: Standard overtime (1.5x) and weekend/public holiday overtime (2.0x).
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#186382]" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeEmployees.length > 0) {
                    setOtData((prev) => ({ ...prev, employeeId: activeEmployees[0].employeeId }));
                  }
                  setIsNewOvertimeOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Record Overtime</span>
              </button>
            </div>
          </div>

          <ReportPrintHeader
            title="Overtime Hours & Entitlements Audit Report"
            subtitle="Ethiopian Labor Proclamation No. 1156/2019 statutory overtime audit (1.5x normal, 2.0x holiday/weekend)"
            recordCount={overtimeRecords.length}
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Rate Multiplier</th>
                    <th className="py-3 px-4">Operational Justification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overtimeRecords.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ot.employeeName}</div>
                        <span className="font-mono text-slate-500 text-[11px]">{ot.employeeId}</span>
                      </td>

                      <td className="py-3 px-4 font-mono">{ot.date}</td>

                      <td className="py-3 px-4 font-bold text-amber-800">{ot.overtimeHours} hours</td>

                      <td className="py-3 px-4 font-mono font-semibold text-purple-700">
                        {ot.rateMultiplier}x {ot.rateMultiplier === 2.0 ? '(Holiday/Weekend)' : '(Normal)'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate" title={ot.reason}>
                        {ot.reason}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            ot.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ot.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ot.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right no-print">
                        {ot.status === 'Pending' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOvertimeStatus(ot.id, 'Approved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOvertimeStatus(ot.id, 'Rejected')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold border border-rose-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {ot.approvedBy && (
                          <span className="text-[10px] text-slate-400">By: {ot.approvedBy}</span>
                        )}
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

      {/* TAB 5: ATTENDANCE REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Top Banner and Actions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Executive Attendance Reports</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  5 Modules
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Ethiopian Reinsurance S.C. punctuality audits, department rates, and statutory time compliance.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportActiveAttendanceReportCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Active Report</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Report Selection Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 no-print">
            {[
              { id: 'daily', label: 'Daily Attendance Report', icon: Calendar },
              { id: 'monthly', label: 'Monthly Aggregation Report', icon: Clock },
              { id: 'department', label: 'Department Attendance Report', icon: Building },
              { id: 'late_absence', label: 'Late & Absence Audit Report', icon: AlertCircle },
              { id: 'employee', label: 'Employee Attendance Report', icon: Users },
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = selectedAttReport === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedAttReport(btn.id as AttendanceReportType)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight">{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Active Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs no-print">
            {/* Filter by Date (for Daily & Department) */}
            {(selectedAttReport === 'daily' || selectedAttReport === 'department') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Report Date</label>
                <input
                  type="date"
                  value={attReportDate}
                  onChange={(e) => setAttReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden font-mono"
                />
              </div>
            )}

            {/* Filter by Month (for Monthly) */}
            {selectedAttReport === 'monthly' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Reporting Month</label>
                <input
                  type="month"
                  value={attReportMonth}
                  onChange={(e) => setAttReportMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden font-mono"
                />
              </div>
            )}

            {/* Filter by Employee (for Employee Attendance) */}
            {selectedAttReport === 'employee' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Choose Employee</label>
                <select
                  value={attReportEmployeeId || activeEmployees[0]?.employeeId || ''}
                  onChange={(e) => setAttReportEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.employeeId} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter (for Daily, Monthly, Late/Absence) */}
            {selectedAttReport !== 'employee' && selectedAttReport !== 'department' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
                <select
                  value={attReportDept}
                  onChange={(e) => setAttReportDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] outline-hidden font-medium"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Keyword Search */}
            <div className={selectedAttReport === 'department' ? 'sm:col-span-3' : 'sm:col-span-2'}>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search in Report</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={attReportSearch}
                  onChange={(e) => setAttReportSearch(e.target.value)}
                  placeholder="Filter records by employee, ID, or keywords..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* REPORT 1: DAILY ATTENDANCE REPORT */}
          {selectedAttReport === 'daily' && (
            <div className="space-y-4">
              <ReportPrintHeader
                title="Daily Attendance & Time Tracking Report"
                subtitle="Official record of employee arrivals, check-outs, and recorded working hours"
                filters={[
                  { label: 'Date', value: attReportDate },
                  ...(attReportDept !== 'All' ? [{ label: 'Department', value: attReportDept }] : []),
                  ...(attReportSearch ? [{ label: 'Search Query', value: attReportSearch }] : []),
                ]}
                recordCount={dailyReportData.length}
              />

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Daily Attendance Register ({attReportDate})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {dailyReportData.length} records logged
                  </span>
                </div>

                {dailyReportData.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No attendance records found matching the selected report criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting a different date or department filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Employee ID</th>
                          <th className="py-3 px-4">Employee Name</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Check-In</th>
                          <th className="py-3 px-4">Check-Out</th>
                          <th className="py-3 px-4 text-center">Working Hours</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyReportData.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-amber-900">{rec.employeeId}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                            <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-emerald-700">{rec.checkIn || '—'}</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOut || '—'}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                              {rec.workingHours > 0 ? `${rec.workingHours}h` : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : rec.status === 'Half Day'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : rec.status === 'On Leave'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[180px]" title={rec.notes}>
                              {rec.notes || '—'}
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

          {/* REPORT 2: MONTHLY AGGREGATION REPORT */}
          {selectedAttReport === 'monthly' && (
            <div className="space-y-4">
              <ReportPrintHeader
                title="Monthly Attendance Aggregation Report"
                subtitle="Workforce aggregated attendance, punctuality quotient, and hours delivered"
                filters={[
                  { label: 'Month', value: attReportMonth },
                  ...(attReportDept !== 'All' ? [{ label: 'Department', value: attReportDept }] : []),
                  ...(attReportSearch ? [{ label: 'Search Query', value: attReportSearch }] : []),
                ]}
                recordCount={monthlyReportData.length}
              />

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Monthly Aggregation ({attReportMonth})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {monthlyReportData.length} staff evaluated
                  </span>
                </div>

                {monthlyReportData.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No attendance records found matching the selected report criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Employee ID</th>
                          <th className="py-3 px-4">Employee Name</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Position</th>
                          <th className="py-3 px-4 text-center">Days Present</th>
                          <th className="py-3 px-4 text-center">Late Counts</th>
                          <th className="py-3 px-4 text-center">Half Days</th>
                          <th className="py-3 px-4 text-center">Total Hours</th>
                          <th className="py-3 px-4 text-center">Punctuality %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyReportData.map((row) => (
                          <tr key={row.employeeId} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-amber-900">{row.employeeId}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{row.employeeName}</td>
                            <td className="py-3 px-4 text-slate-700">{row.department}</td>
                            <td className="py-3 px-4 text-slate-600">{row.position}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{row.presentDays}</td>
                            <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">{row.lateDays}</td>
                            <td className="py-3 px-4 text-center font-mono text-blue-700">{row.halfDays}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{row.totalHours}h</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  row.punctuality >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.punctuality >= 75
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {row.punctuality}%
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

          {/* REPORT 3: DEPARTMENT ATTENDANCE REPORT */}
          {selectedAttReport === 'department' && (
            <div className="space-y-4">
              <ReportPrintHeader
                title="Departmental Attendance & Punctuality Report"
                subtitle="Departmental attendance rates, staffing headcounts, and operational coverage"
                filters={[{ label: 'Date', value: attReportDate }]}
                recordCount={departmentReportData.length}
              />

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Department Attendance Breakdown ({attReportDate})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {departmentReportData.length} departments
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Department Name</th>
                        <th className="py-3 px-4">Department Head</th>
                        <th className="py-3 px-4 text-center">Staff Headcount</th>
                        <th className="py-3 px-4 text-center">Present Today</th>
                        <th className="py-3 px-4 text-center">Late Arrivals</th>
                        <th className="py-3 px-4 text-center">Absences</th>
                        <th className="py-3 px-4 text-center">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentReportData.map((dept) => (
                        <tr key={dept.departmentName} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">{dept.departmentName}</td>
                          <td className="py-3 px-4 text-slate-600">{dept.manager}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{dept.staffCount}</td>
                          <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">{dept.presentCount}</td>
                          <td className="py-3 px-4 text-center font-mono text-amber-700">{dept.lateCount}</td>
                          <td className="py-3 px-4 text-center font-mono text-rose-700">{dept.absentCount}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                                dept.attendanceRate >= 90
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : dept.attendanceRate >= 75
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {dept.attendanceRate}%
                            </span>
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

          {/* REPORT 4: LATE & ABSENCE AUDIT REPORT */}
          {selectedAttReport === 'late_absence' && (
            <div className="space-y-4">
              <ReportPrintHeader
                title="Late Arrival & Absence Compliance Audit Report"
                subtitle="Official exception report of arrivals after 08:15 grace period and unexcused absences"
                filters={[
                  ...(attReportDept !== 'All' ? [{ label: 'Department', value: attReportDept }] : []),
                  ...(attReportSearch ? [{ label: 'Search Query', value: attReportSearch }] : []),
                ]}
                recordCount={lateAbsenceReportData.length}
              />

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Late Arrivals & Absences
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {lateAbsenceReportData.length} incidents logged
                  </span>
                </div>

                {lateAbsenceReportData.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No late arrival or absence incidents found.</p>
                    <p className="text-xs text-slate-400 mt-1">Excellent punctuality record maintained.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Employee ID</th>
                          <th className="py-3 px-4">Employee Name</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Check-In Time</th>
                          <th className="py-3 px-4 text-center">Incident Status</th>
                          <th className="py-3 px-4">Remarks / Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lateAbsenceReportData.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.date}</td>
                            <td className="py-3 px-4 font-mono text-amber-900">{rec.employeeId}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                            <td className="py-3 px-4 text-slate-600">{rec.department}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-amber-700">{rec.checkIn || 'No Check-In'}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  rec.status === 'Late'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={rec.notes}>
                              {rec.notes || 'Arrival beyond 08:15 grace period'}
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

          {/* REPORT 5: INDIVIDUAL EMPLOYEE ATTENDANCE REPORT */}
          {selectedAttReport === 'employee' && (
            <div className="space-y-4">
              <ReportPrintHeader
                title={`Individual Attendance History: ${currentReportEmployee?.fullName || ''}`}
                subtitle={`Employee ID: ${currentReportEmployee?.employeeId} • ${currentReportEmployee?.department} • ${currentReportEmployee?.position}`}
                filters={[
                  { label: 'Employee ID', value: currentReportEmployee?.employeeId || '' },
                  { label: 'Department', value: currentReportEmployee?.department || '' },
                  { label: 'Position', value: currentReportEmployee?.position || '' },
                ]}
                recordCount={employeeAttendanceData.length}
              />

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Attendance Log: {currentReportEmployee?.fullName} ({currentReportEmployee?.employeeId})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {employeeAttendanceData.length} days logged
                  </span>
                </div>

                {employeeAttendanceData.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No attendance entries recorded for this employee.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Check-In</th>
                          <th className="py-3 px-4">Check-Out</th>
                          <th className="py-3 px-4 text-center">Working Hours</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Operational Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeAttendanceData.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.date}</td>
                            <td className="py-3 px-4 font-mono text-emerald-700">{rec.checkIn || '—'}</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOut || '—'}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                              {rec.workingHours > 0 ? `${rec.workingHours}h` : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : rec.status === 'Half Day'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : rec.status === 'On Leave'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={rec.notes}>
                              {rec.notes || '—'}
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
        </div>
      )}

      {/* MANUAL ATTENDANCE MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold">Manual Attendance Entry</h3>
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Active Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualRecord.employeeId}
                  onChange={(e) => setManualRecord({ ...manualRecord, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="">-- Choose Active Employee --</option>
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.employeeId}>
                      {e.employeeId} - {e.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={manualRecord.date}
                  onChange={(e) => setManualRecord({ ...manualRecord, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={manualRecord.checkIn}
                    onChange={(e) => setManualRecord({ ...manualRecord, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={manualRecord.checkOut}
                    onChange={(e) => setManualRecord({ ...manualRecord, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Working Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualRecord.workingHours}
                    onChange={(e) => setManualRecord({ ...manualRecord, workingHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={manualRecord.status}
                    onChange={(e) => setManualRecord({ ...manualRecord, status: e.target.value as AttendanceStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={manualRecord.notes}
                  onChange={(e) => setManualRecord({ ...manualRecord, notes: e.target.value })}
                  placeholder="e.g. Field duty in Dire Dawa or NBE submission"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW OVERTIME MODAL */}
      {isNewOvertimeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold">Lodge Overtime Request</h3>
              <button type="button" onClick={() => setIsNewOvertimeOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleOvertimeSubmit} className="p-6 space-y-4 text-xs">
              {otError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700">
                  {otError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee <span className="text-rose-500">* (Active Staff)</span>
                </label>
                <select
                  required
                  value={otData.employeeId}
                  onChange={(e) => setOtData({ ...otData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                >
                  <option value="">-- Choose Active Employee --</option>
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.employeeId}>
                      {e.employeeId} - {e.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date Worked</label>
                <input
                  type="date"
                  required
                  value={otData.date}
                  onChange={(e) => setOtData({ ...otData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overtime Duration</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={otData.overtimeHours}
                    onChange={(e) => setOtData({ ...otData, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate Multiplier</label>
                  <select
                    value={otData.rateMultiplier}
                    onChange={(e) => setOtData({ ...otData, rateMultiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value={1.5}>1.5x (Normal Weekday)</option>
                    <option value={2.0}>2.0x (Weekend / Public Holiday)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Operational Justification</label>
                <textarea
                  rows={3}
                  required
                  value={otData.reason}
                  onChange={(e) => setOtData({ ...otData, reason: e.target.value })}
                  placeholder="e.g. Q3 treaty retrocession reconciliation or datacenter maintenance..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewOvertimeOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Submit Overtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
