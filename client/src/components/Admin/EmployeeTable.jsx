import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

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

export default function EmployeeTable({ employees, year, onEdit }) {
  const [sort, setSort] = useState({ key: 'servedTotalYear', dir: 'desc' });

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
      <div className="p-4 px-5 border-b border-border bg-bg-color/50 flex justify-between items-center">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Employee Performance</h2>
          <p className="text-text-muted mt-0.5 text-xs font-medium mb-0">Transactions completed by each staff member. Click a column to sort.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border uppercase tracking-wider">FY {year}</span>
          <span className="text-xs font-semibold text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border">{employees.length} Users</span>
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
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shadow-sm border border-indigo-50 dark:border-white/5 shrink-0 overflow-hidden">
                        {emp.profilePictureBase64 ? (
                          <img src={emp.profilePictureBase64} alt={emp.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          emp.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-text-main text-sm group-hover:text-indigo-600 transition-colors truncate">
                          {emp.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${ROLE_PILLS[emp.role] || ROLE_PILLS.STAFF}`}>
                            {emp.role}
                          </span>
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