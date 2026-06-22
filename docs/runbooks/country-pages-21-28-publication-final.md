# Country pages 21–28 — final publication gate

Deployment class: publication preparation. Cloudflare production remains blocked until rendered preview approval.

Scope: Hungary, Malta, Austria, Puerto Rico, Jamaica, Trinidad and Tobago, Barbados, and Martinique.

This branch is rebuilt from the latest `main`. It does not reuse the stale PR #300 branch history.

Validation:

```text
npm run build
node scripts/check-country-page-publication-21-28.mjs
```

The validator checks:

- eight English and eight Japanese routes
- canonical URLs and reciprocal hreflang
- exactly one h1 per page
- language switching
- reviewed official source links
- safe empty states
- C-page start-time and timezone-column suppression
- no iframe, video, or `Watch here`
- Profile v2-only runtime
- unpublished tracker state until preview approval
- no internal timezone or calendar implementation wording in public HTML

Rendered preview remains mandatory before tracker publication fields are changed. Preview-only marker commits must not be merged into `main`.

## Corrected rendered preview approval

Approved on 2026-06-22.

```text
Immutable preview:
https://19067203.where-horses-run.pages.dev

Representative routes:
/countries/hungary/
/ja/countries/malta/
```

The rendered HTML passed timezone, canonical, language-switch, public-copy, heading, C-column, and prohibited-embed checks. Desktop and mobile screenshots were reviewed with Japanese CJK fonts. Production remains gated on a no-skip merge of PR #311.
