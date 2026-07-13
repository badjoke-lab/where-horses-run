import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAuthoritySourceInventoryV1 } from './load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { promoteApprovedCandidateV1 } from './pipeline-v1/promotion-core.mjs';
import {
  approveHkjcCandidateV1,
  sha256JsonV1,
} from './hkjc-rank-upgrade-operations-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const candidateArg = argument('candidate');
const manifestArg = argument('manifest');
const approvalArg = argument('approval');
const outputArg = argument('output-dir');

if (!candidateArg || !manifestArg || !approvalArg || !outputArg) {
  throw new Error('--candidate=<path>, --manifest=<path>, --approval=<path>, and --output-dir=<path> are required');
}

function externalPath(value, label) {
  const absolute = path.resolve(value);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) throw new Error(`${label} must be outside the repository`);
  return absolute;
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

const candidate = readJson(externalPath(candidateArg, 'candidate'));
const manifest = readJson(externalPath(manifestArg, 'manifest'));
const approval = readJson(externalPath(approvalArg, 'approval'));
const outputDir = externalPath(outputArg, 'output-dir');
const approvedCandidate = approveHkjcCandidateV1({ candidate, manifest, approval });
const intendedCandidatePath = `data/candidates/hkjc-detail-${manifest.batch_id}-approved.json`;
const meetingsDataset = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meetings.json'), 'utf8'));
const detailsDataset = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meeting-details.json'), 'utf8'));
const promotion = promoteApprovedCandidateV1({
  candidate: approvedCandidate,
  meetingsDataset,
  detailsDataset,
  authorityInventory: loadAuthoritySourceInventoryV1(root),
  readinessRegistry: loadCalendarReadinessV1(root),
  inputPath: intendedCandidatePath,
});

fs.mkdirSync(outputDir, { recursive: true });
const files = {
  'approved-candidate.json': approvedCandidate,
  'proposed-canonical-meetings.json': promotion.meetingsDataset,
  'proposed-canonical-meeting-details.json': promotion.detailsDataset,
  'promotion-summary.json': promotion.summary,
};
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

const proposal = {
  schema_version: 'calendar-hkjc-detail-promotion-proposal-v1',
  work_id: 'WHR-CAL-HKJC-DETAIL-RECOVERY',
  implementation_unit: 'HKJC-DETAIL-RECOVERY-02',
  batch_id: manifest.batch_id,
  intended_candidate_path: intendedCandidatePath,
  candidate_sha256: sha256JsonV1(candidate),
  manifest_sha256: sha256JsonV1(manifest),
  approved_candidate_sha256: sha256JsonV1(approvedCandidate),
  proposed_meetings_sha256: sha256JsonV1(promotion.meetingsDataset),
  proposed_details_sha256: sha256JsonV1(promotion.detailsDataset),
  reviewer: approval.reviewer,
  reviewed_at: approval.reviewed_at,
  promotion_summary: promotion.summary,
  mutation_boundary: {
    repository_write: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
    human_merge_required: true
  }
};
fs.writeFileSync(path.join(outputDir, 'promotion-proposal.json'), `${JSON.stringify(proposal, null, 2)}\n`);

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-promotion-proposal-summary-v1',
  batch_id: manifest.batch_id,
  intended_candidate_path: intendedCandidatePath,
  promoted_meeting_count: promotion.summary.promoted_meeting_count,
  promoted_detail_count: promotion.summary.promoted_detail_count,
  candidate_sha256: proposal.candidate_sha256,
  approved_candidate_sha256: proposal.approved_candidate_sha256,
  proposed_meetings_sha256: proposal.proposed_meetings_sha256,
  proposed_details_sha256: proposal.proposed_details_sha256,
  repository_write: false,
  canonical_write: false,
  public_write: false,
  human_merge_required: true
}, null, 2));
