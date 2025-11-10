#!/usr/bin/env python3
"""
Advanced web crawler using cloudscraper to bypass Cloudflare and other protections
"""
import cloudscraper
from bs4 import BeautifulSoup
import json
import os
import time

sites = [
    {'name': 'mori18', 'url': 'https://mori18.com/'},
    {'name': 'fujii-hone', 'url': 'https://fujii-hone.com/'},
    {'name': 'sakatsume-bsac', 'url': 'https://sakatsume-bsac.com/'}
]

def analyze_site_with_cloudscraper(site_info):
    """Analyze a clinic website using cloudscraper"""
    output_dir = f"./clinic-analysis/{site_info['name']}"

    try:
        os.makedirs(output_dir, exist_ok=True)

        print(f"\n{'='*60}")
        print(f"🏥 Analyzing: {site_info['name']}")
        print(f"🔗 URL: {site_info['url']}")
        print('='*60)

        print('🌐 Fetching with cloudscraper (bypassing protections)...')

        # Create scraper instance
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'darwin',
                'desktop': True
            }
        )

        # Make request
        response = scraper.get(site_info['url'], timeout=30)

        print(f"📊 Status: {response.status_code} {response.reason}")

        if response.status_code != 200:
            raise Exception(f"HTTP {response.status_code}")

        html = response.text
        print(f"✅ Fetched HTML ({len(html)} bytes)")

        # Save HTML
        with open(f"{output_dir}/page-source.html", 'w', encoding='utf-8') as f:
            f.write(html)

        # Parse with BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')
        print('🔍 Parsing with BeautifulSoup...')

        # Extract data
        analysis = extract_data(soup, html, site_info)
        save_json_files(analysis, output_dir)

        print(f"\n{'='*60}")
        print(f"✅ Complete: {site_info['name']}")
        print(f"📁 {output_dir}")
        print('='*60 + '\n')

        return analysis['summary']

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'site': site_info['name'],
            'url': site_info['url'],
            'error': str(e)
        }

def extract_data(soup, html, site_info):
    """Extract all relevant data from the page"""

    # Basic page info
    title = soup.title.string if soup.title else ''
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    description = meta_desc.get('content', '') if meta_desc else ''

    print(f"📄 Title: {title}")

    # Links
    links = []
    for a in soup.find_all('a'):
        href = a.get('href', '')
        text = a.get_text(strip=True)
        if href or text:
            links.append({
                'text': text,
                'href': href,
                'class': ' '.join(a.get('class', [])),
                'id': a.get('id', '')
            })

    # Phone links
    phone_links = []
    for a in soup.find_all('a', href=lambda x: x and x.startswith('tel:')):
        phone_links.append({
            'text': a.get_text(strip=True),
            'number': a['href'].replace('tel:', ''),
            'class': ' '.join(a.get('class', []))
        })

    # LINE links
    line_links = []
    for a in soup.find_all('a'):
        href = a.get('href', '')
        if 'line.me' in href or 'line://' in href:
            line_links.append({
                'text': a.get_text(strip=True),
                'href': href,
                'class': ' '.join(a.get('class', []))
            })

    # Forms
    forms = []
    for form in soup.find_all('form'):
        fields = []
        for field in form.find_all(['input', 'select', 'textarea']):
            fields.append({
                'name': field.get('name', ''),
                'type': field.get('type', ''),
                'placeholder': field.get('placeholder', ''),
                'required': field.has_attr('required')
            })
        forms.append({
            'action': form.get('action', ''),
            'method': form.get('method', ''),
            'id': form.get('id', ''),
            'fields': fields
        })

    # Buttons & CTAs
    buttons = []
    for btn in soup.find_all(['button', 'input']):
        if btn.name == 'input' and btn.get('type') not in ['submit', 'button']:
            continue
        text = btn.get_text(strip=True) or btn.get('value', '')
        if text:
            buttons.append({
                'tag': btn.name,
                'text': text,
                'class': ' '.join(btn.get('class', []))
            })

    # CTA links
    for a in soup.find_all('a'):
        classes = ' '.join(a.get('class', [])).lower()
        if any(x in classes for x in ['btn', 'button', 'cta']):
            text = a.get_text(strip=True)
            if text and text not in [b['text'] for b in buttons]:
                buttons.append({
                    'tag': 'a',
                    'text': text,
                    'class': ' '.join(a.get('class', [])),
                    'href': a.get('href', '')
                })

    # Reservation elements
    reservation_elements = []
    for el in soup.find_all(class_=lambda x: x and any(
        kw in x.lower() for kw in ['reserv', 'book', 'appoint', '予約']
    )):
        text = el.get_text(strip=True)[:100]
        if text:
            reservation_elements.append({
                'tag': el.name,
                'text': text,
                'class': ' '.join(el.get('class', []))
            })

    # Price elements
    price_elements = []
    for el in soup.find_all(class_=lambda x: x and any(
        kw in x.lower() for kw in ['price', 'fee', '料金', 'menu', 'メニュー']
    )):
        text = el.get_text(strip=True)[:150]
        if text:
            price_elements.append({
                'tag': el.name,
                'text': text,
                'class': ' '.join(el.get('class', []))
            })

    # Analytics
    analytics = {
        'hasGA4': 'gtag' in html or 'G-' in html,
        'hasGTM': 'GTM-' in html,
        'hasClarity': 'clarity' in html.lower(),
        'hasFacebookPixel': 'fbq' in html
    }

    print(f"🔗 Links: {len(links)}")
    print(f"📞 Phone: {len(phone_links)}")
    print(f"💚 LINE: {len(line_links)}")
    print(f"📝 Forms: {len(forms)}")
    print(f"🔘 Buttons: {len(buttons)}")
    print(f"📅 Reservation: {len(reservation_elements)}")
    print(f"💰 Price: {len(price_elements)}")
    print(f"📊 Analytics: GTM={analytics['hasGTM']}, GA4={analytics['hasGA4']}")

    summary = {
        'site': site_info['name'],
        'url': site_info['url'],
        'analyzedAt': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'pageInfo': {
            'title': title,
            'description': description,
            'url': site_info['url']
        },
        'stats': {
            'htmlSize': len(html),
            'links': len(links),
            'phoneLinks': len(phone_links),
            'lineLinks': len(line_links),
            'buttons': len(buttons),
            'forms': len(forms),
            'reservationElements': len(reservation_elements),
            'priceElements': len(price_elements)
        },
        'analytics': analytics,
        'keyFindings': {
            'hasPhoneNumber': len(phone_links) > 0,
            'hasReservationSystem': len(reservation_elements) > 0 or len(forms) > 0,
            'hasLineIntegration': len(line_links) > 0,
            'hasPricing': len(price_elements) > 0
        }
    }

    return {
        'summary': summary,
        'links': links,
        'phoneLinks': phone_links,
        'lineLinks': line_links,
        'forms': forms,
        'buttons': buttons,
        'reservationElements': reservation_elements,
        'priceElements': price_elements
    }

def save_json_files(analysis, output_dir):
    """Save all analysis data to JSON files"""
    files = {
        'all-links.json': analysis['links'],
        'phone-links.json': analysis['phoneLinks'],
        'line-links.json': analysis['lineLinks'],
        'forms.json': analysis['forms'],
        'buttons-ctas.json': analysis['buttons'],
        'reservation-elements.json': analysis['reservationElements'],
        'price-menu-elements.json': analysis['priceElements'],
        'analysis-summary.json': analysis['summary']
    }

    for filename, data in files.items():
        with open(f"{output_dir}/{filename}", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    print('\n🏥 Clinic Crawler - cloudscraper (Protection Bypass)')
    print('='*60 + '\n')

    results = []

    for site in sites:
        result = analyze_site_with_cloudscraper(site)
        results.append(result)

        if site != sites[-1]:
            print('⏳ Waiting 3 seconds...\n')
            time.sleep(3)

    # Save summary
    os.makedirs('./clinic-analysis', exist_ok=True)
    with open('./clinic-analysis/all-sites-summary.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print('\n' + '='*60)
    print('🎉 CRAWLING COMPLETE')
    print('='*60 + '\n')

    for result in results:
        if result.get('stats'):
            print(f"✅ {result['site']} - {result['pageInfo']['title']}")
            print(f"   📞 {result['stats']['phoneLinks']} | 💚 {result['stats']['lineLinks']} | 📝 {result['stats']['forms']}")
        else:
            print(f"❌ {result['site']}: {result.get('error')}")

    print('\n📁 ./clinic-analysis/\n')

if __name__ == '__main__':
    main()
