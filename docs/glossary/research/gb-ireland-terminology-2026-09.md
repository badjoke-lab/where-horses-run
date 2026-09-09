# GB / Ireland terminology research — 2026-09

Status: **current research evidence, not public glossary truth**

This note records the first jurisdiction-led pass under `GLOSSARY-MASTER-003`.

The canonical research ledger is:

- `data/glossary-master/jurisdictions/gb-ireland-research-v1.tsv`

## Research rule

This pass does **not** translate the 501 seed terms into British or Irish English.

Instead, it reads current/authoritative BHA and IHRB material from the jurisdiction side and then maps each observed label to one of:

1. existing Concept — exact or near match;
2. existing Concept — jurisdiction-specific definition or official label;
3. new Concept candidate;
4. compositional/qualified label that should not create a new base Concept.

No row in the research ledger changes `public_ready` by itself.

## First-pass source set

### Great Britain

- British Horseracing Authority — Rules of Racing and guides
- BHA Race Administration Manual
- BHA General Instructions, Section 3 — The Racecourse / going reporting

### Ireland

- Irish Horseracing Regulatory Board — Rules of Racing
- IHRB rule-change notices
- IHRB Non Runners / Reserves operational page
- IHRB jockey-licensing guidance
- IHRB Safety Limits
- IHRB Raceday Stewards / daily enquiries material

## Material findings

### Great Britain

The BHA source set confirms that a global English label is not enough even inside one language.

Examples:

- `Flat Season`, `Winter Flat Season`, and `Jump Season` are explicit BHA season terms and should not be reduced to one generic `Season` label without preserving the local system.
- `Apprentice Jockey` and `Conditional Jockey` are separate licence categories.
- `National Hunt Flat Race` is an official race-type label.
- `Private Sweepstakes` and `Total Race Value Race` are defined BHA race types absent from the initial seed and therefore become new Concept candidates.
- BHA going reporting uses an official controlled vocabulary. The turf list includes `Hard`, `Firm`, `Good to Firm`, `Good`, `Good to Soft`, `Soft`, and `Heavy`.
- `Hard` is missing from the 501 seed and becomes a new candidate.
- `Good to Firm (Firm in Places)` and `Good (fast)` are examples of qualified/compositional descriptions. They should not automatically become new base Concepts.
- `Going Report` and `GoingStick` are operational terms around the going system and are not synonyms for `Going` itself.

## Ireland

Ireland adds several concepts and official labels that cannot be represented by a generic GB/IRE bucket alone.

Examples:

- `Irish National Hunt Flat Race` / `I.N.H. Flat Race` is an IHRB-defined official term. `Bumper` is also used operationally by IHRB, but the two labels must keep their register/status distinction.
- IHRB defines `Maiden` differently for Flat racing and I.N.H.S. racing. A single universal definition is therefore insufficient.
- `Academy Hurdle` is an IHRB-defined race type and is a new Concept candidate.
- `Qualified Rider` is an IHRB permit/participant category and should not be collapsed into generic `Amateur rider` or `Jockey`.
- `Category A1 Permit`, `Category A3 Permit`, and `Claiming Professional Jockey` are current IHRB participant/licensing terms and are new candidates pending model review.
- `Reserve` has a jurisdiction-specific IHRB definition tied to declaration and ballot status.
- current IHRB operational labels include `Reserve Declaration`, `Nomination of Rider`, `Non Runner`, `Clerk of the Scales`, `Overweight`, and `Winner's penalty`.
- `Irish Racing Calendar` and `Irish Form Book` are formally defined publications and should not be flattened into generic `Racing calendar` / `Official results` labels.
- current IHRB safety material uses `Hunter Chase`, `Juvenile Hurdle`, `Bumpers`, and `Cross Country Races` as operative race-type labels.
- `Ground Reports` is the public IHRB label for going reports for upcoming meetings.

## Immediate master changes implied by this pass

Do not apply these as reviewed public truth yet. The next data patch should:

1. add high-confidence missing candidates found in official definitions;
2. add jurisdiction-specific labels/definitions for existing Concepts;
3. add source records with retrieval/check dates;
4. explicitly represent GB vs Ireland distinctions instead of a blanket `GB/IRE` label where the official definition differs;
5. preserve abbreviations and punctuation such as `I.N.H. Flat Race` exactly as observed;
6. keep operational document names (`Irish Racing Calendar`, `Irish Form Book`) as named jurisdiction objects rather than translations of generic concepts.

## Next research pass

Continue GB/Ireland before moving on to North America:

- BHA race-type and eligibility definitions: maiden, novice, nursery, seller/selling, claiming where applicable, Pattern/Listed/Group terminology;
- BHA jockey allowances and weight terminology;
- BHA race-result abbreviations and jump-racing result codes;
- IHRB full definition section extraction and mapping;
- IHRB going descriptions and course-specific terminology;
- HRI race programme/racecard terminology where HRI, rather than IHRB, is the authoritative publisher;
- slang/industry terms only after official-system mapping is stable.

Public glossary reimplementation remains deferred.
