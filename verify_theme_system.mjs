import fs from 'fs';
import path from 'path';

function auditThemeTokens() {
  console.log('==================================================');
  console.log('STARTING COMPLETE COMPONENT THEME TOKEN AUDIT');
  console.log('==================================================\n');

  const cssPath = 'src/index.css';
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Extract all bg-[#...] and border-[#...] classes mapped in index.css
  const bgMapped = new Set([...cssContent.matchAll(/bg-\[#([0-9a-fA-F]{6})\]/g)].map(m => m[1].toLowerCase()));
  const borderMapped = new Set([...cssContent.matchAll(/border-\[#([0-9a-fA-F]{6})\]/g)].map(m => m[1].toLowerCase()));

  console.log(`Mapped hex backgrounds in index.css: ${bgMapped.size}`);
  console.log(`Mapped hex borders in index.css    : ${borderMapped.size}`);

  const componentsDir = 'src/components';
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  let unmappedBgs = new Set();
  let unmappedBorders = new Set();

  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const bgs = [...content.matchAll(/bg-\[#([0-9a-fA-F]{6})\]/g)].map(m => m[1].toLowerCase());
    const borders = [...content.matchAll(/border-\[#([0-9a-fA-F]{6})\]/g)].map(m => m[1].toLowerCase());

    bgs.forEach(hex => {
      if (!bgMapped.has(hex)) {
        unmappedBgs.add({ hex, file });
      }
    });

    borders.forEach(hex => {
      if (!borderMapped.has(hex)) {
        unmappedBorders.add({ hex, file });
      }
    });
  });

  console.log('\nUnmapped bg-[#...] classes in components:');
  if (unmappedBgs.size === 0) {
    console.log('✓ NONE! All hex backgrounds are fully covered in index.css.');
  } else {
    unmappedBgs.forEach(item => console.log(`  - bg-[#${item.hex}] in ${item.file}`));
  }

  console.log('\nUnmapped border-[#...] classes in components:');
  if (unmappedBorders.size === 0) {
    console.log('✓ NONE! All hex borders are fully covered in index.css.');
  } else {
    unmappedBorders.forEach(item => console.log(`  - border-[#${item.hex}] in ${item.file}`));
  }

  console.log('\n==================================================');
  console.log('AUDIT COMPLETE');
  console.log('==================================================\n');
}

auditThemeTokens();
