export const RANKS = new Set(['A+', 'A', 'B+', 'B', 'C', 'unassigned']);
export const CEILINGS = new Set([...RANKS, 'pending']);
export const DECISIONS = new Set(['complete', 'partial', 'pending']);
export const METHODS = new Set(['remote_http', 'remote_browser', 'local_http', 'local_browser', 'manual_document_review']);
export const SOURCE_TYPES = new Set(['official_html', 'official_json', 'official_pdf', 'official_api', 'official_app', 'licensed_distributor', 'public_distributor', 'other_reviewed']);
export const FIELD_NAMES = new Set(['meeting_date', 'racecourse', 'race_numbers', 'race_count', 'first_post_time', 'last_post_time', 'per_race_post_times', 'distances', 'race_descriptions', 'race_names', 'surface', 'course_label', 'official_source_url']);
