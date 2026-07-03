import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = 'data/fixtures/timetable/nar/route-probe-v1.json';
const outputPath = 'data/candidates/nar-route-probe-candidates.json';

const fixture = JSON.parse(fs.readFileSync(path.join(root, inputPath), 'utf8'));

if (fixture.schema_version !== 'nar-route-probe-fixture-v1') {
  throw new Error('Unexpected NAR route-probe fixture schema.');
}

const records = fixture.observations.map((observation) => ({
  candidate_id: `candidate-${observation.probe_id}`,
  probe_id: observation.probe_id,
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: observation.racecourse_id,
  venue_code: observation.venue_code,
  date: observation.date,
  timezone: 'Asia/Tokyo',
  evidence_scope: 'single_race_route_probe',
  capability_observed: 'A+_field_shape',
  meeting_completeness: 'not_established',
  promotion_eligible: false,
  review_status: 'needs_review',
  timetable_rows: [{ ...observation.public_safe_fields }],
  source: {
    list_url: observation.list_url,
    detail_url: observation.detail_url,
    source_status: observation.source_status,
    fixture_path: inputPath,
  },
  notes: 'Single-race route evidence only. This record cannot be promoted as a complete meeting.',
}));

const output = {
  schema_version: 'nar-route-probe-candidates-v1',
  generated_from: inputPath,
  generated_at: fixture.checked_at,
  adapter_id: 'nar-route-probe-candidate-adapter-v1',
  work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
  review: {
    status: 'needs_review',
    promotion_eligible: false,
    reason: 'complete meeting coverage has not been established',
  },
  records,
};

fs.mkdirSync(path.dirname(path.join(root, outputPath)), { recursive: true });
fs.writeFileSync(path.join(root, outputPath), `${JSON.stringify(output, null, 2)}\n`);
console.log(`[nar-route-probe-candidates] wrote ${records.length} records to ${outputPath}`);
