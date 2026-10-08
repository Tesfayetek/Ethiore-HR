import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import {
  CalendarDays,
  X,
  AlertCircle,
  Clock,
  Save,
} from 'lucide-react';
import { LeaveRecord, LeaveStatus } from '../../types';
import { storageService } from '../../services/storage';

interface EditLeaveModalProps {
  leave: LeaveRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditLeaveModal: React.FC<EditLeaveModalProps> = ({
  leave,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const leaveTypes = storageService.getLeaveTypes();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>(leave?.leaveType || '');
  const [startDate, setStartDate] = useState<string>(leave?.startDate || '');
  const [endDate, setEndDate] = useState<string>(leave?.endDate || '');
  const [status, setStatus] = useState<LeaveStatus>(leave?.status || 'Recorded');
  const [reason, setReason] = useState<string>(leave?.reason || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (leave) {
      setSelectedLeaveType(leave.leaveType);
      setStartDate(leave.startDate);
      setEndDate(leave.endDate);
      setStatus(leave.status);
      setReason(leave.reason);
      setError(null);
    }
  }, [leave]);

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

  if (!isOpen || !leave) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }

    if (calculatedDays <= 0) {
      setError('Selected dates do not contain any working days.');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = storageService.getCurrentUser();
      const result = storageService.editLeaveRecord(
        leave.id,
        {
          leaveType: selectedLeaveType,
          startDate,
          endDate,
          days: calculatedDays,
          reason: reason.trim(),
          status,
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
      setError(err?.message || 'Failed to update leave record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Edit Leave Record</span>
              <span className="text-xs font-mono font-normal text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                {leave.id}
              </span>
            </h3>
            <p className="text-xs text-amber-200/80">
              {leave.employeeName} ({leave.employeeId} - {leave.department})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-[#227D9E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Leave Type</label>
            <select
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700">
            <span className="flex items-center space-x-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Calculated Working Days:</span>
            </span>
            <span className="font-mono font-bold text-slate-900">{calculatedDays} day(s)</span>
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Record Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeaveStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium"
            >
              <option value="Recorded">Recorded</option>
              <option value="Active">Active (Ongoing)</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled (Reverses balance)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Reason / Notes</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="px-5 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow-xs active:scale-[0.99]"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Saving...' : 'Update Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
