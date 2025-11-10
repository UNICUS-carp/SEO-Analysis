const { chromium } = require('playwright-core');
const fs = require('fs');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

async function analyzeSiteWithDevTools(siteInfo) {
  let browser;
  const outputDir = `./clinic-analysis/${siteInfo.name}`;

  try {
    // Create output directory
    if (!fs.existsSync('./clinic-analysis')) {
      fs.mkdirSync('./clinic-analysis');
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏥 Analyzing: ${siteInfo.name}`);
    console.log(`🔗 URL: ${siteInfo.url}`);
    console.log('='.repeat(60));

    console.log('🚀 Launching browser with DevTools...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });

    // Enable DevTools-like features
    const page = await context.newPage();

    // Set extra HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    console.log(`🌐 Navigating to ${siteInfo.url}...`);

    // Try with different wait strategies
    try {
      await page.goto(siteInfo.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch (e) {
      console.log('⚠️  First attempt failed, trying with load event...');
      await page.goto(siteInfo.url, {
        waitUntil: 'load',
        timeout: 60000
      });
    }

    // Wait for page to be ready
    await page.waitForTimeout(3000);

    console.log('✅ Page loaded successfully!');

    // === DEVTOOLS-STYLE ANALYSIS ===

    // 1. Page Information
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      readyState: document.readyState
    }));
    console.log(`📄 Title: ${pageInfo.title}`);

    // 2. Get full HTML (like Elements tab)
    const html = await page.content();
    fs.writeFileSync(`${outputDir}/page-source.html`, html);
    console.log(`✅ Saved page source (${html.length} bytes)`);

    // 3. Network Analysis (like Network tab)
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize
      }));
    });
    fs.writeFileSync(`${outputDir}/network-resources.json`, JSON.stringify(resources, null, 2));
    console.log(`🌐 Found ${resources.length} network resources`);

    // 4. Console Logs (like Console tab)
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // 5. All Links (CTA Analysis)
    const links = await page.$$eval('a', anchors =>
      anchors.map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        class: a.className,
        id: a.id,
        target: a.target,
        ariaLabel: a.getAttribute('aria-label')
      })).filter(link => link.text || link.ariaLabel)
    );
    fs.writeFileSync(`${outputDir}/all-links.json`, JSON.stringify(links, null, 2));
    console.log(`🔗 Found ${links.length} links`);

    // 6. Phone Numbers (tel: links)
    const phoneLinks = await page.$$eval('a[href^="tel:"]', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        number: link.href.replace('tel:', ''),
        class: link.className,
        visible: link.offsetParent !== null
      }))
    );
    fs.writeFileSync(`${outputDir}/phone-links.json`, JSON.stringify(phoneLinks, null, 2));
    console.log(`📞 Found ${phoneLinks.length} phone links`);

    // 7. Forms (Reservation/Contact)
    const forms = await page.$$eval('form', forms =>
      forms.map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        class: form.className,
        name: form.name,
        fields: Array.from(form.elements).map(el => ({
          name: el.name,
          type: el.type,
          placeholder: el.placeholder,
          required: el.required,
          id: el.id,
          value: el.value
        }))
      }))
    );
    fs.writeFileSync(`${outputDir}/forms.json`, JSON.stringify(forms, null, 2));
    console.log(`📝 Found ${forms.length} forms`);

    // 8. Buttons & CTAs
    const buttons = await page.$$eval(
      'button, input[type="submit"], input[type="button"], a.btn, a.button, [class*="button"], [class*="btn"], [class*="cta"]',
      elements =>
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent.trim() || el.value || el.getAttribute('aria-label'),
          class: el.className,
          id: el.id,
          type: el.type,
          href: el.href,
          visible: el.offsetParent !== null
        })).filter(btn => btn.text)
    );
    fs.writeFileSync(`${outputDir}/buttons-ctas.json`, JSON.stringify(buttons, null, 2));
    console.log(`🔘 Found ${buttons.length} buttons/CTAs`);

    // 9. LINE Links
    const lineLinks = await page.$$eval('a', links =>
      links.filter(a =>
        a.href.includes('line.me') ||
        a.href.includes('line://') ||
        a.className.toLowerCase().includes('line') ||
        a.textContent.toLowerCase().includes('line')
      ).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        class: link.className
      }))
    );
    fs.writeFileSync(`${outputDir}/line-links.json`, JSON.stringify(lineLinks, null, 2));
    console.log(`💚 Found ${lineLinks.length} LINE links`);

    // 10. Navigation Structure
    const navigation = await page.$$eval('nav, .nav, .menu, [class*="navigation"], header a', elements => {
      const navItems = [];
      elements.forEach(el => {
        if (el.tagName === 'A') {
          navItems.push({
            text: el.textContent.trim(),
            href: el.href,
            type: 'link'
          });
        } else {
          const links = el.querySelectorAll('a');
          links.forEach(a => {
            navItems.push({
              text: a.textContent.trim(),
              href: a.href,
              type: 'nav'
            });
          });
        }
      });
      return navItems.filter(item => item.text);
    });
    fs.writeFileSync(`${outputDir}/navigation.json`, JSON.stringify(navigation, null, 2));
    console.log(`🧭 Found ${navigation.length} navigation items`);

    // 11. Page Structure (Sections)
    const structure = await page.evaluate(() => {
      const sections = [];
      document.querySelectorAll('section, main, article, div[class*="section"], div[id*="section"]').forEach(el => {
        const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim()
        }));

        if (headings.length > 0 || el.id || el.className) {
          sections.push({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            headings: headings
          });
        }
      });
      return sections;
    });
    fs.writeFileSync(`${outputDir}/page-structure.json`, JSON.stringify(structure, null, 2));
    console.log(`🏗️  Found ${structure.length} page sections`);

    // 12. Analytics Detection
    const analytics = await page.evaluate(() => {
      const scripts = Array.from(document.scripts).map(s => s.src);
      const allText = document.documentElement.outerHTML;

      return {
        hasGA4: scripts.some(s => s.includes('googletagmanager.com/gtag') || s.includes('analytics.google.com')) ||
                allText.includes('gtag(') || allText.includes('GA_MEASUREMENT_ID'),
        hasGTM: scripts.some(s => s.includes('googletagmanager.com/gtm')) ||
                allText.includes('GTM-'),
        hasClarity: scripts.some(s => s.includes('clarity.ms')) ||
                    allText.includes('clarity'),
        hasFacebookPixel: scripts.some(s => s.includes('facebook') || s.includes('fbevents')) ||
                          allText.includes('fbq('),
        hasYahoo: allText.includes('yahoo') && allText.includes('analytics'),
        analyticsScripts: scripts.filter(s =>
          s.includes('analytics') ||
          s.includes('tag') ||
          s.includes('track') ||
          s.includes('gtag') ||
          s.includes('gtm')
        )
      };
    });
    fs.writeFileSync(`${outputDir}/analytics-detection.json`, JSON.stringify(analytics, null, 2));
    console.log(`📊 Analytics: GTM=${analytics.hasGTM}, GA4=${analytics.hasGA4}, Clarity=${analytics.hasClarity}`);

    // 13. Reservation/Booking Elements
    const reservationElements = await page.$$eval(
      '[class*="reserv"], [class*="book"], [class*="appoint"], [id*="reserv"], [id*="book"], [id*="appoint"], [class*="予約"], [id*="予約"]',
      elements =>
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          class: el.className,
          id: el.id,
          href: el.href
        })).filter(el => el.text)
    );
    fs.writeFileSync(`${outputDir}/reservation-elements.json`, JSON.stringify(reservationElements, null, 2));
    console.log(`📅 Found ${reservationElements.length} reservation elements`);

    // 14. Price/Menu Elements
    const priceElements = await page.$$eval(
      '[class*="price"], [class*="fee"], [class*="料金"], [class*="menu"], [class*="メニュー"]',
      elements =>
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 150),
          class: el.className,
          id: el.id
        })).filter(el => el.text && el.text.length > 0)
    );
    fs.writeFileSync(`${outputDir}/price-menu-elements.json`, JSON.stringify(priceElements, null, 2));
    console.log(`💰 Found ${priceElements.length} price/menu elements`);

    // 15. Meta Tags
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

    // 16. Screenshot (like DevTools screenshot)
    await page.screenshot({
      path: `${outputDir}/screenshot-full.png`,
      fullPage: true
    });
    console.log(`📸 Saved full-page screenshot`);

    // 17. Summary Report
    const summary = {
      site: siteInfo.name,
      url: siteInfo.url,
      analyzedAt: new Date().toISOString(),
      pageInfo: pageInfo,
      stats: {
        links: links.length,
        phoneLinks: phoneLinks.length,
        lineLinks: lineLinks.length,
        buttons: buttons.length,
        forms: forms.length,
        navigation: navigation.length,
        sections: structure.length,
        reservationElements: reservationElements.length,
        priceElements: priceElements.length,
        resources: resources.length
      },
      analytics: analytics,
      keyFindings: {
        hasPhoneNumber: phoneLinks.length > 0,
        hasReservationSystem: reservationElements.length > 0 || forms.length > 0,
        hasLineIntegration: lineLinks.length > 0,
        hasPricing: priceElements.length > 0
      }
    };

    fs.writeFileSync(`${outputDir}/analysis-summary.json`, JSON.stringify(summary, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Analysis Complete: ${siteInfo.name}`);
    console.log(`📁 Output: ${outputDir}`);
    console.log('='.repeat(60) + '\n');

    return summary;

  } catch (error) {
    console.error(`\n❌ Error analyzing ${siteInfo.name}:`);
    console.error(error.message);
    console.error(error.stack);

    return {
      success: false,
      site: siteInfo.name,
      url: siteInfo.url,
      error: error.message,
      errorStack: error.stack
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeAllClinics() {
  console.log('\n🏥 Starting Analysis of All Clinic Websites');
  console.log('=' .repeat(60));

  const results = [];

  for (const site of sites) {
    const result = await analyzeSiteWithDevTools(site);
    results.push(result);

    // Wait between sites
    if (site !== sites[sites.length - 1]) {
      console.log('⏳ Waiting 3 seconds before next site...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Save final summary
  fs.writeFileSync('./clinic-analysis/all-sites-summary.json', JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL ANALYSIS COMPLETE');
  console.log('='.repeat(60));

  console.log('\n📊 SUMMARY:\n');
  results.forEach(result => {
    if (result.stats) {
      console.log(`✅ ${result.site}`);
      console.log(`   📞 Phone: ${result.stats.phoneLinks}`);
      console.log(`   💚 LINE: ${result.stats.lineLinks}`);
      console.log(`   📝 Forms: ${result.stats.forms}`);
      console.log(`   📅 Reservations: ${result.stats.reservationElements}`);
      console.log(`   📊 Analytics: GTM=${result.analytics.hasGTM}, GA4=${result.analytics.hasGA4}`);
    } else {
      console.log(`❌ ${result.site}: ${result.error}`);
    }
    console.log('');
  });

  console.log('📁 All results saved to: ./clinic-analysis/');
}

analyzeAllClinics().catch(console.error);
