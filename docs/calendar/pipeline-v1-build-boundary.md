# Calendar pipeline v1 — static build boundary

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Decision

Astro production builds read committed public timetable projections only.

```text
data/generated/timetable/public/meeting-list.json
data/generated/timetable/public/meeting-details.json
-> publicTimetableViewModel.ts
-> static pages
```

Candidate extraction, normalization, canonical generation, promotion, and public projection must not run as an `astro.config.mjs` side effect.

## Reason

The previous Astro configuration executed `scripts/timetable/build-public-timetable-pipeline.mjs` while configuration was loaded. That pipeline can normalize source-specific data and rewrite canonical/public JSON. A normal site build was therefore not truly read-only even after the older June merge command was removed from `package.json`.

Build-time generation is unsafe because it:

- mixes data acquisition/transformation with rendering;
- can overwrite reviewed committed records with legacy or sample inputs;
- makes repeated builds non-deterministic when generators use the current time;
- bypasses the intended candidate, review, promotion, and generated-update PR boundary;
- makes rollback and provenance harder to audit.

## Enforced boundary

`astro.config.mjs` may configure Astro only. It must not import `node:child_process`, execute timetable scripts, or write repository data.

The public runtime reads only the committed public projection through `src/lib/timetable/publicTimetableViewModel.ts`.

The explicit transitional generation pipeline remains available at:

```text
node scripts/timetable/build-public-timetable-pipeline.mjs
```

It is not approved for unattended publication. It remains a migration path until pipeline v1 replaces the legacy canonical writer, makes public projection deterministic, and establishes reviewed generated-update PR operation.

## CI proof

The dedicated workflow:

1. validates the static build boundary;
2. installs dependencies without creating a lockfile;
3. runs `npm run build`;
4. fails when the build modifies or creates any repository file.

This proves the rendering build is repository-read-only. It does not prove that the transitional generation pipeline is safe for scheduled operation.

## Next pipeline slice

The next implementation slice must define one candidate envelope and one write-ownership path:

```text
adapter/manual import -> bounded candidate
human review -> canonical promotion
canonical data -> deterministic public projection
```

Legacy builders and source-specific direct writers remain inactive migration targets until that slice is complete.
