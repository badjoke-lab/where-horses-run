import { readFileSync, writeFileSync } from 'node:fs';

const viewModelFile = 'src/lib/timetable/publicTimetableViewModel.ts';
let viewModel = readFileSync(viewModelFile, 'utf8');
const viewModelMarker = "export function getPublicTimetableMeetingRows(): readonly PublicTimetableMeetingRow[] {\n  return meetingListDataset.meetings;\n}\n";
if (!viewModel.includes(viewModelMarker)) throw new Error('public timetable view model marker missing');
viewModel = viewModel.replace(
  viewModelMarker,
  "export function getPublicTimetableGeneratedAt(): string {\n  return meetingListDataset.generated_at;\n}\n\n" + viewModelMarker
);
writeFileSync(viewModelFile, viewModel);

const pageFile = 'src/components/CountryDetailPage.astro';
let page = readFileSync(pageFile, 'utf8');
const importMarker = "} from '../lib/data';\n";
if (!page.includes(importMarker)) throw new Error('CountryDetailPage import marker missing');
page = page.replace(
  importMarker,
  importMarker + "import {\n  getPublicTimetableGeneratedAt,\n  getPublicTimetableMeetingRowsByCountry\n} from '../lib/timetable/publicTimetableViewModel';\n"
);

const blockPattern = /const timetableData = siteData\.generated\.timetables;[\s\S]*?const outOfWindowRecords = timetableRecords\.length - activeWindowRecords\.length;/;
if (!blockPattern.test(page)) throw new Error('CountryDetailPage legacy timetable block missing');
const replacement = `const timetableRecords = getPublicTimetableMeetingRowsByCountry(country.id).map((record) => ({
  meeting_id: record.meeting_id,
  date: record.date,
  country_id: record.country_id,
  authority_id: record.authority_id,
  racecourse_id: record.racecourse_id,
  racing_type: record.authority_id,
  start_time_local: record.first_race_time_local,
  timezone: record.timezone,
  source_url: record.official_source_url,
  detail_path: record.detail_path
}));
const countryInventory = siteData.countryRacingInventory.countries.find((entry) => entry.country_id === country.id);
const generatedDate = getPublicTimetableGeneratedAt().slice(0, 10);
const windowStart = generatedDate ? new Date(generatedDate + 'T00:00:00.000Z') : null;
const windowEnd = windowStart
  ? new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate() + 30))
  : null;
const activeWindowRecords = windowStart && windowEnd
  ? timetableRecords.filter((record) => {
      const recordDate = new Date(record.date + 'T00:00:00.000Z');
      return recordDate >= windowStart && recordDate < windowEnd;
    })
  : [];
const upcomingMeetings = [...activeWindowRecords].sort((a, b) =>
  ((a.date ?? '') + '-' + (a.start_time_local ?? '')).localeCompare(
    (b.date ?? '') + '-' + (b.start_time_local ?? '')
  )
);
const primaryMeetings = upcomingMeetings.slice(0, 8);
const remainingMeetings = upcomingMeetings.slice(8);
const outOfWindowRecords = timetableRecords.length - activeWindowRecords.length;`;
page = page.replace(blockPattern, replacement);
writeFileSync(pageFile, page);

console.log('COUNTRY_DETAIL_PUBLIC_TIMETABLE_APPLIED');
