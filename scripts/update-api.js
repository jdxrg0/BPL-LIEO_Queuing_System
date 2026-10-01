const fs = require('fs');
let content = fs.readFileSync('client/src/api.js', 'utf8');

if (!content.includes('logout: async')) {
  const logoutMethod = `  logout: async (userId) => {
    const res = await fetch(\`\${API_URL}/api/logout\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(res);
  },`;
  content = content.replace(/login: async[\s\S]*?\},/, match => match + '\n' + logoutMethod);
  fs.writeFileSync('client/src/api.js', content);
  console.log('api.js updated with logout method.');
} else {
  console.log('api.js already has logout method.');
}
