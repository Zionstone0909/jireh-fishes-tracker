
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { 
  Trash2, Copy, Check, Mail, Loader2, RefreshCw, 
  User, Shield, UserPlus, Target, ShieldCheck, 
  UserCheck, X, Camera, Lock, Eye, LogOut, Database,
  Download, Upload, Server, Key
} from 'lucide-react';
import { Card, Badge, Button, Input, Select } from './Shared';

export const Settings = () => {
  const { 
    user, users, createInvitation, invitations, toggleUserStatus, 
    logs, updateUserProfile, logout, generateSyncKey, importFromSyncKey,
    lastSync, syncData
  } = useApp();
  
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncKey, setSyncKey] = useState('');
  const [importKey, setImportKey] = useState('');
  const [importStatus, setImportStatus] = useState({ text: '', type: '' });
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

  const handleManualSync = async () => {
      setIsSyncing(true);
      try {
          await syncData();
          setProfileMsg({ text: 'Cloud nodes synchronized.', type: 'success' });
      } finally {
          setIsSyncing(false);
      }
  };

  const handleGenerateKey = () => {
      const key = generateSyncKey();
      setSyncKey(key);
      navigator.clipboard.writeText(key);
      setImportStatus({ text: 'Sync Key generated and copied to clipboard.', type: 'success' });
  };

  const handleImportKey = () => {
      if (!importKey) return;
      const success = importFromSyncKey(importKey);
      if (success) {
          setImportStatus({ text: 'Data restored successfully from key.', type: 'success' });
          setImportKey('');
      } else {
          setImportStatus({ text: 'Invalid or corrupt Sync Key.', type: 'error' });
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
        <div className="flex gap-2">
            <Button onClick={handleManualSync} disabled={isSyncing} variant="secondary" className="!rounded-xl !px-4 !text-[10px] !font-black !uppercase !tracking-widest">
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                {isSyncing ? 'Syncing...' : 'Cloud Sync'}
            </Button>
            <Button onClick={logout} variant="secondary" className="!text-red-500 !border-red-100 hover:!bg-red-50 !rounded-xl !px-4 !text-[10px] !font-black !uppercase !tracking-widest">
                <LogOut size={14} /> Kill Session
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
              {/* CSS Conflict Fixed: Removed 'relative' from sticky element */}
              <Card className="p-8 rounded-[2.5rem] border-0 shadow-2xl bg-white sticky top-24 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                  <div className="flex flex-col items-center text-center mb-10">
                      <div className="relative group mb-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-indigo-600 relative overflow-hidden transition-transform duration-500 group-hover:scale-105">
                           <User size={40} strokeWidth={2.5} />
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-colors scale-90 opacity-0 group-hover:opacity-100">
                           <Camera size={14} />
                        </button>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{user?.name}</h2>
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.25em] bg-indigo-50 px-3 py-1 rounded-full mt-2 border border-indigo-100">{user?.role} ACCESS</p>
                  </div>
                  
                  {profileMsg.text && (
                    <div className={`p-4 rounded-2xl mb-8 text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <ShieldCheck size={14} /> {profileMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <Input label="LEGAL IDENTITY" value={profileName} onChange={e => setProfileName(e.target.value)} className="!rounded-xl !bg-slate-50/50" />
                      <Input label="SYSTEM CREDENTIAL" value={user?.email || ''} disabled className="!rounded-xl !bg-slate-100 !text-slate-400" />
                      <Button type="submit" disabled={isUpdatingProfile} className="w-full py-4 !rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">
                          {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Profile Change'}
                      </Button>
                  </form>
              </Card>

              <Card className="p-8 rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-6 flex items-center gap-2">
                      <Database size={16} /> Sync & Backup Hub
                  </h3>
                  
                  <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Cross-Device Migration</p>
                          <Button onClick={handleGenerateKey} variant="primary" className="w-full !bg-indigo-600 !py-3 !rounded-xl !text-[10px]">
                              <Key size={14} /> Generate Sync Key
                          </Button>
                          <p className="text-[9px] text-slate-500 mt-2 italic leading-tight uppercase font-black">Copy this key to your new device to transfer all data instantly.</p>
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Restore State</p>
                          <textarea 
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-indigo-300 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none mb-3"
                              rows={3}
                              placeholder="Paste Sync Key here..."
                              value={importKey}
                              onChange={e => setImportKey(e.target.value)}
                          />
                          <Button onClick={handleImportKey} variant="secondary" className="w-full !bg-white/10 !text-white !border-white/10 !py-3 !rounded-xl !text-[10px]" disabled={!importKey}>
                              <Upload size={14} /> Restore from Key
                          </Button>
                      </div>
                      
                      {importStatus.text && (
                          <div className={`p-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${importStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {importStatus.text}
                          </div>
                      )}

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center opacity-60">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Node State</span>
                          <Badge color="blue" className="!bg-white/10 !text-indigo-300 !border-white/20 !px-2">{lastSync ? 'Synchronized' : 'Offline'}</Badge>
                      </div>
                  </div>
              </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
              {user?.role === Role.ADMIN ? (
                <>
                  <Card className="p-8 rounded-[2.5rem] border-0 shadow-xl bg-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl pointer-events-none"></div>
                      <h2 className="text-xs font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-[0.25em]">
                          <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><UserPlus size={20} /></div> Access Provisioning
                      </h2>
                      
                      {inviteMsg.text && (
                          <div className={`p-4 rounded-2xl mb-8 text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${inviteMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                              <Check size={14} /> {inviteMsg.text}
                          </div>
                      )}

                      <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input label="ENTITY NAME" required value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Adebayo Kunle" className="!rounded-xl" />
                          <Input label="TARGET CHANNEL (EMAIL)" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@jirehfishes.com" className="!rounded-xl" />
                          <Select label="OPERATIONAL ROLE" value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="!rounded-xl">
                              <option value={Role.STAFF}>STANDARD STAFF</option>
                              <option value={Role.ADMIN}>ADMINISTRATOR</option>
                          </Select>
                          <div className="flex items-end">
                              <Button disabled={isInviting} type="submit" className="w-full py-4 !rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-indigo-100">
                                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Credentials'}
                              </Button>
                          </div>
                      </form>

                      {generatedLink && (
                          <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white border border-slate-800 shadow-2xl animate-in zoom-in-95 overflow-hidden group">
                              <label className="block text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Secured Onboarding Link</label>
                              <div className="flex flex-col sm:flex-row gap-4">
                                  <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl text-[10px] font-mono text-indigo-200 break-all">
                                      {generatedLink}
                                  </div>
                                  <button onClick={copyLink} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-4 sm:py-0 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shrink-0">
                                      <Copy size={14} /> Capture
                                  </button>
                              </div>
                          </div>
                      )}
                  </Card>

                  <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.25em]">Registered Node Pool</h2>
                        <span className="text-[9px] font-black text-indigo-600 bg-white border border-slate-200 px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-sm">{users.length} Active Node(s)</span>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/30 uppercase text-slate-400 font-black text-[8px] tracking-[0.3em] border-b border-slate-50">
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
                                    <div className="font-black text-slate-900 tracking-tight text-sm">{u.name}</div>
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
                                            <Eye size={16} />
                                        </button>
                                        {u.id !== user?.id && (
                                            <button 
                                                onClick={() => toggleUserStatus(u.id, !!u.isActive)}
                                                className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${u.isActive ? 'bg-white text-red-500 border-red-100 shadow-sm' : 'bg-emerald-600 text-white border-emerald-600 shadow-lg'}`}
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
                                  <div key={log.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center group hover:bg-white/10 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-indigo-500">
                                      <div className="min-w-0">
                                          <p className="font-black text-xs text-indigo-300 uppercase tracking-widest mb-1 group-hover:text-white transition-colors">{log.action}</p>
                                          <p className="text-sm font-medium text-slate-400 truncate tracking-tight">{log.details}</p>
                                      </div>
                                      <div className="text-right shrink-0 sm:ml-6 mt-3 sm:mt-0 flex sm:flex-col gap-4 sm:gap-0">
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                                          <p className="text-[9px] font-black text-indigo-500/80 group-hover:text-indigo-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                  </div>
                              ))}
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
