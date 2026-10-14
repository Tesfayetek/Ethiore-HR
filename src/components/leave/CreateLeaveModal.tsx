import React, { useState, useMemo, FormEvent } from 'react';
import {
  CalendarDays,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Employee, LeaveType, LeaveBalance } from '../../types';
import { storageService } from '../../services/storage';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface CreateLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLeaveModal: React.FC<CreateLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const employees = storageService.getEmployees();
  // STRICT RULE: Inactive employees must not be selectable for new operational records
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 'Active'),
    [employees]
  );
  const leaveTypes = storageService.getLeaveTypes();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>(
    leaveTypes[0]?.name || 'Annual Leave'
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected employee details
  const selectedEmployee = useMemo(
    () => activeEmployees.find((e) => e.employeeId === selectedEmployeeId),
    [activeEmployees, selectedEmployeeId]
  );

  // Employee's balances
  const employeeBalances = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return storageService.getEmployeeLeaveBalances(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const currentBalance = useMemo(() => {
    return employeeBalances.find((b) => b.leaveType === selectedLeaveType);
  }, [employeeBalances, selectedLeaveType]);

  // Calculate working days (excluding Saturday & Sunday)
  const calculateWorkingDays = (start: string, end: string): number => {
    if (!start || !end || start > end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const calculatedDays = useMemo(
    () => calculateWorkingDays(startDate, endDate),
    [startDate, endDate]
  );

  const isOverBalance =
    currentBalance !== undefined && calculatedDays > currentBalance.remaining;

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmployeeId) {
      setError('Please select an active employee.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please specify valid start and end dates.');
      return;
    }

    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    if (calculatedDays <= 0) {
      setError('The selected dates do not include any working days (Monday - Friday).');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the leave record.');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = storageService.getCurrentUser();
      const result = storageService.createLeaveRecord(
        {
          employeeId: selectedEmployeeId,
          leaveType: selectedLeaveType,
          startDate,
          endDate,
          days: calculatedDays,
          reason: reason.trim(),
        },
        currentUser
      );

      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while saving the leave record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Create Leave Record
              </h3>
              <p className="text-xs text-amber-200/80">
                Direct entry with automated balance deduction (No Approval required)
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

        {/* Workflow Info Callout */}
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center space-x-2 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>HR Policy:</strong> System automatically validates balance, saves record, updates balances, and schedules on company calendar immediately.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Employee Selection: ACTIVE ONLY */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Select Active Employee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium text-slate-800"
            >
              <option value="">-- Choose Employee (Active Staff Only) --</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.employeeId}>
                  {e.employeeId} - {e.fullName} ({e.department} - {e.position})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Inactive employees are automatically excluded from leave creation.
            </p>
          </div>

          {/* Selected Employee Summary Card */}
          {selectedEmployee && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-3">
              <FacelessAvatar
                src={selectedEmployee.photo}
                alt={selectedEmployee.fullName}
                size="md"
                className="border border-slate-300"
              />
              <div className="grow">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">
                    {selectedEmployee.fullName}
                  </span>
                  <span className="font-mono text-[11px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                    {selectedEmployee.employeeId}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {selectedEmployee.department} • {selectedEmployee.position}
                </div>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium"
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.name}>
                    {lt.name} (Default: {lt.defaultDays} d)
                  </option>
                ))}
              </select>
            </div>

            {/* Current Balance Indicator */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Entitlement & Balance
              </label>
              <div
                className={`px-3 py-2 rounded-lg border flex items-center justify-between ${
                  isOverBalance
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="font-medium text-[11px]">Remaining:</span>
                <span className="font-bold font-mono text-sm">
                  {currentBalance ? currentBalance.remaining : '--'} days
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
              />
            </div>
          </div>

          {/* Days calculation breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-600">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Working Days (Mon - Fri):</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {calculatedDays} working day(s)
              </span>
              {currentBalance && (
                <span className="text-[11px] text-slate-500">
                  (New balance will be: {currentBalance.remaining - calculatedDays} d)
                </span>
              )}
            </div>
          </div>

          {isOverBalance && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Warning: Requested duration ({calculatedDays} days) exceeds available balance ({currentBalance?.remaining} days).
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Operational reason, medical certificate reference, personal leave justification..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden text-xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="px-5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.99]"
            >
              {isSubmitting ? 'Validating & Saving...' : 'Save Leave Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
