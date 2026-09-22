# Calendar non-running evidence research — Wave 3 KRA / HRI — 2026-09-22

## Scope

This research continues the meeting-presence contract after JRA, NAR, Banei, HKJC and ERA reached bounded automated whole-meeting negative-evidence handling.

The objective is narrow:

- find a reliable official authority route that explicitly proves a whole meeting will not run;
- keep acquisition failure and ordinary source absence separate from semantic non-running state;
- reject race-only cancellation / scratching / unsafe-track warnings that do not explicitly cancel the whole meeting;
- bind any accepted evidence to an existing canonical meeting identity;
- preserve canonical evidence and suppress only public active/upcoming publication after confirmed whole-meeting evidence.

No production automation is activated by this note.

## South Korea / KRA

Current production positive-evidence routes remain:

- annual operation plan: `https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1`
- published-racecard probe: `https://race.kra.co.kr/thisweekrace/ThisWeekDetailInfoList.do?Act=01&Sub=1&meet=0`
- per-track current/detail collection used by the existing KRA runner.

Additional official material reviewed on 2026-09-22:

- KRA public operation overview: `https://www.kra.co.kr/op/pu/07/oppu0701.do?menuId=skr03_skr032_skr0321`
- KRA race-data update schedule: `https://race.kra.co.kr/dbdata/renewDBDate.do?Act=12&Sub=2&meet=1`
- 2026 racing calendar: `https://race.kra.co.kr/popRace.do`

The current evidence proves schedule/race-day publication capability, but this wave has not yet proven a bounded official whole-meeting cancellation status route that can be safely parsed by meeting/date.

Therefore KRA remains:

- `mode = unsupported`
- `whole_meeting_non_running = not_proven`
- source omission -> `absent_unconfirmed`
- acquisition failure -> preserve verified state.

A later KRA implementation must not promote horse cancellation (`말취소`), rider change, track condition, or an unpublished racecard into whole-meeting non-running.

## Ireland / HRI

Current production positive-evidence routes remain:

- annual fixture publication / fixture PDF;
- monthly racecard endpoint `/Ajax/RaceMeetingByMonth`;
- racecard detail pages under `https://www.hri.ie/racecards/details?meeting=...`.

Official HRI pages reviewed on 2026-09-22 show that racecard detail pages expose meeting-condition text and a `Meeting Updates` surface. Example:

- `https://www.hri.ie/racecards/details?meeting=2026-005` carries `GOING: Unraceable` plus an explanation that parts of the track are frozen.

That is **not** sufficient whole-meeting cancellation evidence. `Unraceable`, inspection-pending, weather warnings, or a track being currently unfit can precede a later go-ahead decision. A separate HRI example explicitly says that a fixture `goes ahead` after inspection:

- `https://www.hri.ie/racecards/details?meeting=2025-164&race=1515`

Historical HRI publications also prove that Ireland has abandoned and rescheduled meetings, but historical annual/factbook prose is not a suitable rolling production negative-evidence route.

This wave has not yet proven the exact stable HRI endpoint/field that emits an explicit final whole-meeting status such as abandoned/cancelled for the live rolling window.

Therefore HRI remains:

- `mode = unsupported`
- `whole_meeting_non_running = not_proven`
- source omission -> `absent_unconfirmed`
- acquisition failure -> preserve verified state.

A future HRI parser may only activate after an official live route is pinned and regression fixtures prove that:

1. an explicit final whole-meeting abandonment/cancellation is accepted;
2. `Unraceable` / inspection language alone is rejected;
3. partial-race abandonment is rejected as whole-meeting evidence;
4. rescheduled/replacement dates remain independent meetings;
5. source failure preserves verified state.

## Result of this wave

No unsafe inference was added.

KRA and HRI remain deliberately unsupported for automated whole-meeting non-running evidence until a live official final-status route is proven. The research narrowed the next target: for HRI, identify the actual `Meeting Updates` transport/endpoint or final-status field; for KRA, identify an official meeting-level cancellation bulletin/status keyed by track and race date.

The existing global invariant remains unchanged:

`not found` != `confirmed_non_running`.
