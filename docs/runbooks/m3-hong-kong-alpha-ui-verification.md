# M3 Hong Kong alpha UI verification

Status: M3 alpha verification  
Phase: M3 v0 Alpha timetable coverage

This runbook documents the Hong Kong alpha UI verification step.

---

## Target

Country: Hong Kong  
Source id: hong-kong-hkjc-home  
Mode: link-first / dry-run  
Live fetching: disabled

---

## What this verifies

This verification step checks that:

- Hong Kong has an M3 alpha source note
- the source remains link-first and dry-run only
- FetchStatus remains visible
- live fetching remains disabled
- English and Japanese country pages show alpha coverage status
- official source confirmation remains the boundary

---

## User-facing pages to check

After deployment, manually check:

```text
/countries/hong-kong/
/ja/countries/hong-kong/
````

Both pages should show:

* Alpha timetable coverage
* link-first / dry-run mode
* live fetching disabled
* FetchStatus coverage
* official source link
* limitation against republishing racecards, odds, results, payouts, or betting tips

---

## Safety boundary

This step does not:

* fetch live pages
* scrape racecards
* store raw live page bodies
* republish entries
* republish odds
* republish results
* republish payouts
* provide betting tips

---

## Acceptance

This step is accepted when:

* `npm run check` passes
* M3 Hong Kong UI verification passes
* `/countries/hong-kong/` and `/ja/countries/hong-kong/` are readable after deployment
* Hong Kong remains link-first / dry-run only
  