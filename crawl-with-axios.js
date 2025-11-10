const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

// Create axios instance with custom settings
const axiosInstance = axios.create({
  timeout: 30000,
  maxRedirects: 5,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Accept self-signed certificates
  }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  }
});

async function analyzeSiteWithCheerio(siteInfo) {
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

    console.log('🌐 Fetching page...');
    const response = await axiosInstance.get(siteInfo.url);

    console.log(`✅ Page fetched (${response.data.length} bytes)`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Save raw HTML
    fs.writeFileSync(`${outputDir}/page-source.html`, response.data);

    // Load with Cheerio for parsing
    const $ = cheerio.load(response.data);

    console.log('🔍 Parsing HTML with Cheerio...');

    // 1. Page Info
    const pageInfo = {
      title: $('title').text(),
      url: siteInfo.url,
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content')
    };
    console.log(`📄 Title: ${pageInfo.title}`);

    // 2. All Links
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
          id: $el.attr('id'),
          target: $el.attr('target')
        });
      }
    });
    fs.writeFileSync(`${outputDir}/all-links.json`, JSON.stringify(links, null, 2));
    console.log(`🔗 Found ${links.length} links`);

    // 3. Phone Links
    const phoneLinks = [];
    $('a[href^="tel:"]').each((i, el) => {
      const $el = $(el);
      phoneLinks.push({
        text: $el.text().trim(),
        number: $el.attr('href').replace('tel:', ''),
        class: $el.attr('class')
      });
    });
    fs.writeFileSync(`${outputDir}/phone-links.json`, JSON.stringify(phoneLinks, null, 2));
    console.log(`📞 Found ${phoneLinks.length} phone links`);

    // 4. LINE Links
    const lineLinks = [];
    $('a').each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const className = $el.attr('class') || '';
      const text = $el.text().trim();

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
    fs.writeFileSync(`${outputDir}/line-links.json`, JSON.stringify(lineLinks, null, 2));
    console.log(`💚 Found ${lineLinks.length} LINE links`);

    // 5. Forms
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
          required: $field.attr('required') !== undefined,
          id: $field.attr('id')
        });
      });

      forms.push({
        action: $form.attr('action'),
        method: $form.attr('method'),
        id: $form.attr('id'),
        class: $form.attr('class'),
        name: $form.attr('name'),
        fields: fields
      });
    });
    fs.writeFileSync(`${outputDir}/forms.json`, JSON.stringify(forms, null, 2));
    console.log(`📝 Found ${forms.length} forms`);

    // 6. Buttons & CTAs
    const buttons = [];
    $('button, input[type="submit"], input[type="button"], a.btn, a.button, [class*="button"], [class*="btn"], [class*="cta"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim() || $el.attr('value') || $el.attr('aria-label');
      if (text) {
        buttons.push({
          tag: el.name,
          text: text,
          class: $el.attr('class'),
          id: $el.attr('id'),
          type: $el.attr('type'),
          href: $el.attr('href')
        });
      }
    });
    fs.writeFileSync(`${outputDir}/buttons-ctas.json`, JSON.stringify(buttons, null, 2));
    console.log(`🔘 Found ${buttons.length} buttons/CTAs`);

    // 7. Navigation
    const navigation = [];
    $('nav a, .nav a, .menu a, [class*="navigation"] a, header a').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        navigation.push({
          text: text,
          href: $el.attr('href')
        });
      }
    });
    fs.writeFileSync(`${outputDir}/navigation.json`, JSON.stringify(navigation, null, 2));
    console.log(`🧭 Found ${navigation.length} navigation items`);

    // 8. Page Structure
    const structure = [];
    $('section, main, article, div[class*="section"], div[id*="section"]').each((i, el) => {
      const $el = $(el);
      const headings = [];

      $el.find('h1, h2, h3, h4, h5, h6').each((j, h) => {
        headings.push({
          tag: h.name,
          text: $(h).text().trim()
        });
      });

      if (headings.length > 0 || $el.attr('id') || $el.attr('class')) {
        structure.push({
          tag: el.name,
          id: $el.attr('id'),
          class: $el.attr('class'),
          headings: headings
        });
      }
    });
    fs.writeFileSync(`${outputDir}/page-structure.json`, JSON.stringify(structure, null, 2));
    console.log(`🏗️  Found ${structure.length} page sections`);

    // 9. Analytics Detection
    const html = response.data;
    const analytics = {
      hasGA4: html.includes('googletagmanager.com/gtag') || html.includes('analytics.google.com') ||
              html.includes('gtag(') || html.includes('GA_MEASUREMENT_ID'),
      hasGTM: html.includes('googletagmanager.com/gtm') || html.includes('GTM-'),
      hasClarity: html.includes('clarity.ms') || html.includes('clarity'),
      hasFacebookPixel: html.includes('facebook') && html.includes('fbevents') || html.includes('fbq('),
      hasYahoo: html.includes('yahoo') && html.includes('analytics')
    };
    fs.writeFileSync(`${outputDir}/analytics-detection.json`, JSON.stringify(analytics, null, 2));
    console.log(`📊 Analytics: GTM=${analytics.hasGTM}, GA4=${analytics.hasGA4}, Clarity=${analytics.hasClarity}`);

    // 10. Reservation Elements
    const reservationElements = [];
    $('[class*="reserv"], [class*="book"], [class*="appoint"], [id*="reserv"], [id*="book"], [id*="appoint"], [class*="予約"], [id*="予約"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        reservationElements.push({
          tag: el.name,
          text: text.substring(0, 100),
          class: $el.attr('class'),
          id: $el.attr('id'),
          href: $el.attr('href')
        });
      }
    });
    fs.writeFileSync(`${outputDir}/reservation-elements.json`, JSON.stringify(reservationElements, null, 2));
    console.log(`📅 Found ${reservationElements.length} reservation elements`);

    // 11. Price/Menu Elements
    const priceElements = [];
    $('[class*="price"], [class*="fee"], [class*="料金"], [class*="menu"], [class*="メニュー"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        priceElements.push({
          tag: el.name,
          text: text.substring(0, 150),
          class: $el.attr('class'),
          id: $el.attr('id')
        });
      }
    });
    fs.writeFileSync(`${outputDir}/price-menu-elements.json`, JSON.stringify(priceElements, null, 2));
    console.log(`💰 Found ${priceElements.length} price/menu elements`);

    // 12. Meta Tags
    const metaTags = {};
    $('meta').each((i, el) => {
      const $el = $(el);
      const name = $el.attr('name') || $el.attr('property');
      const content = $el.attr('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });
    fs.writeFileSync(`${outputDir}/meta-tags.json`, JSON.stringify(metaTags, null, 2));

    // Summary
    const summary = {
      site: siteInfo.name,
      url: siteInfo.url,
      analyzedAt: new Date().toISOString(),
      pageInfo: pageInfo,
      stats: {
        htmlSize: response.data.length,
        links: links.length,
        phoneLinks: phoneLinks.length,
        lineLinks: lineLinks.length,
        buttons: buttons.length,
        forms: forms.length,
        navigation: navigation.length,
        sections: structure.length,
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

    fs.writeFileSync(`${outputDir}/analysis-summary.json`, JSON.stringify(summary, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Analysis Complete: ${siteInfo.name}`);
    console.log(`📁 Output: ${outputDir}`);
    console.log('='.repeat(60) + '\n');

    return summary;

  } catch (error) {
    console.error(`\n❌ Error analyzing ${siteInfo.name}:`);
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status} ${error.response.statusText}`);
    }

    return {
      success: false,
      site: siteInfo.name,
      url: siteInfo.url,
      error: error.message,
      statusCode: error.response?.status
    };
  }
}

async function crawlAllClinics() {
  console.log('\n🏥 Starting Clinic Website Crawling with Axios + Cheerio');
  console.log('='.repeat(60) + '\n');

  const results = [];

  for (const site of sites) {
    const result = await analyzeSiteWithCheerio(site);
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
  console.log('🎉 ALL CRAWLING COMPLETE');
  console.log('='.repeat(60));

  console.log('\n📊 SUMMARY:\n');
  results.forEach(result => {
    if (result.stats) {
      console.log(`✅ ${result.site}`);
      console.log(`   📄 Title: ${result.pageInfo.title}`);
      console.log(`   📞 Phone Links: ${result.stats.phoneLinks}`);
      console.log(`   💚 LINE Links: ${result.stats.lineLinks}`);
      console.log(`   📝 Forms: ${result.stats.forms}`);
      console.log(`   📅 Reservation Elements: ${result.stats.reservationElements}`);
      console.log(`   📊 Analytics: GTM=${result.analytics.hasGTM}, GA4=${result.analytics.hasGA4}`);
    } else {
      console.log(`❌ ${result.site}: ${result.error}`);
    }
    console.log('');
  });

  console.log('📁 All results saved to: ./clinic-analysis/\n');

  return results;
}

crawlAllClinics()
  .then(() => console.log('✅ Crawling script completed successfully!'))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
