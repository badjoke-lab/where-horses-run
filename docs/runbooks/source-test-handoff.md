# Source-test handoff

This runbook defines a public-safe JSON handoff for source-test decisions.

Remote research and remote probes come first. Local acquisition is used only
when a country is marked `local_required` in the programme tracker.

The handoff contains country identity, source metadata, meeting-level facts,
field-availability decisions, artifact digests and byte sizes. Captured source
files are not part of the handoff.

The reference input and expected output are stored under
`tests/fixtures/source-test-handoff/`.

The exporter reconstructs the output from an allowlist, discards extra input
fields and validates the result. The validator checks identifiers, dates,
response status, capture method, artifact digests, ranks and field names.

Only generated `*.handoff.json` files are shared for remote follow-up work.
