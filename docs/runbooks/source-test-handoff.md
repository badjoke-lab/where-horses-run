# Source-test handoff

This runbook defines how a private source-test capture is reduced to a public-safe JSON handoff. Source files remain outside the repository. The exported handoff contains only reviewed source metadata, meeting-level facts, field-availability decisions, file hashes, and byte sizes.

The exporter and validator are added in the same pull request.
