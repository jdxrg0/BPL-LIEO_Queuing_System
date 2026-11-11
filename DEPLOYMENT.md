# BPL-LIEO Queuing System Deployment Guide

## 1. Environment Configuration
Ensure you have a .env file copied from .env.example with all production secrets filled in, especially JWT_SECRET.

## 2. Process Management
The backend utilizes PM2 for process management and automatic restarts.
Start the production server with:
\\\ash
npm run start:prod
\\\

## 3. HTTPS Enforcement (SEC-4)
When deploying to a production environment (where \NODE_ENV=production\), the Node.js server is configured to **enforce HTTPS**. 
It inspects the \x-forwarded-proto\ header provided by reverse proxies (like Nginx, AWS ELB, Heroku, or Render).
- If a client connects via HTTP, they will be automatically redirected to HTTPS.
- If you are running locally (\localhost\), the redirection is bypassed to allow development without SSL certificates.

### Reverse Proxy Configuration
If you are deploying behind Nginx, make sure Nginx passes the protocol header:
\\\
ginx
proxy_set_header X-Forwarded-Proto $scheme;
\\\

## 4. SQLite Database
The system uses SQLite in WAL mode for high concurrency. 
Ensure the prisma/dev.db (or production path) is stored on a persistent volume if using Docker, otherwise data will be lost on container restart.
