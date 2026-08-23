import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir(path.join(process.cwd(), 'src'));
console.log(`Auditing ${files.length} source files...\n`);

const bgHexes = new Set();
const borderHexes = new Set();
const textClasses = new Set();
const inlineStyles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(process.cwd(), file);

  // Match bg-[#...]
  const bgMatches = content.match(/bg-\[\#[0-9a-fA-F]{3,6}\]/g) || [];
  bgMatches.forEach(m => bgHexes.add(m));

  // Match border-[#...]
  const borderMatches = content.match(/border-\[\#[0-9a-fA-F]{3,6}\]/g) || [];
  borderMatches.forEach(m => borderHexes.add(m));

  // Match text-slate-*, text-white, text-[#...]
  const textMatches = content.match(/text-(white|slate-\d+|gray-\d+|\[\#[0-9a-fA-F]{3,6}\])/g) || [];
  textMatches.forEach(m => textClasses.add(m));

  // Match style={{ ... }}
  if (content.includes('style={{')) {
    inlineStyles.push(relPath);
  }
});

console.log('--- HARDCODED BG HEXES ---');
console.log(Array.from(bgHexes).sort());

console.log('\n--- HARDCODED BORDER HEXES ---');
console.log(Array.from(borderHexes).sort());

console.log('\n--- HARDCODED TEXT CLASSES ---');
console.log(Array.from(textClasses).sort());

console.log('\n--- FILES WITH INLINE STYLES ---');
console.log(inlineStyles);
