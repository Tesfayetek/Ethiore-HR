import { useState, useEffect, FormEvent } from 'react';
import { X, Save, AlertCircle, UserPlus } from 'lucide-react';
import { Employee, Gender, EmploymentType, EmployeeStatus } from '../../types';
import { storageService } from '../../services/storage';
import { EmployeePhotoUpload } from './EmployeePhotoUpload';
import { DEFAULT_FACELESS_AVATAR } from '../../assets/defaultAvatar';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal = ({
  isOpen,
  onClose,
  onSaved,
  employeeToEdit,
}: EmployeeModalProps) => {
  const departments = storageService.getDepartments();
  const positions = storageService.getPositions();
  const currentUser = storageService.getCurrentUser();

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    gender: 'Male' as Gender,
    dateOfBirth: '1995-01-01',
    employmentDate: new Date().toISOString().split('T')[0],
    department: departments[0]?.name || '',
    position: positions[0]?.title || '',
    employmentType: 'Permanent' as EmploymentType,
    workLocation: 'Addis Ababa - EthioRe Tower Head Office',
    manager: '',
    phoneNumber: '+251 9',
    emailAddress: '',
    photo: DEFAULT_FACELESS_AVATAR,
    photoStoragePath: '',
    status: 'Active' as EmployeeStatus,
    leaveBalance: 16,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        employeeId: employeeToEdit.employeeId,
        fullName: employeeToEdit.fullName,
        gender: employeeToEdit.gender,
        dateOfBirth: employeeToEdit.dateOfBirth,
        employmentDate: employeeToEdit.employmentDate,
        department: employeeToEdit.department,
        position: employeeToEdit.position,
        employmentType: employeeToEdit.employmentType,
        workLocation: employeeToEdit.workLocation,
        manager: employeeToEdit.manager,
        phoneNumber: employeeToEdit.phoneNumber,
        emailAddress: employeeToEdit.emailAddress,
        photo: employeeToEdit.photo || DEFAULT_FACELESS_AVATAR,
        photoStoragePath: employeeToEdit.photoStoragePath || '',
        status: employeeToEdit.status,
        leaveBalance:
          typeof employeeToEdit.leaveBalance === 'number' ? employeeToEdit.leaveBalance : 16,
      });
    } else {
      // Auto-generate next Employee ID recommendation (e.g. ER-012)
      const emps = storageService.getEmployees();
      const ids = emps
        .map((e) => {
          const match = e.employeeId.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      const genId = `ER-${String(nextNum).padStart(3, '0')}`;

      setFormData((prev) => ({
        ...prev,
        employeeId: genId,
        fullName: '',
        phoneNumber: '+251 91 ',
        emailAddress: '',
        photo: DEFAULT_FACELESS_AVATAR,
        photoStoragePath: '',
        leaveBalance: 16,
      }));
    }
    setErrorMessage(null);
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.employeeId.trim() || !formData.fullName.trim()) {
      setErrorMessage('Employee ID and Full Name are mandatory.');
      return;
    }

    const result = storageService.saveEmployee(
      {
        ...formData,
        id: employeeToEdit?.id,
      },
      currentUser
    );

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#186382] text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {employeeToEdit ? `Edit Employee: ${employeeToEdit.employeeId}` : 'Register New Employee'}
              </h2>
              <p className="text-xs text-amber-200/80">
                Ethiopian Reinsurance S.C. Centralized Employee Master Data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#227D9E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Employee ID */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employee ID <span className="text-rose-500">* (Unique)</span>
              </label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                placeholder="e.g. ER-012"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Must be unique across all active & inactive staff</span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Almaz Kebede Tessema"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Employment Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Date</label>
              <input
                type="date"
                required
                value={formData.employmentDate}
                onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Position / Job Title</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Senior Reinsurance Underwriter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            {/* Work Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
              <input
                type="text"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                placeholder="e.g. Addis Ababa - EthioRe Tower Head Office"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Manager / Supervisor */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manager / Supervisor</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="Enter Manager / Supervisor name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+251 91 123 4567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="name@ethiopianre.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Leave Balance (Days) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Leave Balance (Days) <span className="text-amber-600 font-normal">• Available Statutory Leave</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.leaveBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    leaveBalance: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="e.g. 18, 15, 12.5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-hidden font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                Available annual leave entitlement (stored directly in Employee Master Data)
              </span>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="Active">Active (Eligible for Leave & Attendance)</option>
                <option value="Inactive">Inactive (Restricted from Operational Records)</option>
              </select>
            </div>

            {/* Photo & Firebase Storage Upload Component per Requirements */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <EmployeePhotoUpload
                employeeId={formData.employeeId}
                employeeName={formData.fullName}
                photoUrl={formData.photo}
                photoStoragePath={formData.photoStoragePath}
                userRole={currentUser.role}
                onPhotoChanged={(newUrl, storagePath) => {
                  setFormData((prev) => ({
                    ...prev,
                    photo: newUrl,
                    photoStoragePath: storagePath || '',
                  }));
                }}
                onPhotoRemoved={() => {
                  setFormData((prev) => ({
                    ...prev,
                    photo: DEFAULT_FACELESS_AVATAR,
                    photoStoragePath: '',
                  }));
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#186382] hover:bg-[#227D9E] text-white rounded-lg flex items-center space-x-2 shadow-xs transition-all active:scale-[0.99]"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{employeeToEdit ? 'Update Employee' : 'Save & Register'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
