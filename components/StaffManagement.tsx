import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Loader2, ArrowRight, XCircle, Mail, User as UserIcon, Copy, Trash2 } from 'lucide-react';

interface StaffManagementProps { onBack: () => void; }

export const StaffManagement = ({ onBack }: StaffManagementProps) => {
    const { createInvitation, revokeInvitation, users, invitations } = useApp();
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>(Role.STAFF);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateInvite = async () => {
        if (!inviteName || !inviteEmail) return alert('Name and Email required.');
        setIsSubmitting(true);
        try {
            const token = await createInvitation(inviteName, inviteEmail, inviteRole);
            const link = `${window.location.origin}/join?token=${token}&email=${encodeURIComponent(inviteEmail)}`;
            await navigator.clipboard.writeText(link);
            alert(`SUCCESS! Invitation created and link copied to clipboard:\n\n${link}`);
            setInviteName(''); setInviteEmail('');
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally { setIsSubmitting(false); }
    };

    const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

    return (
        <div className="max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={onBack} className="text-indigo-600 font-semibold mb-6 flex items-center group">
                <ArrowRight className="w-4 h-4 rotate-180 mr-2" /> Back
            </button>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">Staff Management</h1>
                
                {/* Invitation Creator */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="Staff Name" value={inviteName} onChange={e => setInviteName(e.target.value)} className="p-3 rounded-xl border border-slate-300 font-bold text-sm" />
                        <input type="email" placeholder="Staff Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="p-3 rounded-xl border border-slate-300 font-bold text-sm" />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="p-3 rounded-xl border border-slate-300 text-sm font-bold bg-white">
                            <option value={Role.STAFF}>STAFF</option>
                            <option value={Role.ADMIN}>ADMIN</option>
                        </select>
                        <button onClick={handleCreateInvite} disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Generate Invite'}
                        </button>
                    </div>
                </div>

                {/* List */}
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pending Invites ({pendingInvitations.length})</h2>
                <div className="space-y-3">
                    {pendingInvitations.map(invite => (
                        <div key={invite.token} className="p-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                                <div className="font-black text-slate-800">{invite.name}</div>
                                <div className="text-xs text-slate-400">{invite.email}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    const link = `${window.location.origin}/join?token=${invite.token}&email=${encodeURIComponent(invite.email)}`;
                                    navigator.clipboard.writeText(link);
                                    alert("Link Copied!");
                                }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Copy size={18} /></button>
                                <button onClick={() => revokeInvitation(invite.token)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
