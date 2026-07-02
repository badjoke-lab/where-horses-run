# JRA A+ candidate generation

Status: active implementation note  
Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`

The JRA candidate generator resolves the approved Japan Readiness v2 and Authority/Source v2 overlays before producing review-only Pipeline v1 candidates.

Candidate output remains `needs_review`; canonical promotion and public publication remain separate human-controlled steps.

The generator may retain reviewed A+ programme fields only when they are confirmed by the resolved readiness record:

- race name;
- distance;
- surface;
- course label.

NAR and Banei candidates are out of scope for this step and remain pending their dedicated pilot Work IDs.
