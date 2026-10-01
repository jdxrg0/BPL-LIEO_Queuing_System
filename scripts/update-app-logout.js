const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

const updatedHandleLogout = `  const handleLogout = async () => {
    try {
      if (user) {
        await api.logout(user.id);
      }
    } catch(e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    localStorage.removeItem('bplo_user');
    localStorage.removeItem('bplo_login_date');
  };`;

content = content.replace(/const handleLogout = \(\) => \{[\s\S]*?\};/, updatedHandleLogout);
fs.writeFileSync('client/src/App.jsx', content);
console.log('App.jsx updated with logout API call.');
