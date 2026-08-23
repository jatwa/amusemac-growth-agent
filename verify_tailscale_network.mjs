import fetch from 'node-fetch';

const TAILSCALE_IP = '100.125.52.92';

async function verifyTailscaleAccessibility() {
  console.log('==================================================');
  console.log('TAILSCALE PRIVATE NETWORK ACCESSIBILITY VERIFICATION');
  console.log('==================================================\n');

  let frontendRunning = false;
  let backendRunning = false;

  // 1. Verify Frontend on Tailscale IP
  try {
    const res = await fetch(`http://${TAILSCALE_IP}:3000/`);
    if (res.ok) {
      frontendRunning = true;
    }
  } catch (e) {
    console.error('Frontend Tailscale error:', e.message);
  }

  // 2. Verify Backend on Tailscale IP
  try {
    const res = await fetch(`http://${TAILSCALE_IP}:3001/api/health`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok || data.status === 'ok' || data.success === true) {
        backendRunning = true;
      }
    }
  } catch (e) {
    console.error('Backend Tailscale error:', e.message);
  }

  const ready = frontendRunning && backendRunning;

  console.log(`Tailscale IP:\n${TAILSCALE_IP}\n`);
  console.log(`Frontend:\nhttp://${TAILSCALE_IP}:3000/\n`);
  console.log(`Backend:\nhttp://${TAILSCALE_IP}:3001/\n`);
  console.log(`Frontend status:\n${frontendRunning ? 'RUNNING' : 'NOT RUNNING'}\n`);
  console.log(`Backend status:\n${backendRunning ? 'RUNNING' : 'NOT RUNNING'}\n`);
  console.log(`Tailscale accessibility:\n${ready ? 'READY' : 'NOT READY'}\n`);
  console.log(`SerpAPI searches:\n0\n`);
  console.log(`SerpAPI credits consumed:\n0`);
}

verifyTailscaleAccessibility();
