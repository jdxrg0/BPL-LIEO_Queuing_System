import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Lock, UserPlus, Info, X, Zap } from 'lucide-react';

const ROLE_PILLS = {
  ADMIN: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  RECEPTIONIST: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  STAFF: 'bg-slate-100 dark:bg-slate-500/10 text-text-muted'
};

const SERVED_COLUMNS = [
  { key: 'servedTotalYear', label: 'Total', color: 'text-indigo-600' },
  { key: 'servedTotalAllTime', label: 'All-Time', color: 'text-text-muted' },
  { key: 'servedNewYear', label: 'NW', color: 'text-emerald-600' },
  { key: 'servedRenewalYear', label: 'RNW', color: 'text-indigo-600' },
  { key: 'servedRetirementYear', label: 'R', color: 'text-rose-600' }
];

const SERVICE_TAGS = [
  { key: 'caterNew', label: 'NW', className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { key: 'caterRenewal', label: 'RNW', className: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  { key: 'caterRetirement', label: 'R', className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' }
];

function SortableHeader({ column, sortKey, sortDir, onSort }) {
  const active = sortKey === column.key;
  return (
    <th className="p-3 px-4 text-right">
      <button
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors ${
          active ? 'text-indigo-600' : 'text-text-muted hover:text-text-main'
        }`}
      >
        {column.label}
        {active ? (
          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

export default function EmployeeTable({ employees, year, onEdit, onAdd }) {
  const [sort, setSort] = useState({ key: 'servedTotalYear', dir: 'desc' });
  const [showInfo, setShowInfo] = useState(false);

  const sorted = useMemo(() => {
    if (!employees) return [];
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...employees].sort((a, b) => ((a[sort.key] || 0) - (b[sort.key] || 0)) * dir);
  }, [employees, sort]);

  if (!employees) return null;

  const handleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' });
  };

  return (
    <div className="bg-surface rounded-3xl overflow-hidden shadow-soft border border-border animate-slide-up">
      <div className="p-4 px-5 border-b border-border bg-bg-color/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight flex items-center gap-2">
            Employee Performance
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            >
              <button className="text-text-muted hover:text-indigo-600 transition-colors bg-transparent border-none cursor-help p-1 flex items-center justify-center">
                 <Info size={16} />
              </button>
              
              {showInfo && (
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-[360px] sm:w-[420px] bg-surface border border-border rounded-xl shadow-xl p-4 z-50 text-left font-normal normal-case tracking-normal cursor-default shadow-indigo-500/10 dark:shadow-black/50">
                  {/* Arrow */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-t border-l border-border rotate-45"></div>
                  
                  <div className="relative z-10 text-sm">
                    <h3 className="font-extrabold text-text-main m-0 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <Zap size={14} className="text-indigo-500" /> How the Smart Allocator Works
                    </h3>
                    <p className="m-0 mb-3 text-text-muted text-xs font-medium leading-relaxed">
                      The system continuously balances queues by assigning service flags based on real-time burden (Tickets × Avg Processing Time).
                    </p>
                    <ul className="m-0 pl-4 space-y-2 text-text-muted text-xs font-medium leading-relaxed">
                      <li><strong className="text-text-main">Active Staff Only:</strong> The algorithm strictly ignores offline employees. They retain their default flags but are not factored into the math.</li>
                      <li><strong className="text-text-main">Manual Overrides:</strong> Staff with the <span className="text-amber-600 inline-flex items-center gap-0.5 font-bold"><Lock size={10}/> Manual</span> lock (Auto-Reallocate: OFF) are completely skipped.</li>
                      <li><strong className="text-text-main">Low Traffic (Multi-tasking):</strong> When wait times are low, flexible staff are opened up to handle <strong>all queues</strong> simultaneously to prevent idle time.</li>
                      <li><strong className="text-text-main">High Traffic (Specialization):</strong> During traffic spikes, the system restricts flexible staff to <strong>one specific service</strong>, mathematically dividing them to focus entirely on clearing the heaviest bottlenecks.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </h2>
          <p className="text-text-muted mt-0.5 text-xs font-medium mb-0">Transactions completed by each staff member. Click a column to sort.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border uppercase tracking-wider">FY {year}</span>
          <span className="text-xs font-semibold text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border">{employees.length} Users</span>
          <button 
            className="flex items-center gap-1.5 bg-indigo-600 text-white border-none hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ml-1"
            onClick={onAdd}
          >
            <UserPlus size={14} /> Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface text-text-muted text-[10px] uppercase tracking-wider font-extrabold shadow-sm sticky top-0 z-10">
              <th className="p-3 px-4">Employee</th>
              {SERVED_COLUMNS.map(col => (
                <SortableHeader key={col.key} column={col} sortKey={sort.key} sortDir={sort.dir} onSort={handleSort} />
              ))}
              <th className="p-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => {
              const servedServices = SERVICE_TAGS.filter(t => emp[t.key]);
              return (
                                <tr key={emp.id} className="border-t border-border hover:bg-bg-color/80 transition-colors group">
                    <td className="p-2 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shadow-sm border border-indigo-50 dark:border-white/5 shrink-0 overflow-hidden">
                            {emp.profilePictureBase64 ? (
                              <img src={emp.profilePictureBase64} alt={emp.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          {emp.isOnline && (
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-surface rounded-full shadow-sm" title="Online"></span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-text-main text-sm group-hover:text-indigo-600 transition-colors truncate flex items-center gap-2">
                            {emp.name}
                            {emp.isOnline && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Online</span>}
                          </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${ROLE_PILLS[emp.role] || ROLE_PILLS.STAFF}`}>
                            {emp.role}
                          </span>
                          {emp.autoAssign === false && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" title="Excluded from auto-allocation; assignments stay manual">
                              <Lock size={9} /> Manual
                            </span>
                          )}
                          {emp.counter?.name && (
                            <span className="text-[10px] font-semibold text-text-muted">Window {emp.counter.name.replace('Window ', '')}</span>
                          )}
                          {servedServices.length > 0 && (
                            <span className="flex gap-1">
                              {servedServices.map(t => (
                                <span key={t.key} className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shadow-sm ${t.className}`}>{t.label}</span>
                              ))}
                            </span>
                          )}
                          {servedServices.length === 0 && (
                            <span className="text-[10px] text-text-muted font-semibold">No services assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {SERVED_COLUMNS.map(col => (
                    <td key={col.key} className={`p-2 px-4 text-right font-bold text-sm ${col.color}`}>
                      {(emp[col.key] || 0).toLocaleString()}
                    </td>
                  ))}
                  <td className="p-2 px-4 text-right">
                    <button
                      onClick={() => onEdit(emp)}
                      className="px-3 py-1.5 bg-surface border border-border rounded-lg font-bold text-[11px] text-text-main hover:bg-bg-color hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="7" className="p-12 text-center text-text-muted font-semibold text-lg bg-bg-color">No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}