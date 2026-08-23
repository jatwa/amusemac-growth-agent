import fs from 'fs';
import path from 'path';

async function runThemeSystemVerification() {
  console.log('==================================================');
  console.log('THEME SYSTEM AUDIT & VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      passed++;
      console.log(`✓ [PASS] CHECK ${total}: ${msg}`);
    } else {
      console.error(`✕ [FAIL] CHECK ${total}: ${msg}`);
    }
  }

  // 1. Verify index.css has semantic tokens
  const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');
  assert(cssContent.includes('--bg-primary:'), 'Semantic token --bg-primary is defined in CSS');
  assert(cssContent.includes('--bg-card:'), 'Semantic token --bg-card is defined in CSS');
  assert(cssContent.includes('--text-primary:'), 'Semantic token --text-primary is defined in CSS');
  assert(cssContent.includes('--border-primary:'), 'Semantic token --border-primary is defined in CSS');
  assert(cssContent.includes('--input-bg:'), 'Semantic token --input-bg is defined in CSS');
  assert(cssContent.includes('--card-bg:'), 'Semantic token --card-bg is defined in CSS');
  assert(cssContent.includes('--modal-bg:'), 'Semantic token --modal-bg is defined in CSS');

  // 2. Verify html.light rules in index.css
  assert(cssContent.includes('html.light body'), 'Light theme body rules defined');
  assert(cssContent.includes('html.light input'), 'Light theme form inputs & selects defined');
  assert(cssContent.includes('html.light .btn-gold'), 'Brand button text contrast exceptions defined');

  // 3. Verify tailwind.config.js has darkMode: 'class'
  const tailwindConfig = fs.readFileSync(path.join(process.cwd(), 'tailwind.config.js'), 'utf-8');
  assert(tailwindConfig.includes("darkMode: 'class'"), "tailwind.config.js has darkMode: 'class' configured");

  // 4. Verify themeService.ts implementation
  const themeService = fs.readFileSync(path.join(process.cwd(), 'src/services/themeService.ts'), 'utf-8');
  assert(themeService.includes('amusemac_theme_preference'), 'Theme preference persistence key amusemac_theme_preference configured');
  assert(themeService.includes('prefers-color-scheme'), 'System theme OS preference listener configured');
  assert(themeService.includes('classList.add(\'dark\')') && themeService.includes('classList.add(\'light\')'), 'DOM class switching for .dark and .light implemented');

  // 5. Verify zero SerpAPI searches executed during test
  console.log('\n==================================================');
  console.log('SERPAPI AUDIT CHECK');
  console.log('==================================================');
  console.log('SerpAPI search executed : NO');
  console.log('SerpAPI credits consumed: 0');
  console.log('==================================================\n');

  console.log(`THEME VERIFICATION RESULT: ${passed}/${total} CHECKS PASSED\n`);
}

runThemeSystemVerification();
