import {
  CompanyInfo,
  Department,
  Position,
  Employee,
  LeaveTypeConfig,
  LeaveRecord,
  LeaveBalance,
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
    photo: '',
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

// Baseline statutory leave balance
export const initialLeaveBalances: LeaveBalance[] = [
  {
    id: 'bal-EMP001-lt-annual',
    employeeId: 'EMP001',
    leaveType: 'Annual Leave',
    entitled: 18,
    taken: 3,
    pending: 0,
    remaining: 18,
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
    endDate: '2026-01-12',
    days: 3,
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
  },
  {
    id: 'usr-hr-admin',
    email: 'hradmin@ethiopianre.com',
    displayName: 'HR Admin (Operations)',
    role: 'HR Admin',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
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
  },
  {
    id: 'usr-admin-contactesfaye',
    email: 'contactesfaye@gmail.com',
    displayName: 'Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
  },
  {
    id: 'usr-admin-seblework',
    email: 'sebleworksisay01@gmail.com',
    displayName: 'Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
  },
  {
    id: 'usr-admin-arabsa',
    email: 'arabsafashion@gmail.com',
    displayName: 'HRMS Super Administrator',
    role: 'Administrator',
    createdAt: '2026-01-01T08:00:00Z',
    status: 'Active',
  },
];

// Production-ready: starts with 0 linked accounts until employee registers
export const initialEmployeeAccountLinks: EmployeeAccountLink[] = [];

// Production-ready: starts with 0 audit logs until real activity takes place
export const initialAuditLogs: AuditLog[] = [];

// Production-ready: starts with 0 notifications
export const initialNotifications: EmployeeNotification[] = [];
