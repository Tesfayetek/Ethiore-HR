import { useState, useEffect, FormEvent } from 'react';
import {
  Building,
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Plus,
  Save,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  Sliders,
  UserPlus,
  Pencil,
  X,
  Printer,
  Cloud,
  Database,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  UserRole,
  Department,
  Position,
  LeaveTypeConfig,
  EthiopianHoliday,
  AttendanceSettings,
  User,
} from '../../types';
import { storageService } from '../../services/storage';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface ConfigurationViewProps {
  userRole: UserRole;
  initialSubTab?: string;
}

export const ConfigurationView = ({
  userRole,
  initialSubTab = 'company',
}: ConfigurationViewProps) => {
  const [activeTab, setActiveTab] = useState<
    'company' | 'departments' | 'positions' | 'leavetypes' | 'holidays' | 'shifts' | 'users' | 'audit' | 'cloud'
  >((initialSubTab as any) || 'company');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  const isAdmin = userRole === 'Administrator';

  // Company info state
  const [companyInfo, setCompanyInfo] = useState(() => storageService.getCompanyInfo());

  // Departments
  const [departments, setDepartments] = useState<Department[]>(() => storageService.getDepartments());
  const [newDept, setNewDept] = useState({ name: '', code: '', headOfDepartment: '' });

  // Positions
  const [positions, setPositions] = useState<Position[]>(() => storageService.getPositions());
  const [newPos, setNewPos] = useState({ title: '', department: departments[0]?.name || '' });

  // Leave Types
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>(() => storageService.getLeaveTypes());

  // Holidays
  const [holidays, setHolidays] = useState<EthiopianHoliday[]>(() => storageService.getHolidays());
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    amharicName: '',
    date: new Date().toISOString().split('T')[0],
    isFixed: true,
  });

  // Shifts / Attendance settings
  const [shifts, setShifts] = useState<AttendanceSettings>(() => storageService.getAttendanceSettings());

  // Users & Roles
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'HR Admin' as UserRole,
  });

  // Audit Logs
  const auditLogs = storageService.getAuditLogs();
  const [auditFilter, setAuditFilter] = useState<'all' | 'config' | 'deletions'>('all');

  // Editing state for existing records (Administrator only)
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeConfig | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<EthiopianHoliday | null>(null);

  // Deletion modal state for Configuration records
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'department' | 'position' | 'holiday';
    id: string;
    name: string;
    recordType: string;
    details?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cloud & Firebase Backend state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ connected: boolean; latencyMs: number; message: string } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await storageService.testFirestoreConnection();
      setConnectionResult(res);
      setFeedback({
        type: res.connected ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setConnectionResult({
        connected: false,
        latencyMs: 0,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!isAdmin) return;
    setSyncingCloud(true);
    try {
      const res = await storageService.seedFirestore();
      setSyncResult(res.message);
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  const refreshAll = () => {
    setCompanyInfo(storageService.getCompanyInfo());
    setDepartments(storageService.getDepartments());
    setPositions(storageService.getPositions());
    setLeaveTypes(storageService.getLeaveTypes());
    setHolidays(storageService.getHolidays());
    setShifts(storageService.getAttendanceSettings());
    setUsers(storageService.getUsers());
  };

  const handleSaveCompany = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.updateCompanyInfo(companyInfo, currentUser);
    if (res.success) {
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleAddDept = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newDept.name || !newDept.code) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveDepartment({
      id: `dept-${Date.now()}`,
      name: newDept.name,
      code: newDept.code,
      headOfDepartment: newDept.headOfDepartment,
      description: '',
    }, currentUser);
    if (res.success) {
      setNewDept({ name: '', code: '', headOfDepartment: '' });
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleUpdateDept = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingDept) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveDepartment(editingDept, currentUser);
    if (res.success) {
      setEditingDept(null);
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDeleteDept = (id: string, name: string) => {
    if (!isAdmin) return;
    setDeleteTarget({
      type: 'department',
      id,
      name,
      recordType: 'Department',
      details: 'Deletion will check that no active employees or positions are assigned to this department.',
    });
  };

  const handleAddPosition = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newPos.title) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.savePosition({
      id: `pos-${Date.now()}`,
      title: newPos.title,
      department: newPos.department,
      grade: 'Professional',
    }, currentUser);
    if (res.success) {
      setNewPos({ title: '', department: departments[0]?.name || '' });
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleUpdatePosition = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingPos) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.savePosition(editingPos, currentUser);
    if (res.success) {
      setEditingPos(null);
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDeletePosition = (id: string, title: string) => {
    if (!isAdmin) return;
    setDeleteTarget({
      type: 'position',
      id,
      name: title,
      recordType: 'Position',
      details: 'Deletion will verify that no active employees currently hold this position.',
    });
  };

  const handleUpdateLeaveType = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingLeaveType) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveLeaveType(editingLeaveType, currentUser);
    if (res.success) {
      setEditingLeaveType(null);
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleAddHoliday = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newHoliday.name || !newHoliday.date) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveHoliday({
      id: `hol-${Date.now()}`,
      name: newHoliday.name,
      amharicName: newHoliday.amharicName || newHoliday.name,
      date: newHoliday.date,
      isFixed: newHoliday.isFixed,
    }, currentUser);
    if (res.success) {
      setNewHoliday({ name: '', amharicName: '', date: new Date().toISOString().split('T')[0], isFixed: true });
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleUpdateHoliday = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingHoliday) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.saveHoliday(editingHoliday, currentUser);
    if (res.success) {
      setEditingHoliday(null);
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDeleteHoliday = (id: string, name: string) => {
    if (!isAdmin) return;
    setDeleteTarget({
      type: 'holiday',
      id,
      name,
      recordType: 'Public Holiday',
    });
  };

  // Perform actual backend deletion after user confirmation
  const handleConfirmDelete = () => {
    if (!isAdmin || !deleteTarget || isDeleting) return;
    setIsDeleting(true);
    const currentUser = storageService.getCurrentUser();
    let res: { success: boolean; message: string };

    if (deleteTarget.type === 'department') {
      res = storageService.deleteDepartment(deleteTarget.id, currentUser);
    } else if (deleteTarget.type === 'position') {
      res = storageService.deletePosition(deleteTarget.id, currentUser);
    } else {
      res = storageService.deleteHoliday(deleteTarget.id, currentUser);
    }

    if (res.success) {
      refreshAll();
      setFeedback({ type: 'success', text: res.message || 'Record deleted successfully.' });
      setDeleteTarget(null);
    } else {
      setFeedback({ type: 'error', text: res.message || 'Unable to delete the record. Please try again.' });
      setDeleteTarget(null);
    }
    setIsDeleting(false);
  };

  const handleSaveShifts = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.updateAttendanceSettings(shifts, currentUser);
    if (res.success) {
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newUser.name || !newUser.email) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.createUser({
      displayName: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }, currentUser);
    if (res.success) {
      setNewUser({ name: '', email: '', role: 'HR Admin' });
      refreshAll();
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleChangeUserRole = (u: User, nextRole: UserRole) => {
    if (!isAdmin) return;
    const currentUser = storageService.getCurrentUser();
    const res = storageService.updateUserRole(u.id, nextRole, currentUser);
    if (res.success) {
      refreshAll();
      setFeedback({ type: 'success', text: `Updated ${u.displayName}'s role to ${nextRole}.` });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configuration Settings</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              System Parameters
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise structure, leave policies, statutory holidays, shifts, and role-based access control.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Read-Only View: Administrator privilege required to modify settings</span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 text-xs font-medium overflow-x-auto shadow-2xs">
        {[
          { id: 'company', label: 'Company Information' },
          { id: 'departments', label: 'Departments', count: departments.length },
          { id: 'positions', label: 'Positions & Job Titles', count: positions.length },
          { id: 'leavetypes', label: 'Leave Types Setup', count: leaveTypes.length },
          { id: 'holidays', label: 'Public Holidays', count: holidays.length },
          { id: 'shifts', label: 'Working Hours & Shifts' },
          { id: 'users', label: 'User Roles & Access' },
          { id: 'audit', label: 'Security Audit Log' },
          { id: 'cloud', label: 'Cloud & Database (Firebase)' },
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
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: COMPANY INFORMATION */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSaveCompany} className="max-w-3xl space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Company Official Legal Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commercial Registration Number</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.registrationNumber}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Taxpayer Identification Number (TIN)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.tin}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, tin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Head Office Address</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">General Telephone</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.telephone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Website</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.website}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Working Days</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={companyInfo.workingDays}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, workingDays: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center space-x-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Company Information</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Add New Department</h3>
              <form onSubmit={handleAddDept} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    placeholder="e.g. Legal & Compliance"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
                  <input
                    type="text"
                    required
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LEG"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Head of Department</label>
                  <input
                    type="text"
                    value={newDept.headOfDepartment}
                    onChange={(e) => setNewDept({ ...newDept, headOfDepartment: e.target.value })}
                    placeholder="e.g. Yonas Tadesse"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center justify-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Create Department</span>
                </button>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden`}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Configured Departments ({departments.length})
              </span>
            </div>
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Head of Dept</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="p-8 text-center text-slate-400">
                      No departments found. Use the form above to add a department.
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-amber-800">{d.code}</td>
                    <td className="p-3 font-semibold text-slate-800">{d.name}</td>
                    <td className="p-3 text-slate-600">{d.headOfDepartment || '—'}</td>
                    {isAdmin && (
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingDept({ ...d })}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded text-[11px] font-medium transition-colors"
                          title="Edit Department"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(d.id, d.name)}
                          className="inline-flex items-center p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: POSITIONS & JOB TITLES */}
      {activeTab === 'positions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Add Position / Job Title</h3>
              <form onSubmit={handleAddPosition} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={newPos.title}
                    onChange={(e) => setNewPos({ ...newPos, title: e.target.value })}
                    placeholder="e.g. Senior Treaty Underwriter"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newPos.department}
                    onChange={(e) => setNewPos({ ...newPos, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center justify-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Register Position</span>
                </button>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden`}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Positions ({positions.length})
              </span>
            </div>
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Department</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="p-8 text-center text-slate-400">
                      No positions found. Use the form above to add a position.
                    </td>
                  </tr>
                ) : (
                  positions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{p.title}</td>
                    <td className="p-3 text-slate-600">{p.department}</td>
                    {isAdmin && (
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingPos({ ...p })}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded text-[11px] font-medium transition-colors"
                          title="Edit Position"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(p.id, p.title)}
                          className="inline-flex items-center p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE TYPES SETUP */}
      {activeTab === 'leavetypes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Ethiopian Labor Proclamation Leave Entitlements
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Statutory day limits and carryover regulations governing Ethiopian Reinsurance.
              </p>
            </div>
          </div>
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Leave Type</th>
                <th className="p-3 text-center">Default Entitlement</th>
                <th className="p-3 text-center">Paid / Unpaid</th>
                <th className="p-3 text-center">Carryover Allowed</th>
                <th className="p-3 text-center">Max Carryover Days</th>
                {isAdmin && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaveTypes.map((lt) => (
                <tr key={lt.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">
                    <div>{lt.name}</div>
                    {lt.description && <div className="text-[10px] text-slate-400 font-normal">{lt.description}</div>}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-amber-800">{lt.defaultDays} working days</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lt.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {lt.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lt.carryoverAllowed ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {lt.carryoverAllowed ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono">{lt.maxCarryoverDays || '—'}</td>
                  {isAdmin && (
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingLeaveType({ ...lt })}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded font-medium text-[11px] transition-colors"
                        title="Edit Leave Policy"
                      >
                        <Pencil className="w-3 h-3 text-amber-700" />
                        <span>Edit Policy</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: PUBLIC HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Add Public Holiday</h3>
              <form onSubmit={handleAddHoliday} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    required
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    placeholder="e.g. Ethiopian New Year (Enkutatash)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center justify-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Holiday</span>
                </button>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden`}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Scheduled Public Holidays ({holidays.length})
              </span>
            </div>
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Holiday</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Status</th>
                  {isAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">
                      <div>{h.name}</div>
                      {h.amharicName && h.amharicName !== h.name && (
                        <div className="text-[10px] text-slate-400 font-serif">{h.amharicName}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-700">{h.date}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Official Non-Working Day
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingHoliday({ ...h })}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded text-[11px] font-medium transition-colors"
                          title="Edit Holiday"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id, h.name)}
                          className="inline-flex items-center p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SHIFTS & WORKING HOURS */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSaveShifts} className="max-w-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              EthioRe Working Hours & Shift Rules
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift Start Time</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={shifts.workStartTime}
                  onChange={(e) => setShifts({ ...shifts, workStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift End Time</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={shifts.workEndTime}
                  onChange={(e) => setShifts({ ...shifts, workEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch Break Start</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={shifts.lunchStartTime || '12:30'}
                  onChange={(e) => setShifts({ ...shifts, lunchStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch Break End</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={shifts.lunchEndTime || '13:30'}
                  onChange={(e) => setShifts({ ...shifts, lunchEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={shifts.gracePeriodMinutes}
                  onChange={(e) => setShifts({ ...shifts, gracePeriodMinutes: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Arrivals after {shifts.workStartTime || '08:00'} + {shifts.gracePeriodMinutes}m marked as Late
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Half-Day Threshold (Hours)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={shifts.halfDayThresholdHours}
                  onChange={(e) => setShifts({ ...shifts, halfDayThresholdHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Overtime Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={shifts.overtimeStandardRate ?? 1.5}
                  onChange={(e) => setShifts({ ...shifts, overtimeStandardRate: parseFloat(e.target.value) || 1.5 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holiday Overtime Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={shifts.overtimeHolidayRate ?? 2.0}
                  onChange={(e) => setShifts({ ...shifts, overtimeHolidayRate: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center space-x-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Update Shift Rules</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 7: USER ROLES & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Create System User</h3>
              <p className="text-[11px] text-slate-500">
                Strict RBAC: Exactly three application roles exist: <strong>Administrator</strong>, <strong>HR Admin</strong>, and <strong>Employee</strong>.
              </p>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">User Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Almaz Kebede"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="almaz@ethiopianre.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Assignment</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="Administrator">Administrator (Full System, Configuration & RBAC)</option>
                    <option value="HR Admin">HR Admin (Master Data, Leave & Attendance Operations)</option>
                    <option value="Employee">Employee (Staff Self-Service Portal Only)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg flex items-center justify-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Register User Account</span>
                </button>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden`}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                System Accounts ({users.length})
              </span>
            </div>
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Current Role</th>
                  {isAdmin && <th className="p-3 text-right">Assign Role</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.displayName}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'Administrator'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'HR Admin'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u, e.target.value as UserRole)}
                          disabled={u.role === 'Administrator' && users.filter((x) => x.role === 'Administrator').length <= 1}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 outline-hidden focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="HR Admin">HR Admin</option>
                          <option value="Employee">Employee</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security & Operational Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Immutable chronological log of all administrative actions, employee modifications, leave records, and configuration changes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuditFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    auditFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Events ({auditLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('config')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    auditFilter === 'config'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Config Changes ({auditLogs.filter((l) => l.module === 'Configuration' || l.settingName).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('deletions')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    auditFilter === 'deletions'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Deletions ({auditLogs.filter((l) => l.action === 'DELETE').length})
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          <ReportPrintHeader
            title="System Audit Trail & Security Event Log"
            subtitle="Ethiopian Reinsurance S.C. HRMS administrative access and compliance register"
            filters={[
              {
                label: 'Event Category',
                value: auditFilter === 'all' ? 'All Events' : auditFilter === 'config' ? 'Configuration Changes' : 'Record Deletions',
              },
            ]}
            recordCount={
              auditLogs.filter((log) => {
                if (auditFilter === 'config') return log.module === 'Configuration' || Boolean(log.settingName);
                if (auditFilter === 'deletions') return log.action === 'DELETE';
                return true;
              }).length
            }
          />

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="divide-y divide-slate-100 text-xs">
            {(() => {
              const displayedLogs = auditLogs.filter((log) => {
                if (auditFilter === 'config') return log.module === 'Configuration' || Boolean(log.settingName);
                if (auditFilter === 'deletions') return log.action === 'DELETE';
                return true;
              });
              if (displayedLogs.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400">
                    No audit log entries recorded yet. System activities and administrative events will be logged here.
                  </div>
                );
              }
              return displayedLogs.map((log) => (
                <div key={log.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded border ${
                          log.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-900 border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                      {log.recordType && (
                        <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
                          {log.recordType} {log.recordId ? `#${log.recordId}` : ''}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                        {log.module}
                      </span>
                      <span className="text-slate-800 font-semibold">{log.details}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                    <span>Administrator / User:</span>
                    <strong className="text-slate-900">{log.performedBy}</strong>
                    {log.userId && <span className="font-mono text-[10px] text-slate-400">({log.userId})</span>}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.userRole === 'Administrator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.userRole}
                    </span>
                  </div>

                  {log.settingName && (
                    <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-2">
                      <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Configuration Setting Changed: {log.settingName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider block mb-0.5">
                            Previous Value
                          </span>
                          <div className="font-mono text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded break-all shadow-2xs">
                            {log.previousValue || '—'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider block mb-0.5">
                            New Value
                          </span>
                          <div className="font-mono text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded font-bold break-all shadow-2xs">
                            {log.newValue || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ));
            })()}
            </div>
          </div>

          <ReportPrintFooter />
        </div>
      )}

      {/* MODAL 1: EDIT DEPARTMENT */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Department</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateDept} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  value={editingDept.headOfDepartment}
                  onChange={(e) => setEditingDept({ ...editingDept, headOfDepartment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT POSITION */}
      {editingPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Position / Job Title</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPos(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdatePosition} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={editingPos.title}
                  onChange={(e) => setEditingPos({ ...editingPos, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editingPos.department}
                  onChange={(e) => setEditingPos({ ...editingPos, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPos(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Position</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT LEAVE POLICY */}
      {editingLeaveType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Leave Policy: {editingLeaveType.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLeaveType(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateLeaveType} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy / Leave Type Name</label>
                <input
                  type="text"
                  required
                  value={editingLeaveType.name}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Entitlement (Working Days)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingLeaveType.defaultDays}
                  onChange={(e) =>
                    setEditingLeaveType({
                      ...editingLeaveType,
                      defaultDays: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={editingLeaveType.isPaid}
                    onChange={(e) => setEditingLeaveType({ ...editingLeaveType, isPaid: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Paid Leave</span>
                </label>
                <label className="flex items-center space-x-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={editingLeaveType.carryForward}
                    onChange={(e) =>
                      setEditingLeaveType({ ...editingLeaveType, carryForward: e.target.checked })
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Carry Forward</span>
                </label>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy Description / Statutory Basis</label>
                <textarea
                  rows={2}
                  value={editingLeaveType.description || ''}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, description: e.target.value })}
                  placeholder="Ethiopian Labor Proclamation No. 1156/2019 reference..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLeaveType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Leave Policy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT PUBLIC HOLIDAY */}
      {editingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Edit Public Holiday</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingHoliday(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateHoliday} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={editingHoliday.name}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amharic / Local Name</label>
                <input
                  type="text"
                  value={editingHoliday.amharicName}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, amharicName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-serif focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Calendar Date</label>
                <input
                  type="date"
                  required
                  value={editingHoliday.date}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHoliday(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Holiday</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 9: CLOUD & DATABASE (FIREBASE) */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Project & Connection Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">Google Cloud Firebase Backend</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centralized cloud infrastructure providing persistent Firestore storage, Firebase Authentication, and security rules.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-amber-600' : ''}`} />
                  <span>{testingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleSyncToCloud}
                    disabled={syncingCloud}
                    className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg text-xs flex items-center space-x-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <Database className={`w-3.5 h-3.5 text-amber-400 ${syncingCloud ? 'animate-pulse' : ''}`} />
                    <span>{syncingCloud ? 'Synchronizing...' : 'Sync Master Data to Cloud'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Connection Test Result */}
            {connectionResult && (
              <div
                className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                  connectionResult.connected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {connectionResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-semibold">{connectionResult.message}</span>
                  {connectionResult.latencyMs > 0 && (
                    <span className="ml-2 font-mono text-[11px] opacity-75">
                      ({connectionResult.latencyMs} ms)
                    </span>
                  )}
                </div>
              </div>
            )}

            {syncResult && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncResult}</span>
              </div>
            )}

            {/* Configuration Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Project ID</span>
                <p className="font-mono font-bold text-slate-800 text-sm">hrms-d9d43</p>
                <span className="text-[10px] text-slate-400">Google Cloud Platform</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Auth Domain</span>
                <p className="font-mono font-bold text-slate-800 truncate text-xs">
                  hrms-d9d43.firebaseapp.com
                </p>
                <span className="text-[10px] text-slate-400">Corporate Single Sign-On</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Storage Bucket</span>
                <p className="font-mono font-bold text-slate-800 truncate text-xs">
                  hrms-d9d43.firebasestorage.app
                </p>
                <span className="text-[10px] text-slate-400">Document & Asset Storage</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Security Rules</span>
                <p className="font-bold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enforced (RBAC)</span>
                </p>
                <span className="text-[10px] text-slate-400">Admin & HR & Employee Roles</span>
              </div>
            </div>
          </div>

          {/* Cloud Collections & Sync Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Architecture Overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Server className="w-4 h-4 text-[#186382]" />
                <span>Synchronized Firestore Collections</span>
              </h3>
              <p className="text-slate-600">
                Data is stored in Cloud Firestore and mirrored locally for maximum responsiveness and high-availability:
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-2.5 bg-slate-50 flex items-center justify-between font-semibold text-slate-700">
                  <span>Collection Name</span>
                  <span>Scope / Access</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-mono font-medium text-slate-800">employees</span>
                  <span className="text-slate-600">Master Data (Admin & HR)</span>
                </div>
                <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                  <span className="font-mono font-medium text-slate-800">leaves</span>
                  <span className="text-slate-600">Leave Records & Deductions</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-mono font-medium text-slate-800">departments</span>
                  <span className="text-slate-600">Organizational Structure</span>
                </div>
                <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                  <span className="font-mono font-medium text-slate-800">positions</span>
                  <span className="text-slate-600">Job Titles & Departments</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="font-mono font-medium text-slate-800">users</span>
                  <span className="text-slate-600">Authentication Profiles</span>
                </div>
                <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                  <span className="font-mono font-medium text-slate-800">employeeAccountLinks</span>
                  <span className="text-slate-600">Master Data Account Linking</span>
                </div>
              </div>
            </div>

            {/* Email Domain Policy & Access Control */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Employee Authentication Policy</span>
              </h3>
              <p className="text-slate-600">
                Strict corporate registration policies configured for Ethiopian Reinsurance staff:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <div className="font-semibold text-amber-900 mb-1">Allowed Corporate Domain</div>
                  <code className="text-xs text-amber-800 font-mono bg-white px-2 py-0.5 rounded border border-amber-200">
                    @ethiopianre.com
                  </code>
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Standard employees must use official Ethiopian Reinsurance emails.
                  </p>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                  <div className="font-semibold text-blue-900 mb-1">Authorized External Exceptions (2)</div>
                  <ul className="space-y-1 font-mono text-[11px] text-blue-800">
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>contactesfaye@gmail.com</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>tesfayeteklufeyissa@gmail.com</span>
                    </li>
                  </ul>
                  <p className="text-[11px] text-blue-800/80 mt-1.5">
                    Case-insensitive authorized bypasses linked to Master Data records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        recordType={deleteTarget?.recordType}
        recordName={deleteTarget?.name}
        recordId={deleteTarget?.id}
        details={deleteTarget?.details}
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
};
