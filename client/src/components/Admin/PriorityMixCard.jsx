import React from 'react';

export default function PriorityMixCard({ priorityBreakdown }) {
  if (priorityBreakdown.length === 0) {
    return (
      <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Priority Mix</h2>
        <p className="text-text-muted mt-0.5 text-xs font-medium">Completed tickets by priority group</p>
        <div className="text-center py-8 text-text-muted font-semibold text-sm bg-bg-color/60 rounded-2xl border border-dashed border-border mt-5">No data for this period.</div>
      </div>
    );
  }

  const maxCount = Math.max(...priorityBreakdown.map(i => i.count), 1);
  const totalCount = priorityBreakdown.reduce((a, i) => a + i.count, 0);

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.25s' }}>
      <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Priority Mix</h2>
      <p className="text-text-muted mt-0.5 text-xs font-medium">Completed tickets by priority group</p>
      <div className="flex flex-col gap-4 mt-5">
        {priorityBreakdown.map(item => (
          <div key={item.type} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-main">{item.label}</span>
              <span className="text-xs font-black text-indigo-600">{item.count.toLocaleString()} · {Math.round((item.count / totalCount) * 100)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-bg-color overflow-hidden border border-border/50">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(item.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}