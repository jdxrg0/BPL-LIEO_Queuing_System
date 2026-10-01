const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const socketHandling = `io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Track userId when client identifies itself
  socket.on('identify', async (userId) => {
    socket.userId = userId;
    try {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { isOnline: true }
      });
      io.emit('userOnlineStatus', { userId: parseInt(userId), isOnline: true });
    } catch(e) {
      console.error('Error updating online status:', e);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    if (socket.userId) {
      try {
        await prisma.user.update({
          where: { id: parseInt(socket.userId) },
          data: { isOnline: false }
        });
        io.emit('userOnlineStatus', { userId: parseInt(socket.userId), isOnline: false });
      } catch(e) {
        console.error('Error updating offline status:', e);
      }
    }
  });
});`;

content = content.replace(/io\.on\('connection', \(socket\) => \{[\s\S]*?\}\);/, socketHandling);
fs.writeFileSync('server.js', content);
console.log('server.js updated.');
