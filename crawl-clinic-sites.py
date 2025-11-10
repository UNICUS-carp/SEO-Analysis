#!/usr/bin/env python3
"""
治療院サイトクローリングスクリプト (requests + BeautifulSoup)

目的:
- 3つの治療院サイトから予約導線情報を抽出
- GA4イベント設定に必要な情報を分析
- 各サイト専用のGA4推奨イベントを生成
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import os

# 対象サイト
CLINIC_SITES = [
    {
        'name': 'mori18',
        'url': 'https://mori18.com/',
        'label': '森18整骨院'
    },
    {
        'name': 'fujii-hone',
        'url': 'https://fujii-hone.com/',
        'label': '藤井ほね整骨院'
    },
    {
        'name': 'sakatsume-bsac',
        'url': 'https://sakatsume-bsac.com/',
        'label': 'さかつめ整骨院'
    }
]

# リクエストヘッダー
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
}


def extract_page_info(html, base_url):
    """HTMLからGA4設定に必要な情報を抽出"""
    soup = BeautifulSoup(html, 'html.parser')

    results = {
        'title': '',
        'phone_links': [],
        'line_links': [],
        'forms': [],
        'navigation': [],
        'menu_links': [],
        'price_info': [],
        'testimonials': [],
        'social_links': [],
        'map_info': [],
        'headings': {
            'h1': [],
            'h2': [],
            'h3': []
        },
        'cta_buttons': []
    }

    # タイトル
    title_tag = soup.find('title')
    results['title'] = title_tag.get_text(strip=True) if title_tag else ''

    # 電話番号リンク
    for link in soup.find_all('a', href=re.compile(r'^tel:')):
        phone = link.get('href', '').replace('tel:', '')
        text = link.get_text(strip=True)
        location = get_element_location(link)

        results['phone_links'].append({
            'phone': phone,
            'text': text,
            'location': location
        })

    # LINEリンク
    for link in soup.find_all('a', href=re.compile(r'line\.me|line://')):
        results['line_links'].append({
            'url': link.get('href', ''),
            'text': link.get_text(strip=True)
        })

    # フォーム
    for form in soup.find_all('form'):
        results['forms'].append({
            'action': form.get('action', ''),
            'method': form.get('method', 'GET'),
            'id': form.get('id', ''),
            'class': ' '.join(form.get('class', [])),
            'inputs': len(form.find_all(['input', 'textarea', 'select']))
        })

    # ナビゲーション
    nav_selectors = ['nav a', '.menu a', '.navigation a', 'header a', '.header a']
    seen_nav = set()

    for selector in nav_selectors:
        for link in soup.select(selector):
            text = link.get_text(strip=True)
            href = link.get('href', '')

            if text and text not in seen_nav and len(text) < 50:
                seen_nav.add(text)
                results['navigation'].append({
                    'text': text,
                    'href': urljoin(base_url, href)
                })

    # 施術メニュー関連リンク
    menu_keywords = [
        'メニュー', 'menu', '施術', '治療', 'コース', 'course',
        '整体', '骨盤', '矯正', 'マッサージ', '鍼灸', 'massage',
        '料金', 'price', '費用'
    ]

    for link in soup.find_all('a', href=True):
        text = link.get_text(strip=True).lower()
        href = link.get('href', '').lower()

        if any(kw in text or kw in href for kw in menu_keywords):
            results['menu_links'].append({
                'text': link.get_text(strip=True),
                'href': urljoin(base_url, link.get('href', ''))
            })

    # 料金情報
    price_pattern = re.compile(r'[¥￥]\s*[\d,]+|[\d,]+\s*円')
    for element in soup.find_all(string=price_pattern):
        if element.parent.name not in ['script', 'style']:
            price_text = element.strip()
            if len(price_text) < 100:
                results['price_info'].append(price_text)

    # お客様の声・口コミ
    testimonial_keywords = ['お客様の声', '口コミ', 'voice', 'testimonial', 'review', '感想', 'レビュー']

    for link in soup.find_all('a', href=True):
        text = link.get_text(strip=True).lower()
        href = link.get('href', '').lower()

        if any(kw in text or kw in href for kw in testimonial_keywords):
            results['testimonials'].append({
                'type': 'link',
                'text': link.get_text(strip=True),
                'href': urljoin(base_url, link.get('href', ''))
            })

    # SNSリンク
    social_platforms = {
        'facebook': ['facebook.com'],
        'twitter': ['twitter.com', 'x.com'],
        'instagram': ['instagram.com'],
        'youtube': ['youtube.com', 'youtu.be'],
        'line': ['line.me']
    }

    for link in soup.find_all('a', href=True):
        href = link.get('href', '').lower()

        for platform, domains in social_platforms.items():
            if any(domain in href for domain in domains):
                results['social_links'].append({
                    'platform': platform,
                    'url': link.get('href', ''),
                    'text': link.get_text(strip=True)
                })
                break

    # Google Maps
    for iframe in soup.find_all('iframe', src=re.compile(r'maps\.google|google\.com/maps')):
        results['map_info'].append({
            'type': 'google_maps_embed',
            'src': iframe.get('src', '')
        })

    for link in soup.find_all('a', href=re.compile(r'maps\.google|google\.com/maps')):
        results['map_info'].append({
            'type': 'google_maps_link',
            'href': link.get('href', ''),
            'text': link.get_text(strip=True)
        })

    # 見出し
    for h1 in soup.find_all('h1'):
        text = h1.get_text(strip=True)
        if text:
            results['headings']['h1'].append(text)

    for h2 in soup.find_all('h2'):
        text = h2.get_text(strip=True)
        if text:
            results['headings']['h2'].append(text)

    for h3 in soup.find_all('h3'):
        text = h3.get_text(strip=True)
        if text:
            results['headings']['h3'].append(text)

    # CTAボタン
    button_selectors = ['button', '.btn', '.button', 'input[type="submit"]', '.cta']

    for selector in button_selectors:
        for btn in soup.select(selector):
            text = btn.get_text(strip=True) or btn.get('value', '')
            if text:
                results['cta_buttons'].append({
                    'text': text,
                    'type': btn.name,
                    'class': ' '.join(btn.get('class', []))
                })

    return results


def get_element_location(element):
    """要素の位置を判定（header/footer/content/floating）"""
    parent = element.parent
    depth = 0

    while parent and depth < 10:
        tag = parent.name
        element_id = parent.get('id', '').lower()
        element_class = ' '.join(parent.get('class', [])).lower()

        if tag == 'header' or 'header' in element_id or 'header' in element_class:
            return 'header'
        if tag == 'footer' or 'footer' in element_id or 'footer' in element_class:
            return 'footer'
        if tag == 'nav' or 'nav' in element_class:
            return 'navigation'
        if 'fixed' in element_class or 'floating' in element_class:
            return 'floating'

        parent = parent.parent
        depth += 1

    return 'content'


def generate_ga4_recommendations(site_data):
    """GA4イベント設定の推奨を生成"""
    data = site_data['data']

    recommendations = {
        'site': site_data['name'],
        'url': site_data['url'],
        'label': site_data['label'],
        'summary': {
            'title': data['title'],
            'phone_links_count': len(data['phone_links']),
            'line_links_count': len(data['line_links']),
            'forms_count': len(data['forms']),
            'menu_links_count': len(data['menu_links']),
            'social_links_count': len(data['social_links']),
            'has_google_maps': len(data['map_info']) > 0,
            'cta_buttons_count': len(data['cta_buttons'])
        },
        'events': []
    }

    # Priority 1: 必須イベント

    # 1. 電話クリック
    if data['phone_links']:
        recommendations['events'].append({
            'priority': 1,
            'event_name': 'click_phone',
            'business_value': '★★★★★',
            'description': '電話クリック計測（最重要コンバージョン）',
            'trigger': 'Click - Links with href^="tel:"',
            'parameters': {
                'phone_number': 'extracted from tel: link',
                'click_location': 'header/footer/content/floating',
                'page_path': 'Page Path',
                'click_text': 'Click Text'
            },
            'implementation_notes': f"電話番号: {', '.join([p['phone'] for p in data['phone_links'][:3]])}",
            'detected_count': len(data['phone_links']),
            'locations': list(set([p['location'] for p in data['phone_links']]))
        })

    # 2. Web予約フォーム
    if data['forms']:
        recommendations['events'].append({
            'priority': 1,
            'event_name': 'submit_reservation_form',
            'business_value': '★★★★★',
            'description': 'Web予約フォーム送信',
            'trigger': 'Form Submission or Thank You Page',
            'parameters': {
                'form_type': 'reservation',
                'form_name': 'Web予約フォーム',
                'page_path': 'Page Path'
            },
            'implementation_notes': f"検出フォーム数: {len(data['forms'])}件",
            'detected_count': len(data['forms'])
        })

    # 3. LINE友達追加
    if data['line_links']:
        recommendations['events'].append({
            'priority': 1,
            'event_name': 'click_line',
            'business_value': '★★★★★',
            'description': 'LINE友達追加ボタンクリック',
            'trigger': 'Click - Links containing "line.me" or "line://"',
            'parameters': {
                'line_type': 'add_friend',
                'link_url': 'Click URL',
                'click_location': 'location',
                'page_path': 'Page Path'
            },
            'implementation_notes': f"LINEリンク数: {len(data['line_links'])}件",
            'detected_count': len(data['line_links'])
        })

    # Priority 2: 推奨イベント

    # 4. 施術メニュー閲覧
    if data['menu_links']:
        recommendations['events'].append({
            'priority': 2,
            'event_name': 'view_menu',
            'business_value': '★★★★☆',
            'description': '施術メニュー詳細閲覧',
            'trigger': 'Pageview + Timer (5 seconds) on menu pages',
            'parameters': {
                'menu_name': 'from Data Layer or Page Title',
                'menu_category': 'category',
                'page_path': 'Page Path'
            },
            'implementation_notes': f"メニュー関連リンク: {len(data['menu_links'])}件",
            'detected_count': len(data['menu_links']),
            'sample_menus': [m['text'] for m in data['menu_links'][:5]]
        })

    # 5. 料金表閲覧
    if data['price_info']:
        recommendations['events'].append({
            'priority': 2,
            'event_name': 'view_price',
            'business_value': '★★★★☆',
            'description': '料金表閲覧',
            'trigger': 'Scroll 50% on price pages',
            'parameters': {
                'price_type': 'menu_price',
                'page_path': 'Page Path',
                'view_method': 'scroll'
            },
            'implementation_notes': f"料金情報検出: {len(data['price_info'])}件",
            'detected_count': len(data['price_info'])
        })

    # 6. アクセス・地図確認
    if data['map_info']:
        recommendations['events'].append({
            'priority': 2,
            'event_name': 'click_map',
            'business_value': '★★★☆☆',
            'description': 'Google Map クリック',
            'trigger': 'Click on Google Maps elements',
            'parameters': {
                'map_type': 'google_maps',
                'click_location': 'access_page',
                'page_path': 'Page Path'
            },
            'implementation_notes': f"地図要素: {len(data['map_info'])}件",
            'detected_count': len(data['map_info'])
        })

    # 7. お客様の声閲覧
    if data['testimonials']:
        recommendations['events'].append({
            'priority': 2,
            'event_name': 'view_testimonial',
            'business_value': '★★★☆☆',
            'description': 'お客様の声・口コミ閲覧',
            'trigger': 'Pageview on testimonial pages',
            'parameters': {
                'page_path': 'Page Path',
                'engagement_time': 'engagement time'
            },
            'implementation_notes': f"口コミセクション: {len(data['testimonials'])}件",
            'detected_count': len(data['testimonials'])
        })

    # Priority 3: オプション

    # 8. SNSクリック
    if data['social_links']:
        platforms = list(set([s['platform'] for s in data['social_links']]))
        recommendations['events'].append({
            'priority': 3,
            'event_name': 'click_social',
            'business_value': '★★☆☆☆',
            'description': 'SNSリンククリック',
            'trigger': 'Click on social media links',
            'parameters': {
                'social_platform': 'instagram/facebook/twitter/etc',
                'link_url': 'Click URL',
                'page_path': 'Page Path'
            },
            'implementation_notes': f"SNS: {', '.join(platforms)}",
            'detected_count': len(data['social_links']),
            'platforms': platforms
        })

    return recommendations


def crawl_site(site_info):
    """サイトをクローリング"""
    print(f"\n{'=' * 70}")
    print(f"🏥 {site_info['label']} ({site_info['name']})")
    print(f"📍 URL: {site_info['url']}")
    print(f"{'=' * 70}\n")

    try:
        print("⏳ ページを取得中...")

        # HTTPリクエスト
        response = requests.get(
            site_info['url'],
            headers=HEADERS,
            timeout=30,
            verify=False,
            allow_redirects=True
        )

        print(f"✅ HTTPステータス: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ エラー: HTTPステータス {response.status_code}")
            return None

        print("🔍 HTMLを解析中...")

        # 情報抽出
        page_data = extract_page_info(response.text, site_info['url'])

        print("✅ 情報抽出完了\n")

        # サマリー表示
        print("📊 検出結果サマリー:")
        print(f"  - タイトル: {page_data['title']}")
        print(f"  - 電話リンク: {len(page_data['phone_links'])}件")
        print(f"  - LINEリンク: {len(page_data['line_links'])}件")
        print(f"  - フォーム: {len(page_data['forms'])}件")
        print(f"  - ナビゲーション: {len(page_data['navigation'])}件")
        print(f"  - 施術メニュー: {len(page_data['menu_links'])}件")
        print(f"  - 料金情報: {len(page_data['price_info'])}件")
        print(f"  - 地図情報: {len(page_data['map_info'])}件")
        print(f"  - SNSリンク: {len(page_data['social_links'])}件")
        print(f"  - CTAボタン: {len(page_data['cta_buttons'])}件")

        # GA4推奨イベント生成
        print("\n📋 GA4推奨イベントを生成中...")
        recommendations = generate_ga4_recommendations({
            'name': site_info['name'],
            'url': site_info['url'],
            'label': site_info['label'],
            'data': page_data
        })

        print(f"✅ 推奨イベント: {len(recommendations['events'])}件")

        return {
            'site': site_info,
            'page_data': page_data,
            'recommendations': recommendations,
            'status': 'success'
        }

    except requests.exceptions.RequestException as e:
        print(f"❌ リクエストエラー: {str(e)}")
        return {
            'site': site_info,
            'error': str(e),
            'status': 'failed'
        }
    except Exception as e:
        print(f"❌ 予期しないエラー: {str(e)}")
        return {
            'site': site_info,
            'error': str(e),
            'status': 'failed'
        }


def generate_markdown_report(results):
    """Markdownレポートを生成"""
    report = "# 治療院サイト GA4イベント設定推奨レポート\n\n"
    report += f"**生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report += "---\n\n"

    for result in results:
        if result['status'] == 'success':
            rec = result['recommendations']

            report += f"## {rec['label']}\n\n"
            report += f"**URL**: {rec['url']}\n\n"

            report += "### サイト概要\n\n"
            summary = rec['summary']
            report += f"- **ページタイトル**: {summary['title']}\n"
            report += f"- **電話リンク**: {summary['phone_links_count']}件\n"
            report += f"- **LINEリンク**: {summary['line_links_count']}件\n"
            report += f"- **予約フォーム**: {summary['forms_count']}件\n"
            report += f"- **施術メニュー**: {summary['menu_links_count']}件\n"
            report += f"- **Google Maps**: {'あり' if summary['has_google_maps'] else 'なし'}\n"
            report += f"- **SNSリンク**: {summary['social_links_count']}件\n\n"

            report += "### 推奨GA4イベント\n\n"

            # Priority別に分類
            p1_events = [e for e in rec['events'] if e['priority'] == 1]
            p2_events = [e for e in rec['events'] if e['priority'] == 2]
            p3_events = [e for e in rec['events'] if e['priority'] == 3]

            if p1_events:
                report += "#### 🔴 Priority 1: 必須イベント（最優先実装）\n\n"
                for idx, event in enumerate(p1_events, 1):
                    report += f"##### {idx}. `{event['event_name']}` {event['business_value']}\n\n"
                    report += f"**説明**: {event['description']}\n\n"
                    report += f"**実装メモ**: {event['implementation_notes']}\n\n"
                    report += f"**検出数**: {event.get('detected_count', 'N/A')}件\n\n"

            if p2_events:
                report += "#### 🟡 Priority 2: 推奨イベント（重要）\n\n"
                for idx, event in enumerate(p2_events, 1):
                    report += f"##### {idx}. `{event['event_name']}` {event['business_value']}\n\n"
                    report += f"**説明**: {event['description']}\n\n"
                    report += f"**実装メモ**: {event['implementation_notes']}\n\n"
                    report += f"**検出数**: {event.get('detected_count', 'N/A')}件\n\n"

            if p3_events:
                report += "#### 🟢 Priority 3: オプションイベント\n\n"
                for idx, event in enumerate(p3_events, 1):
                    report += f"##### {idx}. `{event['event_name']}` {event['business_value']}\n\n"
                    report += f"**説明**: {event['description']}\n\n"
                    report += f"**実装メモ**: {event['implementation_notes']}\n\n"

            report += "\n---\n\n"

        elif result['status'] == 'failed':
            report += f"## {result['site']['label']}\n\n"
            report += f"**URL**: {result['site']['url']}\n\n"
            report += f"❌ **エラー**: {result['error']}\n\n"
            report += "---\n\n"

    report += "## 次のステップ\n\n"
    report += "1. `CLINIC-SITES-QUICK-START.md` を参照して実装開始\n"
    report += "2. Priority 1の必須イベントから実装\n"
    report += "3. GTMでテスト・公開\n"
    report += "4. GA4で計測確認\n"

    return report


def main():
    """メイン処理"""
    print("🚀 治療院サイトクローリング開始\n")
    print("=" * 70)
    print("対象サイト:")
    for site in CLINIC_SITES:
        print(f"  - {site['label']} ({site['url']})")
    print("=" * 70)

    # SSL警告を抑制
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    results = []

    # 各サイトをクローリング
    for site in CLINIC_SITES:
        result = crawl_site(site)
        if result:
            results.append(result)

    # 結果を保存
    output_dir = 'clinic-analysis'
    os.makedirs(output_dir, exist_ok=True)

    # JSON保存
    for result in results:
        if result['status'] == 'success':
            filename = f"{result['site']['name']}-analysis.json"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            print(f"\n💾 {filename} に保存しました")

    # Markdownレポート生成
    print("\n\n" + "=" * 70)
    print("📋 GA4推奨レポートを生成中...")
    print("=" * 70)

    report_md = generate_markdown_report(results)
    report_path = os.path.join(output_dir, 'GA4-RECOMMENDATIONS-REPORT.md')

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_md)

    print(f"\n✅ レポート生成完了: {report_path}")

    # サマリー
    print("\n\n" + "=" * 70)
    print("📊 クローリング完了サマリー")
    print("=" * 70 + "\n")

    success_count = sum(1 for r in results if r['status'] == 'success')
    failed_count = sum(1 for r in results if r['status'] == 'failed')

    print(f"✅ 成功: {success_count}件")
    print(f"❌ 失敗: {failed_count}件\n")

    for result in results:
        if result['status'] == 'success':
            print(f"✅ {result['recommendations']['label']}")
            print(f"   推奨イベント: {len(result['recommendations']['events'])}件")
        else:
            print(f"❌ {result['site']['label']}: {result['error']}")

    print("\n🎉 全ての処理が完了しました！\n")


if __name__ == '__main__':
    main()
