
import React from 'react';
import { useApp } from '../context/AppContext';
import { Card } from './Shared';
import { Activity, Clock } from 'lucide-react';

export const ActivityFeed: React.FC<{ maxItems?: number; refreshInterval?: number }> = ({ maxItems = 10 }) => {
  const { logs } = useApp();
  
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity size={18} className="text-blue-500" /> System Activity Feed
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time</span>
      </div>
      <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
        {logs.slice(0, maxItems).map((log) => (
          <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-bold text-slate-900">{log.action}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic text-sm">No recent activity detected.</div>
        )}
      </div>
    </Card>
  );
};
