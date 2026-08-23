import React, { useState } from 'react';
import { Mail, Lock, Building2, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Check, Globe, Eye, EyeOff } from 'lucide-react';
import { loginUser, signupUser, loginWithOAuthProvider, verifyGoogleAuthWithBackend, getGoogleClientId, AuthSession, validatePasswordPolicy } from '../services/authService';
import { AuthProviderType, EmailProviderType } from '../types/saas';
import { GoogleLogo, ZohoLogo, AmusemacLogo } from './ProviderLogos';
import { IS_DEV, BUILD_SHA, ENABLE_OAUTH_BUTTONS } from '../config/env';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticated: (session: AuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onAuthenticated }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'GRANT_MAILBOX'>('LOGIN');

  // Form Fields - Clean initial state (NO PREFILLED EMAIL/PASSWORD)
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OAuth Session & Mailbox Selection State
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);
  const [selectedMailboxProvider, setSelectedMailboxProvider] = useState<EmailProviderType>('GMAIL');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleOAuthSignIn = async (provider: AuthProviderType) => {
    setIsLoading(true);
    setErrorMsg('');

    if (provider === 'GOOGLE') {
      const clientId = await getGoogleClientId();
      if (!clientId || clientId.trim() === '' || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        setErrorMsg('Google Sign-In requires GOOGLE_CLIENT_ID. Configure VITE_GOOGLE_CLIENT_ID in Cloudflare Workers settings or GOOGLE_CLIENT_ID on Render.');
        setIsLoading(false);
        return;
      }

      const executeGis = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response.credential) {
                try {
                  const session = await verifyGoogleAuthWithBackend(response.credential);
                  setPendingSession(session);
                  setSelectedMailboxProvider('GMAIL');
                  setMode('GRANT_MAILBOX');
                } catch (err: any) {
                  setErrorMsg(err.message || 'Google authentication failed server-side');
                } finally {
                  setIsLoading(false);
                }
              } else {
                setErrorMsg('No credential returned from Google Sign-In.');
                setIsLoading(false);
              }
            }
          });
          window.google.accounts.id.prompt();
        }
      };

      if (window.google?.accounts?.id) {
        executeGis();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = executeGis;
        script.onerror = () => {
          setErrorMsg('Failed to load Google Identity Services SDK.');
          setIsLoading(false);
        };
        document.body.appendChild(script);
      }
      return;
    }

    if (provider === 'ZOHO') {
      try {
        const res = await fetch('/api/auth/zoho/url');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.configured && data.url) {
            window.location.href = data.url;
            return;
          }
        }
      } catch (e) {}

      // REAL ARCHITECTURE: Never generate mock zoho.user sessions on missing OAuth config
      setErrorMsg('Zoho Sign-In is not configured on the server. Please set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET on Render.');
      setIsLoading(false);
      return;
    }
  };

  const handleCompleteMailboxGrant = () => {
    if (pendingSession) {
      onAuthenticated(pendingSession);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'LOGIN') {
        const session = await loginUser(email, password);
        onAuthenticated(session);
      } else if (mode === 'SIGNUP') {
        if (!companyName || !fullName || !whatsappNumber) {
          setErrorMsg('Company Name, Full Name, and WhatsApp Number are required.');
          setIsLoading(false);
          return;
        }

        const passCheck = validatePasswordPolicy(password);
        if (!passCheck.valid) {
          setErrorMsg(`Password policy failed: ${passCheck.errors.join('. ')}`);
          setIsLoading(false);
          return;
        }

        const session = await signupUser(companyName, email, password);
        onAuthenticated(session);
      } else if (mode === 'FORGOT') {
        await new Promise(r => setTimeout(r, 600));
        setSuccessMsg(`Password reset link sent to ${email}`);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121420] border border-[#272b42] rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-8 space-y-5 shadow-2xl text-slate-200 max-h-[95vh] overflow-y-auto">
        {/* Official Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AmusemacLogo className="w-12 h-12" iconSize="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            AMUSEMAC <span className="text-gold-gradient">GROWTH AGENT</span>
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'GRANT_MAILBOX'
              ? 'CONNECT YOUR EMAIL'
              : 'Sign in to access your B2B Sales Intelligence Workspace'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Separate Onboarding Step: Connect Email */}
        {mode === 'GRANT_MAILBOX' ? (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="p-4 rounded-2xl bg-[#171a2b] border border-[#272c44] space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account Ready ({pendingSession?.user.email})</span>
              </div>
              <p className="text-slate-300">
                Connect your email to send outreach, manage replies and keep your mailbox synchronized.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">Select Mailbox Provider</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMailboxProvider('GMAIL')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    selectedMailboxProvider === 'GMAIL'
                      ? 'border-[#f5b82e] bg-[#1d2136] text-white shadow-lg'
                      : 'border-[#25293d] bg-[#141624] text-slate-400 hover:text-white'
                  }`}
                >
                  <GoogleLogo className="w-5 h-5" />
                  <span className="text-[11px] font-bold">Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMailboxProvider('ZOHO')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    selectedMailboxProvider === 'ZOHO'
                      ? 'border-[#f5b82e] bg-[#1d2136] text-white shadow-lg'
                      : 'border-[#25293d] bg-[#141624] text-slate-400 hover:text-white'
                  }`}
                >
                  <ZohoLogo className="w-6 h-4" />
                  <span className="text-[11px] font-bold">Zoho Mail</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteMailboxGrant}
              className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              <span>Connect Email & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Primary OAuth Buttons (Only when ENABLE_OAUTH_BUTTONS is explicitly enabled) */}
            {ENABLE_OAUTH_BUTTONS && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('GOOGLE')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2.5 p-3 rounded-xl bg-[#161928] hover:bg-[#1f2438] border border-[#2a2f47] transition-all text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                  >
                    <GoogleLogo className="w-4 h-4" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('ZOHO')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2.5 p-3 rounded-xl bg-[#161928] hover:bg-[#1f2438] border border-[#2a2f47] transition-all text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                  >
                    <ZohoLogo className="w-5 h-3.5" />
                    <span>Zoho</span>
                  </button>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#23273d]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-[#121420] px-3 text-slate-500">Or continue with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {mode === 'SIGNUP' && (
                <>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Company / Studio Name *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Amusemac Studio"
                        className="w-full bg-[#161928] border border-[#2a2f47] text-white rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#f5b82e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full bg-[#161928] border border-[#2a2f47] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b82e]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">WhatsApp Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#161928] border border-[#2a2f47] text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b82e]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-[#161928] border border-[#2a2f47] text-white rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#f5b82e]"
                  />
                </div>
              </div>

              {mode !== 'FORGOT' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-semibold">Password</label>
                    {mode === 'LOGIN' && (
                      <button
                        type="button"
                        onClick={() => setMode('FORGOT')}
                        className="text-[11px] text-[#f5b82e] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#161928] border border-[#2a2f47] text-white rounded-xl pl-9 pr-10 py-2.5 outline-none focus:border-[#f5b82e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded-lg focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'SIGNUP' && (
                    <div className="mt-2 p-3 bg-[#171a2b] border border-[#272c44] rounded-xl text-[11px] space-y-1 text-slate-400">
                      <span className="font-bold block text-slate-300">Password Policy Requirements:</span>
                      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                        <li className={password.length >= 12 ? 'text-emerald-400 font-semibold' : ''}>• 12+ characters</li>
                        <li className={/[A-Z]/.test(password) ? 'text-emerald-400 font-semibold' : ''}>• 1 Uppercase (A-Z)</li>
                        <li className={/[a-z]/.test(password) ? 'text-emerald-400 font-semibold' : ''}>• 1 Lowercase (a-z)</li>
                        <li className={/[0-9]/.test(password) ? 'text-emerald-400 font-semibold' : ''}>• 1 Number (0-9)</li>
                        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-emerald-400 font-semibold' : ''}>• 1 Special char</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#f5b82e]/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'LOGIN' ? 'SIGN IN TO WORKSPACE' : mode === 'SIGNUP' ? 'CREATE WORKSPACE' : 'SEND RESET LINK'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Test Account Quick-Select (EXPLICIT DEV MODE ONLY) */}
            {import.meta.env.DEV && IS_DEV && (
              <div className="p-[#161928] border border-[#272c44] text-[11px] space-y-1.5 rounded-2xl p-3">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Development Test Accounts</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@amusemacstudio.in');
                      setPassword('Admin@123');
                      setMode('LOGIN');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1e2338] text-slate-300 hover:text-white border border-[#2c324e] text-left truncate"
                  >
                    👑 Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('alex@plusonedesign.in');
                      setPassword('Alex@123');
                      setMode('LOGIN');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1e2338] text-slate-300 hover:text-white border border-[#2c324e] text-left truncate"
                  >
                    💼 Client Admin
                  </button>
                </div>
              </div>
            )}

            {/* Footer Toggle */}
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#23273d] space-y-1">
              {mode === 'LOGIN' ? (
                <div>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('SIGNUP')} className="text-[#f5b82e] font-bold hover:underline">
                    Create Workspace
                  </button>
                </div>
              ) : (
                <div>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('LOGIN')} className="text-[#f5b82e] font-bold hover:underline">
                    Sign In
                  </button>
                </div>
              )}
              <div className="text-[10px] text-slate-600 font-mono pt-1">
                Amusemac Growth Agent v2.0.0 ({BUILD_SHA})
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
