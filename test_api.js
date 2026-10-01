const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 71, role: 'ADMIN' }, process.env.JWT_SECRET || 'bpl-lieo-qs-f84a9c2e7b3d1056e8f4a2c9d7b3e1f0', { expiresIn: '1h' });

fetch('http://localhost:5000/api/stats?startDate=2026-10-01&endDate=2026-10-31', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
}).then(r => r.json()).then(d => {
  console.log("Total:", d.office?.total);
  console.log("Trend length:", d.trend?.length);
  if (d.trend?.length > 0) {
    console.log("First trend element:", d.trend[0]);
  }
}).catch(console.error);
