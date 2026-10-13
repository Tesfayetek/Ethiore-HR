import React, { useState, useMemo } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserPlus,
  KeyRound,
  Briefcase,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  ChevronLeft,
  Info,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { User, Employee } from '../../types';
import { storageService } from '../../services/storage';
import { AUTH_CONFIG } from '../../config/authConfig';
import { EthioReLogo } from '../common/EthioReLogo';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
  isModal?: boolean;
  initialMode?: 'login' | 'register' | 'forgot_password' | 'verify_email';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel,
  isModal = false,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'verify_email'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (Personal information + Company email + Password)
  const [regFullName, setRegFullName] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState('');

  // Unverified user state
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time lookup of employee in Master Data when typing registration email
  const matchedEmployee = useMemo<Employee | undefined>(() => {
    if (!regEmail || regEmail.trim().length < 5) return undefined;
    return storageService.findEmployeeByEmail(regEmail.trim());
  }, [regEmail]);

  // Real-time validation warning for registration email
  const emailDomainValidation = useMemo(() => {
    if (!regEmail || regEmail.trim().length === 0) return { isValid: true };
    return AUTH_CONFIG.validateRegistrationEmail(regEmail);
  }, [regEmail]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await storageService.loginUser(loginEmail, loginPassword);
      if (res.success && res.user) {
        if (res.needsEmailVerification) {
          setPendingUser(res.user);
          setMode('verify_email');
          setErrorMessage('Email verification required before accessing Ethiopian Reinsurance employee self-service records.');
        } else {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Employee Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Personal info validation
    if (!regFullName.trim()) {
      setErrorMessage('Full legal name is required for employee registration.');
      return;
    }

    // Password validation
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and retry.');
      return;
    }

    // Corporate domain validation with exceptions
    const val = AUTH_CONFIG.validateRegistrationEmail(regEmail);
    if (!val.isValid) {
      setErrorMessage(val.message || AUTH_CONFIG.unauthorizedDomainErrorMessage);
      return;
    }

    setIsLoading(true);

    try {
      // Backend automatically assigns Employee role securely and discards any client role
      const res = await storageService.registerEmployee({
        fullName: regFullName.trim(),
        phoneNumber: regPhoneNumber.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      if (res.success && res.user) {
        setPendingUser(res.user);
        setSuccessMessage(res.message);
        setMode('verify_email');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please contact HR administration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await storageService.sendPasswordReset(resetEmail || loginEmail);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check email verification status
  const handleCheckVerification = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await storageService.checkEmailVerified(pendingUser?.id);
      if (res.verified) {
        setSuccessMessage(res.message);
        const curr = storageService.getAuthenticatedUser();
        if (curr) {
          setTimeout(() => {
            onLoginSuccess(curr);
          }, 600);
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not verify email status.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend email verification link
  const handleResendVerification = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await storageService.resendVerificationEmail();
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error dispatching verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sandbox bypass for testing
  const handleSimulateVerification = () => {
    storageService.simulateVerifyEmail(pendingUser?.id);
    setSuccessMessage('Email verified via sandbox mode. Accessing Ethiopian Reinsurance self-service portal...');
    const curr = storageService.getAuthenticatedUser();
    if (curr) {
      setTimeout(() => {
        onLoginSuccess(curr);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-stretch">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        
        {/* ========================================================================= */}
        {/* LEFT HALF — CORPORATE BRANDING & HERITAGE                                */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-br from-[#082836] via-[#0E3D52] to-[#186382] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden border-b lg:border-b-0 lg:border-r border-[#CCA352]/20 min-h-[340px] lg:min-h-screen">
          {/* Subtle Geometric Background Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CCA352" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>

          {/* Decorative Subtle Glowing Elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#CCA352]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#227D9E]/25 rounded-full blur-3xl pointer-events-none" />

          {/* Top: Proportional Corporate Logo */}
          <div className="relative z-10">
            <EthioReLogo size="lg" theme="dark" variant="mark" />
          </div>

          {/* Middle: Brand Presence & Corporate Title (No cards) */}
          <div className="relative z-10 my-auto py-8 sm:py-12 max-w-lg space-y-4">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#CCA352]/20 text-[#E2BE6C] border border-[#CCA352]/40 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#E2BE6C]" />
              Official Enterprise Portal
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Ethiopian Reinsurance
              </h1>
              <p className="text-lg sm:text-xl font-medium text-[#E2BE6C] tracking-wide">
                Human Resource Management System
              </p>
            </div>

            <div className="w-16 h-1 bg-[#CCA352] rounded-full my-6 opacity-80" />

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Dedicated corporate platform providing secure workforce management, statutory leave governance, and employee self-service.
            </p>

            <div className="pt-2 text-xs text-slate-400 flex items-center space-x-2 font-medium">
              <span>EthioRe Tower, Addis Ababa</span>
              <span>•</span>
              <span className="text-[#E2BE6C]">Corporate HRMS</span>
            </div>
          </div>

          {/* Bottom Footer Notice */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
            <span>© 2026 Ethiopian Reinsurance S.C. (EthioRe)</span>
            <span className="text-[#E2BE6C]/80 font-mono text-[11px]">Authorized Corporate Portal</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT HALF — AUTHENTICATION PANEL (LOGIN, REGISTER, RECOVERY, VERIFY)     */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 relative overflow-y-auto min-h-screen">
          {/* Close modal button if rendered inside a modal */}
          {isModal && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}

          <div className="w-full max-w-md my-auto space-y-6">

            {/* Error & Success Feedback Banners */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{successMessage}</div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 1: LOGIN FORM                                            */}
            {/* ============================================================= */}
            {mode === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Sign In
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    Enter your corporate credentials to access your account.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                  {/* Corporate Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@ethiopianre.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot_password');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setResetEmail(loginEmail);
                        }}
                        className="text-xs text-[#186382] hover:text-[#0E3D52] font-semibold transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#186382] focus:ring-[#186382] border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-medium">Remember Me</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 sm:py-3 px-4 bg-[#186382] hover:bg-[#227D9E] active:bg-[#0E3D52] text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#CCA352]" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 text-[#CCA352]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch to Register */}
                <div className="pt-4 border-t border-slate-200 text-center">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Don't have an employee account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-[#186382] hover:text-[#0E3D52] transition-colors inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Register here</span>
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 2: EMPLOYEE REGISTRATION                                */}
            {/* ============================================================= */}
            {mode === 'register' && (
              <div className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center space-x-1 text-xs text-[#186382] hover:underline font-semibold mb-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Employee Registration
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your required personal information and corporate email address to register.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Step 2: Personal Information */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Abebe Kebede"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        value={regPhoneNumber}
                        onChange={(e) => setRegPhoneNumber(e.target.value)}
                        placeholder="+251 91 123 4567"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Step 3: Company Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Corporate Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="your.name@ethiopianre.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                    </div>

                    {/* Email Domain Feedback */}
                    {!emailDomainValidation.isValid && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{emailDomainValidation.message}</span>
                      </p>
                    )}

                    {/* Employee Master Data match indicator */}
                    {matchedEmployee && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold">{matchedEmployee.fullName}</span>
                          <span className="text-[11px] text-emerald-700 ml-1">
                            ({matchedEmployee.employeeId} • {matchedEmployee.position})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 4: Create Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Create Password (min. 6 characters) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Policy Advisory */}
                  <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                    <p className="font-semibold text-slate-800">Registration & Access Security Policy:</p>
                    <p>• Only @ethiopianre.com addresses or authorized corporate exceptions may register.</p>
                    <p>• All new accounts are automatically and securely assigned the <strong>Employee</strong> role on the server.</p>
                    <p>• Corporate email verification is mandatory before self-service access is granted.</p>
                    <p>• Role changes can only be granted by an authorized Administrator.</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#CCA352]" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-[#CCA352]" />
                        <span>Register Employee Account</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-[#186382] hover:text-[#227D9E] transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 3: FORGOT PASSWORD                                       */}
            {/* ============================================================= */}
            {mode === 'forgot_password' && (
              <div className="space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center space-x-1 text-xs text-[#186382] hover:underline font-semibold mb-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your corporate email address to receive password recovery instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.name@ethiopianre.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#186382] focus:border-[#186382] outline-hidden font-medium transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#CCA352]" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#CCA352]" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Remember your password? <span className="text-[#186382] font-bold">Sign In</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 4: EMAIL VERIFICATION PENDING SCREEN                     */}
            {/* ============================================================= */}
            {mode === 'verify_email' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-[#186382]/10 border border-[#186382]/20 rounded-2xl flex items-center justify-center mx-auto text-[#186382]">
                  <Mail className="w-8 h-8 text-[#186382]" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Verify Your Email Address
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Please check your email and follow the verification link to activate your account.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 font-bold">
                  {pendingUser?.email || regEmail || loginEmail}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#186382] hover:bg-[#227D9E] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#CCA352] ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Check Verification Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Resend Verification Email</span>
                  </button>
                </div>

                {/* Sandbox / Demo Bypass */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-left space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sandbox / Demonstration Mode:</span>
                    </span>
                    <p className="text-[10px] text-amber-800/80">
                      In the preview environment, you can instantly verify this account to explore employee self-service records:
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateVerification}
                      className="mt-1 w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      Instant Verify & Enter Portal
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
