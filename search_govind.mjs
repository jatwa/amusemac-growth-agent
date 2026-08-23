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
let foundGovind = false;

allFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.toLowerCase().includes('govind')) {
      foundGovind = true;
      const rel = path.relative(rootDir, file);
      console.log(`FOUND 'Govind' in: ${rel}`);
      content.split('\n').forEach((line, i) => {
        if (line.toLowerCase().includes('govind')) {
          console.log(`  Line ${i + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (e) {}
});

if (!foundGovind) {
  console.log("No mention of 'Govind' found anywhere in the application source code, seed files, database, or tests.");
}
