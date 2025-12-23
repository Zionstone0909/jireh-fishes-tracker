
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { 
  Trash2, Copy, Check, Mail, Loader2, RefreshCw, 
  User, Shield, UserPlus, Target, ShieldCheck, 
  UserCheck, X, Camera, Lock, Eye, LogOut 
} from 'lucide-react';
import { Card, Badge, Button, Input, Select } from './Shared';

export const Settings = () => {
  const { user, users, createInvitation, revokeInvitation, invitations, toggleUserStatus, logs, updateUserProfile, logout } = useApp();
  
  // -- General / Profile State --
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // -- Invite State --
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });
  
  const [selectedUserLogId, setSelectedUserLogId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user?.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdatingProfile(true);
      setProfileMsg({ text: '', type: '' });
      try {
          await updateUserProfile(profileName);
          setProfileMsg({ text: 'Subject profile updated successfully.', type: 'success' });
      } catch (err: any) {
          setProfileMsg({ text: 'Profile synchronization failed.', type: 'error' });
      } finally {
          setIsUpdatingProfile(false);
      }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInviting) return;

    setIsInviting(true);
    setInviteMsg({ text: '', type: '' });
    
    try {
      const token = await createInvitation(inviteName, inviteEmail, inviteRole);
      const link = `${window.location.origin}/login?token=${token}`;
      setGeneratedLink(link);
      setInviteMsg({ text: `Onboarding portal link generated for ${inviteName}`, type: 'success' });
      setInviteName('');
      setInviteEmail('');
    } catch (err: any) {
      setInviteMsg({ text: 'Access provisioning failure.', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const copyLink = () => {
      navigator.clipboard.writeText(generatedLink);
      setInviteMsg({ text: 'Link captured to secure clipboard.', type: 'success' });
  };

  const userLogs = selectedUserLogId 
    ? logs
        .filter(l => l.userId === selectedUserLogId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
<h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">System Core</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Platform configuration & security</p>
        </div>
        <Button onClick={logout} variant="secondary" className="!text-red-500 !border-red-100 hover:!bg-red-50 !rounded-xl !px-6 !text-[10px] !font-black !uppercase !tracking-widest">
            <LogOut size={16} /> Termination
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Personal Space */}
          <div className="lg:col-span-4 space-y-6">
<Card className="p-8 rounded-[2.5rem] border-0 shadow-2xl bg-white sticky top-24 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                  
                  <div className="flex flex-col items-center text-center mb-10">
                      <div className="relative group mb-6">
                        <div className="w-28 h-28 rounded-[2rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-indigo-600 relative overflow-hidden transition-transform duration-500 group-hover:scale-105">
                           <User size={48} strokeWidth={2.5} />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-colors scale-90 opacity-0 group-hover:opacity-100">
                           <Camera size={16} />
                        </button>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user?.name}</h2>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] bg-indigo-50 px-4 py-1 rounded-full mt-2 border border-indigo-100">{user?.role} ACCESS</p>
                  </div>
                  
                  {profileMsg.text && (
                    <div className={`p-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <ShieldCheck size={16} /> {profileMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <Input 
                        label="LEGAL IDENTITY" 
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)}
                        className="!rounded-2xl !bg-slate-50/50 !border-slate-100"
                        placeholder="Verified Full Name"
                      />
                      <Input 
                        label="SYSTEM CREDENTIAL" 
                        value={user?.email || ''} 
                        disabled 
                        className="!rounded-2xl !bg-slate-100 !text-slate-400 !cursor-not-allowed !opacity-50 !border-transparent"
                      />
                                  <Button type="submit" disabled={isUpdatingProfile} className="w-full py-4 !rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">
                          {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Synchronize Profile'}
                      </Button>
                  </form>
                  
                  <div className="mt-10 pt-8 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Security Tier</span>
                          <span className="text-indigo-600 flex items-center gap-1"><Lock size={10} /> Tier 0{user?.role === Role.ADMIN ? '1' : '2'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Auth Context</span>
                          <span className="text-slate-800">Verified Node</span>
                      </div>
                  </div>
              </Card>
          </div>

          {/* Right Column: Master Control (Admin Only) */}
          <div className="lg:col-span-8 space-y-8">
              {user?.role === Role.ADMIN ? (
                <>
                  <Card className="p-8 rounded-[2.5rem] border-0 shadow-xl bg-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl pointer-events-none"></div>
                      <h2 className="text-xs font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-[0.25em]">
                          <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><UserPlus size={20} /></div> Access Provisioning
                      </h2>
                      
                      {inviteMsg.text && (
                          <div className={`p-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${inviteMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                              <Check size={16} /> {inviteMsg.text}
                          </div>
                      )}

                      <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="ENTITY NAME" required value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Adebayo Kunle" className="!rounded-2xl" />
                          <Input label="TARGET CHANNEL (EMAIL)" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@jirehfishes.com" className="!rounded-2xl" />
                          <Select label="OPERATIONAL ROLE" value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="!rounded-2xl">
                              <option value={Role.STAFF}>STANDARD STAFF</option>
                              <option value={Role.ADMIN}>ADMINISTRATOR</option>
                          </Select>
                          <div className="flex items-end">
                              <Button disabled={isInviting} type="submit" className="w-full py-4 !rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-indigo-100">
                                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deploy Invite'}
                              </Button>
                          </div>
                      </form>

                      {generatedLink && (
                          <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white border border-slate-800 shadow-2xl animate-in zoom-in-95 overflow-hidden group">
                              <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Secured Onboarding Link</label>
                              <div className="flex flex-col sm:flex-row gap-4">
                                  <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-mono text-indigo-200 break-all select-all">
                                      {generatedLink}
                                  </div>
                                  <button onClick={copyLink} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 sm:py-0 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2 shrink-0">
                                      <Copy size={16} /> Capture
                                  </button>
                              </div>
                          </div>
                      )}
                  </Card>

                  <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.25em]">Registered Node Pool</h2>
                        <span className="text-[10px] font-black text-indigo-600 bg-white border border-slate-200 px-5 py-2 rounded-full uppercase tracking-[0.2em] shadow-sm">{users.length} Active Node(s)</span>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/30 uppercase text-slate-400 font-black text-[9px] tracking-[0.3em] border-b border-slate-50">
                            <tr>
                                <th className="p-8">Entity Profile</th>
                                <th className="p-8">Security Tier</th>
                                <th className="p-8">Operational Status</th>
                                <th className="p-8 text-right">Directives</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-8">
                                    <div className="font-black text-slate-900 tracking-tight">{u.name}</div>
                                    <div className="text-slate-400 text-xs font-medium">{u.email}</div>
                                </td>
                                <td className="p-8">
                                    <Badge color={u.role === Role.ADMIN ? 'indigo' : 'gray'} className="!rounded-lg">{u.role}</Badge>
                                </td>
                                <td className="p-8">
                                    <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'OPERATIONAL' : 'OFFLINE'}</Badge>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button 
                                            onClick={() => setSelectedUserLogId(selectedUserLogId === u.id ? null : u.id)}
                                            className={`p-2.5 rounded-xl border transition-all ${selectedUserLogId === u.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}
                                            title="Inspect Audit Logs"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {u.id !== user?.id && (
                                            <button 
                                                onClick={() => toggleUserStatus(u.id, !!u.isActive)}
                                                className={`text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl border transition-all ${u.isActive ? 'bg-white text-red-500 border-red-100 hover:bg-red-50 shadow-sm' : 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'}`}
                                            >
                                                {u.isActive ? 'Suspend' : 'Activate'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                  </Card>

                  {selectedUserLogId && (
                      <Card className="p-8 bg-slate-900 text-white rounded-[2.5rem] border-0 shadow-2xl animate-in slide-in-from-bottom-6 overflow-hidden ring-4 ring-indigo-500/10">
                          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <h3 className="text-[10px] font-black flex items-center gap-4 uppercase tracking-[0.3em] text-indigo-400">
                                <div className="p-2.5 bg-white/10 rounded-xl text-white"><RefreshCw size={18} strokeWidth={3} /></div> Real-time Node Activity Feed
                            </h3>
                            <button onClick={() => setSelectedUserLogId(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-slate-400 hover:text-white"><X size={20} /></button>
                          </div>
                          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 no-scrollbar">
                              {userLogs.map(log => (
                                  <div key={log.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center group hover:bg-white/10 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-indigo-500">
                                      <div className="min-w-0">
                                          <p className="font-black text-xs text-indigo-300 uppercase tracking-widest mb-1 group-hover:text-white transition-colors">{log.action}</p>
                                          <p className="text-sm font-medium text-slate-400 truncate tracking-tight">{log.details}</p>
                                      </div>
                                      <div className="text-right shrink-0 sm:ml-6 mt-3 sm:mt-0 flex sm:flex-col gap-4 sm:gap-0">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                                          <p className="text-[10px] font-black text-indigo-500/80 group-hover:text-indigo-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                  </div>
                              ))}
                              {userLogs.length === 0 && (
                                  <div className="text-center py-24 opacity-20 flex flex-col items-center gap-4">
                                      <Target size={64} />
                                      <p className="font-black text-[10px] uppercase tracking-[0.5em]">Zero Activity Detected</p>
                                  </div>
                              )}
                          </div>
                      </Card>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center bg-slate-50/50 border-dashed border-2 border-slate-200 rounded-[2.5rem]">
                    <Shield className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Administrative Domain</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 max-w-sm mx-auto leading-relaxed">Cross-user management and system audit logs are restricted to Level 01 Administrative Units.</p>
                </Card>
              )}
          </div>
      </div>
    </div>
  );
};
