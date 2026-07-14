# Racecourse page identity reconciliation

Status: implemented for review

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`

## Purpose

Every racecourse ID used by the reviewed public timetable must resolve to one canonical English racecourse page and one canonical Japanese racecourse page. Meeting pages may link to an individual racecourse only when that canonical identity exists.

## Discovery result

The read-only discovery used the public meeting list generated at `2026-07-14T00:15:00Z`.

```text
public meetings: 169
public racecourse IDs: 26
canonical exact IDs before reconciliation: 13
unresolved IDs before reconciliation: 13
meetings using unresolved IDs: 114
```

The unresolved set was:

- Funabashi;
- Kanazawa;
- Kasamatsu;
- Kawasaki;
- Kochi;
- Kokura;
- Monbetsu;
- Morioka;
- Nagoya;
- Oi;
- Saga;
- Sonoda;
- Urawa.

Twelve identities are NAR venues and one is the JRA Kokura identity.

## Implemented resolution

`data/static/racecourses-public-timetable-identities-v1.json` adds exactly thirteen canonical identity-only records.

Each record supplies only:

- stable ID and slug;
- English, Japanese, and local name;
- country and timezone;
- active identity status derived from reviewed public meetings;
- official NAR or JAIRS/JRA source routes;
- explicit identity-only and link-first status.

The records intentionally leave city, region, course surface, direction, course dimensions, race-distance profile, notable races, and live schedule connection unknown. These fields require separate source review and are not inferred from meeting IDs.

After import into the racecourse registry:

```text
canonical racecourse records: 36
public racecourse IDs: 26
canonical exact IDs: 26
unresolved IDs: 0
new English routes: 13
new Japanese routes: 13
```

## Page behavior

Racecourse pages render missing profile fields as `Not listed yet` or `未掲載` rather than empty or inferred values.

The Calendar link always targets `/calendar/` or `/ja/calendar/`. Meeting detail pages resolve the new identities through the canonical registry and link to the matching bilingual racecourse route.

## Evidence

- discovery workflow run: `29328467780`;
- discovery artifact ID: `8308928476`;
- artifact digest: `sha256:806a2dfbfaf8c5087da00a2cb4705a4cf631797a53dfe966e64383e6cd0df930`;
- reviewed public meeting list: `data/generated/timetable/public/meeting-list.json`;
- NAR racecourse guide source: `japan-nar-racecourse-guide`;
- JAIRS/JRA racecourse guide source: `japan-jairs-racecourses`.

## Safety boundary

This unit does not fetch network data, modify Canonical or public timetable records, infer unsupported profile facts, publish participant or betting data, enable automatic publication, or deploy the site.

## Next unit

`RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01` will connect reviewed current and upcoming meeting state to canonical racecourse pages without copying internal queue state or inventing missing detail.
