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
| Japan / JRA | reviewed | candidate | supported | Explicit JRA News cancellation/substitute-date notices are proven. Current production acceptance is reviewed. |
| Japan / NAR | unsupported | not implemented | not proven | Local organizers publish their own notices; no nationwide normalized route is proven. |
| Japan / Banei | reviewed | candidate | supported | Official Banei TOPICS contains explicit whole-meeting cancellation notices and race-only stoppages. |
| Hong Kong / HKJC | reviewed | candidate | supported | Official fixture page can explicitly state that a dated meeting will be cancelled. |
| UAE / ERA | reviewed | candidate | supported | Official racecard/declarations page can explicitly render `THIS MEETING HAS BEEN CANCELLED`. |
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

These examples prove that official explicit negative evidence exists. They do not by themselves authorize automation. Parser fixtures, identity binding, and production integration are required before a registry row can become `automated`.

## Safety invariant for every system

- acquisition failure -> preserve verified canonical/public state;
- successful source omission without accepted explicit negative evidence -> `absent_unconfirmed`;
- only accepted whole-meeting official evidence -> `confirmed_non_running`;
- partial race cancellation must never suppress the whole meeting;
- replacement dates are independently acquired meetings;
- canonical evidence survives public non-running suppression.

## Next implementation order

Wave 1B should automate the two lowest-risk same-source candidates first:

1. HKJC fixture cancellation sentence on the already-collected monthly fixture page;
2. ERA `THIS MEETING HAS BEEN CANCELLED` on the already-collected racecard/declarations family.

JRA and Banei remain reviewed until bounded notice parsers are implemented. NAR/KRA/TJK/SOREC/Chile/HRI/Peru remain safe `unsupported` until a reliable official route is demonstrated; no source disappearance may be used as a substitute.
