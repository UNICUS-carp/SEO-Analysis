# 治療院・整骨院向けGA4イベントトラッキング完全ガイド
## Comprehensive GA4 Event Tracking Guide for Clinics & Treatment Facilities

**対象サイト:**
- mori18.com (森18整骨院)
- fujii-hone.com (藤井ほね整骨院)
- sakatsume-bsac.com (さかつめ整骨院)

**作成日**: 2025-11-10

---

## 📋 目次

1. [はじめに](#はじめに)
2. [治療院業界のデジタルマーケティング特性](#治療院業界のデジタルマーケティング特性)
3. [優先度別イベント設定](#優先度別イベント設定)
4. [各イベントの詳細設定](#各イベントの詳細設定)
5. [GTM実装手順](#gtm実装手順)
6. [コンバージョン設定](#コンバージョン設定)
7. [KPI設定と効果測定](#kpi設定と効果測定)
8. [Microsoft Clarity連携](#microsoft-clarity連携)
9. [実装チェックリスト](#実装チェックリスト)

---

## はじめに

### このガイドについて

治療院・整骨院・鍼灸院などの施術業界に特化したGA4イベントトラッキング設定ガイドです。業界特有のユーザー行動パターンと予約・来院につながる重要な接点を計測します。

### 対象読者

- 治療院・整骨院のWeb担当者
- マーケティング担当者
- Webサイト制作・運用を担当する方
- GA4/GTMの基礎知識がある方

### 期待される成果

✅ 電話・LINE・フォームなど全ての予約導線を可視化
✅ どの施術メニューが関心を集めているか把握
✅ 広告費用対効果（ROAS）の正確な測定
✅ サイト改善のための定量的データ取得
✅ 予約率向上のためのボトルネック特定

---

## 治療院業界のデジタルマーケティング特性

### ユーザー行動の特徴

#### 1. マルチデバイス・マルチチャネル
```
検索 → サイト閲覧 → 一旦離脱 → 再検索 → 電話予約
     ↓
   SNS広告 → LINE登録 → トーク予約
```

#### 2. 予約までの主要経路
- **即決型**: サイト訪問 → 電話クリック（5分以内）
- **比較検討型**: 複数サイト閲覧 → 料金・口コミ確認 → 後日予約（1-3日）
- **信頼構築型**: ブログ記事閲覧 → SNSフォロー → 予約（1週間-1ヶ月）

#### 3. 重要な接点（タッチポイント）

| 接点 | 重要度 | 計測必須度 |
|------|--------|-----------|
| 電話番号クリック | ★★★★★ | 必須 |
| Web予約フォーム送信 | ★★★★★ | 必須 |
| LINE友達追加 | ★★★★☆ | 必須 |
| 料金表・施術メニュー閲覧 | ★★★★☆ | 推奨 |
| 初回限定特典の閲覧 | ★★★★☆ | 推奨 |
| アクセス・地図確認 | ★★★☆☆ | 推奨 |
| スタッフ紹介閲覧 | ★★★☆☆ | 推奨 |
| 症例・お客様の声 | ★★★☆☆ | 推奨 |

### コンバージョンファネル

```
【認知】
  ↓ 検索流入・広告流入
【興味】
  ↓ トップページ閲覧
  ↓ 施術メニュー閲覧（75%）
【比較検討】
  ↓ 料金表閲覧（60%）
  ↓ お客様の声閲覧（45%）
  ↓ アクセス確認（50%）
【決定】
  ↓ 電話クリック（15%）or Web予約（8%）or LINE登録（12%）
【コンバージョン】
  ⭐ 予約完了
```

---

## 優先度別イベント設定

### 🔴 Phase 1: 必須イベント（最優先）

直接的に予約・来院につながる重要イベント。まずこれらを実装。

| イベント名 | 計測対象 | ビジネス価値 | 実装難易度 |
|-----------|---------|-------------|-----------|
| `click_phone` | 電話番号クリック | ★★★★★ | 易 |
| `submit_reservation_form` | Web予約フォーム送信 | ★★★★★ | 易 |
| `click_line` | LINE友達追加ボタン | ★★★★★ | 易 |
| `submit_contact_form` | お問い合わせ送信 | ★★★★☆ | 易 |

### 🟡 Phase 2: 推奨イベント（重要）

ユーザーの関心度合いを測定し、コンバージョン最適化に役立つイベント。

| イベント名 | 計測対象 | ビジネス価値 | 実装難易度 |
|-----------|---------|-------------|-----------|
| `view_menu` | 施術メニュー詳細閲覧 | ★★★★☆ | 中 |
| `view_price` | 料金表閲覧 | ★★★★☆ | 中 |
| `view_first_offer` | 初回限定特典閲覧 | ★★★★☆ | 中 |
| `view_testimonial` | お客様の声閲覧 | ★★★☆☆ | 中 |
| `click_map` | アクセス・地図クリック | ★★★☆☆ | 易 |
| `view_staff` | スタッフ紹介閲覧 | ★★★☆☆ | 中 |

### 🟢 Phase 3: 最適化イベント（オプション）

詳細な分析とサイト改善のためのイベント。

| イベント名 | 計測対象 | ビジネス価値 | 実装難易度 |
|-----------|---------|-------------|-----------|
| `click_instagram` | Instagram遷移 | ★★☆☆☆ | 易 |
| `click_facebook` | Facebook遷移 | ★★☆☆☆ | 易 |
| `view_blog` | ブログ記事閲覧 | ★★★☆☆ | 中 |
| `scroll_75` | 75%スクロール | ★★☆☆☆ | 中 |
| `click_hours` | 営業時間確認 | ★★☆☆☆ | 中 |
| `view_symptom_page` | 症状別ページ閲覧 | ★★★☆☆ | 中 |

---

## 各イベントの詳細設定

### 🔴 Phase 1: 必須イベント

---

#### 1. 電話番号クリック: `click_phone`

**ビジネス目的**
電話予約は最も直接的なコンバージョン経路。計測必須。

**計測タイミング**
`tel:` リンクのクリック時

**イベントパラメータ**

```javascript
{
  event: 'click_phone',
  phone_number: '03-1234-5678',      // 電話番号（ハイフンあり）
  click_location: 'header',           // クリック箇所（header/footer/content/floating）
  page_path: '/menu/massage',         // クリックしたページ
  click_text: '今すぐ電話で予約'        // ボタンのテキスト
}
```

**重要な分析軸**
- どのページから電話されることが多いか
- どの位置のボタンが効果的か（ヘッダー vs フローティング）
- デバイス別の電話率（モバイル vs デスクトップ）

**GTM設定概要**
```
トリガー: Click - All Elements
条件: Click URL contains "tel:"
変数取得: Click URL, Click Text, Click Classes
```

---

#### 2. Web予約フォーム送信: `submit_reservation_form`

**ビジネス目的**
Web予約完了を計測。最重要コンバージョン。

**計測タイミング**
予約フォーム送信完了時（サンキューページ表示 or フォーム送信成功）

**イベントパラメータ**

```javascript
{
  event: 'submit_reservation_form',
  form_type: 'reservation',           // フォームタイプ
  form_name: 'Web予約フォーム',        // フォーム名
  reservation_type: 'first_visit',    // 初診 or 再診（可能なら）
  preferred_date: '2025-11-15',       // 希望日（個人情報にならない程度）
  preferred_time: 'morning',          // 希望時間帯（morning/afternoon/evening）
  form_id: 'reservation-form',        // フォームID
  page_path: '/reservation'           // 送信元ページ
}
```

**重要な分析軸**
- 予約完了率（フォーム表示 → 送信完了）
- どのページから予約フォームに到達するか
- 曜日・時間帯別の予約傾向

**GTM設定概要**
```
方法1: サンキューページでPageview時に発火
方法2: フォーム送信成功時のJavaScriptイベントをトリガー
方法3: Form Submission トリガー
```

---

#### 3. LINE友達追加: `click_line`

**ビジネス目的**
LINE公式アカウント経由の予約導線を計測。若年層に重要。

**計測タイミング**
LINE友達追加ボタン・リンクのクリック時

**イベントパラメータ**

```javascript
{
  event: 'click_line',
  line_type: 'add_friend',            // add_friend/chat/call
  link_url: 'https://line.me/R/ti/p/@clinic123',
  click_location: 'header',           // ボタン位置
  click_text: 'LINE予約はこちら',      // ボタンテキスト
  page_path: '/access'                // クリック元ページ
}
```

**重要な分析軸**
- LINE導線の効果測定
- どのページからLINE追加されるか
- 電話・Web予約との比較

**GTM設定概要**
```
トリガー: Click - All Elements
条件: Click URL contains "line.me" OR Click URL contains "line://"
変数取得: Click URL, Click Text, Page Path
```

---

#### 4. お問い合わせフォーム送信: `submit_contact_form`

**ビジネス目的**
施術内容や料金などの質問。潜在顧客との接点。

**計測タイミング**
お問い合わせフォーム送信完了時

**イベントパラメータ**

```javascript
{
  event: 'submit_contact_form',
  form_type: 'contact',
  form_name: 'お問い合わせフォーム',
  inquiry_type: 'general',            // general/price/menu/other
  form_id: 'contact-form',
  page_path: '/contact'
}
```

---

### 🟡 Phase 2: 推奨イベント

---

#### 5. 施術メニュー閲覧: `view_menu`

**ビジネス目的**
どの施術に関心があるか把握。サービス改善・広告最適化に活用。

**計測タイミング**
施術メニュー詳細ページの閲覧時（Pageview + 5秒滞在）

**イベントパラメータ**

```javascript
{
  event: 'view_menu',
  menu_name: '骨盤矯正',              // 施術メニュー名
  menu_category: 'correction',        // カテゴリ（correction/massage/acupuncture/etc）
  menu_id: 'kotsuban',               // メニューID
  page_path: '/menu/kotsuban',
  engagement_time: 15                 // 滞在秒数
}
```

**重要な分析軸**
- 人気メニューの把握
- メニュー閲覧 → 予約の転換率
- 広告効果測定（どのメニューで集客すべきか）

**GTM設定方法**
```
トリガー: Timer（5秒滞在）
条件: Page Path matches /menu/
変数: Data Layer変数でmenu_nameなどを取得
```

---

#### 6. 料金表閲覧: `view_price`

**ビジネス目的**
料金確認は予約直前の重要なステップ。高エンゲージメント指標。

**計測タイミング**
料金表ページ閲覧 or 料金セクションへのスクロール

**イベントパラメータ**

```javascript
{
  event: 'view_price',
  price_type: 'menu_price',           // menu_price/campaign_price/initial_fee
  page_path: '/price',
  view_method: 'scroll',              // page_view/scroll/click
  engagement_time: 20
}
```

**重要な分析軸**
- 料金確認 → 予約の転換率
- 料金ページでの離脱率
- 料金明示が予約に与える影響

---

#### 7. 初回限定特典閲覧: `view_first_offer`

**ビジネス目的**
初回割引・特典は新規顧客獲得の重要施策。効果測定必須。

**計測タイミング**
初回特典セクション表示 or 特典ページ閲覧

**イベントパラメータ**

```javascript
{
  event: 'view_first_offer',
  offer_name: '初回限定50%OFF',
  offer_type: 'discount',             // discount/free_trial/coupon
  offer_value: '50%',                 // 割引率・金額
  page_path: '/campaign/first',
  view_method: 'scroll'               // page_view/scroll/popup
}
```

**重要な分析軸**
- 特典認知 → 予約率
- どの特典が効果的か
- 特典ページのトラフィックソース

---

#### 8. お客様の声閲覧: `view_testimonial`

**ビジネス目的**
口コミ・レビューは信頼構築の重要要素。

**計測タイミング**
お客様の声ページ閲覧 or 個別レビュー表示

**イベントパラメータ**

```javascript
{
  event: 'view_testimonial',
  testimonial_id: 'review_001',
  symptom_category: '腰痛',           // どの症状の口コミか
  page_path: '/voice',
  view_depth: 'multiple'              // single/multiple（複数閲覧）
}
```

---

#### 9. アクセス・地図クリック: `click_map`

**ビジネス目的**
来院意思の高いユーザー。準コンバージョン指標。

**計測タイミング**
Google Map埋め込みクリック or アクセスページ閲覧

**イベントパラメータ**

```javascript
{
  event: 'click_map',
  map_type: 'google_maps',            // google_maps/static_image/link
  click_location: 'access_page',      // アクセスページ or footer
  page_path: '/access'
}
```

---

#### 10. スタッフ紹介閲覧: `view_staff`

**ビジネス目的**
施術者への信頼構築。特に初診患者に重要。

**計測タイミング**
スタッフ紹介ページ閲覧

**イベントパラメータ**

```javascript
{
  event: 'view_staff',
  page_path: '/staff',
  engagement_time: 10
}
```

---

### 🟢 Phase 3: 最適化イベント

---

#### 11. SNS遷移: `click_social`

**イベントパラメータ**

```javascript
{
  event: 'click_social',
  social_platform: 'instagram',       // instagram/facebook/twitter/youtube
  link_url: 'https://instagram.com/clinic',
  click_location: 'footer',
  page_path: '/'
}
```

---

#### 12. ブログ記事閲覧: `view_blog`

**イベントパラメータ**

```javascript
{
  event: 'view_blog',
  blog_title: '肩こり解消法5選',
  blog_category: '肩こり',
  blog_id: 'blog_20251110',
  page_path: '/blog/shoulder-pain',
  engagement_time: 45
}
```

---

#### 13. スクロール深度: `scroll_75`

**イベントパラメータ**

```javascript
{
  event: 'scroll_75',
  scroll_depth: 75,                   // 75%地点
  page_path: '/menu/massage'
}
```

---

## GTM実装手順

### 前提条件

✅ Google Tag Manager (GTM) がサイトに設置済み
✅ GA4プロパティが作成済み
✅ GTMとGA4が連携済み

### 実装の流れ

```
1. GTMにログイン
2. トリガーを作成
3. 変数を作成（必要に応じて）
4. タグを作成
5. プレビューモードでテスト
6. 公開
7. GA4で計測確認
```

---

### 実装例1: 電話クリック (`click_phone`)

#### Step 1: トリガーの作成

1. GTM管理画面 → 「トリガー」→「新規」
2. トリガー名: `電話クリック - tel:リンク`
3. トリガータイプ: **クリック - リンクのみ**
4. トリガー設定:
   ```
   このトリガーの発生場所: 一部のリンククリック

   条件:
   Click URL contains tel:
   ```
5. 保存

#### Step 2: 変数の作成（クリック位置を判定）

1. GTM管理画面 → 「変数」→「ユーザー定義変数」→「新規」
2. 変数名: `クリック位置 - 電話`
3. 変数タイプ: **カスタム JavaScript**
4. JavaScript:

```javascript
function() {
  var element = {{Click Element}};

  // ヘッダー内か判定
  var header = document.querySelector('header');
  if (header && header.contains(element)) {
    return 'header';
  }

  // フッター内か判定
  var footer = document.querySelector('footer');
  if (footer && footer.contains(element)) {
    return 'footer';
  }

  // フローティングボタンか判定（クラス名で判定）
  if (element.classList.contains('floating') ||
      element.classList.contains('fixed-btn') ||
      element.closest('.floating-cta')) {
    return 'floating';
  }

  // それ以外はコンテンツ
  return 'content';
}
```

5. 保存

#### Step 3: 変数の作成（電話番号を抽出）

1. 変数名: `電話番号 - クリーンアップ`
2. 変数タイプ: **カスタム JavaScript**
3. JavaScript:

```javascript
function() {
  var clickUrl = {{Click URL}};
  if (clickUrl && clickUrl.indexOf('tel:') === 0) {
    // tel: を除去して電話番号のみ抽出
    return clickUrl.replace('tel:', '').trim();
  }
  return '';
}
```

4. 保存

#### Step 4: タグの作成

1. GTM管理画面 → 「タグ」→「新規」
2. タグ名: `GA4 - 電話クリック`
3. タグタイプ: **Google アナリティクス: GA4 イベント**
4. 設定タグ: `[既存のGA4設定タグを選択]`
5. イベント名: `click_phone`
6. イベントパラメータ:

| パラメータ名 | 値 |
|------------|-----|
| phone_number | `{{電話番号 - クリーンアップ}}` |
| click_location | `{{クリック位置 - 電話}}` |
| page_path | `{{Page Path}}` |
| click_text | `{{Click Text}}` |

7. トリガー: `電話クリック - tel:リンク`
8. 保存

#### Step 5: プレビュー & テスト

1. GTMで「プレビュー」をクリック
2. サイトのURLを入力して接続
3. サイト上の電話番号リンクをクリック
4. Tag Assistant画面で以下を確認:
   - ✅ タグが発火している
   - ✅ イベント名が `click_phone`
   - ✅ パラメータが正しく取得されている

#### Step 6: 公開

1. GTMで「送信」をクリック
2. バージョン名: `電話クリック計測追加`
3. 説明: `click_phoneイベントを追加`
4. 「公開」をクリック

#### Step 7: GA4で確認

1. GA4管理画面 → レポート → リアルタイム
2. サイトで電話番号をクリック
3. リアルタイムレポートに `click_phone` が表示されることを確認
4. 「イベント名別」でパラメータも確認

---

### 実装例2: Web予約フォーム送信 (`submit_reservation_form`)

#### 方法A: サンキューページで計測（推奨）

**前提**: フォーム送信後に `/reservation/thanks` などの完了ページに遷移する場合

#### Step 1: トリガーの作成

1. トリガー名: `ページビュー - 予約完了`
2. トリガータイプ: **ページビュー - DOM Ready**
3. トリガー設定:
   ```
   このトリガーの発生場所: 一部のページビュー

   条件:
   Page Path contains /reservation/thanks
   または
   Page Path contains /thanks
   または
   Page URL contains reservation_complete=true
   ```

#### Step 2: タグの作成

1. タグ名: `GA4 - 予約フォーム送信`
2. タグタイプ: **Google アナリティクス: GA4 イベント**
3. イベント名: `submit_reservation_form`
4. イベントパラメータ:

| パラメータ名 | 値 |
|------------|-----|
| form_type | `reservation` |
| form_name | `Web予約フォーム` |
| page_path | `{{Page Path}}` |

5. トリガー: `ページビュー - 予約完了`
6. 保存・公開

---

#### 方法B: フォーム送信イベントで計測

**前提**: サンキューページがない場合、またはAjax送信の場合

#### Step 1: トリガーの作成

1. トリガー名: `フォーム送信 - 予約フォーム`
2. トリガータイプ: **フォームの送信**
3. トリガー設定:
   ```
   このトリガーの発生場所: 一部のフォーム

   条件:
   Form ID equals reservation-form
   または
   Form Classes contains reservation-form
   または
   Page Path contains /reservation
   ```
4. **検証を有効化**: ✅ チェック（送信成功時のみ発火）
5. 保存

#### Step 2: タグの作成

1. タグ名: `GA4 - 予約フォーム送信`
2. イベント名: `submit_reservation_form`
3. パラメータ設定（同上）
4. トリガー: `フォーム送信 - 予約フォーム`

---

#### 方法C: dataLayer.push() で計測（最も正確）

**前提**: サイトのJavaScriptを編集できる場合

フォーム送信成功時に以下のコードを追加:

```javascript
// フォーム送信成功時（Ajax完了時など）
dataLayer.push({
  'event': 'reservation_form_submit',
  'form_type': 'reservation',
  'form_name': 'Web予約フォーム',
  'reservation_type': 'first_visit', // 初診・再診（取得可能なら）
  'preferred_date': '2025-11-15',    // 希望日
  'preferred_time': 'morning'        // 希望時間帯
});
```

GTMのトリガー:
- トリガータイプ: **カスタムイベント**
- イベント名: `reservation_form_submit`

---

### 実装例3: LINE友達追加 (`click_line`)

#### Step 1: トリガーの作成

1. トリガー名: `クリック - LINEリンク`
2. トリガータイプ: **クリック - リンクのみ**
3. トリガー設定:
   ```
   このトリガーの発生場所: 一部のリンククリック

   条件（以下のいずれか）:
   Click URL contains line.me
   または
   Click URL contains line://
   ```

#### Step 2: タグの作成

1. タグ名: `GA4 - LINEクリック`
2. イベント名: `click_line`
3. イベントパラメータ:

| パラメータ名 | 値 |
|------------|-----|
| line_type | `add_friend` |
| link_url | `{{Click URL}}` |
| click_location | `{{クリック位置}}` (前述の変数を使用) |
| click_text | `{{Click Text}}` |
| page_path | `{{Page Path}}` |

4. トリガー: `クリック - LINEリンク`

---

### 実装例4: 施術メニュー閲覧 (`view_menu`)

#### Step 1: Data Layer変数の設定

サイトの施術メニューページに以下を追加:

```html
<!-- 施術メニューページ（例: /menu/kotsuban） -->
<script>
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  'menu_name': '骨盤矯正',
  'menu_category': 'correction',
  'menu_id': 'kotsuban'
});
</script>
```

#### Step 2: GTM変数の作成

1. 変数名: `DL - menu_name`
2. 変数タイプ: **データレイヤーの変数**
3. データレイヤーの変数名: `menu_name`

同様に `menu_category`, `menu_id` も作成

#### Step 3: トリガーの作成（5秒滞在）

1. トリガー名: `タイマー - メニューページ5秒`
2. トリガータイプ: **タイマー**
3. イベント名: `gtm.timer`
4. 間隔: `5000` (ミリ秒)
5. 制限: `1` (1回のみ)
6. トリガー設定:
   ```
   このトリガーの発生場所: 一部のタイマーイベント

   条件:
   Page Path matches RegEx ^/menu/
   ```

#### Step 4: タグの作成

1. タグ名: `GA4 - 施術メニュー閲覧`
2. イベント名: `view_menu`
3. イベントパラメータ:

| パラメータ名 | 値 |
|------------|-----|
| menu_name | `{{DL - menu_name}}` |
| menu_category | `{{DL - menu_category}}` |
| menu_id | `{{DL - menu_id}}` |
| page_path | `{{Page Path}}` |

4. トリガー: `タイマー - メニューページ5秒`

---

### 実装例5: 料金表閲覧 (`view_price`)

#### Step 1: トリガーの作成（スクロール50%）

1. トリガー名: `スクロール - 料金ページ50%`
2. トリガータイプ: **スクロール距離**
3. 縦方向スクロール距離:
   - 割合: `50`
4. トリガー設定:
   ```
   このトリガーの発生場所: 一部のページ

   条件:
   Page Path contains /price
   または
   Page Path contains /menu
   ```

#### Step 2: タグの作成

1. タグ名: `GA4 - 料金表閲覧`
2. イベント名: `view_price`
3. イベントパラメータ:

| パラメータ名 | 値 |
|------------|-----|
| price_type | `menu_price` |
| page_path | `{{Page Path}}` |
| view_method | `scroll` |

4. トリガー: `スクロール - 料金ページ50%`

---

## コンバージョン設定

### GA4でのコンバージョン設定手順

#### 1. GA4管理画面にアクセス

1. GA4プロパティ → 「管理」→「イベント」

#### 2. コンバージョンとしてマークするイベント

以下のイベントをコンバージョンに設定:

| イベント名 | コンバージョン価値 | 優先度 |
|-----------|-------------------|--------|
| `submit_reservation_form` | ★★★★★ | 最重要 |
| `click_phone` | ★★★★★ | 最重要 |
| `click_line` | ★★★★☆ | 重要 |
| `submit_contact_form` | ★★★☆☆ | 中 |

#### 3. コンバージョン設定方法

1. 「イベント」画面で該当イベントを見つける
2. 右側の「コンバージョンとしてマーク」をON
3. 保存

---

### マイクロコンバージョン設定

直接予約につながらないが、重要な中間指標:

| イベント名 | 意味 |
|-----------|------|
| `view_price` | 料金確認（予約検討段階） |
| `view_first_offer` | 特典確認（関心度高） |
| `click_map` | アクセス確認（来院意思あり） |
| `view_menu` | 施術内容確認（比較検討中） |

これらは「カスタムイベント」として追跡し、分析に活用。

---

### コンバージョン値の設定（任意）

実際の売上データがある場合、予約1件あたりの平均単価を設定可能。

**例**: 初診平均単価が5,000円の場合

GTMのタグ設定で `value` パラメータを追加:

```javascript
// 予約フォーム送信タグ
{
  event: 'submit_reservation_form',
  value: 5000,     // 平均単価（円）
  currency: 'JPY'
}
```

---

## KPI設定と効果測定

### 治療院サイトの重要KPI

#### 1. コンバージョン率（CVR）

```
CVR = 予約数 / セッション数 × 100
```

**業界平均**: 2-5%
**目標**: 3%以上

#### 2. 予約経路別の転換率

| 経路 | 目標CVR |
|------|---------|
| 電話クリック | 10-15% |
| Web予約 | 5-8% |
| LINE登録 | 8-12% |

#### 3. 流入元別CVR

Google Analytics「集客」→「トラフィック獲得」で分析

```
自然検索（Organic Search）: 3-5%
有料検索（Google広告）: 4-8%
SNS（Social）: 2-4%
直接（Direct）: 5-10%
```

#### 4. ページ別CVR

重要ページのCVR:

```
トップページ → 予約: 3-5%
施術メニュー → 予約: 8-12%
料金表 → 予約: 10-15%
初回特典 → 予約: 12-18%
```

#### 5. マイクロコンバージョン率

```
料金表閲覧率: 40-60%
メニュー閲覧率: 50-70%
アクセス確認率: 30-50%
```

---

### GA4での効果測定方法

#### レポート1: コンバージョン経路分析

**探索レポート** → **経路データ探索**

```
開始点: ランディングページ
  ↓
ステップ1: メニュー閲覧（view_menu）
  ↓
ステップ2: 料金閲覧（view_price）
  ↓
ステップ3: 予約完了（submit_reservation_form / click_phone）
```

**分析ポイント**:
- どのステップで離脱が多いか
- メニュー → 料金 → 予約の遷移率
- 最も効果的な導線はどれか

---

#### レポート2: セグメント比較

**比較セグメント例**:

1. **電話予約ユーザー** vs **Web予約ユーザー**
   - セグメント条件: `click_phone` イベント発生 vs `submit_reservation_form` 発生
   - 分析: 行動の違い、流入元の違い

2. **初回特典閲覧ユーザー** vs **非閲覧ユーザー**
   - セグメント条件: `view_first_offer` イベント発生 vs 非発生
   - 分析: 特典が予約率に与える影響

3. **モバイル** vs **デスクトップ**
   - デバイス別の予約率、行動の違い

---

#### レポート3: 広告効果測定（Google広告連携時）

**前提**: GA4とGoogle広告をリンク済み

**分析内容**:
```
広告 → ランディング → 予約
```

**指標**:
- CPA（予約1件あたりの広告費）
- ROAS（広告費用対効果）
- コンバージョン率

**計算例**:
```
広告費: 50,000円
予約数: 10件
平均単価: 6,000円

CPA = 50,000円 / 10件 = 5,000円/件
ROAS = (10件 × 6,000円) / 50,000円 = 120%
```

---

#### レポート4: イベント発生状況ダッシュボード

**カスタムレポート作成**

ディメンション:
- イベント名
- ページパス
- デバイス
- 流入元

指標:
- イベント数
- ユーザー数
- コンバージョン率

**定期確認事項**:
- [ ] 電話クリック数は適切か
- [ ] Web予約数は目標に達しているか
- [ ] LINE登録数は伸びているか
- [ ] 各イベントが正しく計測されているか

---

## Microsoft Clarity連携

### Clarityとは

Microsoftが提供する無料のヒートマップ・セッション録画ツール。GA4では見えないユーザーの実際の行動を可視化。

### GA4とClarityの使い分け

| 分析内容 | GA4 | Clarity |
|---------|-----|---------|
| 定量分析（数値） | ✅ | - |
| 定性分析（行動） | - | ✅ |
| イベント計測 | ✅ | △ |
| ヒートマップ | - | ✅ |
| セッション録画 | - | ✅ |
| ファネル分析 | ✅ | △ |
| コンバージョン計測 | ✅ | - |

**結論**: **両方使うべき**

---

### Clarityのセットアップ

#### 1. Clarityアカウント作成

1. https://clarity.microsoft.com/ にアクセス
2. Microsoftアカウントでログイン
3. 「新しいプロジェクト」を作成
4. サイトURLを入力

#### 2. GTMでClarityを設置

GTMで設置することで、GA4と一元管理可能。

**Step 1: Clarityタグの追加**

1. GTM → 「タグ」→「新規」
2. タグ名: `Microsoft Clarity`
3. タグタイプ: **カスタムHTML**
4. HTML内容:

```html
<script type="text/javascript">
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "YOUR_PROJECT_ID");
</script>
```

※ `YOUR_PROJECT_ID` はClarityの管理画面で取得

5. トリガー: **All Pages**
6. 保存・公開

---

### ClarityとGA4の連携

#### 1. ClarityでGA4イベントを確認

Clarityは自動的にGA4イベントを認識します。

**確認方法**:
1. Clarity管理画面 → 「Dashboard」
2. 「Clicks」セクションで、GA4で設定したイベントが表示される

#### 2. セッション録画でイベントを確認

**使い方**:
1. Clarity → 「Recordings」
2. フィルター: `電話クリックしたユーザー`のみ表示
3. 録画を再生して、どのような経緯で電話クリックしたか確認

**分析例**:
```
ユーザーAの行動:
トップページ → メニュー閲覧 → 料金確認（3分滞在）→ 電話クリック

発見:
- 料金を何度もスクロールして確認している
- 「初回限定」の文字で一旦止まる
→ 料金が予約の決定要因

改善案:
- 料金表をより見やすく
- 初回特典を強調
```

---

### Clarityの活用例

#### 1. ヒートマップで改善ポイント発見

**クリックマップ**:
- どのボタンが最もクリックされているか
- クリックされていないボタンの改善

**スクロールマップ**:
- どこまでスクロールされているか
- 重要情報が見られていない場合は配置変更

**例**:
```
発見: 電話ボタンは98%がヘッダーをクリック、フッターは2%のみ
改善: フッターの電話ボタンを削除し、フローティングボタンを追加
結果: 電話CVRが12% → 18%に向上
```

---

#### 2. Rage Clicks（連打）の検出

ユーザーがイライラして連打している箇所を自動検出。

**例**:
```
発見: 「Web予約」ボタンで連打が多発
原因調査: リンクが切れていた
改善: リンク修正
結果: 予約フォーム到達率が45% → 78%に改善
```

---

#### 3. Dead Clicks（反応しないクリック）

クリックしても何も起こらない箇所の検出。

**例**:
```
発見: 施術メニューの画像をクリックしているが反応なし
改善: 画像にリンクを追加
結果: メニュー詳細ページのPVが35%増加
```

---

#### 4. GA4 + Clarityの組み合わせ分析

**ワークフロー**:
```
1. GA4で「料金ページの離脱率が高い」ことを発見
   ↓
2. Clarityで料金ページのセッション録画を確認
   ↓
3. 発見: ユーザーが料金表をスクロールして比較するが、
         「予約ボタン」が見つからず離脱
   ↓
4. 改善: 料金表の各メニューに「このメニューを予約」ボタンを追加
   ↓
5. GA4で改善効果を測定
   → 料金ページからの予約率が8% → 14%に改善
```

---

## 実装チェックリスト

### Phase 1: 必須イベント（1週目）

#### 電話クリック (`click_phone`)

- [ ] GTMトリガー作成完了
- [ ] 変数（電話番号・クリック位置）作成完了
- [ ] GA4タグ設定完了
- [ ] プレビューでテスト完了
- [ ] 本番環境で動作確認
- [ ] GA4リアルタイムレポートで計測確認
- [ ] コンバージョンとしてマーク

#### Web予約フォーム送信 (`submit_reservation_form`)

- [ ] サンキューページのURLを確認
- [ ] GTMトリガー作成完了
- [ ] GA4タグ設定完了
- [ ] テスト予約で動作確認
- [ ] GA4で計測確認
- [ ] コンバージョンとしてマーク

#### LINE友達追加 (`click_line`)

- [ ] LINEリンクのURL形式を確認（line.me / line://）
- [ ] GTMトリガー作成完了
- [ ] GA4タグ設定完了
- [ ] プレビューでテスト
- [ ] GA4で計測確認
- [ ] コンバージョンとしてマーク

#### お問い合わせ送信 (`submit_contact_form`)

- [ ] フォーム送信完了の判定方法を確認
- [ ] GTMトリガー作成完了
- [ ] GA4タグ設定完了
- [ ] テスト送信で動作確認
- [ ] GA4で計測確認

---

### Phase 2: 推奨イベント（2-3週目）

#### 施術メニュー閲覧 (`view_menu`)

- [ ] メニューページのURL構造を確認
- [ ] Data Layer変数の実装（可能なら）
- [ ] GTMタイマートリガー作成
- [ ] GTM変数作成
- [ ] GA4タグ設定
- [ ] 各メニューページでテスト
- [ ] GA4で計測確認

#### 料金表閲覧 (`view_price`)

- [ ] 料金ページのURLを確認
- [ ] スクロールトリガー作成（50%）
- [ ] GA4タグ設定
- [ ] テスト確認
- [ ] GA4で計測確認

#### 初回限定特典閲覧 (`view_first_offer`)

- [ ] 特典ページ/セクションの確認
- [ ] トリガー作成（ページビュー or スクロール）
- [ ] GA4タグ設定
- [ ] テスト確認

#### お客様の声閲覧 (`view_testimonial`)

- [ ] 口コミページの確認
- [ ] トリガー作成
- [ ] GA4タグ設定
- [ ] テスト確認

#### アクセス・地図クリック (`click_map`)

- [ ] Google Map埋め込みの確認
- [ ] クリックトリガー作成
- [ ] GA4タグ設定
- [ ] テスト確認

#### スタッフ紹介閲覧 (`view_staff`)

- [ ] スタッフページの確認
- [ ] トリガー作成
- [ ] GA4タグ設定

---

### Phase 3: 最適化イベント（4週目以降）

#### SNS遷移 (`click_social`)

- [ ] SNSリンクの確認（Instagram/Facebook等）
- [ ] トリガー作成
- [ ] GA4タグ設定

#### ブログ記事閲覧 (`view_blog`)

- [ ] ブログURLパターンの確認
- [ ] トリガー作成
- [ ] GA4タグ設定

#### スクロール深度 (`scroll_75`)

- [ ] スクロールトリガー作成（75%）
- [ ] GA4タグ設定

---

### GA4設定

- [ ] GA4プロパティ作成済み
- [ ] GTMとGA4の連携完了
- [ ] コンバージョンイベント設定完了:
  - [ ] `submit_reservation_form`
  - [ ] `click_phone`
  - [ ] `click_line`
  - [ ] `submit_contact_form`
- [ ] カスタムディメンション設定（必要に応じて）
- [ ] カスタムレポート作成

---

### Microsoft Clarity

- [ ] Clarityアカウント作成
- [ ] Clarityタグ設置（GTM経由）
- [ ] ヒートマップ動作確認
- [ ] セッション録画動作確認
- [ ] GA4との連携確認

---

### 継続的な確認事項

#### 毎週の確認

- [ ] GA4でイベントが正常に計測されているか確認
- [ ] 異常値がないかチェック（急激な増減）
- [ ] コンバージョン数の確認

#### 毎月の分析

- [ ] 月次レポート作成
  - [ ] 予約数（経路別）
  - [ ] CVR推移
  - [ ] 流入元別の効果
- [ ] Clarityでユーザー行動の確認
- [ ] 改善ポイントの抽出

#### 四半期ごとの見直し

- [ ] KPI目標の達成状況確認
- [ ] イベント設定の見直し
- [ ] 新規イベント追加の検討
- [ ] A/Bテストの実施検討

---

## まとめ

### 実装の優先順位

```
【Week 1】Phase 1: 必須イベント
  ↓ CVR = 2-3%
【Week 2-3】Phase 2: 推奨イベント
  ↓ CVR = 3-4%
【Week 4+】Phase 3: 最適化イベント
  ↓ CVR = 4-5%+
【継続】データ分析と改善
```

---

### 期待される成果

実装完了後、以下が可視化されます:

✅ **予約経路の把握**
- 電話 vs Web予約 vs LINE の比率
- 最も効果的な予約導線の特定

✅ **ユーザー行動の理解**
- どのページが予約につながるか
- 離脱ポイントの特定

✅ **広告効果の測定**
- Google広告のROAS
- どの広告が予約につながるか

✅ **サイト改善の方向性**
- データに基づいた改善施策
- A/Bテストの実施

---

### サポートとリソース

**Google Tag Managerヘルプ**
https://support.google.com/tagmanager

**GA4ヘルプセンター**
https://support.google.com/analytics

**Microsoft Clarityドキュメント**
https://docs.microsoft.com/en-us/clarity/

---

## 付録: トラブルシューティング

### イベントが計測されない

#### 確認1: GTMのプレビューモードで確認
```
GTM → プレビュー → サイトに接続
→ 該当イベントを発火
→ Tag Assistantで確認
```

**チェックポイント**:
- [ ] トリガーが発火しているか
- [ ] タグが発火しているか
- [ ] パラメータが取得できているか

#### 確認2: GA4リアルタイムレポート
```
GA4 → レポート → リアルタイム
→ イベント名で確認
```

**チェックポイント**:
- [ ] イベントがリアルタイムに表示されるか
- [ ] パラメータが正しく送信されているか

#### 確認3: ブラウザの開発者ツール
```
Chrome → F12 → Network タブ
→ "collect" で絞り込み
→ GA4へのリクエストを確認
```

**チェックポイント**:
- [ ] `en=イベント名` が含まれているか
- [ ] パラメータが正しく送信されているか

---

### よくある問題と解決方法

#### 問題1: 電話クリックが2回計測される

**原因**: トリガーが重複している

**解決**:
- GTMで類似トリガーがないか確認
- 「All Clicks」と「tel:リンク」が重複していないか

#### 問題2: フォーム送信が計測されない

**原因**: フォーム送信後にページ遷移が早すぎる

**解決方法A**: サンキューページで計測に変更
**解決方法B**: GTMの「待機時間」を設定
```
タグの詳細設定 → 「タグの実行順序」
→ 他のタグより前に実行
```

#### 問題3: Clarityのヒートマップが表示されない

**原因**: セッション数が不足

**解決**: 100セッション以上のデータが必要。数日待つ。

---

**以上、治療院向けGA4イベントトラッキング完全ガイドでした。**

**作成者**: Claude (Anthropic)
**作成日**: 2025-11-10
**バージョン**: 1.0

ご不明点があれば、各セクションを参照するか、GA4/GTMの公式ドキュメントをご確認ください。
