#!/usr/bin/env bash
set -euo pipefail
# Exercise the real country persistence helper against a temporary local Git
# remote. The worker starts from a stale checkout while an independent writer
# has already advanced main; preservation of that writer's file is mandatory.
root="$(pwd)"
helper="$root/scripts/timetable/persist-country-on-main.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git init --bare --initial-branch=main "$tmp/remote.git" >/dev/null
git clone "$tmp/remote.git" "$tmp/seed" >/dev/null 2>&1
git -C "$tmp/seed" config user.email test@example.invalid
git -C "$tmp/seed" config user.name "Test Seed"
mkdir -p "$tmp/seed/data/generated/timetable/canonical" "$tmp/seed/data/generated/timetable/public"
paths=(
  data/generated/timetable/canonical/meetings.json
  data/generated/timetable/canonical/meeting-details.json
  data/generated/timetable/public/meeting-list.json
  data/generated/timetable/public/meeting-details.json
)
for path in "${paths[@]}"; do echo '{"baseline":true}' > "$tmp/seed/$path"; done
git -C "$tmp/seed" add .
git -C "$tmp/seed" commit -m baseline >/dev/null
git -C "$tmp/seed" push origin HEAD:main >/dev/null 2>&1

git clone "$tmp/remote.git" "$tmp/worker" >/dev/null 2>&1
git clone "$tmp/remote.git" "$tmp/other" >/dev/null 2>&1
git -C "$tmp/other" config user.email other@example.invalid
git -C "$tmp/other" config user.name "Other Lane"
echo 'preserve-concurrent-change' > "$tmp/other/another-lane.txt"
git -C "$tmp/other" add another-lane.txt
git -C "$tmp/other" commit -m "another lane advanced main" >/dev/null
git -C "$tmp/other" push origin HEAD:main >/dev/null 2>&1

cd "$tmp/worker"
source "$helper"
recollect_on_current_main() {
  for path in "${paths[@]}"; do echo '{"recollected":true}' > "$path"; done
}
echo '{"stale":true}' > "${paths[0]}"
persist_country_on_main "Synthetic country" full recollect_on_current_main

current_main="$(git --git-dir="$tmp/remote.git" rev-parse main)"
[[ "$(git rev-parse HEAD)" == "$current_main" ]]
[[ "$(git --git-dir="$tmp/remote.git" show main:another-lane.txt)" == "preserve-concurrent-change" ]]
for path in "${paths[@]}"; do
  [[ "$(git --git-dir="$tmp/remote.git" show "main:$path")" == '{"recollected":true}' ]]
done
echo "CALENDAR_COUNTRY_PERSIST_RETRY: pass"
