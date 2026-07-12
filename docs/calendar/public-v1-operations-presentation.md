# Calendar Public v1 operations presentation

Status: implemented for review  
Work ID: `WHR-CAL-PUBLIC-V1`  
Implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`  
Last reviewed: 2026-07-12

## Purpose

Calendar Public v1 must explain what happens when public data is current, old, empty, affected by a source failure, or awaiting reviewed operational work.

The public presentation must not expose the internal Review Queue, Retry Queue, operator decisions, attempt history, or source snapshot paths.

This unit adds a bilingual `Operations status` notice to:

```text
/calendar/
/ja/calendar/
/today/
/ja/today/
/tomorrow/
/ja/tomorrow/
```

## Public presentation model

The notice combines three safe states.

```text
Calendar data state
+ visible source presentation
+ retry ownership
```

### Calendar data state

The existing Dynamic Dates states remain authoritative:

- `current_window_available`;
- `no_public_records`;
- `records_before_window`;
- `records_after_window`;
- `stale_generation_with_window_records`.

`CalendarDateStatus` continues to explain the reference date, timezone, generated date, and window coverage.

### Visible source presentation

Only public-safe evidence is used in production.

```text
visible_sources_reviewed
visible_source_attention
source_failure_under_review
```

`visible_source_attention` is derived when a listed public meeting has source status `partial` or `stale`.

`source_failure_under_review` is supported by the presentation contract, but production pages use a zero failure count unless a separate reviewed public-safe failure summary is supplied.

When a source failure is shown, the copy must state:

- no meeting is invented from the failure;
- official sources remain the fallback;
- recovery remains under reviewed operations.

### Retry ownership

The production default is:

```text
reviewed_operations
```

The public message states that additional detail and source recovery are managed through reviewed operations and that updates are not automatic.

The following remain private:

- Retry Queue entries;
- due/deferred counts;
- attempt counts;
- next eligible time;
- attempt limits;
- operator notes;
- review decisions.

## Current and stale fixtures

The dedicated rendered workflow validates two deterministic builds.

```text
2026-07-01 / Asia/Tokyo
expected Calendar data state: current_window_available

2026-07-12 / Asia/Tokyo
expected Calendar data state: stale_generation_with_window_records
```

Both builds must display bilingual reviewed-operations ownership and automatic-publication-disabled copy.

## Empty and source-failure fixtures

Empty and source-failure presentation is validated through the shared pure presentation model.

This avoids creating a hidden public fixture route or inventing a production source failure.

The fixture matrix confirms:

- empty public records remain an honest empty state;
- a source failure does not produce a synthetic meeting;
- official-source fallback remains explicit;
- retry ownership remains human-reviewed;
- automatic publication remains disabled.

## Boundaries

This unit does not:

- write canonical or public projection data;
- publish internal operations artifacts;
- expose reviewer or operator identity;
- expose Retry Queue counts or history;
- enable automatic acquisition, queue mutation, approval, promotion, or publication;
- expose participant, betting, result, payout, prediction, raw-source, or direct-stream data.

## Next unit

Complete bilingual responsive QA across:

```text
Calendar
country
racecourse
meeting detail
cross-navigation
```
