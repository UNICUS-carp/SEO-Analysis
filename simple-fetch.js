const https = require('https');
const http = require('http');
const fs = require('fs');

const sites = [
  { name: 'mori18', url: 'https://mori18.com/' },
  { name: 'fujii-hone', url: 'https://fujii-hone.com/' },
  { name: 'sakatsume-bsac', url: 'https://sakatsume-bsac.com/' }
];

function fetchSite(siteInfo) {
  return new Promise((resolve, reject) => {
    const url = new URL(siteInfo.url);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      rejectUnauthorized: false
    };

    console.log(`Fetching ${siteInfo.name}...`);

    const req = client.request(options, (res) => {
      let data = '';

      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Redirect to: ${res.headers.location}`);
        return reject(new Error(`Redirect: ${res.headers.location}`));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        fs.writeFileSync(`${siteInfo.name}-raw.html`, data);
        console.log(`✓ Saved ${siteInfo.name} (${data.length} bytes)`);
        resolve({ success: true, site: siteInfo.name, size: data.length });
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error fetching ${siteInfo.name}:`, error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function fetchAll() {
  console.log('Fetching all clinic websites...\n');
  const results = [];

  for (const site of sites) {
    try {
      const result = await fetchSite(site);
      results.push(result);
    } catch (error) {
      results.push({ success: false, site: site.name, error: error.message });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n========================================');
  console.log('Summary:');
  results.forEach(r => {
    if (r.success) {
      console.log(`✓ ${r.site}: ${r.size} bytes`);
    } else {
      console.log(`✗ ${r.site}: ${r.error}`);
    }
  });
}

fetchAll().catch(console.error);
