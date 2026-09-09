import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = '93f4c2a78d1e6b5c0a9f3d8e7b2c4a61';
const INDEXNOW_KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
const MEETING_LIST_PATH = 'data/generated/timetable/public/meeting-list.json';

function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function isZeroSha(value) {
  return !value || /^0+$/.test(value);
}

function readGitFile(ref, file) {
  if (isZeroSha(ref)) return null;
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function parseMeetingList(text, label) {
  if (!text) return [];
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.meetings)) throw new Error(`${label} does not contain a meetings array.`);
  return parsed.meetings;
}

function comparableMeeting(meeting) {
  return JSON.stringify({
    meeting_id: meeting?.meeting_id ?? null,
    country_id: meeting?.country_id ?? null,
    authority_id: meeting?.authority_id ?? null,
    racecourse_id: meeting?.racecourse_id ?? null,
    date: meeting?.date ?? null,
    timezone: meeting?.timezone ?? null,
    capability_rank: meeting?.capability_rank ?? null,
    max_public_rank: meeting?.max_public_rank ?? null,
    effective_public_rank: meeting?.effective_public_rank ?? null,
    first_race_time_local: meeting?.first_race_time_local ?? null,
    last_race_time_local: meeting?.last_race_time_local ?? null,
    source_status: meeting?.source_status ?? null,
    official_source_url: meeting?.official_source_url ?? null,
    last_checked_date: meeting?.last_checked_date ?? null,
    detail_path: meeting?.detail_path ?? null,
    show_live_label: meeting?.show_live_label ?? false,
    show_replay_label: meeting?.show_replay_label ?? false,
  });
}

function addLocalizedPath(paths, pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return;
  paths.add(pathname);
  if (pathname === '/') paths.add('/ja/');
  else if (!pathname.startsWith('/ja/')) paths.add(`/ja${pathname}`);
}

function addMeetingImpact(paths, meeting) {
  if (!meeting) return;
  addLocalizedPath(paths, meeting.detail_path);
  if (typeof meeting.country_id === 'string' && meeting.country_id) {
    addLocalizedPath(paths, `/countries/${meeting.country_id}/`);
  }
  if (typeof meeting.racecourse_id === 'string' && meeting.racecourse_id) {
    addLocalizedPath(paths, `/tracks/${meeting.racecourse_id}/`);
  }
}

function toAbsoluteUrls(paths) {
  return [...paths]
    .map((pathname) => new URL(pathname, SITE_ORIGIN).toString())
    .sort((left, right) => left.localeCompare(right, 'en'));
}

async function submit(urlList) {
  const payload = {
    host: new URL(SITE_ORIGIN).host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  };
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (response.ok || response.status === 202) {
        console.log(`IndexNow accepted ${urlList.length} changed URLs with status ${response.status}.`);
        return;
      }
      const body = await response.text();
      lastError = new Error(`IndexNow returned ${response.status}: ${body.slice(0, 500)}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('IndexNow submission failed.');
}

const before = argValue('before');
const after = argValue('after') ?? 'HEAD';
const shouldSubmit = process.argv.includes('--submit');
const currentText = after === 'WORKTREE'
  ? await fs.readFile(MEETING_LIST_PATH, 'utf8')
  : readGitFile(after, MEETING_LIST_PATH) ?? await fs.readFile(MEETING_LIST_PATH, 'utf8');
const previousText = readGitFile(before, MEETING_LIST_PATH);
const currentMeetings = parseMeetingList(currentText, `Current ${MEETING_LIST_PATH}`);
const previousMeetings = parseMeetingList(previousText, `Previous ${MEETING_LIST_PATH}`);

const currentById = new Map(currentMeetings.map((meeting) => [meeting.meeting_id, meeting]));
const previousById = new Map(previousMeetings.map((meeting) => [meeting.meeting_id, meeting]));
const allIds = new Set([...currentById.keys(), ...previousById.keys()]);
const changedIds = [...allIds].filter((id) => {
  const current = currentById.get(id);
  const previous = previousById.get(id);
  if (!current || !previous) return true;
  return comparableMeeting(current) !== comparableMeeting(previous);
});

if (!previousText && !isZeroSha(before)) {
  console.warn(`Could not read ${MEETING_LIST_PATH} at ${before}; treating all current meetings as changed.`);
}

const paths = new Set();
if (changedIds.length) {
  addLocalizedPath(paths, '/');
  addLocalizedPath(paths, '/calendar/');
  for (const id of changedIds) {
    addMeetingImpact(paths, currentById.get(id));
    addMeetingImpact(paths, previousById.get(id));
  }
}

const urlList = toAbsoluteUrls(paths);
if (urlList.length > 10000) throw new Error(`IndexNow URL list exceeds 10,000 URLs: ${urlList.length}`);
for (const urlValue of urlList) {
  const url = new URL(urlValue);
  if (url.origin !== SITE_ORIGIN || url.search || url.hash) throw new Error(`Invalid IndexNow URL: ${urlValue}`);
}

console.log(JSON.stringify({
  before: before ?? null,
  after,
  changed_meetings: changedIds.length,
  changed_urls: urlList.length,
  urls: urlList,
}, null, 2));

if (shouldSubmit && urlList.length) await submit(urlList);
else if (shouldSubmit) console.log('No public meeting changes detected; IndexNow submission skipped.');
