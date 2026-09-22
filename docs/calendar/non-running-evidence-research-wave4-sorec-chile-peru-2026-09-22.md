# Calendar non-running evidence research — Wave 4 SOREC / Chile / Peru — 2026-09-22

## Scope

This wave continues the meeting-presence hardening lane without blocking Calendar country expansion.

The acceptance rule is unchanged:

- source absence is never whole-meeting cancellation evidence;
- acquisition failure preserves verified state;
- only explicit official whole-meeting evidence may become `confirmed_non_running`;
- race-only cancellation never suppresses the whole meeting;
- rescheduled/replacement dates remain independent meetings.

The initial research note did not activate production negative-evidence automation. A same-day follow-up probe subsequently proved a bounded SOREC route. A later same-day follow-up also proved and activated a bounded Club Hípico de Santiago positive-evidence subset; Peru remains research-only.

## Morocco / SOREC

### Official status route proven

The SOREC Galop official racing calendar exposes a meeting-level **`Réunion reportée`** status and, critically, embeds the underlying status rows directly in the GET response as a JavaScript `joursEvenement` array.

Official route:

`https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?code=CALEN&description=Calendrier+courses&fctID=1406`

GitHub Actions probes in PR #1124 established all of the following:

- the status-bearing route is fetchable by GET with HTTP 200;
- the page exposes the `legende-report` / `Réunion reportée` legend;
- `joursEvenement` contains explicit `REPOR` rows, including concrete historical examples;
- the page's own `highlightCalendar` logic defines the calendar key as `day + (month + 10) + year`, so the original calendar date can be decoded without guessing;
- some dates contain both `REPOR` and another status such as `RESDE`, so `REPOR` cannot safely be consumed without sibling-status filtering;
- the AJAX `dateSelect` route can be blocked by the site's validation/captcha layer, therefore production does not depend on that POST path.

Representative discovery probe runs: `35693694595`, `35693789333`, `35693849455`, and `35693948003`. After #1125 merged, production refresh `35694598167` exposed that the earlier opaque `fctID` URL was not stable and returned HTTP 404. Follow-up PR #1126 / Actions run `35695280068` tested the site-menu URL and proved the full `code=CALEN&description=Calendrier+courses&fctID=1406` route returns HTTP 200 with `Réunion reportée`, `joursEvenement`, and calendar-key fingerprints. Production is pinned to that full route.

### Production acceptance boundary

SOREC automation is deliberately a bounded positive-evidence subset, not an exhaustive cancellation feed.

A calendar date may become `confirmed_non_running` only when all of these are true:

1. the official status-bearing calendar GET is fetched and its structural fingerprints parse successfully;
2. the decoded calendar date has exactly one status row and that row is `REPOR`;
3. the `REPOR` message contains a replacement date strictly later than the original calendar date;
4. the original date falls inside the requested rolling window;
5. exactly one existing SOREC canonical meeting exists on that original date;
6. the canonical `meeting_id` matches its existing `racecourse_id` and original date.

The replacement date and replacement venue text are evidence only. They are never used to generate or bind a replacement meeting. Replacement meetings remain independently acquired through official positive schedule evidence.

The following fail closed and emit no negative-evidence record:

- `REPOR` plus `RESDE` or any other sibling status on the same date;
- duplicate `REPOR` rows;
- missing replacement date;
- same-date or backwards replacement date;
- zero or multiple canonical meetings on the original date;
- source fetch failure;
- source fingerprint or parse failure.

Programme Réunion remains positive evidence only. Its omission remains `absent_unconfirmed`.

## Chile / Teletrak network

Chile production currently aggregates multiple venue programme sources under one Calendar system. A single cross-venue cancellation feed has not been proven.

### Official Valparaíso Sporting evidence

Valparaíso Sporting's official 2024 annual report provides explicit historical whole-meeting evidence:

`https://www.sporting.cl/sporting/site/artic/20180420/asocfile/20180420113133/memoria_2024_web.pdf`

The report records:

- 4 February: `REUNION TRASLADADA AL 17 DE MARZO, POR DEVASTADORES INCENDIOS EN VIÑA DEL MAR`
- 7 February: `REUNION SUSPENDIDA`

This proves that Valparaíso Sporting publishes authoritative whole-meeting moved/suspended semantics and that the original date and replacement date must remain distinct identities.

The same official site also exposes date-specific meeting/programme pages, but this wave did not prove that the current programme endpoint carries a machine-readable final cancellation/postponement status when a meeting is moved or suspended.

### Why Chile-wide coverage remained unsupported in Wave 4

The current registry row covers the broader Chile/Teletrak production system, not only Valparaíso Sporting. This wave did not prove equivalent stable current status routes for:

- Club Hípico de Santiago;
- Hipódromo Chile;
- Valparaíso Sporting in a rolling live endpoint;
- any other production venue routed through the current Chile collector.

A historical Valparaíso annual report is therefore enough to prove that explicit official evidence exists for that venue, but not enough to claim a complete or reliable Chile-wide negative-evidence route.

At the end of the original Wave 4 research Chile remained `unsupported/not_implemented`. That state was subsequently narrowed by the Club Hípico de Santiago follow-up below. Other Chile venues remain without a proven negative-evidence route.

The safe model is venue-by-venue discovery: reliable venues may be activated only as bounded positive-evidence subsets rather than as an exhaustive Chile cancellation feed.

## Peru / Hipódromo de Monterrico

### Official rule proves meeting suspension exists

The official Jockey Club del Perú / Hipódromo de Monterrico Rules of Racing explicitly authorize the stewards to suspend a meeting already in progress for force majeure, with authorization from the Director de Turno.

Official regulation reviewed:

`https://hipodromodemonterrico.com.pe/generales_pdf/monterrico/2023/06/reglamento_de_carreras_2020_20_06.pdf`

Relevant rule semantics:

- an individual race may be annulled;
- separately, an entire meeting already underway may be suspended for force majeure.

This distinction reinforces the WHR rule that race-level cancellation cannot be promoted to whole-meeting non-running.

### Current programme route remains positive evidence only

The official Monterrico site exposes programme/reunion pages under:

`https://hipodromodemonterrico.com.pe/carreras-proximos-programas`

These pages prove scheduled meeting identity and race programme data, but this wave did not find a stable official final-status field or official news endpoint that can be queried reliably for a whole-meeting cancellation/postponement.

The site's programme disappearance or date-API failure therefore remains insufficient negative evidence.

Peru remains `unsupported/not_implemented`.

A future Peru adapter must first pin an official final-status notice or meeting field. Until then:

- missing programme/date API result -> `absent_unconfirmed`;
- source/network failure -> preserve verified state;
- race annulment -> race-level only;
- explicit reviewed whole-meeting suspension notice, if found, may be entered through the reviewed presence path.

## Wave 4 result

SOREC gained a bounded automated positive-evidence route in Wave 4. Chile was still non-automated at that exact checkpoint and was subsequently narrowed by the Santiago-only follow-up; Peru remains non-automated.

The resulting state is:

- **SOREC:** automated/active only for safely filtered embedded `REPOR` rows with unique canonical binding; source absence and ambiguous/conflicting status remain non-running-unconfirmed.
- **Chile:** Wave 4 proved Valparaíso Sporting historical semantics but no rolling route. The later Club Hípico de Santiago follow-up activates only that venue's official-news positive-evidence subset; other venues remain uncovered.
- **Peru:** regulations distinguish race annulment from whole-meeting suspension, but no reliable live final-status route is yet proven.

All three systems remain safe on source absence:

`not found` != `confirmed_non_running`.


## Follow-up — Club Hípico de Santiago bounded route

Temporary diagnostic PR #1128 tested the official Corporativo archive from GitHub Actions and was closed without merge. Run `35716877495` completed successfully and proved:

- the Corporativo archive returns HTTP 200 and exposes bounded suspension/postponement/recalendarization candidates;
- the 2024-06-14 whole-meeting suspension article remains directly fetchable;
- the later recalendarization article explicitly refers back to the suspended 2024-06-14 meeting;
- the 2025-08-17 whole-meeting postponement article remains directly fetchable;
- the 2024-06-21 notice that stops only from race 11 onward is a partial-race negative fixture;
- the 2024-08-02 notice annulling only the last three races is a second partial-race negative fixture.

The production acceptance boundary is deliberately venue-specific. Only an official Club Hípico de Santiago article with explicit whole-meeting semantics, a resolvable original meeting date, and a unique existing Santiago canonical binding may emit `confirmed_non_running`. The replacement date, if stated, is retained only as evidence. Source failure, archive omission, partial-race notices, and all other Chile venues remain non-cancellation evidence.
