# HKJC PILOT-05 detail route evidence decision

Status: foundation accepted; hosted detail route not evidence-backed  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-05`  
Last reviewed: 2026-07-10

## Decision

PILOT-05 accepts the new artifact-only detail core and bounded external review-artifact collector as the foundation for future HKJC detail work.

It does **not** activate a GitHub Actions detail runner and does **not** activate Registry detail source or adapter fields.

The current decision is:

```text
artifact-only detail core: accepted
external review-artifact collector: accepted
github_actions detail runner: not evidence-backed
Registry overall profile: provisional
detail_source_id: null
detail_adapter_id: null
supported observation ranks: C only
```

The next implementation unit is:

```text
HKJC-PILOT-06
HKJC detail runner and source-route reconciliation
```

## Foundation evidence

The PILOT-05 pure core and collector prove:

- C/B/B+/A/A+ classification fixtures;
- complete-meeting evidence required before A/A+;
- A downgrade strips partial A+ fields;
- unofficial source URLs are rejected;
- candidate/Coverage/Manifest/report construction;
- external review-artifact output only;
- repository-local output rejected before acquisition;
- raw source storage disabled;
- canonical and public writes disabled;
- automatic approval, promotion, and publication disabled.

The accepted foundation does not itself prove that GitHub Actions can acquire HKJC detail pages.

## Bounded hosted live evidence

The first one-meeting hosted live run targeted the reviewed known meeting:

```text
meeting: hkjc-happy-valley-racecourse-2026-06-10
window: 2026-06-10 <= date < 2026-06-11
workflow run: 29104855428
```

Observed result:

```text
rank: C
coverage: none
records discovered: 1
records updated: 0
unresolved meetings: 1
source errors: 1
source error code: source_unavailable
review state: needs_review
publication effect: none
```

Protected canonical/public/Registry/source-config hashes remained unchanged and the repository remained clean after the run.

This result is retained as hosted-route evidence, not as evidence that the official source itself lacks detail content.

## Route-form probe

A public-safe route probe compared three official URL forms against three reviewed meeting targets:

Targets:

```text
2026-06-10 Happy Valley Race 1
2026-07-04 Sha Tin Race 1
2026-07-08 Happy Valley Race 1
```

Route forms:

```text
local route with slash date
local route with hyphen date
legacy ASPX route redirected by the official site
```

All nine responses returned HTTP 200, but every result had the same safe structural summary:

```text
response bytes: 120504
visible text chars: 5485
post-time shape: false
race-name shape: false
distance shape: false
surface shape: false
```

The outcome was independent of meeting date and racecourse.

## Session-strategy probe

For the reviewed target `2026-07-08:HV:1`, three acquisition strategies were compared:

```text
direct browser-like headers
official fixture warmup + cookie forwarding
official racecard-base warmup + cookie forwarding
```

All three returned HTTP 200 and the same 120504-byte shell summary.

All three remained:

```text
target meeting marker: false
post-time shape: false
race-name shape: false
distance shape: false
surface shape: false
```

The two warmup responses did not expose cookies to forward.

## Interpretation boundary

The evidence supports only the following operational conclusion:

> The GitHub Actions HTTP detail acquisition path used by PILOT-05 is not proven as a usable HKJC detail runner.

The evidence does not authorize a broader statement that the official HKJC source lacks timetable detail. The project therefore fails closed at the runner/source-route boundary rather than weakening the parser, fabricating ranks, or activating unproven Registry capability.

## PILOT-06 scope

PILOT-06 must evaluate runner and source-route choices against the accepted artifact-only core.

Priority order:

1. determine whether a bounded local execution path can observe the public-safe race timetable fields that hosted Actions did not;
2. determine whether reviewed-import operation is a safer fallback when local acquisition is available but not reliably hostable;
3. inspect alternate official HKJC timetable/detail source routes without expanding the public data boundary;
4. preserve the current candidate, Coverage Observation, Result Manifest, and review-artifact contracts;
5. keep Registry detail activation separate until actual bounded evidence succeeds.

PILOT-06 must not restore the quarantined historical direct source-to-canonical/public chain.

## Safety boundary

The following remain disabled:

- scheduled acquisition execution;
- automatic Queue mutation;
- automatic approval;
- automatic promotion;
- automatic publication;
- canonical write;
- public write;
- deployment.

The detail path continues to exclude participant data, betting and odds data, results, payouts, predictions, raw source bodies, embedded video, and direct stream URLs.
