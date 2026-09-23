import fs from 'node:fs';
import assert from 'node:assert/strict';
import { isPublishableRacecourseMapLocation } from '../src/lib/racecourseMapLocationPolicy.mjs';

const meetingList = JSON.parse(
  fs.readFileSync('data/generated/timetable/public/meeting-list.json', 'utf8')
);
const registry = JSON.parse(
  fs.readFileSync('data/static/racecourse-locations-v1.json', 'utf8')
);

assert.equal(
  meetingList.schema_version,
  'public-timetable-meeting-list-v0',
  'unexpected public Calendar meeting-list schema'
);
assert(Array.isArray(meetingList.meetings), 'public meeting list must contain meetings[]');
assert(Array.isArray(registry.locations), 'racecourse location registry must contain locations[]');
assert(meetingList.meetings.length > 0, 'public Calendar meeting list must not be empty');

const publishableIds = new Set(
  registry.locations
    .filter((entry) => isPublishableRacecourseMapLocation(entry))
    .map((entry) => entry.id)
);

const canonicalLocationId = (racecourseId) =>
  racecourseId === 'hipodromo-chile-racecourse' ? 'hipodromo-chile' : racecourseId;

const publicRacecourseIds = [...new Set(
  meetingList.meetings
    .map((meeting) => meeting.racecourse_id)
    .filter((racecourseId) => typeof racecourseId === 'string' && racecourseId.trim() !== '')
)].sort();

assert(publicRacecourseIds.length > 0, 'public Calendar must expose at least one racecourse_id');

const missing = publicRacecourseIds
  .filter((racecourseId) => !publishableIds.has(canonicalLocationId(racecourseId)))
  .sort();

if (missing.length > 0) {
  const countryByRacecourse = new Map();
  for (const meeting of meetingList.meetings) {
    if (!missing.includes(meeting.racecourse_id)) continue;
    if (!countryByRacecourse.has(meeting.racecourse_id)) {
      countryByRacecourse.set(meeting.racecourse_id, new Set());
    }
    countryByRacecourse.get(meeting.racecourse_id).add(meeting.country_id ?? 'unknown');
  }

  const detail = missing
    .map((racecourseId) => {
      const countries = [...(countryByRacecourse.get(racecourseId) ?? [])].sort().join(',');
      return `${racecourseId} [${countries}]`;
    })
    .join(', ');

  assert.fail(
    `public Calendar map coverage incomplete: ${missing.length} racecourse(s) missing publishable location: ${detail}`
  );
}

console.log(
  `PUBLIC_CALENDAR_MAP_PARITY: pass (${meetingList.meetings.length} meetings, ${publicRacecourseIds.length} racecourses, ${publishableIds.size} publishable locations)`
);
