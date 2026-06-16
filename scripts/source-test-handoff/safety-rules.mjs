export const PUBLIC_SAFETY_KEYS = [
  'raw_source_included',
  'restricted_records_included',
  'local_paths_included',
  'direct_media_routes_included'
];

export const BLOCKED_OUTPUT_KEYS = new Set([
  'raw_html',
  'raw_json',
  'full_text',
  'document_text',
  'screenshot',
  'local_path',
  'file_path',
  'restricted_records'
]);
