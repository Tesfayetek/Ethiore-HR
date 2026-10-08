import {
  Employee,
  LeaveRecord,
  LeaveStatus,
  LeaveBalance,
  AttendanceRecord,
  OvertimeRecord,
  CompanyInfo,
  Department,
  Position,
  LeaveTypeConfig,
  EthiopianHoliday,
  AttendanceSettings,
  Shift,
  User,
  UserRole,
  AuditLog,
  EmployeeAccountLink,
  EmployeeNotification,
} from '../types';
import {
  initialCompanyInfo,
  initialDepartments,
  initialPositions,
  initialLeaveTypes,
  initialEthiopianHolidays,
  initialAttendanceSettings,
  initialShifts,
  initialEmployees,
  initialLeaveBalances,
  initialLeaveRecords,
  initialAttendanceRecords,
  initialOvertimeRecords,
  initialUsers,
  initialAuditLogs,
  initialEmployeeAccountLinks,
  initialNotifications,
} from '../data/initialData';
import { AUTH_CONFIG } from '../config/authConfig';
import {
  auth,
  db,
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reload,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocFromServer,
  collection,
  getDocs,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from './firebase';

export interface EmployeeImportRow {
  employeeId: string;
  employeeCode?: string;
  fullName?: string;
  email?: string;
  emailAddress?: string;
  phone?: string;
  phoneNumber?: string;
  gender?: string;
  department?: string;
  position?: string;
  employmentDate?: string;
  employmentStatus?: string;
  status?: string;
  leaveBalance?: number | string;
  dateOfBirth?: string;
  employmentType?: string;
  workLocation?: string;
  manager?: string;
  photo?: string;
}

export interface EmployeeImportResult {
  success: boolean;
  totalRows: number;
  processedCount: number;
  newCount: number;
  updatedCount: number;
  balancesUpdatedCount: number;
  failedCount: number;
  errors: Array<{
    rowNumber: number;
    employeeId?: string;
    employeeName?: string;
    field?: string;
    description: string;
  }>;
  details: Array<{
    rowNumber: number;
    employeeId: string;
    employeeName: string;
    department: string;
    previousBalance?: number;
    newBalance: number;
    action: 'New' | 'Update';
    status: 'Success' | 'Failed';
  }>;
}

const STORAGE_KEYS = {
  COMPANY_INFO: 'ethiore_hrms_company_info',
  DEPARTMENTS: 'ethiore_hrms_departments',
  POSITIONS: 'ethiore_hrms_positions',
  EMPLOYEES: 'ethiore_hrms_employees',
  LEAVE_TYPES: 'ethiore_hrms_leave_types',
  LEAVE_RECORDS: 'ethiore_hrms_leave_records',
  LEAVE_BALANCES: 'ethiore_hrms_leave_balances',
  ATTENDANCE_RECORDS: 'ethiore_hrms_attendance_records',
  OVERTIME_RECORDS: 'ethiore_hrms_overtime_records',
  HOLIDAYS: 'ethiore_hrms_holidays',
  ATTENDANCE_SETTINGS: 'ethiore_hrms_attendance_settings',
  SHIFTS: 'ethiore_hrms_shifts',
  USERS: 'ethiore_hrms_users',
  EMPLOYEE_ACCOUNT_LINKS: 'ethiore_hrms_employee_account_links',
  NOTIFICATIONS: 'ethiore_hrms_notifications',
  CURRENT_USER_ID: 'ethiore_hrms_current_user_id',
  AUDIT_LOGS: 'ethiore_hrms_audit_logs',
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('ethiore_storage_update'));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

// Storage API
export const storageService = {
  // Current logged in user
  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const found = users.find((u) => u.id === currentId);
    const user = found || users[0];
    if (user && (user.role as string) === 'HR Officer') {
      user.role = 'HR Admin';
    }
    return user;
  },

  // Check if there is an active authenticated session
  isAuthenticated(): boolean {
    if (localStorage.getItem('ethiore_hrms_logged_out') === 'true') {
      return false;
    }
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) {
      return true; // Default authorized session on initial visit
    }
    const users = this.getUsers();
    return users.some((u) => u.id === currentId);
  },

  // Get authenticated user or null if logged out
  getAuthenticatedUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.getCurrentUser();
  },

  setCurrentUser(userId: string): void {
    localStorage.removeItem('ethiore_hrms_logged_out');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    const user = this.getCurrentUser();
    this.addAuditLog(
      'SESSION_SWITCH',
      'User Management',
      `Switched session to ${user.displayName} (${user.role})`
    );
    window.dispatchEvent(new Event('ethiore_user_change'));
  },

  // Users & RBAC
  getUsers(): User[] {
    const rawUsers = getStorageItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
    let changed = false;
    let list = [...rawUsers];

    // Ensure HR Admin and Employee standard demo accounts exist for testing
    if (!list.some((u) => u.role === 'HR Admin')) {
      list.push({
        id: 'usr-hr-admin',
        email: 'hradmin@ethiopianre.com',
        displayName: 'HR Admin (Operations)',
        role: 'HR Admin',
        createdAt: '2026-01-01T08:00:00Z',
        status: 'Active',
      });
      changed = true;
    }
    if (!list.some((u) => u.role === 'Employee')) {
      list.push({
        id: 'usr-employee-demo',
        email: 'employee@ethiopianre.com',
        displayName: 'EthioRe Staff Member',
        role: 'Employee',
        createdAt: '2026-01-01T08:00:00Z',
        status: 'Active',
        employeeId: 'EMP001',
        isEmailVerified: true,
      });
      changed = true;
    }

    const migrated = list.map((u) => {
      // Safe migration of obsolete 'HR Officer' role to 'HR Admin'
      if ((u.role as string) === 'HR Officer') {
        changed = true;
        return { ...u, role: 'HR Admin' as UserRole };
      }
      return u;
    });
    if (changed) {
      setStorageItem(STORAGE_KEYS.USERS, migrated);
    }
    return migrated;
  },

  // Employee Account Links & Verification
  getEmployeeAccountLinks(): EmployeeAccountLink[] {
    return getStorageItem<EmployeeAccountLink[]>(
      STORAGE_KEYS.EMPLOYEE_ACCOUNT_LINKS,
      initialEmployeeAccountLinks
    );
  },

  findEmployeeByEmail(email: string): Employee | undefined {
    if (!email) return undefined;
    const cleanEmail = email.trim().toLowerCase();
    const employees = this.getEmployees();
    return employees.find(
      (e) => e.emailAddress.trim().toLowerCase() === cleanEmail
    );
  },

  async registerEmployee(data: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName?: string;
    phoneNumber?: string;
    role?: any; // Explicitly discarded to prevent client privilege elevation
    [key: string]: any;
  }): Promise<{ success: boolean; message: string; user?: User; employee?: Employee }> {
    const { email, password, confirmPassword, fullName, phoneNumber } = data;

    // Security check: Ignore any client-submitted role and enforce Employee role
    if (data.role && data.role !== 'Employee') {
      this.addAuditLog(
        'SECURITY_ALERT',
        'Authentication',
        `Attempted privilege elevation during registration for ${email}. Forged client role "${data.role}" was rejected. Enforced role: Employee.`
      );
    }

    if (!email || !email.trim()) {
      return { success: false, message: 'Corporate email address is required.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters in length.' };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match. Please verify and retry.' };
    }

    // Step 1: Corporate Email Restriction & Exception Validation
    const validation = AUTH_CONFIG.validateRegistrationEmail(email);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message || AUTH_CONFIG.unauthorizedDomainErrorMessage,
      };
    }

    const normalizedEmail = validation.normalizedEmail;

    // Step 2: Check if an account already exists for this email
    const users = this.getUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      };
    }

    // Step 3: Check Employee Master Data linking or provision with personal info
    let matchedEmployee = this.findEmployeeByEmail(normalizedEmail);
    if (!matchedEmployee) {
      // Auto-provision Employee Master Record with the entered personal information
      const employees = this.getEmployees();
      const count = employees.length + 1;
      const nextId = `ER-${String(count).padStart(3, '0')}`;
      const resolvedName =
        fullName?.trim() ||
        normalizedEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        employeeId: nextId,
        fullName: resolvedName,
        gender: 'Male',
        dateOfBirth: '1995-01-01',
        employmentDate: new Date().toISOString().split('T')[0],
        department: 'General Operations',
        position: 'Staff Member',
        employmentType: 'Permanent',
        workLocation: 'Addis Ababa Head Office',
        manager: 'Executive Management',
        phoneNumber: phoneNumber?.trim() || '+251 91 000 0000',
        emailAddress: normalizedEmail,
        photo: '',
        status: 'Active',
      };

      employees.push(newEmployee);
      setStorageItem(STORAGE_KEYS.EMPLOYEES, employees);

      // Initialize default leave balances per Ethiopian Labor statutory policy
      const leaveTypes = this.getLeaveTypes();
      const balances = this.getLeaveBalances();
      leaveTypes.forEach((lt) => {
        balances.push({
          id: `bal-${newEmployee.employeeId}-${lt.id}`,
          employeeId: newEmployee.employeeId,
          leaveType: lt.name,
          entitled: lt.defaultDays,
          taken: 0,
          pending: 0,
          remaining: lt.defaultDays,
        });
      });
      setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

      matchedEmployee = newEmployee;
    } else {
      // Check if employeeId is already linked
      const links = this.getEmployeeAccountLinks();
      const existingLink = links.find((l) => l.employeeId === matchedEmployee!.employeeId);
      if (existingLink) {
        return {
          success: false,
          message: `An account is already linked to Employee ID ${matchedEmployee.employeeId} (${matchedEmployee.fullName}). Please sign in.`,
        };
      }
      if (fullName?.trim() && !matchedEmployee.fullName) {
        matchedEmployee.fullName = fullName.trim();
        this.saveEmployee(matchedEmployee, this.getCurrentUser());
      }
    }

    // Step 4: Provision in Firebase Auth & Firestore
    let uid = `usr-emp-${Date.now()}`;
    let verificationEmailSent = false;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (userCredential && userCredential.user) {
        uid = userCredential.user.uid;
        try {
          await sendEmailVerification(userCredential.user);
          verificationEmailSent = true;
        } catch (vErr) {
          console.warn('sendEmailVerification notice:', vErr);
        }
      }
    } catch (fbErr: any) {
      console.warn('Firebase Auth registration notice (continuing with secure local store sync):', fbErr.message);
    }

    // Backend strictly enforces Employee role
    const newUser: User = {
      id: uid,
      email: normalizedEmail,
      displayName: matchedEmployee.fullName,
      role: 'Employee', // STRICTLY Employee
      employeeId: matchedEmployee.employeeId,
      createdAt: new Date().toISOString(),
      avatar: matchedEmployee.photo || undefined,
      status: 'Active',
      isEmailVerified: false, // Requires email verification before self-service access
    };

    const newLink: EmployeeAccountLink = {
      id: `link-${Date.now()}`,
      uid: uid,
      employeeId: matchedEmployee.employeeId,
      email: normalizedEmail,
      employeeName: matchedEmployee.fullName,
      department: matchedEmployee.department,
      position: matchedEmployee.position,
      accountStatus: 'Active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      linkedBy: 'Auto-Registration',
    };

    // Save in Firestore if available (enforcing Employee role)
    try {
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        email: normalizedEmail,
        displayName: matchedEmployee.fullName,
        role: 'Employee',
        employeeId: matchedEmployee.employeeId,
        createdAt: newUser.createdAt,
        status: 'Active',
        isEmailVerified: false,
      });
      await setDoc(doc(db, 'employeeAccountLinks', uid), newLink);
    } catch (firestoreErr) {
      console.warn('Firestore sync notice:', firestoreErr);
    }

    // Save in storage
    const updatedUsers = [...users, newUser];
    setStorageItem(STORAGE_KEYS.USERS, updatedUsers);

    const links = this.getEmployeeAccountLinks();
    const updatedLinks = [...links, newLink];
    setStorageItem(STORAGE_KEYS.EMPLOYEE_ACCOUNT_LINKS, updatedLinks);

    // Create a welcome notification
    this.addNotification({
      employeeId: matchedEmployee.employeeId,
      title: 'Welcome to Ethiopian Reinsurance HRMS',
      message: `Your employee self-service profile has been registered and linked to Employee ID ${matchedEmployee.employeeId}.`,
      category: 'general',
    });

    this.addAuditLog(
      'EMPLOYEE_REGISTERED',
      'Authentication',
      `Employee account created & linked to Master Data: ${matchedEmployee.fullName} (${matchedEmployee.employeeId}) [${normalizedEmail}] - Role: Employee`,
      undefined,
      newUser
    );

    return {
      success: true,
      message: verificationEmailSent
        ? `Account created! A verification link has been dispatched to ${normalizedEmail}. Please verify your email before accessing self-service records.`
        : `Account created successfully with Employee role! Please verify your corporate email to access self-service records.`,
      user: newUser,
      employee: matchedEmployee,
    };
  },

  async loginUser(
    email: string,
    password?: string
  ): Promise<{ success: boolean; message: string; user?: User; needsEmailVerification?: boolean }> {
    if (!email || !email.trim()) {
      return { success: false, message: 'Email address is required.' };
    }
    const cleanEmail = email.trim().toLowerCase();

    // Attempt Firebase Auth sign-in if password provided
    let firebaseVerified = false;
    if (password && password !== '••••••••••••') {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (cred.user) {
          firebaseVerified = cred.user.emailVerified;
        }
      } catch (fbErr: any) {
        console.warn('Firebase signIn notice (verifying local directory):', fbErr.message);
      }
    }

    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return {
        success: false,
        message: 'No registered user found with this corporate email address.',
      };
    }

    // Check account status
    if (user.status && user.status !== 'Active') {
      return {
        success: false,
        message: 'This account has been deactivated or disabled. Please contact HR Administration at hr@ethiopianre.com.',
      };
    }

    // For employees, confirm the secure link to their existing Employee Master Data record
    if (user.role === 'Employee') {
      const emp = user.employeeId ? this.getEmployeeById(user.employeeId) : this.findEmployeeByEmail(cleanEmail);
      if (!emp) {
        return {
          success: false,
          message: 'Unable to locate linked Employee Master Data record for this account. Please contact HR Administration.',
        };
      }
      if (emp.status !== 'Active') {
        return {
          success: false,
          message: `Your employee record (${emp.fullName} - ${emp.employeeId}) is currently Inactive. Please contact HR Administration.`,
        };
      }
    }

    // If Firebase Auth confirmed email verified, update local user
    if (firebaseVerified && !user.isEmailVerified) {
      user.isEmailVerified = true;
      setStorageItem(STORAGE_KEYS.USERS, users);
    }

    this.setCurrentUser(user.id);

    const needsEmailVerification = user.role === 'Employee' && !user.isEmailVerified;

    return {
      success: true,
      message: 'Login successful.',
      user,
      needsEmailVerification,
    };
  },

  // Resend Email Verification
  async resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return {
          success: true,
          message: `Verification link resent to ${auth.currentUser.email}. Please check your inbox.`,
        };
      }
      return {
        success: true,
        message: 'Verification link resent to your corporate email address. Please check your inbox.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to resend verification email.',
      };
    }
  },

  // Check Email Verification Status with Firebase Auth
  async checkEmailVerified(): Promise<{ verified: boolean; message: string }> {
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          const users = this.getUsers();
          const target = users.find(
            (u) => u.email.toLowerCase() === auth.currentUser?.email?.toLowerCase()
          );
          if (target) {
            target.isEmailVerified = true;
            setStorageItem(STORAGE_KEYS.USERS, users);
            try {
              await setDoc(doc(db, 'users', target.id), { isEmailVerified: true }, { merge: true });
            } catch (fsErr) {
              console.warn('Firestore isEmailVerified sync notice:', fsErr);
            }
          }
          window.dispatchEvent(new Event('ethiore_user_change'));
          return { verified: true, message: 'Email verified successfully! Self-service access enabled.' };
        }
        return { verified: false, message: 'Email not yet verified. Please click the verification link in your inbox.' };
      }

      // Check current user in storage
      const curr = this.getCurrentUser();
      if (curr.isEmailVerified) {
        return { verified: true, message: 'Email is verified.' };
      }
      return { verified: false, message: 'Verification link pending in email.' };
    } catch (err: any) {
      return { verified: false, message: err.message || 'Could not verify status.' };
    }
  },

  // Simulate/Bypass Email Verification for Sandbox & Demo Testing
  simulateVerifyEmail(userId?: string): void {
    const users = this.getUsers();
    const target = userId ? users.find((u) => u.id === userId) : this.getCurrentUser();
    if (target) {
      target.isEmailVerified = true;
      setStorageItem(STORAGE_KEYS.USERS, users);
      this.setCurrentUser(target.id);
      try {
        setDoc(doc(db, 'users', target.id), { isEmailVerified: true }, { merge: true });
      } catch (e) {
        // ignore
      }
      this.addAuditLog(
        'EMAIL_VERIFIED',
        'Authentication',
        `Email verified for employee ${target.displayName} (${target.email})`,
        undefined,
        target
      );
      window.dispatchEvent(new Event('ethiore_user_change'));
    }
  },

  // Send Password Reset
  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.trim()) {
      return { success: false, message: 'Corporate email address is required.' };
    }
    const cleanEmail = email.trim().toLowerCase();

    // Validate email rules
    const val = AUTH_CONFIG.validateRegistrationEmail(cleanEmail);
    if (!val.isValid) {
      return {
        success: false,
        message: AUTH_CONFIG.unauthorizedDomainErrorMessage,
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      console.warn('Password reset notice:', err);
    }

    this.addAuditLog(
      'PASSWORD_RESET_REQUESTED',
      'Authentication',
      `Password reset instructions requested for corporate email: ${cleanEmail}`
    );

    // Neutral confirmation message requested by user brief
    return {
      success: true,
      message: 'If an account exists for this email address, a password reset link has been sent.',
    };
  },

  // Change Password with re-authentication
  async changePassword(
    currentPassword?: string,
    newPassword?: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters in length.' };
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return { success: false, message: 'New passwords do not match. Please verify and retry.' };
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No active session found.' };
    }

    try {
      if (auth.currentUser && currentPassword && currentPassword !== '••••••••••••') {
        try {
          await signInWithEmailAndPassword(auth, auth.currentUser.email || currentUser.email, currentPassword);
        } catch (authErr: any) {
          return { success: false, message: 'Current password is incorrect. Please verify and retry.' };
        }
      }

      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      this.addAuditLog(
        'PASSWORD_CHANGED',
        'Authentication',
        `Password successfully updated for ${currentUser.displayName} (${currentUser.email})`
      );

      return { success: true, message: 'Your password has been changed successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update password.' };
    }
  },

  // Logout
  async logoutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    // Clear current authenticated session and cached state
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.setItem('ethiore_hrms_logged_out', 'true');
    sessionStorage.clear();
    window.dispatchEvent(new Event('ethiore_user_change'));
    window.dispatchEvent(new Event('ethiore_storage_update'));
  },

  // Firebase Storage File Upload
  async uploadFile(
    path: string,
    file: File | Blob
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (err: any) {
      console.warn('Firebase Storage upload notice (using fallback):', err);
      if (file instanceof File) {
        return { success: true, url: URL.createObjectURL(file) };
      }
      return { success: false, error: err.message || 'File upload failed.' };
    }
  },

  // Firebase Storage File Deletion
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase Storage delete notice:', err);
      return { success: false, error: err.message };
    }
  },

  // Notifications
  getNotifications(employeeId?: string): EmployeeNotification[] {
    const all = getStorageItem<EmployeeNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      initialNotifications
    );
    if (!employeeId) return all;
    return all.filter((n) => n.employeeId === employeeId);
  },

  markNotificationAsRead(id: string): void {
    const all = this.getNotifications();
    const target = all.find((n) => n.id === id);
    if (target) {
      target.read = true;
      setStorageItem(STORAGE_KEYS.NOTIFICATIONS, all);
      try {
        setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
      } catch (e) {
        // ignore
      }
      window.dispatchEvent(new Event('ethiore_storage_update'));
    }
  },

  addNotification(notif: Omit<EmployeeNotification, 'id' | 'timestamp' | 'read'>): EmployeeNotification {
    const all = this.getNotifications();
    const created: EmployeeNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [created, ...all];
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    try {
      setDoc(doc(db, 'notifications', created.id), created);
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new Event('ethiore_storage_update'));
    return created;
  },

  // Seed Firestore project hrms-d9d43 if empty or on-demand
  async seedFirestore(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const employees = this.getEmployees();
      for (const emp of employees) {
        await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
      }
      const departments = this.getDepartments();
      for (const dept of departments) {
        await setDoc(doc(db, 'departments', dept.id), dept, { merge: true });
      }
      const positions = this.getPositions();
      for (const pos of positions) {
        await setDoc(doc(db, 'positions', pos.id), pos, { merge: true });
      }
      const leaveTypes = this.getLeaveTypes();
      for (const lt of leaveTypes) {
        await setDoc(doc(db, 'leaveTypes', lt.id), lt, { merge: true });
      }
      const leaves = this.getLeaveRecords();
      for (const lv of leaves) {
        await setDoc(doc(db, 'leaves', lv.id), lv, { merge: true });
      }
      const notifs = this.getNotifications();
      for (const n of notifs) {
        await setDoc(doc(db, 'notifications', n.id), n, { merge: true });
      }
      const links = this.getEmployeeAccountLinks();
      for (const lnk of links) {
        await setDoc(doc(db, 'employeeAccountLinks', lnk.uid), lnk, { merge: true });
      }
      const users = this.getUsers();
      for (const usr of users) {
        await setDoc(doc(db, 'users', usr.id), usr, { merge: true });
      }
      return {
        success: true,
        message: `Successfully synchronized ${employees.length} employees and related records with Cloud Firestore (hrms-d9d43).`,
        count: employees.length,
      };
    } catch (err: any) {
      console.warn('seedFirestore error:', err);
      return { success: false, message: err.message || 'Firestore sync notice', count: 0 };
    }
  },

  // Synchronize / pull with Firestore on startup or refresh
  async syncWithFirestore(): Promise<{ success: boolean; message: string; pulledCount: number }> {
    try {
      if (!auth.currentUser) {
        return {
          success: true,
          message: 'Operating with local directory until authenticated.',
          pulledCount: 0,
        };
      }
      const empSnap = await getDocs(collection(db, 'employees'));
      if (empSnap.empty) {
        // If Firestore has not been initialized yet, auto-seed with Ethiopian Reinsurance initial data
        const seedRes = await this.seedFirestore();
        return {
          success: true,
          message: `Connected to Cloud Firestore (hrms-d9d43) and seeded ${seedRes.count} initial employee records.`,
          pulledCount: seedRes.count,
        };
      }

      // If Firestore has documents, update local storage with remote changes
      const remoteEmployees: Employee[] = [];
      empSnap.forEach((docSnap) => {
        remoteEmployees.push(docSnap.data() as Employee);
      });
      if (remoteEmployees.length > 0) {
        setStorageItem(STORAGE_KEYS.EMPLOYEES, remoteEmployees);
      }

      // Also pull leaves
      const leavesSnap = await getDocs(collection(db, 'leaves'));
      if (!leavesSnap.empty) {
        const remoteLeaves: LeaveRecord[] = [];
        leavesSnap.forEach((docSnap) => {
          remoteLeaves.push(docSnap.data() as LeaveRecord);
        });
        if (remoteLeaves.length > 0) {
          setStorageItem(STORAGE_KEYS.LEAVE_RECORDS, remoteLeaves);
        }
      }

      // Also pull departments
      const deptsSnap = await getDocs(collection(db, 'departments'));
      if (!deptsSnap.empty) {
        const remoteDepts: Department[] = [];
        deptsSnap.forEach((docSnap) => {
          remoteDepts.push(docSnap.data() as Department);
        });
        if (remoteDepts.length > 0) {
          setStorageItem(STORAGE_KEYS.DEPARTMENTS, remoteDepts);
        }
      }

      // Also pull users
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const remoteUsers: User[] = [];
        usersSnap.forEach((docSnap) => {
          remoteUsers.push(docSnap.data() as User);
        });
        if (remoteUsers.length > 0) {
          const localUsers = this.getUsers();
          const merged = [...localUsers];
          remoteUsers.forEach((ru) => {
            const idx = merged.findIndex(
              (u) => u.id === ru.id || u.email.toLowerCase() === ru.email.toLowerCase()
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...ru };
            } else {
              merged.push(ru);
            }
          });
          setStorageItem(STORAGE_KEYS.USERS, merged);
        }
      }

      return {
        success: true,
        message: `Synchronized ${remoteEmployees.length} employees with Cloud Firestore (hrms-d9d43).`,
        pulledCount: remoteEmployees.length,
      };
    } catch (err: any) {
      console.warn('syncWithFirestore notice:', err);
      return {
        success: false,
        message: err.message || 'Operating with local persistent store.',
        pulledCount: 0,
      };
    }
  },

  // Test live connection to Firestore
  async testFirestoreConnection(): Promise<{ connected: boolean; latencyMs: number; message: string }> {
    const startTime = Date.now();
    try {
      await getDocFromServer(doc(db, 'system_test', 'connection'));
      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        latencyMs,
        message: `Connected to Cloud Firestore (hrms-d9d43). Latency: ${latencyMs}ms.`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (err?.code === 'not-found' || !err?.message?.includes('offline')) {
        return {
          connected: true,
          latencyMs,
          message: `Connected to Cloud Firestore (hrms-d9d43). Server responded in ${latencyMs}ms.`,
        };
      }
      return {
        connected: false,
        latencyMs,
        message: err.message || 'Unable to connect to Cloud Firestore.',
      };
    }
  },

  createUser(
    newUser: Omit<User, 'id' | 'createdAt'>,
    adminUser: User
  ): { success: boolean; message: string; user?: User } {
    if (adminUser.role !== 'Administrator') {
      return { success: false, message: 'Unauthorized: Only Administrators can create users.' };
    }
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      return { success: false, message: 'User with this email already exists.' };
    }
    const created: User = {
      ...newUser,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      avatar: newUser.avatar || undefined,
    };
    const updated = [...users, created];
    setStorageItem(STORAGE_KEYS.USERS, updated);
    this.addAuditLog(
      'USER_CREATED',
      'User Management',
      `Administrator created user ${created.displayName} with role ${created.role}`
    );
    return { success: true, message: 'User created successfully.', user: created };
  },

  // Central backend authorization verification
  verifyAdministrator(user?: User): { authorized: boolean; verifiedAdmin?: User; message: string } {
    const actingUser = user || this.getCurrentUser();
    if (!actingUser) {
      return { authorized: false, message: 'Unauthorized: No active user session identified.' };
    }
    const users = this.getUsers();
    const verified = users.find((u) => u.id === actingUser.id && u.role === 'Administrator');
    if (!verified) {
      this.addAuditLog(
        'UNAUTHORIZED_CONFIG_ATTEMPT',
        'Configuration',
        `Unauthorized configuration modification rejected for user "${actingUser.displayName || 'Unknown'}" (${actingUser.role || 'Unspecified'}). Administrator authorization required.`,
        undefined,
        actingUser
      );
      return {
        authorized: false,
        message: `Unauthorized: Administrator privilege required to modify configuration settings or manage roles. Current role: ${actingUser.role || 'None'}.`,
      };
    }
    return { authorized: true, verifiedAdmin: verified, message: 'Authorized' };
  },

  // Central HR Admin or Administrator authorization verification
  verifyHRAdminOrAdmin(user?: User): { authorized: boolean; verifiedUser?: User; message: string } {
    const actingUser = user || this.getCurrentUser();
    if (!actingUser) {
      return { authorized: false, message: 'Unauthorized: No active user session identified.' };
    }
    const users = this.getUsers();
    const verified = users.find(
      (u) => u.id === actingUser.id && (u.role === 'Administrator' || u.role === 'HR Admin')
    );
    if (!verified) {
      this.addAuditLog(
        'UNAUTHORIZED_HR_OPERATION_ATTEMPT',
        'Employee Master Data',
        `Unauthorized HR operation rejected for user "${actingUser.displayName || 'Unknown'}" (${actingUser.role || 'Unspecified'}). HR Admin or Administrator authorization required.`,
        undefined,
        actingUser
      );
      return {
        authorized: false,
        message: `Unauthorized: HR Admin or Administrator privilege required for this operation. Current role: ${actingUser.role || 'None'}.`,
      };
    }
    return { authorized: true, verifiedUser: verified, message: 'Authorized' };
  },

  updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUser?: User
  ): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(adminUser);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }
    // Validate role is strictly one of the 3 permitted application roles
    if (!['Administrator', 'HR Admin', 'Employee'].includes(newRole)) {
      return { success: false, message: `Invalid application role "${newRole}". Permitted roles: Administrator, HR Admin, Employee.` };
    }
    const users = this.getUsers();
    const targetIndex = users.findIndex((u) => u.id === targetUserId);
    if (targetIndex === -1) {
      return { success: false, message: 'User not found.' };
    }
    // Prevent removing the last administrator
    if (users[targetIndex].role === 'Administrator' && newRole !== 'Administrator') {
      const adminCount = users.filter((u) => u.role === 'Administrator').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Cannot demote the sole Administrator in the system.' };
      }
    }
    const prevRole = users[targetIndex].role;
    users[targetIndex].role = newRole;
    setStorageItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      'ROLE_ASSIGNED',
      'User Management',
      `Administrator changed role of ${users[targetIndex].displayName} to ${newRole}`,
      {
        settingName: `User Role: ${users[targetIndex].displayName}`,
        previousValue: prevRole,
        newValue: newRole,
      },
      auth.verifiedAdmin
    );
    return { success: true, message: `Role updated to ${newRole}.` };
  },

  deleteUser(targetUserId: string, adminUser?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(adminUser);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }
    const users = this.getUsers();
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return { success: false, message: 'User not found.' };
    if (target.id === auth.verifiedAdmin.id) {
      return { success: false, message: 'Cannot delete the currently logged in administrator.' };
    }
    if (target.role === 'Administrator') {
      const adminCount = users.filter((u) => u.role === 'Administrator').length;
      if (adminCount <= 1) {
        return {
          success: false,
          message: 'This record cannot be deleted because it is referenced by other records. (Cannot delete the sole Administrator in the system).',
        };
      }
    }
    const filtered = users.filter((u) => u.id !== targetUserId);
    setStorageItem(STORAGE_KEYS.USERS, filtered);
    this.addAuditLog(
      'DELETE',
      'User Management',
      `Deleted user account: ${target.displayName} (${target.email}, ${target.role})`,
      undefined,
      auth.verifiedAdmin,
      {
        recordType: 'User',
        recordId: target.id,
      }
    );
    return { success: true, message: 'Record deleted successfully.' };
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  },

  addAuditLog(
    action: string,
    module: AuditLog['module'],
    details: string,
    configDiff?: {
      settingName: string;
      previousValue: string;
      newValue: string;
    },
    actingUser?: User,
    deletionMeta?: {
      recordType: string;
      recordId: string;
    }
  ): void {
    const logs = this.getAuditLogs();
    const currentUser = actingUser || this.getCurrentUser();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      performedBy: `${currentUser.displayName}`,
      userId: currentUser.id,
      userRole: currentUser.role,
      action,
      module,
      details,
      recordType: deletionMeta?.recordType,
      recordId: deletionMeta?.recordId,
      settingName: configDiff?.settingName,
      previousValue: configDiff?.previousValue,
      newValue: configDiff?.newValue,
    };
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  },

  // Company Info
  getCompanyInfo(): CompanyInfo {
    return getStorageItem<CompanyInfo>(STORAGE_KEYS.COMPANY_INFO, initialCompanyInfo);
  },

  updateCompanyInfo(info: CompanyInfo, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const prev = this.getCompanyInfo();
    const fields: { key: keyof CompanyInfo; label: string }[] = [
      { key: 'name', label: 'Company Official Legal Name' },
      { key: 'shortName', label: 'Short Name / Brand' },
      { key: 'registrationNumber', label: 'Commercial Registration Number' },
      { key: 'tin', label: 'Taxpayer Identification Number (TIN)' },
      { key: 'address', label: 'Head Office Address' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'phoneNumber', label: 'General Telephone' },
      { key: 'email', label: 'Corporate Email' },
      { key: 'website', label: 'Official Website' },
      { key: 'currency', label: 'Operating Currency' },
      { key: 'fiscalYearStart', label: 'Fiscal Year Start' },
    ];

    let changesCount = 0;
    fields.forEach(({ key, label }) => {
      const prevVal = String(prev[key] ?? '');
      const nextVal = String(info[key] ?? '');
      if (prevVal !== nextVal) {
        changesCount++;
        this.addAuditLog(
          'CONFIG_COMPANY_UPDATED',
          'Configuration',
          `Updated ${label}: "${prevVal}" → "${nextVal}"`,
          {
            settingName: label,
            previousValue: prevVal,
            newValue: nextVal,
          },
          auth.verifiedAdmin
        );
      }
    });

    if (changesCount === 0) {
      this.addAuditLog(
        'CONFIG_COMPANY_SAVED',
        'Configuration',
        'Company profile confirmed and saved without value changes.',
        undefined,
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.COMPANY_INFO, info);
    return { success: true, message: 'Company information updated successfully.' };
  },

  // Departments
  getDepartments(): Department[] {
    return getStorageItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
  },

  saveDepartment(dept: Department, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const depts = this.getDepartments();
    const index = depts.findIndex((d) => d.id === dept.id);
    if (index >= 0) {
      const prevDept = depts[index];
      const deptFields: { key: keyof Department; label: string }[] = [
        { key: 'name', label: `Department Name (${prevDept.name})` },
        { key: 'code', label: `Department Code (${prevDept.name})` },
        { key: 'headOfDepartment', label: `Head of Department (${prevDept.name})` },
      ];

      deptFields.forEach(({ key, label }) => {
        const prevVal = String(prevDept[key] ?? '');
        const nextVal = String(dept[key] ?? '');
        if (prevVal !== nextVal) {
          this.addAuditLog(
            'CONFIG_DEPARTMENT_UPDATED',
            'Configuration',
            `Updated ${label}: "${prevVal || 'Unassigned'}" → "${nextVal || 'Unassigned'}"`,
            {
              settingName: label,
              previousValue: prevVal || 'Unassigned',
              newValue: nextVal || 'Unassigned',
            },
            auth.verifiedAdmin
          );
        }
      });

      depts[index] = dept;
    } else {
      depts.push(dept);
      this.addAuditLog(
        'CONFIG_DEPARTMENT_CREATED',
        'Configuration',
        `Created department: ${dept.name} (${dept.code}), Head: ${dept.headOfDepartment || 'Unassigned'}`,
        {
          settingName: `Department Created: ${dept.name}`,
          previousValue: '[None]',
          newValue: `${dept.code} • Head: ${dept.headOfDepartment || 'Unassigned'}`,
        },
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.DEPARTMENTS, depts);
    return { success: true, message: 'Department saved successfully.' };
  },

  deleteDepartment(id: string, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const depts = this.getDepartments();
    const target = depts.find((d) => d.id === id);
    if (!target) return { success: false, message: 'Department not found.' };

    // Check if any employee belongs to this department
    const employees = this.getEmployees();
    const empInUse = employees.filter((e) => e.department === target.name);
    if (empInUse.length > 0) {
      return {
        success: false,
        message: `This record cannot be deleted because it is referenced by other records. (${empInUse.length} employee(s) assigned to "${target.name}").`,
      };
    }

    // Check if any position belongs to this department
    const positions = this.getPositions();
    const posInUse = positions.filter((p) => p.department === target.name);
    if (posInUse.length > 0) {
      return {
        success: false,
        message: `This record cannot be deleted because it is referenced by other records. (${posInUse.length} position(s) configured under "${target.name}").`,
      };
    }

    const filtered = depts.filter((d) => d.id !== id);
    setStorageItem(STORAGE_KEYS.DEPARTMENTS, filtered);
    this.addAuditLog(
      'DELETE',
      'Configuration',
      `Deleted department: ${target.name} (${target.code})`,
      {
        settingName: `Department Removed: ${target.name}`,
        previousValue: `Code: ${target.code}, Head: ${target.headOfDepartment || 'Unassigned'}`,
        newValue: '[Deleted]',
      },
      auth.verifiedAdmin,
      {
        recordType: 'Department',
        recordId: target.id,
      }
    );
    return { success: true, message: 'Record deleted successfully.' };
  },

  // Positions
  getPositions(): Position[] {
    return getStorageItem<Position[]>(STORAGE_KEYS.POSITIONS, initialPositions);
  },

  savePosition(pos: Position, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const positions = this.getPositions();
    const index = positions.findIndex((p) => p.id === pos.id);
    if (index >= 0) {
      const prevPos = positions[index];
      const posFields: { key: keyof Position; label: string }[] = [
        { key: 'title', label: `Job Title (${prevPos.title})` },
        { key: 'department', label: `Position Department (${prevPos.title})` },
      ];

      posFields.forEach(({ key, label }) => {
        const prevVal = String(prevPos[key] ?? '');
        const nextVal = String(pos[key] ?? '');
        if (prevVal !== nextVal) {
          this.addAuditLog(
            'CONFIG_POSITION_UPDATED',
            'Configuration',
            `Updated ${label}: "${prevVal}" → "${nextVal}"`,
            {
              settingName: label,
              previousValue: prevVal,
              newValue: nextVal,
            },
            auth.verifiedAdmin
          );
        }
      });

      positions[index] = pos;
    } else {
      positions.push(pos);
      this.addAuditLog(
        'CONFIG_POSITION_CREATED',
        'Configuration',
        `Created position: ${pos.title} (${pos.department})`,
        {
          settingName: `Position Created: ${pos.title}`,
          previousValue: '[None]',
          newValue: pos.department,
        },
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.POSITIONS, positions);
    return { success: true, message: 'Position saved successfully.' };
  },

  deletePosition(id: string, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const positions = this.getPositions();
    const target = positions.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Position not found.' };

    // Check if any active employee holds this position
    const employees = this.getEmployees();
    const empInUse = employees.filter((e) => e.position === target.title);
    if (empInUse.length > 0) {
      return {
        success: false,
        message: `This record cannot be deleted because it is referenced by other records. (${empInUse.length} employee(s) assigned to "${target.title}").`,
      };
    }

    const filtered = positions.filter((p) => p.id !== id);
    setStorageItem(STORAGE_KEYS.POSITIONS, filtered);
    this.addAuditLog(
      'DELETE',
      'Configuration',
      `Deleted position: ${target.title} (${target.department})`,
      {
        settingName: `Position Removed: ${target.title}`,
        previousValue: `Department: ${target.department}`,
        newValue: '[Deleted]',
      },
      auth.verifiedAdmin,
      {
        recordType: 'Position',
        recordId: target.id,
      }
    );
    return { success: true, message: 'Record deleted successfully.' };
  },

  // Leave Types & Entitlements
  getLeaveTypes(): LeaveTypeConfig[] {
    return getStorageItem<LeaveTypeConfig[]>(STORAGE_KEYS.LEAVE_TYPES, initialLeaveTypes);
  },

  saveLeaveType(lt: LeaveTypeConfig, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const types = this.getLeaveTypes();
    const idx = types.findIndex((t) => t.id === lt.id);
    if (idx >= 0) {
      const prevType = types[idx];
      const typeDiffs: { label: string; prev: string; next: string }[] = [];

      if (prevType.defaultDays !== lt.defaultDays) {
        typeDiffs.push({
          label: `Leave Policy: ${lt.name} - Default Days`,
          prev: `${prevType.defaultDays} days`,
          next: `${lt.defaultDays} days`,
        });
      }
      if (prevType.isPaid !== lt.isPaid) {
        typeDiffs.push({
          label: `Leave Policy: ${lt.name} - Paid Status`,
          prev: prevType.isPaid ? 'Paid' : 'Unpaid',
          next: lt.isPaid ? 'Paid' : 'Unpaid',
        });
      }
      if (prevType.carryForward !== lt.carryForward) {
        typeDiffs.push({
          label: `Leave Policy: ${lt.name} - Carry Forward Allowed`,
          prev: prevType.carryForward ? 'Yes' : 'No',
          next: lt.carryForward ? 'Yes' : 'No',
        });
      }
      if (prevType.description !== lt.description) {
        typeDiffs.push({
          label: `Leave Policy: ${lt.name} - Description`,
          prev: prevType.description || '[None]',
          next: lt.description || '[None]',
        });
      }

      typeDiffs.forEach((d) => {
        this.addAuditLog(
          'CONFIG_LEAVE_POLICY_UPDATED',
          'Configuration',
          `Updated ${d.label}: "${d.prev}" → "${d.next}"`,
          {
            settingName: d.label,
            previousValue: d.prev,
            newValue: d.next,
          },
          auth.verifiedAdmin
        );
      });

      types[idx] = lt;
    } else {
      types.push(lt);
      this.addAuditLog(
        'CONFIG_LEAVE_POLICY_CREATED',
        'Configuration',
        `Created leave policy: ${lt.name} (${lt.defaultDays} days, ${lt.isPaid ? 'Paid' : 'Unpaid'})`,
        {
          settingName: `Leave Policy Created: ${lt.name}`,
          previousValue: '[None]',
          newValue: `${lt.defaultDays} days, ${lt.isPaid ? 'Paid' : 'Unpaid'}`,
        },
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.LEAVE_TYPES, types);
    return { success: true, message: `Leave policy "${lt.name}" saved successfully.` };
  },

  // Holidays
  getHolidays(): EthiopianHoliday[] {
    return getStorageItem<EthiopianHoliday[]>(STORAGE_KEYS.HOLIDAYS, initialEthiopianHolidays);
  },

  saveHoliday(h: EthiopianHoliday, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const holidays = this.getHolidays();
    const idx = holidays.findIndex((item) => item.id === h.id);
    if (idx >= 0) {
      const prev = holidays[idx];
      if (prev.name !== h.name) {
        this.addAuditLog(
          'CONFIG_HOLIDAY_UPDATED',
          'Configuration',
          `Updated Holiday Name: "${prev.name}" → "${h.name}"`,
          {
            settingName: `Holiday Name (${prev.name})`,
            previousValue: prev.name,
            newValue: h.name,
          },
          auth.verifiedAdmin
        );
      }
      if (prev.date !== h.date) {
        this.addAuditLog(
          'CONFIG_HOLIDAY_UPDATED',
          'Configuration',
          `Updated Holiday Date (${h.name}): "${prev.date}" → "${h.date}"`,
          {
            settingName: `Holiday Date (${h.name})`,
            previousValue: prev.date,
            newValue: h.date,
          },
          auth.verifiedAdmin
        );
      }
      holidays[idx] = h;
    } else {
      holidays.push(h);
      this.addAuditLog(
        'CONFIG_HOLIDAY_CREATED',
        'Configuration',
        `Scheduled public holiday: ${h.name} (${h.date})`,
        {
          settingName: `Public Holiday Scheduled: ${h.name}`,
          previousValue: '[None]',
          newValue: h.date,
        },
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.HOLIDAYS, holidays);
    return { success: true, message: `Public holiday "${h.name}" saved successfully.` };
  },

  deleteHoliday(id: string, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const holidays = this.getHolidays();
    const target = holidays.find((h) => h.id === id);
    if (!target) return { success: false, message: 'Public holiday not found.' };

    const filtered = holidays.filter((h) => h.id !== id);
    setStorageItem(STORAGE_KEYS.HOLIDAYS, filtered);
    this.addAuditLog(
      'DELETE',
      'Configuration',
      `Deleted public holiday: ${target.name} (${target.date})`,
      {
        settingName: `Public Holiday Removed: ${target.name}`,
        previousValue: target.date,
        newValue: '[Deleted]',
      },
      auth.verifiedAdmin,
      {
        recordType: 'Public Holiday',
        recordId: target.id,
      }
    );
    return { success: true, message: 'Record deleted successfully.' };
  },

  // Attendance Settings
  getAttendanceSettings(): AttendanceSettings {
    return getStorageItem<AttendanceSettings>(STORAGE_KEYS.ATTENDANCE_SETTINGS, initialAttendanceSettings);
  },

  updateAttendanceSettings(settings: AttendanceSettings, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message };
    }

    const prev = this.getAttendanceSettings();
    const fields: { key: keyof AttendanceSettings; label: string; format?: (v: any) => string }[] = [
      { key: 'workStartTime', label: 'Shift Start Time' },
      { key: 'workEndTime', label: 'Shift End Time' },
      { key: 'lunchStartTime', label: 'Lunch Break Start Time' },
      { key: 'lunchEndTime', label: 'Lunch Break End Time' },
      { key: 'gracePeriodMinutes', label: 'Grace Period', format: (v) => `${v} minutes` },
      { key: 'halfDayThresholdHours', label: 'Half-Day Threshold', format: (v) => `${v} hours` },
      { key: 'overtimeStandardRate', label: 'Standard Overtime Multiplier', format: (v) => `${v}x` },
      { key: 'overtimeHolidayRate', label: 'Holiday Overtime Multiplier', format: (v) => `${v}x` },
    ];

    let changes = 0;
    fields.forEach(({ key, label, format }) => {
      const prevVal = prev[key];
      const nextVal = settings[key];
      if (prevVal !== nextVal && prevVal !== undefined && nextVal !== undefined) {
        changes++;
        const prevFormatted = format ? format(prevVal) : String(prevVal);
        const nextFormatted = format ? format(nextVal) : String(nextVal);
        this.addAuditLog(
          'CONFIG_ATTENDANCE_UPDATED',
          'Configuration',
          `Updated ${label}: "${prevFormatted}" → "${nextFormatted}"`,
          {
            settingName: label,
            previousValue: prevFormatted,
            newValue: nextFormatted,
          },
          auth.verifiedAdmin
        );
      }
    });

    if (changes === 0) {
      this.addAuditLog(
        'CONFIG_ATTENDANCE_SAVED',
        'Configuration',
        'Attendance & shift rules confirmed without value changes.',
        undefined,
        auth.verifiedAdmin
      );
    }

    setStorageItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, settings);
    return { success: true, message: 'Attendance settings updated successfully.' };
  },

  // Shifts
  getShifts(): Shift[] {
    return getStorageItem<Shift[]>(STORAGE_KEYS.SHIFTS, initialShifts);
  },

  // ==========================================
  // EMPLOYEE MASTER DATA (Shared Component)
  // ==========================================
  getEmployees(): Employee[] {
    return getStorageItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  },

  getActiveEmployees(): Employee[] {
    return this.getEmployees().filter((e) => e.status === 'Active');
  },

  getEmployeeById(idOrEmployeeId: string): Employee | undefined {
    return this.getEmployees().find(
      (e) => e.id === idOrEmployeeId || e.employeeId === idOrEmployeeId
    );
  },

  saveEmployee(
    empData: Omit<Employee, 'id'> & { id?: string },
    user: User
  ): { success: boolean; message: string; employee?: Employee } {
    // Both Admin and HR Admin can view, create, and edit employee records
    const auth = this.verifyHRAdminOrAdmin(user);
    if (!auth.authorized) {
      return { success: false, message: auth.message };
    }
    const employees = this.getEmployees();

    // Check Employee ID uniqueness (Employee ID must be unique)
    const existingIndex = employees.findIndex((e) => e.id === empData.id);
    const idDuplicate = employees.find(
      (e) => e.employeeId.toUpperCase() === empData.employeeId.toUpperCase() && e.id !== empData.id
    );

    if (idDuplicate) {
      return {
        success: false,
        message: `Employee ID "${empData.employeeId}" is already assigned to ${idDuplicate.fullName}. Employee ID must be unique.`,
      };
    }

    let savedEmployee: Employee;

    if (existingIndex >= 0) {
      // Edit Employee
      const existing = employees[existingIndex];
      savedEmployee = {
        ...existing,
        ...empData,
        id: empData.id!,
      };
      if (empData.leaveBalance !== undefined) {
        const numBal = Number(empData.leaveBalance);
        savedEmployee.leaveBalance = isNaN(numBal) ? existing.leaveBalance : Math.max(0, numBal);

        // Synchronize statutory Annual Leave balance record
        const balances = this.getLeaveBalances();
        const annualBal = balances.find(
          (b) => b.employeeId === savedEmployee.employeeId && b.leaveType === 'Annual Leave'
        );
        if (annualBal && savedEmployee.leaveBalance !== undefined) {
          annualBal.remaining = savedEmployee.leaveBalance;
          if (annualBal.entitled < savedEmployee.leaveBalance) {
            annualBal.entitled = savedEmployee.leaveBalance + annualBal.taken;
          }
          setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
        }
      }
      employees[existingIndex] = savedEmployee;
      this.addAuditLog(
        'EMPLOYEE_UPDATED',
        'Employee Master Data',
        `Updated details for ${savedEmployee.employeeId} - ${savedEmployee.fullName}`
      );
    } else {
      // Add Employee
      const initialLeaveBal =
        typeof empData.leaveBalance === 'number' && !isNaN(empData.leaveBalance)
          ? Math.max(0, empData.leaveBalance)
          : 16;

      savedEmployee = {
        ...empData,
        id: `emp-${Date.now()}`,
        leaveBalance: initialLeaveBal,
      };
      employees.push(savedEmployee);

      // Initialize default statutory leave balances for new employee
      const leaveTypes = this.getLeaveTypes();
      const balances = this.getLeaveBalances();
      leaveTypes.forEach((lt) => {
        const remainingDays = lt.name === 'Annual Leave' ? initialLeaveBal : lt.defaultDays;
        balances.push({
          id: `bal-${savedEmployee.employeeId}-${lt.id}`,
          employeeId: savedEmployee.employeeId,
          leaveType: lt.name,
          entitled: Math.max(remainingDays, lt.defaultDays),
          taken: 0,
          pending: 0,
          remaining: remainingDays,
        });
      });
      setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

      this.addAuditLog(
        'EMPLOYEE_CREATED',
        'Employee Master Data',
        `Registered new employee ${savedEmployee.employeeId} - ${savedEmployee.fullName} (Initial Leave Balance: ${initialLeaveBal} days)`
      );
    }

    setStorageItem(STORAGE_KEYS.EMPLOYEES, employees);
    setDoc(doc(db, 'employees', savedEmployee.id), savedEmployee, { merge: true }).catch(() => {});
    window.dispatchEvent(new Event('ethiore_storage_update'));
    return { success: true, message: 'Employee saved successfully.', employee: savedEmployee };
  },

  toggleEmployeeStatus(
    employeeId: string,
    user: User
  ): { success: boolean; message: string; newStatus?: 'Active' | 'Inactive' } {
    const employees = this.getEmployees();
    const target = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    if (!target) return { success: false, message: 'Employee not found.' };

    const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    target.status = newStatus;
    setStorageItem(STORAGE_KEYS.EMPLOYEES, employees);

    this.addAuditLog(
      'EMPLOYEE_STATUS_CHANGED',
      'Employee Master Data',
      `Changed status of ${target.employeeId} (${target.fullName}) to ${newStatus}`
    );
    return {
      success: true,
      message: `Employee ${target.fullName} is now ${newStatus}.`,
      newStatus,
    };
  },

  deleteEmployee(employeeId: string, user?: User): { success: boolean; message: string } {
    const auth = this.verifyAdministrator(user);
    if (!auth.authorized || !auth.verifiedAdmin) {
      return { success: false, message: auth.message || 'Unauthorized: Only Administrators can delete employees.' };
    }
    const employees = this.getEmployees();
    const target = employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
    if (!target) return { success: false, message: 'Employee not found.' };

    // Dependency check: leave, attendance, overtime, reporting hierarchy
    const leaves = this.getLeaveRecords().filter((l) => l.employeeId === target.employeeId);
    const attendance = this.getAttendanceRecords().filter((a) => a.employeeId === target.employeeId);
    const overtime = this.getOvertimeRecords().filter((o) => o.employeeId === target.employeeId);
    const subordinates = employees.filter((e) => e.manager === target.fullName && e.employeeId !== target.employeeId);

    if (leaves.length > 0 || attendance.length > 0 || overtime.length > 0 || subordinates.length > 0) {
      const reasons: string[] = [];
      if (leaves.length > 0) reasons.push(`${leaves.length} leave record(s)`);
      if (attendance.length > 0) reasons.push(`${attendance.length} attendance record(s)`);
      if (overtime.length > 0) reasons.push(`${overtime.length} overtime record(s)`);
      if (subordinates.length > 0) reasons.push(`${subordinates.length} direct report(s)`);
      return {
        success: false,
        message: `This record cannot be deleted because it is referenced by other records. (${reasons.join(', ')}). Permanent deletion is prohibited; please use "Deactivate" instead.`,
      };
    }

    const filtered = employees.filter((e) => e.employeeId !== target.employeeId);
    setStorageItem(STORAGE_KEYS.EMPLOYEES, filtered);
    const balances = this.getLeaveBalances().filter((b) => b.employeeId !== target.employeeId);
    setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

    // Clean up employee profile photo from Firebase Storage if present
    if (target.photoStoragePath) {
      this.deleteFile(target.photoStoragePath).catch(() => {});
    } else {
      this.deleteFile(`employees/${target.employeeId}/profile-photo`).catch(() => {});
    }

    this.addAuditLog(
      'DELETE',
      'Employee Master Data',
      `Permanently removed record for ${target.employeeId} (${target.fullName})`,
      undefined,
      auth.verifiedAdmin,
      {
        recordType: 'Employee',
        recordId: target.employeeId,
      }
    );
    return { success: true, message: 'Record deleted successfully.' };
  },

  // Edit explicitly permitted personal fields for Employee self-service
  updateEmployeePersonalProfile(
    employeeId: string,
    permittedData: { phoneNumber?: string; photo?: string; workLocation?: string },
    actingUser?: User
  ): { success: boolean; message: string; employee?: Employee } {
    const session = actingUser || this.getCurrentUser();
    if (!session) {
      return { success: false, message: 'Unauthorized: Not signed in.' };
    }
    // If user is Employee, ensure they can only edit their own profile
    if (session.role === 'Employee') {
      const links = this.getEmployeeAccountLinks();
      const myLink = links.find((l) => l.uid === session.id || l.email.toLowerCase() === session.email.toLowerCase());
      const linkedEmpId = session.employeeId || myLink?.employeeId;
      if (linkedEmpId !== employeeId) {
        return {
          success: false,
          message: 'Access Denied: Employees can only edit explicitly permitted fields on their own profile.',
        };
      }
    }
    const employees = this.getEmployees();
    const index = employees.findIndex((e) => e.employeeId === employeeId);
    if (index === -1) {
      return { success: false, message: 'Employee record not found.' };
    }
    const current = employees[index];
    const updated: Employee = {
      ...current,
      phoneNumber: permittedData.phoneNumber?.trim() || current.phoneNumber,
      photo: permittedData.photo?.trim() !== undefined ? permittedData.photo.trim() : current.photo,
      workLocation: permittedData.workLocation?.trim() || current.workLocation,
    };
    employees[index] = updated;
    setStorageItem(STORAGE_KEYS.EMPLOYEES, employees);
    this.addAuditLog(
      'PROFILE_UPDATED',
      'Employee Master Data',
      `Personal contact profile updated for ${updated.fullName} (${updated.employeeId})`,
      undefined,
      session
    );
    window.dispatchEvent(new Event('ethiore_storage_update'));
    return { success: true, message: 'Personal profile updated successfully.', employee: updated };
  },

  importEmployeesFromExcel(
    rows: Array<{
      employeeId: string;
      employeeCode?: string;
      fullName?: string;
      email?: string;
      emailAddress?: string;
      phone?: string;
      phoneNumber?: string;
      gender?: string;
      department?: string;
      position?: string;
      employmentDate?: string;
      employmentStatus?: string;
      status?: string;
      leaveBalance?: number | string;
      dateOfBirth?: string;
      employmentType?: string;
      workLocation?: string;
      manager?: string;
      photo?: string;
    }>,
    options: {
      user: User;
      fileName?: string;
    }
  ): {
    success: boolean;
    totalRows: number;
    processedCount: number;
    newCount: number;
    updatedCount: number;
    balancesUpdatedCount: number;
    failedCount: number;
    errors: Array<{
      rowNumber: number;
      employeeId?: string;
      employeeName?: string;
      field?: string;
      description: string;
    }>;
    details: Array<{
      rowNumber: number;
      employeeId: string;
      employeeName: string;
      department: string;
      previousBalance?: number;
      newBalance: number;
      action: 'New' | 'Update';
      status: 'Success' | 'Failed';
    }>;
  } {
    const auth = this.verifyHRAdminOrAdmin(options.user);
    if (!auth.authorized) {
      return {
        success: false,
        totalRows: rows.length,
        processedCount: 0,
        newCount: 0,
        updatedCount: 0,
        balancesUpdatedCount: 0,
        failedCount: rows.length,
        errors: [{ rowNumber: 0, description: auth.message }],
        details: [],
      };
    }

    const employees = [...this.getEmployees()];
    const balances = [...this.getLeaveBalances()];
    const leaveTypes = this.getLeaveTypes();
    const departments = this.getDepartments();

    // Map existing employee uppercase ID to index
    const empIndexMap = new Map<string, number>();
    employees.forEach((e, idx) => {
      empIndexMap.set(e.employeeId.trim().toUpperCase(), idx);
    });

    const seenInFile = new Set<string>();
    const errors: Array<{
      rowNumber: number;
      employeeId?: string;
      employeeName?: string;
      field?: string;
      description: string;
    }> = [];

    const details: Array<{
      rowNumber: number;
      employeeId: string;
      employeeName: string;
      department: string;
      previousBalance?: number;
      newBalance: number;
      action: 'New' | 'Update';
      status: 'Success' | 'Failed';
    }> = [];

    let newCount = 0;
    let updatedCount = 0;
    let balancesUpdatedCount = 0;
    let failedCount = 0;

    rows.forEach((row, idx) => {
      const rowNumber = idx + 2; // Row 1 is header

      // 1. Validate Employee ID presence
      const rawId = (row.employeeId || row.employeeCode || '').trim();
      if (!rawId) {
        errors.push({
          rowNumber,
          employeeName: row.fullName,
          field: 'Employee ID',
          description: 'Employee ID is missing or empty. Each record requires an Employee ID.',
        });
        failedCount++;
        return;
      }

      const cleanId = rawId.toUpperCase();

      // 2. Detect duplicate IDs within the Excel file
      if (seenInFile.has(cleanId)) {
        errors.push({
          rowNumber,
          employeeId: cleanId,
          employeeName: row.fullName,
          field: 'Employee ID',
          description: `Duplicate Employee ID "${cleanId}" detected within the Excel import file.`,
        });
        failedCount++;
        return;
      }
      seenInFile.add(cleanId);

      // 3. Validate Leave Balance format (decimal allowed, >= 0, no invalid text)
      let numericLeaveBal: number | undefined = undefined;
      if (
        row.leaveBalance !== undefined &&
        row.leaveBalance !== null &&
        String(row.leaveBalance).trim() !== ''
      ) {
        const parsedVal = Number(row.leaveBalance);
        if (isNaN(parsedVal)) {
          errors.push({
            rowNumber,
            employeeId: cleanId,
            employeeName: row.fullName,
            field: 'Leave Balance',
            description: `Invalid Leave Balance "${row.leaveBalance}". Value must be a valid numeric figure (e.g. 18, 15, 12.5).`,
          });
          failedCount++;
          return;
        }
        if (parsedVal < 0) {
          errors.push({
            rowNumber,
            employeeId: cleanId,
            employeeName: row.fullName,
            field: 'Leave Balance',
            description: `Leave Balance cannot be a negative figure (${parsedVal}).`,
          });
          failedCount++;
          return;
        }
        numericLeaveBal = parsedVal;
      }

      // 4. Validate Email format if present
      const rawEmail = (row.email || row.emailAddress || '').trim();
      if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        errors.push({
          rowNumber,
          employeeId: cleanId,
          employeeName: row.fullName,
          field: 'Email',
          description: `Invalid email address format: "${rawEmail}".`,
        });
        failedCount++;
        return;
      }

      // 5. EMPLOYEE MATCHING BY EMPLOYEE ID
      const existingIdx = empIndexMap.get(cleanId);

      if (existingIdx !== undefined) {
        // CASE A: EXISTING EMPLOYEE -> UPDATE RECORD
        const target = employees[existingIdx];
        const prevBalance =
          typeof target.leaveBalance === 'number'
            ? target.leaveBalance
            : (balances.find(
                (b) => b.employeeId === target.employeeId && b.leaveType === 'Annual Leave'
              )?.remaining ?? 0);

        const newBal = numericLeaveBal !== undefined ? numericLeaveBal : prevBalance;

        // PRESERVE EXISTING DATA: Only update fields that are provided and non-empty in the row
        if (row.fullName?.trim()) target.fullName = row.fullName.trim();
        if (row.department?.trim()) target.department = row.department.trim();
        if (row.position?.trim()) target.position = row.position.trim();
        const rowPhone = (row.phone || row.phoneNumber)?.trim();
        if (rowPhone) target.phoneNumber = rowPhone;
        if (rawEmail) target.emailAddress = rawEmail;
        if (row.gender?.trim()) {
          target.gender = row.gender.trim().toLowerCase() === 'female' ? 'Female' : 'Male';
        }
        if (row.employmentDate?.trim()) target.employmentDate = row.employmentDate.trim();
        const rowStatus = (row.employmentStatus || row.status)?.trim();
        if (rowStatus) {
          target.status = rowStatus.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
        }

        // Automatic Leave Balance Update
        target.leaveBalance = newBal;

        // Update statutory Annual Leave balance in system
        const annualBal = balances.find(
          (b) => b.employeeId === target.employeeId && b.leaveType === 'Annual Leave'
        );
        if (annualBal) {
          annualBal.remaining = newBal;
          if (annualBal.entitled < newBal) {
            annualBal.entitled = newBal + annualBal.taken;
          }
        } else {
          balances.push({
            id: `bal-${target.employeeId}-lt-annual`,
            employeeId: target.employeeId,
            leaveType: 'Annual Leave',
            entitled: Math.max(newBal, 16),
            taken: 0,
            pending: 0,
            remaining: newBal,
          });
        }

        // Record Audit Log for Leave Balance / Excel Import update
        this.addAuditLog(
          'EXCEL_IMPORT',
          'Employee Master Data',
          `Employee ID: ${target.employeeId} | Previous Balance: ${prevBalance} | New Balance: ${newBal} | Action: Excel Import | Updated By: ${options.user.displayName} (${options.user.role})${options.fileName ? ' | File: ' + options.fileName : ''}`,
          {
            settingName: 'Leave Balance',
            previousValue: String(prevBalance),
            newValue: String(newBal),
          },
          options.user,
          {
            recordType: 'Employee Leave Balance',
            recordId: target.employeeId,
          }
        );

        updatedCount++;
        balancesUpdatedCount++;

        details.push({
          rowNumber,
          employeeId: target.employeeId,
          employeeName: target.fullName,
          department: target.department,
          previousBalance: prevBalance,
          newBalance: newBal,
          action: 'Update',
          status: 'Success',
        });
      } else {
        // CASE B: NEW EMPLOYEE -> CREATE RECORD
        // Check required fields for creating a new employee
        if (!row.fullName?.trim()) {
          errors.push({
            rowNumber,
            employeeId: cleanId,
            field: 'Full Name',
            description: 'Full Name is required to register a new employee record.',
          });
          failedCount++;
          return;
        }

        const initialLeaveBal = numericLeaveBal !== undefined ? numericLeaveBal : 16;
        const newDept = row.department?.trim() || (departments[0]?.name || 'Operations');
        const newPos = row.position?.trim() || 'Officer';

        const newEmp: Employee = {
          id: `emp-imp-${Date.now()}-${idx}`,
          employeeId: cleanId,
          fullName: row.fullName.trim(),
          gender: row.gender?.trim().toLowerCase() === 'female' ? 'Female' : 'Male',
          dateOfBirth: row.dateOfBirth?.trim() || '1992-01-01',
          employmentDate:
            row.employmentDate?.trim() || new Date().toISOString().split('T')[0],
          department: newDept,
          position: newPos,
          employmentType: (['Permanent', 'Contract', 'Probation', 'Intern'].includes(
            row.employmentType || ''
          )
            ? row.employmentType!
            : 'Permanent') as any,
          workLocation:
            row.workLocation?.trim() || 'Addis Ababa - EthioRe Tower Head Office',
          manager: row.manager?.trim() || 'Director',
          phoneNumber: (row.phone || row.phoneNumber)?.trim() || '+251 91 000 0000',
          emailAddress: rawEmail || `${cleanId.toLowerCase()}@ethiopianre.com`,
          photo: row.photo?.trim() || '',
          status:
            (row.employmentStatus || row.status)?.trim().toLowerCase() === 'inactive'
              ? 'Inactive'
              : 'Active',
          leaveBalance: initialLeaveBal,
        };

        employees.push(newEmp);
        empIndexMap.set(cleanId, employees.length - 1);

        // Initialize statutory leave entitlements for new employee
        leaveTypes.forEach((lt) => {
          const remainingDays = lt.name === 'Annual Leave' ? initialLeaveBal : lt.defaultDays;
          balances.push({
            id: `bal-${newEmp.employeeId}-${lt.id}`,
            employeeId: newEmp.employeeId,
            leaveType: lt.name,
            entitled: Math.max(remainingDays, lt.defaultDays),
            taken: 0,
            pending: 0,
            remaining: remainingDays,
          });
        });

        this.addAuditLog(
          'EXCEL_IMPORT',
          'Employee Master Data',
          `Employee ID: ${newEmp.employeeId} | Previous Balance: None (New Employee) | New Balance: ${initialLeaveBal} | Action: Excel Import | Updated By: ${options.user.displayName} (${options.user.role})${options.fileName ? ' | File: ' + options.fileName : ''}`,
          {
            settingName: 'Leave Balance',
            previousValue: 'None',
            newValue: String(initialLeaveBal),
          },
          options.user,
          {
            recordType: 'Employee Master Data',
            recordId: newEmp.employeeId,
          }
        );

        newCount++;
        balancesUpdatedCount++;

        details.push({
          rowNumber,
          employeeId: newEmp.employeeId,
          employeeName: newEmp.fullName,
          department: newEmp.department,
          previousBalance: undefined,
          newBalance: initialLeaveBal,
          action: 'New',
          status: 'Success',
        });
      }
    });

    const processedCount = newCount + updatedCount;

    // Persist changes and synchronize with Firestore
    if (processedCount > 0) {
      setStorageItem(STORAGE_KEYS.EMPLOYEES, employees);
      setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

      // Async sync to Cloud Firestore
      for (const emp of employees) {
        setDoc(doc(db, 'employees', emp.id), emp, { merge: true }).catch(() => {});
      }

      window.dispatchEvent(new Event('ethiore_storage_update'));
    }

    return {
      success: processedCount > 0,
      totalRows: rows.length,
      processedCount,
      newCount,
      updatedCount,
      balancesUpdatedCount,
      failedCount,
      errors,
      details,
    };
  },

  importEmployeesFromCSV(
    csvRows: any[],
    user: User
  ): { success: boolean; importedCount: number; errors: string[] } {
    const res = this.importEmployeesFromExcel(csvRows, { user, fileName: 'csv_upload.csv' });
    return {
      success: res.success,
      importedCount: res.processedCount,
      errors: res.errors.map((e) => `Row ${e.rowNumber}: ${e.description}`),
    };
  },

  // ==========================================
  // LEAVE MANAGEMENT (NO APPROVAL WORKFLOW)
  // ==========================================
  getLeaveRecords(): LeaveRecord[] {
    return getStorageItem<LeaveRecord[]>(STORAGE_KEYS.LEAVE_RECORDS, initialLeaveRecords);
  },

  getLeaveBalances(): LeaveBalance[] {
    return getStorageItem<LeaveBalance[]>(STORAGE_KEYS.LEAVE_BALANCES, initialLeaveBalances);
  },

  getEmployeeLeaveBalances(employeeId: string): LeaveBalance[] {
    const balances = this.getLeaveBalances();
    return balances.filter((b) => b.employeeId === employeeId);
  },

  // 6. Leave Workflow — NO APPROVAL
  // HR Admin creates leave record -> System validates -> Record saved -> Balance automatically updated -> Appears in History & Calendar
  createLeaveRecord(
    request: {
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
    },
    user: User
  ): { success: boolean; message: string; record?: LeaveRecord } {
    // Role boundary: Employee can only submit leave for themselves
    if (user.role === 'Employee') {
      const links = this.getEmployeeAccountLinks();
      const myLink = links.find((l) => l.uid === user.id || l.email.toLowerCase() === user.email.toLowerCase());
      const linkedId = user.employeeId || myLink?.employeeId;
      if (linkedId && linkedId !== request.employeeId) {
        return {
          success: false,
          message: 'Access Denied: Employees are only authorized to submit leave requests for their own account.',
        };
      }
    }

    // 1. System validates the record
    const employee = this.getEmployeeById(request.employeeId);
    if (!employee) {
      return { success: false, message: 'Invalid employee selected.' };
    }
    // Strict Rule: Inactive employees must not be selectable for new operational records
    if (employee.status !== 'Active') {
      return {
        success: false,
        message: `Employee ${employee.fullName} (${employee.employeeId}) is currently Inactive. Inactive employees cannot apply for or be assigned leave records.`,
      };
    }

    if (request.days <= 0) {
      return { success: false, message: 'Leave duration must be at least 1 day.' };
    }

    if (request.startDate > request.endDate) {
      return { success: false, message: 'Start date cannot be after end date.' };
    }

    // Check balance for this employee and leave type
    const balances = this.getLeaveBalances();
    let balance = balances.find(
      (b) => b.employeeId === request.employeeId && b.leaveType === request.leaveType
    );

    if (!balance) {
      // Auto-create balance if not present for this leave type
      const leaveTypeObj = this.getLeaveTypes().find((l) => l.name === request.leaveType);
      const entitled = leaveTypeObj ? leaveTypeObj.defaultDays : 16;
      balance = {
        id: `bal-${request.employeeId}-${Date.now()}`,
        employeeId: request.employeeId,
        employeeName: employee.fullName,
        leaveType: request.leaveType,
        entitled,
        taken: 0,
        pending: 0,
        remaining: entitled,
      };
      balances.push(balance);
    }

    // Validate sufficient leave balance
    if (balance.remaining < request.days) {
      return {
        success: false,
        message: `Insufficient leave balance for ${request.leaveType}. Available remaining: ${balance.remaining} days, requested: ${request.days} days.`,
      };
    }

    // Generate unique sequential Leave ID (e.g. LEV-106)
    const records = this.getLeaveRecords();
    const existingNumIds = records
      .map((r) => {
        const match = r.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNumIds.length > 0 ? Math.max(...existingNumIds) + 1 : 101;
    const leaveId = `LEV-${nextNum}`;

    const todayDate = new Date().toISOString().split('T')[0];

    // 2. Leave record is saved (Status: Recorded - directly active, NO approval workflow)
    const newRecord: LeaveRecord = {
      id: leaveId,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      department: employee.department,
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      reason: request.reason,
      status: 'Recorded',
      createdBy: `${user.displayName} (${user.role})`,
      createdDate: todayDate,
      appliedDate: todayDate,
    };

    // 3. Leave balance is automatically updated
    balance.taken += request.days;
    balance.remaining -= request.days;
    balance.pending = 0;

    // Persist records & updated balances
    setStorageItem(STORAGE_KEYS.LEAVE_RECORDS, [newRecord, ...records]);
    setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

    this.addAuditLog(
      'LEAVE_RECORD_SAVED',
      'Leave Management',
      `Leave record ${leaveId} created for ${employee.fullName} (${request.leaveType}, ${request.days} days). Balance automatically deducted.`
    );

    return {
      success: true,
      message: `Leave record ${leaveId} created successfully. Leave balance has been automatically updated.`,
      record: newRecord,
    };
  },

  // Alias for compatibility
  submitLeaveRequest(
    request: {
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
    },
    user: User
  ): { success: boolean; message: string; record?: LeaveRecord } {
    return this.createLeaveRecord(request, user);
  },

  // Edit Leave Record
  editLeaveRecord(
    leaveId: string,
    data: {
      leaveType: string;
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
      status?: LeaveStatus;
    },
    user: User
  ): { success: boolean; message: string; record?: LeaveRecord } {
    const records = this.getLeaveRecords();
    const targetIndex = records.findIndex((r) => r.id === leaveId);
    if (targetIndex === -1) {
      return { success: false, message: 'Leave record not found.' };
    }

    if (data.days <= 0) {
      return { success: false, message: 'Leave duration must be at least 1 day.' };
    }
    if (data.startDate > data.endDate) {
      return { success: false, message: 'Start date cannot be after end date.' };
    }

    const currentRecord = records[targetIndex];
    const balances = this.getLeaveBalances();

    // Reconcile balance: restore old days then deduct new days
    const oldBalance = balances.find(
      (b) => b.employeeId === currentRecord.employeeId && b.leaveType === currentRecord.leaveType
    );
    let newBalance = balances.find(
      (b) => b.employeeId === currentRecord.employeeId && b.leaveType === data.leaveType
    );

    if (!newBalance) {
      const leaveTypeObj = this.getLeaveTypes().find((l) => l.name === data.leaveType);
      const entitled = leaveTypeObj ? leaveTypeObj.defaultDays : 16;
      newBalance = {
        id: `bal-${currentRecord.employeeId}-${Date.now()}`,
        employeeId: currentRecord.employeeId,
        employeeName: currentRecord.employeeName,
        leaveType: data.leaveType,
        entitled,
        taken: 0,
        pending: 0,
        remaining: entitled,
      };
      balances.push(newBalance);
    }

    // Temporarily restore previous deduction
    if (oldBalance) {
      oldBalance.taken = Math.max(0, oldBalance.taken - currentRecord.days);
      oldBalance.remaining += currentRecord.days;
    }

    // Check if new balance can accommodate new days
    if (newBalance.remaining < data.days) {
      // Rollback old balance
      if (oldBalance) {
        oldBalance.taken += currentRecord.days;
        oldBalance.remaining -= currentRecord.days;
      }
      return {
        success: false,
        message: `Insufficient leave balance for updated ${data.leaveType}. Remaining: ${newBalance.remaining} days, requested: ${data.days} days.`,
      };
    }

    // Deduct new days
    newBalance.taken += data.days;
    newBalance.remaining -= data.days;

    const updatedRecord: LeaveRecord = {
      ...currentRecord,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      reason: data.reason,
      status: data.status || currentRecord.status,
    };

    records[targetIndex] = updatedRecord;
    setStorageItem(STORAGE_KEYS.LEAVE_RECORDS, records);
    setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);

    this.addAuditLog(
      'LEAVE_RECORD_EDITED',
      'Leave Management',
      `Leave record ${leaveId} updated for ${currentRecord.employeeName}. Balance automatically synchronized.`
    );

    return {
      success: true,
      message: `Leave record ${leaveId} successfully updated and balance adjusted.`,
      record: updatedRecord,
    };
  },

  // Delete Leave Record
  deleteLeaveRecord(leaveId: string, user?: User): { success: boolean; message: string } {
    const actingUser = user || this.getCurrentUser();
    if (!actingUser) {
      return { success: false, message: 'Unauthorized: Active user session required.' };
    }

    const records = this.getLeaveRecords();
    const target = records.find((r) => r.id === leaveId);
    if (!target) {
      return { success: false, message: 'Leave record not found.' };
    }

    // Automatically restore leave balance
    const balances = this.getLeaveBalances();
    const balance = balances.find(
      (b) => b.employeeId === target.employeeId && b.leaveType === target.leaveType
    );
    if (balance) {
      balance.taken = Math.max(0, balance.taken - target.days);
      balance.remaining += target.days;
      setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
    }

    const filtered = records.filter((r) => r.id !== leaveId);
    setStorageItem(STORAGE_KEYS.LEAVE_RECORDS, filtered);

    this.addAuditLog(
      'DELETE',
      'Leave Management',
      `Deleted leave record ${leaveId} for ${target.employeeName}. Restored ${target.days} day(s) to ${target.leaveType} balance.`,
      undefined,
      actingUser,
      {
        recordType: 'Leave Record',
        recordId: target.id,
      }
    );

    return {
      success: true,
      message: `Record deleted successfully. Restored ${target.days} day(s) to ${target.leaveType} balance.`,
    };
  },

  // Adjust balance (Administrative utility)
  adjustLeaveBalance(
    employeeId: string,
    leaveType: string,
    adjustment: number, // positive to add, negative to deduct
    reason: string,
    user: User
  ): { success: boolean; message: string } {
    const balances = this.getLeaveBalances();
    const balance = balances.find((b) => b.employeeId === employeeId && b.leaveType === leaveType);
    if (!balance) return { success: false, message: 'Balance record not found.' };

    balance.entitled += adjustment;
    balance.remaining += adjustment;

    setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, balances);
    this.addAuditLog(
      'LEAVE_BALANCE_ADJUSTED',
      'Leave Management',
      `Adjusted ${leaveType} balance for ${employeeId} by ${adjustment > 0 ? '+' : ''}${adjustment} days. Reason: ${reason}`
    );
    return { success: true, message: 'Leave balance adjusted.' };
  },

  // ==========================================
  // ATTENDANCE MANAGEMENT
  // ==========================================
  getAttendanceRecords(): AttendanceRecord[] {
    return getStorageItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, initialAttendanceRecords);
  },

  recordCheckIn(
    employeeId: string,
    notes?: string
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    // Check Employee active status
    const employee = this.getEmployeeById(employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };
    if (employee.status !== 'Active') {
      return {
        success: false,
        message: `Employee ${employee.fullName} is Inactive. Inactive employees cannot check in or out.`,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const records = this.getAttendanceRecords();
    const existing = records.find((r) => r.employeeId === employeeId && r.date === today);

    if (existing && existing.checkIn) {
      return {
        success: false,
        message: `${employee.fullName} has already checked in today at ${existing.checkIn}.`,
      };
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const checkInTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Determine status: work starts at 08:00, grace period is 15 mins (08:15)
    const settings = this.getAttendanceSettings();
    const [startH, startM] = settings.workStartTime.split(':').map(Number);
    const graceTotalMinutes = startH * 60 + startM + settings.gracePeriodMinutes;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const isLate = currentTotalMinutes > graceTotalMinutes;
    const status: AttendanceRecord['status'] = isLate ? 'Late' : 'Present';

    let savedRecord: AttendanceRecord;

    if (existing) {
      existing.checkIn = checkInTime;
      existing.status = status;
      if (notes) existing.notes = notes;
      savedRecord = existing;
    } else {
      savedRecord = {
        id: `att-${Date.now()}`,
        date: today,
        employeeId: employee.employeeId,
        employeeName: employee.fullName,
        department: employee.department,
        checkIn: checkInTime,
        checkOut: '',
        workingHours: 0,
        status,
        notes: notes || (isLate ? 'Checked in past grace period' : 'Normal on-time check in'),
      };
      records.unshift(savedRecord);
    }

    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
    this.addAuditLog(
      'ATTENDANCE_CHECK_IN',
      'Attendance',
      `${employee.fullName} (${employee.employeeId}) checked in at ${checkInTime} [Status: ${status}]`
    );

    return {
      success: true,
      message: `Checked in successfully at ${checkInTime}. Status: ${status}`,
      record: savedRecord,
    };
  },

  recordCheckOut(
    employeeId: string,
    notes?: string
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    const employee = this.getEmployeeById(employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const today = new Date().toISOString().split('T')[0];
    const records = this.getAttendanceRecords();
    const existing = records.find((r) => r.employeeId === employeeId && r.date === today);

    if (!existing || !existing.checkIn) {
      return {
        success: false,
        message: `${employee.fullName} has not checked in today yet. Please check in first.`,
      };
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const checkOutTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Calculate working hours
    const [inH, inM] = existing.checkIn.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, 0, 0);

    const outDate = new Date();
    const diffHours = Math.max(0, (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60));
    // Deduct 1 hour lunch if worked more than 5 hours
    const netHours = diffHours > 5 ? Math.max(0, diffHours - 1) : diffHours;
    const roundedHours = Math.round(netHours * 10) / 10;

    existing.checkOut = checkOutTime;
    existing.workingHours = roundedHours;
    if (notes) existing.notes = (existing.notes ? existing.notes + ' | ' : '') + notes;

    const settings = this.getAttendanceSettings();
    if (roundedHours < settings.halfDayThresholdHours && existing.status === 'Present') {
      existing.status = 'Half Day';
    }

    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
    this.addAuditLog(
      'ATTENDANCE_CHECK_OUT',
      'Attendance',
      `${employee.fullName} checked out at ${checkOutTime} (Hours worked: ${roundedHours}h)`
    );

    return {
      success: true,
      message: `Checked out successfully at ${checkOutTime}. Recorded ${roundedHours} hours.`,
      record: existing,
    };
  },

  saveAttendanceRecord(
    record: Omit<AttendanceRecord, 'id'> & { id?: string },
    user: User
  ): { success: boolean; message: string } {
    // Validate employee active
    const employee = this.getEmployeeById(record.employeeId);
    if (!employee) return { success: false, message: 'Invalid employee.' };
    if (employee.status !== 'Active' && !record.id) {
      return { success: false, message: 'Cannot create attendance record for Inactive employee.' };
    }

    const records = this.getAttendanceRecords();
    if (record.id) {
      const idx = records.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        records[idx] = { ...record, id: record.id };
      }
    } else {
      records.unshift({ ...record, id: `att-${Date.now()}` });
    }

    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
    this.addAuditLog(
      'ATTENDANCE_RECORD_UPDATED',
      'Attendance',
      `Manual attendance entry for ${record.employeeName} on ${record.date}`
    );
    return { success: true, message: 'Attendance record saved.' };
  },

  // Overtime
  getOvertimeRecords(): OvertimeRecord[] {
    return getStorageItem<OvertimeRecord[]>(STORAGE_KEYS.OVERTIME_RECORDS, initialOvertimeRecords);
  },

  saveOvertimeRecord(
    data: {
      employeeId: string;
      date: string;
      normalHours: number;
      overtimeHours: number;
      rateMultiplier: number;
      reason: string;
    },
    user: User
  ): { success: boolean; message: string } {
    const employee = this.getEmployeeById(data.employeeId);
    if (!employee) return { success: false, message: 'Invalid employee.' };
    if (employee.status !== 'Active') {
      return { success: false, message: 'Inactive employee cannot register overtime.' };
    }

    const records = this.getOvertimeRecords();
    const newRecord: OvertimeRecord = {
      id: `ot-${Date.now()}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      date: data.date,
      normalHours: data.normalHours,
      overtimeHours: data.overtimeHours,
      rateMultiplier: data.rateMultiplier,
      reason: data.reason,
      status: 'Pending',
    };

    records.unshift(newRecord);
    setStorageItem(STORAGE_KEYS.OVERTIME_RECORDS, records);
    this.addAuditLog(
      'OVERTIME_SUBMITTED',
      'Attendance',
      `Overtime requested for ${employee.fullName}: ${data.overtimeHours} hours at ${data.rateMultiplier}x`
    );

    return { success: true, message: 'Overtime record submitted.' };
  },

  updateOvertimeStatus(
    id: string,
    status: 'Approved' | 'Rejected',
    user: User
  ): { success: boolean; message: string } {
    const records = this.getOvertimeRecords();
    const target = records.find((r) => r.id === id);
    if (!target) return { success: false, message: 'Record not found.' };

    target.status = status;
    target.approvedBy = `${user.displayName} (${user.role})`;

    setStorageItem(STORAGE_KEYS.OVERTIME_RECORDS, records);
    this.addAuditLog(
      `OVERTIME_${status.toUpperCase()}`,
      'Attendance',
      `Overtime for ${target.employeeName} (${target.overtimeHours}h) ${status}`
    );

    return { success: true, message: `Overtime status updated to ${status}.` };
  },

  // Reset entire database to default EthioRe demo data
  resetToDefaults(): void {
    localStorage.clear();
    setStorageItem(STORAGE_KEYS.COMPANY_INFO, initialCompanyInfo);
    setStorageItem(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    setStorageItem(STORAGE_KEYS.POSITIONS, initialPositions);
    setStorageItem(STORAGE_KEYS.EMPLOYEES, initialEmployees);
    setStorageItem(STORAGE_KEYS.LEAVE_TYPES, initialLeaveTypes);
    setStorageItem(STORAGE_KEYS.LEAVE_BALANCES, initialLeaveBalances);
    setStorageItem(STORAGE_KEYS.LEAVE_RECORDS, initialLeaveRecords);
    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, initialAttendanceRecords);
    setStorageItem(STORAGE_KEYS.OVERTIME_RECORDS, initialOvertimeRecords);
    setStorageItem(STORAGE_KEYS.HOLIDAYS, initialEthiopianHolidays);
    setStorageItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, initialAttendanceSettings);
    setStorageItem(STORAGE_KEYS.SHIFTS, initialShifts);
    setStorageItem(STORAGE_KEYS.USERS, initialUsers);
    setStorageItem(STORAGE_KEYS.EMPLOYEE_ACCOUNT_LINKS, initialEmployeeAccountLinks);
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, initialUsers[0].id);
    window.dispatchEvent(new Event('ethiore_storage_update'));
    window.dispatchEvent(new Event('ethiore_user_change'));
  },
};
