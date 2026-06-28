# v0 specification status note

Status: active authority note  
Applies to: `docs/specs/where-horses-run-v0-spec.md`  
Last reviewed: 2026-06-28

The v0 specification is retained as the historical product baseline. Its product intent remains useful:

```text
world racing calendar
+ race timetable
+ official source guide
+ racecourse index
+ glossary
```

It is not the current implementation contract.

When the v0 specification differs from current active contracts, use the authority order in `docs/governance/document-authority.md`.

Current governing documents include:

- `docs/project-roadmap.md`;
- the country-page roadmap and active addenda;
- Source Test v2 and Calendar Readiness contracts;
- the global timetable architecture and active addendum;
- timetable data-flow/display contracts and adopted schemas;
- deployment and CI policy;
- internal source handling boundary.

Examples of evolved areas:

- the project has moved beyond the initial 10/20-country v0 phases to a formal 98-country bilingual programme;
- Calendar components and generated-data foundations already exist;
- raw local source material is explicitly kept outside the public repository;
- automatic update is not a universal requirement; automatic, semi-automatic, manual, link-only, blocked, and not-applicable treatments are valid;
- candidate generation, human promotion, freshness, fallback, and public ceiling are formal concerns;
- Work IDs replace fixed future PR numbers as the durable schedule key.
