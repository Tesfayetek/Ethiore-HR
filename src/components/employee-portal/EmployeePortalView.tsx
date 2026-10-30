import React, { useState, useEffect } from 'react';
import {
  User,
  Employee,
  LeaveRecord,
  LeaveBalance,
  AttendanceRecord,
  OvertimeRecord,
  EmployeeNotification,
} from '../../types';
import { storageService } from '../../services/storage';
import {
  CalendarDays,
  Clock,
  Briefcase,
  CheckCircle2,
  Calendar,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  KeyRound,
  Bell,
  RefreshCw,
  Send,
  Upload,
  Camera,
  Check,
  X,
  Printer,
  Calculator,
  Info,
} from 'lucide-react';
import { EthioReLogo } from '../common/EthioReLogo';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { FacelessAvatar } from '../common/FacelessAvatar';
import { ethioReTheme } from '../../theme/colors';

interface EmployeePortalViewProps {
  currentUser: User;
  initialSubTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  currentUser,
  initialSubTab = 'overview',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'profile' | 'leave' | 'attendance' | 'notifications'>((initialSubTab as any) || 'overview');

  useEffect(() => {
    if (initialSubTab && ['overview', 'profile', 'leave', 'attendance', 'notifications'].includes(initialSubTab)) {
      setActiveSubTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [clockActionMessage, setClockActionMessage] = useState<string | null>(null);
  const [storageTick, setStorageTick] = useState(0);

  // Synchronize automatically with Master Data updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      setStorageTick((t) => t + 1);
    };

    window.addEventListener('ethiore_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('ethiore_storage_update', handleStorageUpdate);
    };
  }, []);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Email verification status state
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  // Helper date formatter for leave table e.g. "Jan 10"
  const formatLeaveDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (mIdx >= 0 && mIdx < 12 && !isNaN(day)) {
          return `${months[mIdx]} ${day}`;
        }
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Helper to read current remaining leave balance from Employee Master Data
  const getEmployeeBalanceText = (emp?: Employee): string => {
    if (!emp) return 'Not Available';
    if (typeof emp.leaveBalance === 'number') {
      return `${emp.leaveBalance}`;
    }
    if (emp.leaveBalance !== undefined && emp.leaveBalance !== null && String(emp.leaveBalance).trim() !== '') {
      const parsed = Number(emp.leaveBalance);
      return isNaN(parsed) ? String(emp.leaveBalance) : `${parsed}`;
    }
    return '0 Days';
  };

  // Retrieve linked Employee from Master Data
  const employee: Employee | undefined = currentUser.employeeId
    ? storageService.getEmployeeById(currentUser.employeeId) ||
      storageService.findEmployeeByEmail(currentUser.email)
    : storageService.findEmployeeByEmail(currentUser.email);

  const empId = employee?.employeeId || currentUser.employeeId || 'ER-012';

  // Personal records
  const personalLeaves = storageService.getLeaveRecords().filter((l) => l.employeeId === empId);
  const personalBalances = storageService.getLeaveBalances().filter((b) => b.employeeId === empId);
  const personalAttendance = storageService.getAttendanceRecords().filter((a) => a.employeeId === empId);
  const personalOvertime = storageService.getOvertimeRecords().filter((o) => o.employeeId === empId);
  const personalNotifications = storageService.getNotifications(empId);

  // Today's attendance record
  const todayStr = '2026-09-08'; // System reference date
  const todayAttendance = personalAttendance.find((a) => a.date === todayStr);

  const handleClockIn = () => {
    if (!employee) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const res = storageService.recordCheckIn(employee.employeeId, timeStr);
    if (res.success) {
      setClockActionMessage(`Check-in recorded at ${timeStr}`);
      setTimeout(() => setClockActionMessage(null), 3000);
    }
  };

  const handleClockOut = () => {
    if (!employee) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const res = storageService.recordCheckOut(employee.employeeId, timeStr);
    if (res.success) {
      setClockActionMessage(`Check-out recorded at ${timeStr}`);
      setTimeout(() => setClockActionMessage(null), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters in length.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setIsChangingPass(true);
    try {
      const res = await storageService.changePassword(newPassword);
      if (res.success) {
        setPasswordMsg({ type: 'success', text: res.message });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsChangePasswordModalOpen(false), 1500);
      } else {
        setPasswordMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleCheckVerify = async () => {
    setIsCheckingVerify(true);
    setVerifyMsg(null);
    try {
      const res = await storageService.checkEmailVerified();
      setVerifyMsg(res.message);
    } finally {
      setIsCheckingVerify(false);
    }
  };

  const handleResendVerify = async () => {
    setVerifyMsg(null);
    const res = await storageService.resendVerificationEmail();
    setVerifyMsg(res.message);
  };

  const annualBalance = personalBalances.find((b) => b.leaveType === 'Annual Leave');
  const unreadNotifCount = personalNotifications.filter((n) => !n.read).length;

  // Unverified users cannot access the HRMS portal
  if (!currentUser.isEmailVerified) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white border border-amber-300 rounded-2xl p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
          <Mail className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
            Verification Pending
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">
            Corporate Email Verification Required
          </h2>
          <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Per Ethiopian Reinsurance security standards, all self-service HRMS accounts must verify their corporate email address before accessing employee records, attendance timecards, leave management, or company services.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 font-semibold max-w-sm mx-auto">
          {currentUser.email}
        </div>

        {verifyMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {verifyMsg}
          </div>
        )}

        <div className="space-y-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={handleCheckVerify}
            disabled={isCheckingVerify}
            className="w-full py-2.5 px-4 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#CCA352] ${isCheckingVerify ? 'animate-spin' : ''}`} />
            <span>Check Verification Status</span>
          </button>

          <button
            type="button"
            onClick={handleResendVerify}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Resend Verification Email</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Employee Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0E3D52] via-[#0A2D3D] to-[#051C26] rounded-xl p-6 border-b-2 border-[#CCA352] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <FacelessAvatar
            src={employee?.photo || currentUser.avatar}
            alt={employee?.fullName || currentUser.displayName}
            size="xl"
            className="border-2 border-[#CCA352] shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CCA352] text-[#051C26] uppercase tracking-wider">
                Staff Self-Service Portal
              </span>
              <span className="text-xs text-[#E2BE6C] font-mono">
                {employee?.employeeId || 'ID Verified'}
              </span>
              {currentUser.isEmailVerified && (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded text-[10px] font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1">
              Welcome back, {employee?.fullName || currentUser.displayName}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center space-x-2">
              <span>{employee?.position || 'Ethiopian Reinsurance Team Member'}</span>
              <span>•</span>
              <span className="text-[#E2BE6C]">{employee?.department || 'Addis Ababa Head Office'}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#0E3D52] hover:bg-[#186382] border border-[#CCA352]/40 text-slate-100 font-semibold rounded-lg text-xs transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#CCA352]" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs px-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'overview'
              ? 'border-[#186382] text-[#186382] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>My Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'profile'
              ? 'border-[#186382] text-[#186382] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>My Master Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('leave')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'leave'
              ? 'border-[#186382] text-[#186382] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>My Leave & Balances</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('attendance')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'attendance'
              ? 'border-[#186382] text-[#186382] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Attendance & Timecard</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'notifications'
              ? 'border-[#186382] text-[#186382] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
          {unreadNotifCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {clockActionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{clockActionMessage}</span>
        </div>
      )}

      {/* ================= 1. TAB: OVERVIEW ================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Leave Balance from Employee Master Data */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Leave Balance
                </span>
                <div className="text-2xl font-bold text-[#0E3D52] mt-1 font-mono">
                  {typeof employee?.leaveBalance === 'number'
                    ? employee.leaveBalance
                    : (annualBalance?.remaining ?? 16)}{' '}
                  <span className="text-xs font-normal text-slate-400">days</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Master Data • ID: {employee?.employeeId || 'Active'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#0E3D52]/10 text-[#0E3D52] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-[#186382]" />
              </div>
            </div>

            {/* Metric 2: Attendance Presence */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Monthly Presence
                </span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {personalAttendance.filter((a) => a.status === 'Present').length}{' '}
                  <span className="text-xs font-normal text-slate-400">Days</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  On-Time Rate: 100%
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3: Today's Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Today's Timecard
                </span>
                <div className="text-base font-bold text-slate-900 mt-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{todayAttendance?.checkIn ? `Checked In: ${todayAttendance.checkIn}` : 'Present'}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Shift: 08:00 - 17:00 EAT
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#CCA352]" />
              </div>
            </div>

            {/* Metric 4: Overtime Logged */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Overtime Accrued
                </span>
                <div className="text-2xl font-bold text-[#186382] mt-1">
                  {personalOvertime.reduce((acc, o) => acc + (o.overtimeHours || 0), 0).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {personalOvertime.length} claims submitted
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#186382]/10 text-[#186382] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Clock In / Out Banner Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0E3D52] flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#CCA352]" />
                <span>Daily Biometric Virtual Kiosk</span>
              </h3>
              <p className="text-xs text-slate-600">
                Log your daily check-in and check-out at Ethiopian Reinsurance Tower. Synchronized with Cloud Firestore backend.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleClockIn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                Log Check-In
              </button>
              <button
                type="button"
                onClick={handleClockOut}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                Log Check-Out
              </button>
            </div>
          </div>

          {/* Recent Leave Requests & Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: My Statutory Leave Balances */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4 text-[#186382]" />
                  <span>My Statutory Leave Balances</span>
                </h3>
                <span className="text-[11px] text-[#A6802C] font-semibold">Ethiopian Labor Law</span>
              </div>

              <div className="space-y-3">
                {personalBalances.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No active leave balance records initialized.
                  </p>
                ) : (
                  personalBalances.map((bal) => (
                    <div
                      key={bal.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{bal.leaveType}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Entitled: {bal.entitled} days • Used: {bal.taken} days
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#186382]">
                          {bal.remaining}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500">days left</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Leave History & Balance */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#186382]" />
                  <span>Leave History & Balance</span>
                </h3>
                <span className="text-[11px] text-[#A6802C] font-semibold">Master Data Synchronized</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold text-slate-800">Leave Type</th>
                      <th className="py-2 px-3 font-semibold text-slate-800">From</th>
                      <th className="py-2 px-3 font-semibold text-slate-800">To</th>
                      <th className="py-2 px-3 font-semibold text-slate-800 text-right">Days</th>
                      <th className="py-2 px-3 font-semibold text-slate-800 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {personalLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No leave records logged.
                        </td>
                      </tr>
                    ) : (
                      personalLeaves.slice(0, 5).map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{l.leaveType}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{formatLeaveDate(l.startDate)}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{formatLeaveDate(l.endDate)}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 text-right">{l.days}</td>
                          <td className="py-2 px-3 font-bold text-[#186382] text-right">
                            {getEmployeeBalanceText(employee)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. TAB: MASTER PROFILE ================= */}
      {activeSubTab === 'profile' && employee && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <FacelessAvatar
                src={employee?.photo || currentUser.avatar}
                alt={employee.fullName}
                size="xl"
                className="border-2 border-[#CCA352] shrink-0"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{employee.fullName}</h2>
                <p className="text-xs text-[#186382] font-semibold mt-0.5">
                  {employee.position} • {employee.department}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Employee ID: {employee.employeeId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#082836] hover:bg-[#186382] text-white border border-[#CCA352]/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#CCA352]" />
                <span>Print Profile</span>
              </button>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Active Employee
              </span>
            </div>
          </div>

          <div className="p-6">
            <ReportPrintHeader
              title={`Employee Personnel Dossier: ${employee.fullName}`}
              subtitle={`ID: ${employee.employeeId} • ${employee.department} • Position: ${employee.position}`}
              filters={[
                { label: 'Status', value: employee.status },
                { label: 'Employment Type', value: employee.employmentType },
                { label: 'Work Location', value: employee.workLocation },
              ]}
            />

            {/* Prominent Official Leave Balance Card */}
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  Current Leave Balance
                </span>
                <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">
                  {typeof employee.leaveBalance === 'number'
                    ? `${employee.leaveBalance} Days`
                    : `${annualBalance?.remaining ?? 16} Days`}
                </span>
                <span className="text-[10px] text-amber-800">
                  Available leave entitlement directly from Ethiopian Reinsurance Employee Master Data
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-amber-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Employment Type:</span>
                <p className="font-bold">{employee.employmentType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Date of Employment:</span>
                <p className="font-bold font-mono">{employee.employmentDate}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Date of Birth:</span>
                <p className="font-bold font-mono">{employee.dateOfBirth}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Gender:</span>
                <p className="font-bold">{employee.gender}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Supervisor / Manager:</span>
                <p className="font-bold">{employee.manager}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Work Location:</span>
                <p className="font-bold">{employee.workLocation}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Official Corporate Email:</span>
                <p className="font-bold font-mono text-[#186382]">{employee.emailAddress}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Contact Phone:</span>
                <p className="font-bold font-mono">{employee.phoneNumber}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Authentication Link:</span>
                <p className="font-bold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Linked to Firebase Auth UID ({currentUser.id.slice(0, 10)}...)</span>
                </p>
              </div>
            </div>

            {/* Leave Entitlements Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                <CalendarDays className="w-4 h-4 text-[#186382]" />
                <span>Statutory Leave Entitlements & Balances</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {personalBalances.map((bal) => (
                  <div key={bal.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-semibold text-slate-700 block truncate text-[11px]">{bal.leaveType}</span>
                    <div className="mt-1 flex items-baseline space-x-1">
                      <span className="text-lg font-bold text-emerald-700 font-mono">{bal.remaining}</span>
                      <span className="text-[10px] text-slate-500">/ {bal.entitled} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#186382]" />
                <span>Attendance Log Summary</span>
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Check In</th>
                      <th className="p-2.5">Check Out</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {personalAttendance.slice(0, 5).map((att) => (
                      <tr key={att.id}>
                        <td className="p-2.5 font-mono">{att.date}</td>
                        <td className="p-2.5 font-mono text-emerald-700">{att.checkIn || '—'}</td>
                        <td className="p-2.5 font-mono text-slate-700">{att.checkOut || '—'}</td>
                        <td className="p-2.5 font-semibold">{att.workingHours > 0 ? `${att.workingHours}h` : '—'}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {att.status}
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

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#186382] shrink-0" />
            <span>
              Official personnel master data is authoritative and maintained by Ethiopian Reinsurance S.C. HR & Administration Department. Contact hr@ethiopianre.com for official data modifications.
            </span>
          </div>
        </div>
      )}

      {/* ================= 3. TAB: LEAVE & BALANCES ================= */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <h3 className="text-sm font-bold text-[#0E3D52]">Personal Leave History</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Leave Statement</span>
                </button>
              </div>
            </div>

            <ReportPrintHeader
              title="Personal Leave Entitlements & History Statement"
              subtitle={`Staff Member: ${employee?.fullName || currentUser.displayName} (${employee?.employeeId || currentUser.id}) • ${employee?.department || 'Ethiopian Reinsurance S.C.'}`}
              recordCount={personalLeaves.length}
            />

            {/* Statutory Annual Leave Carry-Forward Breakdown Card */}
            {annualBalance && (
              <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50/40 border border-amber-200 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-[#0E3D52] text-white">
                      <Calculator className="w-3.5 h-3.5 text-[#CCA352]" />
                    </span>
                    <span className="font-bold text-xs text-[#0E3D52] uppercase tracking-wider">
                      Annual Leave Carry-Forward Calculation Breakdown (Leave Year {annualBalance.carryForwardBreakdown?.currentLeaveYear || 2026})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                    Net Available: {annualBalance.carryForwardBreakdown?.availableAnnualLeave ?? annualBalance.remaining} Days
                  </span>
                </div>

                {/* 8 Statutory Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Leave Year</span>
                    <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                      {annualBalance.carryForwardBreakdown?.currentLeaveYear || 2026}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Entitlement</span>
                    <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                      {annualBalance.carryForwardBreakdown?.currentYearEntitlement ?? annualBalance.entitled} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">3. Prev Year (N-1)</span>
                    <span className="font-mono font-bold text-sm text-emerald-700 block mt-0.5">
                      +{annualBalance.carryForwardBreakdown?.previousYearUnused ?? 0} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">4. 2nd Prev (N-2)</span>
                    <span className="font-mono font-bold text-sm text-emerald-700 block mt-0.5">
                      +{annualBalance.carryForwardBreakdown?.secondPreviousYearUnused ?? 0} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">5. Eligible Carry-Fwd</span>
                    <span className="font-mono font-bold text-sm text-emerald-800 block mt-0.5">
                      +{annualBalance.carryForwardBreakdown?.totalEligibleCarryForward ?? 0} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">6. Current Year Used</span>
                    <span className="font-mono font-bold text-sm text-amber-800 block mt-0.5">
                      −{annualBalance.carryForwardBreakdown?.currentYearUsed ?? annualBalance.taken} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#0E3D52]/10 border border-[#186382]/30 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-[#0E3D52] block">7. Total Available</span>
                    <span className="font-mono font-extrabold text-sm text-[#0E3D52] block mt-0.5">
                      {annualBalance.carryForwardBreakdown?.availableAnnualLeave ?? annualBalance.remaining} d
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-rose-800 block">8. Expired (&gt;2 yrs)</span>
                    <span className="font-mono font-bold text-sm text-rose-700 block mt-0.5">
                      {annualBalance.carryForwardBreakdown?.expiredOlderLeave ?? 0} d
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-[#186382] shrink-0" />
                  <span>
                    Formula: {annualBalance.carryForwardBreakdown?.currentYearEntitlement ?? annualBalance.entitled} (Entitled) + {annualBalance.carryForwardBreakdown?.totalEligibleCarryForward ?? 0} (Carry-Forward) − {annualBalance.carryForwardBreakdown?.currentYearUsed ?? annualBalance.taken} (Used) = <strong>{annualBalance.carryForwardBreakdown?.availableAnnualLeave ?? annualBalance.remaining} Available Days</strong>. Unused balances older than 2 years are excluded from carry-forward.
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold text-slate-800">Leave Type</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800">From</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800">To</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800 text-right">Days</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800 text-right">Balance</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-800">Reason</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-400">Record ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No leave records logged.
                      </td>
                    </tr>
                  ) : (
                    personalLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{l.leaveType}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700" title={l.startDate}>
                          {formatLeaveDate(l.startDate)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700" title={l.endDate}>
                          {formatLeaveDate(l.endDate)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 text-right">{l.days}</td>
                        <td className="py-2.5 px-3 font-bold text-[#186382] text-right">
                          {getEmployeeBalanceText(employee)}
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
                        <td className="py-2.5 px-3 text-slate-600 italic truncate max-w-[250px]">
                          {l.reason || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{l.id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <ReportPrintFooter />
          </div>
        </div>
      )}

      {/* ================= 4. TAB: ATTENDANCE & TIMECARD ================= */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <h3 className="text-sm font-bold text-[#0E3D52]">
                Personal Attendance Register & Timecard
              </h3>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Attendance Timecard</span>
              </button>
            </div>

            <ReportPrintHeader
              title="Personal Attendance & Timecard Register"
              subtitle={`Staff Member: ${employee?.fullName || currentUser.displayName} (${employee?.employeeId || currentUser.id}) • ${employee?.department || 'Ethiopian Reinsurance S.C.'}`}
              recordCount={personalAttendance.length}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Check-In</th>
                    <th className="py-2.5 px-3 font-semibold">Check-Out</th>
                    <th className="py-2.5 px-3 font-semibold">Working Hours</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personalAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No personal attendance records found.
                      </td>
                    </tr>
                  ) : (
                    personalAttendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{a.date}</td>
                        <td className="py-2 px-3 font-mono">{a.checkIn || '-'}</td>
                        <td className="py-2 px-3 font-mono">{a.checkOut || '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {a.workingHours?.toFixed(1) || '0.0'} hrs
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic">{a.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <ReportPrintFooter />
          </div>
        </div>
      )}

      {/* ================= 5. TAB: NOTIFICATIONS ================= */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#0E3D52]">Personal HR Notifications</h3>
            <span className="text-xs text-slate-500 font-mono">
              {personalNotifications.length} Total Messages
            </span>
          </div>

          <div className="space-y-3">
            {personalNotifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No notifications at this time.</p>
            ) : (
              personalNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 ${
                    notif.read ? 'bg-slate-50 border-slate-200' : 'bg-[#EBF3F7] border-[#186382]/30 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{notif.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded uppercase font-semibold">
                        {notif.category}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                  </div>
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => storageService.markNotificationAsRead(notif.id)}
                      className="px-2 py-1 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 rounded text-[11px] shrink-0 font-medium cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-[#0E3D52] p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-[#CCA352]" />
                <h3 className="font-bold text-sm">Change Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4 text-xs">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    passwordMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4 py-2 bg-[#0E3D52] hover:bg-[#186382] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {isChangingPass ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
