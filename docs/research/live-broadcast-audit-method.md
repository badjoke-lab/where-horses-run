# Live broadcast audit method

Status: draft  
Scope: public-safe research foundation for official live broadcast and replay availability

This document defines how Where Horses Run may research and record official live broadcast and replay availability across racing jurisdictions and racing types. It is intentionally link-first: it records where a user can check an official or clearly official-partner source, but it does not republish video or detailed race data.

---

## 1. Purpose

The live broadcast audit exists to answer a narrow public information question:

> Where can a user verify whether an official live broadcast or replay source exists for a racing jurisdiction or racing type?

The audit may document:

- official live broadcast availability status
- official replay availability status
- official or clearly official-partner provider names
- links to official broadcast or replay landing pages
- access requirements such as account login, paid television access, or geographic restrictions
- research confidence and last checked date

The audit must not become a video service, betting guide, racecard mirror, or commercial racing-data republication layer.

---

## 2. Public-safe boundaries

Do not add or display:

- embedded race video
- copied race video clips or streams
- unofficial video mirrors as usable sources
- betting, odds, entries, results, payouts, or full racecards
- instructions for bypassing login, payment, or geographic restrictions
- reconstructed broadcast schedules from non-public or unofficial sources

If the source contains detailed race data, the project should link to the official page rather than republishing that data.

---

## 3. Source rules

Use only these source categories:

1. Official racing authority, racecourse, tote, broadcaster, or league pages.
2. Official video, streaming, or replay pages operated by the racing authority or racecourse.
3. Clearly official-partner pages where the relationship is stated by the authority, racecourse, or provider.
4. Official social media accounts only when the account is identifiable as the authority, racecourse, or official partner.

Do not treat random video mirrors, reposted clips, forums, or unsourced social accounts as usable broadcast sources. If an unofficial mirror is found during research, record the status as `unsafe_unofficial` only when needed for internal caution, and do not present it as a user-facing source option.

---

## 4. Status definitions

Use the status values defined in `data/static/live-broadcast-statuses.json` for both `live_status` and `replay_status` unless a field-specific note says otherwise.

General interpretation:

- `official_free`: official live or replay content appears publicly available without an account.
- `official_account`: official live or replay content appears available with a non-betting account.
- `betting_account`: access appears tied to a betting, wagering, tote, or deposit account.
- `tv_pay`: access appears tied to a paid television or subscription package.
- `broadcast_partner`: access appears provided by an official broadcast or streaming partner.
- `replay_available`: official replay pages appear available; this is mainly useful for `replay_status`.
- `social_stream`: official or official-partner social stream appears available.
- `racecourse_only`: viewing appears available only through on-course or venue channels.
- `event_only`: availability appears limited to specific events, seasons, or special broadcasts.
- `geo_restricted`: official access appears restricted by country or region.
- `not_verified`: the jurisdiction has not been checked yet or evidence is insufficient.
- `none_found`: official research found no usable official live or replay source.
- `archive_only`: only archived or historical official video appears available.
- `unsafe_unofficial`: unofficial video was found but must not be displayed as a usable source.

---

## 5. Coverage record method

Each coverage record should describe one jurisdiction or jurisdiction/racing-type grouping. Use conservative, source-backed values.

Required fields are documented in `data/static/live-broadcast-coverage.json`:

- `jurisdiction_id`
- `country_or_region`
- `racing_types`
- `live_status`
- `replay_status`
- `provider_name`
- `official_live_url`
- `official_replay_url`
- `requires_login`
- `requires_betting_account`
- `requires_paid_tv`
- `geo_restriction`
- `source_type`
- `evidence_urls`
- `confidence`
- `last_checked`
- `notes`

Use `null` for unknown booleans, URLs, provider names, and dates. Use empty arrays for unknown or not-yet-audited `racing_types` and `evidence_urls`.

---

## 6. Confidence levels

Use conservative confidence labels:

| Confidence | Meaning |
|---|---|
| `high` | Official source clearly states availability and access requirements. |
| `medium` | Official source indicates availability, but some details are incomplete or conditional. |
| `low` | Official signal exists, but details need follow-up verification. |
| `not_checked` | No audit has been performed yet. |

Do not use high confidence for unofficial or unclear sources.

---

## 7. Update workflow

When updating coverage records:

1. Start with official authority, racecourse, broadcaster, or partner pages.
2. Confirm that each URL is a landing page or public information page, not an embedded stream URL.
3. Record only minimal access facts needed to route users safely.
4. Prefer `not_verified` over guessing.
5. Set `last_checked` to the date the official evidence was reviewed.
6. Keep notes neutral and brief.

---

## 8. Display guidance

User-facing displays should remain link-first and neutral:

- Use labels such as "Official live source", "Official replay source", or "Official broadcast partner".
- Show account, paid TV, or geographic restriction notices when present.
- Do not imply that Where Horses Run provides, owns, hosts, or guarantees the stream.
- Do not display `unsafe_unofficial` as a usable source.
- If availability is uncertain, show `not_verified` or omit the row until research is complete.
