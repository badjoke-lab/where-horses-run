# Country pages 37-44 publication runbook

Status: GitHub pre-preview QA  
Work ID: `WHR-CP-PUB-37-44`  
Normal work branch: `country-pages-37-44-publication-final`  
Final preview branch: one `preview-*` branch created only after GitHub QA passes  
Production publication: prohibited until rendered preview review passes

## Scope

Validate and publish the English and Japanese country routes for:

- Malaysia
- Thailand
- Philippines
- Mauritius
- Argentina
- Germany
- Italy
- Spain

## Reviewed public ceilings

All eight country-level public ceilings remain C.

Subsystem-level source capability must not raise the country-level public ceiling where wider national coverage remains incomplete.

## GitHub QA gate

The repository must verify:

- all sixteen built routes exist;
- one h1 per route;
- page-specific canonical links;
- reciprocal English/Japanese hreflang links;
- language switching to the matching country route;
- reviewed official source links are rendered;
- C pages do not render start-time or timezone columns;
- no embedded video or `Watch here` output;
- empty meeting data is not described as absence of racing;
- runtime remains Profile v2 only;
- country programme, roadmap, governance, and Calendar contracts remain valid;
- entries remain at least `profile_ready` until rendered preview approval.

## Validation

```text
npm install
npm run build
node scripts/check-country-page-publication-37-44.mjs
node scripts/check-country-profiles-37-44.mjs
node scripts/check-country-detail-profile-runtime.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
```

## Preview gate

After GitHub QA is green:

1. Create one final `preview-country-pages-37-44` branch at the reviewed PR head.
2. Allow exactly one Cloudflare preview deployment.
3. Review representative English and Japanese C pages on desktop and mobile.
4. Check official links, language switching, metadata, empty states, CJK rendering, and horizontal overflow.
5. Record the immutable preview URL and review result in the PR.
6. Only after approval, advance entries 37-44 to `published`, set route statuses to `published`, set `qa_status=passed`, and add `page_published_at`.
7. Update the canonical roadmap to the next Work ID.
8. Merge without `[CF-Pages-Skip]` and confirm one production deployment.

## Current non-publication state

Until rendered preview approval, entries 37-44 remain `profile_ready` with complete bilingual routes and no publication date.

## Superseded work

PR #308 used an older main baseline and a PR-number-specific runbook. The current-main rebuild supersedes it. Do not merge PR #308.
