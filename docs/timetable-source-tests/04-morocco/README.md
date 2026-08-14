# 04 - Morocco timetable source test

Status: pending / blocked
Checked date: 2026-08-14
Authority: Société Royale d'Encouragement du Cheval (SOREC)
Technical capability rank: Not confirmed
Fallback rank: Not confirmed

## Current decision

Morocco remains blocked for timetable candidate generation.

Do not assign A+, A, B+, B or C from this revalidation. The C value used by the shared authority-source inventory is a schema floor, not an active publication claim.

The current official SOREC racing page confirms the national racing context and racecourse set, but this pass did not verify a stable public official meeting-date or daily-programme URL that can support Calendar candidates.

## Revalidated on 2026-08-14

- SOREC official website is reachable.
- Current official racing page: `https://www.sorec.ma/courses-hippiques/`.
- The current official racing page states that SOREC organizes more than 3,000 races per year across seven racecourses, with seven meetings per week.
- The same page identifies the seven racecourses used by this source test:
  - Casablanca-Anfa
  - Meknès
  - Marrakech
  - Rabat
  - Settat
  - El Jadida
  - Khemisset
- A stable public official meeting-date / daily-programme route was not verified in this pass.
- No current or future meeting candidate is created from institutional or racecourse-directory content alone.

## Historical evidence retained

The 2026-06-10 source-test files remain useful as historical discovery evidence, including app/package and network observations. Those observations are not treated as newly revalidated by the 2026-08-14 pass.

## Unresolved

- Stable public official meeting source
- Official meeting-date and racecourse pairings
- Complete Race 1-N post times
- Distance and surface coverage
- A current public route suitable for a bounded SOREC timetable adapter

## Resume gate

Resume adapter work only after a public official source exposes at least concrete meeting-date + racecourse pairings.

If such a route is verified:

1. record the exact official source and a bounded fixture,
2. add a deterministic parser/validator,
3. generate candidate-only output,
4. require review before any Canonical or public projection change.

Until then, `adapter_status=blocked` and active-window candidate generation remains disabled.

## Public-safe boundary

Do not commit raw HTML, application packages, runners, horses, jockeys, trainers, odds, results, payouts, predictions, tips or full racecard text.

Source-test evidence in this directory must remain limited to public-safe summaries, URLs and bounded non-participant timetable facts.
