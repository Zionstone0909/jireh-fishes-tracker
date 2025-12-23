
import React from 'react';
import { UserCheck, Clock, UserX, Calendar } from 'lucide-react';
import { StaffMember } from '../types';

export const Staff: React.FC<{ staff: StaffMember[] }> = ({ staff }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  member.status === 'active' ? 'bg-green-500' : 
                  member.status === 'on-leave' ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-slate-500">{member.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                member.status === 'active' ? 'bg-green-100 text-green-700' : 
                member.status === 'on-leave' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {member.status}
              </span>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar size={14} /> Attendance (30d)
                </span>
                <span className="font-semibold text-slate-800">{member.attendance.length} days</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg text-xs font-bold text-slate-600 transition-colors flex items-center justify-center gap-1 border border-slate-200">
                  <Clock size={14} /> View Log
                </button>
                <button className="flex-1 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold text-blue-600 transition-colors flex items-center justify-center gap-1 border border-blue-100">
                  Mark Present
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
