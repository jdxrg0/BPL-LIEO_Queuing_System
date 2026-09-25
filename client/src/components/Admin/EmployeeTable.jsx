import React from 'react';

export default function EmployeeTable({ employees, year, onEdit }) {
  if (!employees) return null;

  return (
    <div className="bg-surface rounded-3xl overflow-hidden shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="p-4 px-5 border-b border-border bg-bg-color/50 flex justify-between items-center">
        <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Employee Performance</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border uppercase tracking-wider">FY {year}</span>
          <span className="text-xs font-semibold text-text-muted bg-surface px-2 py-1 rounded-lg shadow-sm border border-border">{employees.length} Users</span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface text-text-muted text-[10px] uppercase tracking-wider font-extrabold">
              <th className="p-3 px-4">Employee Details</th>
              <th className="p-3 px-4 text-center">Total</th>
              <th className="p-3 px-4 text-center">All-Time</th>
              <th className="p-3 px-4 text-center">NW</th>
              <th className="p-3 px-4 text-center">RNW</th>
              <th className="p-3 px-4 text-center">R</th>
              <th className="p-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t border-border hover:bg-bg-color/80 transition-colors group">
                <td className="p-2 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center font-black text-sm shadow-sm border border-indigo-50">
                      {emp.profilePictureBase64 ? (
                        <img src={emp.profilePictureBase64} alt={emp.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        emp.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-text-main text-sm group-hover:text-indigo-600 transition-colors">
                        {emp.name}
                      </div>
                      <div className="text-[10px] font-semibold text-text-muted mt-0.5 flex gap-1.5 items-center">
                        {emp.counter && <span className="bg-slate-100 text-text-muted px-1.5 py-0.5 rounded border border-slate-200">Window {emp.counter.name ? emp.counter.name.replace('Window ', '') : ''}</span>}
                      </div>
                      <div className="flex gap-1.5 items-center mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          emp.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                          emp.role === 'RECEPTIONIST' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-text-muted'
                        }`}>
                          {emp.role}
                        </span>
                        <span className="text-[10px] text-text-muted font-semibold mx-0.5">•</span>
                        <div className="flex gap-1">
                          {emp.caterNew && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-extrabold shadow-sm">NW</span>}
                          {emp.caterRenewal && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-extrabold shadow-sm">RNW</span>}
                          {emp.caterRetirement && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-extrabold shadow-sm">R</span>}
                          {!emp.caterNew && !emp.caterRenewal && !emp.caterRetirement && <span className="text-text-muted text-[9px] font-bold">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-2 px-4 text-center font-black text-indigo-600 text-base">{emp.servedTotalYear.toLocaleString()}</td>
                <td className="p-2 px-4 text-center font-bold text-text-muted text-sm">{emp.servedTotalAllTime.toLocaleString()}</td>
                <td className="p-2 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30 text-sm">{emp.servedNewYear.toLocaleString()}</td>
                <td className="p-2 px-4 text-center font-bold text-indigo-600 bg-indigo-50/30 text-sm">{emp.servedRenewalYear.toLocaleString()}</td>
                <td className="p-2 px-4 text-center font-bold text-rose-600 bg-rose-50/30 text-sm">{emp.servedRetirementYear.toLocaleString()}</td>
                <td className="p-2 px-4 text-right">
                  <button
                    onClick={() => onEdit(emp)}
                    className="px-3 py-1.5 bg-surface border border-border rounded-lg font-bold text-[11px] text-text-main hover:bg-bg-color hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
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