# Static MVP candidate

Status: public project note  
Phase: Static MVP candidate

This document records the static MVP candidate state for Where Horses Run / 競馬どこ？.

---

## Candidate scope

The static MVP candidate includes:

```text
- English root page
- Japanese root page
- Countries index and detail pages
- Racecourses / tracks index and detail pages
- Glossary index and detail pages
- Sources page
- Archive page
- Calendar fallback page
- About page
- Disclaimer page
- Shared data utilities
- Data validation script
- Basic SEO metadata
- Mobile and accessibility passes
```

---

## Public data boundary

The MVP candidate remains source-first and static-first.

```text
Show:
- countries and regions
- racecourses
- official and reference source links
- glossary entries
- fallback calendar status
- coverage notes

Do not republish:
- entries
- odds
- results
- payouts
- tips
- full racecards
- private or paid feeds
```

---

## Candidate checks

Before marking the static MVP as released, confirm:

```text
- npm run validate:data passes
- npm run build passes
- root and Japanese root pages render
- countries pages render
- tracks pages render
- glossary pages render
- sources and archive pages render
- calendar fallback pages render
- about and disclaimer pages render
- mobile layout is readable
- skip link is present
- canonical and alternate tags are present
```

---

## Known limitations

```text
- Generated schedule data is still placeholder data.
- Runtime fetching has not started.
- Parser work has not started.
- Country, track, and glossary data are seed data only.
- Some page text remains intentionally minimal.
```

---

## Next step

If the candidate checks pass, the next step is the static MVP release note.
