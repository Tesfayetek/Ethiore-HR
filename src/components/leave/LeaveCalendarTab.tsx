import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Clock,
  CalendarDays,
  Sparkles,
  X,
  Eye,
  Printer,
} from 'lucide-react';
import { LeaveRecord } from '../../types';
import { storageService } from '../../services/storage';
import { ReportPrintHeader } from '../common/ReportPrintHeader';
import { ReportPrintFooter } from '../common/ReportPrintFooter';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface LeaveCalendarTabProps {
  leaveRecords: LeaveRecord[];
  onViewRecord?: (record: LeaveRecord) => void;
}

export const LeaveCalendarTab: React.FC<LeaveCalendarTabProps> = ({
  leaveRecords,
  onViewRecord,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    holiday?: string;
    records: LeaveRecord[];
  } | null>(null);

  const departments = storageService.getDepartments();
  const holidays = storageService.getHolidays();
  const employees = storageService.getEmployees();
  const currentUser = storageService.getCurrentUser();
  const isAdministrator = currentUser?.role === 'Administrator';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const pad = (n: number) => String(n).padStart(2, '0');

  // Filter leaves based on department
  const activeLeaves = useMemo(() => {
    return leaveRecords.filter((l) => {
      if (l.status === 'Cancelled') return false;
      if (departmentFilter !== 'All' && l.department !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [leaveRecords, departmentFilter]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              Company Leave Schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual calendar displaying scheduled employee absences and Ethiopian statutory public holidays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="w-48">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 border border-slate-300 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Administrator-Only Print Button */}
          {isAdministrator && (
            <button
              type="button"
              onClick={() =>
                storageService.triggerPrint({
                  reportType: 'Monthly Staff Leave Calendar',
                  customTitle: `Schedule for ${currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                })
              }
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Print leave calendar (Administrator Only)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      <ReportPrintHeader
        title="Monthly Staff Leave & Holiday Schedule Calendar"
        subtitle={`Scheduled staff absences and public holidays for ${currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`}
        filters={[
          { label: 'Schedule Month', value: currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }) },
          ...(departmentFilter !== 'All' ? [{ label: 'Department', value: departmentFilter }] : []),
        ]}
        recordCount={activeLeaves.length}
      />

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Day Name Header */}
        <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {/* Padding empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-28 bg-slate-50/40 p-2 text-slate-300 select-none"
            />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            // Ethiopian Holiday
            const holiday = holidays.find((h) => h.date === dateStr);

            // Leaves on this date
            const onLeave = activeLeaves.filter(
              (l) => l.startDate <= dateStr && l.endDate >= dateStr
            );

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (onLeave.length > 0 || holiday) {
                    setSelectedDayEvents({
                      dateStr,
                      holiday: holiday?.name,
                      records: onLeave,
                    });
                  }
                }}
                className={`min-h-28 p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                  isToday
                    ? 'bg-amber-50/40 ring-2 ring-amber-400/80 inset-ring'
                    : holiday
                    ? 'bg-purple-50/30 hover:bg-purple-50/60'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isToday
                          ? 'text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded'
                          : holiday
                          ? 'text-purple-700 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {onLeave.length > 0 && (
                      <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-full">
                        {onLeave.length} away
                      </span>
                    )}
                  </div>

                  {/* Holiday Tag */}
                  {holiday && (
                    <div className="mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 truncate">
                      ★ {holiday.name}
                    </div>
                  )}

                  {/* Leave Chips */}
                  <div className="space-y-1">
                    {onLeave.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-950 border border-amber-400/30 truncate flex items-center space-x-1"
                        title={`${item.employeeName} (${item.leaveType})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span className="truncate">{item.employeeName.split(' ')[0]}</span>
                      </div>
                    ))}
                    {onLeave.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-500 pl-1">
                        +{onLeave.length - 2} more...
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 text-right mt-1">
                  {onLeave.length > 0 ? 'Click to inspect' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReportPrintFooter />

      {/* Day Details Drawer / Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-amber-400" />
                  <span>Leave Schedule for {selectedDayEvents.dateStr}</span>
                </h3>
                {selectedDayEvents.holiday && (
                  <p className="text-xs text-purple-300 font-semibold mt-0.5">
                    ★ Public Holiday: {selectedDayEvents.holiday}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800 max-h-[65vh] overflow-y-auto">
              {selectedDayEvents.records.length === 0 ? (
                <p className="text-slate-500 italic text-center py-4">
                  No staff members scheduled on leave for this date.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.records.map((rec) => {
                    const emp = employees.find((e) => e.employeeId === rec.employeeId);
                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <FacelessAvatar
                            src={emp?.photo}
                            alt={rec.employeeName}
                            size="md"
                            className="border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">
                                {rec.employeeName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                ({rec.employeeId})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              <strong className="text-amber-800">{rec.leaveType}</strong> • {rec.department}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {rec.startDate} to {rec.endDate} ({rec.days} days)
                            </div>
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              "{rec.reason}"
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDayEvents(null);
                              onViewRecord?.(rec);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-slate-300 rounded text-xs font-semibold transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
