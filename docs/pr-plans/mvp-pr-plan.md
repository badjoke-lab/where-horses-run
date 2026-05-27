# MVP PR plan

Status: draft

This plan reflects the repository state after the initial documentation pass.

---

## 1. Current state

Already present:

```text
README.md
docs/README.md
docs/specs/README.md
docs/research/README.md
docs/decisions/README.md
docs/pr-plans/README.md
docs/runbooks/README.md
```

Current specs:

```text
docs/specs/where-horses-run-v0-spec.md
docs/specs/data-model.md
docs/specs/page-map.md
docs/specs/ui-css-policy.md
docs/specs/image-policy.md
docs/specs/data-use-policy.md
docs/specs/operations-policy.md
```

Current research:

```text
docs/research/alpha-sources.md
```

Implementation has not started yet.

---

## 2. Static MVP target

The static MVP should render:

```text
/
/ja/
/calendar/
/ja/calendar/
/countries/
/ja/countries/
/countries/[slug]/
/ja/countries/[slug]/
/tracks/
/ja/tracks/
/tracks/[slug]/
/ja/tracks/[slug]/
/glossary/
/ja/glossary/
/glossary/[slug]/
/ja/glossary/[slug]/
/archive/
/ja/archive/
/sources/
/ja/sources/
/about/
/ja/about/
/disclaimer/
/ja/disclaimer/
```

The MVP does not require real scheduled fetching.

---

## 3. PR sequence

### PR-001 docs baseline

Status: done directly on main.

### PR-002 docs: add MVP and roadmap planning

Add:

```text
docs/pr-plans/mvp-pr-plan.md
docs/pr-plans/full-roadmap-pr-plan.md
docs/runbooks/dev-start-checklist.md
```

### PR-003 app: initialize Astro project

Add:

```text
package.json
astro.config.mjs
tsconfig.json
src/
public/
```

Acceptance:

- install works
- build works
- one basic page renders

### PR-004 app: add base layout and styles

Add:

```text
src/layouts/BaseLayout.astro
src/styles/base.css
src/styles/layout.css
src/styles/components.css
src/styles/utilities.css
src/styles/theme.css
src/pages/index.astro
src/pages/ja/index.astro
```

Acceptance:

- English and Japanese home pages render
- layout is readable on mobile

### PR-005 data: add static data skeleton

Add:

```text
data/static/countries.json
data/static/racecourses.json
data/static/sources.json
data/static/glossary.json
data/static/archive.json
data/static/i18n/en.json
data/static/i18n/ja.json
```

Acceptance:

- JSON is valid
- Alpha countries are seeded
- initial glossary terms are seeded

### PR-006 scripts: add validation foundation

Add data validation scripts.

Acceptance:

- required fields checked
- enum values checked
- references checked
- URL fields checked

### PR-007 ci: add baseline check workflow

Add:

```text
.github/workflows/check.yml
```

Acceptance:

- install
- validate data
- build site

### PR-008 app: add i18n and data utilities

Add:

```text
src/lib/i18n.ts
src/lib/data.ts
src/lib/coverage.ts
src/lib/dates.ts
src/lib/urls.ts
```

### PR-009 app: implement countries pages

Add countries index and detail pages for English and Japanese.

### PR-010 app: implement tracks pages

Add tracks index and detail pages for English and Japanese.

### PR-011 app: implement glossary pages

Add glossary index and detail pages for English and Japanese.

### PR-012 app: implement archive and sources pages

Add archive and sources pages for English and Japanese.

### PR-013 app: implement calendar page with fallback

Calendar should render from static data first and optional generated data later.

### PR-014 app: add about and disclaimer pages

Add English and Japanese versions.

### PR-015 app: add SEO metadata and hreflang basics

Add titles, descriptions, canonical URLs, and English/Japanese alternates.

### PR-016 app: mobile usability pass

Check 360px, tablet, and desktop layouts.

### PR-017 app: accessibility pass

Check headings, focus states, link labels, image alt/caption support, and keyboard use.

### PR-018 app: MVP content polish

Review country summaries, glossary summaries, official link labels, and disclaimers.

### PR-019 release: static MVP candidate

Build and checks should pass.

### PR-020 release: static MVP

Prepare deployment or release notes.

---

## 4. Post-MVP update foundation

### PR-021 scripts: add fetcher foundation

Add:

```text
scripts/fetch/
scripts/normalize/
data/generated/
```

### PR-022 data: add generated output fixtures

Add sample files:

```text
data/generated/latest.json
data/generated/today.json
data/generated/tomorrow.json
data/generated/calendar-30d.json
data/generated/fetch-status.json
```

### PR-023 ci: add scheduled update workflow

Add:

```text
.github/workflows/update-racing-data.yml
```

### PR-024 app: render generated schedules and FetchStatus

Calendar and detail pages should show generated data when available.

### PR-025 scripts: add first parser test

Target one source only.

Suggested first candidates:

```text
Hong Kong
United Arab Emirates
Morocco
```

### PR-026 ops: first automated update candidate

One source can update generated data safely.

---

## 5. Implementation start gate

Astro implementation can begin when:

- v0 spec exists
- data model exists
- page map exists
- data use policy exists
- operations policy exists
- MVP PR plan exists

After this document, the repo is ready for either:

```text
1. full-roadmap-pr-plan.md
2. dev-start-checklist.md
3. Astro initialization
```
