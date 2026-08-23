import fs from 'fs';
import path from 'path';

const DB_PATH = 'C:\\Users\\amuse\\.gemini\\antigravity\\scratch\\amusemac-growth-agent\\server\\data\\db.json';

console.log('==================================================');
console.log('ACTIVE USER & SESSION INSPECTION');
console.log('==================================================\n');

if (fs.existsSync(DB_PATH)) {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);

    console.log('Database loaded successfully.');
    
    if (db.users) {
      console.log('\nUsers in Database:', Object.keys(db.users).length);
      console.log(JSON.stringify(db.users, null, 2));
    }
    
    if (db.sessions) {
      console.log('\nActive Sessions in Database:', Object.keys(db.sessions).length);
      console.log(JSON.stringify(db.sessions, null, 2));
    }
  } catch (e) {
    console.log('Error reading db.json:', e.message);
  }
} else {
  console.log('db.json not present at path.');
}
