# Calendar non-running evidence research — Wave 4 SOREC / Chile / Peru — 2026-09-22

## Scope

This wave continues the meeting-presence hardening lane without blocking Calendar country expansion.

The acceptance rule is unchanged:

- source absence is never whole-meeting cancellation evidence;
- acquisition failure preserves verified state;
- only explicit official whole-meeting evidence may become `confirmed_non_running`;
- race-only cancellation never suppresses the whole meeting;
- rescheduled/replacement dates remain independent meetings.

No production negative-evidence automation is activated by this research note.

## Morocco / SOREC

### Official route found

The SOREC Galop official racing calendar exposes an explicit status legend containing:

- `Engagement ouvert`
- `Forfait`
- `Engagement supplémentaire`
- `Partant définitif`
- `Résultat définitif`
- **`Réunion reportée`**
- `Prochaine réunion`

Official route reviewed:

`https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?fctID=2nQEdyraO%2Bg%3D`

This is important because `Réunion reportée` is a meeting-level postponement status from the same official SOREC racing system, rather than an inference from a missing programme.

### Why production remains unsupported

The current WHR SOREC runner uses:

`https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf`

for positive meeting discovery.

This wave proved that the separate official calendar has a semantic meeting-postponed state, but it did **not** yet pin:

1. the HTML/component field or class carrying that state on a concrete meeting row;
2. a concrete official meeting/date example that can be preserved as a regression fixture;
3. a stable fetch path from GitHub Actions for the status-bearing calendar;
4. the exact mapping from a reported original meeting to any later replacement meeting.

Therefore Morocco remains `unsupported/not_implemented` for production negative evidence, but the next implementation target is no longer unknown: it is the SOREC Galop calendar's explicit `Réunion reportée` state.

### Live GitHub Actions follow-up

A dedicated unmerged diagnostic PR (#1116) tested the calendar route from GitHub Actions after this research note was first written.

Observed results:

- run `35686803050` fetched the exact calendar route with HTTP 200, returned about 209 KB of HTML, exposed the `Réunion reportée` legend, a JSF `ViewState`, and the inline PrimeFaces calendar;
- the calendar binds `dateSelect` to a PrimeFaces AJAX update of `form:panelRacine form:panelInfosUser form:idData`;
- artifact `10676444197` preserves bounded diagnostics for that successful static route probe;
- run `35687257484` showed that additional same-run calendar/session GETs were unstable from GitHub Actions even with bounded retry; artifact `10677276873`;
- run `35687318016` reused the initial successful calendar session and attempted one `dateSelect` POST for an officially observed positive meeting date, but the POST still failed at the fetch/socket layer; artifact `10677203370`.

The probe therefore did **not** capture a concrete postponed meeting response or stable status-bearing AJAX payload. PR #1116 was closed without merge.

This strengthens, rather than relaxes, the safety boundary:

- the legend proves that SOREC has a meeting-level postponed state in its own system;
- the legend by itself is not meeting-specific negative evidence;
- a failed JSF request is acquisition failure, not `confirmed_non_running`;
- a missing Programme Réunion row remains `absent_unconfirmed`;
- production SOREC negative-evidence automation remains disabled.

A future SOREC adapter may activate only after a concrete row is captured and the parser proves that:

- only `Réunion reportée` (or another explicit whole-meeting final status) becomes `confirmed_non_running`;
- ordinary programme omission remains `absent_unconfirmed`;
- replacement meetings are acquired independently;
- source failure preserves verified state.

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

### Why Chile remains unsupported

The current registry row covers the broader Chile/Teletrak production system, not only Valparaíso Sporting. This wave did not prove equivalent stable current status routes for:

- Club Hípico de Santiago;
- Hipódromo Chile;
- Valparaíso Sporting in a rolling live endpoint;
- any other production venue routed through the current Chile collector.

A historical Valparaíso annual report is therefore enough to prove that explicit official evidence exists for that venue, but not enough to claim a complete or reliable Chile-wide negative-evidence route.

Chile remains `unsupported/not_implemented`.

The next safe step is venue-by-venue discovery. If only some venues expose reliable explicit final status, they should be treated as bounded positive-evidence subsets rather than as an exhaustive Chile cancellation feed.

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

No unsafe automation was added.

The research materially narrows the next targets:

- **SOREC:** explicit official `Réunion reportée` calendar state exists; capture a concrete meeting row and stable status field.
- **Chile:** Valparaíso Sporting official evidence proves moved/suspended meetings; find rolling venue-specific final-status routes before any automation.
- **Peru:** regulations distinguish race annulment from whole-meeting suspension, but no reliable live final-status route is yet proven.

All three systems remain safe on source absence:

`not found` != `confirmed_non_running`.
