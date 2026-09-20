# Calendar authority evidence metadata contract

Status: active canonical contract

Work ID: `WHR-CAL-AUTHORITY-MIGRATION-WAVE-1`

Last reviewed: 2026-09-20

## Purpose

This contract adds the minimum durable vocabulary needed to migrate Calendar acquisition, canonical acceptance, publication, and consumers without changing current public meeting facts.

The machine-readable definitions are:

```text
data/static/calendar-authority-metadata-v1.schema.json
src/lib/timetable/authorityTypes.ts
scripts/timetable/calendar-authority-metadata.mjs
```

All new record-level properties are optional. Their absence means unknown legacy state. Existing values must not be inferred from `last_checked_date`, `generated_at`, source dates, or review dates merely to populate them.

## Semantic separation

```text
canonical evidence rank
!= acquisition attempt result
!= acquisition disposition
!= publication snapshot generation
```

- Best Available rank describes currently valid accepted meeting evidence.
- `acquisition_attempt` describes the latest represented attempt or cycle event. A failed attempt may coexist with retained A or A+ evidence.
- `acquisition_completion` reuses the six dispositions defined by the acquisition-completion contract. It does not redefine rank.
- `evidence_support` attributes accepted field groups to the evidence that supports them.
- `evidence_changes` represents explicit correction, withdrawal, or invalidation evidence. Wave 1 stores this meaning but does not apply destructive changes.
- `publication_snapshot` correlates one generated public meeting list and detail artifact. Its generation time is not evidence-verification time.

Acquisition failure does not invalidate accepted evidence. Only later canonical-authority work may apply an explicit correction/invalidation under the agreed update contract.

Meeting-targeted attempts use `acquisition_attempt`. Source-wide or batch failures that cannot be attributed to a meeting remain in the existing Coverage Observation / collection-result representation; Wave 1 does not fabricate meeting records for them.

## Added and reused representation

| Representation | Semantic meaning | Producer | Later consumer | Legacy behavior | Why existing fields are insufficient |
| --- | --- | --- | --- | --- | --- |
| `acquisition_attempt` | Current represented attempt time, result, route/source, and optional error | Authority-specific evidence producer or acquisition coordinator | Acquisition authority and operational diagnostics | Optional; absent remains unknown | `freshness.last_checked_date` does not distinguish an attempt from successful verification and has day-only precision |
| `acquisition_completion` | Current cycle disposition using `promoted`, `complete_current_best_available`, `pending_publication`, `retry_required`, `implementation_gap`, or `not_applicable` | Shared acquisition authority | Retry/operations consumers | Existing objects remain valid; absent remains unknown | Rank describes evidence, not whether acquisition work completed |
| `evidence_support` | Current supporting provenance by independent field group | Canonical acceptance authority | Rank, publication, and canonical diagnostics | Optional; no backfill from legacy `source_trace` | One record-level `source_trace` cannot preserve old provenance for retained fields when another field receives newer evidence |
| `evidence_support.race_overrides` | Race-label-specific provenance exceptions for race-value groups | Canonical acceptance authority | Rank, publication, and canonical diagnostics | Optional; group provenance remains the default | A correction to one race must not assign its new provenance to retained values for every other race |
| `evidence_support.*.successfully_verified_at` | Time the supporting evidence was successfully verified | Canonical acceptance authority from successful evidence | Freshness diagnostics | Nullable or absent; failures never advance it | `generated_at` and attempt time can advance without successful verification |
| `evidence_support.*.review` | Reviewer, review time, and optional evidence reference for reviewed evidence | Reviewed evidence producer, accepted by canonical authority | Audit and canonical diagnostics | Required only when a new provenance entry declares `acquisition_method: reviewed`; legacy review metadata is not copied | Candidate envelope review state alone does not retain the provenance of a specific accepted field group |
| `evidence_changes` | Explicit target, action, reason/type, and supporting provenance for correction, withdrawal, or invalidation | Official or reviewed evidence producer | Canonical acceptance authority in a later wave | Optional; absence is not evidence of no correction | `official_correction: true` has no durable target, reason, or evidence identity |
| `publication_snapshot` | Content-addressed identity shared by the generated public list/detail pair | Coordinated refresh/build writer | Runtime/public diagnostics and structured-data consumers in later waves | Legacy artifacts may omit it; a pair is stamped only after its exact content is known | Dataset `generated_at` alone neither binds the two files nor detects a mismatched pair |

`source_trace` and `freshness` remain readable compatibility fields during migration. They must not be treated as substitutes for missing granular evidence provenance or missing attempt/verification times.

## Evidence granularity

`evidence_support` uses the smallest field groups needed to prevent unrelated provenance replacement:

```text
meeting_identity
meeting_date
race_times
timetable
race_names
distances
surfaces
courses
```

The group entry is the default provenance. Optional `race_overrides` entries use the existing timetable row label as the bounded race identity and replace that default only for the named race and group. An override may exist without a group default. Overrides are limited to `race_times`, `race_names`, `distances`, `surfaces`, and `courses`; meeting identity and date remain meeting-level.

`timetable` supports the current race-row set, composition, order, and labels. `race_times` supports the individual `post_time_local` values. They are distinct even when the same official document supports both.

This is current supporting provenance with minimal exceptions, not an event history. Wave 1 does not create per-race history, global race identifiers, or an event-sourcing database.

## Correction and invalidation representation

Every represented change includes:

- a meeting and target scope;
- an action: `correct`, `withdraw`, or `invalidate`;
- a reason type and human-readable reason;
- supporting evidence provenance;
- review provenance when the supporting evidence is reviewed.

Recording a change does not apply it in Wave 1. Reviewed evidence must pass through the same future canonical, rank, and publication authorities as automated evidence; review metadata is not a bypass.

## Time semantics

- `acquisition_attempt.attempted_at`: acquisition health and recency of the attempt.
- `evidence_support.*.observed_at`: source observation time when known.
- `evidence_support.*.successfully_verified_at`: freshness of accepted supporting evidence.
- `evidence_support.*.review.reviewed_at`: time a human review was completed.
- `publication_snapshot.generated_at`: logical generation timestamp associated with the correlated public pair, normally the `generated_at` selected by that writer. It need not be the wall-clock instant when the snapshot property was attached.
- legacy `freshness.last_checked_date`: compatibility field with historical mixed meaning; it is not copied into any of the fields above.

Unknown historical times remain unknown. In particular, a failed attempt may update `attempted_at` without changing any `successfully_verified_at` value.

## Publication snapshot

The snapshot ID is a SHA-256 digest of both public datasets excluding their `publication_snapshot` properties. The same metadata object is written to both artifacts. A content change to either artifact invalidates the pair until a coordinated writer computes a new snapshot.

Snapshot identity asserts only that the two stored public artifacts form one exact result. It does not assert source freshness, acquisition success, canonical correctness, or historical guarantees for unstamped artifacts.

The snapshot generation timestamp remains distinct from acquisition-attempt, source-observation, successful-verification, and review times.

## Wave 1 boundary

Wave 1 adds and preserves representation only. It does not change HKJC, KRA, Japan, canonical merge, rank derivation, acquisition-completion classification, reviewed repair, runtime overlay, diagnostics, structured-data, public membership, public rank, or field-visibility semantics.
