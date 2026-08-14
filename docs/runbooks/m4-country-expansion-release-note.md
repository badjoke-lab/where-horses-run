# M4 Country Expansion Release

Date: 2026-08-15

## Summary

M4 country expansion is complete as a reviewed, public-safe milestone.

The Calendar coverage dashboard now presents six countries on one consistent surface:

- Japan
- Hong Kong
- United Arab Emirates
- South Korea
- Turkey
- Morocco

This does not mean that all six countries have the same timetable depth. The dashboard deliberately separates verified official-source capability from the timetable records that have actually passed review and are present in the public dataset.

Public coverage remains partial. Official source links remain the final confirmation point.

## Country boundary

### Japan

Japan remains part of the reviewed public timetable foundation. Existing publication and source-specific display limits remain unchanged.

### Hong Kong

Hong Kong remains part of the reviewed public timetable foundation. Existing HKJC publication controls remain unchanged.

### United Arab Emirates

UAE remains represented under the existing reviewed timetable foundation. A season gap or zero current meetings must not be presented as missing source capability or invented active coverage.

### South Korea

South Korea official-source timetable capability is verified for the reviewed KRA route set.

This is not a complete-country coverage claim. Public timetable output remains review-controlled and publication is capped by the existing display policy.

### Turkey

Turkey official-source timetable capability is verified, including the current TJK `YarisSever` programme route used by the collector path.

Candidate collection capability does not authorize automatic publication. Canonical writes, public projection writes, automatic approval, and deployment remain disabled unless a separate reviewed workflow explicitly permits them.

### Morocco

Morocco remains blocked for timetable candidate generation.

SOREC official racing context and racecourses have been revalidated, but no stable public official meeting-date or daily-programme source has been verified. Morocco must therefore not be described as having C, A, or other timetable coverage merely because the shared schema contains a fallback rank field.

## Coverage dashboard

The bilingual Calendar dashboard reports two different things separately:

1. **Verified source capability** — which timetable dimensions are supported by reviewed official-source evidence.
2. **Reviewed public dataset** — counts derived only from timetable data already present in the committed public projection.

The dashboard covers Racecourses, Dates, Events, Times, and Structures independently. It does not expose adapter state, candidate workflow state, canonical-write state, or other internal workflow vocabulary on the public page.

## Publication boundary

M4 does not widen the established timetable display boundary.

- Calendar, Today, Tomorrow, country, racecourse, and current-timetable list surfaces remain meeting-level summaries rather than expanded racecards.
- Rank A remains race label or race number plus post time only.
- Rank A+ programme-summary fields remain limited to meeting-detail pages and remain subject to source-specific review controls.
- Entries, runners, horses, jockeys, trainers, odds, results, payouts, predictions, tips, full racecards, raw source bodies, and direct stream media remain outside the public timetable dataset.

## Automation boundary

M4 does not introduce automatic public publication.

- reviewed candidate generation may exist for supported sources;
- human review remains required before promotion;
- no new automatic Canonical write is authorized by this release;
- no new automatic public projection write is authorized by this release;
- no deployment behavior is authorized by this release.

## Release evidence

The M4 coverage dashboard was merged in PR #583.

Exact PR head:

`6fafe7a51e6df51805d335ef5747d4acf3dd58a0`

Merge commit:

`f0fbd7c3ca80c8dcc2f8ea0f87916cb677cd0734`

The exact PR head passed all 27 triggered workflows, including:

- Calendar coverage dashboard rendered validation;
- normal static build;
- v1 performance QA;
- v1 mobile QA across every public page;
- v1 accessibility QA;
- Phase 11 SEO QA;
- v1 release readiness;
- v1 release decision.

The merge commit then passed all 25 push-triggered `main` workflows.

During review, an inline-style regression was caught by the v1 performance gate. The dashboard styles were moved into the existing shared CSS bundle without increasing the one-CSS-file budget, and the final exact head passed the preserved performance contract.

## What may safely be claimed

Users and public project notes may safely say:

- M4 country expansion is complete as a reviewed milestone.
- The Calendar coverage dashboard compares six countries using the same source-capability/public-data model.
- South Korea and Turkey have verified reviewed official-source timetable capability.
- Morocco remains source-blocked for timetable generation until a stable official programme source is verified.
- Public coverage is partial and review-controlled.

## What must not be claimed

Do not claim:

- complete global coverage;
- complete coverage for any of the six countries solely because it appears on the dashboard;
- automatic official timetable synchronization;
- automatic publication from source collection;
- Morocco timetable coverage while its official programme source remains unverified;
- racecard, odds, results, payout, prediction, or betting-advice support.

## Next

The next roadmap item is PR-088, **Scheduled candidate generation design**.

That work should begin as a design and dry-run boundary. It must not turn candidate generation into automatic public publication.
