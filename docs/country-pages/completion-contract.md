# Country detail page completion contract

Status: active programme contract  
Scope: all country and region detail pages  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`

## 1. Formal programme scope

The programme ends only when **All 98 countries and regions** listed in the
canonical tracker have completed reader-facing detail pages.

The scope is inherited from section 9 of the v0 specification and contains
seven non-overlapping groups:

| Scope group | Count | Intended treatment |
| --- | ---: | --- |
| `v0_candidate` | 27 | Timetable-capable or strong source-test candidates |
| `v0_1_candidate` | 29 | Calendar and official-link candidates requiring additional validation |
| `v0_2_candidate` | 16 | Long-tail entries that may begin with link-first coverage |
| `link_or_hold` | 13 | Link-first or held entries requiring cautious claims |
| `under_review_special` | 6 | Special racing formats or unresolved jurisdiction status |
| `exclusion_leaning` | 4 | Explanatory pages without an active-calendar claim unless verified |
| `archive` | 3 | Historical jurisdiction pages excluded from current calendar listings |

The arithmetic is fixed:

```text
27 + 29 + 16 + 13 + 6 + 4 + 3 = 98
```

The first delivery batch remains the already-reviewed sequence:

```text
01 United Arab Emirates
02 South Korea
03 Turkey
04 Morocco
05 Chile
06 Peru
07 Mexico
08 Brazil
09 Bahrain
10 Qatar
11 Oman
12 Zimbabwe
```

The remaining delivery order follows the formal specification groups while
excluding duplicates from the first batch.

## 2. What counts as one completed country page

One tracker row may be marked `published` only when all of the following are
true:

1. The canonical country or region identity and slug are fixed.
2. A reviewed profile contains only claims suitable for public use.
3. Separate natural-language **English and Japanese** page content exists.
4. Both language routes build and return the intended country page.
5. Country index and relevant racecourse or source links resolve.
6. The page distinguishes organisers from public distributors.
7. Time-sensitive claims have explicit review dates and revalidation rules.
8. Timetable output does not exceed the approved public display ceiling.
9. Empty or pending timetable data is not described as an absence of racing.
10. Canonical URL, language alternates, title and description are present.
11. Prohibited participant, betting, result and payout data is absent.
12. Formal QA has passed and `page_published_at` is recorded.

A reviewed research note is not a published country page.

Generated seed routes and reviewed seed profiles are useful foundations, but
they do not count as formally published until this contract's QA requirements
have passed.

Archive and exclusion-leaning entries still require detail pages. Their pages
must explain the verified status without presenting them as active current
calendar coverage.

## 3. Programme status values

The `programme_status` field is ordered as follows:

| Status | Meaning |
| --- | --- |
| `not_started` | No formal work has started under this programme |
| `source_research` | Official-source research or acquisition planning is active |
| `source_tested` | A public-safe source-test decision exists |
| `note_reviewed` | A reusable research note passed editorial review |
| `profile_ready` | Bilingual structured profile data is ready |
| `page_qa` | Both routes exist and formal page QA is underway |
| `published` | All completion conditions have passed |

A row may move forward only when the evidence needed by the next state exists.
A source-test failure or unreachable source does not prevent a link-first page;
it changes what the page may safely claim.

## 4. Acquisition status values

The `acquisition_status` field tracks where unavoidable local work remains:

| Status | Meaning |
| --- | --- |
| `not_started` | No acquisition attempt recorded |
| `remote_complete` | Remote research and tests produced a complete decision |
| `remote_partial` | Remote work produced useful but incomplete evidence |
| `local_required` | A narrowly scoped local capture is still required |
| `local_complete` | The required local capture was completed and reduced to public-safe findings |
| `pending_unreachable` | The candidate source was unreachable or unresolved |
| `not_applicable` | No timetable acquisition is required for the page treatment |

Raw local HTML, PDFs, screenshots, full text, participant data, betting data,
results and payouts remain outside the public repository. Only reviewed,
public-safe summaries and hashes may be handed into later work.

## 5. Date field definitions

Dates use ISO `YYYY-MM-DD`.

- `source_last_checked`: date on which the relevant public source or route was
  last checked. It is not the date printed on a future fixture.
- `evidence_reviewed_at`: date on which the evidence package or research note
  was reviewed for reuse.
- `tested_meeting_date`: date of the meeting used by a source test. This may be
  in the future when an official advance race card or programme is reviewed.
- `profile_last_reviewed`: date on which the bilingual structured country
  profile was last reviewed.
- `page_published_at`: date on which the country page passed the formal
  completion gate.

Review and publication dates must not be future dates. A future
`tested_meeting_date` must never be copied into `evidence_reviewed_at`.

The country-level tracker stores review and publication milestones. A
`tested_meeting_date` remains in the relevant source-test or evidence-handoff
record because it is meeting-level evidence and a country may have many tested
meetings. The tracker must not duplicate one selected meeting date as if it
were a country-wide milestone.

## 6. Route and QA states

`en_route_status` and `ja_route_status` use:

```text
missing
generated_seed
draft
complete
published
```

`generated_seed` means a route is generated from existing country data but has
not passed this programme's content and QA gate.

`qa_status` uses:

```text
not_started
pending
passed
```

## 7. Current baseline

At creation of this contract:

- 12 country notes are `note_reviewed`.
- Japan and Hong Kong are `profile_ready` legacy seeds pending formal QA.
- No row is counted as formally `published`.
- 84 rows remain `not_started`.
- The public site may already generate thin seed routes; those routes do not
  alter the formal completion count.

## 8. Update rules

Every PR that changes a country page must update the tracker in the same PR.

After each merge, the project report must state:

1. the full remaining PR schedule,
2. the current programme counts,
3. what changed in the merged PR,
4. which PR starts next.

A row must not be advanced merely because a route builds. Claims, bilingual
content, source boundaries and QA must all match this contract.
