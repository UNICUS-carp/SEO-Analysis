const { chromium } = require('playwright-core');
const fs = require('fs');

async function analyzeSite() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    console.log('Navigating to https://sun-hills.info/...');
    await page.goto('https://sun-hills.info/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded successfully');

    // Get page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Get full HTML
    const html = await page.content();
    fs.writeFileSync('website-full.html', html);
    console.log('✓ Saved full HTML to website-full.html');

    // Get all links
    const links = await page.$$eval('a', anchors =>
      anchors.map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        class: a.className
      }))
    );
    fs.writeFileSync('links.json', JSON.stringify(links, null, 2));
    console.log('✓ Found', links.length, 'links');

    // Get all buttons
    const buttons = await page.$$eval('button, input[type="submit"], a.btn, a.button', elements =>
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim() || el.value,
        class: el.className,
        id: el.id,
        type: el.type
      }))
    );
    fs.writeFileSync('buttons.json', JSON.stringify(buttons, null, 2));
    console.log('✓ Found', buttons.length, 'buttons/CTAs');

    // Get all forms
    const forms = await page.$$eval('form', forms =>
      forms.map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        class: form.className,
        fields: Array.from(form.elements).map(el => ({
          name: el.name,
          type: el.type,
          placeholder: el.placeholder
        }))
      }))
    );
    fs.writeFileSync('forms.json', JSON.stringify(forms, null, 2));
    console.log('✓ Found', forms.length, 'forms');

    // Get page structure
    const structure = await page.evaluate(() => {
      const sections = [];
      document.querySelectorAll('section, main, article, div[class*="section"]').forEach(el => {
        sections.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          headings: Array.from(el.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim())
        });
      });
      return sections;
    });
    fs.writeFileSync('structure.json', JSON.stringify(structure, null, 2));
    console.log('✓ Analyzed page structure');

    // Check for existing analytics
    const analytics = await page.evaluate(() => {
      const scripts = Array.from(document.scripts).map(s => s.src);
      return {
        hasGA4: scripts.some(s => s.includes('googletagmanager.com/gtag') || s.includes('analytics.google.com')),
        hasGTM: scripts.some(s => s.includes('googletagmanager.com/gtm')),
        scripts: scripts.filter(s => s.includes('analytics') || s.includes('tag'))
      };
    });
    fs.writeFileSync('analytics.json', JSON.stringify(analytics, null, 2));
    console.log('✓ Checked for existing analytics');

    // Take screenshot
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('✓ Saved screenshot');

    console.log('\n=== Analysis Complete ===');
    console.log('Files created:');
    console.log('  - website-full.html');
    console.log('  - links.json');
    console.log('  - buttons.json');
    console.log('  - forms.json');
    console.log('  - structure.json');
    console.log('  - analytics.json');
    console.log('  - screenshot.png');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

analyzeSite().catch(console.error);
