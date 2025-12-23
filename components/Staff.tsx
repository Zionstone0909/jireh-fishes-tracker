
import React, { useState } from 'react';
import { UserCheck, Clock, UserX, Calendar, Plus, Search, Loader2, X, Users, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button, Input, Select, BackButton } from './Shared';
import { StaffMember, Role } from '../types';

interface StaffProps {
    onBack?: () => void;
}

export const Staff = ({ onBack }: StaffProps) => {
  const { staff, addStaffMember, markAttendance, updateStaffStatus, user } = useApp();
  const isAdmin = user?.role === Role.ADMIN;

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', status: 'active' as StaffMember['status'] });

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.role) return;
      setIsSubmitting(true);
      try {
          await addStaffMember(formData);
          setFormData({ name: '', role: '', status: 'active' });
          setShowAddModal(false);
      } finally {
          setIsSubmitting(false);
      }
  };

  const getStatusColor = (status: StaffMember['status']) => {
      switch(status) {
          case 'active': return 'green';
          case 'on-leave': return 'orange';
          case 'absent': return 'red';
          default: return 'gray';
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <BackButton onClick={onBack} />
           <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Personnel Roster</h1>
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Management of labor force & attendance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                    placeholder="Filter by name or role..."
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white shadow-sm transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            {isAdmin && (
                <Button onClick={() => setShowAddModal(true)} className="!rounded-2xl !px-6 py-3 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
                    <Plus className="w-4 h-4 mr-1.5" /> Register Staff
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <Card 
            key={member.id} 
            className="p-6 relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 ring-1 ring-slate-100 bg-white rounded-[2.5rem] overflow-hidden"
            style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform ${
                  member.status === 'active' ? 'bg-indigo-600 shadow-indigo-200' : 
                  member.status === 'on-leave' ? 'bg-orange-500 shadow-orange-200' : 'bg-red-500 shadow-red-200'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{member.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{member.role}</p>
                </div>
              </div>
              <Badge color={getStatusColor(member.status)} className="!px-3 !py-1 !rounded-xl !text-[9px]">
                {member.status}
              </Badge>
            </div>

            <div className="space-y-5 pt-6 border-t border-slate-50 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" /> Attendance Score
                </span>
                <span className="text-sm font-black text-slate-900">{Array.isArray(member.attendance) ? member.attendance.length : 0} Days</span>
              </div>
              
              <div className="flex gap-3">
                {isAdmin && (
                    <Select 
                        value={member.status} 
                        onChange={(e) => updateStaffStatus(member.id, e.target.value as any)}
                        className="!py-2 !px-3 !text-[10px] !font-black !uppercase !tracking-widest !rounded-xl !border-slate-100 !bg-slate-50/50"
                    >
                        <option value="active">Active</option>
                        <option value="absent">Absent</option>
                        <option value="on-leave">Leave</option>
                    </Select>
                )}
                <button 
                  onClick={() => markAttendance(member.id)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95"
                >
                  <UserCheck size={14} /> Check-In
                </button>
              </div>
            </div>
          </Card>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-full py-32 text-center flex flex-col items-center opacity-30">
             <Users size={64} className="mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em]">No staff members found</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <Card className="w-full max-w-md p-8 shadow-2xl rounded-[3rem] border-0 bg-white overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-black text-xs uppercase tracking-[0.25em] text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600"><Users size={20} /></div> Add Personnel
               </h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 rounded-2xl hover:bg-slate-100 transition-colors text-slate-400"><X size={24} /></button>
             </div>
             <form onSubmit={handleAddStaff} className="space-y-6">
                <Input label="FULL NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="!rounded-2xl" placeholder="Ademola..." />
                <Input label="OPERATIONAL ROLE" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="!rounded-2xl" placeholder="Warehouse, Sales, etc." />
                <Select label="INITIAL STATUS" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="!rounded-2xl">
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="absent">Absent</option>
                </Select>
                <div className="flex gap-4 pt-6">
                   <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1 py-4 !rounded-2xl font-black uppercase text-[10px] tracking-widest">Abort</Button>
                   <Button type="submit" disabled={isSubmitting} className="flex-1 py-4 !rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Node'}
                   </Button>
                </div>
             </form>
           </Card>
        </div>
      )}
    </div>
  );
};
