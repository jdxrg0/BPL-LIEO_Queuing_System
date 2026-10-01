const fs = require('fs');
let c = fs.readFileSync('client/src/components/Layout/Layout.jsx', 'utf8');
c = c.replace(
  '          {/* Right Actions */}\n          <div className="flex items-center justify-end gap-3 sm:gap-5 min-w-[200px]">\n            {user?.role === \'ADMIN\'',
  '          {/* Right Actions */}\n          <div className="flex items-center justify-end gap-3 sm:gap-5 min-w-[200px]">\n            <div id="global-header-controls" className="hidden xl:flex items-center"></div>\n            {user?.role === \'ADMIN\''
);
fs.writeFileSync('client/src/components/Layout/Layout.jsx', c);
console.log('done');
