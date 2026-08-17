# M6 v1.0 release candidate

Implementation unit: `M6-V1-RELEASE-CANDIDATE-01`

Status: `release_candidate_ready`

This gate re-certifies the current M6 mainline after PR-096 through PR-100. It does not replace or rewrite the accepted July v1 release-decision baseline; that baseline remains historical evidence.

## Required M6 work

- PR-096: mobile timetable UX pass
- PR-097: six-country coverage matrix
- PR-098: source freshness badges
- PR-099: Methods / Data Policy final
- PR-100: SEO / sitemap / metadata final

The target-country set remains Japan, Hong Kong, UAE, South Korea, Turkey, and Morocco.

## Candidate QA

The PR-101 gate requires a complete static build, every PR-096 through PR-100 checker, the current SEO release gate, a full current public-page mobile sweep, a full current public-page accessibility sweep, current static performance measurement, and preservation of the accepted v1 release-decision contract.

All jobs are read-only and must leave the repository clean.

## Publication boundary

PR-101 does not expand the public data boundary. A+ remains a lightweight programme summary on meeting-detail pages only. Complete racecards, entries or participants, odds, results, payouts, predictions, copied official-source body text, raw HTML, and unreviewed candidate publication remain excluded.

PR-101 does not create a release tag, create a GitHub Release, or perform deployment. Those actions remain outside this release-candidate gate.

## Next

The next roadmap work item is PR-102 / `M6-V1-RELEASE-01`.
