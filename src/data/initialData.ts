import {
  CompanyInfo,
  Department,
  Position,
  Employee,
  LeaveTypeConfig,
  LeaveRecord,
  LeaveBalance,
  LeaveCarryForwardPolicy,
  AttendanceRecord,
  OvertimeRecord,
  EthiopianHoliday,
  AttendanceSettings,
  Shift,
  User,
  AuditLog,
  EmployeeAccountLink,
  EmployeeNotification,
} from '../types';
import { DEFAULT_FACELESS_AVATAR } from '../assets/defaultAvatar';

export const initialCompanyInfo: CompanyInfo = {
  name: 'Ethiopian Reinsurance S.C.',
  shortName: 'EthioRe',
  tin: '0045892189',
  registrationNumber: 'EIC/RE/001/2016',
  address: 'Kirkos Sub-City, Woreda 01, Africa Avenue (Bole Road), EthioRe Tower',
  city: 'Addis Ababa',
  country: 'Ethiopia',
  phoneNumber: '+251 11 557 3481',
  email: 'info@ethiopianre.com',
  website: 'https://www.ethiopianre.com',
  currency: 'ETB (Ethiopian Birr)',
  fiscalYearStart: 'July 8 (Hamle 1)',
};

// Production-ready: starts with 0 departments until added by Administrator
export const initialDepartments: Department[] = [];

// Production-ready: starts with 0 positions until added by Administrator
export const initialPositions: Position[] = [];

// Production legitimate employee master data
export const initialEmployees: Employee[] = [
  {
    id: 'emp-001',
    employeeId: 'EMP001',
    fullName: 'Abebe Kebede Tessema',
    gender: 'Male',
    dateOfBirth: '1988-05-14',
    employmentDate: '2020-03-01',
    department: 'Underwriting & Reinsurance Operations',
    position: 'Senior Underwriting Officer',
    employmentType: 'Permanent',
    workLocation: 'Addis Ababa - EthioRe Tower Head Office',
    manager: 'Dawit Yohannes',
    phoneNumber: '+251 91 123 4567',
    emailAddress: 'employee@ethiopianre.com',
    photo: DEFAULT_FACELESS_AVATAR,
    status: 'Active',
    leaveBalance: 18,
  },
];

// Standard Ethiopian Labor Law statutory leave policy configurations
export const initialLeaveTypes: LeaveTypeConfig[] = [
  {
    id: 'lt-annual',
    name: 'Annual Leave',
    defaultDays: 16,
    isPaid: true,
    carryForward: true,
    description: 'Statutory annual rest leave per Ethiopian Labor Proclamation (16 working days + tenure increment).',
  },
  {
    id: 'lt-sick',
    name: 'Sick Leave',
    defaultDays: 180,
    isPaid: true,
    carryForward: false,
    description: 'Medical and hospitalization leave supported by authorized clinic/hospital medical certificates.',
  },
  {
    id: 'lt-maternity',
    name: 'Maternity Leave',
    defaultDays: 120,
    isPaid: true,
    carryForward: false,
    description: 'Statutory paid maternity leave for female employees (30 days prenatal + 90 days postnatal).',
  },
  {
    id: 'lt-paternity',
    name: 'Paternity Leave',
    defaultDays: 3,
    isPaid: true,
    carryForward: false,
    description: 'Paternity leave on the birth of a child.',
  },
  {
    id: 'lt-compassionate',
    name: 'Compassionate Leave',
    defaultDays: 3,
    isPaid: true,
    carryForward: false,
    description: 'Bereavement leave for immediate family members.',
  },
  {
    id: 'lt-study',
    name: 'Study & Exam Leave',
    defaultDays: 5,
    isPaid: true,
    carryForward: false,
    description: 'Approved professional and reinsurance certification examinations.',
  },
];

// Official Ethiopian Reinsurance Leave Carry-Forward Policy (Default: 2 years)
export const initialLeavePolicy: LeaveCarryForwardPolicy = {
  maxCarryForwardYears: 2,
  currentLeaveYear: 2026,
  statutoryBaseDays: 16,
  allowCarryForward: true,
};

// Baseline statutory leave balance with authoritative 2-year carry-forward calculation
export const initialLeaveBalances: LeaveBalance[] = [
  {
    id: 'bal-EMP001-lt-annual',
    employeeId: 'EMP001',
    employeeName: 'Abebe Kebede Tessema',
    leaveType: 'Annual Leave',
    entitled: 18,
    taken: 2,
    pending: 0,
    remaining: 24, // Available: 18 + (5 + 3) - 2 = 24 days
    currentLeaveYear: 2026,
    currentYearEntitlement: 18,
    previousYearUnused: 5,
    secondPreviousYearUnused: 3,
    totalEligibleCarryForward: 8,
    currentYearUsed: 2,
    availableAnnualLeave: 24,
    expiredOlderLeave: 4,
    yearlyHistory: [
      { year: 2026, entitlement: 18, used: 2, unused: 16, notes: 'Current Leave Year 2026' },
      { year: 2025, entitlement: 18, used: 13, unused: 5, notes: 'Previous Year (Year N-1, Eligible Carry-Forward)' },
      { year: 2024, entitlement: 17, used: 14, unused: 3, notes: 'Second Previous Year (Year N-2, Eligible Carry-Forward)' },
      { year: 2023, entitlement: 16, used: 12, unused: 4, notes: 'Older Unused Leave (Year N-3, Expired / Ineligible beyond 2 years)' },
    ],
    carryForwardBreakdown: {
      currentLeaveYear: 2026,
      currentYearEntitlement: 18,
      previousYearUnused: 5,
      secondPreviousYearUnused: 3,
      totalEligibleCarryForward: 8,
      currentYearUsed: 2,
      availableAnnualLeave: 24,
      expiredOlderLeave: 4,
      maxCarryForwardYears: 2,
      yearlyHistory: [
        { year: 2026, entitlement: 18, used: 2, unused: 16, notes: 'Current Leave Year 2026' },
        { year: 2025, entitlement: 18, used: 13, unused: 5, notes: 'Previous Year (Year N-1, Eligible Carry-Forward)' },
        { year: 2024, entitlement: 17, used: 14, unused: 3, notes: 'Second Previous Year (Year N-2, Eligible Carry-Forward)' },
        { year: 2023, entitlement: 16, used: 12, unused: 4, notes: 'Older Unused Leave (Year N-3, Expired / Ineligible beyond 2 years)' },
      ],
    },
  },
];

// Baseline leave records
export const initialLeaveRecords: LeaveRecord[] = [
  {
    id: 'LEV-101',
    employeeId: 'EMP001',
    employeeName: 'Abebe Kebede Tessema',
    department: 'Underwriting & Reinsurance Operations',
    leaveType: 'Annual Leave',
    startDate: '2026-01-10',
    endDate: '2026-01-11',
    days: 2,
    reason: 'Statutory annual leave taken',
    status: 'Recorded',
    createdBy: 'HR Administration',
    createdDate: '2026-01-05',
    appliedDate: '2026-01-05',
    approvedBy: 'HR Administration',
  },
];

// Production-ready: starts with 0 attendance records
export const initialAttendanceRecords: AttendanceRecord[] = [];

// Production-ready: starts with 0 overtime records
export const initialOvertimeRecords: OvertimeRecord[] = [];

// Official statutory Ethiopian Public Holidays (Standard Policy)
export const initialEthiopianHolidays: EthiopianHoliday[] = [
  { id: 'hol-1', name: 'Ethiopian New Year (Enkutatash)', amharicName: 'እንቁጣጣሽ', date: '2026-09-11', isFixed: true },
  { id: 'hol-2', name: 'Finding of the True Cross (Meskel)', amharicName: 'መስቀል', date: '2026-09-27', isFixed: true },
  { id: 'hol-3', name: 'The Prophet\'s Birthday (Mawlid)', amharicName: 'መውሊድ', date: '2026-09-04', isFixed: false },
  { id: 'hol-4', name: 'Ethiopian Christmas (Genna)', amharicName: 'ገና', date: '2027-01-07', isFixed: true },
  { id: 'hol-5', name: 'Ethiopian Epiphany (Timket)', amharicName: 'ጥምቀት', date: '2027-01-19', isFixed: true },
  { id: 'hol-6', name: 'Victory of Adwa Day', amharicName: 'የአድዋ ድል በዓል', date: '2027-03-02', isFixed: true },
  { id: 'hol-7', name: 'Good Friday (Siklet)', amharicName: 'ስቅለት', date: '2027-04-30', isFixed: false },
  { id: 'hol-8', name: 'Ethiopian Easter (Fasika)', amharicName: 'ፋሲካ', date: '2027-05-02', isFixed: false },
  { id: 'hol-9', name: 'International Workers\' Day', amharicName: 'የሰራተኞች ቀን', date: '2027-05-01', isFixed: true },
  { id: 'hol-10', name: 'Patriots\' Victory Day', amharicName: 'የአርበኞች ቀን', date: '2027-05-05', isFixed: true },
  { id: 'hol-11', name: 'Eid al-Fitr', amharicName: 'ዒድ አል-ፈጥር', date: '2027-03-21', isFixed: false },
  { id: 'hol-12', name: 'Eid al-Adha', amharicName: 'ዒድ አል-አድሃ', date: '2027-05-28', isFixed: false },
];
export const initialHolidays = initialEthiopianHolidays;

export const initialAttendanceSettings: AttendanceSettings = {
  workStartTime: '08:00',
  workEndTime: '17:00',
  lunchStartTime: '12:30',
  lunchEndTime: '13:30',
  gracePeriodMinutes: 15,
  halfDayThresholdHours: 4,
  overtimeStandardRate: 1.5,
  overtimeHolidayRate: 2.0,
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

export const initialShifts: Shift[] = [
  {
    id: 'shift-1',
    name: 'Head Office Standard Business Shift',
    startTime: '08:00',
    endTime: '17:00',
    isDefault: true,
  },
];

// Production legitimate system users
export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    email: 'admin@ethiopianre.com',
    displayName: 'Administrator (EthioRe HRMS)',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-hr-admin',
    email: 'hradmin@ethiopianre.com',
    displayName: 'HR Admin (Operations)',
    role: 'HR Admin',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-hr-officer',
    email: 'hrofficer@ethiopianre.com',
    displayName: 'HR Officer (Records & Leave)',
    role: 'HR Officer',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-employee-demo',
    email: 'employee@ethiopianre.com',
    displayName: 'EthioRe Staff Member',
    role: 'Employee',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    employeeId: 'EMP001',
    isEmailVerified: true,
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-admin-contactesfaye',
    email: 'contactesfaye@gmail.com',
    displayName: 'Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-admin-seblework',
    email: 'sebleworksisay01@gmail.com',
    displayName: 'Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
  {
    id: 'usr-admin-arabsa',
    email: 'arabsafashion@gmail.com',
    displayName: 'HRMS Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
    avatar: DEFAULT_FACELESS_AVATAR,
  },
];

// Production-ready: starts with 0 linked accounts until employee registers
export const initialEmployeeAccountLinks: EmployeeAccountLink[] = [];

// Production-ready: starts with 0 audit logs until real activity takes place
export const initialAuditLogs: AuditLog[] = [];

// Production-ready: starts with 0 notifications
export const initialNotifications: EmployeeNotification[] = [];
