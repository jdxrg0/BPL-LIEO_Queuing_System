const fs = require('fs');
let content = fs.readFileSync('client/src/components/Admin/EmployeeTable.jsx', 'utf8');

const updatedRowStart = `                <tr key={emp.id} className="border-t border-border hover:bg-bg-color/80 transition-colors group">
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
                          </div>`;

content = content.replace(/<tr key=\{emp\.id\}[\s\S]*?<div className="font-extrabold text-text-main text-sm group-hover:text-indigo-600 transition-colors truncate">\s*\{emp\.name\}\s*<\/div>/, updatedRowStart);
fs.writeFileSync('client/src/components/Admin/EmployeeTable.jsx', content);
console.log('EmployeeTable.jsx updated with online indicator.');
