import fs from 'fs';
import path from 'path';

const rootDir = 'C:\\Users\\amuse\\.gemini\\antigravity\\scratch\\amusemac-growth-agent';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist') return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(rootDir);
const keywords = ['razorpay', 'stripe', 'checkout', 'payment', 'plan', 'price', 'subscription', 'upgrade', 'billing', 'amount', 'rupee', 'inr', 'usd', '$', '₹', 'buy'];

console.log('==================================================');
console.log('PAYMENT & SUBSCRIPTION CONFIGURATION SCANNER');
console.log('==================================================\n');

allFiles.forEach(file => {
  const relPath = path.relative(rootDir, file);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      if (
        lower.includes('razorpay') ||
        lower.includes('stripe') ||
        lower.includes('checkout') ||
        lower.includes('payment') ||
        lower.includes('planid') ||
        lower.includes('priceid') ||
        lower.includes('subscription') ||
        lower.includes('billing') ||
        lower.includes('rzp_') ||
        lower.includes('price_') ||
        lower.includes('pln_')
      ) {
        console.log(`[${relPath}:${idx + 1}] ${line.trim()}`);
      }
    });
  } catch (e) {}
});

console.log('\n==================================================');
console.log('SCAN COMPLETE');
console.log('==================================================');
