# Where Horses Run v1 production confirmation

Release ID: `WHR-V1`  
Work ID: `WHR-V1-RELEASE`  
Implementation unit: `V1-PRODUCTION-CONFIRMATION-01`  
Confirmation date: 2026-07-19  
Status: complete

## Purpose

Confirm the public Where Horses Run v1 surface after the final release-decision merge without relying on a local browser, deployment-dashboard access, or assumptions about the hosting platform.

The read-only production probe runs from GitHub Actions against:

```text
https://whr.badjoke-lab.com
```

The release commit recorded for this confirmation is `6d45895fb04ccbc3160e763c54438a4d51dff905`.

The public site does not expose hosting-platform commit metadata, so the probe confirms the live public surface after the release merge rather than claiming that the response itself proves an internal deployment identifier.

## Required checks

The probe performs 12 public route checks:

- English and Japanese home pages;
- English and Japanese Calendar pages;
- English and Japanese FAQ pages;
- English and Japanese Methods and Data Policy pages;
- English and Japanese Sources pages;
- `sitemap.xml`;
- `robots.txt`.

Every route must return HTTP 200 from the production origin. HTML pages must retain the expected language, canonical URL, content type, and visible identifying marker.

The crawler layer must retain:

- 771 sitemap URLs;
- all ten required HTML routes in the sitemap;
- the production sitemap reference in `robots.txt`.

## Result

The accepted result is:

```text
required route checks:       12
failed requests:              0
non-200 responses:            0
redirect-origin errors:       0
content-type errors:          0
visible-marker errors:        0
language errors:              0
canonical errors:             0
sitemap URL count:          771
sitemap count errors:         0
sitemap required-route errors: 0
robots errors:                0
```

The successful GitHub Actions run and its uploaded JSON report are the execution evidence for this confirmation.

## Boundaries

This unit adds no public route, public data class, visitor feature, canonical data write, deployment action, tag, or GitHub Release.

The probe:

- sends unauthenticated GET requests only;
- uses no visitor identifiers, cookies, client storage, or analytics;
- cannot publish, deploy, mutate repository data, create tags, or create releases;
- stores only route-level response metadata and validation results in the temporary Actions artifact;
- deletes the generated report and logs from the worktree before the repository-clean proof.

## Next stage

Where Horses Run proceeds to reviewed incremental maintenance inside the accepted v1 scope. Official sources remain the final authority, unattended publication remains disabled, and any scope expansion requires a separate reviewed decision.
