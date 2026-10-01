const fs = require('fs');
let content = fs.readFileSync('client/src/pages/AdminDashboard.jsx', 'utf8');

const newSocketListeners = `    socket.on('queueUpdated', handleUpdate);
    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketCalled', handleUpdate);
    socket.on('userOnlineStatus', (data) => {
      setEmployees(prev => prev.map(emp => emp.id === data.userId ? { ...emp, isOnline: data.isOnline } : emp));
    });
    socket.on('userUpdated', (updatedUser) => {
      setEmployees(prev => prev.map(emp => emp.id === updatedUser.id ? { ...emp, ...updatedUser } : emp));
    });`;

content = content.replace(/socket\.on\('queueUpdated', handleUpdate\);\s*socket\.on\('ticketCreated', handleUpdate\);\s*socket\.on\('ticketCalled', handleUpdate\);/, newSocketListeners);

const newSocketCleanup = `      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketCalled', handleUpdate);
      socket.off('userOnlineStatus');
      socket.off('userUpdated');`;

content = content.replace(/socket\.off\('queueUpdated', handleUpdate\);\s*socket\.off\('ticketCreated', handleUpdate\);\s*socket\.off\('ticketCalled', handleUpdate\);/, newSocketCleanup);

fs.writeFileSync('client/src/pages/AdminDashboard.jsx', content);
console.log('AdminDashboard.jsx updated.');
