#!/usr/bin/env bash
set -euo pipefail

git config user.name github-actions[bot]
git config user.email 41898282+github-actions[bot]@users.noreply.github.com
git add docs/country-pages/98-country-tracker.tsv docs/country-pages/programme-roadmap.md scripts/check-country-page-programme.mjs scripts/check-country-page-programme-roadmap.mjs
git commit -m '[CF-Pages-Skip] Advance notes 45-52 [45-52-note-sync]'
git push
