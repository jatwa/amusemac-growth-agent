import os from 'os';

function getTailscaleIP() {
  const interfaces = os.networkInterfaces();
  console.log('Available Network Interfaces:');
  
  let tailscaleIP = null;
  let fallbackLANIP = null;

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name] || [];
    for (const net of netList) {
      console.log(`- ${name}: ${net.address} (${net.family}, internal: ${net.internal})`);
      if (net.family === 'IPv4' && !net.internal) {
        // Tailscale IPs start with 100.x.y.z (CGNAT range 100.64.0.0/10)
        if (net.address.startsWith('100.')) {
          tailscaleIP = net.address;
        } else if (!fallbackLANIP && !net.address.startsWith('127.')) {
          fallbackLANIP = net.address;
        }
      }
    }
  }

  const finalIP = tailscaleIP || fallbackLANIP || '127.0.0.1';
  console.log(`\nDetected Tailscale IPv4: ${finalIP}`);
  return finalIP;
}

getTailscaleIP();
