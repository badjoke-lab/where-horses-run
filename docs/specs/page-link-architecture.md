# Where Horses Run：トップページ導線・ページリンク構成

Status: fixed direction draft  
Scope: top page navigation / racecourse page internal links / site architecture  
Target pages: `/`, `/calendar`, `/countries`, `/tracks`, `/types`, `/glossary`, `/sources`, `/about`

---

## 1. 基本方針

トップページは、単なるカレンダー入口ではなく、以下の入口を持つ。

1. Today / 今日の開催
2. Calendar / 日付別カレンダー
3. Countries / 国別に探す
4. Racecourses / 競馬場から探す
5. Racing Types / 競馬種別から探す
6. Glossary / 用語辞書
7. Sources / 公式ソース

トップページでは、以下2種類のユーザーを分けて導く。

- 今日・直近の競馬予定を見たいユーザー
- 国・競馬場・競馬種別・用語を調べたいユーザー

---

## 2. ヘッダー導線

初期ヘッダーは以下を基本とする。

```text
Today | Calendar | Countries | Racecourses | Glossary | Sources
```

`Racing Types` は初期ではトップページ内ブロックに置き、必要に応じてヘッダーへ追加する。

---

## 3. トップページ構成

トップページは以下のブロックで構成する。

```text
/
├─ Hero / Search
├─ Today’s Racing
├─ Browse by Country
├─ Explore Racecourses
├─ Browse by Racing Type
├─ Racing Glossary
└─ Official Sources
```

---

## 4. Hero / Search

最上部には検索と主要導線を置く。

表示例：

```text
Where Horses Run
Global horse racing calendar, racecourses, and racing terms.

[Search racecourse, country, or term]

Primary buttons:
- See today’s racing
- Browse countries
- Browse racecourses
```

検索対象：

- 国
- 競馬場
- 用語
- 将来的には競馬種別

検索候補例：

```text
Tokyo Racecourse
Japan
Post time
Harness racing
Sha Tin
```

---

## 5. Today / 今日の開催ブロック

トップページの最重要枠とする。

表示項目：

- Racing today
- Upcoming next
- Official source available
- 国名
- 競馬場名
- 次回開催日
- 公式リンク

リンク先：

```text
Today’s Racing → /calendar
国名 → /countries/[country]
競馬場名 → /tracks/[track]
公式リンク → 外部公式
```

表示例：

```text
Japan
Tokyo Racecourse
Next meeting: Jun 8
Track page | Official source

Hong Kong
Sha Tin Racecourse
Racing today
Track page | Official source
```

---

## 6. Countries / 国別導線

トップページから国別一覧へ誘導する。

表示例：

```text
Browse by Country
- Japan
- Hong Kong
- UAE
- United Kingdom
- France
- Australia
```

リンク構造：

```text
/
→ /countries
→ /countries/japan
→ /tracks/tokyo-racecourse
```

国ページ内の構成：

```text
/countries/[country]
├─ Today / upcoming racing
├─ Racecourses in this country
├─ Racing types in this country
├─ Official sources
└─ Related glossary terms
```

---

## 7. Racecourses / 競馬場導線

トップページから競馬場一覧へ直接行けるようにする。

表示例：

```text
Explore Racecourses
- Search by name
- Filter by country
- Filter by racing type
- Filter by surface
```

リンク構造：

```text
/
→ /tracks
→ /tracks/tokyo-racecourse
```

競馬場一覧のフィルター候補：

```text
Country:
Japan / Hong Kong / UAE / France / Australia

Racing type:
Flat / Jump / Harness / Arabian / Quarter Horse / Banei

Surface:
Turf / Dirt / All-weather / Sand / Harness track
```

---

## 8. Racing Types / 競馬種別導線

海外競馬は種別が複数あるため、競馬種別ページを用語辞書・国・競馬場へつなぐ入口にする。

表示例：

```text
Browse by Racing Type
- Thoroughbred flat racing
- Jump racing
- Harness racing
- Trotting
- Pacing
- Arabian racing
- Quarter Horse racing
- Banei racing
```

リンク構造：

```text
/
→ /types
→ /types/harness-racing
→ related countries
→ related racecourses
→ related glossary terms
```

競馬種別ページの構成：

```text
/types/[racing-type]
├─ Explanation
├─ Related countries
├─ Related racecourses
├─ Related terms
└─ Official source examples
```

---

## 9. Glossary / 用語辞書導線

用語辞書は「公式サイトを読むための辞書」として扱う。

表示例：

```text
Racing Glossary
Understand racing calendars, racecards, post times, and racing types.
```

初期表示候補：

```text
Post time
Racecard
Fixture
Meeting
Jockey
Trainer
Driver
Harness racing
Banei racing
```

リンク構造：

```text
/
→ /glossary
→ /glossary/post-time
→ related racecourses
→ related countries
→ related calendar pages
```

---

## 10. Sources / 公式ソース導線

公式ソースは信頼性の土台としてトップページからも行けるようにする。

表示例：

```text
Official Sources
Find official racing calendars and racecourse schedule sources.
```

リンク構造：

```text
/
→ /sources
→ /sources/japan
→ /countries/japan
→ /tracks/tokyo-racecourse
```

---

## 11. トップページからの代表導線

### A. 今日の競馬を見たい人

```text
Top
→ Today’s Racing
→ /calendar
→ country
→ racecourse page
→ official schedule
```

### B. 国から探したい人

```text
Top
→ Browse countries
→ /countries/japan
→ Racecourses in Japan
→ /tracks/tokyo-racecourse
```

### C. 競馬場名で探したい人

```text
Top
→ Search
→ Tokyo Racecourse
→ /tracks/tokyo-racecourse
```

### D. 海外競馬の種類を調べたい人

```text
Top
→ Racing types
→ Harness racing
→ related countries
→ related racecourses
→ related terms
```

### E. 用語を調べたい人

```text
Top
→ Glossary
→ Post time
→ related calendar pages
→ related racecourses
```

---

## 12. 競馬場ページから他ページへのリンク方針

競馬場ページでは、各要素を内部ページへリンクする。

基本リンク方針：

```text
国 → 国ページ
競馬種別 → 種別ページ
芝・ダート等 → 用語ページ
日付 → カレンダー
公式情報 → 外部公式 + sourceページ
データ鮮度 → data coverageページ
関連用語 → glossary
```

---

## 13. 国・都市からのリンク

表示例：

```text
Country: Japan → /countries/japan
City: Fuchu, Tokyo → /countries/japan#racecourses
```

将来、都市ページを作る場合：

```text
City: Fuchu → /locations/fuchu
```

初期では都市ページは不要。

---

## 14. 競馬種別からのリンク

表示例：

```text
Racing type: Thoroughbred flat racing
→ /types/thoroughbred-flat
→ /glossary/thoroughbred-racing
```

ハーネス競馬の場合：

```text
Harness racing → /types/harness-racing
Trotting → /glossary/trotting
Pacing → /glossary/pacing
Driver → /glossary/driver
```

---

## 15. 芝・ダート・AWからのリンク

表示例：

```text
Surface: Turf → /glossary/turf
Surface: Dirt → /glossary/dirt
Surface: All-weather → /glossary/all-weather
```

初期に用語ページがない場合でも、将来のリンク候補としてデータ側には持たせる。

---

## 16. 右回り・左回り・直線からのリンク

表示例：

```text
Direction: Left-handed → /glossary/left-handed-course
Direction: Right-handed → /glossary/right-handed-course
Straight track → /glossary/straight-course
```

これは後期でもよいが、ばんえい・直線競馬を扱う場合は有効。

---

## 17. 距離からのリンク

距離そのものに個別ページは作らなくてよい。  
ただし、距離カテゴリページにまとめる場合は有効。

候補：

```text
1200m → /glossary/sprint-race
1600m → /glossary/mile-race
2000m+ → /glossary/middle-distance
3000m+ → /glossary/staying-race
```

初期はリンク不要でもよい。将来SEOを狙う場合に追加する。

---

## 18. 直近開催予定からのリンク

競馬場ページ内の予定は以下のようにリンクする。

```text
Upcoming meeting
├─ Date → /calendar?date=YYYY-MM-DD
├─ Country → /countries/[country]
├─ Official schedule → external
└─ Racecourse stays current page
```

レース条件が取れる場合：

```text
Race 1 - Dirt 1200m
Dirt → /glossary/dirt
1200m → optional /glossary/sprint-race
Official → external
```

---

## 19. 代表レースからのリンク

初期は代表レースの個別ページを作らない。  
公式リンクのみを優先する。

表示例：

```text
Japan Cup → official link
```

将来的にレース紹介ページを作る場合：

```text
/races/japan-cup
```

ただし、初期では作らない。

---

## 20. 公式リンクからのリンク

表示例：

```text
Official racecourse site → external
Official calendar → external
Official racecard → external
Source registry → /sources/japan
```

外部リンクだけでなく、内部の source ページへのリンクを併記する。

---

## 21. データ鮮度からのリンク

表示例：

```text
Data status: Partial → /about/data-coverage
Last checked → /sources/japan
```

データ信頼性の説明ページ候補：

```text
/about/data-coverage
/about/methodology
```

---

## 22. 関連用語からのリンク

競馬場ページの下部に関連用語を置く。

表示例：

```text
Related terms
- Post time → /glossary/post-time
- Racecard → /glossary/racecard
- Turf → /glossary/turf
- Dirt → /glossary/dirt
- Thoroughbred racing → /glossary/thoroughbred-racing
```

ハーネス競馬場の場合：

```text
- Harness racing → /types/harness-racing
- Trotting → /glossary/trotting
- Pacing → /glossary/pacing
- Driver → /glossary/driver
- Sulky → /glossary/sulky
```

ばんえい競馬場の場合：

```text
- Banei racing → /types/banei-racing
- Straight course → /glossary/straight-course
- Draft horse → /glossary/draft-horse
```

---

## 23. 競馬場ページの内部リンク配置

競馬場ページでは、以下の配置を基本にする。

```text
/tracks/tokyo-racecourse

[Header]
Tokyo Racecourse
Japan → /countries/japan
Thoroughbred flat racing → /types/thoroughbred-flat

[Today / Upcoming]
Date → /calendar?date=YYYY-MM-DD
Official schedule → external
Country calendar → /countries/japan

[Course profile]
Turf → /glossary/turf
Dirt → /glossary/dirt
Left-handed → /glossary/left-handed-course

[Distance profile]
Sprint / Mile / Middle-distance links if available

[Notable races]
Official links only at first

[Official sources]
Official calendar → external
Source registry → /sources/japan

[Related pages]
Japan racing → /countries/japan
Racecourses in Japan → /countries/japan#racecourses
Thoroughbred racing → /types/thoroughbred-flat
Post time → /glossary/post-time
Racecard → /glossary/racecard
```

---

## 24. 複数階層の全体構造

固定する全体構造は以下。

```text
/
├─ /calendar
│  └─ /calendar?date=YYYY-MM-DD
│
├─ /countries
│  └─ /countries/[country]
│      ├─ racecourses section
│      ├─ racing types section
│      └─ official sources section
│
├─ /tracks
│  └─ /tracks/[racecourse]
│      ├─ upcoming meetings
│      ├─ course profile
│      ├─ distance profile
│      ├─ official sources
│      └─ related terms
│
├─ /types
│  └─ /types/[racing-type]
│      ├─ explanation
│      ├─ related countries
│      ├─ related racecourses
│      └─ related terms
│
├─ /glossary
│  └─ /glossary/[term]
│      ├─ explanation
│      ├─ related terms
│      ├─ related racecourses
│      └─ related countries
│
├─ /sources
│  └─ /sources/[country]
│      ├─ official calendars
│      ├─ racecourse sources
│      └─ source status
│
└─ /about
   ├─ /about/data-coverage
   └─ /about/disclaimer
```

---

## 25. トップページで最初に置くべき導線の優先順位

トップページでの優先順は以下。

1. Today’s Racing → `/calendar`
2. Browse by Country → `/countries`
3. Browse Racecourses → `/tracks`
4. Racing Types → `/types`
5. Glossary → `/glossary`
6. Official Sources → `/sources`

トップページに全情報をベタ置きしすぎず、カード型の入口として整理する。

---

## 26. 固定判断

Where Horses Run のトップページとページリンク構成は以下で固定する。

- トップページは `Today / Calendar / Countries / Racecourses / Racing Types / Glossary / Sources` の入口を持つ
- 競馬場ページは、国・競馬種別・芝ダート等・日付・公式情報・データ鮮度・関連用語から他ページへ飛ばす
- カレンダー、国、競馬場、競馬種別、用語辞書、公式ソースを孤立させず、内部回遊できる構造にする
- 初期では代表レース・都市・距離ごとの個別ページは作らず、必要に応じて後期拡張する
