import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { EthioReLogo } from '../common/EthioReLogo';
import { FacelessAvatar } from '../common/FacelessAvatar';

interface HeaderProps {
  currentUser: User;
  onUserSwitch?: (role: UserRole) => void;
  activeModuleTitle: string;
  onOpenLogin?: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Header = ({
  currentUser,
  activeModuleTitle,
  onLogout,
}: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const companyInfo = storageService.getCompanyInfo();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Look up employee record in Master Data if linked to display Employee ID and Photo
  const linkedEmployee = currentUser.employeeId
    ? storageService.getEmployeeById(currentUser.employeeId)
    : storageService.findEmployeeByEmail(currentUser.email);
  const displayEmployeeId = currentUser.employeeId || linkedEmployee?.employeeId;
  const userPhoto = linkedEmployee?.photo || currentUser.avatar;

  return (
    <header className="bg-[#0E3D52] border-b-2 border-[#CCA352] text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Organization Official Logo & Brand Identification */}
          <div className="flex items-center space-x-3">
            <EthioReLogo size="md" variant="full" theme="dark" />
            <span className="hidden xl:inline-block px-2 py-0.5 text-[11px] font-semibold bg-[#CCA352]/20 text-[#E2BE6C] border border-[#CCA352]/40 rounded-full">
              HRMS Portal
            </span>
          </div>

          {/* Right: Date/Time + Authenticated User Info + Sign Out */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Clock & Date */}
            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-[#082836]/90 rounded-lg border border-[#186382]/40 text-xs">
              <div className="flex items-center text-slate-300">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#CCA352]" />
                <span>{currentDate}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center text-slate-200 font-mono">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-[#CCA352]" />
                <span>{currentTime}</span>
              </div>
            </div>

            {/* Authenticated User Information (No role selection) */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-[#082836]/90 rounded-lg border border-[#186382]/40 text-xs">
              <FacelessAvatar
                src={userPhoto}
                alt={currentUser.displayName}
                className="w-7 h-7 border border-[#CCA352]/50 shadow-2xs"
              />
              <div className="text-left leading-tight hidden sm:block">
                <div className="font-semibold text-white truncate max-w-[140px] md:max-w-[180px]">
                  {currentUser.displayName}
                </div>
                <div className="text-[11px] text-[#CCA352] font-mono flex items-center space-x-1.5 mt-0.5">
                  {displayEmployeeId ? (
                    <span className="font-semibold text-[#E2BE6C]">{displayEmployeeId}</span>
                  ) : (
                    <span className="text-slate-300 font-sans text-[10px]">{currentUser.role}</span>
                  )}
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-sans text-[10px]">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {/* Professional Sign Out Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-rose-600/20 hover:bg-rose-600/35 active:bg-rose-600/50 text-rose-200 hover:text-white border border-rose-500/40 hover:border-rose-400/60 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Sign Out of Ethiopian Reinsurance HRMS"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>

            {/* System Reset */}
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset Ethiopian Reinsurance HRMS to clean production state?')) {
                  storageService.resetToDefaults();
                  window.location.reload();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-[#CCA352] hover:bg-[#082836] rounded-lg transition-colors cursor-pointer"
              title="Reset System to Clean State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
