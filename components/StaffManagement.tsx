
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Role, UserSystemStatus } from '../types';
import { 
    Loader2, ArrowRight, XCircle, Mail, 
    User as UserIcon, ShieldAlert, History, 
    Power, Trash2, Clock, CheckCircle, 
    PauseCircle, UserMinus, MoreVertical, 
    LogOut, Database, Key, RefreshCw,
    Search, Filter, ShieldCheck, Zap
} from 'lucide-react';
import { Card, Badge, Button, Input, Select } from './Shared';

interface StaffManagementProps {
    onBack: () => void;
}

export const StaffManagement = ({ onBack }: StaffManagementProps) => {
    const { 
        createInvitation, revokeInvitation, users, 
        invitations, updateUserStatus, deleteUserNode,
        generateSyncKey, importFromSyncKey, lastSync, syncData
    } = useApp();

    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [userSearch, setUserSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'SUSPENDED'>('ALL');

    const handleCreateInvite = async () => {
        if (!inviteName || !inviteEmail) {
            alert('Name and Email are required.');
            return;
        }
        
        if (users.some(u => u.email.toLowerCase() === inviteEmail.toLowerCase())) {
             alert(`User with email ${inviteEmail} is already registered.`);
             return;
        }

        setIsSubmitting(true);
        try {
            const token = await createInvitation(inviteName, inviteEmail, inviteRole);
            const invitationLink = `${window.location.origin}/join?token=${token}&email=${encodeURIComponent(inviteEmail)}`;
            
            // In a production app, the server would send an email. For this implementation, we display the link.
            alert(`
                SUCCESS! Node Invitation generated.
                
                Send this secure link to the staff member:
                ${invitationLink}
            `);
            
            setInviteName('');
            setInviteEmail('');
        } catch (error: any) {
            alert(`Provisioning failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevokeInvite = async (token: string, name: string) => {
        if (window.confirm(`Revoke invitation for ${name}?`)) {
            await revokeInvitation(token);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`CRITICAL ACTION: Purge all credentials and records for ${name}? This cannot be reversed.`)) {
            await deleteUserNode(id);
        }
    };

    const handleStatusChange = async (id: string, status: UserSystemStatus) => {
        await updateUserStatus(id, status);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
            if (!matchesSearch) return false;

            if (filterStatus === 'ONLINE') return u.isOnline;
            if (filterStatus === 'OFFLINE') return !u.isOnline && u.systemStatus === 'OPERATIONAL';
            if (filterStatus === 'SUSPENDED') return u.systemStatus !== 'OPERATIONAL';
            return true;
        });
    }, [users, userSearch, filterStatus]);

    const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center group">
                        <ArrowRight className="w-4 h-4 rotate-180 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Personnel Command</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Operational control & session tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Controls */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-8 rounded-[2.5rem] border-0 shadow-2xl bg-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <h2 className="text-[10px] font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-[0.3em]">
                            <div className="p-2 bg-indigo-50 rounded-2xl text-indigo-600"><UserIcon size={18} /></div> Issue Access
                        </h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateInvite(); }} className="space-y-5">
                            <Input label="Staff Name" required value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full legal name..." />
                            <Input label="System Email" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@jirehfishes.com" />
                            <Select label="Access Tier" value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}>
                                <option value={Role.STAFF}>Operational Staff</option>
                                <option value={Role.ADMIN}>Administrative Level</option>
                            </Select>
                            <Button disabled={isSubmitting} type="submit" className="w-full py-4 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 mt-4">
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Generate Secure Link'}
                            </Button>
                        </form>
                    </Card>

                    <Card className="p-8 rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400"></div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[10px] font-black flex items-center gap-3 text-indigo-300 uppercase tracking-[0.3em]">
                                <History size={16} /> Session Metrics
                            </h2>
                        </div>
                        <div className="space-y-6">
                             <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Now</span>
                                <span className="text-2xl font-black text-emerald-400">{users.filter(u => u.isOnline).length}</span>
                             </div>
                             <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Nodes</span>
                                <span className="text-2xl font-black text-indigo-400">{users.length}</span>
                             </div>
                        </div>
                    </Card>
                </div>

                {/* Right side: Lists */}
                <div className="lg:col-span-8 space-y-8">
                    {/* ACTIVE NODES */}
                    <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Power size={14} className="text-emerald-500" /> Authorized Personnel Pool
                                </h2>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Real-time status monitoring</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold w-full sm:w-48 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Search pool..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                >
                                    <option value="ALL">All Nodes</option>
                                    <option value="ONLINE">Online Now</option>
                                    <option value="OFFLINE">Offline Nodes</option>
                                    <option value="SUSPENDED">Inactive/Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/30 uppercase text-slate-400 font-black text-[8px] tracking-[0.3em] border-b border-slate-50">
                                    <tr>
                                        <th className="p-6">Personnel Node</th>
                                        <th className="p-6">Registry Status</th>
                                        <th className="p-6">Last Handshake</th>
                                        <th className="p-6 text-right">Operational Directives</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner relative transition-transform group-hover:scale-105 ${u.isOnline ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                        {u.name.charAt(0)}
                                                        {u.isOnline && (
                                                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-sm"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                                            {u.name}
                                                            {/* Fixed: Wrapped Zap icon in a span with title attribute as Lucide icons don't support title prop */}
                                                            {u.role === Role.ADMIN && (
                                                                <span title="Admin Root Access">
                                                                    <Zap size={12} className="text-amber-500 fill-amber-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-2">
                                                    <Badge color={
                                                        u.systemStatus === 'OPERATIONAL' ? 'green' : 
                                                        u.systemStatus === 'SUSPENDED' ? 'red' : 'orange'
                                                    }>
                                                        {u.systemStatus}
                                                    </Badge>
                                                    {u.isOnline ? (
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div> Node Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div> Node Dormant
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                                                        <Clock size={10} className="text-slate-300" /> 
                                                        IN: {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NEVER'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase">
                                                        <LogOut size={10} className="text-slate-300" /> 
                                                        OUT: {u.lastLogout ? new Date(u.lastLogout).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {u.systemStatus === 'OPERATIONAL' ? (
                                                        <>
                                                            <button onClick={() => handleStatusChange(u.id, 'ON_HOLD')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-orange-400 hover:text-orange-600 hover:border-orange-100 transition-all shadow-sm" title="Freeze Account"><PauseCircle size={16} /></button>
                                                            <button onClick={() => handleStatusChange(u.id, 'SUSPENDED')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-red-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm" title="Revoke Permission"><UserMinus size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleStatusChange(u.id, 'OPERATIONAL')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Restore</button>
                                                    )}
                                                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm ml-2" title="Purge Node"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* PENDING INVITATIONS */}
                    {pendingInvitations.length > 0 && (
                        <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/30">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pending Activation Tokens</h2>
                                <Badge color="gray">{pendingInvitations.length} Issued</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingInvitations.map(invite => (
                                    <div key={invite.token} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Zap size={64} /></div>
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge color="indigo" className="!px-2 !rounded-lg">{invite.role}</Badge>
                                                <button onClick={() => handleRevokeInvite(invite.token, invite.name)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><XCircle size={18} /></button>
                                            </div>
                                            <h3 className="font-black text-slate-900 text-sm tracking-tight">{invite.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 truncate mt-1">{invite.email}</p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                                            <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Valid Link</span>
                                            <button 
                                                onClick={() => {
                                                    const link = `${window.location.origin}/join?token=${invite.token}&email=${encodeURIComponent(invite.email)}`;
                                                    navigator.clipboard.writeText(link);
                                                    alert("Portal link re-captured to clipboard.");
                                                }}
                                                className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                Copy Portal URL
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
