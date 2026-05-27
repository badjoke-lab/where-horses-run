# Where Horses Run / 競馬どこ？ v0 仕様書 改定版

作成日：2026-05-27  
改定日：2026-05-27  
位置づけ：開発着手前の正式仕様書 / PR-002 相当  
想定リポジトリ：`badjoke-lab/where-horses-run`  
想定公開名：Where Horses Run / 競馬どこ？  
主な改定：自動更新を GitHub Actions 中心に変更 / レース日時・タイムゾーン方針を追加

---

## 1. 目的

**Where Horses Run** は、世界中の競馬開催日・レース時刻表・公式詳細リンクを探すためのサイトである。  
日本語版では **競馬どこ？** として展開する。

このサイトは、JRA、netkeiba、Racing Post、Equibase、Racing.com などの既存大手競馬ポータルの代替ではない。  
出走表、オッズ、結果、払戻、予想、馬柱、個別馬・個別騎手データで勝負しない。

代わりに、以下を主価値にする。

```text
世界中の競馬開催を探す
各競馬場の当日レース時刻表を見る
公式詳細ページへ最短で移動する
国・競馬場・レース種別・用語を辞典的に理解する
```

最終的な方向性は以下。

```text
Where Horses Run
= 世界競馬カレンダー
+ 世界レース時刻表
+ 公式詳細リンク集
+ 世界競馬場インデックス
+ 世界競馬辞典
```

---

## 2. 名義・リポジトリ方針

### 2.1 開発・公開名義

```text
owner / publisher: badjoke-lab
```

### 2.2 サイト名

英語：

```text
Where Horses Run
Global Horse Racing Calendar & Timetable
```

日本語：

```text
競馬どこ？
世界の競馬開催カレンダー・レース時刻表
```

英語名と日本語名は完全一致させない。  
ただし、日本語版には小さく以下を表示し、英語ブランドとの接続を保つ。

```text
Where Horses Run 日本語版
```

### 2.3 リポジトリ

推奨：

```text
badjoke-lab/where-horses-run
```

このサイトは、国別データ、自動更新、辞典、画像アセット、多言語構造を持つため、既存ツール配下ではなく単独リポジトリで開発する。

---

## 3. 技術構成

初期構成は以下を推奨する。

```text
Astro
TypeScript
静的JSON / TS data
GitHub Actions cron
静的ホスティング
```

### 3.1 Astroを採用する理由

- 国別ページに向く
- 競馬場ページに向く
- 辞典ページに向く
- 静的生成に向く
- SEOに向く
- 無料運用しやすい
- 後から自動更新データをJSONで追加しやすい
- Next.jsより初期運用が軽い

### 3.2 自動更新ランタイム

v0では、データ取得・生成・検証・commitを **GitHub Actions** で行う。

```text
GitHub Actions
  ↓
各公式ソースを低頻度取得
  ↓
data/generated/*.json を生成
  ↓
差分がある場合のみ自動commit
  ↓
Astroが静的ビルド
  ↓
静的ホスティングで配信
```

### 3.3 Cloudflareの扱い

Cloudflareを使う場合でも、v0では **静的配信専用** とする。

```text
Cloudflare Pages: 静的配信のみなら利用可
Cloudflare Workers: v0では使わない
Cloudflare Pages Functions: v0では使わない
Cloudflare D1: v0では使わない
Cloudflare KV: v0では使わない
Cloudflare R2: v0では使わない
```

理由：

- このサイトは静的中心
- 更新頻度は高くない
- 1日1〜2回更新で十分
- Cloudflare無料プランのWorkers枠を他プロジェクト用に温存する
- 動的APIやDB検索はv0では不要

### 3.4 初期運用方針

初期は完全自動更新を前提にしない。  
まずは静的MVPを作り、その後に一部国だけ自動更新を追加する。

```text
Phase 0: 静的インデックス
Phase 1: v0 Alpha 10国
Phase 2: v0 Public 20〜27国
Phase 3: v0.1国追加
Phase 4: 辞典強化
Phase 5: ロングテール・Under review整理
```

---

## 4. 対象ユーザー

### 4.1 主対象

- 世界中の競馬開催を横断して見たい人
- 海外競馬に興味がある日本人
- 日本語で世界競馬の入口が欲しい人
- マイナー国・地域競馬・アラブ競馬・トロットに興味がある人
- 各国の公式競馬サイトへ最短で移動したい人
- 競馬場・競馬種別・用語を調べたい人

### 4.2 主対象ではないユーザー

- 日本の馬券予想だけを見たい人
- 出馬表・オッズ・結果・払戻を自サイト内で完結して見たい人
- 個別馬の成績DBを探している人
- AI予想や指数を求める人
- 直前オッズやライブ結果を求める人

---

## 5. 対象に含める競馬

「競馬 / horse racing」はサラブレッド平地に限定しない。

対象に含める。

- サラブレッド平地競走
- 障害競走
- ハードル
- スティープルチェイス
- ハーネス racing
- トロット / 繋駕速歩
- ペーシング
- アラブ競馬
- Purebred Arabian racing
- クォーターホース競馬
- ばんえい競馬
- 地方競馬
- 地域競馬
- 一部のイベント競馬
- 伝統競馬 / エンデュランス系

通常の競馬カレンダーと性質が違うものは、特殊枠として扱う。

例：

```text
Mongolia: Traditional / Endurance
Costa Rica: Horse riding / local event only, no confirmed racing calendar
```

---

## 6. 表示データ方針

### 6.1 自サイトで表示する主な情報

初期で表示する中心情報。

- 国
- 競馬場
- 開催日
- 開催有無
- レース番号
- 発走時刻 / post time
- 公式詳細リンク
- 公式カレンダーリンク
- ソース名
- 最終確認時刻
- Coverage Level
- Auto Level
- データ鮮度
- 取得失敗時のfallback

国・ソースによって安全に取れる場合のみ、以下も表示候補にする。

- レース名
- 距離
- 芝 / ダート / 障害 / トロット等の種別
- 開催名
- 競馬場の簡単な概要

### 6.2 原則として自サイトに表示しない情報

許可・契約なしでは以下を自サイト表示しない。

- 出走馬一覧
- 騎手一覧
- 調教師一覧
- 枠順
- 馬番
- オッズ
- 結果
- 払戻
- 過去成績
- 馬柱
- 予想印
- 詳細なレーティング
- 民間競馬サイト由来の詳細情報
- 公式プログラムやPDFの丸ごと再構成
- 個別馬DB
- 個別騎手DB
- 個別調教師DB

### 6.3 基本姿勢

```text
詳細データは抱えない。
公式詳細へ送る。
カバー深度を明示する。
取得できないことを隠さない。
```

---

## 7. Coverage Level

国・競馬場・ソースごとに、表示可能な深度を明示する。

| Level | 内容 | 初期での扱い |
|---|---|---|
| Level 1 | 国・競馬場・公式リンクのみ | 全対象国で使用 |
| Level 2 | 開催日カレンダー | 多くの国で使用 |
| Level 3 | 当日の全レース時刻表 | v0主力 |
| Level 4 | レース名・距離など最小詳細 | 取れる国だけ |
| Level 5 | 出走表・結果・オッズ等 | 許可なしでは原則やらない |

v0の主力は **Level 3**。

例：

```text
Urawa - 2026-05-26

1R 12:20 Official detail
2R 12:50 Official detail
3R 13:20 Official detail
...
12R 18:20 Official detail
```

Level 4は取れる国だけ。

```text
1R 12:20 Race Name / 1200m / Dirt / Official detail
```

---

## 8. Auto Level

「データが見える」ことと「自動更新できる」ことは別に扱う。

| Auto | 内容 |
|---|---|
| A | 公式URLが安定しており、自動更新しやすい |
| B | 自動更新可能だが、個別パーサーとfallbackが必要 |
| C | 半自動・手動補助・リンク集向き |
| D | 自動更新不可または保留 |
| X | 停止・アーカイブ |

### 8.1 自動更新判定で見る項目

- 公式ソースがあるか
- 当日レース一覧があるか
- レース詳細への直接リンクがあるか
- URLが安定しているか
- 日付指定URLがあるか
- JS依存が強いか
- ログインが必要か
- PDF / Excel / SNS / 画像中心か
- 利用規約上、自動取得リスクが高いか
- 低頻度更新で運用できるか

---

## 9. 対象国・地域分類

### 9.1 v0候補

自動更新または半自動更新で、当日レース時刻表まで狙える国・地域。

```text
日本
香港
UAE
ニュージーランド
カタール
トルコ
韓国
南アフリカ
チリ
ペルー
ウルグアイ
スウェーデン
デンマーク
チェコ
ハンガリー
マルタ
オーストリア
メキシコ
プエルトリコ
ジャマイカ
トリニダード・トバゴ
バルバドス
マルティニーク
バーレーン
オマーン
モロッコ
ジンバブエ
```

合計：27国・地域。

### 9.2 v0 Alpha 10国

最初の自動更新・時刻表対応の対象候補。

```text
日本
香港
UAE
韓国
トルコ
モロッコ
チリ
ペルー
メキシコ
バーレーン
```

選定理由。

- 公式情報が比較的まとまっている
- 当日レース時刻表を狙える
- 地域バランスがよい
- 日本語ユーザーにとっても価値が出る
- サラブレッド以外、アラブ競馬、南米、アジア、中東を含められる

### 9.3 v0.1候補

開催日・公式リンクは狙えるが、当日時刻表は追加検証が必要な国・地域。

```text
イギリス
アメリカ
オーストラリア
アイルランド
フランス
カナダ
サウジアラビア
インド
マレーシア
タイ
フィリピン
モーリシャス
アルゼンチン
ブラジル
ドイツ
イタリア
スペイン
ノルウェー
フィンランド
オランダ
スイス
ポーランド
ルーマニア
セルビア
スロバキア
キプロス
パナマ
クウェート
ケニア
```

### 9.4 v0.2候補

ロングテールとして価値はあるが、まずリンク集・開催日中心にする国・地域。

```text
パキスタン
エクアドル
ベネズエラ
ベルギー
スロベニア
クロアチア
ドミニカ共和国
チュニジア
レバノン
リビア
中国本土
インドネシア
ロシア
ナミビア
ナイジェリア
Belize
```

### 9.5 リンク集〜保留

```text
コロンビア
リトアニア
エストニア
ガイアナ
カザフスタン
エジプト
アルジェリア
イラン
ベトナム
ボリビア
グアテマラ
ホンジュラス
ガーナ
```

### 9.6 Under review / 特殊枠

```text
セントクリストファー・ネイビス
ヨルダン
イラク
アゼルバイジャン
モンゴル
ボツワナ
```

モンゴルは通常競馬ではなく **Traditional / Endurance** 枠にする。

### 9.7 原則除外寄り

```text
コスタリカ
ニカラグア
エルサルバドル
タンザニア
```

### 9.8 アーカイブ対象

現役カレンダーには出さない。  
世界競馬インデックスとしてアーカイブページに残す。

```text
シンガポール
マカオ
ギリシャ
```

---

## 10. ページ構成

### 10.1 初期MVPページ

```text
/
 /ja/
 /calendar/
 /ja/calendar/
 /countries/
 /ja/countries/
 /countries/[country]/
 /ja/countries/[country]/
 /tracks/
 /ja/tracks/
 /tracks/[track]/
 /ja/tracks/[track]/
 /glossary/
 /ja/glossary/
 /glossary/[term]/
 /ja/glossary/[term]/
 /archive/
 /sources/
 /about/
 /disclaimer/
```

### 10.2 主要ページの役割

#### トップページ

- 今日の世界競馬
- 主要開催国
- 競馬場ごとのレース数
- 公式リンク
- データ鮮度
- Coverage / Auto 表示

#### カレンダーページ

- 今日
- 明日
- 今週
- 次の7日
- 地域別
- 国別
- 競馬種別別
- 公式リンク

#### 国一覧

- region filter
- racing type filter
- coverage filter
- auto filter
- status filter
- 検索

#### 国詳細

- 国別競馬プロフィール
- 主な競馬場
- 今日の開催
- 公式ソース
- Coverage / Auto
- 注意書き

#### 競馬場一覧

- 国別
- racing type
- active / archive / unknown
- 公式リンク

#### 競馬場詳細

- 競馬場概要
- 国
- timezone
- racing types
- 今日の時刻表
- 公式リンク
- 将来の説明用画像枠

#### 辞典一覧

- 用語カテゴリ
- racing type
- role
- horse type
- data term
- 画像有無
- 関連国

#### 辞典詳細

- 用語説明
- 関連国
- 関連競馬場
- 関連語
- 説明用PNG画像枠
- alt text

#### アーカイブ

- シンガポール
- マカオ
- ギリシャ
- former racing jurisdiction

#### ソース一覧

- 公式団体
- 公式カレンダー
- racecard / programme
- source type
- terms risk
- auto level

---

## 11. 初期UI方針

### 11.1 基本方針

初期UIは派手にしない。

```text
白背景
黒文字
標準フォント
薄い罫線
装飾少なめ
表は読みやすく
リンクは明確
```

初期は「装飾なしHTMLに近い」見た目でもよい。  
ただし、構造は後から装飾しやすくする。

### 11.2 レスポンシブ必須

初期からモバイルで読めることを必須条件にする。

スマホでは以下。

```text
1カラム
時刻表は縦積み
フィルターは折りたたみ
公式リンクは押しやすく
Coverage / Auto は短いバッジ表示
表は横スクロールに頼りすぎない
```

### 11.3 CSS構成

初期からCSSを分ける。

```text
styles/base.css
styles/layout.css
styles/components.css
styles/utilities.css
styles/theme.css
```

### 11.4 クラス設計例

```text
.site-header
.site-main
.country-card
.track-card
.timetable
.timetable-row
.coverage-badge
.auto-badge
.glossary-card
.source-card
.image-frame
.image-caption
```

---

## 12. 辞典仕様

### 12.1 目的

カレンダーだけでは「今日どこで競馬があるかを見るサイト」で終わる。  
辞典を加えることで「世界の競馬を理解するサイト」にする。

### 12.2 辞典カテゴリ

- レース種別
- 馬種
- 役割
- 競馬場・開催構造
- データ用語
- 公式サイトでよく出る用語

### 12.3 初期辞典15項目

```text
Thoroughbred racing
Harness racing
Trotting
Pacing
Arabian racing
Quarter Horse racing
Banei racing
Racecourse
Meeting
Racecard
Post time
Fixture
Jockey
Driver
Trainer
```

### 12.4 後期追加候補

```text
Owner
Breeder
Steward
Handicapper
Starter
Clerk of the course
Farrier
Veterinarian
Declaration
Entry
Scratch / Non-runner
Going / Track condition
Surface
Distance
Purse / Prize money
Handicap
Maiden
Class
Group / Grade
Listed race
Barrier / Gate
Draw
Field size
```

---

## 13. 画像仕様

### 13.1 基本方針

辞典の各用語には、将来的に最低1枚の説明用PNG画像を付ける。

```text
SVGは使わない
PNGを使う
説明用画像として生成する
理解補助を目的にする
```

### 13.2 初期でやること

初期では画像を全生成しない。  
ただし、データ構造と表示枠は最初から用意する。

```text
glossary.image
glossary.image.alt_en
glossary.image.alt_ja
glossary.image.status
```

### 13.3 辞典画像の条件

- PNG
- 用語理解を助ける描写
- 実在人物を描かない
- 実在馬を描かない
- ロゴ、スポンサー名、商標を描かない
- 競馬の仕組みを説明する構図にする
- altテキスト必須
- caption推奨
- lazy loading

### 13.4 競馬場画像

競馬場ページにも、将来的に特徴説明用の生成PNG画像を置けるようにする。

ただし、実写真の代替として使うのではない。  
公式写真やGoogle画像を参考にそっくり再現しない。

やるなら以下。

```text
Obihiro:
ばんえい用の直線坂路コースの説明イメージ

Sha Tin:
山に囲まれた大規模競馬場の一般的イメージ

Meydan:
大型スタンドと広い近代競馬場の一般的イメージ

Hipódromo Chile:
南米都市部のダート競馬場の一般的イメージ
```

### 13.5 競馬場画像の禁止事項

- 実在競馬場を写真そっくりに再現しない
- 公式写真や商用写真を模写しない
- 公式ロゴを入れない
- スポンサー看板を入れない
- 実在人物・実在馬を描かない
- 公式写真と誤認される表現にしない

### 13.6 競馬場画像の注記

英語：

```text
Illustrative image. Not an official venue photo.
```

日本語：

```text
説明用のイメージ画像です。公式写真ではありません。
```

---

## 14. 多言語方針

### 14.1 初期対応

```text
/      English root
/ja/   日本語版
```

初期は英語rootと日本語版のみ。

### 14.2 将来追加候補

優先順。

1. 繁体字中国語
2. 韓国語
3. フランス語
4. スペイン語
5. ポルトガル語
6. ドイツ語
7. イタリア語
8. アラビア語

最初に追加するなら以下。

```text
/zh-hant/
/ko/
/fr/
```

### 14.3 実装方針

文言をHTML直書きしない。

```ts
i18n.en.title
i18n.ja.title
```

国・競馬場データは多言語フィールドを持つ。

```json
{
  "name_en": "Tokyo Racecourse",
  "name_local": "東京競馬場",
  "name_ja": "東京競馬場",
  "country": "Japan",
  "timezone": "Asia/Tokyo"
}
```

hreflangを入れられる構成にする。

```html
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="ja" href="..." />
```

翻訳ステータスを持つ。

```json
{
  "available_locales": ["en", "ja"]
}
```

---

## 15. レース日時・タイムゾーン方針

### 15.1 基本方針

グローバルサイトであるため、レース日時は **公式ソースの現地時刻** を基準にしつつ、ユーザーが選択したタイムゾーンでも表示できるようにする。

```text
公式ソースの現地時刻
↓
競馬場の IANA timezone と結合
↓
UTC に正規化して保存
↓
画面では
  1. 競馬場の現地時刻
  2. ユーザー選択タイムゾーン
  3. 必要に応じてJST
を表示
```

単純なJST変換だけでは不足する。  
正本は `start_at_utc` とし、各表示時刻はそこから変換する。

### 15.2 公式現地時刻

公式サイトに表示されている発走時刻は、原則として競馬場の現地時刻として扱う。

例：

```text
Sha Tin 20:10
= Hong Kong local time
```

公式ページと照合できるよう、現地時刻は常に表示する。

### 15.3 競馬場単位のIANA timezone

タイムゾーンは国単位ではなく競馬場単位で持つ。

```ts
Racecourse {
  timezone: string // IANA timezone, e.g. "Asia/Hong_Kong"
}
```

固定オフセットは使わない。

使わない例：

```text
UTC+9
GMT-3
```

使う例：

```text
Asia/Tokyo
Asia/Hong_Kong
America/Santiago
Europe/London
Australia/Sydney
Africa/Casablanca
```

理由：

- 夏時間 / DST に対応するため
- アメリカ、カナダ、オーストラリア、ブラジル、ロシアなど複数タイムゾーン国に対応するため
- 競馬場単位で正確な日時変換を行うため

### 15.4 UTC正規化

Raceデータには、現地日付・現地時刻・IANA timezone・UTC正規化時刻を持たせる。

```ts
Race {
  start_date_local: string      // "2026-05-27"
  start_time_local?: string     // "20:10"
  start_timezone: string        // "Asia/Hong_Kong"
  start_at_utc?: string         // "2026-05-27T12:10:00Z"
}
```

`start_time_local` が不明な場合もあるため optional にする。  
`start_at_utc` は、現地日付・現地時刻・timezone が揃った場合に生成する。

`start_time_jst` は正本として保存しない。  
JSTはユーザー選択タイムゾーンの一種として表示時に変換する。

### 15.5 ユーザータイムゾーン表示

ユーザーはタイムゾーンを選択できる。

初期MVPでは以下を用意する。

```text
Timezone:
Auto / Asia/Tokyo / UTC / Europe/London / America/New_York / Australia/Sydney
```

`Auto` はブラウザのタイムゾーンを使う。

```js
Intl.DateTimeFormat().resolvedOptions().timeZone
```

取得できない場合は `UTC` をfallbackにする。  
日本語版では `Asia/Tokyo` を候補上位に出す。

ユーザーが選択したタイムゾーンは `localStorage` に保存する。

```text
timezonePreference = "Asia/Tokyo"
```

### 15.6 表示ルール

常に現地時刻をメインとして表示し、ユーザー選択タイムゾーンをサブ表示する。

英語表示例：

```text
1R
Local: 20:10 HKT
Your time: 21:10 JST
Official detail
```

日本語表示例：

```text
1R
現地時刻：20:10 HKT
あなたの時刻：21:10 JST
公式詳細
```

公式ページと照合できるよう、ユーザー時刻だけの表示にはしない。

### 15.7 日付またぎ表示

タイムゾーン変換により日付が変わる場合は、必ず日付も表示する。

英語表示例：

```text
Local: Wed, May 27 23:40
Your time: Thu, May 28 00:40 JST
```

日本語表示例：

```text
現地時刻：5月27日（水）23:40
あなたの時刻：5月28日（木）00:40 JST
```

日付が同じ場合は、一覧では時刻中心の省略表示でもよい。  
ただし、詳細表示では日付を出す。

### 15.8 「今日」の基準

世界対応では「今日」の基準が複数存在する。  
そのため、カレンダー表示には2つの表示軸を用意する。

```text
Official local date
= 競馬場の現地日付で見る

My timezone date
= ユーザー選択タイムゾーンの日付で見る
```

初期仕様：

```text
国ページ・競馬場ページ:
公式現地日付を基準

トップ・グローバルカレンダー:
ユーザータイムゾーン基準に切り替え可能
```

つまり、以下の関係にする。

```text
Track page = official local schedule
Global calendar = my timezone view available
```

### 15.9 時刻不明の扱い

開催日は分かるが各レース時刻が分からない場合、時刻を推測しない。

表示例：

```text
Race times not available
Official source
```

日本語：

```text
各レースの発走時刻は未取得
公式ソースを見る
```

### 15.10 第1レース時刻だけ分かる場合

「第1レース 13:00」は分かるが、2R以降の時刻がない国・競馬場がある。

その場合は以下のように表示する。

```text
First race: 13:00 local
Full timetable: not available
Official source
```

Coverageは `Level 3 incomplete` 相当として扱うか、UI上で `First race only` ラベルを付ける。

### 15.11 レース状態

初期ではリアルタイム遅延検知は行わない。  
ただし、状態フィールドは持たせる。

```ts
Race {
  status: "scheduled" | "delayed" | "cancelled" | "unknown"
}
```

初期では主に `scheduled` / `unknown` を使う。  
取れる国だけ将来 `delayed` / `cancelled` を追加する。

### 15.12 最終確認時刻

レース時刻そのものとは別に、取得確認時刻を必ず表示する。

```text
Last checked: 2026-05-27 05:17 JST
Source timezone: Asia/Hong_Kong
```

取得確認時刻は、ユーザータイムゾーン表示とは別に、運用上の基準としてJSTまたはUTCで保持する。  
UIではサイト表示言語・ユーザー設定に応じて表示する。

### 15.13 表示フォーマット

初期は24時間表記を基本とする。

英語：

```text
Wed, May 27, 20:10 HKT
```

日本語：

```text
5月27日（水）20:10 HKT
```

12時間 / 24時間切替は後回しでよい。

### 15.14 自動取得時の処理順

公式ソースから時刻を取得するときは、必ず以下の順で処理する。

```text
1. racecourse.timezone を確認
2. 公式時刻を local datetime としてparse
3. UTCへ変換
4. start_at_utc を保存
5. 表示時に各timezoneへ変換
```

夏時間のある国では、固定オフセットで処理しない。

### 15.15 初期から必須の日時仕様

初期から必須：

```text
現地時刻表示
IANA timezone
UTC正規化
ユーザータイムゾーン選択
ブラウザAuto timezone
localStorage保存
Official local date / My timezone date の切替
日付またぎ表示
時刻不明表示
第1レース時刻のみ表示
最終確認時刻
```

後回しでよい：

```text
12時間/24時間切替
複数都市プリセットの拡張
リアルタイム遅延検知
自動位置情報によるtimezone推定
カレンダーアプリ連携時の細かいtimezone調整
```

---

## 16. 自動更新方針

### 15.1 基本方針

v0の自動更新は **GitHub Actions中心** で行う。  
Cloudflare Workers / Pages Functions は使わない。

```text
GitHub Actions = 取得・生成・検証・commit
Cloudflare Pages = 静的配信のみ
Cloudflare Workers = v0では使わない
Pages Functions = v0では使わない
D1 / KV / R2 = v0では使わない
```

### 15.2 更新頻度

| データ | 更新頻度 |
|---|---:|
| 国・競馬場・公式リンク | 月1回 |
| 年間・月間開催カレンダー | 週1回〜月1回 |
| 今日・明日の開催 | 1日1回 |
| 当日の全レース時刻表 | 1日1〜2回 |
| 中止・変更検知 | できる国だけ当日朝＋昼 |
| 出走馬・オッズ・結果 | 原則扱わない |

### 15.3 GitHub Actions cron案

時刻はJST基準。  
GitHub Actions側ではUTCで設定するため、実装時にUTCへ変換する。

```text
毎日 05:17 JST
- 今日・明日の開催を取得
- v0対象国のレース時刻表を取得
- 取得失敗国は前回データ＋公式リンク表示

毎日 12:37 JST
- 当日開催中の国だけ再確認
- 取れない場合は更新しない

週1回
- 今後30〜60日の開催カレンダー更新

月1回
- 国・競馬場・公式リンクの死活確認
```

毎時ちょうど・00分付近は避ける。  
GitHub Actionsの遅延や混雑を考慮し、`05:17` / `12:37` のような半端な時刻を使う。

### 15.4 差分がある場合のみcommit

GitHub Actionsは、生成データに差分がある場合だけcommitする。

```text
差分あり:
- data/generated/*.json をcommit
- 静的サイトの再build対象にする

差分なし:
- commitしない
- build回数を増やさない
```

これにより、Cloudflare PagesやGitHub Pages側のビルド回数を抑える。

### 15.5 生成データの保存場所

```text
data/
  static/
    countries.json
    racecourses.json
    sources.json
    glossary.json

  generated/
    latest.json
    today.json
    tomorrow.json
    calendar-30d.json
    fetch-status.json
```

`static` は通常PRで人間が管理する。  
`generated` はGitHub Actionsが更新する。

### 15.6 最初の自動更新テスト対象

全10国をいきなり自動更新しない。  
最初は以下のような少数で試す。

候補A：

```text
日本
香港
UAE
```

候補B：

```text
香港
UAE
モロッコ
```

### 15.7 将来Cloudflare Workersを使う条件

以下が必要になった場合のみ、Cloudflare Workers / Pages Functions / D1 / KV / R2を再検討する。

```text
リアルタイム検索が必要
ユーザー別保存が必要
API提供が必要
DB検索が必要
サーバー側で動的フィルター処理が必要
アクセス集中で静的JSONが重くなった
GitHub Actionsの更新運用では足りなくなった
```

v0では不要。

---

## 17. 取得失敗・古いデータの扱い

### 16.1 取得失敗時

表示例：

```text
Last checked: 2026-05-26 05:17 JST
Status: Could not refresh today
Fallback: Official source link only
```

### 16.2 データ鮮度ラベル

```text
Fresh
Stale
Manual review
Official links only
Archive
```

### 16.3 原則

- 取得失敗を隠さない
- 古いデータを新しいように見せない
- 不明な値を推測で埋めない
- 公式リンクを必ず残す
- 自動更新できない国にも価値を持たせる

---

## 18. 注意書き

### 17.1 英語

```text
This site does not republish entries, odds, results, or payouts.
Race details are linked to official sources whenever available.
Timetables may be delayed, incomplete, or changed. Always confirm with the official source.
```

### 17.2 日本語

```text
このサイトは出走表、オッズ、結果、払戻を再掲載しません。
各レースの詳細は公式ソースで確認してください。
表示時刻は遅延・変更・未反映の可能性があります。
```

### 17.3 画像に関する注意

英語：

```text
Images are illustrative unless otherwise stated.
Venue images are not official photos.
```

日本語：

```text
画像は特記がない限り説明用イメージです。
競馬場画像は公式写真ではありません。
```

---

## 19. 初期データモデル概要

正式な型定義は次のデータモデル文書で確定する。  
ここでは必須概念のみ定義する。

### 18.1 Country

```ts
Country {
  id: string
  slug: string
  name_en: string
  name_ja?: string
  name_local?: string
  region: string
  status: "active" | "under_review" | "archive" | "excluded" | "special"
  racing_types: string[]
  coverage_level: 1 | 2 | 3 | 4 | 5
  auto_level: "A" | "B" | "C" | "D" | "X"
  available_locales: string[]
}
```

### 18.2 Racecourse

```ts
Racecourse {
  id: string
  slug: string
  country_id: string
  name_en: string
  name_ja?: string
  name_local?: string
  city?: string
  official_url?: string
  timezone: string // IANA timezone, e.g. "Asia/Tokyo"
  racing_types: string[]
  status: "active" | "archive" | "unknown"
  image?: TrackImage
}
```

### 18.3 Source

```ts
Source {
  id: string
  country_id: string
  racecourse_id?: string
  source_type: "official" | "semi_official" | "authority" | "news" | "social" | "archive"
  url: string
  data_type: "calendar" | "racecard" | "programme" | "results" | "link_only"
  auto_level: "A" | "B" | "C" | "D" | "X"
  terms_risk: "low" | "medium" | "high" | "unknown"
}
```

### 18.4 Meeting

```ts
Meeting {
  id: string
  country_id: string
  racecourse_id: string
  date_local: string
  timezone: string // IANA timezone copied from racecourse/source context
  source_id: string
  status: "scheduled" | "cancelled" | "unknown"
  last_checked_at: string
}
```

### 18.5 Race

```ts
Race {
  id: string
  meeting_id: string
  race_number: string
  start_time_local?: string
  start_time_jst?: string
  race_name?: string
  distance?: string
  surface?: string
  official_detail_url?: string
  coverage_level: 1 | 2 | 3 | 4 | 5
}
```

### 18.6 FetchStatus

```ts
FetchStatus {
  source_id: string
  status: "ok" | "failed" | "stale" | "manual" | "skipped"
  checked_at: string
  message?: string
  fallback_url?: string
}
```

### 18.7 GlossaryEntry

```ts
GlossaryEntry {
  id: string
  slug: string
  term_en: string
  term_ja?: string
  category: "race_type" | "horse_type" | "role" | "data_term" | "track_term"
  summary_en: string
  summary_ja?: string
  related_country_ids?: string[]
  related_terms?: string[]
  image?: GlossaryImage
}
```

### 18.8 GlossaryImage

```ts
GlossaryImage {
  src: string
  alt_en: string
  alt_ja?: string
  image_type: "generated_png" | "placeholder"
  status: "planned" | "generated" | "approved"
}
```

### 18.9 TrackImage

```ts
TrackImage {
  src: string
  alt_en: string
  alt_ja?: string
  image_type: "illustrative_generated_png" | "placeholder"
  is_official_photo: false
  note_en: "Illustrative image. Not an official venue photo."
  note_ja: "説明用のイメージ画像です。公式写真ではありません。"
  status: "planned" | "generated" | "approved"
}
```

---

## 20. 初期MVP範囲

初期MVPでやること。

- 英語root
- 日本語版
- 国別インデックス
- 競馬場一覧
- 公式リンク
- 開催日カレンダー
- 当日レース時刻表の表示枠
- データ鮮度表示
- Coverage Level表示
- Auto Level表示
- 取得失敗fallback
- 現地時刻表示
- ユーザータイムゾーン選択
- UTC正規化されたレース時刻
- 日付またぎ表示
- 時刻不明 / 第1レースのみ表示
- GitHub Actions自動更新の設計
- 多言語化しやすいデータ構造
- 最小辞典15項目
- 辞典画像フィールド
- 競馬場画像フィールド
- 白背景・黒文字中心のレスポンシブUI
- 将来装飾しやすいCSS構造

---

## 21. 初期MVPでやらないこと

- Cloudflare Workers
- Cloudflare Pages Functions
- Cloudflare D1
- Cloudflare KV
- Cloudflare R2
- リアルタイム遅延検知
- 自動位置情報によるtimezone推定
- 12時間/24時間切替
- 全言語対応
- 全ページ翻訳
- 自動翻訳の大量投入
- 各国SEO記事
- 各国ニュース
- レース結果の多言語化
- 馬名・騎手名の翻訳
- 個別馬DB
- 個別騎手DB
- オッズ表示
- 払戻表示
- 出走表の自サイト再表示
- 全辞典画像の生成
- 全競馬場画像の生成
- 公式写真の利用
- 実在競馬場を写真そっくりに再現した画像

---

## 22. 開発フェーズ

### Phase 0：静的インデックス

- 国一覧
- Tier分類
- Coverage Level
- Auto Level
- 公式リンク
- アーカイブ国
- Under review国
- 最小辞典15項目
- 画像フィールドとplaceholder

### Phase 1：GitHub Actions自動更新の最小検証

- fetcher基盤
- normalize基盤
- data/generated出力
- FetchStatus生成
- 差分ありのみcommit
- 少数国で検証

候補：

```text
日本
香港
UAE
```

または：

```text
香港
UAE
モロッコ
```

### Phase 2：v0 Alpha 10国

```text
日本
香港
UAE
韓国
トルコ
モロッコ
チリ
ペルー
メキシコ
バーレーン
```

機能。

- 今日の開催
- 競馬場
- レース時刻表
- 公式リンク
- 最終確認時刻
- 取得失敗fallback
- 英語root
- 日本語版

### Phase 3：v0 Public 20〜27国

v0候補全体へ拡張。

### Phase 4：v0.1国を追加

- 開催カレンダー中心
- race-levelは取れる国だけ
- 公式リンク集として価値を出す

### Phase 5：辞典を厚くする

- 用語辞典
- 馬種辞典
- レース種別辞典
- 役割辞典
- 国別競馬文化の説明
- 説明用PNG画像を順次追加

### Phase 6：ロングテール・Under review整理

- 国別ページを追加
- 伝統競馬 / イベント競馬 / アーカイブを分類
- 「なぜ詳細がないか」を明示

---

## 23. PR計画への反映

開発開始後のPR-001〜PR-021に、本仕様を反映する。

```text
PR-001 repo初期化
PR-002 正式仕様書
PR-003 データスキーマ
PR-004 静的JSON構成
PR-005 データバリデーション
PR-006 i18n基盤
PR-007 基本レイアウト
PR-008 注意書き・データ方針
PR-009 国別インデックス
PR-010 競馬場初期データ
PR-011 公式ソース台帳
PR-012 トップページ
PR-013 国一覧
PR-014 国詳細
PR-015 競馬場一覧
PR-016 競馬場詳細
PR-017 レース時刻表・タイムゾーン表示コンポーネント
PR-018 辞典一覧
PR-019 辞典詳細
PR-020 アーカイブページ
PR-021 静的MVP QA
```

追加反映。

```text
PR-003：画像フィールド、FetchStatus、UTC正規化時刻、timezone関連フィールドをデータスキーマに含める
PR-007：レスポンシブ前提のCSS構造を作る
PR-016：競馬場画像枠を持たせる
PR-018/019：辞典画像枠を持たせる
PR-021：モバイル表示、日付またぎ表示、timezone表示確認を含める
```

GitHub Actions関連はPR-022以降に回す。

```text
PR-022 fetcher基盤
PR-023 generated data出力形式
PR-024 GitHub Actions cron
PR-025 更新ステータス表示
PR-026 parserテスト基盤
```

Cloudflare Workers / Pages Functions関連PRはv0では作らない。

---

## 24. 受け入れ条件

この仕様書に基づく初期MVPは、以下を満たすこと。

- `/` と `/ja/` が存在する
- 国別インデックスがある
- 競馬場一覧がある
- v0 Alpha対象国がデータに入っている
- Coverage Levelが表示される
- Auto Levelが表示される
- 公式リンクが表示される
- 出走表・オッズ・結果・払戻を自サイト表示しない
- 辞典15項目がある
- 辞典画像フィールドがある
- 競馬場画像フィールドがある
- 初期UIは白背景・黒文字中心でよい
- スマホで読める
- 取得失敗時fallbackの表示設計がある
- 現地時刻とユーザータイムゾーン時刻を表示できる
- レース時刻をUTC正規化して扱う設計になっている
- 日付またぎを表示できる
- 時刻不明 / 第1レースのみのケースを扱える
- GitHub Actionsで自動更新する設計になっている
- Cloudflare Workers / Pages Functions をv0で使わない
- 注意書きが英日で存在する
- 将来多言語化できる構造になっている

---

## 25. 次に作る文書

この仕様書の次に作るべき文書。

```text
where-horses-run-data-model.md
where-horses-run-alpha-sources.md
where-horses-run-page-map.md
where-horses-run-ui-ascii-mock.md
where-horses-run-ui-css-policy.md
where-horses-run-image-policy.md
where-horses-run-data-use-policy.md
where-horses-run-operations-policy.md
where-horses-run-timezone-policy.md
where-horses-run-pr-plan-mvp.md
where-horses-run-repo-structure.md
where-horses-run-dev-start-checklist.md
```

特に自動更新方針の反映により、次の文書では以下を明確にする。

```text
where-horses-run-operations-policy.md
- GitHub Actions cron設計
- generated data commit方針
- 差分なし時のno-op
- source failure時の扱い
- Cloudflare Workers不使用方針
```

---

## 26. 最終判断

この仕様では、Where Horses Run / 競馬どこ？ を以下として定義する。

```text
世界中の競馬開催とレース時刻表を探し、
公式詳細へ最短で移動できるサイト。
```

出走表・オッズ・結果で大手ポータルと正面勝負しない。  
代わりに、世界中の開催地、レース時刻、公式リンク、競馬種別、競馬場、用語を横断する。

自動更新はGitHub Actionsで行い、Cloudflareは使う場合でも静的配信に限定する。  
レース時刻は公式現地時刻を基準にUTCへ正規化し、現地時刻とユーザー選択タイムゾーンの両方で表示する。  
この方向なら、既存競馬ポータルの下位互換ではなく、**世界競馬の入口・索引・辞典** として成立する。
