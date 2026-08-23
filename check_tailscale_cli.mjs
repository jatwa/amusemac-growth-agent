import { execSync } from 'child_process';

try {
  const tsOut = execSync(`powershell -Command "& 'C:\\Program Files\\Tailscale\\tailscale.exe' status"`, { encoding: 'utf-8' });
  console.log('Tailscale Status Output:\n' + tsOut);
} catch (e) {
  console.log('Tailscale CLI Error:', e.message);
}
