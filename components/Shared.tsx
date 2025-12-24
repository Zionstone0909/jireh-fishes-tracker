
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden transition-all duration-500 ${className}`} 
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
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyle = "rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none active:scale-95 transform";
  
  const sizes = {
    sm: "px-3 py-2 sm:px-4 sm:py-2.5",
    md: "px-5 py-3 sm:px-6 sm:py-4",
    lg: "px-8 py-4 sm:px-10 sm:py-5 text-[11px] sm:text-xs"
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:-translate-y-0.5",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-100 hover:-translate-y-0.5",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100 hover:-translate-y-0.5",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
  };
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
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
      className="mb-4 sm:mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-all px-4 py-2 sm:px-5 sm:py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm group"
      type="button"
    >
      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" /> 
      System Navigation
    </button>
  );
};

export const Badge = ({ children, color = 'blue', className = '' }: { children: React.ReactNode, color?: string, className?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-slate-50 text-slate-500 border-slate-200',
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">{label}</label>}
    <input 
      className={`border border-slate-200 rounded-[1rem] sm:rounded-[1.25rem] px-4 py-3 sm:px-6 sm:py-4 focus:outline-none focus:ring-4 sm:focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 w-full transition-all bg-slate-50/30 font-bold text-sm shadow-inner placeholder:text-slate-300 ${className}`} 
      {...props} 
    />
  </div>
);

export const Select = ({ label, children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full border border-slate-200 rounded-[1rem] sm:rounded-[1.25rem] px-4 py-3 sm:px-6 sm:py-4 appearance-none focus:outline-none focus:ring-4 sm:focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 bg-slate-50/30 disabled:bg-slate-100 disabled:text-slate-400 font-bold text-sm shadow-inner transition-all ${className}`} 
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 sm:px-5 text-slate-400">
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const Table = ({ headers, children, className = '' }: { headers: string[], children: React.ReactNode, className?: string }) => (
  <div className={`overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 bg-white no-scrollbar ${className}`}>
    <div className="overflow-x-auto no-scrollbar">
      <table className="min-w-full divide-y divide-slate-50">
        <thead className="bg-slate-50/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-4 sm:px-8 sm:py-7 text-left text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);
