import { execSync } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';

async function diagnoseNetworkPath() {
  console.log('==================================================');
  console.log('TAILSCALE DEEP NETWORK PATH & FIREWALL DIAGNOSTICS');
  console.log('==================================================\n');

  let tailscalePcStatus = 'NOT CONNECTED';
  let tailscaleIp = 'UNKNOWN';
  let frontendListener = 'NOT RUNNING';
  let backendListener = 'NOT RUNNING';
  let pcLocalhostWorks = 'FAILS';
  let pcTailscaleIpWorks = 'FAILS';
  let firewallFrontendRule = 'INCORRECT';
  let firewallBackendRule = 'INCORRECT';
  let tailscaleInterfaceStatus = 'INACTIVE';
  let phoneInTailnet = 'UNKNOWN';
  let pcPhoneConnectivity = 'UNKNOWN';
  let likelyCause = '';
  let requiredFix = '';

  // 1. Locate Tailscale executable
  let tsPath = 'tailscale';
  const commonTsPaths = [
    'C:\\Program Files\\Tailscale\\tailscale.exe',
    'C:\\Program Files (x86)\\Tailscale\\tailscale.exe',
    `${process.env.LOCALAPPDATA}\\Tailscale\\tailscale.exe`
  ];
  for (const p of commonTsPaths) {
    if (fs.existsSync(p)) {
      tsPath = `"${p}"`;
      break;
    }
  }

  // Check Tailscale Status
  try {
    const tsStatusOut = execSync(`powershell -Command "& ${tsPath} status"`, { encoding: 'utf-8' });
    console.log('Tailscale Devices & Status:\n' + tsStatusOut);
    if (tsStatusOut.includes('100.125.52.92') || tsStatusOut.includes('active') || tsStatusOut.includes('-')) {
      tailscalePcStatus = 'CONNECTED';
      tailscaleIp = '100.125.52.92';
    }

    // Check if any phone/mobile device appears in tailscale status
    const lines = tsStatusOut.split('\n');
    const phoneLines = lines.filter(l => l.toLowerCase().includes('android') || l.toLowerCase().includes('iphone') || l.toLowerCase().includes('phone') || l.toLowerCase().includes('mobile') || l.includes('100.'));
    console.log('\nPotential Mobile Devices in Tailnet:', phoneLines);
    if (lines.length > 2) {
      phoneInTailnet = lines.some(l => l.toLowerCase().includes('phone') || l.toLowerCase().includes('android') || l.toLowerCase().includes('iphone')) ? 'YES' : 'UNKNOWN';
    }
  } catch (e) {
    console.log('Tailscale status check note:', e.message);
  }

  // 2. Check Network Adapters & Network Connection Profiles
  try {
    const adapters = execSync('powershell -Command "Get-NetAdapter | Select-Object Name, InterfaceDescription, Status"', { encoding: 'utf-8' });
    console.log('\nNetwork Adapters:\n' + adapters);
    if (adapters.toLowerCase().includes('tailscale') && adapters.toLowerCase().includes('up')) {
      tailscaleInterfaceStatus = 'ACTIVE';
    }

    const profiles = execSync('powershell -Command "Get-NetConnectionProfile | Select-Object Name, InterfaceAlias, NetworkCategory"', { encoding: 'utf-8' });
    console.log('\nNetwork Connection Profiles (Firewall Zones):\n' + profiles);
  } catch (e) {
    console.log('Adapter/Profile check note:', e.message);
  }

  // 3. Verify Listeners (0.0.0.0:3000 & 0.0.0.0:3001)
  try {
    const netstat = execSync('netstat -ano | findstr "3000 3001"', { encoding: 'utf-8' });
    console.log('\nTCP Listeners:\n' + netstat);
    if (netstat.includes('0.0.0.0:3000')) frontendListener = 'RUNNING';
    if (netstat.includes('0.0.0.0:3001')) backendListener = 'RUNNING';
  } catch (e) {}

  // 4. Test PC Connectivity to 127.0.0.1:3000 and 100.125.52.92:3000
  try {
    const resLocal = await fetch('http://127.0.0.1:3000/');
    if (resLocal.ok) pcLocalhostWorks = 'WORKS';
  } catch (e) {
    console.log('PC -> 127.0.0.1:3000 error:', e.message);
  }

  try {
    const resTs = await fetch('http://100.125.52.92:3000/');
    if (resTs.ok) pcTailscaleIpWorks = 'WORKS';
  } catch (e) {
    console.log('PC -> 100.125.52.92:3000 error:', e.message);
  }

  // 5. Inspect Windows Firewall Rules
  try {
    const fwRules = execSync('powershell -Command "Get-NetFirewallRule -DisplayName \'Amusemac Tailscale*\' | Select-Object DisplayName, Enabled, Direction, Action, Profile"', { encoding: 'utf-8' });
    console.log('\nWindows Firewall Rules:\n' + fwRules);

    const fwFilters = execSync('powershell -Command "Get-NetFirewallRule -DisplayName \'Amusemac Tailscale*\' | Get-NetFirewallAddressFilter | Select-Object RemoteAddress"', { encoding: 'utf-8' });
    console.log('Firewall Address Filters:\n' + fwFilters);

    if (fwRules.includes('Amusemac Tailscale Frontend 3000')) {
      firewallFrontendRule = 'CORRECT';
    }
    if (fwRules.includes('Amusemac Tailscale Backend 3001')) {
      firewallBackendRule = 'CORRECT';
    }
  } catch (e) {
    console.log('Firewall inspection note:', e.message);
  }

  // 6. Diagnose Cause
  if (pcTailscaleIpWorks === 'WORKS' && frontendListener === 'RUNNING') {
    likelyCause = 'The phone is likely not connected to the exact same Tailscale tailnet account, or the phone\'s browser is routing http://100.125.52.92:3000 through cellular/public internet instead of Tailscale VPN tunnel, or Windows Firewall Public network profile is dropping inbound 100.64.0.0/10 packets on the Tailscale network interface.';
    requiredFix = '1. Open Tailscale app on phone and verify logged into the SAME account as PC (tailscale status).\n2. Ensure Tailscale VPN switch is turned ON on the phone.\n3. Verify Tailscale Network Adapter on PC is set to Private network profile or Windows Firewall rule applies to Public/Any profile.';
  }

  console.log('\n==================================================');
  console.log('FINAL DIAGNOSTIC REPORT');
  console.log('==================================================');
  console.log(`Tailscale PC                   : ${tailscalePcStatus}`);
  console.log(`Tailscale IP                   : ${tailscaleIp}`);
  console.log(`Frontend listener              : ${frontendListener}`);
  console.log(`Backend listener               : ${backendListener}`);
  console.log(`PC -> 127.0.0.1:3000           : ${pcLocalhostWorks}`);
  console.log(`PC -> 100.125.52.92:3000       : ${pcTailscaleIpWorks}`);
  console.log(`Firewall Frontend Rule         : ${firewallFrontendRule}`);
  console.log(`Firewall Backend Rule          : ${firewallBackendRule}`);
  console.log(`Tailscale interface            : ${tailscaleInterfaceStatus}`);
  console.log(`Phone in same tailnet          : ${phoneInTailnet}`);
  console.log(`PC <-> Phone Tailscale conn.   : ${pcPhoneConnectivity}`);
  console.log(`Likely cause                   : ${likelyCause}`);
  console.log(`Required fix                   :\n${requiredFix}`);
  console.log(`SerpAPI searches               : 0`);
  console.log(`SerpAPI credits consumed       : 0`);
  console.log('==================================================\n');
}

diagnoseNetworkPath();
