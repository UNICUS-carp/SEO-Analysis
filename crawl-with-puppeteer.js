/**
 * Puppeteer を使用した治療院サイトクローリングスクリプト
 *
 * 目的:
 * - 3つの治療院サイトをクローリング
 * - GA4イベント設定に必要な情報を抽出
 * - 予約導線、メニュー構造、コンテンツを分析
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// 対象サイト
const CLINIC_SITES = [
  {
    name: 'mori18',
    url: 'https://mori18.com/',
    label: '森18整骨院'
  },
  {
    name: 'fujii-hone',
    url: 'https://fujii-hone.com/',
    label: '藤井ほね整骨院'
  },
  {
    name: 'sakatsume-bsac',
    url: 'https://sakatsume-bsac.com/',
    label: 'さかつめ整骨院'
  }
];

/**
 * ページ情報を抽出
 */
async function extractPageInfo(page) {
  return await page.evaluate(() => {
    const results = {
      // 基本情報
      title: document.title,
      url: window.location.href,

      // 電話番号リンク
      phoneLinks: [],

      // LINEリンク
      lineLinks: [],

      // 予約・お問い合わせフォーム
      forms: [],

      // ナビゲーション
      navigation: [],

      // 施術メニュー
      menuLinks: [],

      // 料金情報
      priceInfo: [],

      // スタッフ情報
      staffInfo: [],

      // ブログ・お知らせ
      blogLinks: [],

      // お客様の声・口コミ
      testimonials: [],

      // SNSリンク
      socialLinks: [],

      // アクセス・地図
      mapInfo: [],

      // 見出し構造
      headings: {
        h1: [],
        h2: [],
        h3: []
      },

      // CTA（行動喚起）ボタン
      ctaButtons: []
    };

    // 電話番号リンク
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      results.phoneLinks.push({
        phone: link.href.replace('tel:', ''),
        text: link.textContent.trim(),
        location: getElementLocation(link)
      });
    });

    // LINEリンク
    document.querySelectorAll('a[href*="line.me"], a[href^="line://"]').forEach(link => {
      results.lineLinks.push({
        url: link.href,
        text: link.textContent.trim(),
        location: getElementLocation(link)
      });
    });

    // フォーム
    document.querySelectorAll('form').forEach(form => {
      results.forms.push({
        action: form.action || 'javascript:void(0)',
        method: form.method || 'GET',
        id: form.id || '',
        class: form.className || '',
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).length
      });
    });

    // ナビゲーション（メニュー）
    document.querySelectorAll('nav a, .menu a, .navigation a, header a').forEach(link => {
      const text = link.textContent.trim();
      if (text && !results.navigation.find(n => n.text === text)) {
        results.navigation.push({
          text: text,
          href: link.href
        });
      }
    });

    // 施術メニューの可能性があるリンク
    document.querySelectorAll('a').forEach(link => {
      const text = link.textContent.trim().toLowerCase();
      const href = link.href.toLowerCase();

      const menuKeywords = [
        'メニュー', 'menu', '施術', '治療', 'コース', 'course',
        '整体', '骨盤', '矯正', 'マッサージ', '鍼灸', 'massage',
        '料金', 'price', '費用'
      ];

      if (menuKeywords.some(kw => text.includes(kw) || href.includes(kw))) {
        results.menuLinks.push({
          text: link.textContent.trim(),
          href: link.href
        });
      }
    });

    // 料金情報
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent;
      if (text.match(/[¥￥]\s*[\d,]+|[\d,]+\s*円/) && el.children.length === 0) {
        const price = el.textContent.trim();
        if (price.length < 100 && !results.priceInfo.includes(price)) {
          results.priceInfo.push(price);
        }
      }
    });

    // お客様の声・口コミセクション
    const testimonialKeywords = ['お客様の声', '口コミ', 'voice', 'testimonial', 'review', '感想'];
    document.querySelectorAll('a, section, div').forEach(el => {
      const text = el.textContent.trim();
      const className = el.className || '';
      const id = el.id || '';

      testimonialKeywords.forEach(kw => {
        if (text.toLowerCase().includes(kw) ||
            className.toLowerCase().includes(kw) ||
            id.toLowerCase().includes(kw)) {
          if (el.tagName === 'A') {
            results.testimonials.push({
              type: 'link',
              text: text,
              href: el.href
            });
          }
        }
      });
    });

    // SNSリンク
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'youtube', 'line'];
    document.querySelectorAll('a').forEach(link => {
      const href = link.href.toLowerCase();
      socialPlatforms.forEach(platform => {
        if (href.includes(platform + '.com') || href.includes(platform + '.me')) {
          results.socialLinks.push({
            platform: platform,
            url: link.href,
            text: link.textContent.trim()
          });
        }
      });
    });

    // 地図・アクセス情報
    document.querySelectorAll('iframe[src*="maps.google"], iframe[src*="google.com/maps"]').forEach(iframe => {
      results.mapInfo.push({
        type: 'google_maps_embed',
        src: iframe.src
      });
    });

    document.querySelectorAll('a[href*="maps.google"], a[href*="google.com/maps"]').forEach(link => {
      results.mapInfo.push({
        type: 'google_maps_link',
        href: link.href,
        text: link.textContent.trim()
      });
    });

    // 見出し構造
    document.querySelectorAll('h1').forEach(h => {
      results.headings.h1.push(h.textContent.trim());
    });
    document.querySelectorAll('h2').forEach(h => {
      results.headings.h2.push(h.textContent.trim());
    });
    document.querySelectorAll('h3').forEach(h => {
      results.headings.h3.push(h.textContent.trim());
    });

    // CTAボタン
    document.querySelectorAll('button, .btn, .button, a.cta, input[type="submit"]').forEach(btn => {
      const text = btn.textContent || btn.value || '';
      if (text.trim()) {
        results.ctaButtons.push({
          text: text.trim(),
          type: btn.tagName.toLowerCase(),
          class: btn.className || ''
        });
      }
    });

    // 要素の位置を判定するヘルパー関数
    function getElementLocation(element) {
      let parent = element.parentElement;
      let depth = 0;

      while (parent && depth < 10) {
        const tag = parent.tagName.toLowerCase();
        const id = parent.id;
        const className = parent.className;

        if (tag === 'header' || id === 'header' || className.includes('header')) {
          return 'header';
        }
        if (tag === 'footer' || id === 'footer' || className.includes('footer')) {
          return 'footer';
        }
        if (tag === 'nav' || className.includes('nav')) {
          return 'navigation';
        }
        if (className.includes('fixed') || className.includes('floating')) {
          return 'floating';
        }

        parent = parent.parentElement;
        depth++;
      }

      return 'content';
    }

    return results;
  });
}

/**
 * GA4イベント設定提案を生成
 */
function generateGA4Recommendations(siteData) {
  const recommendations = {
    site: siteData.name,
    url: siteData.url,
    label: siteData.label,
    summary: {},
    events: []
  };

  const data = siteData.data;

  // サマリー
  recommendations.summary = {
    title: data.title,
    phoneLinksCount: data.phoneLinks.length,
    lineLinksCount: data.lineLinks.length,
    formsCount: data.forms.length,
    menuLinksCount: data.menuLinks.length,
    socialLinksCount: data.socialLinks.length,
    hasGoogleMaps: data.mapInfo.length > 0,
    ctaButtonsCount: data.ctaButtons.length
  };

  // イベント推奨

  // 1. 電話クリック（最重要）
  if (data.phoneLinks.length > 0) {
    recommendations.events.push({
      priority: 1,
      eventName: 'click_phone',
      businessValue: '★★★★★',
      description: '電話クリック計測',
      trigger: 'Click - tel: links',
      parameters: {
        phone_number: 'extracted from tel: link',
        click_location: 'header/footer/content/floating',
        page_path: 'Page Path variable',
        click_text: 'Click Text variable'
      },
      implementationNotes: `電話番号: ${data.phoneLinks.map(p => p.phone).join(', ')}`,
      locations: data.phoneLinks.map(p => p.location).filter((v, i, a) => a.indexOf(v) === i)
    });
  }

  // 2. Web予約フォーム送信
  if (data.forms.length > 0) {
    recommendations.events.push({
      priority: 1,
      eventName: 'submit_reservation_form',
      businessValue: '★★★★★',
      description: 'Web予約フォーム送信計測',
      trigger: 'Form Submission or Thank You Page',
      parameters: {
        form_type: 'reservation',
        form_name: 'Web予約フォーム',
        page_path: 'Page Path'
      },
      implementationNotes: `フォーム数: ${data.forms.length}`,
      forms: data.forms
    });
  }

  // 3. LINE友達追加
  if (data.lineLinks.length > 0) {
    recommendations.events.push({
      priority: 1,
      eventName: 'click_line',
      businessValue: '★★★★★',
      description: 'LINE友達追加ボタンクリック',
      trigger: 'Click - line.me or line:// links',
      parameters: {
        line_type: 'add_friend',
        link_url: 'Click URL',
        click_location: 'Click location',
        page_path: 'Page Path'
      },
      implementationNotes: `LINEリンク数: ${data.lineLinks.length}`,
      lineUrls: data.lineLinks.map(l => l.url)
    });
  }

  // 4. 施術メニュー閲覧
  if (data.menuLinks.length > 0) {
    recommendations.events.push({
      priority: 2,
      eventName: 'view_menu',
      businessValue: '★★★★☆',
      description: '施術メニュー詳細閲覧',
      trigger: 'Pageview + Timer (5 seconds) on menu pages',
      parameters: {
        menu_name: 'from Data Layer or Page Title',
        menu_category: 'category classification',
        page_path: 'Page Path'
      },
      implementationNotes: `メニューリンク: ${data.menuLinks.slice(0, 5).map(m => m.text).join(', ')}`,
      menuLinks: data.menuLinks
    });
  }

  // 5. 料金表閲覧
  if (data.priceInfo.length > 0) {
    recommendations.events.push({
      priority: 2,
      eventName: 'view_price',
      businessValue: '★★★★☆',
      description: '料金表閲覧',
      trigger: 'Scroll 50% on price pages',
      parameters: {
        price_type: 'menu_price',
        page_path: 'Page Path',
        view_method: 'scroll'
      },
      implementationNotes: `料金情報検出: ${data.priceInfo.length}件`
    });
  }

  // 6. アクセス・地図確認
  if (data.mapInfo.length > 0) {
    recommendations.events.push({
      priority: 2,
      eventName: 'click_map',
      businessValue: '★★★☆☆',
      description: 'Google Map クリック',
      trigger: 'Click on Google Maps embed or link',
      parameters: {
        map_type: 'google_maps',
        click_location: 'access_page or footer',
        page_path: 'Page Path'
      },
      implementationNotes: `地図要素: ${data.mapInfo.length}件`
    });
  }

  // 7. お客様の声閲覧
  if (data.testimonials.length > 0) {
    recommendations.events.push({
      priority: 2,
      eventName: 'view_testimonial',
      businessValue: '★★★☆☆',
      description: 'お客様の声閲覧',
      trigger: 'Pageview on testimonial pages',
      parameters: {
        page_path: 'Page Path',
        engagement_time: 'Engagement time'
      },
      implementationNotes: `口コミセクション検出: ${data.testimonials.length}件`
    });
  }

  // 8. SNSクリック
  if (data.socialLinks.length > 0) {
    recommendations.events.push({
      priority: 3,
      eventName: 'click_social',
      businessValue: '★★☆☆☆',
      description: 'SNSリンククリック',
      trigger: 'Click on social media links',
      parameters: {
        social_platform: 'instagram/facebook/twitter/etc',
        link_url: 'Click URL',
        page_path: 'Page Path'
      },
      implementationNotes: `SNSリンク: ${data.socialLinks.map(s => s.platform).join(', ')}`,
      socialLinks: data.socialLinks
    });
  }

  return recommendations;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Puppeteer 治療院サイトクローリング開始\n');

  let browser;

  try {
    // Puppeteer起動
    console.log('📦 Puppeteerブラウザを起動中...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    console.log('✅ ブラウザ起動成功\n');

    const allResults = [];

    // 各サイトをクローリング
    for (const site of CLINIC_SITES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏥 ${site.label} (${site.name})`);
      console.log(`📍 URL: ${site.url}`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        const page = await browser.newPage();

        // User-Agent設定
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ビューポート設定
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('⏳ ページを読み込み中...');

        // ページアクセス
        await page.goto(site.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        console.log('✅ ページ読み込み完了');

        // 少し待機（JavaScriptレンダリング完了を待つ）
        await page.waitForTimeout(3000);

        console.log('🔍 ページ情報を抽出中...');

        // 情報抽出
        const pageData = await extractPageInfo(page);

        console.log('✅ 情報抽出完了\n');

        // 結果サマリー表示
        console.log('📊 検出結果サマリー:');
        console.log(`  - タイトル: ${pageData.title}`);
        console.log(`  - 電話リンク: ${pageData.phoneLinks.length}件`);
        console.log(`  - LINEリンク: ${pageData.lineLinks.length}件`);
        console.log(`  - フォーム: ${pageData.forms.length}件`);
        console.log(`  - ナビゲーション: ${pageData.navigation.length}件`);
        console.log(`  - 施術メニュー: ${pageData.menuLinks.length}件`);
        console.log(`  - 料金情報: ${pageData.priceInfo.length}件`);
        console.log(`  - 地図情報: ${pageData.mapInfo.length}件`);
        console.log(`  - SNSリンク: ${pageData.socialLinks.length}件`);
        console.log(`  - CTAボタン: ${pageData.ctaButtons.length}件`);

        // GA4推奨イベント生成
        const recommendations = generateGA4Recommendations({
          name: site.name,
          url: site.url,
          label: site.label,
          data: pageData
        });

        allResults.push({
          site: site,
          pageData: pageData,
          recommendations: recommendations
        });

        await page.close();

        console.log(`\n✅ ${site.label} の分析完了`);

      } catch (error) {
        console.error(`\n❌ ${site.label} のクローリングに失敗:`);
        console.error(`   エラー: ${error.message}`);

        allResults.push({
          site: site,
          error: error.message,
          pageData: null,
          recommendations: null
        });
      }
    }

    // 結果をファイルに保存
    const outputDir = path.join(__dirname, 'clinic-analysis');
    await fs.mkdir(outputDir, { recursive: true });

    // 詳細データ保存
    for (const result of allResults) {
      if (result.pageData) {
        const filename = `${result.site.name}-analysis.json`;
        await fs.writeFile(
          path.join(outputDir, filename),
          JSON.stringify(result, null, 2),
          'utf-8'
        );
        console.log(`\n💾 ${filename} に保存しました`);
      }
    }

    // GA4推奨レポート生成
    console.log('\n\n' + '='.repeat(70));
    console.log('📋 GA4イベント設定推奨レポート');
    console.log('='.repeat(70) + '\n');

    let reportMarkdown = '# 治療院サイト GA4イベント設定推奨レポート\n\n';
    reportMarkdown += `**生成日時**: ${new Date().toLocaleString('ja-JP')}\n\n`;
    reportMarkdown += '---\n\n';

    for (const result of allResults) {
      if (result.recommendations) {
        const rec = result.recommendations;

        reportMarkdown += `## ${rec.label}\n\n`;
        reportMarkdown += `**URL**: ${rec.url}\n\n`;

        reportMarkdown += '### サイト概要\n\n';
        reportMarkdown += `- **ページタイトル**: ${rec.summary.title}\n`;
        reportMarkdown += `- **電話リンク**: ${rec.summary.phoneLinksCount}件\n`;
        reportMarkdown += `- **LINEリンク**: ${rec.summary.lineLinksCount}件\n`;
        reportMarkdown += `- **予約フォーム**: ${rec.summary.formsCount}件\n`;
        reportMarkdown += `- **施術メニュー**: ${rec.summary.menuLinksCount}件\n`;
        reportMarkdown += `- **Google Maps**: ${rec.summary.hasGoogleMaps ? 'あり' : 'なし'}\n`;
        reportMarkdown += `- **SNSリンク**: ${rec.summary.socialLinksCount}件\n\n`;

        reportMarkdown += '### 推奨GA4イベント\n\n';

        // Priority 1
        const p1Events = rec.events.filter(e => e.priority === 1);
        if (p1Events.length > 0) {
          reportMarkdown += '#### 🔴 Priority 1: 必須イベント（最優先実装）\n\n';
          p1Events.forEach((event, idx) => {
            reportMarkdown += `##### ${idx + 1}. \`${event.eventName}\` ${event.businessValue}\n\n`;
            reportMarkdown += `**説明**: ${event.description}\n\n`;
            reportMarkdown += `**実装メモ**: ${event.implementationNotes}\n\n`;
          });
        }

        // Priority 2
        const p2Events = rec.events.filter(e => e.priority === 2);
        if (p2Events.length > 0) {
          reportMarkdown += '#### 🟡 Priority 2: 推奨イベント（重要）\n\n';
          p2Events.forEach((event, idx) => {
            reportMarkdown += `##### ${idx + 1}. \`${event.eventName}\` ${event.businessValue}\n\n`;
            reportMarkdown += `**説明**: ${event.description}\n\n`;
            reportMarkdown += `**実装メモ**: ${event.implementationNotes}\n\n`;
          });
        }

        // Priority 3
        const p3Events = rec.events.filter(e => e.priority === 3);
        if (p3Events.length > 0) {
          reportMarkdown += '#### 🟢 Priority 3: オプションイベント\n\n';
          p3Events.forEach((event, idx) => {
            reportMarkdown += `##### ${idx + 1}. \`${event.eventName}\` ${event.businessValue}\n\n`;
            reportMarkdown += `**説明**: ${event.description}\n\n`;
            reportMarkdown += `**実装メモ**: ${event.implementationNotes}\n\n`;
          });
        }

        reportMarkdown += '\n---\n\n';
      }
    }

    reportMarkdown += '## 次のステップ\n\n';
    reportMarkdown += '1. `CLINIC-SITES-QUICK-START.md` を参照して実装を開始\n';
    reportMarkdown += '2. Priority 1の必須イベントから実装\n';
    reportMarkdown += '3. GTMでテスト・公開\n';
    reportMarkdown += '4. GA4で計測確認\n';

    // レポート保存
    await fs.writeFile(
      path.join(outputDir, 'GA4-RECOMMENDATIONS-REPORT.md'),
      reportMarkdown,
      'utf-8'
    );

    console.log('\n✅ レポート生成完了');
    console.log(`📄 clinic-analysis/GA4-RECOMMENDATIONS-REPORT.md`);

    // サマリー表示
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 クローリング完了サマリー');
    console.log('='.repeat(70) + '\n');

    allResults.forEach(result => {
      if (result.recommendations) {
        console.log(`✅ ${result.recommendations.label}`);
        console.log(`   推奨イベント数: ${result.recommendations.events.length}件`);
      } else if (result.error) {
        console.log(`❌ ${result.site.label}: ${result.error}`);
      }
    });

    console.log('\n🎉 全ての処理が完了しました！\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔚 ブラウザを終了しました');
    }
  }
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { extractPageInfo, generateGA4Recommendations };
