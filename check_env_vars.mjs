import fs from 'fs';

const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];

envFiles.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`=== ${f} ===`);
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach(l => {
      if (l.toLowerCase().includes('payment') || l.toLowerCase().includes('razorpay') || l.toLowerCase().includes('stripe') || l.toLowerCase().includes('url')) {
        console.log(l.trim());
      }
    });
  } else {
    console.log(`${f}: NOT PRESENT`);
  }
});
