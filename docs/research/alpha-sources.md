# v0 Alpha source registry

Status: draft  
Scope: pre-implementation source registry for the first 10 Alpha jurisdictions

This document lists the initial official-source candidates for v0 Alpha. It is not a final parser specification. Each source still needs page-level verification before automation.

Alpha jurisdictions:

```text
Japan
Hong Kong
United Arab Emirates
South Korea
Turkey
Morocco
Chile
Peru
Mexico
Bahrain
```

---

## 1. Registry columns

Each jurisdiction should be reviewed with these fields:

| Field | Meaning |
|---|---|
| Authority / operator | Main official racing authority or racecourse operator |
| Official home | Stable official home or authority URL |
| Calendar candidate | Fixture / calendar / programme candidate |
| Timetable candidate | Race-day race list / racecard / programme candidate |
| Official detail link | Whether a per-race official detail link appears possible |
| Initial coverage target | v0 target level |
| Auto target | likely Auto Level |
| Risk notes | JS/PDF/login/terms/manual-review issues |
| Fallback | What the site shows if parsing fails |

---

## 2. Japan

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Japan Racing Association / National Association of Racing |
| Official home | `https://jra.jp/` / `https://www.keiba.go.jp/` |
| Calendar candidate | JRA race calendar / NAR 開催日程 |
| Timetable candidate | JRA race card pages / NAR レース情報 |
| Official detail link | likely yes |
| Initial coverage target | Level 3 for selected meetings; Level 2 fallback |
| Auto target | B |
| Risk notes | Two systems, central and local; NAR pages may use dynamic components; do not republish entries, odds, results, or payouts |
| Fallback | Link to JRA / NAR official race information pages |

### Initial implementation notes

Japan should be split internally into:

```text
japan-jra
japan-nar
japan-banei
```

Do not try to cover every Japanese racecourse in the first parser. Start with source-level links and one or two representative meeting formats.

---

## 3. Hong Kong

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | The Hong Kong Jockey Club |
| Official home | `https://www.hkjc.com/` |
| Calendar candidate | HKJC fixtures / monthly race programme |
| Timetable candidate | HKJC Race Card |
| Official detail link | likely yes |
| Initial coverage target | Level 3, possibly Level 4 when safe |
| Auto target | B |
| Risk notes | Racecard contains entries, odds, horse and jockey data; v0 must extract only race number/time/minimal official-link data if safe |
| Fallback | Link to HKJC Race Card / Fixtures |

### Initial implementation notes

Hong Kong is a strong early candidate because official racecard and fixture pages are centralized. The parser must avoid copying full racecard content.

---

## 4. United Arab Emirates

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Emirates Racing Authority / Dubai Racing Club |
| Official home | `https://emiratesracing.com/` / `https://www.dubairacingclub.com/` |
| Calendar candidate | ERA fixtures / racecards area |
| Timetable candidate | ERA racecards |
| Official detail link | likely yes |
| Initial coverage target | Level 3, Level 4 if official race name/distance is safely available |
| Auto target | B |
| Risk notes | Need page-level verification; some official pages may be JS-heavy |
| Fallback | Link to ERA racecards / fixtures |

### Initial implementation notes

Use the authority source first. Dubai Racing Club can be treated as a supporting source for Meydan-specific pages.

---

## 5. South Korea

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Korea Racing Authority |
| Official home | `https://www.kra.co.kr/` |
| Calendar candidate | KRA race schedule / LetsRun pages |
| Timetable candidate | KRA race card or race information pages |
| Official detail link | under review |
| Initial coverage target | Level 2 first, Level 3 after page verification |
| Auto target | B/C |
| Risk notes | Korean-language site structure and dynamic pages need parser verification; avoid full entries/results replication |
| Fallback | Link to KRA official race information pages |

### Initial implementation notes

South Korea should not be treated as parser-ready until current KRA page structure is inspected. It remains in Alpha because it is strategically important and likely has official sources.

---

## 6. Turkey

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Türkiye Jokey Kulübü |
| Official home | `https://www.tjk.org/` |
| Calendar candidate | TJK race programme / fixtures |
| Timetable candidate | TJK race programme pages |
| Official detail link | likely yes |
| Initial coverage target | Level 3 if parser is stable |
| Auto target | B |
| Risk notes | Turkish-language source; page URLs and dynamic data need verification; do not copy full racecard |
| Fallback | Link to TJK official programme pages |

### Initial implementation notes

Turkey is likely valuable because TJK is centralized. Parser readiness must be checked separately.

---

## 7. Morocco

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | SOREC |
| Official home | `https://www.sorec.ma/` |
| Calendar candidate | SOREC race calendar / programme pages |
| Timetable candidate | SOREC programme pages |
| Official detail link | under review |
| Initial coverage target | Level 2 first, Level 3 if programme structure is stable |
| Auto target | B/C |
| Risk notes | French/Arabic source; programmes may be PDF or dynamic; page-level verification needed |
| Fallback | Link to SOREC official racing/programme pages |

### Initial implementation notes

Morocco is important because it differentiates the site beyond major English/Japanese racing markets.

---

## 8. Chile

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Hipódromo Chile / Club Hípico de Santiago / Valparaíso Sporting / Club Hípico de Concepción |
| Official home | `https://www.hipodromo.cl/` and other Chilean racecourse sites |
| Calendar candidate | Racecourse programme / calendar pages |
| Timetable candidate | Racecourse programme pages |
| Official detail link | under review |
| Initial coverage target | Level 2-3 for selected racecourses |
| Auto target | B/C |
| Risk notes | Multiple operators; each may need separate parser; some programmes may be PDFs or images |
| Fallback | Link to selected official racecourse programme pages |

### Initial implementation notes

Do not model Chile as a single source. Start with one or two representative racecourses, then expand.

---

## 9. Peru

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Jockey Club del Perú / Hipódromo de Monterrico |
| Official home | `https://www.jockeyclubdelperu.com.pe/` or current official Monterrico/JCP domain to verify |
| Calendar candidate | Monterrico programme / calendario pages |
| Timetable candidate | official programme pages |
| Official detail link | under review |
| Initial coverage target | Level 2 first, Level 3 if stable programme pages exist |
| Auto target | C initially |
| Risk notes | Official URL/domain must be verified before parser work; programmes may be PDF, image, or dynamic |
| Fallback | Link to official JCP / Monterrico pages after verification |

### Initial implementation notes

Peru stays in Alpha because Monterrico is important for South America coverage, but it needs careful source verification before automation.

---

## 10. Mexico

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Hipódromo de las Américas |
| Official home | `https://hipodromo.com.mx/` or current official domain to verify |
| Calendar candidate | Calendar / programme pages |
| Timetable candidate | programme or race-day pages |
| Official detail link | under review |
| Initial coverage target | Level 2 first, Level 3 if stable pages exist |
| Auto target | C initially |
| Risk notes | Current official URL and programme format must be verified; avoid betting/odds data |
| Fallback | Link to official Hipódromo de las Américas pages after verification |

### Initial implementation notes

Mexico is an Alpha candidate for regional balance, but should not be parser-first until source format is checked.

---

## 11. Bahrain

### Source candidates

| Field | Value |
|---|---|
| Authority / operator | Bahrain Turf Club |
| Official home | `https://www.bahrainturfclub.com/` |
| Calendar candidate | fixtures / racecards pages |
| Timetable candidate | racecards pages |
| Official detail link | likely yes |
| Initial coverage target | Level 3 if page structure is stable |
| Auto target | B |
| Risk notes | Need current page-level verification; do not republish entries or results |
| Fallback | Link to Bahrain Turf Club fixtures / racecards |

### Initial implementation notes

Bahrain is a useful Alpha target for Arabian Gulf coverage. Parser readiness should be checked after UAE.

---

## 12. Initial automation order

Do not automate all Alpha sources at once.

Recommended first test group:

```text
Hong Kong
United Arab Emirates
Morocco
```

Alternative test group:

```text
Japan
Hong Kong
United Arab Emirates
```

Selection rule:

```text
1. choose source with stable official pages
2. extract only date, track, race number, start time, and official detail URL
3. generate FetchStatus even on failure
4. keep official fallback link visible
5. do not scrape or republish entries, odds, results, or payouts
```

---

## 13. Next verification tasks

Before parser work, create per-country notes under:

```text
docs/research/source-notes/
```

Suggested order:

```text
hong-kong.md
uae.md
japan.md
morocco.md
bahrain.md
```

Each note should include:

```text
- exact official URL candidates
- date parameter behavior
- sample race day
- available race-level fields
- fields allowed for v0 display
- fields to ignore
- fallback URL
- parser risk
```
