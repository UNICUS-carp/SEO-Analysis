const fs = require('fs');
const cheerio = require('cheerio');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

async function fetchWithBuiltIn(siteInfo) {
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

    console.log('🌐 Fetching with Node.js built-in fetch...');

    // Try with built-in fetch (Node 18+)
    const response = await fetch(siteInfo.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched HTML (${html.length} bytes)`);

    // Save raw HTML
    fs.writeFileSync(`${outputDir}/page-source.html`, html);

    // Parse with Cheerio
    const $ = cheerio.load(html);

    console.log('🔍 Parsing HTML...');

    // Analyze the page
    const analysis = analyzeWithCheerio($, html, siteInfo);

    // Save all analysis results
    saveAnalysis(analysis, outputDir);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Analysis Complete: ${siteInfo.name}`);
    console.log(`📁 Output: ${outputDir}`);
    console.log('='.repeat(60) + '\n');

    return analysis.summary;

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return {
      success: false,
      site: siteInfo.name,
      url: siteInfo.url,
      error: error.message
    };
  }
}

function analyzeWithCheerio($, html, siteInfo) {
  // Page Info
  const pageInfo = {
    title: $('title').text(),
    url: siteInfo.url,
    description: $('meta[name="description"]').attr('content'),
    keywords: $('meta[name="keywords"]').attr('content')
  };
  console.log(`📄 Title: ${pageInfo.title}`);

  // All Links
  const links = [];
  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (href || text) {
      links.push({
        text: text,
        href: href,
        class: $el.attr('class'),
        id: $el.attr('id')
      });
    }
  });
  console.log(`🔗 Found ${links.length} links`);

  // Phone Links
  const phoneLinks = [];
  $('a[href^="tel:"]').each((i, el) => {
    const $el = $(el);
    phoneLinks.push({
      text: $el.text().trim(),
      number: $el.attr('href').replace('tel:', ''),
      class: $el.attr('class')
    });
  });
  console.log(`📞 Found ${phoneLinks.length} phone links`);

  // LINE Links
  const lineLinks = [];
  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const text = $el.text().trim();
    const className = $el.attr('class') || '';

    if (href.includes('line.me') || href.includes('line://') ||
        className.toLowerCase().includes('line') ||
        text.toLowerCase().includes('line')) {
      lineLinks.push({
        text: text,
        href: href,
        class: className
      });
    }
  });
  console.log(`💚 Found ${lineLinks.length} LINE links`);

  // Forms
  const forms = [];
  $('form').each((i, el) => {
    const $form = $(el);
    const fields = [];

    $form.find('input, select, textarea').each((j, field) => {
      const $field = $(field);
      fields.push({
        name: $field.attr('name'),
        type: $field.attr('type'),
        placeholder: $field.attr('placeholder'),
        required: $field.attr('required') !== undefined
      });
    });

    forms.push({
      action: $form.attr('action'),
      method: $form.attr('method'),
      id: $form.attr('id'),
      fields: fields
    });
  });
  console.log(`📝 Found ${forms.length} forms`);

  // Buttons & CTAs
  const buttons = [];
  $('button, input[type="submit"], input[type="button"], a.btn, a.button, [class*="button"], [class*="btn"], [class*="cta"]').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim() || $el.attr('value');
    if (text) {
      buttons.push({
        tag: el.name,
        text: text,
        class: $el.attr('class'),
        href: $el.attr('href')
      });
    }
  });
  console.log(`🔘 Found ${buttons.length} buttons/CTAs`);

  // Navigation
  const navigation = [];
  $('nav a, .nav a, .menu a, header a').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text) {
      navigation.push({
        text: text,
        href: $el.attr('href')
      });
    }
  });
  console.log(`🧭 Found ${navigation.length} navigation items`);

  // Reservation Elements
  const reservationElements = [];
  $('[class*="reserv"], [class*="book"], [class*="appoint"], [class*="予約"]').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text) {
      reservationElements.push({
        tag: el.name,
        text: text.substring(0, 100),
        class: $el.attr('class'),
        href: $el.attr('href')
      });
    }
  });
  console.log(`📅 Found ${reservationElements.length} reservation elements`);

  // Price/Menu Elements
  const priceElements = [];
  $('[class*="price"], [class*="fee"], [class*="料金"], [class*="menu"], [class*="メニュー"]').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text) {
      priceElements.push({
        tag: el.name,
        text: text.substring(0, 150),
        class: $el.attr('class')
      });
    }
  });
  console.log(`💰 Found ${priceElements.length} price/menu elements`);

  // Analytics Detection
  const analytics = {
    hasGA4: html.includes('gtag') || html.includes('GA_MEASUREMENT_ID') || html.includes('G-'),
    hasGTM: html.includes('GTM-'),
    hasClarity: html.includes('clarity'),
    hasFacebookPixel: html.includes('fbq')
  };
  console.log(`📊 Analytics: GTM=${analytics.hasGTM}, GA4=${analytics.hasGA4}`);

  const summary = {
    site: siteInfo.name,
    url: siteInfo.url,
    analyzedAt: new Date().toISOString(),
    pageInfo: pageInfo,
    stats: {
      htmlSize: html.length,
      links: links.length,
      phoneLinks: phoneLinks.length,
      lineLinks: lineLinks.length,
      buttons: buttons.length,
      forms: forms.length,
      navigation: navigation.length,
      reservationElements: reservationElements.length,
      priceElements: priceElements.length
    },
    analytics: analytics,
    keyFindings: {
      hasPhoneNumber: phoneLinks.length > 0,
      hasReservationSystem: reservationElements.length > 0 || forms.length > 0,
      hasLineIntegration: lineLinks.length > 0,
      hasPricing: priceElements.length > 0
    }
  };

  return {
    summary,
    links,
    phoneLinks,
    lineLinks,
    forms,
    buttons,
    navigation,
    reservationElements,
    priceElements
  };
}

function saveAnalysis(analysis, outputDir) {
  fs.writeFileSync(`${outputDir}/all-links.json`, JSON.stringify(analysis.links, null, 2));
  fs.writeFileSync(`${outputDir}/phone-links.json`, JSON.stringify(analysis.phoneLinks, null, 2));
  fs.writeFileSync(`${outputDir}/line-links.json`, JSON.stringify(analysis.lineLinks, null, 2));
  fs.writeFileSync(`${outputDir}/forms.json`, JSON.stringify(analysis.forms, null, 2));
  fs.writeFileSync(`${outputDir}/buttons-ctas.json`, JSON.stringify(analysis.buttons, null, 2));
  fs.writeFileSync(`${outputDir}/navigation.json`, JSON.stringify(analysis.navigation, null, 2));
  fs.writeFileSync(`${outputDir}/reservation-elements.json`, JSON.stringify(analysis.reservationElements, null, 2));
  fs.writeFileSync(`${outputDir}/price-menu-elements.json`, JSON.stringify(analysis.priceElements, null, 2));
  fs.writeFileSync(`${outputDir}/analysis-summary.json`, JSON.stringify(analysis.summary, null, 2));
}

async function crawlAll() {
  console.log('\n🏥 Clinic Website Crawler - Node.js Fetch API');
  console.log('='.repeat(60) + '\n');

  const results = [];

  for (const site of sites) {
    const result = await fetchWithBuiltIn(site);
    results.push(result);

    if (site !== sites[sites.length - 1]) {
      console.log('⏳ Waiting 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  fs.writeFileSync('./clinic-analysis/all-sites-summary.json', JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('🎉 CRAWLING COMPLETE');
  console.log('='.repeat(60) + '\n');

  results.forEach(result => {
    if (result.stats) {
      console.log(`✅ ${result.site} - ${result.pageInfo.title}`);
      console.log(`   📞 Phone: ${result.stats.phoneLinks} | 💚 LINE: ${result.stats.lineLinks} | 📝 Forms: ${result.stats.forms}`);
    } else {
      console.log(`❌ ${result.site}: ${result.error}`);
    }
  });

  console.log('\n📁 Results: ./clinic-analysis/\n');
}

crawlAll().catch(console.error);
