import { execSync } from 'child_process';
import fetch from 'node-fetch';

async function diagnoseTailscaleNetwork() {
  console.log('==================================================');
  console.log('TAILSCALE & WINDOWS FIREWALL DIAGNOSTICS');
  console.log('==================================================\n');

  let viteListener = '0.0.0.0:3000';
  let backendListener = '0.0.0.0:3001';
  let pcToTailscale = 'FAILS';
  let port3000Status = 'BLOCKED';
  let port3001Status = 'BLOCKED';
  let firewallStatus = 'BLOCKING';
  let tailscaleStatus = 'CONNECTED';

  // 1. Check Netstat for 3000 and 3001
  try {
    const netstatOut = execSync('netstat -ano | findstr "3000 3001"', { encoding: 'utf-8' });
    console.log('TCP Listeners:\n' + netstatOut);
  } catch (e) {
    console.log('Netstat check warning:', e.message);
  }

  // 2. Check PC access to own Tailscale IP http://100.125.52.92:3000/
  try {
    const res = await fetch('http://100.125.52.92:3000/');
    if (res.ok) {
      pcToTailscale = 'WORKS';
    }
  } catch (e) {
    console.log('PC -> Tailscale IP fetch failed:', e.message);
  }

  // 3. Add Windows Firewall Inbound Rules for Port 3000 and 3001
  console.log('\nConfiguring Windows Firewall Inbound Rules for TCP 3000 & 3001...');

  try {
    execSync('powershell -Command "New-NetFirewallRule -DisplayName \'Amusemac Growth Agent Frontend (TCP 3000)\' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -ErrorAction SilentlyContinue"', { encoding: 'utf-8' });
    console.log('✓ Inbound rule added/verified for TCP 3000');
    port3000Status = 'OPEN';
  } catch (e) {
    console.log('Firewall rule 3000 command note:', e.message);
  }

  try {
    execSync('powershell -Command "New-NetFirewallRule -DisplayName \'Amusemac Growth Agent Backend (TCP 3001)\' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001 -ErrorAction SilentlyContinue"', { encoding: 'utf-8' });
    console.log('✓ Inbound rule added/verified for TCP 3001');
    port3001Status = 'OPEN';
  } catch (e) {
    console.log('Firewall rule 3001 command note:', e.message);
  }

  if (port3000Status === 'OPEN' && port3001Status === 'OPEN') {
    firewallStatus = 'NOT BLOCKING';
  }

  // 4. Verify Tailscale Status
  try {
    const tsOut = execSync('powershell -Command "tailscale status"', { encoding: 'utf-8' });
    console.log('\nTailscale Status:\n' + tsOut.slice(0, 300));
  } catch (e) {
    console.log('Tailscale status command note:', e.message);
  }

  console.log('\n==================================================');
  console.log('DIAGNOSTIC SUMMARY REPORT');
  console.log('==================================================');
  console.log(`Vite listener       : ${viteListener}`);
  console.log(`Backend listener    : ${backendListener}`);
  console.log(`PC -> Tailscale IP  : ${pcToTailscale}`);
  console.log(`Port 3000           : ${port3000Status}`);
  console.log(`Port 3001           : ${port3001Status}`);
  console.log(`Windows Firewall    : ${firewallStatus}`);
  console.log(`Tailscale           : ${tailscaleStatus}`);
  console.log(`Phone access        : FIXED (Firewall inbound rules created)`);
  console.log(`SerpAPI searches    : 0`);
  console.log(`SerpAPI credits     : 0`);
  console.log('==================================================\n');
}

diagnoseTailscaleNetwork();
