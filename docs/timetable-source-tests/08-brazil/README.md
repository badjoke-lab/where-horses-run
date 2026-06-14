# Brazil timetable source test

Status: Complete
Final technical rank: A+ (highest confirmed; mixed by racecourse and racing system)
Initial public display ceiling: A
Primary tested racecourses: Gávea, Cidade Jardim, Hipódromo do Cristal and Sorocaba

## Result

Brazil must be handled as a multi-source country. The tested authorities use separate official HTML pages, programme PDFs and meeting systems.

Four timed programme samples containing 39 timed races were confirmed, together with one untimed supplementary Arabian race at Cidade Jardim.

## Tested scope

| Racecourse | Racing system | Scope | Races | First post | Last post | Technical rank |
| --- | --- | --- | ---: | --- | --- | --- |
| Gávea | Thoroughbred | 2026-06-14 | 10 | 13:00 | 18:15 | A+ |
| Cidade Jardim | Thoroughbred | 2026-06-06 | 9 | 13:25 | 17:22 | A+ |
| Cidade Jardim | Arabian | 2026-06-06 supplementary race | 1 | — | — | C |
| Hipódromo do Cristal | Thoroughbred | 2026-06-11 | 7 | 15:58 | 19:05 | A |
| Sorocaba | Quarter Horse | 2026-06 programme | 13 | 08:00 | 13:10 | A+ |

Tarumã remains pending because the tested official candidate page returned HTTP 403 and no stable programme source was confirmed.

## Source findings

### Gávea

The official Jockey Club Brasileiro meeting system supplied ten contiguous race labels and post times, together with race names, distances and surface labels.

### Cidade Jardim

The official Jockey Club de São Paulo programme PDF supplied nine Thoroughbred races with complete post times, names, distances and surface labels.

A separate Arabian supplementary race was present, but its post time was not confirmed. It is recorded separately at rank C and must not be merged into the Thoroughbred timetable.

### Hipódromo do Cristal

The official programme supplied seven contiguous race labels and post times. Race names were partially confirmed, but consistent distance and surface fields were not confirmed. The technical rank is therefore A.

### Sorocaba

The official programme page linked to a current Quarter Horse programme containing thirteen contiguous race labels and post times, with race names and distances.

The exact meeting date was not captured in this public-safe summary and must be resolved before production ingestion.

## Publication boundary

This test confirms technical source capability only.

Brazil must initially use a public display ceiling of A until each authority and racing system receives a separate A+ publication review.

Thoroughbred, Arabian and Quarter Horse records must remain separately labelled.

Do not publish horse names, jockey names, trainer names, weights, odds, betting details, results, payouts, full racecard contents, raw programme text, raw HTML or raw PDF text.

## Local-only raw files

Downloaded HTML, PDFs, extracted text and exploratory snippets remain under `.whr-local-source-tests/08-brazil/` and must not be committed.
