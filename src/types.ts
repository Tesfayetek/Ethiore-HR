export type UserRole = 'Administrator' | 'HR Admin' | 'Employee';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
  employeeId?: string; // Linked Employee ID in Employee Master Data
  isEmailVerified?: boolean;
  status?: 'Active' | 'Inactive';
}

export interface EmployeeAccountLink {
  id: string;
  uid: string; // Firebase Auth UID
  employeeId: string; // Employee Master Data employeeId e.g. "ER-003"
  email: string;
  employeeName: string;
  department: string;
  position: string;
  accountStatus: 'Active' | 'Inactive';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  linkedBy?: string; // "Auto-Registration" or Administrator ID
}

export interface EmployeeNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  category: 'attendance' | 'leave' | 'hr' | 'general';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export type Gender = 'Male' | 'Female';
export type EmploymentType = 'Permanent' | 'Contract' | 'Probation' | 'Intern';
export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: string;
  employeeId: string; // Unique
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  employmentDate: string; // YYYY-MM-DD
  department: string;
  position: string;
  employmentType: EmploymentType;
  workLocation: string;
  manager: string;
  phoneNumber: string;
  emailAddress: string;
  photo: string;
  photoStoragePath?: string;
  photoUpdatedAt?: string;
  status: EmployeeStatus;
  leaveBalance?: number; // Current available statutory leave balance in days (from Excel Import or Employee Master Data)
}

export type LeaveStatus = 'Recorded' | 'Active' | 'Completed' | 'Cancelled';

export interface LeaveRecord {
  id: string; // Leave ID e.g. "LEV-101"
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number; // Number of Days
  reason: string;
  status: LeaveStatus;
  createdBy: string;
  createdDate: string; // YYYY-MM-DD
  appliedDate?: string;
  approvedBy?: string;
}

export interface YearlyLeaveRecord {
  year: number;
  entitlement: number;
  used: number;
  unused: number;
  notes?: string;
}

export interface CarryForwardBreakdown {
  currentLeaveYear: number;
  currentYearEntitlement: number;
  previousYearUnused: number; // Year N-1 (e.g. 2025)
  secondPreviousYearUnused: number; // Year N-2 (e.g. 2024)
  totalEligibleCarryForward: number; // Sum of eligible unused annual leave balances (N-1 + N-2)
  currentYearUsed: number; // Leave used in the current leave year
  availableAnnualLeave: number; // Current Year's Entitlement + Eligible Carry-Forward Leave - Leave Used
  expiredOlderLeave: number; // Unused balances older than maxCarryForwardYears excluded from carry-forward
  maxCarryForwardYears: number; // Configurable by Administrator (default: 2)
  yearlyHistory: YearlyLeaveRecord[];
}

export interface LeaveCarryForwardPolicy {
  maxCarryForwardYears: number; // default: 2
  currentLeaveYear: number; // default: 2026
  statutoryBaseDays: number; // default: 16
  allowCarryForward: boolean; // default: true
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: string;
  entitled: number; // Entitled Days
  taken: number; // Used Days
  pending?: number;
  remaining: number; // Remaining / Available Days

  // Annual Leave Carry-Forward Details (authoritative source of truth)
  currentLeaveYear?: number;
  currentYearEntitlement?: number;
  previousYearUnused?: number;
  secondPreviousYearUnused?: number;
  totalEligibleCarryForward?: number;
  currentYearUsed?: number;
  availableAnnualLeave?: number;
  expiredOlderLeave?: number;
  carryForwardBreakdown?: CarryForwardBreakdown;
  yearlyHistory?: YearlyLeaveRecord[];
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  department: string;
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  workingHours: number;
  status: AttendanceStatus;
  notes?: string;
}

export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected';

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  normalHours: number;
  overtimeHours: number;
  rateMultiplier: number; // 1.5 or 2.0
  reason: string;
  status: OvertimeStatus;
  approvedBy?: string;
}

export interface CompanyInfo {
  name: string;
  shortName: string;
  tin: string;
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  phoneNumber: string;
  telephone?: string;
  email: string;
  website: string;
  currency: string;
  fiscalYearStart: string;
  workingDays?: string;
  logoUrl?: string;
  logoStoragePath?: string;
  logoUpdatedAt?: string;
  logoFileName?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  grade: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  defaultDays: number;
  isPaid: boolean;
  carryForward: boolean;
  description: string;
}

export type LeaveType = LeaveTypeConfig;

export interface EthiopianHoliday {
  id: string;
  name: string;
  amharicName: string;
  date: string;
  isFixed: boolean;
}

export interface AttendanceSettings {
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  workStartTime: string;
  workEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  overtimeStandardRate: number; // 1.5
  overtimeHolidayRate: number;  // 2.0
  workingDays: string[];
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isDefault: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  performedBy: string;
  userId?: string;
  userRole: UserRole;
  action: string;
  module: 'Employee Master Data' | 'Leave Management' | 'Attendance' | 'Configuration' | 'User Management';
  details: string;
  recordType?: string;
  recordId?: string;
  settingName?: string;
  previousValue?: string;
  newValue?: string;
}
