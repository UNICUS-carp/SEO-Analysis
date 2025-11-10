const { chromium } = require('playwright-core');
const fs = require('fs');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

async function analyzeSite(siteInfo) {
  let browser;
  const outputDir = `./analysis-${siteInfo.name}`;

  try {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    console.log(`\n========================================`);
    console.log(`Analyzing: ${siteInfo.name}`);
    console.log(`URL: ${siteInfo.url}`);
    console.log(`========================================\n`);

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

    console.log(`Navigating to ${siteInfo.url}...`);
    await page.goto(siteInfo.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded successfully');

    // Get page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Get full HTML
    const html = await page.content();
    fs.writeFileSync(`${outputDir}/full-page.html`, html);
    console.log('✓ Saved full HTML');

    // Get all links
    const links = await page.$$eval('a', anchors =>
      anchors.map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        class: a.className,
        id: a.id
      }))
    );
    fs.writeFileSync(`${outputDir}/links.json`, JSON.stringify(links, null, 2));
    console.log(`✓ Found ${links.length} links`);

    // Get all buttons and CTA elements
    const buttons = await page.$$eval('button, input[type="submit"], a.btn, a.button, .cta, [class*="button"], [class*="btn"]', elements =>
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim() || el.value || el.getAttribute('aria-label'),
        class: el.className,
        id: el.id,
        type: el.type,
        href: el.href
      }))
    );
    fs.writeFileSync(`${outputDir}/buttons.json`, JSON.stringify(buttons, null, 2));
    console.log(`✓ Found ${buttons.length} buttons/CTAs`);

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
          placeholder: el.placeholder,
          required: el.required,
          id: el.id
        }))
      }))
    );
    fs.writeFileSync(`${outputDir}/forms.json`, JSON.stringify(forms, null, 2));
    console.log(`✓ Found ${forms.length} forms`);

    // Get phone numbers
    const phoneLinks = await page.$$eval('a[href^="tel:"]', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        number: link.href.replace('tel:', ''),
        class: link.className
      }))
    );
    fs.writeFileSync(`${outputDir}/phone-links.json`, JSON.stringify(phoneLinks, null, 2));
    console.log(`✓ Found ${phoneLinks.length} phone links`);

    // Get LINE links
    const lineLinks = await page.$$eval('a[href*="line.me"], a[href*="line://"], [class*="line"]', links =>
      links.filter(link => link.href).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        class: link.className
      }))
    );
    fs.writeFileSync(`${outputDir}/line-links.json`, JSON.stringify(lineLinks, null, 2));
    console.log(`✓ Found ${lineLinks.length} LINE links`);

    // Get navigation structure
    const navigation = await page.$$eval('nav, .nav, .menu, [class*="navigation"]', navs =>
      navs.map(nav => ({
        class: nav.className,
        id: nav.id,
        links: Array.from(nav.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
      }))
    );
    fs.writeFileSync(`${outputDir}/navigation.json`, JSON.stringify(navigation, null, 2));
    console.log(`✓ Found ${navigation.length} navigation menus`);

    // Get page structure
    const structure = await page.evaluate(() => {
      const sections = [];
      document.querySelectorAll('section, main, article, div[class*="section"], div[id*="section"]').forEach(el => {
        sections.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          headings: Array.from(el.querySelectorAll('h1, h2, h3, h4')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim()
          }))
        });
      });
      return sections;
    });
    fs.writeFileSync(`${outputDir}/structure.json`, JSON.stringify(structure, null, 2));
    console.log(`✓ Analyzed page structure (${structure.length} sections)`);

    // Check for existing analytics
    const analytics = await page.evaluate(() => {
      const scripts = Array.from(document.scripts).map(s => s.src);
      return {
        hasGA4: scripts.some(s => s.includes('googletagmanager.com/gtag') || s.includes('analytics.google.com')),
        hasGTM: scripts.some(s => s.includes('googletagmanager.com/gtm')),
        hasClarity: scripts.some(s => s.includes('clarity.ms')),
        hasFacebookPixel: scripts.some(s => s.includes('facebook') || s.includes('fbevents')),
        allScripts: scripts.filter(s => s.includes('analytics') || s.includes('tag') || s.includes('track'))
      };
    });
    fs.writeFileSync(`${outputDir}/analytics.json`, JSON.stringify(analytics, null, 2));
    console.log('✓ Checked for existing analytics');

    // Get reservation/booking related elements
    const reservationElements = await page.$$eval('[class*="reserv"], [class*="book"], [class*="appoint"], [id*="reserv"], [id*="book"], [id*="appoint"]', elements =>
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        class: el.className,
        id: el.id,
        href: el.href
      }))
    );
    fs.writeFileSync(`${outputDir}/reservation-elements.json`, JSON.stringify(reservationElements, null, 2));
    console.log(`✓ Found ${reservationElements.length} reservation-related elements`);

    // Get price/menu related elements
    const priceElements = await page.$$eval('[class*="price"], [class*="menu"], [class*="service"], [class*="fee"], [id*="price"], [id*="menu"]', elements =>
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 100),
        class: el.className,
        id: el.id
      }))
    );
    fs.writeFileSync(`${outputDir}/price-elements.json`, JSON.stringify(priceElements, null, 2));
    console.log(`✓ Found ${priceElements.length} price/menu elements`);

    // Take screenshot
    await page.screenshot({ path: `${outputDir}/screenshot.png`, fullPage: true });
    console.log('✓ Saved screenshot');

    // Get meta tags
    const metaTags = await page.evaluate(() => {
      const metas = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metas[name] = content;
        }
      });
      return metas;
    });
    fs.writeFileSync(`${outputDir}/meta-tags.json`, JSON.stringify(metaTags, null, 2));
    console.log('✓ Extracted meta tags');

    console.log(`\n✅ Analysis complete for ${siteInfo.name}`);
    console.log(`Output directory: ${outputDir}`);

    return {
      success: true,
      site: siteInfo.name,
      url: siteInfo.url,
      title: title,
      outputDir: outputDir,
      stats: {
        links: links.length,
        buttons: buttons.length,
        forms: forms.length,
        phoneLinks: phoneLinks.length,
        lineLinks: lineLinks.length,
        navigation: navigation.length,
        sections: structure.length,
        reservationElements: reservationElements.length,
        priceElements: priceElements.length
      },
      analytics: analytics
    };

  } catch (error) {
    console.error(`\n❌ Error analyzing ${siteInfo.name}:`, error.message);
    return {
      success: false,
      site: siteInfo.name,
      url: siteInfo.url,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeAll() {
  console.log('Starting analysis of all clinic websites...\n');
  const results = [];

  for (const site of sites) {
    const result = await analyzeSite(site);
    results.push(result);

    // Wait a bit between sites
    if (site !== sites[sites.length - 1]) {
      console.log('\nWaiting 2 seconds before next site...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save summary
  fs.writeFileSync('./analysis-summary.json', JSON.stringify(results, null, 2));

  console.log('\n========================================');
  console.log('ALL ANALYSIS COMPLETE');
  console.log('========================================\n');

  console.log('Summary:');
  results.forEach(result => {
    if (result.success) {
      console.log(`\n✅ ${result.site} (${result.url})`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Links: ${result.stats.links}`);
      console.log(`   Buttons/CTAs: ${result.stats.buttons}`);
      console.log(`   Forms: ${result.stats.forms}`);
      console.log(`   Phone Links: ${result.stats.phoneLinks}`);
      console.log(`   LINE Links: ${result.stats.lineLinks}`);
      console.log(`   Reservation Elements: ${result.stats.reservationElements}`);
      console.log(`   Analytics: GTM=${result.analytics.hasGTM}, GA4=${result.analytics.hasGA4}, Clarity=${result.analytics.hasClarity}`);
    } else {
      console.log(`\n❌ ${result.site} (${result.url})`);
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n📊 Summary saved to: analysis-summary.json');
}

analyzeAll().catch(console.error);
