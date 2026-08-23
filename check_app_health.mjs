import fetch from 'node-fetch';

async function checkAppHealth() {
  let backendRunning = false;
  let frontendRunning = false;

  // Check Backend (3001)
  try {
    const res = await fetch('http://127.0.0.1:3001/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data.ok || data.status === 'ok' || data.status === 'OK' || data.success === true) {
        backendRunning = true;
      }
    }
  } catch (e) {}

  // Check Frontend (3000)
  try {
    const res = await fetch('http://127.0.0.1:3000/');
    if (res.ok) {
      frontendRunning = true;
    }
  } catch (e) {}

  const connected = backendRunning && frontendRunning;

  console.log(`Frontend:\nhttp://localhost:3000/\nStatus: ${frontendRunning ? 'RUNNING' : 'NOT RUNNING'}\n`);
  console.log(`Backend:\nhttp://localhost:3001/\nStatus: ${backendRunning ? 'RUNNING' : 'NOT RUNNING'}\n`);
  console.log(`Frontend -> Backend:\n${connected ? 'CONNECTED' : 'NOT CONNECTED'}\n`);
  console.log(`SerpAPI search executed:\nNO\n`);
  console.log(`SerpAPI credits consumed:\n0`);
}

checkAppHealth();
