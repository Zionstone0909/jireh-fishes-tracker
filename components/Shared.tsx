import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Card = ({ children, className = '', style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${className}`} 
    style={{ ...style }}
    {...props}
  >
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  style = {}
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}) => {
  const baseStyle = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base"
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  };
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

export const BackButton = ({ onClick }: { onClick?: () => void }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={onClick || (() => navigate(-1))} 
      className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-indigo-50"
      type="button"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
};

export const Badge = ({ children, color = 'blue', className = '', style = {} }: { children: React.ReactNode, color?: string, className?: string, style?: React.CSSProperties }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-slate-50 text-slate-700 border-slate-200',
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <span 
      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colors[color] || colors.gray} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export const Input = ({ label, className = '', style = {}, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <input 
      className={`border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all bg-white font-bold text-sm shadow-sm placeholder:text-slate-400 ${className}`} 
      style={style}
      {...props} 
    />
  </div>
);

export const Select = ({ label, children, className = '', style = {}, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-bold text-sm shadow-sm transition-all ${className}`} 
        style={style}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const Table = ({ headers, children, className = '', style = {} }: { headers: string[], children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div 
    className={`overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white ${className}`}
    style={{ ...style }}
  >
    <table className="min-w-full divide-y divide-slate-100">
      <thead className="bg-slate-50/50">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-100">
        {children}
      </tbody>
    </table>
  </div>
);