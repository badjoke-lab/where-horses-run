# Chile Teletrak programme enrichment

Status: implemented on production acquisition branch  
System: `chile-teletrak-racing-system`  
Technical capability: `A`

## Route

1. Teletrak weekly domestic meeting cards remain the schedule/discovery source.
2. The collector follows only real `Descargar programa` hrefs emitted by Teletrak for the matching date and racecourse.
3. Linked official programme PDF/HTML is fetched and parsed using racecourse-specific race-header patterns.
4. Complete ordered post-time rows produce evidence-derived `A`.
5. If Teletrak has not yet published a programme href, the valid meeting observation remains `C` with `detail_observation.status = not_published`.
6. If a published programme cannot be fetched or safely parsed, the valid meeting observation remains `C` with `detail_observation.status = source_error`.
7. Programme time rows alone do not satisfy the A+ field contract and must never be promoted to `A+`.

## Verified live evidence — 2026-09-11

GitHub Actions followed the real Teletrak hrefs for:

- Hipódromo Chile, 2026-09-10 → `storage.elturf.com` official programme PDF.
- Club Hípico de Santiago, 2026-09-11 → `static.clubhipico.cl` official programme PDF.

Both documents returned complete race-header post times and are used to live-verify the production runner before merge. Venue URLs are not guessed.

## Completion semantics

A lower rank is not proof of acquisition completion. Each source-visible Teletrak meeting is evaluated for a linked official programme on the regular unified refresh route. `not_published` means lifecycle re-evaluation is required; `source_error` means acquisition retry is required; successfully parsed complete programme rows reach the registered technical ceiling `A`.
