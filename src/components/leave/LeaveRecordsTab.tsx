import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  Printer,
  CalendarDays,
  CheckCircle2,
  User,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { LeaveRecord, LeaveStatus } from '../../types';
import { storageService } from '../../services/storage';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface LeaveRecordsTabProps {
  leaveRecords: LeaveRecord[];
  onViewRecord: (record: LeaveRecord) => void;
  onEditRecord: (record: LeaveRecord) => void;
  onOpenCreateModal: () => void;
  onRefreshData: () => void;
}

export const LeaveRecordsTab: React.FC<LeaveRecordsTabProps> = ({
  leaveRecords,
  onViewRecord,
  onEditRecord,
  onOpenCreateModal,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deleteTarget, setDeleteTarget] = useState<LeaveRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const departments = storageService.getDepartments();
  const leaveTypes = storageService.getLeaveTypes();
  const employees = storageService.getEmployees();

  // Filtered Leave Records
  const filteredRecords = useMemo(() => {
    return leaveRecords.filter((rec) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        rec.id.toLowerCase().includes(q) ||
        rec.employeeId.toLowerCase().includes(q) ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q) ||
        rec.reason.toLowerCase().includes(q) ||
        rec.createdBy.toLowerCase().includes(q);

      const matchesDepartment =
        departmentFilter === 'All' || rec.department === departmentFilter;

      const matchesType = typeFilter === 'All' || rec.leaveType === typeFilter;

      const matchesStatus =
        statusFilter === 'All' || rec.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesType && matchesStatus;
    });
  }, [leaveRecords, searchQuery, departmentFilter, typeFilter, statusFilter]);

  // Handle Delete Record
  const handleDeleteConfirm = () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const currentUser = storageService.getCurrentUser();
      const result = storageService.deleteLeaveRecord(deleteTarget.id, currentUser);
      if (result.success) {
        onRefreshData();
        setFeedbackMessage({ type: 'success', text: result.message || 'Record deleted successfully.' });
        setDeleteTarget(null);
      } else {
        setFeedbackMessage({ type: 'error', text: result.message || 'Unable to delete the record. Please try again.' });
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Unable to delete the record. Please try again.' });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV of Leave Records
  const handleExportCSV = () => {
    const header =
      'Leave ID,Employee ID,Employee Name,Department,Leave Type,Start Date,End Date,Number of Days,Reason,Status,Created By,Created Date\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.id}","${r.employeeId}","${r.employeeName}","${r.department}","${r.leaveType}","${r.startDate}","${r.endDate}",${r.days},"${r.reason.replace(/"/g, '""')}","${r.status}","${r.createdBy}","${r.createdDate}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_leave_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner if present */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Header & Workflow Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Leave Records Master Registry</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              {filteredRecords.length} records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full operational registry with live validation and automatic entitlement synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Leave Record</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, dept, reason..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Leave Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
          >
            <option value="All">All Leave Types</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Recorded">Recorded</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 5.1 Leave Records Display Table with all 12 requested fields */}
      <ReportPrintHeader
        title="Staff Leave Records & On-Leave Operational Register"
        subtitle="Active leave applications, on-leave employees, and statutory tracking"
        filters={[
          ...(departmentFilter !== 'All' ? [{ label: 'Department', value: departmentFilter }] : []),
          ...(typeFilter !== 'All' ? [{ label: 'Leave Type', value: typeFilter }] : []),
          ...(statusFilter !== 'All' ? [{ label: 'Status', value: statusFilter }] : []),
          ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
        ]}
        recordCount={filteredRecords.length}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Leave ID</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Employee ID</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Employee Name</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Department</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Leave Type</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Start Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">End Date</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Days</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Reason</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Created By</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Created Date</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="font-medium text-slate-600">
                      {leaveRecords.length === 0 ? 'No records available.' : 'No leave records match your search or filters.'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const emp = employees.find((e) => e.employeeId === rec.employeeId);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Leave ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-900 whitespace-nowrap">
                        {rec.id}
                      </td>

                      {/* Employee ID */}
                      <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap font-medium">
                        {rec.employeeId}
                      </td>

                      {/* Employee Name */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <FacelessAvatar
                            src={emp?.photo}
                            alt={rec.employeeName}
                            size="xs"
                            className="border border-slate-200"
                          />
                          <span className="font-bold text-slate-900">{rec.employeeName}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {rec.department}
                      </td>

                      {/* Leave Type */}
                      <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {rec.leaveType}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {rec.startDate}
                      </td>

                      {/* End Date */}
                      <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {rec.endDate}
                      </td>

                      {/* Number of Days */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {rec.days}
                        </span>
                      </td>

                      {/* Reason */}
                      <td
                        className="py-3 px-3.5 text-slate-600 max-w-[160px] truncate"
                        title={rec.reason}
                      >
                        {rec.reason}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rec.status === 'Recorded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec.status === 'Active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : rec.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      {/* Created By */}
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        {rec.createdBy || 'HR Admin'}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {rec.createdDate || rec.appliedDate}
                      </td>

                      {/* Functions: View, Edit, Delete */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap no-print">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => onViewRecord(rec)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded transition-colors"
                            title="View Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditRecord(rec)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(rec)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        recordType="Leave Record"
        recordName={deleteTarget ? `${deleteTarget.employeeName} (${deleteTarget.leaveType})` : undefined}
        recordId={deleteTarget?.id}
        details={
          deleteTarget ? (
            <div className="space-y-1">
              <div>
                <strong>Dates:</strong> {deleteTarget.startDate} to {deleteTarget.endDate} ({deleteTarget.days} working day{deleteTarget.days === 1 ? '' : 's'})
              </div>
              <div className="text-amber-800 text-[10px]">
                <strong>Automatic Balance Restoration:</strong> The {deleteTarget.days} day{deleteTarget.days === 1 ? '' : 's'} will be automatically credited back to {deleteTarget.employeeName}&apos;s {deleteTarget.leaveType} balance.
              </div>
            </div>
          ) : undefined
        }
        isProcessing={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
};
