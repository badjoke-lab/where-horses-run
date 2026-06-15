# Brazil

## Metadata

| Field | Value |
| --- | --- |
| Country | Brazil |
| Slug | brazil |
| Note status | draft |
| Evidence cutoff | 2026-06-14 |
| Source-test status | Complete |
| Technical rank | A+ highest confirmed; mixed by racecourse and racing system |
| Public display ceiling | A |
| Source-test directory | `docs/timetable-source-tests/08-brazil/` |
| Revalidation trigger | Before final page publication and separately for each authority, racecourse and racing system |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed source test
- `[OBSERVED]`: seen in the bounded racecourse samples
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during final page production

## Page-ready verified facts

- [VERIFIED] Brazil must be treated as a multi-source country.
- [VERIFIED] The reviewed authorities used separate official HTML pages, programme PDFs and meeting systems.
- [VERIFIED] Confirmed samples covered Gávea, Cidade Jardim, Hipódromo do Cristal and Sorocaba.
- [VERIFIED] Four timed programme samples contained 39 timed races.
- [VERIFIED] One separate untimed Arabian supplementary race was observed at Cidade Jardim.
- [VERIFIED] The highest confirmed technical rank was A+, while the initial public display ceiling is A.

## Racing structure

- [VERIFIED] The reviewed evidence is divided among multiple racecourse-specific Jockey Clubs.
- [VERIFIED] Technical capability varies by racecourse and racing system.
- [VERIFIED] Thoroughbred, Arabian and Quarter Horse records must remain separately labelled.
- [INFERRED] A single national parser or one uniform source description would obscure important operational differences.
- [NEEDS_RESEARCH] Confirm the wider national regulatory and federation structure.

## Governing and organising bodies

- [VERIFIED] Jockey Club Brasileiro was the tested authority for Gávea.
- [VERIFIED] Jockey Club de São Paulo was the tested authority for Cidade Jardim.
- [VERIFIED] Jockey Club do Rio Grande do Sul was the tested authority for Hipódromo do Cristal.
- [VERIFIED] Jockey Club de Sorocaba was the tested authority for Sorocaba.
- [OBSERVED] Jockey Club do Paraná was the official source candidate for Tarumã, but remained unresolved.
- [NEEDS_RESEARCH] Confirm the current national regulator and relationships among these organisations.

## Racecourses observed

### Confirmed programme samples

- [VERIFIED] Gávea
- [VERIFIED] Cidade Jardim
- [VERIFIED] Hipódromo do Cristal
- [VERIFIED] Sorocaba

### Pending official source

- [OBSERVED] Tarumã

The completed test does not prove that these five entries form the complete
current Brazilian racecourse inventory.

## Racing codes observed

- [VERIFIED] Thoroughbred
- [VERIFIED] Arabian
- [VERIFIED] Quarter Horse
- [VERIFIED] The Arabian supplementary race at Cidade Jardim must not be merged into the Thoroughbred timetable.

## Seasonality and meeting pattern

- [OBSERVED] Dated samples covered 2026-06-06, 2026-06-11 and 2026-06-14.
- [OBSERVED] The Sorocaba sample was identified only as a June 2026 programme; its exact meeting date remained unresolved.
- [VERIFIED] The samples do not establish annual national or racecourse-specific meeting patterns.
- [NEEDS_RESEARCH] Confirm calendars and seasonal operation separately for each racing system.

## How racing information is distributed

- [VERIFIED] Gávea used an official Jockey Club Brasileiro meeting system.
- [VERIFIED] Cidade Jardim used an official Jockey Club de São Paulo programme PDF.
- [VERIFIED] Hipódromo do Cristal used an official racecourse programme.
- [VERIFIED] Sorocaba used an official programme page and linked programme.
- [OBSERVED] Tarumã's tested official candidate returned HTTP 403.
- [INFERRED] Brazil requires authority-specific acquisition and revalidation.

## Programme and racecard format

- [VERIFIED] Gávea supplied complete times, names, distances and surface labels at A+.
- [VERIFIED] Cidade Jardim Thoroughbred supplied complete times, names, distances and surfaces at A+.
- [VERIFIED] The separate Cidade Jardim Arabian race had no confirmed post time and remained C.
- [VERIFIED] Hipódromo do Cristal supplied complete race labels and times but incomplete distance and surface coverage, producing rank A.
- [VERIFIED] Sorocaba supplied complete Quarter Horse times, names and distances at A+, but its exact meeting date remained unresolved.
- [VERIFIED] Initial public display must remain at or below rank A.

## Current source landscape

### Current confirmed sources

- [VERIFIED] Jockey Club Brasileiro meeting pages
- [VERIFIED] Jockey Club de São Paulo programme PDFs
- [VERIFIED] Jockey Club do Rio Grande do Sul programme pages
- [VERIFIED] Jockey Club de Sorocaba programme pages

### Pending

- [OBSERVED] Jockey Club do Paraná / Tarumã candidate returned HTTP 403 and no stable programme source was confirmed.

### Supplementary

- [VERIFIED] Separate scope records are needed for different racing systems at the same racecourse.

## Operational observations

- [OBSERVED] Source format and field completeness varied materially among the four confirmed racecourses.
- [OBSERVED] One racecourse contained both Thoroughbred and separate Arabian evidence.
- [INFERRED] Production ingestion should use racecourse-and-system-specific adapters rather than one Brazil-wide parser.

## Limitations and cautions

- [VERIFIED] Highest rank A+ does not mean every tested Brazilian source is A+.
- [VERIFIED] Hipódromo do Cristal was confirmed only at A.
- [VERIFIED] The Cidade Jardim Arabian supplementary race was confirmed only at C.
- [VERIFIED] Sorocaba must not be ingested until its exact meeting date is resolved.
- [VERIFIED] Tarumã remains Pending; HTTP 403 is not evidence that racing stopped.
- [VERIFIED] Four confirmed racecourses do not establish complete national coverage.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] Brazil has one national timetable source.
- [NEEDS_RESEARCH] All Brazilian racecourses support A+ data.
- [NEEDS_RESEARCH] The four confirmed racecourses form the complete active list.
- [NEEDS_RESEARCH] Tarumã is inactive.
- [NEEDS_RESEARCH] Thoroughbred, Arabian and Quarter Horse records can be merged without separate labels.
- [INFERRED] Brazil's public information system is structurally distributed, but the national institutional hierarchy requires fresh research.

## Fresh research required

- [NEEDS_RESEARCH] national regulator and federation structure
- [NEEDS_RESEARCH] complete active racecourse inventory
- [NEEDS_RESEARCH] current status and programme route for Tarumã
- [NEEDS_RESEARCH] exact date for the reviewed Sorocaba programme
- [NEEDS_RESEARCH] annual calendars by authority and racing system
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races by racing system
- [NEEDS_RESEARCH] breeding and ownership context
- [NEEDS_RESEARCH] cultural and spectator context
- [NEEDS_RESEARCH] current official source links

## Source-test references

- `docs/timetable-source-tests/08-brazil/README.md`
- `docs/timetable-source-tests/08-brazil/final-summary.json`
- `docs/timetable-source-tests/08-brazil/tested-scope.tsv`
- `docs/timetable-source-tests/08-brazil/field-availability.tsv`

## Editorial handoff

When the final country page is written:

1. treat Brazil as a multi-source and multi-system country
2. recheck every authority and racecourse separately
3. preserve Thoroughbred, Arabian and Quarter Horse labels
4. resolve Sorocaba's exact meeting date before production use
5. retry Tarumã without interpreting HTTP 403 as cessation
6. keep the default public display ceiling at A
7. write separate natural English and Japanese copy
8. exclude participant, betting, result, raw programme and direct-stream data
