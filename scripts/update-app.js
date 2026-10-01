const fs = require('fs');
let content = fs.readFileSync('client/src/App.jsx', 'utf8');

const updatedUseEffect = `  useEffect(() => {
    if (user) {
      socket.emit('identify', user.id);
    }
  }, [user]);`;

if (!content.includes("socket.emit('identify'")) {
  // Insert the identify effect after the first useEffect block
  const firstUseEffectEnd = content.indexOf('  useEffect(() => {');
  if(firstUseEffectEnd > -1) {
      content = content.slice(0, firstUseEffectEnd) + updatedUseEffect + '\n\n' + content.slice(firstUseEffectEnd);
      fs.writeFileSync('client/src/App.jsx', content);
      console.log('App.jsx updated with identify emission.');
  } else {
      console.log('Could not find suitable insertion point in App.jsx');
  }
} else {
  console.log('App.jsx already emits identify.');
}
