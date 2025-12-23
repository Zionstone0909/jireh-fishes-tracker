
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for actual redirection
import { useApp } from '../context/AppContext'; 
import { Role, AppUser } from '../types'; 
import { 
  Lock, AlertCircle, ArrowRight, Shield, 
  BarChart3, Users, Mail, ArrowLeft, 
  CheckCircle, LucideIcon, Fish 
} from 'lucide-react';

interface InputFieldProps {
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}

const InputField = ({ label, icon: Icon, type = "text", placeholder, value, onChange, autoFocus, autoComplete }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200" />
      </div>
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all duration-200 font-medium shadow-sm"
        placeholder={placeholder}
        required
      />
    </div>
  </div>
);

export const LoginPage = () => {
  const { login, register, resetPassword } = useApp(); 
  const navigate = useNavigate(); // Hook to trigger URL changes
  
  const [view, setView] = useState<'login' | 'forgot' | 'register_staff'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchView = (newView: 'login' | 'forgot' | 'register_staff') => {
    setView(newView);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const ADMIN_EMAIL = 'hannahakanni7@gmail.com';
    const ADMIN_PASS = '1234567890';

    try {
      let loggedInUser: AppUser;

      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        try {
          loggedInUser = await login(email, password);
          setSuccess('Admin login authorized. Redirecting...');
        } catch (err: any) {
          // If admin doesn't exist in local storage yet, initialize it
          await register('System Admin', email, password, Role.ADMIN);
          loggedInUser = await login(email, password);
          setSuccess('Admin node initialized. Redirecting...');
        }
      } else {
        if (!email || !password) throw new Error('Input required fields.');
        loggedInUser = await login(email, password);
        setSuccess('Authentication successful. Establishing session...');
      }

      // REDIRECTION LOGIC
      setTimeout(() => {
        if (loggedInUser.role === Role.ADMIN) {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Access denied. Verify credentials.');
      setIsLoading(false);
    }
  };

  const handleStaffRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await register(name, email, password, Role.STAFF);
      setSuccess('Personnel registration completed. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failure.');
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Recovery link dispatched to registered email.');
      setTimeout(() => switchView('login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Recovery request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-5">
            <InputField label="System Email" icon={Mail} type="email" placeholder="user@jirehfishes.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="username" />
            <InputField label="Security Key" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => switchView('register_staff')} className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Request Access?</button>
              <button type="button" onClick={() => switchView('forgot')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Key recovery?</button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95">
              {isLoading ? 'Establishing Link...' : 'Sign In'}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
        );
      case 'register_staff':
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => switchView('login')} className="flex items-center text-blue-600 mb-4 hover:text-blue-700 font-medium text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-extrabold text-slate-900">Personnel Registry</h2>
            <form onSubmit={handleStaffRegistration} className="space-y-5">
              <InputField label="Full Legal Name" icon={Users} placeholder="Sunday Joseph" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <InputField label="System Email" icon={Mail} type="email" placeholder="you@jirehfishes.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              <InputField label="Create Password" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95">
                {isLoading ? 'Provisioning...' : 'Register Node'}
                {!isLoading && <CheckCircle className="h-5 w-5" />}
              </button>
            </form>
          </div>
        );
      case 'forgot':
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => switchView('login')} className="flex items-center text-blue-600 mb-4 hover:text-blue-700 font-medium text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
            <h2 className="text-3xl font-extrabold text-slate-900">Credential Recovery</h2>
            <form onSubmit={handleForgot} className="space-y-5">
              <InputField label="System Email" icon={Mail} type="email" placeholder="you@jirehfishes.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="email" />
              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95">
                {isLoading ? 'Dispatching...' : 'Send Recovery Link'}
                {!isLoading && <Mail className="h-5 w-5" />}
              </button>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-6 font-sans">
      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] lg:min-h-[700px]">
        <div className="hidden md:flex w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 relative flex-col justify-between p-10 lg:p-12 overflow-hidden text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Jireh Fishes</h1>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4">Precise Inventory & Ledger Control.</h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm">Synchronized staff operations, real-time sales tracking, and automated financial auditing.</p>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <BarChart3 className="w-6 h-6 text-blue-200" />
              <div>
                <p className="font-bold text-sm">Real-time BI</p>
                <p className="text-xs text-blue-200">Instant sales analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:scale-105">
              <Shield className="w-6 h-6 text-blue-200" />
              <div>
                <p className="font-bold text-sm">Audit Proof</p>
                <p className="text-xs text-blue-200">Secure transaction logging</p>
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-3xl" />
        </div>

        <div className="w-full md:w-7/12 p-6 md:p-10 lg:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md mx-auto w-full">
            {view === 'login' && (
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Node Access</h2>
                <p className="text-slate-500">Authorized personnel only.</p>
              </div>
            )}
            {error && (
              <div className="mb-6 flex items-start p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-start p-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <div>{success}</div>
              </div>
            )}
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};
