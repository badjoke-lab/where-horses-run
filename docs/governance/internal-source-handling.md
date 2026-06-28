# Internal source handling boundary

Status: active canonical public-repository boundary  
Last reviewed: 2026-06-28

## Rule

Raw or detailed source acquisition material remains local or otherwise internal. The public repository stores only reviewed, public-safe derived summaries and implementation contracts.

## Keep local or internal

- raw HTML, JavaScript, PDF bodies, API response bodies, screenshots, and complete source captures;
- complete programmes or racecards;
- horses, runners, jockeys, trainers, weights, gates, odds, results, payouts, predictions, and betting data;
- credentials, cookies, tokens, login details, restricted endpoints, bypass instructions, and private workflow notes;
- source-specific publication-risk assessments marked internal.

Local material may be stored under `.whr-local-source-tests/` or another approved non-repository location. It must not enter the public build, Git history, release artifacts, or public workflow logs.

## Allowed in the public repository

- official source URLs and source roles;
- HTTP status, content type, hashes, file size, and structural metadata;
- tested dates, racecourses, meeting counts, race counts, and field-availability counts;
- Technical Rank, Public Ceiling, automation/readiness/fallback decisions, and limitations;
- public-safe TSV/JSON summaries that omit raw bodies and prohibited fields;
- references to local-only paths when they reveal no restricted content;
- validators and adapters that emit only public-safe candidates.

## Publication boundary

Acquisition capability and public display permission are separate.

- C: meeting date and racecourse.
- B: first-race time.
- B+: first and last race times.
- A: race label or number and post time.
- A+: selected programme-summary fields on a separate meeting detail page only.

A+ is controlled medium-risk output. Race name, distance, surface, and course are independently switchable. Unknown or disputed fields are hidden. S-level information is internal by default. NG information is neither displayed nor retained in public-output datasets.

List pages always remain one meeting per row. Complete official information remains on the official source.

## Handoff rule

When local research is used in repository work:

1. inspect the local material without committing it;
2. create or update a public-safe final summary;
3. record only the fields needed by Source Test v2 and Calendar Readiness;
4. validate that prohibited or raw fields are absent;
5. retain the raw evidence locally for future revalidation;
6. publish only after the normal candidate, review, and promotion gates.

## ZIP and backup handling

A ZIP of source-test summaries is an input backup, not a repository artifact. Compare its public-safe files with repository summaries, use missing decisions as research input, and do not commit the ZIP itself. Any referenced raw capture remains local-only.
