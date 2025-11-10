#!/usr/bin/env python3
"""Final attempt with httpx (HTTP/2 support)"""
import httpx
from bs4 import BeautifulSoup
import json
import os
import time

sites = [
    {'name': 'mori18', 'url': 'https://mori18.com/'},
    {'name': 'fujii-hone', 'url': 'https://fujii-hone.com/'},
    {'name': 'sakatsume-bsac', 'url': 'https://sakatsume-bsac.com/'}
]

def test_httpx(site_info):
    """Test site with httpx"""
    print(f"\n{'='*60}")
    print(f"🏥 Testing: {site_info['name']}")
    print(f"🔗 URL: {site_info['url']}")
    print('='*60)

    print('🌐 Attempting with httpx (HTTP/2)...')

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }

    try:
        with httpx.Client(http2=True, verify=False, timeout=30.0, follow_redirects=True) as client:
            response = client.get(site_info['url'], headers=headers)

            print(f"📊 Status: {response.status_code}")
            print(f"📡 HTTP Version: {response.http_version}")

            if response.status_code == 200:
                print(f"✅ SUCCESS! ({len(response.text)} bytes)")
                return response.text
            else:
                print(f"❌ Failed: HTTP {response.status_code}")
                return None

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    print('\n🏥 Final Crawling Attempt - httpx with HTTP/2')
    print('='*60)

    results = {}

    for site in sites:
        html = test_httpx(site)

        if html:
            results[site['name']] = {
                'success': True,
                'size': len(html)
            }

            # Save HTML
            output_dir = f"./clinic-analysis/{site['name']}"
            os.makedirs(output_dir, exist_ok=True)

            with open(f"{output_dir}/page-source.html", 'w', encoding='utf-8') as f:
                f.write(html)

            # Quick parse
            soup = BeautifulSoup(html, 'lxml')
            title = soup.title.string if soup.title else 'No title'
            phone_count = len(soup.find_all('a', href=lambda x: x and x.startswith('tel:')))

            print(f"   📄 Title: {title}")
            print(f"   📞 Phone links: {phone_count}")

            results[site['name']].update({
                'title': title,
                'phoneLinks': phone_count
            })
        else:
            results[site['name']] = {
                'success': False
            }

        if site != sites[-1]:
            print('\n⏳ Waiting 3 seconds...')
            time.sleep(3)

    print('\n' + '='*60)
    print('📊 FINAL RESULTS')
    print('='*60 + '\n')

    success_count = sum(1 for r in results.values() if r['success'])

    for name, result in results.items():
        if result['success']:
            print(f"✅ {name}: {result.get('title', 'N/A')}")
        else:
            print(f"❌ {name}: Failed")

    print(f"\n📈 Success Rate: {success_count}/{len(sites)}\n")

    if success_count == 0:
        print("⚠️  ALL METHODS FAILED")
        print("Possible reasons:")
        print("  1. Sites have strict WAF/bot protection")
        print("  2. Environment IP is blacklisted")
        print("  3. Network-level restrictions")
        print("\n💡 Recommendation: Create generic clinic GA4 guide instead\n")

if __name__ == '__main__':
    main()
