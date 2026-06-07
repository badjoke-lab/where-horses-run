import countries from '../../data/static/countries.json';
import countryProfiles from '../../data/static/country-profiles.json';
import racecourses from '../../data/static/racecourses.json';
import racecourseExtensions from '../../data/static/racecourses-extensions.json';
import sources from '../../data/static/sources.json';
import glossary from '../../data/static/glossary.json';
import archive from '../../data/static/archive.json';
import countryRacingInventory from '../../data/static/country-racing-inventory.json';
import latest from '../../data/generated/latest.json';
import today from '../../data/generated/today.json';
import tomorrow from '../../data/generated/tomorrow.json';
import calendar30d from '../../data/generated/calendar-30d.json';
import fetchStatus from '../../data/generated/fetch-status.json';
import liveFetchProbeStatus from '../../data/generated/live-fetch-probe-status.json';
import publicTimetableMeetingList from '../../data/generated/timetable/public/meeting-list.json';
import japanActiveTimetableRecords from '../../data/generated/japan-active-timetable-records.json';

export type Locale = 'en' | 'ja';

const allRacecourses = [...racecourses, ...racecourseExtensions] as const;

export type Country = (typeof countries)[number];
export type CountryProfile = (typeof countryProfiles)[number];
export type Racecourse = (typeof allRacecourses)[number];
export type Source = (typeof sources)[number];
export type GlossaryEntry = (typeof glossary)[number];
export type ArchiveEntry = (typeof archive)[number];

type PublicMeeting = (typeof publicTimetableMeetingList.meetings)[number];

const authorityDisplayLabel: Record<string, string> = {
  jra: 'JRA',
  hkjc: 'HKJC',
  'nar-local-government-racing': 'NAR local racing',
  'banei-tokachi': 'Banei racing',
  'emirates-racing-authority': 'Emirates Racing Authority',
};

const publicTimetableRecords = publicTimetableMeetingList.meetings.map((meeting) => ({
  meeting_id: meeting.meeting_id,
  country_id: meeting.country_id,
  authority_id: meeting.authority_id,
  racecourse_id: meeting.racecourse_id,
  racecourse_name: meeting.racecourse_id,
  date: meeting.date,
  start_time_local: meeting.first_race_time_local,
  first_race_time_local: meeting.first_race_time_local,
  last_race_time_local: meeting.last_race_time_local,
  timezone: meeting.timezone,
  racing_type: authorityDisplayLabel[meeting.authority_id] ?? meeting.authority_id,
  source_id: meeting.authority_id,
  source_url: meeting.official_source_url,
  official_source_url: meeting.official_source_url,
  detail_path: meeting.detail_path,
  capability_rank: meeting.capability_rank,
  effective_public_rank: meeting.effective_public_rank,
  status: meeting.source_status,
  confidence: 'publication-policy-resolved',
  last_checked_at: meeting.last_checked_date,
  last_checked_date: meeting.last_checked_date,
  notes: `Public timetable row resolved by ${meeting.policy_id}.`,
}));

const publicTimetables = {
  schema_version: publicTimetableMeetingList.schema_version,
  generated_at: publicTimetableMeetingList.generated_at,
  records: publicTimetableRecords,
  sources: [...new Set(publicTimetableMeetingList.meetings.map((meeting) => meeting.authority_id))],
  notes: [
    'Country and racecourse timetable surfaces read the publication-policy-resolved public meeting list.',
    'One row represents one meeting; race-by-race rows are not included here.',
  ],
} as const;

function getPublicMeetingsByRacecourseId(racecourseId: string): PublicMeeting[] {
  const generatedDate = String(publicTimetableMeetingList.generated_at ?? '').slice(0, 10);
  return publicTimetableMeetingList.meetings
    .filter((meeting) => meeting.racecourse_id === racecourseId)
    .filter((meeting) => !generatedDate || meeting.date >= generatedDate)
    .sort((left, right) =>
      `${left.date}:${left.first_race_time_local ?? '99:99'}:${left.meeting_id}`.localeCompare(
        `${right.date}:${right.first_race_time_local ?? '99:99'}:${right.meeting_id}`,
      ),
    );
}

export const siteData = {
  countries,
  countryProfiles,
  racecourses: allRacecourses,
  sources,
  glossary,
  archive,
  countryRacingInventory,
  generated: {
    latest,
    today,
    tomorrow,
    calendar30d,
    fetchStatus,
    liveFetchProbeStatus,
    timetables: publicTimetables,
    japanActiveTimetableRecords
  }
} as const;

export function getCountries(): Country[] {
  return [...countries].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getActiveCountries(): Country[] {
  return getCountries().filter((country) => country.status === 'active');
}

export function getCountryBySlug(slug: string): Country | undefined {
  return countries.find((country) => country.slug === slug);
}

export function getCountryProfileByCountryId(countryId: string): CountryProfile | undefined {
  return countryProfiles.find((profile) => profile.country_id === countryId);
}

export function getCountryProfileBySlug(slug: string): CountryProfile | undefined {
  return countryProfiles.find((profile) => profile.slug === slug);
}

export function getRacecourses(): Racecourse[] {
  return [...allRacecourses].sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export function getRacecoursesByCountryId(countryId: string): Racecourse[] {
  return getRacecourses().filter((racecourse) => racecourse.country_id === countryId);
}

export function getRacecourseBySlug(slug: string) {
  const racecourse = allRacecourses.find((entry) => entry.slug === slug);
  if (!racecourse) return undefined;

  const publicMeetings = getPublicMeetingsByRacecourseId(racecourse.id);
  const existingSchedule = racecourse.schedule_summary ?? {
    today_status: 'unknown',
    next_meeting_date: null,
    upcoming_meetings: [],
    status: 'official-link-only',
    last_checked: null,
  };

  return {
    ...racecourse,
    schedule_summary: {
      ...existingSchedule,
      today_status: publicMeetings.length > 0 ? 'public-meeting-listed' : existingSchedule.today_status,
      next_meeting_date: publicMeetings[0]?.date ?? existingSchedule.next_meeting_date,
      upcoming_meetings: publicMeetings.map((meeting) => ({
        meeting_id: meeting.meeting_id,
        date: meeting.date,
        first_post: meeting.first_race_time_local,
        last_race_time: meeting.last_race_time_local,
        status: meeting.effective_public_rank,
        detail_path: meeting.detail_path,
        official_source_url: meeting.official_source_url,
      })),
      status: publicMeetings.length > 0 ? 'public-timetable-view' : existingSchedule.status,
      last_checked: publicMeetings[0]?.last_checked_date ?? existingSchedule.last_checked,
    },
  };
}

export function getSourcesByCountryId(countryId: string): Source[] {
  return sources.filter((source) => source.country_id === countryId);
}

export function getGlossaryEntries(): GlossaryEntry[] {
  return [...glossary].sort((a, b) => a.term_en.localeCompare(b.term_en));
}

export function getGlossaryEntryBySlug(slug: string): GlossaryEntry | undefined {
  return glossary.find((entry) => entry.slug === slug);
}

export function getArchiveEntries(): ArchiveEntry[] {
  return [...archive].sort((a, b) => a.name_en.localeCompare(b.name_en));
}
