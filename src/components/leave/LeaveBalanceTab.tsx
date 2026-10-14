import React, { useState, useMemo, FormEvent } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { LeaveBalance } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface LeaveBalanceTabProps {
  leaveBalances: LeaveBalance[];
  onRefreshData: () => void;
}

export const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({
  leaveBalances,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [adjustTarget, setAdjustTarget] = useState<LeaveBalance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  const employees = storageService.getEmployees();
  const leaveTypes = storageService.getLeaveTypes();
  const departments = storageService.getDepartments();

  // Filtered leave balances
  const filteredBalances = useMemo(() => {
    return leaveBalances.filter((bal) => {
      const emp = employees.find((e) => e.employeeId === bal.employeeId);
      const empName = bal.employeeName || emp?.fullName || '';
      const empDept = emp?.department || '';

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        bal.employeeId.toLowerCase().includes(q) ||
        empName.toLowerCase().includes(q) ||
        bal.leaveType.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || bal.leaveType === typeFilter;
      const matchesDept =
        departmentFilter === 'All' || empDept === departmentFilter;

      return matchesSearch && matchesType && matchesDept;
    });
  }, [leaveBalances, searchQuery, typeFilter, departmentFilter, employees]);

  // Overall calculations
  const totalEntitled = useMemo(
    () => filteredBalances.reduce((acc, b) => acc + b.entitled, 0),
    [filteredBalances]
  );
  const totalUsed = useMemo(
    () => filteredBalances.reduce((acc, b) => acc + b.taken, 0),
    [filteredBalances]
  );
  const totalRemaining = useMemo(
    () => filteredBalances.reduce((acc, b) => acc + b.remaining, 0),
    [filteredBalances]
  );

  const handleAdjustSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    setIsAdjusting(true);
    try {
      const currentUser = storageService.getCurrentUser();
      const res = storageService.adjustLeaveBalance(
        adjustTarget.employeeId,
        adjustTarget.leaveType,
        adjustAmount,
        adjustReason.trim() || 'HR Administrative Adjustment',
        currentUser
      );
      if (res.success) {
        onRefreshData();
        setAdjustTarget(null);
        setAdjustAmount(1);
        setAdjustReason('');
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to adjust leave balance.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleExportCSV = () => {
    const header =
      'Employee ID,Employee Name,Department,Leave Type,Entitled Days,Used Days,Remaining Days\n';
    const rows = filteredBalances
      .map((b) => {
        const emp = employees.find((e) => e.employeeId === b.employeeId);
        const name = b.employeeName || emp?.fullName || b.employeeId;
        const dept = emp?.department || 'N/A';
        return `"${b.employeeId}","${name}","${dept}","${b.leaveType}",${b.entitled},${b.taken},${b.remaining}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_leave_balances_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Entitled Days
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalEntitled}
            </span>
            <span className="text-xs text-slate-500">Days Allocated</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Used Days
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {totalUsed}
            </span>
            <span className="text-xs text-slate-500">
              ({totalEntitled > 0 ? ((totalUsed / totalEntitled) * 100).toFixed(1) : 0}% consumed)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Remaining Days
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {totalRemaining}
            </span>
            <span className="text-xs text-slate-500">Days Available</span>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>5.2 Leave Balance Entitlements</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
              {filteredBalances.length} balance records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Governed by the Ethiopian Labor Proclamation (16 working days minimum + seniority service increments).
          </p>
        </div>

        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee ID or name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            <option value="All">All Leave Types</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.name}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5.2 Leave Balance Table: Exactly the 6 requested fields + action */}
      <ReportPrintHeader
        title="Staff Leave Balances & Entitlements Report"
        subtitle="Workforce leave balances governed by Ethiopian Labor Proclamation No. 1156/2019"
        filters={[
          ...(departmentFilter !== 'All' ? [{ label: 'Department', value: departmentFilter }] : []),
          ...(typeFilter !== 'All' ? [{ label: 'Leave Type', value: typeFilter }] : []),
          ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
        ]}
        recordCount={filteredBalances.length}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4 text-center">Entitled Days</th>
                <th className="py-3 px-4 text-center">Used Days</th>
                <th className="py-3 px-4 text-center">Remaining Days</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <span className="font-medium text-slate-600">
                      {leaveBalances.length === 0 ? 'No records available.' : 'No balance records found matching your filters.'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredBalances.map((bal) => {
                  const emp = employees.find((e) => e.employeeId === bal.employeeId);
                  const name = bal.employeeName || emp?.fullName || bal.employeeId;

                  return (
                    <tr
                      key={bal.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Employee ID */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        {bal.employeeId}
                      </td>

                      {/* Employee Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FacelessAvatar
                            src={emp?.photo}
                            alt={name}
                            size="xs"
                            className="border border-slate-200"
                          />
                          <span className="font-bold text-slate-900">{name}</span>
                          {emp?.status === 'Inactive' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] border border-rose-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {bal.leaveType}
                      </td>

                      {/* Entitled Days */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {bal.entitled}
                      </td>

                      {/* Used Days */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {bal.taken}
                      </td>

                      {/* Remaining Days */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded text-xs inline-block min-w-8 ${
                            bal.remaining <= 3
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {bal.remaining}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right no-print">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustTarget(bal);
                            setAdjustAmount(1);
                            setAdjustReason('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                        >
                          Adjust Balance
                        </button>
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

      {/* Adjust Balance Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Adjust Leave Balance
                </h3>
                <p className="text-xs text-slate-400">
                  {adjustTarget.employeeId} - {adjustTarget.leaveType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Entitled</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{adjustTarget.entitled} d</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Used</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">{adjustTarget.taken} d</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Remaining</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{adjustTarget.remaining} d</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Adjustment in Days (+ to increase, - to reduce)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Projected remaining balance will be: <strong>{adjustTarget.remaining + adjustAmount} days</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Reason for Audit Trail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Ethiopian Labor Proclamation seniority increment"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting || adjustAmount === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAdjusting ? 'Saving...' : 'Save Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
