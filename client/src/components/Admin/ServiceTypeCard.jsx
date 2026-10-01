import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ServiceTypeCard({ office }) {
  const data = [
    { name: 'New Application', value: office.newApp || 0, color: '#4f46e5' }, // indigo-600
    { name: 'Renewal', value: office.renewal || 0, color: '#10b981' }, // emerald-500
    { name: 'Retirement', value: office.retirement || 0, color: '#f59e0b' }, // amber-500
  ].filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.25s' }}>
      <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Service Type Breakdown</h2>
      <p className="text-text-muted mt-0.5 text-xs font-medium">Distribution of completed tickets by service type</p>
      
      <div className="h-56 w-full mt-4 flex items-center justify-center relative">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                formatter={(value) => [`${value} Tickets`, 'Count']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm font-semibold text-text-muted/50">No data available</div>
        )}
        
        {total > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
            <span className="text-2xl font-black text-text-main">{total}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</span>
          </div>
        )}
      </div>
    </div>
  );
}
