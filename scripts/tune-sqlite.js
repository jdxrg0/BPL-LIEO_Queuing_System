const fs = require('fs');

// 1. Update schema.prisma
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(
  'url      = "file:./dev.db"',
  'url      = env("DATABASE_URL")'
);
fs.writeFileSync('prisma/schema.prisma', schema);

// 2. Update .env
let env = fs.readFileSync('.env', 'utf8');
env = env.replace(
  /DATABASE_URL=.*/,
  'DATABASE_URL="file:./dev.db?connection_limit=1&socket_timeout=5"'
);
fs.writeFileSync('.env', env);

console.log('Prisma and .env updated for SQLite concurrency.');
