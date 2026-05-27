# UI and CSS policy

Status: draft  
Scope: v0 static MVP and later visual refinement

This document defines the initial UI and CSS direction for Where Horses Run / 競馬どこ？.

The first version should be plain, readable, responsive, and easy to extend. It does not need a rich visual design.

---

## 1. Core UI principle

v0 prioritizes information structure over decoration.

Initial UI:

```text
white background
black text
system font
clear links
thin borders
minimal cards
readable lists and tables
simple text badges
```

A plain document-like appearance is acceptable if the structure is clear and readable on mobile.

---

## 2. Optimization priorities

v0 should optimize for:

- readability
- official-source transparency
- mobile usability
- fast static rendering
- easy future styling
- clear coverage and freshness labels

v0 should not optimize for:

- heavy branding
- complex animation
- dense media-portal layouts
- decorative dashboard styling
- large hero artwork

---

## 3. Visual tone

Use a neutral, document-like tone.

Use:

```text
plain background
clear headings
high-contrast text
small metadata labels
simple cards
visible official links
```

Avoid:

```text
busy sports portal layout
large decorative effects
overly AI-looking cards
visual noise around timetable rows
```

---

## 4. Responsive behavior

Responsive support is required from the first implementation.

### 4.1 Mobile

On small screens:

- use a single column layout
- stack timetable rows as cards
- collapse filters into disclosure sections
- keep official links easy to tap
- keep Coverage / Auto badges visible
- avoid horizontal scrolling for essential data
- keep line length readable

### 4.2 Tablet

On tablet:

- use one or two columns only when readable
- keep filters above content if side panels are too tight
- avoid dense table layouts for timetable data

### 4.3 Desktop

On desktop:

- use wider containers
- allow two-column profile layouts
- keep timetable rows readable
- avoid over-compressing long lists

---

## 5. Breakpoints

Recommended initial breakpoints:

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

Plain media queries are fine in v0.

---

## 6. CSS file structure

Initial CSS should be split by responsibility.

```text
src/styles/base.css
src/styles/layout.css
src/styles/components.css
src/styles/utilities.css
src/styles/theme.css
```

### 6.1 base.css

Global defaults:

- box sizing
- body font
- text color
- link defaults
- heading rhythm
- form base styles

### 6.2 layout.css

Page-level layout:

- header
- footer
- main wrapper
- page containers
- grids
- section spacing

### 6.3 components.css

Reusable UI components:

- country cards
- track cards
- glossary cards
- source cards
- timetable rows
- badges
- filters
- image frames

### 6.4 utilities.css

Small helpers:

- visually hidden text
- stack spacing
- inline lists
- metadata text
- overflow helpers

### 6.5 theme.css

Future visual layer:

- color tokens
- border radius
- shadows
- visual states
- later brand styling

v0 may keep `theme.css` small, but the file should exist once implementation starts.

---

## 7. CSS variables

Use CSS custom properties for values that may change later.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111111;
  --color-muted: #555555;
  --color-border: #dddddd;
  --color-link: #0645ad;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

Do not hardcode colors repeatedly in component CSS.

---

## 8. Class naming

Use clear, stable component class names.

Examples:

```text
.site-header
.site-nav
.site-main
.site-footer
.page-header
.page-section
.country-card
.track-card
.glossary-card
.source-card
.timetable
.timetable-row
.timetable-card
.coverage-badge
.auto-badge
.freshness-badge
.official-link
.image-frame
.image-caption
.filter-panel
```

Avoid vague names like:

```text
.box
.card2
.wrapper-new
```

---

## 9. Page layout patterns

### 9.1 Standard content page

Use for About, Disclaimer, Glossary detail, and archive explanations.

```text
Header
Main container
  Page title
  Short lead
  Content sections
Footer
```

### 9.2 Index page

Use for Countries, Tracks, Glossary, Sources.

```text
Header
Main container
  Page title
  Search/filter panel
  Result count
  Card/list grid
Footer
```

### 9.3 Detail page

Use for Country and Track detail.

```text
Header
Main container
  Breadcrumb
  Detail header
  Badge row
  Main detail content
  Metadata/source panel
  Related links
Footer
```

### 9.4 Calendar page

Use a layout optimized for date and timetable browsing.

```text
Header
Main container
  Date controls
  Filter panel
  Meeting groups
  Timetable rows/cards
Footer
```

---

## 10. Timetable UI

Timetable is a core site feature and must remain readable.

### 10.1 Desktop row

Desktop can use a table-like row.

```text
1R | 12:20 local | Official detail | Coverage L3
```

### 10.2 Mobile card

Mobile should stack the same data.

```text
1R
Local: 12:20
Official detail
Coverage: Level 3
```

### 10.3 Required labels

Timetable blocks should show:

- local track timezone
- last checked time when available
- source or official link
- freshness state
- fallback state if needed

---

## 11. Badge UI

Badges are required for transparency.

Types:

```text
Coverage Level
Auto Level
Freshness
Status
Source review state
```

Badge text should remain plain and understandable.

Examples:

```text
Coverage L3
Auto B
Fresh
Stale
Official links only
Archive
Under review
```

Do not rely on color alone. Text labels are required.

---

## 12. Filter UI

Filters must be usable on mobile.

### 12.1 Mobile

Use collapsible filter panels.

```text
Filters
  Region
  Status
  Racing type
  Coverage
  Auto
```

### 12.2 Desktop

Filters may appear above results or in a side panel. Avoid dense filter walls in v0 unless needed.

### 12.3 Empty results

Never show only an empty grid. Use an explanation.

Example:

```text
No matching active racing jurisdictions. Try clearing the Coverage filter or include under-review sources.
```

---

## 13. Image frame UI

Glossary and track pages must support image frames even before all final PNGs exist.

### 13.1 Glossary image frame

When a generated PNG exists:

```text
image
caption
alt text in markup
```

When planned but not generated:

```text
Image planned
This term will include an explanatory PNG in a later update.
```

### 13.2 Track image frame

When a track illustrative image exists, always show the disclaimer caption.

```text
Illustrative image. Not an official venue photo.
```

Japanese:

```text
説明用のイメージ画像です。公式写真ではありません。
```

---

## 14. Accessibility requirements

Minimum v0 requirements:

- semantic headings
- visible focus states
- meaningful link text
- alt text for images
- captions for illustrative images
- no color-only meaning
- readable line height
- keyboard accessible filters
- skip link if layout becomes complex

Official source links should be descriptive.

Use:

```text
Open official racecard source
```

Avoid:

```text
Click here
```

---

## 15. Internationalization UI

Language switcher should be simple.

```text
English | 日本語
```

Rules:

- language switch should point to equivalent page when available
- if equivalent page is unavailable, point to locale home
- do not create machine-translated fallback pages
- use same slugs across locales in v0

---

## 16. Public copy constraints

The UI must not imply that the site provides complete official datasets or all detailed race records.

Allowed wording:

```text
Official source link
Race timetable
Calendar
Track guide
Coverage Level
```

Avoid wording:

```text
Complete worldwide racecards
All horse racing data
Live result database
```

---

## 17. Future styling path

The initial plain UI must not block later visual upgrades.

Future design can add:

- richer spacing
- better typography
- icons
- cards
- subtle color system
- improved data grouping
- generated explanatory images

Future design should not require:

- rewriting data models
- changing route names
- replacing page components entirely
- removing accessibility labels

---

## 18. Initial implementation acceptance criteria

The UI/CSS policy is satisfied when:

- all MVP pages are readable on mobile width
- no core page requires horizontal scrolling for essential data
- CSS is split by responsibility
- reusable component classes exist
- Coverage / Auto / Freshness badges are text-readable
- official links are obvious
- glossary and track pages have image-frame support
- layout can be visually improved later without rewriting markup
- visual style does not resemble a dense racing media portal
