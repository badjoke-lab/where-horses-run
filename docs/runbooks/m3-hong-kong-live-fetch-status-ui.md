# M3 Hong Kong live fetch status UI

Status: M3 live fetch status UI
Phase: M3 v0 Alpha timetable coverage

This runbook documents the safe UI display for Hong Kong live fetch probe metadata.

---

## Target

Country: Hong Kong
Source id: hong-kong-hkjc-home
Mode: live fetch probe metadata display

---

## What this PR adds

This PR adds public-safe probe metadata display to country pages.

The UI may show:

- source id
- probe status
- HTTP status
- checked time
- final URL
- content type
- safety flags

---

## Hard boundary

The UI must not show or store:

- raw HTML
- response body text
- racecard content
- entries
- odds
- results
- payouts
- betting tips

---

## User-facing pages to check

After deployment, manually check:

- /countries/hong-kong/
- /ja/countries/hong-kong/

Both pages should show Live fetch probe status and safety flags.

---

## Acceptance

This step is accepted when:

- npm run check passes
- Hong Kong page shows live fetch probe metadata
- raw_content_saved remains false
- body_read remains false
- generated_files_written remains false
- no raw HTML is stored in generated probe status data
