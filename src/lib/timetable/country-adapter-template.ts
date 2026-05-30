import {
  defaultSafeSourceAdapterSafetyPolicy,
  type SafeSourceAdapterResult,
  type SourceAdapterInput,
  type TimetableCandidateFile
} from './source-adapter';

export type CountryAdapterTemplateOptions = {
  readonly adapterId: string;
  readonly countryId: string;
  readonly generatedAt: string;
  readonly summary: string;
};

export function createCountryAdapterTemplateResult(
  input: SourceAdapterInput,
  options: CountryAdapterTemplateOptions
): SafeSourceAdapterResult {
  const candidateFile: TimetableCandidateFile = {
    schema_version: 'timetable-candidates-v0',
    generated_at: options.generatedAt,
    source_adapter_id: options.adapterId,
    country_id: options.countryId,
    candidate_window: {
      start_date: input.window.startDate,
      end_date_exclusive: input.window.endDateExclusive,
      timezone: input.window.timezone
    },
    records: [],
    review: {
      review_status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: options.summary,
      promotion_target: null
    }
  };

  return {
    adapterId: options.adapterId,
    generatedAt: options.generatedAt,
    candidateFile,
    warnings: [
      'Template result only: no live fetch, no source page parsing, no raw source body storage, no raw markup storage, and no public publishing without human review.'
    ]
  };
}

export const countryAdapterTemplateSafetyPolicy = defaultSafeSourceAdapterSafetyPolicy;
