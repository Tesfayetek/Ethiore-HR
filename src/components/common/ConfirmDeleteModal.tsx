import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  recordType?: string;
  recordName?: string;
  recordId?: string;
  details?: React.ReactNode;
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Delete Record?',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  recordType,
  recordName,
  recordId,
  details,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs my-8 animate-in zoom-in-95 duration-150">
        <div className="p-6 text-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 id="confirm-delete-title" className="text-base font-bold text-slate-900">
              {title}
            </h3>
            <p className="text-slate-600 mt-1 leading-relaxed">
              {message}
            </p>
          </div>

          {(recordName || recordId || recordType) && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                {recordType && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                    {recordType}
                  </span>
                )}
                {recordId && (
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">
                    ID: {recordId}
                  </span>
                )}
              </div>
              {recordName && (
                <div className="font-bold text-slate-900 text-sm break-words">
                  {recordName}
                </div>
              )}
            </div>
          )}

          {details && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
              {details}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
