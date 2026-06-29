# Country Profiles v2 — entries 45-52

Status: complete  
Work ID: `WHR-CP-PROFILE-45-52`  
Deployment: not required

## Scope

```text
45 Norway
46 Finland
47 Netherlands
48 Switzerland
49 Poland
50 Romania
51 Serbia
52 Slovakia
```

## Completed result

- eight reviewed Country Profile v2 records;
- eight country records and eighteen official source records;
- separate Norwegian harness/gallop systems;
- separate Swiss trot/gallop systems;
- Romania and Serbia remain partial country coverage;
- all country public ceilings remain C;
- tracker transitioned from `note_reviewed` to `profile_ready`;
- English and Japanese route states are `complete` but not `published`;
- publication QA remains `not_started`.

## Checks

```text
node scripts/check-country-profiles-45-52.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-detail-profile-runtime.mjs
node scripts/check-calendar-contracts.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-country-page-programme-roadmap.mjs
npm install
npm run build
```

## Next

`WHR-CP-PUB-45-52`
