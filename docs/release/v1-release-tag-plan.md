# Where Horses Run v1 release tag record

Release ID: `WHR-V1`  
Operational unit: `V1-RELEASE-TAG-01`  
Tag: `v1.0.0`  
Target commit: `6d45895fb04ccbc3160e763c54438a4d51dff905`  
Status: complete  
Completed: 2026-07-19

## Result

Annotated repository tag `v1.0.0` was created at the final release-decision commit.

GitHub comparison confirms that `v1.0.0` and `6d45895fb04ccbc3160e763c54438a4d51dff905` are identical:

```text
status: identical
ahead by: 0
behind by: 0
```

The target commit accepted Where Horses Run v1 for reviewed static public release. The later production-confirmation commit records external verification and intentionally does not change the deployed public site.

## Execution controls

The one-shot workflow:

1. checked out complete repository history;
2. verified that the target commit existed;
3. verified that the target commit was contained in `main`;
4. created annotated tag `v1.0.0` only because it was absent;
5. pushed only `refs/tags/v1.0.0`;
6. verified the remote tag target.

## Cleanup

The write-enabled one-shot workflow was removed immediately after the tag was confirmed. No permanent workflow retains tag-creation permission.

The tag remains permanent release history. This operation did not modify source files, public data, deployment configuration, or the deployed public site.
