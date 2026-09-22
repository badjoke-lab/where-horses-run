import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SOREC_NON_RUNNING_CALENDAR_URL,
  bindSorecPostponementEvidence,
  buildSorecConfirmedNonRunningRecords,
  parseSorecPostponementEvidenceHtml,
} from './timetable/sorec-non-running-evidence.mjs';

assert.equal(SOREC_NON_RUNNING_CALENDAR_URL,\n  'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?code=CALEN&description=Calendrier+courses&fctID=1406',\n  'SOREC status automation must stay on the Actions-proven stable menu route');\n\nfunction fixture(rows) {
  return `<!doctype html>
<html><body>
<ul><li id="legende-report">Réunion reportée</li></ul>
<script>
var joursEvenement = null;
jQuery(function () {
  joursEvenement = ${JSON.stringify(rows)};
});
function highlightCalendar(date, cssClass, joursEvenement) {
  var d = date.getDate();
  var m = date.getMonth() + 1;
  var y = date.getFullYear();
  for (i = 0; i < joursEvenement.length; i++) {
    if (d+""+(m+10)+""+y == joursEvenement[i][0]) {
      return [ true, joursEvenement[i][1], joursEvenement[i][2] ];
    }
  }
  return [ false, 'default' ];
}
</script>
</body></html>`;
}

const canonical = [{
  meeting_id: 'sorec-casablanca-anfa-racecourse-2025-03-14',
  country_id: 'morocco',
  authority_id: 'sorec',
  racing_system_id: 'sorec-racing-information-system',
  racecourse_id: 'casablanca-anfa-racecourse',
  date: '2025-03-14',
}];

const acceptedHtml = fixture([
  ['14132025', 'REPOR', "Reunion reportee au 21/03/25 a l'hippodrome Anfa"],
]);
const accepted = buildSorecConfirmedNonRunningRecords({
  html: acceptedHtml,
  canonicalMeetings: canonical,
  sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL,
  checkedAt: '2026-09-22T00:00:00Z',
  startDate: '2025-03-01',
  endDateExclusive: '2025-04-01',
});
assert.equal(accepted.meeting_presence_records.length, 1);
assert.equal(accepted.meeting_presence_records[0].meeting_id, 'sorec-casablanca-anfa-racecourse-2025-03-14');
assert.equal(accepted.meeting_presence_records[0].date, '2025-03-14');
assert.equal(accepted.meeting_presence_records[0].state, 'confirmed_non_running');
assert.equal(accepted.meeting_presence_records[0].scope, 'whole_meeting');
assert.equal(accepted.meeting_presence_records[0].evidence_type, 'official_explicit_non_running');
assert.notEqual(accepted.meeting_presence_records[0].date, '2025-03-21',
  'replacement date must never replace the original non-running meeting identity');

const parsedAccepted = parseSorecPostponementEvidenceHtml(acceptedHtml, {
  sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL,
});
assert.equal(parsedAccepted.evidence[0].date, '2025-03-14');
assert.equal(parsedAccepted.evidence[0].replacement_date, '2025-03-21');

const conflict = parseSorecPostponementEvidenceHtml(fixture([
  ['15132025', 'RESDE', 'Reunion Courue'],
  ['15132025', 'REPOR', "Reunion reportee au 22/03/25 a l'hippodrome Anfa"],
]), { sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL });
assert.deepEqual(conflict.evidence, [], 'REPOR plus another status on the same calendar date must fail closed');
assert.equal(conflict.diagnostics.skipped[0].reason, 'conflicting_or_duplicate_statuses');

const sameDate = parseSorecPostponementEvidenceHtml(fixture([
  ['16132025', 'REPOR', "Reunion reportee au 16/03/25 a l'hippodrome Anfa"],
]), { sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL });
assert.deepEqual(sameDate.evidence, [], 'same-date REPOR message is insufficient to prove original-date postponement');

const backwards = parseSorecPostponementEvidenceHtml(fixture([
  ['17132025', 'REPOR', "Reunion reportee au 15/03/25 a l'hippodrome Anfa"],
]), { sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL });
assert.deepEqual(backwards.evidence, [], 'backwards replacement date must fail closed');

const noReplacement = parseSorecPostponementEvidenceHtml(fixture([
  ['18132025', 'REPOR', "Reunion reportee au a l'hippodrome Anfa"],
]), { sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL });
assert.deepEqual(noReplacement.evidence, [], 'missing replacement date must fail closed');

const ambiguous = bindSorecPostponementEvidence({
  evidence: parsedAccepted.evidence,
  canonicalMeetings: [
    ...canonical,
    {
      meeting_id: 'sorec-settat-racecourse-2025-03-14',
      country_id: 'morocco',
      authority_id: 'sorec',
      racing_system_id: 'sorec-racing-information-system',
      racecourse_id: 'settat-racecourse',
      date: '2025-03-14',
    },
  ],
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(ambiguous.meeting_presence_records, [], 'ambiguous canonical date binding must fail closed');
assert.equal(ambiguous.diagnostics.skipped[0].reason, 'canonical_binding_ambiguous');

const missing = bindSorecPostponementEvidence({
  evidence: parsedAccepted.evidence,
  canonicalMeetings: [],
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(missing.meeting_presence_records, [], 'missing canonical binding must fail closed');
assert.equal(missing.diagnostics.skipped[0].reason, 'canonical_binding_missing');

assert.throws(() => parseSorecPostponementEvidenceHtml(acceptedHtml, {
  sourceUrl: 'https://example.com/pages/course_a_venir/calendrier_course.jsf?code=CALEN&description=Calendrier+courses&fctID=1406',
}), /official www\.sorec-galop\.ma/);

const runner = fs.readFileSync('scripts/timetable/run-sorec-official-window.mjs', 'utf8');
assert.match(runner, /buildSorecConfirmedNonRunningRecords/);
assert.match(runner, /meeting_presence_records:\s*meetingPresenceRecords/);
assert.match(runner, /non_running_source_status/);
assert.match(runner, /catch \(error\)/, 'negative-evidence source failure must be caught and fail closed');

const workflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
const presenceArtifactRefs = workflow.match(/--artifact=\.calendar-unified\/sorec\.json/g) ?? [];
assert.ok(presenceArtifactRefs.length >= 2,
  'SOREC artifact must remain wired into presence disposition on initial and latest-main rebuild paths');

console.log('SOREC_NON_RUNNING_EVIDENCE: pass');
