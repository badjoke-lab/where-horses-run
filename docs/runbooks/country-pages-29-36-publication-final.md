# Country pages 29-36 publication runbook

Status: rendered preview approved; publication finalization  
Work ID: `WHR-CP-PUB-29-36`  
Normal work branch: `country-pages-29-36-publication-final`  
Final preview branch: one `preview-*` branch created only after GitHub QA passes  
Production publication: prohibited until rendered preview review passes

## Scope

Validate and publish the English and Japanese country routes for:

- United Kingdom
- United States
- Australia
- Ireland
- France
- Canada
- Saudi Arabia
- India

## Reviewed public ceilings

- A: Ireland, France, Saudi Arabia
- C: United Kingdom, United States, Australia, Canada, India

Subsystem-level source capability must not raise the country-level public ceiling where national coverage remains incomplete.

## GitHub QA gate

The repository must verify:

- all sixteen built routes exist;
- one h1 per route;
- page-specific canonical links;
- reciprocal English/Japanese hreflang links;
- language switching to the matching country route;
- reviewed official source links are rendered;
- C pages do not render start-time or timezone columns;
- A pages do not exceed the reviewed A boundary;
- no embedded video or `Watch here` output;
- empty meeting data is not described as absence of racing;
- runtime remains Profile v2 only;
- country programme, governance, and Calendar contracts remain valid;
- entries remain at least `profile_ready` until rendered preview approval.

## Validation

```text
npm install
npm run build
node scripts/check-country-page-publication-29-36.mjs
node scripts/check-country-profiles-29-36.mjs
node scripts/check-country-detail-profile-runtime.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
```

## Preview gate

After GitHub QA is green:

1. Create one final `preview-country-pages-29-36` branch at the reviewed PR head.
2. Allow exactly one Cloudflare preview deployment.
3. Review representative A and C pages in both English and Japanese.
4. Check desktop and mobile layout, official links, language switching, metadata, and empty states.
5. Record the preview URL and review result in the PR.
6. Only after approval, advance entries 29-36 to `published`, set route statuses to `published`, set `qa_status=passed`, and add `page_published_at`.
7. Update the project roadmap so the next Work ID is `WHR-CP-PUB-37-44`.
8. Merge without `[CF-Pages-Skip]` and confirm one production deployment.

## Rendered preview approval

Approved on 2026-06-28.

```text
Immutable preview: https://747c0076.where-horses-run.pages.dev
Preview branch: preview-country-pages-29-36
A representative: /countries/ireland/ and /ja/countries/ireland/
C representative: /countries/united-kingdom/ and /ja/countries/united-kingdom/
Evidence artifact: rendered-preview-29-36 (artifact 7935963942)
```

Live HTML, desktop screenshots, and Pixel 7 screenshots passed. No horizontal overflow, broken CJK rendering, card-layout failure, prohibited media output, or C-rank time-column leakage was found.

## Publication state

Entries 29-36 are recorded as `published` with `qa_status=passed` and `page_published_at=2026-06-28`. PR #317 now requires a no-skip merge and one production-deployment confirmation.

## Superseded work

PR #304 used an older main baseline and PR-number-specific runbook. The new Work ID and this runbook supersede it. Do not merge PR #304.
