import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { CheckCircle, Lock, Mail, User, Loader2 } from 'lucide-react';

const RegisterStaff = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { register } = useApp();
    
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [token] = useState(searchParams.get('token') || '');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        // Validate token against backend
        const validateToken = async () => {
            try {
                const response = await fetch(`/api/invitations/validate/${token}`);
                if (response.ok) setIsValid(true);
            } catch (err) { setIsValid(false); }
            finally { setIsVerifying(false); }
        };
        if (token) validateToken();
        else setIsVerifying(false);
    }, [token]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(name, email, password, Role.STAFF, token);
            alert('Account Activated! Link established.');
            navigate('/login');
        } catch (err: any) { alert(err.message); }
    };

    if (isVerifying) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!isValid) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">INVALID OR EXPIRED INVITE LINK</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="text-green-500 w-8 h-8" />
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Activate Node</h1>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Assigned Email</label>
                        <div className="flex items-center p-3 bg-slate-100 rounded-xl text-slate-500 font-bold border border-slate-200">
                            <Mail size={18} className="mr-2" /> {email}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Full Legal Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-bold" placeholder="Sundays Joseph" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">Create Security Key</label>
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-bold" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Activate Access</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterStaff;
