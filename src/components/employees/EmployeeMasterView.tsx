import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  Filter,
  Eye,
  Edit2,
  Power,
  Trash2,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Employee, UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { EmployeeModal } from './EmployeeModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { ImportEmployeesModal } from './ImportEmployeesModal';
import { FacelessAvatar } from '../common/FacelessAvatar';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface EmployeeMasterViewProps {
  userRole: UserRole;
  isAddModalOpenInitially?: boolean;
  onCloseAddModal?: () => void;
}

export const EmployeeMasterView = ({
  userRole,
  isAddModalOpenInitially = false,
  onCloseAddModal,
}: EmployeeMasterViewProps) => {
  const [employees, setEmployees] = useState<Employee[]>(() => storageService.getEmployees());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(isAddModalOpenInitially);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const departments = storageService.getDepartments();

  const refreshData = () => {
    setEmployees(storageService.getEmployees());
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phoneNumber.includes(searchQuery);

      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;
      const matchesType = selectedType === 'All' || emp.employmentType === selectedType;

      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus, selectedType]);

  const handleToggleStatus = (emp: Employee) => {
    const currentUser = storageService.getCurrentUser();
    const action = emp.status === 'Active' ? 'Deactivate' : 'Activate';
    if (
      confirm(
        `Are you sure you want to ${action} ${emp.fullName} (${emp.employeeId})?\n${
          action === 'Deactivate'
            ? 'Inactive employees will NOT be selectable for new leave or attendance records.'
            : 'Employee will regain operational eligibility.'
        }`
      )
    ) {
      const res = storageService.toggleEmployeeStatus(emp.employeeId, currentUser);
      if (res.success) {
        setAlertMessage({ type: 'success', text: res.message });
        refreshData();
      } else {
        setAlertMessage({ type: 'error', text: res.message });
      }
    }
  };

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    const currentUser = storageService.getCurrentUser();
    const res = storageService.deleteEmployee(deleteTarget.employeeId, currentUser);
    if (res.success) {
      setAlertMessage({ type: 'success', text: res.message || 'Record deleted successfully.' });
      refreshData();
      setDeleteTarget(null);
    } else {
      setAlertMessage({ type: 'error', text: res.message || 'Unable to delete the record. Please try again.' });
      setDeleteTarget(null);
    }
    setIsDeleting(false);
  };

  // Role boundary enforcement
  if (userRole === 'Employee') {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Denied: Employee Master Data</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Employee accounts are restricted to personal self-service records only. Access to company-wide employee directories and confidential records requires HR Admin or Administrator authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner if present */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between text-xs transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{alertMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header bar: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Master Data</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {employees.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Shared central repository for Ethiopian Reinsurance S.C. workforce. Utilized across Leave Management & Attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#186382]" />
            <span>Print</span>
          </button>

          {(userRole === 'Administrator' || userRole === 'HR Admin') && (
            <>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#186382]" />
                <span>Import Employees</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmployeeToEdit(null);
                  setIsAddEditOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Employee</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, position..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium"
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium"
            >
              <option value="All">All Statuses (Active & Inactive)</option>
              <option value="Active">Active Staff Only</option>
              <option value="Inactive">Inactive Staff Only</option>
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              <option value="All">All Employment Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Probation">Probation</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Reset */}
        {(searchQuery || selectedDept !== 'All' || selectedStatus !== 'All' || selectedType !== 'All') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong>{filteredEmployees.length}</strong> of {employees.length} employees
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('All');
                setSelectedStatus('All');
                setSelectedType('All');
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <ReportPrintHeader
        title="Employee Master Directory Report"
        subtitle="Official staffing roster for Ethiopian Reinsurance S.C."
        filters={[
          ...(selectedDept !== 'All' ? [{ label: 'Department', value: selectedDept }] : []),
          ...(selectedStatus !== 'All' ? [{ label: 'Status', value: selectedStatus }] : []),
          ...(selectedType !== 'All' ? [{ label: 'Employment Type', value: selectedType }] : []),
          ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
        ]}
        recordCount={filteredEmployees.length}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Position</th>
                <th className="py-3 px-4">Type & Location</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Leave Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    {employees.length === 0 ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No employee records found.</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          The employee master directory is currently empty. Add your first employee or import records via CSV.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeToEdit(null);
                            setIsAddEditOpen(true);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Employee</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-400">No employees matching your criteria.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <FacelessAvatar
                          src={emp.photo}
                          alt={emp.fullName}
                          size="md"
                          className="border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{emp.fullName}</div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-amber-700 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {emp.employeeId}
                            </span>
                            <span className="text-slate-400">• {emp.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.position}</div>
                      <div className="text-slate-500 text-[11px] flex items-center mt-0.5">
                        <Building2 className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{emp.department}</span>
                      </div>
                    </td>

                    {/* Type & Location */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {emp.employmentType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[170px]" title={emp.workLocation}>
                        {emp.workLocation}
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-sans">{emp.emailAddress}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phoneNumber}</span>
                      </div>
                    </td>

                    {/* Leave Balance */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-[11px] inline-block shadow-2xs">
                        {typeof emp.leaveBalance === 'number' ? `${emp.leaveBalance} d` : '16 d'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right no-print">
                      <div className="flex items-center justify-end space-x-1">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => setEmployeeToView(emp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="View Employee Profile, Leaves & Attendance"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeeToEdit(emp);
                            setIsAddEditOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Activate / Deactivate Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-1.5 rounded transition-colors ${
                            emp.status === 'Active'
                              ? 'text-emerald-600 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {/* Delete (Admin only, with strict rule enforcement) */}
                        {userRole === 'Administrator' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete (prohibited if records exist)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportPrintFooter />

      {/* Add / Edit Modal */}
      <EmployeeModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEmployeeToEdit(null);
          onCloseAddModal?.();
        }}
        onSaved={refreshData}
        employeeToEdit={employeeToEdit}
      />

      {/* Detail Modal with Leave and Attendance History */}
      <EmployeeDetailModal
        isOpen={!!employeeToView}
        employee={employeeToView}
        onClose={() => setEmployeeToView(null)}
        onEdit={(emp) => {
          setEmployeeToEdit(emp);
          setIsAddEditOpen(true);
        }}
      />

      {/* Excel / CSV Import Modal */}
      <ImportEmployeesModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={refreshData}
        userRole={userRole}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        recordType="Employee"
        recordName={deleteTarget?.fullName}
        recordId={deleteTarget?.employeeId}
        details={
          deleteTarget ? (
            <div className="space-y-1">
              <div>
                <strong>Department:</strong> {deleteTarget.department} • <strong>Position:</strong> {deleteTarget.position}
              </div>
              <div className="text-amber-800 text-[10px]">
                * Permanent deletion will be verified against historical records. Deletion is prohibited if leave, attendance, or subordinates are linked. Use &quot;Deactivate&quot; to change operational status.
              </div>
            </div>
          ) : undefined
        }
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
};
