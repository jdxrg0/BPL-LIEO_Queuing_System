const fs = require('fs');

let admin = fs.readFileSync('client/src/pages/AdminDashboard.tsx', 'utf8');

// The first line is: import React, { useState, useEffect, useMemo } from 'react';
// Let's replace it properly.
admin = admin.replace(
  /import React, \{ useState, useEffect, useMemo \} from 'react';/,
  "import React, { useState, useEffect, useMemo } from 'react';\nimport { createPortal } from 'react-dom';\nimport { Calendar } from 'lucide-react';"
);

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
    /return \(\s*<div className="container/,
    portalJSX + '\n  return (\n    <>\n      {datePickerPortal}\n    <div className="container'
  );
  admin = admin.replace(
    /<\/div>\s*\);\s*}\s*$/,
    '</div>\n    </>\n  );\n}'
  );
}

fs.writeFileSync('client/src/pages/AdminDashboard.tsx', admin);
console.log('done fixing AdminDashboard');
