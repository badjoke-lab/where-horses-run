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
| Japan / JRA | automated | active | supported | Official monthly JRA News indexes are scanned for bounded cancellation-related articles; only explicit whole-meeting wording is accepted and race-only cancellations are rejected. |
| Japan / NAR | unsupported | not implemented | not proven | Local organizers publish their own notices; no nationwide normalized route is proven. |
| Japan / Banei | reviewed | candidate | supported | Official Banei TOPICS contains explicit whole-meeting cancellation notices and race-only stoppages. |
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
- HKJC: September 2026 official fixture page states that the Sha Tin meeting originally scheduled for 20 September 2026 will be cancelled.
- ERA: official 2026-03-04 Meydan racecard/declarations page renders `THIS MEETING HAS BEEN CANCELLED`.

These examples prove that official explicit negative evidence exists. HKJC and ERA now additionally have bounded parser tests, identity binding, rolling-artifact emission, durable generated presence persistence, and publication integration, so their registry rows are `automated`. JRA and Banei remain reviewed.

## Safety invariant for every system

- acquisition failure -> preserve verified canonical/public state;
- successful source omission without accepted explicit negative evidence -> `absent_unconfirmed`;
- only accepted whole-meeting official evidence -> `confirmed_non_running`;
- partial race cancellation must never suppress the whole meeting;
- replacement dates are independently acquired meetings;
- canonical evidence survives public non-running suppression.

## Next implementation order

Wave 1B completed the two lowest-risk same-source candidates: HKJC and ERA.

Wave 2A now activates JRA automation and bounds Banei parsing. JRA uses the official monthly `/news/YYYYMM/` index as its discovery route, fetches only cancellation-related candidate articles, accepts explicit whole-meeting cancellation wording, binds venue/date to an existing canonical meeting, rejects race-only cancellations, and fails closed if the negative-evidence route cannot be fetched. Banei parsing requires an official `tp_detail.php` article, accepts explicit whole-day or multi-day Banei cancellation wording, and rejects partial-race stoppages and notices about external racing. Banei remains `reviewed` until stable TOPICS discovery is activated.

In parallel, research NAR/KRA/TJK/SOREC/Chile/HRI/Peru for a reliable authority-specific whole-meeting route. Until one is demonstrated, they remain safe `unsupported`; no source disappearance may be used as a substitute.
