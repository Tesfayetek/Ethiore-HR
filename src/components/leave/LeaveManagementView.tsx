import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar as CalendarIcon,
  Layers,
  BarChart3,
  Clock,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { LeaveRecord, LeaveBalance, UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { LeaveRecordsTab } from './LeaveRecordsTab';
import { LeaveBalanceTab } from './LeaveBalanceTab';
import { LeaveHistoryTab } from './LeaveHistoryTab';
import { LeaveCalendarTab } from './LeaveCalendarTab';
import { LeaveReportsTab } from './LeaveReportsTab';
import { CreateLeaveModal } from './CreateLeaveModal';
import { EditLeaveModal } from './EditLeaveModal';
import { ViewLeaveModal } from './ViewLeaveModal';

interface LeaveManagementViewProps {
  userRole: UserRole;
  initialSubTab?: string;
  isAddModalOpenInitially?: boolean;
  onCloseAddModal?: () => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  userRole,
  initialSubTab = 'records',
  isAddModalOpenInitially = false,
  onCloseAddModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'records' | 'balance' | 'history' | 'calendar' | 'reports'
  >((initialSubTab as any) || 'records');

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() =>
    storageService.getLeaveRecords()
  );
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() =>
    storageService.getLeaveBalances()
  );

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(
    isAddModalOpenInitially
  );
  const [viewingRecord, setViewingRecord] = useState<LeaveRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);

  // Sync state with storage
  const refreshData = () => {
    setLeaveRecords(storageService.getLeaveRecords());
    setLeaveBalances(storageService.getLeaveBalances());
    window.dispatchEvent(new Event('ethiore_storage_update'));
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab as any);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsCreateModalOpen(true);
    }
  }, [isAddModalOpenInitially]);

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    onCloseAddModal?.();
  };

  const navTabs: {
    id: 'records' | 'balance' | 'history' | 'calendar' | 'reports';
    label: string;
    subLabel: string;
    icon: any;
    count: number | null;
  }[] = [
    {
      id: 'records',
      label: '5.1 Leave Records',
      subLabel: 'Master Registry',
      icon: CalendarDays,
      count: leaveRecords.length,
    },
    {
      id: 'balance',
      label: '5.2 Leave Balance',
      subLabel: 'Entitlement Quotas',
      icon: BarChart3,
      count: leaveBalances.length,
    },
    {
      id: 'history',
      label: '5.3 Leave History',
      subLabel: 'Per Employee Ledger',
      icon: History,
      count: null,
    },
    {
      id: 'calendar',
      label: '5.4 Leave Calendar',
      subLabel: 'Monthly Roster',
      icon: CalendarIcon,
      count: null,
    },
    {
      id: 'reports',
      label: '5.5 Leave Reports',
      subLabel: 'Statutory Reports',
      icon: FileSpreadsheet,
      count: 6,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Leave Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              Ethiopian Reinsurance S.C.
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Core operational module tracking employee leave records, balances, historical ledgers, and schedule calendars.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Leave Record</span>
          </button>
        </div>
      </div>

      {/* 6. Leave Workflow — NO APPROVAL Policy Visualizer */}
      <div className="bg-gradient-to-r from-[#186382] via-[#0E3D52] to-[#082836] text-white rounded-xl p-4 border-b-2 border-amber-500 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Section 6: Leave Workflow (NO APPROVAL)
            </span>
          </div>
          <span className="text-[11px] text-slate-300">
            Automated Validation & Immediate Balance Synchronization
          </span>
        </div>

        {/* 6-step flow diagram */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-amber-400 font-bold block mb-0.5">Step 1</span>
            <span className="font-semibold text-slate-200">HR Officer creates record</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-amber-400 font-bold block mb-0.5">Step 2</span>
            <span className="font-semibold text-slate-200">System validates record</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-amber-400 font-bold block mb-0.5">Step 3</span>
            <span className="font-semibold text-slate-200">Record is saved</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">Step 4</span>
            <span className="font-semibold text-emerald-200">Balance auto-deducted</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-300 font-bold block mb-0.5">Step 5</span>
            <span className="font-semibold text-slate-200">Logged in History</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#082836]/70 border border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-300 font-bold block mb-0.5">Step 6</span>
            <span className="font-semibold text-slate-200">Scheduled on Calendar</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (5.1 - 5.5) */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-3 text-xs font-medium overflow-x-auto shadow-2xs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-[#186382] font-bold bg-[#EBF3F7]'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'records' && (
        <LeaveRecordsTab
          leaveRecords={leaveRecords}
          onViewRecord={(rec) => setViewingRecord(rec)}
          onEditRecord={(rec) => setEditingRecord(rec)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onRefreshData={refreshData}
        />
      )}

      {activeTab === 'balance' && (
        <LeaveBalanceTab
          leaveBalances={leaveBalances}
          onRefreshData={refreshData}
        />
      )}

      {activeTab === 'history' && (
        <LeaveHistoryTab
          leaveRecords={leaveRecords}
          onViewRecord={(rec) => setViewingRecord(rec)}
        />
      )}

      {activeTab === 'calendar' && (
        <LeaveCalendarTab
          leaveRecords={leaveRecords}
          onViewRecord={(rec) => setViewingRecord(rec)}
        />
      )}

      {activeTab === 'reports' && (
        <LeaveReportsTab
          leaveRecords={leaveRecords}
          leaveBalances={leaveBalances}
        />
      )}

      {/* MODALS */}
      <CreateLeaveModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={refreshData}
      />

      <EditLeaveModal
        leave={editingRecord}
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        onSuccess={refreshData}
      />

      <ViewLeaveModal
        leave={viewingRecord}
        isOpen={viewingRecord !== null}
        onClose={() => setViewingRecord(null)}
        onEdit={(rec) => {
          setViewingRecord(null);
          setEditingRecord(rec);
        }}
      />
    </div>
  );
};
