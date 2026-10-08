import React from 'react';
import {
  CalendarDays,
  X,
  Printer,
  User,
  Building,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { LeaveRecord } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';

interface ViewLeaveModalProps {
  leave: LeaveRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (leave: LeaveRecord) => void;
}

export const ViewLeaveModal: React.FC<ViewLeaveModalProps> = ({
  leave,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !leave) return null;

  const employees = storageService.getEmployees();
  const emp = employees.find((e) => e.employeeId === leave.employeeId);
  const employeeBalances = storageService.getEmployeeLeaveBalances(leave.employeeId);
  const matchedBalance = employeeBalances.find((b) => b.leaveType === leave.leaveType);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Leave Record Voucher
                </h3>
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  {leave.id}
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Ethiopian Reinsurance S.C. HR Management System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#227D9E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Record Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                leave.status === 'Recorded'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : leave.status === 'Active'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : leave.status === 'Completed'
                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {leave.status}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Validated & Registered</span>
          </div>
        </div>

        {/* Voucher Content: 12 Specifications Fields */}
        <div className="p-6 space-y-5 text-xs text-slate-800">
          <ReportPrintHeader
            title="Leave Record Voucher & Statutory Slip"
            subtitle={`Record ID: ${leave.id} • Employee: ${leave.employeeName} (${leave.employeeId})`}
            filters={[
              { label: 'Leave Type', value: leave.leaveType },
              { label: 'Duration', value: `${leave.days} day(s)` },
              { label: 'Status', value: leave.status },
              { label: 'Start Date', value: leave.startDate },
              { label: 'End Date', value: leave.endDate },
              { label: 'Department', value: leave.department },
            ]}
          />

          {/* Employee Header */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center space-x-4">
            {emp?.photo ? (
              <img
                src={emp.photo}
                alt={leave.employeeName}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#186382] text-amber-300 font-bold text-base flex items-center justify-center border-2 border-amber-400 shadow-xs shrink-0">
                {leave.employeeName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="grow">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900">
                  {leave.employeeName}
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                  {leave.employeeId}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                <span>{leave.department || emp?.department}</span> •{' '}
                <span>{emp?.position || 'Staff'}</span>
              </div>
            </div>
          </div>

          {/* Grid of Key 12 Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Leave ID</span>
              <span className="font-mono font-bold text-amber-900 text-sm">{leave.id}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Employee ID</span>
              <span className="font-mono font-bold text-slate-900">{leave.employeeId}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-900">{leave.department}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Leave Type</span>
              <span className="font-bold text-amber-700">{leave.leaveType}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Number of Days</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {leave.days} working day(s)
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
              <span className="font-bold text-emerald-700">{leave.status}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Start Date</span>
              <span className="font-mono font-semibold text-slate-800">{leave.startDate}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">End Date</span>
              <span className="font-mono font-semibold text-slate-800">{leave.endDate}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Created Date</span>
              <span className="font-mono text-slate-600">{leave.createdDate || leave.appliedDate}</span>
            </div>

            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 flex justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Created By</span>
                <span className="font-medium text-slate-800">{leave.createdBy || 'HR Admin'}</span>
              </div>
              {matchedBalance && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Current Remaining Balance
                  </span>
                  <span className="font-mono font-bold text-amber-700">
                    {matchedBalance.remaining} of {matchedBalance.entitled} days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reason Section */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Reason / Justification
            </span>
            <p className="text-slate-700 leading-relaxed italic bg-slate-50/70 p-2.5 rounded border border-slate-100">
              "{leave.reason}"
            </p>
          </div>

          <ReportPrintFooter />
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-[#186382]" />
            <span>Print</span>
          </button>

          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(leave);
                }}
                className="px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-[0.99]"
              >
                Edit Record
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
