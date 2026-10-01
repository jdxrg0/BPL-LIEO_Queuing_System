const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

if (!content.includes('isConnected')) {
  content = content.replace(
    'const [user, setUser] = useState(null);',
    'const [user, setUser] = useState(null);\n  const [isConnected, setIsConnected] = useState(socket.connected);'
  );
  
  const connectionLogic = `  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      const savedUserStr = localStorage.getItem('bplo_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.id) {
            socket.emit('identify', savedUser.id);
          }
        } catch(e) {}
      }
    };
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);`;
  
  content = content.replace(/  useEffect\(\(\) => \{\s*if \(user\) \{\s*socket\.emit\('identify', user\.id\);\s*\}\s*\}, \[user\]\);/, match => match + '\n\n' + connectionLogic);
  
  const bannerUI = `
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-red-600/90 backdrop-blur text-white text-center py-2 z-[9999] font-bold shadow-lg animate-pulse flex items-center justify-center gap-2">
          <span>⚠️ Connection to server lost. Reconnecting...</span>
        </div>
      )}`;
      
  content = content.replace('<div className="min-h-screen bg-bg-color font-sans text-text-main">', '<div className="min-h-screen bg-bg-color font-sans text-text-main">' + bannerUI);
  
  fs.writeFileSync('client/src/App.jsx', content);
  console.log('App.jsx updated with connection resilience.');
}
