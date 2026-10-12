#!/usr/bin/env bash
set -euo pipefail
# Three independent Ontario 2026 AGCO official C artifacts.
# Strictly date/venue/code facts; source failures do not create cancellation evidence.
for entry in \
  "woodbine_thoroughbred:canada-ontario-woodbine-thoroughbred-system" \
  "fort_erie_thoroughbred:canada-ontario-fort-erie-thoroughbred-system" \
  "ajax_quarter_horse:canada-ontario-ajax-quarter-horse-system"
do
  key="${entry%%:*}"
  system="${entry#*:}"
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=".calendar-unified/canada-ontario/${key}.json" \
    --country-id=canada \
    --authority-id=ontario-racing \
    --racing-system-id="${system}" \
    --timezone=America/Toronto
done
