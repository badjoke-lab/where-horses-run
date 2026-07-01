import { evaluateJraFinalConfirmation } from './jra-final-confirmation-core.mjs';
import { buildJraFinalNormalizedHandoff } from './jra-final-normalized-handoff-core.mjs';

export function buildJraFinalReviewPackage({
  planned,
  final,
  control,
  readinessRegistry,
  authorityInventory,
  finalFixtureSha256,
  finalFixtureLabel
}) {
  const confirmation = evaluateJraFinalConfirmation({
    planned,
    final,
    control,
    readinessRegistry,
    authorityInventory
  });

  const normalizedHandoff = confirmation.candidate_generation.permitted
    ? buildJraFinalNormalizedHandoff({
        planned,
        final,
        control,
        readinessRegistry,
        authorityInventory
      })
    : null;

  const nextActions = confirmation.candidate_generation.permitted
    ? [
        'review_normalized_handoff_artifact',
        'prepare_separate_normalized_data_pull_request',
        'run_existing_jra_candidate_generator',
        'retain_candidate_needs_review_state'
      ]
    : confirmation.candidate_generation.blockers.includes('human_review_required')
      ? ['complete_human_review', 'regenerate_review_package']
      : ['resolve_confirmation_blockers', 'regenerate_review_package'];

  return {
    schema_version: 'jra-final-review-package-v1',
    work_id: 'WHR-CAL-JAPAN-JRA',
    generated_at: final.generated_at,
    mode: 'external_review_only',
    input: {
      final_fixture_label: finalFixtureLabel,
      final_fixture_sha256: finalFixtureSha256
    },
    decision: {
      structurally_valid: true,
      final_confirmation_pass: confirmation.candidate_generation.permitted,
      normalized_handoff_included: normalizedHandoff !== null,
      candidate_handoff_ready: normalizedHandoff !== null,
      blockers: confirmation.candidate_generation.blockers
    },
    confirmation,
    normalized_handoff: normalizedHandoff,
    next_actions: nextActions,
    boundaries: {
      network_fetch_performed: false,
      source_body_stored: false,
      repository_write_performed: false,
      candidate_generated: false,
      candidate_approved: false,
      canonical_written: false,
      public_projection_written: false,
      pull_request_created: false,
      scheduled_operation_active: false
    }
  };
}
