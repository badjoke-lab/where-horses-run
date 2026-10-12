#!/usr/bin/env bash
# Source this helper from a Calendar country refresh workflow after collection,
# application, and publication checks have passed.
# Call: persist_country_on_main "<country label>" "<scope>" <recollect_function>
# On a concurrent main update, only rebuild on the latest main. Never force push.

persist_country_on_main() {
  local country_label="${1:?country label required}"
  local scope="${2:?scope required}"
  local replay_function="${3:?replay function required}"
  local attempt remote_main candidate_sha parent_sha

  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

  replay_from_main() {
    local base_sha="${1:?latest main SHA required}"
    echo "main advanced for ${country_label}; rebuilding on ${base_sha}"
    git reset --hard "${base_sha}"
    "${replay_function}"
  }

  git fetch origin main
  remote_main="$(git rev-parse origin/main)"
  if [[ "$(git rev-parse HEAD)" != "${remote_main}" ]]; then
    replay_from_main "${remote_main}"
  fi

  for attempt in 1 2 3 4; do
    git add \
      data/generated/timetable/canonical/meetings.json \
      data/generated/timetable/canonical/meeting-details.json \
      data/generated/timetable/public/meeting-list.json \
      data/generated/timetable/public/meeting-details.json
    if git diff --cached --quiet; then
      echo "No ${country_label} timetable changes to persist"
      return 0
    fi

    git commit -m "data: refresh ${country_label} timetable (${scope})"
    candidate_sha="$(git rev-parse HEAD)"
    parent_sha="$(git rev-parse HEAD^)"

    git fetch origin main
    remote_main="$(git rev-parse origin/main)"
    if [[ "${parent_sha}" != "${remote_main}" ]]; then
      echo "main advanced before ${country_label} push (attempt ${attempt}/4)"
      replay_from_main "${remote_main}"
      continue
    fi

    if git push origin "${candidate_sha}:main"; then
      echo "Persisted ${country_label} timetable against latest main"
      return 0
    fi

    git fetch origin main
    remote_main="$(git rev-parse origin/main)"
    if [[ "${remote_main}" != "${parent_sha}" ]]; then
      echo "main advanced during ${country_label} push (attempt ${attempt}/4)"
      replay_from_main "${remote_main}"
      continue
    fi

    echo "${country_label} push failed even though main did not advance" >&2
    return 1
  done

  echo "${country_label} persistence exhausted 4 bounded rebuild attempts" >&2
  return 1
}
