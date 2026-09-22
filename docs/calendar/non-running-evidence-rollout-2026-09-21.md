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
| Turkey / TJK | reviewed | candidate | supported | Official TJK news contains explicit domestic whole-meeting postponement/cancellation notices. A bounded all-races parser is validated, but automated discovery remains disabled because live Haberler requests timed out from GitHub Actions. |
| Morocco / SOREC | automated | active | supported positive-evidence subset | Official status-bearing calendar GET embeds `joursEvenement`; only unambiguous `REPOR`-only dates with a strictly later replacement date and one canonical meeting binding are accepted. |
| Chile / Teletrak network | automated | active | supported positive-evidence subset | Club Hípico de Santiago official Corporativo news is scanned as a bounded Santiago-only route; partial-race notices and all other Chile venues remain non-negative-evidence unless separately proven. |
| Ireland / HRI | unsupported | not implemented | not proven | HRI handles abandoned/rescheduled meetings, but current WHR routes do not yet prove a bounded status parser. |
| Peru / Monterrico | unsupported | not implemented | not proven | Date/programme API is positive evidence; failed/empty discovery is never cancellation evidence. |

This leaves zero production countries unclassified.

## Proven official examples

- JRA: official 2026-09-21 Nakayama cancellation / substitute-date notice.
- Banei Tokachi: official notice cancelling the 2025-05-10 through 2025-05-12 Banei meetings.
- NAR: official JRA-net notices explicitly cancel Kanazawa on 2025-08-26 and 2025-09-02, Monbetsu on 2025-07-30, and Saga on 2024-08-29; the Saga notice separately states which races were moved and that the rest had no substitute meeting.
- HKJC: September 2026 official fixture page states that the Sha Tin meeting originally scheduled for 20 September 2026 will be cancelled.
- ERA: official 2026-03-04 Meydan racecard/declarations page renders `THIS MEETING HAS BEEN CANCELLED`.
- TJK: official 2026-03-21 Adana postponement notice states that the original Adana meeting's full programme was postponed to 2026-03-23; older TJK notices likewise explicitly postpone all races at a named domestic venue.
- SOREC: the official calendar GET embeds explicit `REPOR` status rows and the source JavaScript's calendar-key formula. PR #1124 live probes also proved that conflicting `RESDE` + `REPOR` dates exist, which is why production accepts only `REPOR`-only dates with a later replacement date and unique canonical binding. Production refresh `35694598167` then exposed the earlier opaque `fctID` URL as unstable (HTTP 404); PR #1126 / run `35695280068` proved the stable full menu route `code=CALEN&description=Calendrier+courses&fctID=1406`, which is the route production must use.
- Chile / Club Hípico de Santiago: diagnostic PR #1128 run `35716877495` proved the official Corporativo archive and five bounded evidence/negative-fixture articles are fetchable from GitHub Actions. Whole-meeting suspension on 2024-06-14, its later recalendarization, and whole-meeting postponement on 2025-08-17 are accepted fixtures; the 2024-06-21 race-11-onward stoppage and 2024-08-02 last-three-races annulment are explicit partial-race rejection fixtures.

These examples prove that official explicit negative evidence exists. HKJC, ERA, JRA, Banei, NAR, SOREC and the bounded Chile/Club Hípico de Santiago subset now have parser/discovery paths, identity binding, rolling-artifact emission, durable generated presence persistence, and publication integration, so their registry rows are `automated`. NAR, SOREC and Chile are explicitly auxiliary positive-evidence subsets rather than exhaustive nationwide/system-wide cancellation feeds.

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

Wave 3 establishes TJK as `reviewed/candidate`: official TJK articles prove whole-meeting postponement, the parser requires a known domestic venue plus explicit `tüm koşular` body wording, and race-only/foreign notices are rejected. Two live discovery approaches were tested from GitHub Actions in PR #1110 — date/subject-filtered Haberler and the unfiltered current Haberler page — and both timed out at the source boundary. Therefore no production poller is activated; reviewed evidence remains the safe route and source absence stays `absent_unconfirmed`.

Next, continue research on KRA/HRI/Peru and on Chile venues other than Club Hípico de Santiago for reliable authority-specific whole-meeting routes. Unproven venues/systems remain safe on `absent_unconfirmed`; no source disappearance may be used as a substitute.


## Wave 4 — SOREC activation / Chile / Peru research

Wave 4 follow-up activated only the safely bounded SOREC subset.

- SOREC: PR #1124 proved that the official status-bearing calendar GET embeds concrete `REPOR` rows and the JavaScript key semantics required to decode their original calendar dates. Production accepts only dates whose entire status group is a single `REPOR`, whose message carries a strictly later replacement date, and whose original date binds to exactly one existing SOREC canonical meeting. Conflicting status, duplicate status, missing/same/backward replacement date, ambiguous binding, fetch failure and parse failure all emit no negative evidence.
- Chile: Valparaíso Sporting's official 2024 report explicitly records a 4 February meeting moved to 17 March and a 7 February meeting suspended. That proves venue-level official whole-meeting evidence exists, but the production Chile system spans multiple venue sources, so no Chile-wide/current automated route is claimed.
- Peru: the official Jockey Club del Perú racing rules distinguish individual-race annulment from force-majeure suspension of an entire meeting already underway. No live final-status publication route is yet proven, so Monterrico programme/API absence remains `absent_unconfirmed`.

The next implementation research targets are current venue-level Chile final-status discovery, a Monterrico/JCP final-status notice route if one exists, and continued KRA/HRI route discovery.


## Wave 5 — bounded Chile / Club Hípico de Santiago activation

PR #1128 was a temporary unmerged diagnostic. GitHub Actions run `35716877495` proved that the official Club Hípico de Santiago Corporativo archive is reachable, discovers cancellation/postponement candidates, and that the bounded historical evidence fixtures remain directly fetchable.

Production activates only the Santiago subset:

- archive discovery is restricted to official `clubhipico.cl` Corporativo/news URLs;
- article text must explicitly describe whole-meeting suspension, postponement, cancellation/annulment, or recalendarization;
- the original meeting date must be resolved from the article, fall inside the requested rolling window, and bind to exactly one existing canonical Club Hípico de Santiago meeting;
- notices that start from a stated race ordinal or cancel only the first/last races are rejected before whole-meeting classification;
- replacement dates are evidence only and never create a replacement meeting;
- archive/article failure or omission emits no negative evidence;
- Hipódromo Chile, Valparaíso Sporting and Club Hípico de Concepción are not claimed as covered by this route.

This is a bounded positive-evidence subset, not a Chile-wide cancellation feed.
