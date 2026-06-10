import fs from 'node:fs';

const files = [
  'data/generated/timetable/nar-racecard-source-snapshot.json',
  'data/generated/timetable/nar-normalized-meeting-details.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-details.json',
];

function read(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function write(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function decode(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function officialNameFromDetail(html) {
  const plain = decode(html);
  const match = plain.match(
    /第\s*\d{1,2}\s*競走\s*\d{1,2}\s*[:：]\s*\d{2}\s*発走\s+(.+?)\s+(?:ダート|芝|障害)\s*\d{3,4}\s*[mｍＭ]/,
  );
  return match?.[1]?.trim() || null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0',
      'accept-language': 'ja,en-US;q=0.8,en;q=0.6',
    },
  });
  const buffer = await response.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  const sjis = new TextDecoder('shift_jis').decode(buffer);
  const text = utf8.includes('競馬') ? utf8 : sjis;
  return { status: response.status, text };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replaceRows(rows, names) {
  let changed = 0;
  const next = rows.map((row, index) => {
    const name = names.get(index + 1);
    if (!name || name === row.race_name) return row;
    changed += 1;
    return { ...row, race_name: name };
  });
  return { rows: next, changed };
}

const snapshot = read(files[0]);
const byMeeting = new Map();
const report = [];

for (const observation of snapshot.observations ?? []) {
  const meeting = observation.meeting;
  if (!meeting?.meeting_id) continue;

  const names = new Map();
  const raceReports = [];

  for (let index = 0; index < (meeting.timetable_rows ?? []).length; index += 1) {
    const row = meeting.timetable_rows[index];
    const raceNumber = index + 1;
    const detailUrl = row.detail_url;
    if (!detailUrl) {
      raceReports.push({ race_number: raceNumber, status: null, official_name: null, reason: 'missing_detail_url' });
      continue;
    }

    await sleep(80);
    const source = await fetchText(detailUrl);
    const officialName = source.status === 200 ? officialNameFromDetail(source.text) : null;
    if (officialName) names.set(raceNumber, officialName);
    raceReports.push({
      race_number: raceNumber,
      status: source.status,
      official_name: officialName,
      detail_url: detailUrl,
    });
  }

  byMeeting.set(meeting.meeting_id, names);
  const result = replaceRows(meeting.timetable_rows ?? [], names);
  meeting.timetable_rows = result.rows;
  report.push({
    meeting_id: meeting.meeting_id,
    names_found: names.size,
    rows_changed: result.changed,
    unresolved_generic_names: meeting.timetable_rows
      .map((row, index) => ({ race_number: index + 1, race_name: row.race_name }))
      .filter((row) => /^(?:特別|重賞)$/.test(row.race_name ?? '')),
    races: raceReports,
  });
}

write(files[0], snapshot);

for (const file of files.slice(1)) {
  const data = read(file);
  for (const detail of data.details ?? []) {
    const names = byMeeting.get(detail.meeting_id);
    if (!names) continue;
    detail.timetable_rows = replaceRows(detail.timetable_rows ?? [], names).rows;
  }
  write(file, data);
}

write('data/generated/timetable/nar-race-name-repair-report.json', {
  generated_at: new Date().toISOString(),
  meetings_checked: report.length,
  total_names_found: report.reduce((total, row) => total + row.names_found, 0),
  total_rows_changed: report.reduce((total, row) => total + row.rows_changed, 0),
  unresolved_generic_names: report.reduce((total, row) => total + row.unresolved_generic_names.length, 0),
  report,
});

console.log(JSON.stringify({
  meetings_checked: report.length,
  total_names_found: report.reduce((total, row) => total + row.names_found, 0),
  total_rows_changed: report.reduce((total, row) => total + row.rows_changed, 0),
  unresolved_generic_names: report.reduce((total, row) => total + row.unresolved_generic_names.length, 0),
}, null, 2));
