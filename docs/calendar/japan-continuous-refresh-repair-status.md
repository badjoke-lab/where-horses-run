# Japan continuous refresh repair status

The executable guard is `scripts/check-calendar-japan-continuous-refresh-policy.mjs` and the authoritative configuration is `data/static/calendar-due-job-policy-v1.json`.

JRA, NAR, and Banei must remain in recurring current-horizon acquisition with regular refresh, coverage-gap discovery, source revalidation, and lower-rank retry enabled. The current horizon is at least 30 days.

This is an acquisition/retry repair only. It does not enable automatic approval, promotion, publication, merge, or deployment, and it does not require A+ or impose A as a ceiling.
