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
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesFromHtml(html) {
  const names = new Map();
  for (const row of html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    for (const anchor of row[0].matchAll(/<a\b[^>]*href=["']([^"']*DebaTable[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = anchor[1].replace(/&amp;/g, '&');
      const no = href.match(/[?&]k_raceNo=(\d{1,2})(?:&|$)/i);
      const name = decode(anchor[2]);
      if (!no || !name || /^(出馬表|詳細)$/.test(name)) continue;
      const raceNo = Number(no[1]);
      const current = names.get(raceNo);
      if (!current || name.length > current.length) names.set(raceNo, name);
    }
  }
  return names;
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
  if (!meeting?.meeting_id || !meeting?.official_source_url) continue;
  const source = await fetchText(meeting.official_source_url);
  const names = namesFromHtml(source.text);
  byMeeting.set(meeting.meeting_id, names);
  const result = replaceRows(meeting.timetable_rows ?? [], names);
  meeting.timetable_rows = result.rows;
  report.push({
    meeting_id: meeting.meeting_id,
    status: source.status,
    names_found: names.size,
    rows_changed: result.changed,
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
  report,
});

console.log(JSON.stringify(report, null, 2));
