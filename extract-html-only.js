const { chromium } = require('playwright-core');
const fs = require('fs');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

async function extractHTML(siteInfo) {
  let browser;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏥 Extracting: ${siteInfo.name}`);
    console.log(`🔗 URL: ${siteInfo.url}`);
    console.log('='.repeat(60));

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    console.log(`🌐 Loading ${siteInfo.url}...`);
    await page.goto(siteInfo.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(2000);

    // Get HTML content without JavaScript execution
    const html = await page.content();
    const filename = `${siteInfo.name}-extracted.html`;
    fs.writeFileSync(filename, html);

    console.log(`✅ Extracted HTML: ${filename} (${html.length} bytes)`);

    return {
      success: true,
      site: siteInfo.name,
      filename: filename,
      size: html.length
    };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return {
      success: false,
      site: siteInfo.name,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function extractAll() {
  console.log('🏥 Starting HTML Extraction\n');

  const results = [];
  for (const site of sites) {
    const result = await extractHTML(site);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));

  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.site}: ${r.filename} (${r.size} bytes)`);
    } else {
      console.log(`❌ ${r.site}: ${r.error}`);
    }
  });

  return results;
}

extractAll()
  .then(() => console.log('\n✅ All HTML extraction complete!'))
  .catch(console.error);
