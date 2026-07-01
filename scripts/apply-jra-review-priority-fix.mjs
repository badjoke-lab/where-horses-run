import { readFileSync, writeFileSync } from 'node:fs';

const file = 'scripts/timetable/jra-final-review-package-core.mjs';
let text = readFileSync(file, 'utf8');
const before = `  const nextActions = confirmation.candidate_generation.permitted
    ? [
        'review_normalized_handoff_artifact',
        'prepare_separate_normalized_data_pull_request',
        'run_existing_jra_candidate_generator',
        'retain_candidate_needs_review_state'
      ]
    : confirmation.candidate_generation.blockers.includes('human_review_required')
      ? ['complete_human_review', 'regenerate_review_package']
      : ['resolve_confirmation_blockers', 'regenerate_review_package'];`;
const after = `  const nonReviewBlockers = confirmation.candidate_generation.blockers.filter(
    (blocker) => blocker !== 'human_review_required'
  );

  const nextActions = confirmation.candidate_generation.permitted
    ? [
        'review_normalized_handoff_artifact',
        'prepare_separate_normalized_data_pull_request',
        'run_existing_jra_candidate_generator',
        'retain_candidate_needs_review_state'
      ]
    : nonReviewBlockers.length > 0
      ? ['resolve_confirmation_blockers', 'regenerate_review_package']
      : ['complete_human_review', 'regenerate_review_package'];`;
if (!text.includes(before)) throw new Error('JRA review priority marker missing.');
text = text.replace(before, after);
writeFileSync(file, text);
console.log('JRA_REVIEW_PRIORITY_FIX_APPLIED');
