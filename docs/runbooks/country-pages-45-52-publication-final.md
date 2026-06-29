# Country page publication — entries 45-52

Status: ready for merge after rendered-preview approval  
Work ID: `WHR-CP-PUB-45-52`  
PR: #325  
Publication date: 2026-06-29

## Scope

Norway, Finland, Netherlands, Switzerland, Poland, Romania, Serbia, and Slovakia are published in English and Japanese. All country-level public ceilings remain C.

## Rendered-preview evidence

- preview branch: `preview-country-pages-45-52`
- preview trigger commit: `f1a07f9cbd71c8bc4977b878f3bd9630b7ef9a9b`
- successful rendered check run: `28352430635`
- checked routes: 8 English + 8 Japanese
- representative review: Norway, Switzerland, Romania, and Slovakia
- viewports: desktop 1440x1200 and Pixel 7 412x915
- artifact: `rendered-preview-45-52` / `7943936486`
- digest: `sha256:663817f1622d1d8328f042c6a7305f2202001b2290945407b4518a7078dc0014`
- errors: 0

Canonical URLs, language alternates, H1 count, language switching, official links, empty states, CJK rendering, horizontal overflow, embedded-media exclusion, and C-rank time-column suppression passed.

## Boundaries retained

Norway and Switzerland preserve separate racing systems. Romania and Serbia remain partial-country coverage. Slovakia's first-race capability is not generalized beyond the country ceiling. No runner, participant, odds, result, payout, full racecard, embedded video, or direct-stream output is introduced.

## Deployment

Merge PR #325 without `[CF-Pages-Skip]` so exactly one production deployment runs. Confirm representative production routes after deployment.

## Next

`WHR-ST2-53-60`
