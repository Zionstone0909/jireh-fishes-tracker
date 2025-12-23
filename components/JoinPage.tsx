
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Lock, ArrowRight, ShieldCheck, Mail, Users, 
  CheckCircle, Loader2, XCircle, Fish, ShieldAlert 
} from 'lucide-react';
import { Input, Button, Card } from './Shared';

export const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { validateInvitation, acceptInvitation } = useApp();

  const [token] = useState(searchParams.get('token') || '');
  const [email] = useState(searchParams.get('email') || '');
  
  const [status, setStatus] = useState<'validating' | 'ready' | 'error'>('validating');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing security token. Access denied.');
      return;
    }

    const checkToken = async () => {
      try {
        const data = await validateInvitation(token);
        setInvitationData(data);
        setFormData(prev => ({ ...prev, name: data.name }));
        setStatus('ready');
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Invitation is invalid or has expired.');
      }
    };

    checkToken();
  }, [token, validateInvitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Security key must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await acceptInvitation(token, formData.name, formData.password);
      // Registration successful, AppContext handles login & redirect
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to establish account node.');
      setIsLoading(false);
    }
  };

  if (status === 'validating') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Validating Access Node...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-10 text-center rounded-[3rem] border-0 shadow-2xl bg-white">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-6">
            <XCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Denied</h2>
          <p className="text-slate-500 font-medium mb-8">{error}</p>
          <Button onClick={() => navigate('/login')} className="w-full py-4 !rounded-2xl">Return to Portal</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg">
        <Card className="p-10 rounded-[3rem] border-0 shadow-2xl bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 mx-auto mb-4 border border-indigo-100 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Activate Node</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-2">Personnel Registry Verified</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400"><Mail size={16} /></div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized Email</p>
                <p className="text-sm font-bold text-slate-700">{invitationData.email}</p>
              </div>
              <div className="ml-auto">
                <span className="text-[8px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg uppercase">Link Active</span>
              </div>
            </div>

            <Input 
              label="FULL LEGAL IDENTITY" 
              placeholder="Confirm your name..." 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="SECURITY KEY" 
                type="password" 
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
              <Input 
                label="RE-VERIFY KEY" 
                type="password" 
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full py-5 !rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-100 mt-4">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Finalize Access Node <ArrowRight size={18} className="ml-2" /></>}
            </Button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-slate-50 text-center flex flex-col items-center gap-3">
             <Fish size={24} className="text-slate-200" />
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Jireh Fishes System Protocol © 2025</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
