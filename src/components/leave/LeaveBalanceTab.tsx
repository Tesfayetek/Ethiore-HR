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
  Calculator,
  CalendarDays,
  Info,
  History,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { LeaveBalance, CarryForwardBreakdown } from '../../types';
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
  const [breakdownTarget, setBreakdownTarget] = useState<LeaveBalance | null>(null);
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  const employees = storageService.getEmployees();
  const leaveTypes = storageService.getLeaveTypes();
  const departments = storageService.getDepartments();
  const leavePolicy = storageService.getLeavePolicy();

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

  const handleRunPreset = (preset: 'exampleA' | 'exampleB' | 'exampleC') => {
    const targetEmpId = breakdownTarget?.employeeId || filteredBalances[0]?.employeeId || 'EMP001';
    const currentUser = storageService.getCurrentUser();
    const res = storageService.applyCarryForwardPreset(targetEmpId, preset, currentUser);
    if (res.success) {
      onRefreshData();
      setPresetFeedback(res.message);
      if (breakdownTarget) {
        const updated = storageService.getLeaveBalances().find(
          (b) => b.employeeId === targetEmpId && b.leaveType === 'Annual Leave'
        );
        if (updated) setBreakdownTarget(updated);
      }
      setTimeout(() => setPresetFeedback(null), 5000);
    }
  };

  const handleExportCSV = () => {
    const header =
      'Employee ID,Employee Name,Department,Leave Type,Current Leave Year,Current Year Entitlement,Prev Year Unused (N-1),Second Prev Unused (N-2),Total Eligible Carry Forward,Current Year Used,Total Available Days,Expired Older Days\n';
    const rows = filteredBalances
      .map((b) => {
        const emp = employees.find((e) => e.employeeId === b.employeeId);
        const name = b.employeeName || emp?.fullName || b.employeeId;
        const dept = emp?.department || 'N/A';
        const bd = b.carryForwardBreakdown;
        return `"${b.employeeId}","${name}","${dept}","${b.leaveType}",${bd?.currentLeaveYear ?? b.currentLeaveYear ?? 2026},${bd?.currentYearEntitlement ?? b.currentYearEntitlement ?? b.entitled},${bd?.previousYearUnused ?? b.previousYearUnused ?? 0},${bd?.secondPreviousYearUnused ?? b.secondPreviousYearUnused ?? 0},${bd?.totalEligibleCarryForward ?? b.totalEligibleCarryForward ?? 0},${bd?.currentYearUsed ?? b.currentYearUsed ?? b.taken},${bd?.availableAnnualLeave ?? b.availableAnnualLeave ?? b.remaining},${bd?.expiredOlderLeave ?? b.expiredOlderLeave ?? 0}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethiore_leave_balances_carryforward_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Annual Leave Carry-Forward Policy & Calculation Header Banner */}
      <div className="bg-gradient-to-r from-[#0E3D52] to-[#186382] text-white p-5 rounded-2xl shadow-md border border-[#CCA352]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CCA352] text-slate-950 uppercase tracking-wider">
                Official Leave Policy
              </span>
              <span className="text-xs text-amber-200 font-mono">
                Carry-Forward Rule: Max {leavePolicy.maxCarryForwardYears || 2} Years (Year {leavePolicy.currentLeaveYear - 1} &amp; {leavePolicy.currentLeaveYear - 2})
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-[#CCA352]" />
              <span>Annual Leave Carry-Forward Calculation Engine</span>
            </h2>
            <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
              <strong>Available Annual Leave</strong> = Current Year's Entitlement + Eligible Carry-Forward Leave (previous two years only) − Leave Used in Current Leave Year. Older unused balances beyond {leavePolicy.maxCarryForwardYears || 2} years are automatically excluded from carry-forward.
            </p>
          </div>

          {/* Quick Verified Testing Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 no-print shrink-0">
            <span className="text-[11px] font-semibold text-amber-300 block">
              Test Presets (EMP001):
            </span>
            <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-[#CCA352]/40 bg-slate-900/60 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleRunPreset('exampleA')}
                title="Example A: Entitlement: 18, Prev: 5, 2nd Prev: 3, Older: 4, Used: 2 => Available: 24 (Older 4 excluded)"
                className="px-2.5 py-1 text-white hover:bg-[#CCA352] hover:text-slate-950 font-bold rounded transition-colors"
              >
                Ex. A (24d)
              </button>
              <button
                type="button"
                onClick={() => handleRunPreset('exampleB')}
                title="Example B: Entitlement: 18, Prev: 0, 2nd Prev: 6, Used: 4 => Available: 20"
                className="px-2.5 py-1 text-white hover:bg-[#CCA352] hover:text-slate-950 font-bold rounded transition-colors"
              >
                Ex. B (20d)
              </button>
              <button
                type="button"
                onClick={() => handleRunPreset('exampleC')}
                title="Example C: Entitlement: 18, No carry-forward, Used: 3 => Available: 15"
                className="px-2.5 py-1 text-white hover:bg-[#CCA352] hover:text-slate-950 font-bold rounded transition-colors"
              >
                Ex. C (15d)
              </button>
            </div>
          </div>
        </div>

        {presetFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{presetFeedback}</span>
          </div>
        )}
      </div>

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
            Total Available / Remaining Days
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {totalRemaining}
            </span>
            <span className="text-xs text-slate-500">Available across all records</span>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>5.2 Leave Balance Entitlements &amp; Carry-Forward</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
              {filteredBalances.length} balance records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Governed by Ethiopian Labor Proclamation &amp; Ethiopian Reinsurance statutory 2-year carry-forward policy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
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

      <ReportPrintHeader
        title="Staff Leave Balances & Carry-Forward Report"
        subtitle="Workforce leave balances governed by Ethiopian Labor Proclamation & Ethio-Re 2-Year Carry-Forward Policy"
        filters={[
          ...(departmentFilter !== 'All' ? [{ label: 'Department', value: departmentFilter }] : []),
          ...(typeFilter !== 'All' ? [{ label: 'Leave Type', value: typeFilter }] : []),
          ...(searchQuery ? [{ label: 'Search Query', value: searchQuery }] : []),
        ]}
        recordCount={filteredBalances.length}
      />

      {/* 5.2 Leave Balance Table with Carry-Forward Columns */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4 text-center">Entitled Days</th>
                <th className="py-3 px-4 text-center">Eligible Carry-Fwd</th>
                <th className="py-3 px-4 text-center">Used Days</th>
                <th className="py-3 px-4 text-center">Available Balance</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <span className="font-medium text-slate-600">
                      {leaveBalances.length === 0 ? 'No records available.' : 'No balance records found matching your filters.'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredBalances.map((bal) => {
                  const emp = employees.find((e) => e.employeeId === bal.employeeId);
                  const name = bal.employeeName || emp?.fullName || bal.employeeId;
                  const isAnnual = bal.leaveType === 'Annual Leave';
                  const bd = bal.carryForwardBreakdown;

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
                            className="border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{name}</span>
                            <span className="text-[10px] text-slate-400">{emp?.department}</span>
                          </div>
                          {emp?.status === 'Inactive' && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] border border-rose-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <span>{bal.leaveType}</span>
                          {isAnnual && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#186382]/10 text-[#186382] border border-[#186382]/20">
                              2-Yr Carry-Fwd
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Entitled Days */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {isAnnual && bd ? bd.currentYearEntitlement : bal.entitled}
                      </td>

                      {/* Eligible Carry-Forward */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {isAnnual ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-emerald-700 font-bold">
                              +{bd ? bd.totalEligibleCarryForward : (bal.totalEligibleCarryForward ?? 0)}d
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({bd?.previousYearUnused ?? bal.previousYearUnused ?? 0} + {bd?.secondPreviousYearUnused ?? bal.secondPreviousYearUnused ?? 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Used Days */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {isAnnual && bd ? bd.currentYearUsed : bal.taken}
                      </td>

                      {/* Available / Remaining Days */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded text-xs inline-block min-w-8 ${
                            bal.remaining <= 3
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {bal.remaining} d
                        </span>
                        {isAnnual && (bd?.expiredOlderLeave ?? bal.expiredOlderLeave ?? 0) > 0 && (
                          <span className="block text-[10px] text-rose-600 font-mono mt-0.5" title="Expired older leave beyond 2 years excluded">
                            ({bd?.expiredOlderLeave ?? bal.expiredOlderLeave}d expired)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right no-print space-x-1 whitespace-nowrap">
                        {isAnnual && (
                          <button
                            type="button"
                            onClick={() => setBreakdownTarget(bal)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#186382] hover:bg-[#227D9E] text-white rounded transition-colors shadow-2xs cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Calculator className="w-3 h-3 text-[#CCA352]" />
                            <span>Calculation</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustTarget(bal);
                            setAdjustAmount(1);
                            setAdjustReason('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                        >
                          Adjust
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

      {/* Authoritative Carry-Forward Calculation Breakdown Modal */}
      {breakdownTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0E3D52] to-[#186382] text-white flex items-center justify-between border-b border-[#CCA352]/30">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CCA352] text-slate-950 uppercase tracking-wider">
                    Authoritative HR Breakdown
                  </span>
                  <span className="text-xs text-amber-200 font-mono">
                    Leave Year {breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-[#CCA352]" />
                  <span>Annual Leave Carry-Forward Calculation: {breakdownTarget.employeeName || breakdownTarget.employeeId}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownTarget(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-800">
              {/* Formula Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider block">
                  Ethio-Re Statutory Annual Leave Formula:
                </span>
                <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 font-bold space-y-1">
                  <div>Available Annual Leave = Current Year's Entitlement + Eligible Carry-Forward Leave − Leave Used</div>
                  <div className="text-[#186382] pt-1 border-t border-slate-100 flex items-center space-x-2">
                    <ArrowRight className="w-3.5 h-3.5 text-[#CCA352]" />
                    <span>
                      {breakdownTarget.carryForwardBreakdown?.availableAnnualLeave ?? breakdownTarget.remaining} Days = {breakdownTarget.carryForwardBreakdown?.currentYearEntitlement ?? breakdownTarget.entitled} (Current) + {breakdownTarget.carryForwardBreakdown?.totalEligibleCarryForward ?? 0} (Carry-Fwd: {breakdownTarget.carryForwardBreakdown?.previousYearUnused ?? 0} + {breakdownTarget.carryForwardBreakdown?.secondPreviousYearUnused ?? 0}) − {breakdownTarget.carryForwardBreakdown?.currentYearUsed ?? breakdownTarget.taken} (Used)
                    </span>
                  </div>
                </div>
              </div>

              {/* 8 Required Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Current Leave Year */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Current Leave Year</span>
                  <span className="font-mono font-extrabold text-base text-slate-900 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026}
                  </span>
                  <span className="text-[10px] text-slate-400">Statutory active period</span>
                </div>

                {/* 2. Current-Year Entitlement */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Current Entitlement</span>
                  <span className="font-mono font-extrabold text-base text-slate-900 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.currentYearEntitlement || breakdownTarget.entitled} d
                  </span>
                  <span className="text-[10px] text-slate-400">Statutory base + seniority</span>
                </div>

                {/* 3. Previous Year Unused (N-1) */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">3. Previous Year (N-1)</span>
                  <span className="font-mono font-extrabold text-base text-emerald-700 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.previousYearUnused ?? 0} d
                  </span>
                  <span className="text-[10px] text-slate-400">Year {(breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026) - 1} unused</span>
                </div>

                {/* 4. Second Previous Year (N-2) */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">4. 2nd Prev Year (N-2)</span>
                  <span className="font-mono font-extrabold text-base text-emerald-700 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.secondPreviousYearUnused ?? 0} d
                  </span>
                  <span className="text-[10px] text-slate-400">Year {(breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026) - 2} unused</span>
                </div>

                {/* 5. Total Eligible Carry-Forward Days */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">5. Eligible Carry-Fwd</span>
                  <span className="font-mono font-extrabold text-base text-emerald-800 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.totalEligibleCarryForward ?? 0} d
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">(N-1) + (N-2) eligible</span>
                </div>

                {/* 6. Leave Days Used */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">6. Current Year Used</span>
                  <span className="font-mono font-extrabold text-base text-amber-800 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.currentYearUsed ?? breakdownTarget.taken} d
                  </span>
                  <span className="text-[10px] text-amber-700">Deducted from balance</span>
                </div>

                {/* 7. Total Available Leave Days */}
                <div className="p-3 bg-[#0E3D52]/10 border border-[#186382]/30 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-[#0E3D52] block">7. Total Available</span>
                  <span className="font-mono font-extrabold text-lg text-[#0E3D52] block mt-0.5">
                    {breakdownTarget.carryForwardBreakdown?.availableAnnualLeave ?? breakdownTarget.remaining} d
                  </span>
                  <span className="text-[10px] text-[#186382] font-semibold">Net available to take</span>
                </div>

                {/* 8. Expired / Ineligible Older Leave Days */}
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">8. Expired Older Leave</span>
                  <span className="font-mono font-extrabold text-base text-rose-700 block mt-1">
                    {breakdownTarget.carryForwardBreakdown?.expiredOlderLeave ?? 0} d
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Excluded (&gt;2 yrs old)</span>
                </div>
              </div>

              {/* Transparency Notice */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Transparency Notice on Expired Balances:</strong> In accordance with Ethiopian Reinsurance HR Leave Regulations and Ethiopian Labor Proclamation, annual leave balances older than 2 previous leave years (Year {(breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026) - 3} and older) expire and cannot be carried forward into the current leave year. The system strictly records {breakdownTarget.carryForwardBreakdown?.expiredOlderLeave ?? 0} expired days for employee transparency without deleting historical audit transactions.
                </div>
              </div>

              {/* Historical Yearly Breakdown Table */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5 text-[#186382]" />
                  <span>Historical Leave Year Records &amp; Eligibility Audit</span>
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Leave Year</th>
                        <th className="py-2 px-3 text-center">Entitlement</th>
                        <th className="py-2 px-3 text-center">Used</th>
                        <th className="py-2 px-3 text-center">Unused Balance</th>
                        <th className="py-2 px-3">Carry-Forward Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {breakdownTarget.carryForwardBreakdown?.yearlyHistory?.map((y) => {
                        const isCurrent = y.year === (breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026);
                        const isEligible = y.year === (breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026) - 1 || y.year === (breakdownTarget.carryForwardBreakdown?.currentLeaveYear || 2026) - 2;

                        return (
                          <tr key={y.year} className={isCurrent ? 'bg-blue-50/50' : ''}>
                            <td className="py-2 px-3 font-bold text-slate-900">{y.year}</td>
                            <td className="py-2 px-3 text-center">{y.entitlement} d</td>
                            <td className="py-2 px-3 text-center text-amber-700 font-bold">{y.used} d</td>
                            <td className="py-2 px-3 text-center text-emerald-700 font-bold">{y.unused} d</td>
                            <td className="py-2 px-3 font-sans text-[11px]">
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                                  Current Leave Year
                                </span>
                              ) : isEligible ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  Eligible Carry-Forward (+{y.unused}d)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                  Expired / Excluded beyond 2 yrs
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 1-Click Verification Test Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Verify calculation scenarios:
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleRunPreset('exampleA')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ex. A (24d)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunPreset('exampleB')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ex. B (20d)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunPreset('exampleC')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ex. C (15d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownTarget(null)}
                    className="px-4 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
