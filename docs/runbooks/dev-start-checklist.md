# Development start checklist

Status: draft  
Scope: before PR-003 Astro initialization

This checklist is the gate between planning and implementation for Where Horses Run / 競馬どこ？.

---

## 1. Source of truth

Before app work starts, treat these files as the current source of truth:

```text
README.md
docs/README.md
docs/specs/where-horses-run-v0-spec.md
docs/specs/data-model.md
docs/specs/page-map.md
docs/specs/ui-css-policy.md
docs/specs/image-policy.md
docs/specs/data-use-policy.md
docs/specs/operations-policy.md
docs/research/alpha-sources.md
docs/pr-plans/mvp-pr-plan.md
docs/pr-plans/full-roadmap-pr-plan.md
```

Do not start by redesigning the product. Start by implementing the static MVP path already defined in the specs.

---

## 2. Repository state gate

Required before PR-003:

```text
- repository exists: badjoke-lab/where-horses-run
- default branch exists: main
- README exists
- docs index exists
- v0 specification exists
- data model exists
- MVP PR plan exists
- full roadmap PR plan exists
```

Current implementation state:

```text
planning/docs only
Astro app not initialized yet
no runtime data fetching yet
no generated data workflow yet
```

---

## 3. PR-003 implementation target

PR-003 should initialize the application shell only.

Add:

```text
package.json
astro.config.mjs
tsconfig.json
src/pages/index.astro
src/pages/ja/index.astro
public/
```

Optional but acceptable in PR-003:

```text
src/styles/global.css
src/layouts/BaseLayout.astro
```

Do not add full data models, parser logic, generated data, or source scraping in PR-003.

---

## 4. Required package choices

Use:

```text
Astro
TypeScript
static JSON / TS data later
GitHub Actions later
```

Do not add unless a later PR explicitly requires it:

```text
Next.js
React runtime requirement
server API framework
Cloudflare Workers
Cloudflare Pages Functions
D1
KV
R2
paid data API
```

Cloudflare Pages may be used later only as static hosting.

---

## 5. Initial site behavior

The first app shell should render:

```text
/
/ja/
```

Minimum visible content:

```text
Where Horses Run
Global Horse Racing Calendar & Timetable
競馬どこ？
世界の競馬開催カレンダー・レース時刻表
```

It should also communicate the core positioning:

```text
world racing calendar
timetable and official-source index
glossary and racecourse guide
no entries, odds, results, payouts, tips, or full racecards republished
```

---

## 6. Layout and UI constraints

Initial UI may be plain, but must be structured for later expansion.

Required from the start:

```text
responsive layout
readable at 360px width
plain white/black baseline acceptable
semantic headings
clear navigation placeholders
no inaccessible tiny text
no fixed desktop-only layout
```

Do not implement flashy visual styling before the data and page structure are working.

---

## 7. Data safety constraints

The app must preserve the project's safe data boundary.

Do not display or model as public page content in the static MVP:

```text
entries
odds
results
payouts
race tips
full racecards
horse performance databases
jockey databases
trainer databases
private or paid data feeds
```

The product should link to official sources for detailed race information.

---

## 8. Timezone constraints

Timezone handling is a required design concern even before generated data exists.

PR-003 does not need full date conversion, but must not introduce assumptions such as:

```text
all racing dates are JST
all race times can be stored as fixed offsets
user timezone is the data source of truth
```

Future implementation must use:

```text
official local racecourse time
IANA timezone IDs
UTC normalization for generated schedule records
user-selected display timezone as a display layer only
```

---

## 9. Image constraints

Glossary and racecourse image fields are part of the data model, but PR-003 should not generate image assets.

Future rules:

```text
glossary explanation images: PNG final assets, not SVG
racecourse images: illustrative generated PNG only
no official venue photos without permission
no copied venue composition
caption must state illustrative/non-official status
```

---

## 10. Check commands for PR-003

After PR-003, the expected local checks should be:

```text
npm install
npm run build
```

If a check script is added in PR-003, it should be minimal:

```text
npm run check
```

where `check` can initially run the Astro build.

Full data validation belongs in PR-006.

---

## 11. PR-003 acceptance

PR-003 is acceptable when:

```text
package.json exists
Astro config exists
TypeScript config exists
/ renders
/ja/ renders
npm install works
npm run build works
no Cloudflare runtime code is added
no scraping/fetcher code is added
no prohibited racing data is displayed
```

---

## 12. Immediate next step

Start:

```text
PR-003 app: initialize Astro project
```

Keep PR-003 small. The goal is not to build the whole site in one change. The goal is to move from planning docs to a buildable Astro application foundation.
