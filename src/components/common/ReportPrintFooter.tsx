import React from 'react';

export const ReportPrintFooter: React.FC = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="print-only mt-8 pt-3 border-t border-slate-300 text-[10px] text-slate-600 flex flex-wrap items-center justify-between font-sans">
      <div>
        <strong className="text-[#186382]">Ethiopian Reinsurance S.C.</strong> | Generated: {dateStr} {timeStr} | <span className="print-page-number">Page</span>
      </div>
      <div className="text-slate-500 italic">
        Confidential Internal Document • EthioRe HRMS
      </div>
    </div>
  );
};
