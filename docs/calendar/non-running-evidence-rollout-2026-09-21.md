# Calendar non-running evidence rollout — Wave 1 baseline

Status: active implementation baseline  
Reviewed: 2026-09-21  
Contract: `docs/calendar/meeting-presence-and-non-running-contract.md`

## Purpose

This wave classifies every racing system currently published by the production Calendar by its ability to prove whole-meeting cancellation/postponement. It does not infer non-running from schedule disappearance.

The expansion lane remains independent. A country may be added while negative-evidence mode is `unsupported`; the safe behavior is retention as `absent_unconfirmed`.

## Current production classification

| Country / system | Mode | Automation | Whole-meeting evidence | Notes |
| --- | --- | --- | --- | --- |
| Japan / JRA | automated | active | supported | The official current all-news index (`/news/index4.html`) is scanned for bounded cancellation/change candidate articles; only explicit whole-meeting wording is accepted and race-only cancellations are rejected. |
| Japan / NAR | automated | active | supported positive-evidence subset | Official NAR JRA-net topic indexes are scanned for explicit whole-meeting cancellation notices. The route is intentionally non-exhaustive: missing notices remain `absent_unconfirmed`. |
| Japan / Banei | automated | active | supported | Official monthly Banei TOPICS archives are scanned for cancellation-related articles; whole-day/multi-day Banei cancellations are accepted while partial-race and external-racing notices are rejected. |
| Hong Kong / HKJC | automated | active | supported | Existing monthly fixture acquisition now extracts only explicit whole-meeting cancellation sentences and emits durable presence evidence. |
| UAE / ERA | automated | active | supported | Existing racecard/declarations acquisition now accepts only the explicit whole-meeting status `THIS MEETING HAS BEEN CANCELLED` and emits durable presence evidence. |
| South Korea / KRA | unsupported | not implemented | not proven | Current official operation plan / fast-report routes do not yet prove bounded whole-meeting negative evidence. |
| Turkey / TJK | unsupported | not implemented | not proven | Annual/daily programmes are positive schedule evidence only. |
| Morocco / SOREC | unsupported | not implemented | not proven | No reliable official explicit route proven in this wave. |
| Chile / Teletrak network | unsupported | not implemented | not proven | Multi-venue programme network has no normalized cancellation route proven. |
| Ireland / HRI | unsupported | not implemented | not proven | HRI handles abandoned/rescheduled meetings, but current WHR routes do not yet prove a bounded status parser. |
| Peru / Monterrico | unsupported | not implemented | not proven | Date/programme API is positive evidence; failed/empty discovery is never cancellation evidence. |

This leaves zero production countries unclassified.

## Proven official examples

- JRA: official 2026-09-21 Nakayama cancellation / substitute-date notice.
- Banei Tokachi: official notice cancelling the 2025-05-10 through 2025-05-12 Banei meetings.
- NAR: official JRA-net notices explicitly cancel Kanazawa on 2025-08-26 and 2025-09-02, Monbetsu on 2025-07-30, and Saga on 2024-08-29; the Saga notice separately states which races were moved and that the rest had no substitute meeting.
- HKJC: September 2026 official fixture page states that the Sha Tin meeting originally scheduled for 20 September 2026 will be cancelled.
- ERA: official 2026-03-04 Meydan racecard/declarations page renders `THIS MEETING HAS BEEN CANCELLED`.

These examples prove that official explicit negative evidence exists. HKJC, ERA, JRA, Banei and NAR now have bounded parser/discovery paths, identity binding, rolling-artifact emission, durable generated presence persistence, and publication integration, so their registry rows are `automated`. NAR is explicitly an auxiliary positive-evidence subset rather than a complete nationwide cancellation feed.

## Safety invariant for every system

- acquisition failure -> preserve verified canonical/public state;
- successful source omission without accepted explicit negative evidence -> `absent_unconfirmed`;
- only accepted whole-meeting official evidence -> `confirmed_non_running`;
- partial race cancellation must never suppress the whole meeting;
- replacement dates are independently acquired meetings;
- canonical evidence survives public non-running suppression.

## Next implementation order

Wave 1B completed the two lowest-risk same-source candidates: HKJC and ERA.

Wave 2A activated JRA automation. Wave 2B activates Banei automation using bounded monthly TOPICS archive discovery. JRA uses the official current all-news index `/news/index4.html`, fetches only bounded cancellation/change candidate articles, accepts explicit whole-meeting cancellation wording, binds venue/date to an existing canonical meeting, rejects race-only cancellations, and fails closed on negative-evidence fetch failure. Production evidence on 2026-09-21 showed that treating `/news/YYYYMM/` as the discovery index was invalid (zero candidate links and future-month 403), so that assumption has been removed. Banei scans official monthly TOPICS archive pages, fetches only cancellation-related candidate articles, accepts explicit whole-day or multi-day Banei cancellation wording, rejects partial-race stoppages and external-racing notices, binds evidence to existing canonical meetings, and fails closed when archive/article acquisition fails.

Wave 2C activates NAR using official JRA-net topic year indexes as a bounded positive-evidence route. The parser accepts only one of the 14 flat NAR venue names plus explicit whole-meeting `開催取り止め` / `開催中止` title and body evidence. Race-only notices, Banei notices, source omission, and acquisition failure cannot suppress a meeting. The route is deliberately non-exhaustive, so lack of a matching JRA-net topic always remains `absent_unconfirmed`.

Next, research KRA/TJK/SOREC/Chile/HRI/Peru for reliable authority-specific whole-meeting routes. Until one is demonstrated, they remain safe `unsupported`; no source disappearance may be used as a substitute.
