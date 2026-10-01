const fs = require('fs');

// 1. Modify AdminDashboard.tsx
let admin = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

// Add imports
if (!admin.includes('createPortal')) {
  admin = admin.replace(
    'import React, { useState, useEffect, useMemo } from \'react\';',
    'import React, { useState, useEffect, useMemo } from \'react\';\nimport { createPortal } from \'react-dom\';\nimport { Calendar } from \'lucide-react\';'
  );
}

// Add portal render
const portalJSX = `
  const headerControlsElement = document.getElementById('global-header-controls');
  const datePickerPortal = headerControlsElement ? createPortal(
    <div className="flex items-center bg-bg-color p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto animate-fade-in mr-4">
      <div className="flex items-center bg-surface px-2 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
        <Calendar size={14} className="text-text-muted mr-2" />
        <input 
          type="date" 
          value={trendStart} 
          onChange={(e) => setTrendStart(e.target.value)} 
          className="bg-transparent text-xs font-bold text-text-main outline-none border-none cursor-pointer w-full"
        />
      </div>
      <span className="text-text-muted font-bold text-xs px-2">&rarr;</span>
      <div className="flex items-center bg-surface px-2 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
        <Calendar size={14} className="text-text-muted mr-2" />
        <input 
          type="date" 
          value={trendEnd} 
          onChange={(e) => setTrendEnd(e.target.value)} 
          className="bg-transparent text-xs font-bold text-text-main outline-none border-none cursor-pointer w-full"
        />
      </div>
    </div>,
    headerControlsElement
  ) : null;
`;

if (!admin.includes('datePickerPortal')) {
  admin = admin.replace(
    'return (',
    portalJSX + '\n  return (\n    <>\n      {datePickerPortal}'
  );
  admin = admin.replace(
    '</div>\n  );\n}',
    '</div>\n    </>\n  );\n}'
  );
}

fs.writeFileSync('client/src/pages/AdminDashboard.tsx', admin);

// 2. Modify TicketsChartCard.jsx
let chart = fs.readFileSync('client/src/components/Admin/TicketsChartCard.jsx', 'utf8');

// The block to remove starts from <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full xl:w-auto">
// and ends with its closing </div> which is 24 lines down.
// Let's just use regex or simple string replacement.
const blockToRemove = `<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full xl:w-auto">
          {/* Custom Styled Date Range Picker */}
          <div className="flex items-center bg-bg-color p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
            <div className="flex items-center bg-surface px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
              <Calendar size={14} className="text-text-muted mr-2" />
              <input 
                type="date" 
                value={trendStart} 
                onChange={(e) => onStartChange(e.target.value)} 
                className="bg-transparent text-sm font-bold text-text-main outline-none border-none cursor-pointer w-full"
              />
            </div>
            <span className="text-text-muted font-bold text-sm px-3">&rarr;</span>
            <div className="flex items-center bg-surface px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
              <Calendar size={14} className="text-text-muted mr-2" />
              <input 
                type="date" 
                value={trendEnd} 
                onChange={(e) => onEndChange(e.target.value)} 
                className="bg-transparent text-sm font-bold text-text-main outline-none border-none cursor-pointer w-full"
              />
            </div>
          </div>
        </div>`;

chart = chart.replace(blockToRemove, '');
fs.writeFileSync('client/src/components/Admin/TicketsChartCard.jsx', chart);

console.log('Done refactoring');
