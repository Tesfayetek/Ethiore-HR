import React, { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, Trash2, RefreshCw, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { optimizeEmployeePhoto, PHOTO_LIMITS } from '../../utils/imageOptimizer';
import { storageService } from '../../services/storage';
import { FacelessAvatar } from '../common/FacelessAvatar';
import { DEFAULT_FACELESS_AVATAR } from '../../assets/defaultAvatar';
import { UserRole } from '../../types';

interface EmployeePhotoUploadProps {
  employeeId: string;
  photoUrl?: string;
  photoStoragePath?: string;
  onPhotoChanged: (newUrl: string, storagePath?: string) => void;
  onPhotoRemoved: () => void;
  disabled?: boolean;
  userRole?: UserRole;
  employeeName?: string;
}

export const EmployeePhotoUpload: React.FC<EmployeePhotoUploadProps> = ({
  employeeId,
  photoUrl,
  photoStoragePath,
  onPhotoChanged,
  onPhotoRemoved,
  disabled = false,
  userRole,
  employeeName = 'Employee',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if role is authorized (HR Admin or Administrator)
  const isAuthorized = userRole === 'Administrator' || userRole === 'HR Admin';

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      // 1. Automatic Client-Side Validation and Optimization (Center crop, 300x300, WebP, <200KB)
      const optimized = await optimizeEmployeePhoto(file);

      // 2. Structured Firebase Storage Path: employees/{employeeId}/profile-photo
      const targetEmpId = employeeId.trim() || 'pending';
      const cleanStoragePath = `employees/${targetEmpId}/profile-photo`;

      // Convert optimized blob to file for storage upload
      const optimizedFile = new File([optimized.blob], `profile_${Date.now()}.webp`, {
        type: optimized.mimeType,
      });

      // 3. Upload optimized image to Firebase Storage
      const currentUser = storageService.getCurrentUser();
      const uploadRes = await storageService.uploadFile(cleanStoragePath, optimizedFile);

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload photo to Firebase Storage.');
      }

      // 4. Clean up previous photo if path changed or previous existed
      if (photoStoragePath && photoStoragePath !== cleanStoragePath) {
        storageService.deleteFile(photoStoragePath).catch(() => {});
      }

      // 5. Update state & notify parent form
      onPhotoChanged(uploadRes.url, cleanStoragePath);
      setSuccessMessage(
        `Optimized (${Math.round(optimized.size / 1024)} KB WebP) & saved.`
      );
      setTimeout(() => setSuccessMessage(null), 3500);

      // Record audit log for photo management
      storageService.addAuditLog(
        photoUrl ? 'EMPLOYEE_PHOTO_REPLACED' : 'EMPLOYEE_PHOTO_UPLOADED',
        'Employee Master Data',
        `Employee photo ${photoUrl ? 'replaced' : 'uploaded'} for ${employeeName} (${targetEmpId}). Optimized to ${Math.round(optimized.size / 1024)} KB WebP.`,
        undefined,
        currentUser,
        {
          recordType: 'Employee Photo',
          recordId: targetEmpId,
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing and uploading photo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this employee photo?')) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (photoStoragePath) {
        await storageService.deleteFile(photoStoragePath);
      }
      onPhotoRemoved();
      const currentUser = storageService.getCurrentUser();
      storageService.addAuditLog(
        'EMPLOYEE_PHOTO_REMOVED',
        'Employee Master Data',
        `Employee photo removed for ${employeeName} (${employeeId || 'ID'}).`,
        undefined,
        currentUser,
        {
          recordType: 'Employee Photo',
          recordId: employeeId || 'ID',
        }
      );
      setSuccessMessage('Photo removed.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 text-xs">
          Employee Photo
        </label>
        <span className="text-[10px] text-slate-400">
          Max 2MB • JPG, PNG, WebP (Auto 300×300)
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Circular Avatar Presentation (120 x 120 px) */}
        <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center group">
          <FacelessAvatar
            src={photoUrl}
            alt={employeeName}
            size={120}
            className="w-full h-full"
          />

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400 mb-1" />
              <span className="text-[10px] font-semibold">Processing...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 w-full sm:w-auto">
          {disabled || (!isAuthorized && userRole !== undefined) ? (
            <p className="text-[11px] text-slate-500 italic">
              Photo management restricted to HR Admin and Administrator roles.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isProcessing || disabled}
                className="hidden"
                id={`photo-input-${employeeId || 'new'}`}
              />

              {(!photoUrl || photoUrl === DEFAULT_FACELESS_AVATAR) ? (
                <label
                  htmlFor={`photo-input-${employeeId || 'new'}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#186382] hover:bg-[#227D9E] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors active:scale-[0.98]"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Photo</span>
                </label>
              ) : (
                <>
                  <label
                    htmlFor={`photo-input-${employeeId || 'new'}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg shadow-2xs cursor-pointer transition-colors active:scale-[0.98]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Replace Photo</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isProcessing || disabled}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset to Avatar</span>
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-tight">
            Images are automatically center-cropped to square, resized to 300×300, and optimized for fast loading across the HRMS directory.
          </p>

          {errorMessage && (
            <div className="flex items-center space-x-1.5 text-[11px] text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
