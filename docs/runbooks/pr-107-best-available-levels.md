# PR-107 — Best available timetable levels

PR-107 uses a data-depth model.

Final target: official all-race timetable rows.

But partial official data should still be kept and displayed at the correct level.

## Levels

- Level A: all race times are captured.
- Level B: first race time is captured.
- Level C: fixture date and racecourse are captured.
- Level D: official source is known, extraction still needed.
- Level E: legacy or no active racing.

## Promotion path

D -> C -> B -> A

Do not discard verified lower-level data.
Do not label lower-level data as Level A.

## User value

Users should see the best available data:

1. all race times
2. first race time
3. fixture date and racecourse
4. source/extraction-needed status

## Operations value

Maintainers can improve each country/system step by step without losing useful data.

Next work should add Level A records where official sources are easiest to verify first.
