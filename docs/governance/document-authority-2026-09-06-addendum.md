# Documentation authority — 2026-09-06 UI addendum

Status: active canonical governance addendum  
Adopted: 2026-09-06  
Base policy: `docs/governance/document-authority.md`

This addendum updates only the current top-level execution pointer and the canonical product/UI document set. All other authority ordering, Calendar contracts, machine-readable contract lists, public/private boundaries, and PR discipline in the base policy remain in force.

## Current top-level execution pointer

The current adopted top-level execution addendum is:

```text
docs/project-roadmap-2026-09-06-addendum.md
```

It supersedes the 2026-09-05 and older top-level UI execution snapshots where they conflict.

## Current canonical product/UI set

For current public information architecture, navigation, map presentation, responsive/mobile behavior, and page-role execution, read this set before implementation:

```text
docs/specs/map-first-site-ui-2026-09-06.md
docs/project-roadmap-2026-09-06-addendum.md
docs/decisions/map-ui-integration-2026-09-05.md
docs/racecourses/page-link-architecture.md
```

The first file is the canonical product/UI specification. The project-roadmap addendum controls current/next Work ID and execution sequence. The map decision preserves data/runtime/public-display boundaries. Page/programme contracts still control their subject-specific data/publication rules.

## UI implementation discipline

Before each public UI implementation PR:

1. read `docs/specs/map-first-site-ui-2026-09-06.md`;
2. read `docs/project-roadmap-2026-09-06-addendum.md`;
3. read the applicable page/programme contracts;
4. compare the intended behavior against those documents;
5. update the specification/schedule in the same PR or a preceding documentation PR if the agreed behavior changes;
6. after merge, re-read the active specification and roadmap addendum before starting the next Work ID.

Conversation history, screenshots, and old mock files are not execution authority by themselves.

## Current UI Work ID

```text
Current: UI-001 — shared BaseLayout/navigation/footer refactor
Next: UI-002 — Home map-first composition
```

`docs/pr-plans/map-first-ui-pr-plan-2026-09-06.md` is the scoped PR implementation plan. It does not outrank the canonical UI specification or project-roadmap addendum.