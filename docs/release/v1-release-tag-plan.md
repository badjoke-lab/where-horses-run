# Where Horses Run v1 release tag plan

Release ID: `WHR-V1`  
Operational unit: `V1-RELEASE-TAG-01`  
Tag: `v1.0.0`  
Target commit: `6d45895fb04ccbc3160e763c54438a4d51dff905`

## Purpose

Create the annotated repository tag `v1.0.0` at the final release-decision commit.

The target is the commit that accepted Where Horses Run v1 for reviewed static public release. The later production-confirmation commit records external verification and intentionally does not change the deployed public site.

## One-shot execution

`.github/workflows/v1-release-tag-once.yml` runs only when its own file is merged to `main` or when manually dispatched. It:

1. checks out complete repository history;
2. verifies that the target commit exists;
3. verifies that the target commit is contained in `main`;
4. creates annotated tag `v1.0.0` if absent;
5. fails if an existing `v1.0.0` points anywhere else;
6. pushes only `refs/tags/v1.0.0`.

The workflow does not modify source files, public data, deployment configuration, or the public site.

## Cleanup requirement

After the tag is confirmed, the write-enabled one-shot workflow must be removed in a separate `[CF-Pages-Skip]` cleanup PR. The tag remains as permanent release history; the temporary write path does not remain enabled.
