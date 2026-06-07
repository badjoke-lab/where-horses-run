# Priority 2 live/replay audit completion note

Status: documentation-only correction and completion note  
Last updated: 2026-06-07

This note records the corrected Priority 2 live/replay audit state.

## Corrected status

Priority 2 is complete for the original target set.

There are no remaining open Priority 2 targets.

The previous wording that treated Austria as an open Priority 2 target is outdated. Austria is already represented by the audited static record `austria` in `data/static/live-broadcast-coverage.json`.

## Completed Priority 2 records

| Target | Record coverage | Current status summary |
| --- | --- | --- |
| Austria | Krieau / Wiener Trabrenn-Verein evidence. | `event_only` live and `replay_available`; Austria-wide flat coverage is not verified. |
| Belgium | Mons racecourse evidence. | Replay evidence only; live remains `none_found`; no national Belgium claim. |
| Netherlands | Victoria Park Wolvega evidence. | `racecourse_only` live and replay evidence; harness/racecourse-specific only. |
| Switzerland | Suisse Trot and White Turf records. | Split replay-only and event-only evidence. |
| Norway | Rikstoto Direkte / Rikstoto Play surface. | `tv_pay` live and replay evidence; no free-access claim. |
| Finland | TotoTV harness evidence. | `betting_account` live and replay evidence; harness-only. |
| Poland | Służewiec iTV racecourse-network evidence. | `official_free` live and replay evidence; not complete national coverage. |
| Slovakia | Závodisko Bratislava authority/racecourse context. | live and replay are both `none_found`. |
| Serbia | Belgrade, SKAS trotting, and Ljubičevo event records. | Regular sources are `none_found`; Ljubičevo is event/archive-only. |
| Greece | Markopoulo inactive domestic racing status. | live and replay are both `none_found`; no active domestic coverage claim. |

## Guardrails

- `not_verified: 0` applies only to audited static records.
- No Priority 2 country should be described as complete national coverage unless a future record-level audit explicitly supports that.
- Coverage wording must remain record-specific: racecourse-specific, code-specific, event-only, replay-only, account-limited, paid-TV-limited, inactive, or none-found as applicable.
- This note does not add UI, runtime fetching, video embeds, direct stream URLs, calendar data, racecards, odds, entries, results, payouts, predictions, or tips.
