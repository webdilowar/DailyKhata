import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinancial } from '../contexts/FinancialContext';
import { X, Mail, Lock, User, Phone, AlertCircle, CheckCircle2, Sparkles, ExternalLink, Cloud } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    login,
    register,
    loginWithGoogle,
    loginWithProfile,
    resetPassword,
    isConfigured,
    enterDemoMode,
  } = useAuth();
  const { saveToGoogleDrive, restoreFromGoogleDrive, refreshData } = useFinancial();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Phone for Login
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveDriveOnSignup, setSaveDriveOnSignup] = useState(true);
  const [restoreDriveOnLogin, setRestoreDriveOnLogin] = useState(true);
  const [driveStatusNote, setDriveStatusNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsOperationNotAllowed(false);
    setLoading(true);
    try {
      await loginWithGoogle(phone.trim() || undefined, displayName.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileContinue = () => {
    loginWithProfile({
      displayName: displayName.trim() || 'User',
      email: email.trim() || undefined,
      phoneNumber: phone.trim() || undefined,
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsOperationNotAllowed(false);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const idToUse = identifier.trim();
        if (!idToUse) {
          setError('Please enter your email or phone number');
          setLoading(false);
          return;
        }
        await login(idToUse, password);

        // Restore from Google Drive on email sign-in if enabled
        if (restoreDriveOnLogin && idToUse.includes('@')) {
          try {
            setDriveStatusNote('Restoring data from Google Drive...');
            await restoreFromGoogleDrive('replace');
            await refreshData();
          } catch (driveErr) {
            console.warn('Google Drive restore notice on sign-in:', driveErr);
          }
        }
        onClose();
      } else if (mode === 'register') {
        if (!email.trim() && !phone.trim()) {
          setError('Please provide at least an email address or a phone number');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        await register({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          displayName: displayName.trim() || undefined,
        });

        // Save data to Google Drive on email sign-up if enabled
        if (saveDriveOnSignup && email.trim()) {
          try {
            setDriveStatusNote('Saving all data to Google Drive...');
            await saveToGoogleDrive();
          } catch (driveErr) {
            console.warn('Google Drive save notice on sign-up:', driveErr);
          }
        }
        onClose();
      } else if (mode === 'forgot') {
        const resetEmail = (email || identifier).trim();
        if (!resetEmail || !resetEmail.includes('@')) {
          setError('Please provide a valid email address to receive password reset instructions.');
          setLoading(false);
          return;
        }
        await resetPassword(resetEmail);
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (
        err?.code === 'auth/operation-not-allowed' ||
        msg.includes('operation-not-allowed')
      ) {
        setIsOperationNotAllowed(true);
        msg = 'Firebase Email/Password provider is disabled in this project. Please sign in with Google below for instant cloud sync.';
      } else if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential')
      ) {
        msg = 'Invalid credentials. Please check your email/phone and password.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'This email or phone number is already registered. Please sign in instead.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="auth-modal"
        className="w-full max-w-sm bg-[#242420] border border-[#3e3e37] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363630]">
          <div>
            <h2 className="text-base font-bold text-[#f5f5f0]">
              {mode === 'login' ? 'Sign In to MoneyFlow' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-xs text-[#a3a398] mt-0.5">
              {isConfigured ? 'Firebase Cloud Sync across all devices' : 'Offline / Demo Mode active'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#a3a398] hover:text-[#f5f5f0] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs sm:text-sm">
          {/* Prominent Google Sign In */}
          {isConfigured && (
            <div>
              <button
                type="button"
                id="btn-google-sign-in"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#fbfbfa] hover:bg-[#ffffff] text-[#1c1c1a] font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm active-press border border-[#e0e0d8] group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (Instant Cloud Sync)</span>
              </button>

              <div className="relative flex items-center justify-center my-3.5">
                <div className="border-t border-[#363630] w-full" />
                <span className="bg-[#242420] px-2 text-[11px] uppercase tracking-wider text-[#777770]">
                  Or use email / phone
                </span>
                <div className="border-t border-[#363630] w-full" />
              </div>
            </div>
          )}

          {/* Error Banner with Operation Not Allowed Guide */}
          {isOperationNotAllowed ? (
            <div className="p-3.5 bg-[#e6c875]/10 border border-[#e6c875]/35 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-[#e6c875]">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#f5f5f0]">Email/Password Provider Disabled</h4>
                  <p className="text-[11px] text-[#cfcfc4] mt-1 leading-relaxed">
                    By default, Firebase projects only have <strong>Google Sign-In</strong> enabled. You can connect immediately with Google, or continue with your profile details locally.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  id="btn-error-google-fallback"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active-press"
                >
                  <Sparkles size={14} />
                  <span>Sign In with Google (Recommended)</span>
                </button>

                <button
                  type="button"
                  id="btn-error-local-profile"
                  onClick={handleProfileContinue}
                  className="w-full py-1.5 bg-[#2c2c27] hover:bg-[#383832] text-[#e5e5dc] text-xs font-semibold rounded-xl border border-[#44443d] transition-colors"
                >
                  Continue with Profile ({displayName.trim() || 'Dilowar Hosen'})
                </button>
              </div>

              <div className="text-[10px] text-[#888880] border-t border-[#44443d]/60 pt-2 flex items-center justify-between">
                <span>To enable Email/Password:</span>
                <a
                  href="https://console.firebase.google.com/project/ai-studio-moneyflow-49ce6589-2635-467b-bb32-6909d32ab83d/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#e6c875] hover:underline inline-flex items-center gap-1"
                >
                  <span>Firebase Console</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ) : error ? (
            <div className="p-3 bg-[#ff6565]/10 border border-[#ff6565]/30 rounded-xl text-[#ff6565] flex items-center gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success && (
            <div className="p-3 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl text-[#4ade80] flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#a3a398] mb-1">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                    <input
                      id="auth-input-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Dilowar Hosen"
                      className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a3a398] mb-1">
                    Email Address <span className="text-[#777770] font-normal">(for cloud account)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                    <input
                      id="auth-input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. dilowarhosen1@gmail.com"
                      className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a3a398] mb-1">
                    Phone Number <span className="text-[#e6c875] font-normal">(for mobile sign-in)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                    <input
                      id="auth-input-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01710236987 or +880..."
                      className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                  <input
                    id="auth-input-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="dilowarhosen1@gmail.com or 017..."
                    className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                  <input
                    id="auth-input-forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-[#a3a398] mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-[#777770]" />
                  <input
                    id="auth-input-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1a1a18] border border-[#3e3e37] focus:border-[#e6c875] rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#f5f5f0] outline-hidden"
                    required
                  />
                </div>
                {mode === 'register' && (
                  <p className="text-[11px] text-[#777770] mt-1">
                    At least 6 characters. You can use this password to log in with your email or phone on any device.
                  </p>
                )}
              </div>
            )}

            {/* Google Drive sync toggles */}
            {mode === 'register' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c5c5b8] bg-[#2a2a26] p-2.5 rounded-xl border border-[#3e3e37]">
                <input
                  type="checkbox"
                  id="chk-drive-save-signup"
                  checked={saveDriveOnSignup}
                  onChange={(e) => setSaveDriveOnSignup(e.target.checked)}
                  className="rounded text-[#e6c875] accent-[#e6c875] w-4 h-4"
                />
                <Cloud size={14} className="text-[#4285F4] shrink-0" />
                <span>Save all my data on Google Drive on sign up</span>
              </label>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c5c5b8] bg-[#2a2a26] p-2.5 rounded-xl border border-[#3e3e37]">
                <input
                  type="checkbox"
                  id="chk-drive-restore-login"
                  checked={restoreDriveOnLogin}
                  onChange={(e) => setRestoreDriveOnLogin(e.target.checked)}
                  className="rounded text-[#e6c875] accent-[#e6c875] w-4 h-4"
                />
                <Cloud size={14} className="text-[#4285F4] shrink-0" />
                <span>Restore my data from Google Drive on sign in</span>
              </label>
            )}

            {driveStatusNote && (
              <div className="p-2.5 bg-[#4285F4]/10 border border-[#4285F4]/30 rounded-xl text-xs text-[#93c5fd] flex items-center gap-2">
                <Cloud size={14} className="animate-pulse" />
                <span>{driveStatusNote}</span>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#e6c875] hover:bg-[#f0d58c] text-[#1c1c1a] font-bold text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50 active-press"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In & Sync Data'
                : mode === 'register'
                ? 'Register & Sync to Cloud'
                : 'Send Reset Link'}
            </button>

            {/* Mode Switchers */}
            <div className="pt-2 text-center text-xs space-y-1.5 text-[#a3a398]">
              {mode === 'login' && (
                <>
                  <div>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-[#e6c875] font-semibold underline ml-1"
                    >
                      Sign Up
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[#888880] hover:text-[#c5c5b8] text-[11px]"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </>
              )}

              {mode === 'register' && (
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#e6c875] font-semibold underline ml-1"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div>
                  Remembered password?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#e6c875] font-semibold underline ml-1"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>

            <hr className="border-[#363630] my-2" />

            {/* Quick Demo Mode */}
            <button
              id="btn-switch-demo-mode"
              type="button"
              onClick={handleDemoMode}
              className="w-full py-2 bg-[#2a2a26] hover:bg-[#33332d] text-[#c5c5b8] text-xs font-semibold rounded-xl border border-[#3e3e37] transition-colors"
            >
              Continue as Guest / Demo Mode
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
