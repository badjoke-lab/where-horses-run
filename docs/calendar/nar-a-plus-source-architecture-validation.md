# NAR A+ source architecture validation

Status: active validation record  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Validated: 2026-07-03

This record confirms that the NAR source-architecture phase remains non-publishing.

- first pilot cohort is bounded to Urawa code 18 and Funabashi code 19;
- the fourteen-code table is a research seed, not an activation list;
- RaceList and DebaTable route families are inputs to fixture review only;
- candidate output remains `needs_review`;
- canonical and public writes require human approval;
- raw source storage and scheduling remain disabled;
- PR #281 remains `do_not_merge` and only its reusable source knowledge is retained.

Next implementation step:

```text
bounded Urawa/Funabashi fixture probe
-> public-safe fixture review
-> candidate-only adapter
```
