import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Report source availability, never a race meeting cancellation inference.
// Only already-collected bounded official LETROT bulletin diagnostics are read.
export function summarizeFranceLetrotNonRunningHealth(artifact) {
  const nonRunning = artifact?.diagnostics?.non_running;
  if (!nonRunning || !Array.isArray(nonRunning.bulletin_results)) {
    return {
      schema_version: 'calendar-letrot-non-running-health-v1',
      status: artifact ? 'diagnostics_missing' : 'artifact_missing',
      reported_status: null,
      classification: 'not_verified',
      bulletin_count: 0,
      counts: { success: 0, bulletin_unavailable_404: 0, source_error: 0, other: 0 },
      confirmed_non_running_count: 0,
    };
  }
  const counts = { success: 0, bulletin_unavailable_404: 0, source_error: 0, other: 0 };
  for (const result of nonRunning.bulletin_results) {
    if (Object.hasOwn(counts, result.status)) counts[result.status] += 1;
    else counts.other += 1;
  }
  const classification = counts.source_error || counts.other
    ? 'source_or_parse_error'
    : counts.bulletin_unavailable_404
      ? 'bounded_document_unavailable'
      : nonRunning.status === 'success' && counts.success > 0
        ? 'complete_for_checked_bulletins' : 'not_verified';

  return {
    schema_version: 'calendar-letrot-non-running-health-v1',
    status: 'audited',
    reported_status: nonRunning.status ?? null,
    classification,
    bulletin_count: nonRunning.bulletin_results.length,
    counts,
    confirmed_non_running_count: Number(nonRunning.confirmed_non_running_count ?? 0),
  };
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  const arg = (name) => process.argv.find((value) => value.startsWith('--' + name + '='))?.slice(name.length + 3);
  const artifactRoot = arg('artifact-root') || '.';
  const output = arg('output');
  if (!output) throw new Error('--output=<path> is required');
  const source = path.join(artifactRoot, '.calendar-unified', 'france-letrot.json');
  const artifact = fs.existsSync(source) ? JSON.parse(fs.readFileSync(source, 'utf8')) : null;
  const report = summarizeFranceLetrotNonRunningHealth(artifact);
  const dest = path.resolve(output);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output, ...report }));
}
