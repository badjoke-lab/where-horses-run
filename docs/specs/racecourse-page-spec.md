# Where Horses Run：競馬場ページ仕様

Status: fixed direction draft  
Scope: racecourse detail pages / track pages  
Target paths: `/tracks/[racecourse-slug]`, `/ja/tracks/[racecourse-slug]`

---

## 1. 基本方針

Where Horses Run では、**1競馬場につき1ページ**を作る。

ただし、手作業でHTMLを1枚ずつ作るのではなく、`racecourses.json` などの構造化データから自動生成する。

競馬場ページは、単なる施設紹介ではなく、以下3点を中心にした固定ページとする。

1. 直近の開催予定
2. コース特徴
3. 公式ソース導線

ページの役割は以下。

> 競馬場ページ = 競馬場ごとの開催予定・コース特徴・公式リンク・関連用語をまとめる固定ページ

---

## 2. ページURL

```text
/tracks/[racecourse-slug]
/ja/tracks/[racecourse-slug]
```

例：

```text
/tracks/tokyo-racecourse
/ja/tracks/tokyo-racecourse
```

---

## 3. 表示する基本情報

競馬場ページ上部に以下を表示する。

- 競馬場名
- 現地名
- 日本語名
- 国
- 都市
- 地域
- タイムゾーン
- 競馬場ステータス
  - `active`
  - `seasonal`
  - `closed`
  - `unknown`
- 対応競馬種別
  - Thoroughbred flat
  - Jump racing
  - Harness racing
  - Trotting
  - Pacing
  - Arabian racing
  - Quarter Horse racing
  - Banei

表示例：

```text
Tokyo Racecourse
東京競馬場

Country: Japan
City: Fuchu, Tokyo
Timezone: Asia/Tokyo
Racing type: Thoroughbred flat racing
Status: Active
```

---

## 4. 今日の開催状況

競馬場ページには、今日その競馬場で開催があるかを表示する。

表示項目：

- `Racing today`
- `No racing today`
- `Unknown`
- 今日開催ありの場合
  - レース数
  - 最初のレース時刻
  - 最終レース時刻
  - 公式詳細リンク
- 今日開催なしの場合
  - 次回開催日

表示例：

```text
Today
No verified racing today.

Next meeting:
Jun 8, 2026
```

または：

```text
Today
Racing scheduled.

First post: 10:05
Last race: 16:30
Races: 12
Official racecard: Open
```

---

## 5. 直近の開催予定

カレンダーサイトとして、競馬場ページにも直近予定を表示する。

表示項目：

- 次回開催日
- 直近5〜10件の開催予定
- 開催日
- 曜日
- 現地時刻
- 競馬場タイムゾーン
- レース数
- 1R発走予定時刻
- 最終レース発走予定時刻
- 公式スケジュールリンク
- データ取得状況
- `last_checked`

表示例：

```text
Upcoming meetings

Jun 8, 2026
Status: Scheduled
First post: 10:05
Last race: 16:30
Races: 12
Official schedule: Open

Jun 15, 2026
Status: Scheduled
First post: To be confirmed
Official schedule: Open
```

---

## 6. 直近開催のレース条件

取得できる場合は、出走馬やオッズを載せずに、レース条件だけ表示する。

表示項目：

- 日付
- レース番号
- 発走時刻
- 芝 / ダート / AW / 障害 / ハーネス等
- 距離
- レース種別
- 公式リンク

表示例：

```text
Upcoming race conditions

Jun 8, 2026
Race 1 - 10:05 - Dirt 1200m
Race 2 - 10:35 - Turf 1600m
Race 3 - 11:05 - Dirt 1800m
```

### 表示しないもの

以下は自サイトでは表示しない。公式リンクへ誘導する。

- 出走馬一覧
- 騎手一覧
- 馬番
- オッズ
- 予想
- 結果
- 払戻

---

## 7. コース特徴

競馬場ページには、簡単なコース特徴を最初から表示する。

表示項目：

- コース種別
  - Turf
  - Dirt
  - All-weather
  - Sand
  - Harness track
  - Jump course
  - Banei straight track
- 右回り / 左回り / 直線 / 不明
- 1周距離
- 直線距離
- コーナー数
- 内回り / 外回り
- 高低差
- 坂の有無
- ナイター設備
- 季節開催か通年開催か
- 簡単なコース特徴説明

表示例：

```text
Course characteristics
- Surface: Turf and dirt
- Direction: Left-handed
- Turf course: approx. xxxx m
- Dirt course: approx. xxxx m
- Home straight: approx. xxxx m
- Notes: Large oval course with separate turf and dirt layouts.
```

数値が不明な場合は、無理に推測せず `Not confirmed` と表示する。

---

## 8. 距離プロフィール

芝・ダート・AW・障害・ハーネスなど、条件別に距離情報を表示する。

表示項目：

- 芝の距離範囲
- ダートの距離範囲
- AWの距離範囲
- 障害の距離範囲
- ハーネスの距離範囲
- よく使われる距離
- 直近開催で使われる距離

この情報は以下の2種類に分ける。

1. 競馬場の構造として対応している距離
2. 直近開催予定に出ている距離

表示例：

```text
Race distance profile

Turf:
- Common range: 1200m–2400m
- Known distances: 1400m, 1600m, 1800m, 2000m, 2400m

Dirt:
- Common range: 1200m–2100m
- Known distances: 1200m, 1400m, 1600m, 1800m, 2100m
```

---

## 9. 代表レース・主な開催

初期から簡単に表示してよい。

表示項目：

- 代表的な重賞
- 主要開催シーズン
- 年間の大きな開催
- 公式ページリンク

表示例：

```text
Notable races
- Japan Cup
- Tokyo Yushun
- Yasuda Kinen
```

初期では、代表レースの個別ページは作らず、公式リンクを優先する。

---

## 10. 開催シーズン

国や競馬場によって開催時期が大きく異なるため、開催シーズン情報を表示する。

表示項目：

- 通年開催
- 季節開催
- 春開催
- 夏開催
- 冬開催
- 乾季中心
- 休止期間あり
- 公式カレンダー確認リンク

表示例：

```text
Season
This racecourse usually operates during the UAE racing season.
Always check the official calendar for current dates.
```

---

## 11. 公式リンク

公式ソース導線は必須とする。

表示項目：

- 競馬場公式サイト
- 主催者公式サイト
- 開催カレンダー
- レース予定
- racecard
- visitor info
- source page

外部公式リンクと、内部の source ページへのリンクを併記する。

---

## 12. データ鮮度・取得状況

全競馬場ページに表示する。

表示項目：

- course profile status
- schedule status
- source status
- verified / partial / placeholder / stale / failed / manual / official-link-only
- last checked

表示例：

```text
Data status
Schedule: Partial
Course profile: Verified
Last checked: 2026-06-04
Source: Official racing authority
```

---

## 13. 関連リンク

競馬場ページ下部に関連リンクを置く。

表示項目：

- 国ページ
- 地域ページ
- 関連競馬場
- 関連用語
- 関連レース種別
- 公式ソースページ

---

## 14. 画像・図

初期では画像は必須にしない。  
ただし、データ項目は最初から持つ。

表示・データ項目：

- `image_status`
- `image_path`
- `image_alt_en`
- `image_alt_ja`
- `course_diagram_status`

後期で追加する画像は、実写真ではなく説明用PNGやコース模式図を優先する。

候補：

- コース形状の簡易図
- 芝・ダートの違い
- 左回り / 右回りの説明
- ハーネス競馬場の構造
- ばんえい直線コースの説明

---

## 15. 初期MVPで必須の表示

初期MVPでは以下を必須表示対象にする。

1. 競馬場名
2. 国・都市
3. タイムゾーン
4. 競馬種別
5. 今日の開催状況
6. 直近の開催予定
7. 公式リンク
8. データ鮮度
9. コース種別
10. 簡単なコース特徴
11. 芝・ダート・AWなどの対応表面
12. 距離範囲
13. 関連用語

---

## 16. 取得できるなら初期から表示するもの

- 1周距離
- 直線距離
- 左回り / 右回り
- 芝コース距離範囲
- ダートコース距離範囲
- 直近開催のレース距離
- レース数
- 1R発走時刻
- 最終レース発走時刻
- 代表レース

---

## 17. 後回しにするもの

以下は初期では後回しにする。

- 詳しい歴史
- 詳しいアクセス案内
- 観光情報
- 座席情報
- 飲食情報
- 詳細なコース図
- PNG画像
- 写真
- 現地観戦ガイド

---

## 18. データ構造案

```json
{
  "id": "tokyo-racecourse",
  "slug": "tokyo-racecourse",
  "name_en": "Tokyo Racecourse",
  "name_local": "東京競馬場",
  "name_ja": "東京競馬場",
  "country_id": "japan",
  "city": "Fuchu",
  "region": "Tokyo",
  "timezone": "Asia/Tokyo",
  "status": "active",
  "racing_types": ["thoroughbred-flat"],
  "surfaces": ["turf", "dirt"],
  "direction": "left-handed",
  "course_profile": {
    "turf_circumference_m": null,
    "dirt_circumference_m": null,
    "home_straight_m": null,
    "has_inner_outer_courses": true,
    "has_lighting": null,
    "elevation_notes": null,
    "course_notes_en": null,
    "course_notes_ja": null
  },
  "distance_profile": {
    "turf": {
      "min_m": null,
      "max_m": null,
      "known_distances_m": []
    },
    "dirt": {
      "min_m": null,
      "max_m": null,
      "known_distances_m": []
    }
  },
  "schedule_summary": {
    "today_status": "unknown",
    "next_meeting_date": null,
    "upcoming_meetings": []
  },
  "notable_races": [],
  "official_links": [],
  "related_terms": [],
  "data_status": {
    "course_profile": "partial",
    "schedule": "official-link-only",
    "last_checked": null
  },
  "image_status": "pending",
  "image_path": null
}
```

---

## 19. 固定判断

Where Horses Run の競馬場ページは、以下の方針で固定する。

- 作成単位は **1競馬場1ページ**
- ページはデータから自動生成する
- 初期から直近予定・今日の開催状況・簡単なコース特徴・距離情報を表示対象にする
- 出走表・オッズ・結果・払戻は扱わない
- 詳細情報は公式リンクへ誘導する
- 競馬場ページは、国ページ・カレンダー・用語辞書・公式ソースページをつなぐ中核ページにする
