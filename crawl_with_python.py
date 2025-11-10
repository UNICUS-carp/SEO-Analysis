#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import urljoin

sites = [
    {'name': 'mori18', 'url': 'https://mori18.com/'},
    {'name': 'fujii-hone', 'url': 'https://fujii-hone.com/'},
    {'name': 'sakatsume-bsac', 'url': 'https://sakatsume-bsac.com/'}
]

def analyze_site(site_info):
    """Analyze a single clinic website"""
    output_dir = f"./clinic-analysis/{site_info['name']}"

    try:
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        print(f"\n{'='*60}")
        print(f"🏥 Analyzing: {site_info['name']}")
        print(f"🔗 URL: {site_info['url']}")
        print('='*60)

        print('🌐 Fetching with Python requests...')

        # Headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        }

        # Make request
        response = requests.get(
            site_info['url'],
            headers=headers,
            timeout=30,
            verify=False,  # Ignore SSL verification
            allow_redirects=True
        )

        print(f"📊 Status: {response.status_code} {response.reason}")

        if response.status_code != 200:
            raise Exception(f"HTTP {response.status_code}: {response.reason}")

        html = response.text
        print(f"✅ Fetched HTML ({len(html)} bytes)")

        # Save raw HTML
        with open(f"{output_dir}/page-source.html", 'w', encoding='utf-8') as f:
            f.write(html)

        # Parse with BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')

        print('🔍 Parsing HTML with BeautifulSoup...')

        # Analyze the page
        analysis = analyze_with_soup(soup, html, site_info)

        # Save all analysis results
        save_analysis(analysis, output_dir)

        print(f"\n{'='*60}")
        print(f"✅ Analysis Complete: {site_info['name']}")
        print(f"📁 Output: {output_dir}")
        print('='*60 + '\n')

        return analysis['summary']

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return {
            'success': False,
            'site': site_info['name'],
            'url': site_info['url'],
            'error': str(e)
        }

def analyze_with_soup(soup, html, site_info):
    """Extract all relevant information from the page"""

    # Page Info
    page_info = {
        'title': soup.title.string if soup.title else '',
        'url': site_info['url'],
        'description': '',
        'keywords': ''
    }

    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        page_info['description'] = meta_desc.get('content', '')

    meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
    if meta_keywords:
        page_info['keywords'] = meta_keywords.get('content', '')

    print(f"📄 Title: {page_info['title']}")

    # All Links
    links = []
    for a in soup.find_all('a'):
        href = a.get('href')
        text = a.get_text(strip=True)
        if href or text:
            links.append({
                'text': text,
                'href': href,
                'class': ' '.join(a.get('class', [])),
                'id': a.get('id', '')
            })
    print(f"🔗 Found {len(links)} links")

    # Phone Links
    phone_links = []
    for a in soup.find_all('a', href=lambda x: x and x.startswith('tel:')):
        phone_links.append({
            'text': a.get_text(strip=True),
            'number': a.get('href', '').replace('tel:', ''),
            'class': ' '.join(a.get('class', []))
        })
    print(f"📞 Found {len(phone_links)} phone links")

    # LINE Links
    line_links = []
    for a in soup.find_all('a'):
        href = a.get('href', '')
        text = a.get_text(strip=True).lower()
        class_name = ' '.join(a.get('class', [])).lower()

        if 'line.me' in href or 'line://' in href or 'line' in class_name or 'line' in text:
            line_links.append({
                'text': a.get_text(strip=True),
                'href': href,
                'class': ' '.join(a.get('class', []))
            })
    print(f"💚 Found {len(line_links)} LINE links")

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
    print(f"📝 Found {len(forms)} forms")

    # Buttons & CTAs
    buttons = []
    button_selectors = soup.find_all(['button', 'input']) + \
                      soup.find_all('a', class_=lambda x: x and ('btn' in x or 'button' in x or 'cta' in x))

    for btn in button_selectors:
        text = btn.get_text(strip=True) or btn.get('value', '') or btn.get('aria-label', '')
        if text:
            buttons.append({
                'tag': btn.name,
                'text': text,
                'class': ' '.join(btn.get('class', [])),
                'href': btn.get('href', '')
            })
    print(f"🔘 Found {len(buttons)} buttons/CTAs")

    # Navigation
    navigation = []
    nav_links = soup.find_all('nav') + soup.find_all(class_=lambda x: x and 'nav' in x.lower())
    for nav in nav_links:
        for a in nav.find_all('a'):
            text = a.get_text(strip=True)
            if text:
                navigation.append({
                    'text': text,
                    'href': a.get('href', '')
                })

    # Also get header links
    for header in soup.find_all('header'):
        for a in header.find_all('a'):
            text = a.get_text(strip=True)
            if text and text not in [n['text'] for n in navigation]:
                navigation.append({
                    'text': text,
                    'href': a.get('href', '')
                })
    print(f"🧭 Found {len(navigation)} navigation items")

    # Reservation Elements
    reservation_elements = []
    reservation_selectors = soup.find_all(class_=lambda x: x and any(
        keyword in x.lower() for keyword in ['reserv', 'book', 'appoint', '予約']
    ))
    for el in reservation_selectors:
        text = el.get_text(strip=True)
        if text:
            reservation_elements.append({
                'tag': el.name,
                'text': text[:100],
                'class': ' '.join(el.get('class', [])),
                'href': el.get('href', '') if el.name == 'a' else ''
            })
    print(f"📅 Found {len(reservation_elements)} reservation elements")

    # Price/Menu Elements
    price_elements = []
    price_selectors = soup.find_all(class_=lambda x: x and any(
        keyword in x.lower() for keyword in ['price', 'fee', '料金', 'menu', 'メニュー']
    ))
    for el in price_selectors:
        text = el.get_text(strip=True)
        if text:
            price_elements.append({
                'tag': el.name,
                'text': text[:150],
                'class': ' '.join(el.get('class', []))
            })
    print(f"💰 Found {len(price_elements)} price/menu elements")

    # Analytics Detection
    analytics = {
        'hasGA4': 'gtag' in html or 'GA_MEASUREMENT_ID' in html or 'G-' in html,
        'hasGTM': 'GTM-' in html,
        'hasClarity': 'clarity' in html.lower(),
        'hasFacebookPixel': 'fbq' in html
    }
    print(f"📊 Analytics: GTM={analytics['hasGTM']}, GA4={analytics['hasGA4']}")

    summary = {
        'site': site_info['name'],
        'url': site_info['url'],
        'analyzedAt': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'pageInfo': page_info,
        'stats': {
            'htmlSize': len(html),
            'links': len(links),
            'phoneLinks': len(phone_links),
            'lineLinks': len(line_links),
            'buttons': len(buttons),
            'forms': len(forms),
            'navigation': len(navigation),
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
        'navigation': navigation,
        'reservationElements': reservation_elements,
        'priceElements': price_elements
    }

def save_analysis(analysis, output_dir):
    """Save all analysis results to JSON files"""
    with open(f"{output_dir}/all-links.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['links'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/phone-links.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['phoneLinks'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/line-links.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['lineLinks'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/forms.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['forms'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/buttons-ctas.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['buttons'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/navigation.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['navigation'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/reservation-elements.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['reservationElements'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/price-menu-elements.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['priceElements'], f, ensure_ascii=False, indent=2)

    with open(f"{output_dir}/analysis-summary.json", 'w', encoding='utf-8') as f:
        json.dump(analysis['summary'], f, ensure_ascii=False, indent=2)

def main():
    """Main crawling function"""
    print('\n🏥 Clinic Website Crawler - Python requests + BeautifulSoup')
    print('='*60 + '\n')

    # Suppress SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    results = []

    for site in sites:
        result = analyze_site(site)
        results.append(result)

        if site != sites[-1]:
            print('⏳ Waiting 3 seconds...\n')
            time.sleep(3)

    # Save final summary
    os.makedirs('./clinic-analysis', exist_ok=True)
    with open('./clinic-analysis/all-sites-summary.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print('\n' + '='*60)
    print('🎉 CRAWLING COMPLETE')
    print('='*60 + '\n')

    for result in results:
        if result.get('stats'):
            title = result['pageInfo']['title']
            phone = result['stats']['phoneLinks']
            line = result['stats']['lineLinks']
            forms = result['stats']['forms']
            print(f"✅ {result['site']} - {title}")
            print(f"   📞 Phone: {phone} | 💚 LINE: {line} | 📝 Forms: {forms}")
        else:
            print(f"❌ {result['site']}: {result.get('error', 'Unknown error')}")

    print('\n📁 Results: ./clinic-analysis/\n')

if __name__ == '__main__':
    main()
