import React, { useState, ChangeEvent, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Check,
  RefreshCw,
  Search,
  Filter,
  Users,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { storageService, EmployeeImportRow, EmployeeImportResult } from '../../services/storage';
import { UserRole } from '../../types';

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  userRole?: UserRole;
}

// Canonical Excel Template Headers per Requirement #1
const EXCEL_TEMPLATE_COLUMNS = [
  'Employee ID',
  'Employee Code',
  'Full Name',
  'Email',
  'Phone',
  'Gender',
  'Department',
  'Position',
  'Employment Date',
  'Employment Status',
  'Leave Balance',
  'Date of Birth',
  'Employment Type',
  'Work Location',
  'Manager',
];

// Sample guidance row for the downloadable template (clarifying formats like 18, 12.5)
const TEMPLATE_SAMPLE_ROWS = [
  {
    'Employee ID': 'EMP001',
    'Employee Code': 'ER-001',
    'Full Name': 'Abebe Kebede Tessema',
    Email: 'abebe.kebede@ethiopianre.com',
    Phone: '+251 91 123 4567',
    Gender: 'Male',
    Department: 'Underwriting & Reinsurance Operations',
    Position: 'Senior Underwriting Officer',
    'Employment Date': '2020-03-01',
    'Employment Status': 'Active',
    'Leave Balance': 18,
    'Date of Birth': '1988-05-14',
    'Employment Type': 'Permanent',
    'Work Location': 'Addis Ababa - EthioRe Tower Head Office',
    Manager: 'Dawit Yohannes',
  },
  {
    'Employee ID': 'EMP002',
    'Employee Code': 'ER-002',
    'Full Name': 'Sara Hailemariam Mengistu',
    Email: 'sara.hailemariam@ethiopianre.com',
    Phone: '+251 92 345 6789',
    Gender: 'Female',
    Department: 'Finance & Accounts',
    Position: 'Principal Financial Analyst',
    'Employment Date': '2019-07-15',
    'Employment Status': 'Active',
    'Leave Balance': 15.5,
    'Date of Birth': '1991-11-20',
    'Employment Type': 'Permanent',
    'Work Location': 'Addis Ababa - EthioRe Tower Head Office',
    Manager: 'Bethlehem Tadesse',
  },
];

interface ValidatedImportRow {
  rowNumber: number;
  data: EmployeeImportRow;
  action: 'New' | 'Update';
  existingName?: string;
  previousBalance?: number;
  newBalance: number;
  hasErrors: boolean;
  errors: string[];
}

export const ImportEmployeesModal: React.FC<ImportEmployeesModalProps> = ({
  isOpen,
  onClose,
  onImported,
  userRole,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'All' | 'New' | 'Update' | 'Errors'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [importResult, setImportResult] = useState<EmployeeImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = storageService.getCurrentUser();
  const effectiveRole = userRole || currentUser.role;
  const isAuthorized = effectiveRole === 'Administrator' || effectiveRole === 'HR Admin';

  if (!isOpen) return null;

  // 1. Download Excel Template (.xlsx) with Leave Balance column
  const handleDownloadExcelTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_ROWS, {
        header: EXCEL_TEMPLATE_COLUMNS,
      });

      // Set column widths for comfortable editing
      ws['!cols'] = [
        { wch: 14 }, // Employee ID
        { wch: 14 }, // Employee Code
        { wch: 28 }, // Full Name
        { wch: 32 }, // Email
        { wch: 18 }, // Phone
        { wch: 10 }, // Gender
        { wch: 35 }, // Department
        { wch: 28 }, // Position
        { wch: 16 }, // Employment Date
        { wch: 18 }, // Employment Status
        { wch: 15 }, // Leave Balance
        { wch: 14 }, // Date of Birth
        { wch: 16 }, // Employment Type
        { wch: 35 }, // Work Location
        { wch: 22 }, // Manager
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Employee Master Data');
      XLSX.writeFile(wb, 'ethiore_employee_master_template.xlsx');
    } catch (err: any) {
      alert('Error generating Excel template: ' + (err.message || 'Unknown error'));
    }
  };

  // 1b. Download CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent = [
      EXCEL_TEMPLATE_COLUMNS.join(','),
      'EMP001,ER-001,"Abebe Kebede Tessema",abebe.kebede@ethiopianre.com,+251 91 123 4567,Male,"Underwriting & Reinsurance Operations","Senior Underwriting Officer",2020-03-01,Active,18,1988-05-14,Permanent,"Addis Ababa - EthioRe Tower Head Office","Dawit Yohannes"',
      'EMP002,ER-002,"Sara Hailemariam Mengistu",sara.hailemariam@ethiopianre.com,+251 92 345 6789,Female,"Finance & Accounts","Principal Financial Analyst",2019-07-15,Active,15.5,1991-11-20,Permanent,"Addis Ababa - EthioRe Tower Head Office","Bethlehem Tadesse"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ethiore_employee_master_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to normalize column keys from Excel / CSV files
  const normalizeKey = (key: string): string => {
    const cleaned = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned.includes('employeeid') || cleaned === 'empid' || cleaned === 'id') return 'employeeId';
    if (cleaned.includes('employeecode') || cleaned === 'code' || cleaned === 'empcode') return 'employeeCode';
    if (cleaned.includes('fullname') || cleaned === 'name' || cleaned === 'employeename') return 'fullName';
    if (cleaned.includes('email') || cleaned === 'emailaddress') return 'email';
    if (cleaned.includes('phone') || cleaned === 'phonenumber' || cleaned === 'mobile') return 'phone';
    if (cleaned.includes('gender') || cleaned === 'sex') return 'gender';
    if (cleaned.includes('department') || cleaned === 'dept') return 'department';
    if (cleaned.includes('position') || cleaned === 'title' || cleaned === 'jobtitle') return 'position';
    if (cleaned.includes('employmentdate') || cleaned === 'hiredate' || cleaned === 'joineddate' || cleaned === 'startdate') return 'employmentDate';
    if (cleaned.includes('employmentstatus') || cleaned === 'status') return 'employmentStatus';
    if (cleaned.includes('leavebalance') || cleaned === 'leave' || cleaned === 'balance' || cleaned === 'annualleave') return 'leaveBalance';
    if (cleaned.includes('dateofbirth') || cleaned === 'dob' || cleaned === 'birthdate') return 'dateOfBirth';
    if (cleaned.includes('employmenttype') || cleaned === 'type') return 'employmentType';
    if (cleaned.includes('worklocation') || cleaned === 'location') return 'workLocation';
    if (cleaned.includes('manager') || cleaned === 'supervisor') return 'manager';
    if (cleaned.includes('photo') || cleaned === 'image' || cleaned === 'avatar') return 'photo';
    return key;
  };

  // Handle file selection (.xlsx, .xls, .csv)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setImportResult(null);
    setFileErrors([]);
    setIsParsing(true);

    // Backup uploaded import file to Firebase Storage in background
    storageService.uploadFile(`imports/excel_${Date.now()}_${file.name}`, file).catch(() => {});

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer) throw new Error('File buffer is empty.');

        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) throw new Error('Workbook contains no readable sheets.');

        const ws = wb.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (rawJson.length === 0) {
          setFileErrors(['The uploaded file is empty or does not contain data rows.']);
          setValidatedRows([]);
          setIsParsing(false);
          return;
        }

        processRawRows(rawJson);
      } catch (err: any) {
        setFileErrors(['Failed to read Excel file: ' + (err.message || 'Invalid format')]);
        setValidatedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setFileErrors(['An error occurred while reading the file from disk.']);
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Validate and map rows before commit (Preview Screen)
  const processRawRows = (rawRows: Record<string, any>[]) => {
    const currentEmployees = storageService.getEmployees();
    const currentBalances = storageService.getLeaveBalances();

    // Map uppercase Employee ID to existing Employee
    const existingEmpMap = new Map<string, (typeof currentEmployees)[0]>();
    currentEmployees.forEach((emp) => {
      existingEmpMap.set(emp.employeeId.trim().toUpperCase(), emp);
    });

    const seenInFile = new Set<string>();
    const generalErrors: string[] = [];
    const rows: ValidatedImportRow[] = [];

    rawRows.forEach((raw, idx) => {
      const rowNumber = idx + 2; // Row 1 is header

      // Map raw object keys
      const normalized: Record<string, any> = {};
      Object.keys(raw).forEach((k) => {
        normalized[normalizeKey(k)] = raw[k];
      });

      const rowErrors: string[] = [];

      // Extract Employee ID
      const rawId = String(normalized.employeeId || normalized.employeeCode || '').trim();
      if (!rawId) {
        rowErrors.push('Missing Employee ID.');
      }

      const cleanId = rawId.toUpperCase();

      // Check duplicate within file
      if (cleanId) {
        if (seenInFile.has(cleanId)) {
          rowErrors.push(`Duplicate Employee ID "${cleanId}" within file.`);
        } else {
          seenInFile.add(cleanId);
        }
      }

      // Extract & Validate Leave Balance
      let parsedLeaveBalance = 16;
      const rawBalance = normalized.leaveBalance;
      if (rawBalance !== undefined && rawBalance !== null && String(rawBalance).trim() !== '') {
        const num = Number(rawBalance);
        if (isNaN(num)) {
          rowErrors.push(`Leave Balance "${rawBalance}" is not numeric.`);
        } else if (num < 0) {
          rowErrors.push(`Leave Balance (${num}) cannot be negative.`);
        } else {
          parsedLeaveBalance = num;
        }
      }

      // Check Email
      const email = String(normalized.email || normalized.emailAddress || '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push(`Invalid email address "${email}".`);
      }

      // Check Matching with existing employee records
      const existing = existingEmpMap.get(cleanId);
      const action: 'New' | 'Update' = existing ? 'Update' : 'New';

      if (action === 'New') {
        const fullName = String(normalized.fullName || '').trim();
        if (!fullName) {
          rowErrors.push('Full Name is required for creating a new employee.');
        }
      }

      const previousBal = existing
        ? typeof existing.leaveBalance === 'number'
          ? existing.leaveBalance
          : (currentBalances.find(
              (b) => b.employeeId === existing.employeeId && b.leaveType === 'Annual Leave'
            )?.remaining ?? 0)
        : undefined;

      const finalBal =
        rawBalance !== undefined && rawBalance !== null && String(rawBalance).trim() !== ''
          ? parsedLeaveBalance
          : previousBal !== undefined
          ? previousBal
          : 16;

      const employeeRowData: EmployeeImportRow = {
        employeeId: cleanId,
        employeeCode: String(normalized.employeeCode || '').trim() || cleanId,
        fullName: String(normalized.fullName || '').trim() || (existing ? existing.fullName : cleanId),
        email: email || (existing ? existing.emailAddress : ''),
        phone: String(normalized.phone || normalized.phoneNumber || '').trim() || (existing ? existing.phoneNumber : ''),
        gender: String(normalized.gender || '').trim() || (existing ? existing.gender : 'Male'),
        department: String(normalized.department || '').trim() || (existing ? existing.department : 'Operations'),
        position: String(normalized.position || '').trim() || (existing ? existing.position : 'Officer'),
        employmentDate: String(normalized.employmentDate || '').trim() || (existing ? existing.employmentDate : ''),
        employmentStatus: String(normalized.employmentStatus || normalized.status || '').trim() || (existing ? existing.status : 'Active'),
        leaveBalance: finalBal,
        dateOfBirth: String(normalized.dateOfBirth || '').trim(),
        employmentType: String(normalized.employmentType || '').trim(),
        workLocation: String(normalized.workLocation || '').trim(),
        manager: String(normalized.manager || '').trim(),
        photo: String(normalized.photo || '').trim(),
      };

      rows.push({
        rowNumber,
        data: employeeRowData,
        action,
        existingName: existing?.fullName,
        previousBalance: previousBal,
        newBalance: finalBal,
        hasErrors: rowErrors.length > 0,
        errors: rowErrors,
      });
    });

    setValidatedRows(rows);
    setFileErrors(generalErrors);
  };

  // Commit the validated rows to database
  const handleCommitImport = () => {
    if (validatedRows.length === 0) return;

    // Filter out rows with fatal errors
    const validRowsToImport = validatedRows
      .filter((r) => !r.hasErrors)
      .map((r) => r.data);

    if (validRowsToImport.length === 0) {
      alert('Cannot import: All rows contain errors. Please review the errors list and update your Excel file.');
      return;
    }

    setIsImporting(true);
    try {
      const res = storageService.importEmployeesFromExcel(validRowsToImport, {
        user: currentUser,
        fileName: fileName || selectedFile?.name || 'excel_import.xlsx',
      });

      // Incorporate any rows that failed pre-validation into the final error report
      const preValidationErrors = validatedRows
        .filter((r) => r.hasErrors)
        .flatMap((r) =>
          r.errors.map((e) => ({
            rowNumber: r.rowNumber,
            employeeId: r.data.employeeId,
            employeeName: r.data.fullName,
            field: 'Validation',
            description: e,
          }))
        );

      setImportResult({
        ...res,
        totalRows: validatedRows.length,
        failedCount: res.failedCount + validatedRows.filter((r) => r.hasErrors).length,
        errors: [...res.errors, ...preValidationErrors],
      });

      if (res.processedCount > 0) {
        onImported();
      }
    } catch (err: any) {
      alert('Import failed: ' + (err.message || 'System error'));
    } finally {
      setIsImporting(false);
    }
  };

  // Summary statistics for preview
  const summaryStats = useMemo(() => {
    const total = validatedRows.length;
    const newCount = validatedRows.filter((r) => r.action === 'New').length;
    const updateCount = validatedRows.filter((r) => r.action === 'Update').length;
    const errorRows = validatedRows.filter((r) => r.hasErrors).length;
    const leaveUpdates = validatedRows.filter((r) => !r.hasErrors).length;

    // Count duplicate rows inside the file
    const idOccurrences = new Map<string, number>();
    validatedRows.forEach((r) => {
      const id = r.data.employeeId;
      if (id) {
        idOccurrences.set(id, (idOccurrences.get(id) || 0) + 1);
      }
    });
    let duplicateIds = 0;
    idOccurrences.forEach((count) => {
      if (count > 1) duplicateIds += count;
    });

    return {
      total,
      newCount,
      updateCount,
      errorRows,
      leaveUpdates,
      duplicateIds,
    };
  }, [validatedRows]);

  // Filter preview table rows
  const filteredPreviewRows = useMemo(() => {
    return validatedRows.filter((row) => {
      if (previewFilter === 'New' && row.action !== 'New') return false;
      if (previewFilter === 'Update' && row.action !== 'Update') return false;
      if (previewFilter === 'Errors' && !row.hasErrors) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = row.data.employeeId.toLowerCase().includes(q);
        const matchesName = (row.data.fullName || '').toLowerCase().includes(q);
        const matchesDept = (row.data.department || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesDept;
      }
      return true;
    });
  }, [validatedRows, previewFilter, searchQuery]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Import Employee Master Data & Leave Balances
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-amber-200/90">
                Batch onboarding & automated leave balance synchronizer for Ethiopian Reinsurance S.C.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#227D9E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Permission Guard */}
          {!isAuthorized ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-rose-900">Access Denied</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Only <strong>HR Admin</strong> and <strong>Administrator</strong> roles are permitted to import Employee Master Data or modify leave balances.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : importResult ? (
            /* ================= IMPORT RESULT SCREEN ================= */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Summary Banner */}
              <div
                className={`p-5 rounded-xl border text-center space-y-2 ${
                  importResult.failedCount === 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    importResult.failedCount === 0
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {importResult.failedCount === 0 ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-base font-bold">
                  {importResult.failedCount === 0
                    ? 'Import Completed Successfully!'
                    : 'Import Completed with Notices'}
                </h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">
                  {importResult.processedCount} of {importResult.totalRows} employee records have been synchronized with Ethiopian Reinsurance Employee Master Data.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Rows</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{importResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Processed</span>
                  <span className="text-xl font-black text-emerald-800 mt-1 block">{importResult.processedCount}</span>
                </div>
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-sky-700 uppercase block">New Staff</span>
                  <span className="text-xl font-black text-sky-800 mt-1 block">{importResult.newCount}</span>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase block">Updated</span>
                  <span className="text-xl font-black text-amber-800 mt-1 block">{importResult.updatedCount}</span>
                </div>
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center">
                  <span className="text-[11px] font-semibold text-indigo-700 uppercase block">Balances Synced</span>
                  <span className="text-xl font-black text-indigo-800 mt-1 block">{importResult.balancesUpdatedCount}</span>
                </div>
              </div>

              {/* Error Breakdown (if any) */}
              {importResult.errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Failed Records / Notice Details ({importResult.errors.length}):</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-[11px]">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="p-2 bg-white rounded border border-rose-200 flex items-start space-x-2 text-rose-800">
                        <span className="font-mono font-bold bg-rose-100 text-rose-900 px-1 rounded text-[10px]">
                          Row {err.rowNumber}
                        </span>
                        {err.employeeId && (
                          <span className="font-mono font-semibold text-slate-700">[{err.employeeId}]</span>
                        )}
                        {err.field && <span className="font-semibold text-slate-800">{err.field}:</span>}
                        <span>{err.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processed Details Log */}
              {importResult.details.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                    <span>Processed Records Summary ({importResult.details.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Audit logs generated</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead className="bg-slate-50/70 text-slate-500 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Employee ID</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Action</th>
                          <th className="py-2 px-3 text-right">Leave Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResult.details.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">{d.rowNumber}</td>
                            <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{d.employeeId}</td>
                            <td className="py-1.5 px-3 text-slate-900 font-medium">{d.employeeName}</td>
                            <td className="py-1.5 px-3 text-slate-600">{d.department}</td>
                            <td className="py-1.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  d.action === 'New'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {d.action}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-amber-900">
                              {d.previousBalance !== undefined && d.previousBalance !== d.newBalance ? (
                                <span>
                                  <span className="line-through text-slate-400 font-normal text-[10px] mr-1">
                                    {d.previousBalance}d
                                  </span>
                                  {d.newBalance} Days
                                </span>
                              ) : (
                                `${d.newBalance} Days`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Return to Directory */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  All changes have been committed to local state and synchronized with Cloud Firestore.
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#186382] hover:bg-[#227D9E] text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Done & Return to Directory
                </button>
              </div>
            </div>
          ) : (
            /* ================= UPLOAD & PREVIEW FLOW ================= */
            <>
              {/* Step 1: Download Templates & Upload Input */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Download className="w-3.5 h-3.5 text-amber-600" />
                      <span>Download Excel Import Template</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Includes <strong>Leave Balance</strong>, Employee ID, Name, Department, Position, Contact, etc.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Download Excel Template (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download CSV (.csv)</span>
                    </button>
                  </div>
                </div>

                {/* File Upload Zone */}
                <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-700">Select File:</span>
                    {fileName ? (
                      <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-300 text-slate-800 text-[11px] font-bold">
                        {fileName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No file selected yet (.xlsx, .xls, .csv accepted)</span>
                    )}
                  </div>

                  <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-lg text-xs shadow-xs transition-all active:scale-[0.99]">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Excel / CSV File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#186382] mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Analyzing Excel file & validating rows...</p>
                </div>
              )}

              {/* File level errors */}
              {fileErrors.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-800">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>File Validation Errors:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {fileErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ================= STEP 2: PREVIEW SCREEN ================= */}
              {validatedRows.length > 0 && (
                <div className="space-y-4 pt-1">
                  {/* Summary Bar per Requirement #6 */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Rows</span>
                      <span className="text-base font-bold text-slate-900 mt-0.5 block">{summaryStats.total}</span>
                    </div>
                    <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-sky-700 uppercase block">New Staff</span>
                      <span className="text-base font-bold text-sky-800 mt-0.5 block">{summaryStats.newCount}</span>
                    </div>
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-amber-700 uppercase block">Existing Staff</span>
                      <span className="text-base font-bold text-amber-800 mt-0.5 block">{summaryStats.updateCount}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Leave Balances</span>
                      <span className="text-base font-bold text-emerald-800 mt-0.5 block">{summaryStats.leaveUpdates}</span>
                    </div>
                    <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded-lg">
                      <span className="text-[10px] font-semibold text-purple-700 uppercase block">Duplicate Rows</span>
                      <span className="text-base font-bold text-purple-800 mt-0.5 block">{summaryStats.duplicateIds}</span>
                    </div>
                    <div
                      className={`p-2.5 rounded-lg border ${
                        summaryStats.errorRows > 0
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase block">Invalid / Errors</span>
                      <span
                        className={`text-base font-bold mt-0.5 block ${
                          summaryStats.errorRows > 0 ? 'text-rose-700' : 'text-slate-700'
                        }`}
                      >
                        {summaryStats.errorRows}
                      </span>
                    </div>
                  </div>

                  {/* Filter & Search Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                      {(['All', 'New', 'Update', 'Errors'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setPreviewFilter(filter)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            previewFilter === filter
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {filter === 'All' && `All (${summaryStats.total})`}
                          {filter === 'New' && `New (${summaryStats.newCount})`}
                          {filter === 'Update' && `Update (${summaryStats.updateCount})`}
                          {filter === 'Errors' && `Errors (${summaryStats.errorRows})`}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ID, name, department..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-[#186382]"
                      />
                    </div>
                  </div>

                  {/* Preview Table per Requirement #6: Employee ID | Employee Name | Department | Leave Balance | Action */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Row</th>
                            <th className="py-2.5 px-3">Employee ID</th>
                            <th className="py-2.5 px-3">Employee Name</th>
                            <th className="py-2.5 px-3">Department</th>
                            <th className="py-2.5 px-3 text-right">Leave Balance</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPreviewRows.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                No records match the selected filter.
                              </td>
                            </tr>
                          ) : (
                            filteredPreviewRows.map((row) => (
                              <tr
                                key={row.rowNumber}
                                className={`transition-colors ${
                                  row.hasErrors
                                    ? 'bg-rose-50/60 hover:bg-rose-50'
                                    : row.action === 'New'
                                    ? 'hover:bg-sky-50/30'
                                    : 'hover:bg-amber-50/30'
                                }`}
                              >
                                <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{row.rowNumber}</td>
                                <td className="py-2 px-3">
                                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {row.data.employeeId}
                                  </span>
                                  {row.hasErrors && (
                                    <div className="mt-1 text-[10px] text-rose-600 font-medium">
                                      {row.errors.join(' • ')}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-medium text-slate-900">{row.data.fullName}</div>
                                  {row.existingName && row.existingName !== row.data.fullName && (
                                    <div className="text-[10px] text-slate-400">Current: {row.existingName}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]" title={row.data.department}>
                                  {row.data.department}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-amber-950">
                                  {row.action === 'Update' &&
                                  row.previousBalance !== undefined &&
                                  row.previousBalance !== row.newBalance ? (
                                    <div className="flex items-center justify-end space-x-1">
                                      <span className="text-[10px] line-through text-slate-400 font-normal">
                                        {row.previousBalance}d
                                      </span>
                                      <ArrowRight className="w-2.5 h-2.5 text-amber-600" />
                                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                        {row.newBalance} Days
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                                      {row.newBalance} Days
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {row.hasErrors ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      Invalid
                                    </span>
                                  ) : row.action === 'New' ? (
                                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                      New
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      Update
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                    <p>
                      <strong>Matching Rule:</strong> Employee ID is the primary unique key. If Employee ID matches an existing record, non-empty fields and Leave Balance will be updated while preserving untouched details (photos, contacts, history). If Employee ID is new, a new master record will be registered.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center space-x-3">
                  {validatedRows.length > 0 && (
                    <button
                      type="button"
                      disabled={isImporting || validatedRows.filter((r) => !r.hasErrors).length === 0}
                      onClick={handleCommitImport}
                      className="px-6 py-2.5 text-xs font-bold bg-[#186382] hover:bg-[#227D9E] disabled:opacity-50 text-white rounded-xl flex items-center space-x-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Importing Records...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-amber-400" />
                          <span>
                            Import {validatedRows.filter((r) => !r.hasErrors).length} Employees
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
