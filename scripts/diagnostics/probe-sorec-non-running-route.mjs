import fs from 'node:fs';
import crypto from 'node:crypto';
import { parseSorecProgrammeReunionHtml } from '../timetable/sorec-programme-reunion-core.mjs';

const PROGRAMME_URL = 'https://www.sorec-galop.ma/pages/programmeReunion/programmeReunion.jsf';
const OBSERVED_POSITIVE_DATES = Object.freeze([
  { date: '20/09/26', iso_date: '2026-09-20', venue_label: 'Marrakech', source_basis: 'official_programme_reunion_crawl_2026-09-22' },
  { date: '19/09/26', iso_date: '2026-09-19', venue_label: 'Casablanca', source_basis: 'official_programme_reunion_crawl_2026-09-22' },
  { date: '18/09/26', iso_date: '2026-09-18', venue_label: 'Settat', source_basis: 'official_programme_reunion_crawl_2026-09-22' },
  { date: '17/09/26', iso_date: '2026-09-17', venue_label: 'Meknes', source_basis: 'official_programme_reunion_crawl_2026-09-22' },
]);

let primaryCalendarHtml = null;

const TARGETS = [
  {
    name: 'calendar_with_fctid',
    required: true,
    url: 'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf?fctID=2nQEdyraO%2Bg%3D',
  },
  {
    name: 'calendar_base',
    required: false,
    url: 'https://www.sorec-galop.ma/pages/course_a_venir/calendrier_course.jsf',
  },
];

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&agrave;/gi, 'à')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function bounded(value, limit = 700) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length <= limit ? text : text.slice(0, limit) + '…';
}

function extractRows(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const raw = match[0];
    const text = decodeHtml(raw);
    if (!text) continue;
    if (/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\b|Réunion reportée|Resultat definitif|Résultat définitif|Prochaine réunion/i.test(text)) {
      rows.push({
        text: bounded(text, 900),
        opening_tag: bounded((raw.match(/^<tr\b[^>]*>/i) || [''])[0], 300),
        classes: [...raw.matchAll(/class\s*=\s*['"]([^'"]+)['"]/gi)].map((m) => m[1]).slice(0, 12),
      });
    }
    if (rows.length >= 30) break;
  }
  return rows;
}

function extractLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1];
    const href = (attrs.match(/href\s*=\s*['"]([^'"]+)['"]/i) || [])[1] ?? null;
    const text = decodeHtml(match[2]);
    if (/fctID|calendrier|programme|report/i.test(String(href)) || /report|calendrier|programme/i.test(text)) {
      links.push({ href, text: bounded(text, 300), attrs: bounded(attrs, 400) });
    }
    if (links.length >= 50) break;
  }
  return links;
}

function extractForms(html) {
  return [...html.matchAll(/<form\b([^>]*)>/gi)].slice(0, 20).map((match) => ({
    action: (match[1].match(/action\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? null,
    method: (match[1].match(/method\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? null,
    id: (match[1].match(/id\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? null,
    attrs: bounded(match[1], 500),
  }));
}

function extractHiddenInputs(html) {
  const values = [];
  for (const match of html.matchAll(/<input\b([^>]*)>/gi)) {
    const attrs = match[1];
    const type = (attrs.match(/type\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? '';
    if (type.toLowerCase() !== 'hidden') continue;
    values.push({
      name: (attrs.match(/name\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? null,
      id: (attrs.match(/id\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? null,
      value: bounded((attrs.match(/value\s*=\s*['"]([^'"]*)['"]/i) || [])[1] ?? '', 350),
    });
    if (values.length >= 80) break;
  }
  return values;
}

function reporteeContext(html) {
  const plain = decodeHtml(html);
  const folded = plain.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const needle = 'reunion reportee';
  const index = folded.indexOf(needle);
  if (index < 0) return null;
  return bounded(plain.slice(Math.max(0, index - 700), index + 1400), 2200);
}

function extractMarkerContexts(html) {
  const markers = [
    'form:idCalendrier_input',
    'idCalendrier',
    'customCalendar',
    'PrimeFaces',
    'fullCalendar',
    'eventSources',
    'Réunion reportée',
    'reunion reportee',
  ];
  const contexts = [];
  const lower = html.toLowerCase();
  for (const marker of markers) {
    const index = lower.indexOf(marker.toLowerCase());
    if (index < 0) continue;
    contexts.push({
      marker,
      context: bounded(html.slice(Math.max(0, index - 1200), index + 2600), 3800),
    });
  }
  return contexts;
}

function extractScripts(html) {
  const scripts = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const body = match[2];
    const src = (attrs.match(/src\s*=\s*['"]([^'"]+)['"]/i) || [])[1] ?? null;
    if (src || /idCalendrier|customCalendar|PrimeFaces|fullCalendar|eventSources|report/i.test(body)) {
      scripts.push({
        src,
        attrs: bounded(attrs, 500),
        body: src ? null : bounded(body, 4200),
      });
    }
    if (scripts.length >= 40) break;
  }
  return scripts;
}

function extractJoursEvenementDiagnostics(html) {
  const text = String(html ?? '');
  const assignment = text.match(/joursEvenement\s*=\s*(\[\[[\s\S]*?\]\])\s*;/i);
  if (!assignment) return { found: false, report_records: [], logic_context: null };

  const rawArray = assignment[1];
  const allEvents = [];
  for (const match of rawArray.matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\]/g)) {
    allEvents.push({ calendar_key: match[1], status: match[2], message: decodeHtml(match[3]) });
  }

  function decodeCalendarKey(key) {
    const value = String(key);
    if (!/^\d{7,8}$/.test(value)) return null;
    const year = Number(value.slice(-4));
    const monthCode = Number(value.slice(-6, -4));
    const day = Number(value.slice(0, -6));
    const month = monthCode - 10;
    const iso = String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const parsed = new Date(iso + 'T00:00:00Z');
    return Number.isInteger(day) && day >= 1 && day <= 31 && month >= 1 && month <= 12
      && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
  }

  const statusesByKey = new Map();
  for (const event of allEvents) {
    if (!statusesByKey.has(event.calendar_key)) statusesByKey.set(event.calendar_key, []);
    statusesByKey.get(event.calendar_key).push(event.status);
  }

  const reportRecords = [];
  for (const event of allEvents.filter((row) => row.status === 'REPOR')) {
    const message = event.message;
    const siblingStatuses = statusesByKey.get(event.calendar_key) ?? [];
    reportRecords.push({
      calendar_key: event.calendar_key,
      calendar_date: decodeCalendarKey(event.calendar_key),
      sibling_statuses: siblingStatuses,
      report_only_on_date: siblingStatuses.length > 0 && siblingStatuses.every((status) => status === 'REPOR'),
      message,
      message_dates: [...message.matchAll(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g)].map((m) => m[1]),
      venue: (message.match(/hippodrome\s+(.+)$/i) || [])[1]?.trim() ?? null,
      contains_du_date: /\bdu\s+\d{1,2}\/\d{1,2}\/\d{2,4}\b/i.test(message),
      contains_au_date: /\bau\s+\d{1,2}\/\d{1,2}\/\d{2,4}\b/i.test(message),
    });
  }

  const end = assignment.index + assignment[0].length;
  const suffix = text.slice(end, end + 12000);
  const logicMatches = [];
  for (const pattern of [
    /specialDays\s*=\s*function[\s\S]{0,3500}?\}/i,
    /function\s+specialDays[\s\S]{0,3500}?\}/i,
    /joursEvenement[\s\S]{0,4500}?getFullYear\(\)[\s\S]{0,1200}/i,
    /getDate\(\)[\s\S]{0,1200}?getMonth\(\)[\s\S]{0,1200}?getFullYear\(\)/i,
  ]) {
    const match = suffix.match(pattern);
    if (match) logicMatches.push(bounded(match[0], 6000));
  }

  return {
    found: true,
    report_record_count: reportRecords.length,
    report_records: reportRecords.slice(0, 80),
    logic_context: logicMatches.length ? logicMatches : [bounded(suffix, 8000)],
  };
}

function parseAttributes(value) {
  const attrs = {};
  for (const match of String(value ?? '').matchAll(/([A-Za-z_:][\w:.-]*)\s*=\s*(['"])([\s\S]*?)\2/g)) {
    attrs[match[1]] = match[3];
  }
  return attrs;
}

function formState(html) {
  const match = String(html).match(/<form\b([^>]*)\bid=(['"])form\2([^>]*)>([\s\S]*?)<\/form>/i);
  if (!match) throw new Error('SOREC calendar form#form not found');
  const attrs = parseAttributes(match[1] + match[3]);
  const values = new URLSearchParams();
  for (const input of match[4].matchAll(/<input\b([^>]*)>/gi)) {
    const inputAttrs = parseAttributes(input[1]);
    if (!inputAttrs.name) continue;
    values.set(inputAttrs.name, inputAttrs.value ?? '');
  }
  values.set('form', 'form');
  return { action: attrs.action ?? null, values };
}

function isoToCalendarDate(value) {
  const match = String(value).match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  return match ? match[3] + '/' + match[2] + '/' + match[1].slice(2) : null;
}

function programmeDateSamples(html) {
  const parsed = parseSorecProgrammeReunionHtml(html);
  return parsed.records
    .slice(-5)
    .reverse()
    .map((record) => ({
      date: isoToCalendarDate(record.date),
      iso_date: record.date,
      venue_label: record.venue_label,
      racecourse_id: record.racecourse_id,
    }))
    .filter((record) => record.date);
}

function parsePartialResponse(xml) {
  const updates = [];
  for (const match of String(xml).matchAll(/<update\b[^>]*\bid=(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/update>/gi)) {
    const raw = match[3].replace(/^<!\[CDATA\[|\]\]>$/g, '');
    const text = decodeHtml(raw);
    updates.push({
      id: match[2],
      text: bounded(text, 1600),
      raw_context: bounded(raw, 2400),
      fingerprints: {
        reunion_reportee: /Réunion\s+reportée/i.test(text),
        report_class_or_id: /(?:id|class)\s*=\s*['"][^'"]*report/i.test(raw),
        venue: /Casablanca|Mekn(?:e|è)s|Marrakech|Rabat|Settat|El\s+Jadida|Khemisset/i.test(text),
      },
    });
  }
  return updates;
}

async function fetchProgrammeSamples() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(PROGRAMME_URL, {
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    const html = await response.text();
    let dates = [];
    let parse_error = null;
    if (response.ok) {
      try {
        dates = programmeDateSamples(html);
      } catch (error) {
        parse_error = error instanceof Error ? error.message : String(error);
      }
    }
    if (dates.length === 0) dates = [...OBSERVED_POSITIVE_DATES];
    return {
      status: response.status,
      ok: response.ok,
      bytes: Buffer.byteLength(html),
      parse_error,
      dates,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), dates: [...OBSERVED_POSITIVE_DATES] };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCalendarSession(sourceUrl) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
          accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      const html = await response.text();
      if (response.ok && /form:idCalendrier/i.test(html) && /javax\.faces\.ViewState/i.test(html)) {
        return { ok: true, attempt, status: response.status, html };
      }
      lastError = 'unexpected calendar session response HTTP ' + response.status;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, error: lastError ?? 'calendar session fetch failed' };
}

async function exerciseDateSelect({ sourceUrl, html, date, expectedVenue }) {
  const state = formState(html);
  if (!state.action) throw new Error('SOREC calendar form action missing');
  const action = new URL(state.action.replace(/&amp;/g, '&'), sourceUrl).toString();
  const params = new URLSearchParams(state.values);
  params.set('form:idCalendrier_input', date);
  params.set('javax.faces.partial.ajax', 'true');
  params.set('javax.faces.source', 'form:idCalendrier');
  params.set('javax.faces.partial.execute', 'form:idCalendrier');
  params.set('javax.faces.partial.render', 'form:panelRacine form:panelInfosUser form:idData');
  params.set('javax.faces.behavior.event', 'dateSelect');
  params.set('javax.faces.partial.event', 'dateSelect');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(action, {
      method: 'POST',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'application/xml, text/xml, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'faces-request': 'partial/ajax',
        'x-requested-with': 'XMLHttpRequest',
        referer: sourceUrl,
      },
      body: params.toString(),
      redirect: 'follow',
      signal: controller.signal,
    });
    const body = await response.text();
    const updates = parsePartialResponse(body);
    const plain = decodeHtml(body);
    return {
      date,
      expected_venue: expectedVenue,
      action_url: action,
      status: response.status,
      ok: response.ok,
      content_type: response.headers.get('content-type'),
      bytes: Buffer.byteLength(body),
      partial_response: /<partial-response\b/i.test(body),
      update_ids: updates.map((item) => item.id),
      expected_venue_visible: expectedVenue ? plain.toLowerCase().includes(String(expectedVenue).toLowerCase()) : null,
      reunion_reportee_visible: /Réunion\s+reportée/i.test(plain),
      report_marker_visible: /(?:id|class)\s*=\s*['"][^'"]*report/i.test(body),
      updates,
      body_head: bounded(body, 1800),
    };
  } catch (error) {
    return {
      date,
      expected_venue: expectedVenue,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHtml(target) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(target.url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    const html = await response.text();
    if (target.name === 'calendar_with_fctid' && response.ok) primaryCalendarHtml = html;
    const plain = decodeHtml(html);
    const result = {
      name: target.name,
      required: target.required,
      requested_url: target.url,
      final_url: response.url,
      status: response.status,
      ok: response.ok,
      content_type: response.headers.get('content-type'),
      bytes: Buffer.byteLength(html),
      sha256: crypto.createHash('sha256').update(html).digest('hex'),
      fingerprints: {
        calendrier_des_courses: /Calendrier\s+des\s+courses/i.test(plain),
        reunion_reportee: /Réunion\s+reportée/i.test(plain),
        programme_des_courses: /Programme\s+des\s+Courses/i.test(plain),
        jsf_view_state: /javax\.faces\.ViewState/i.test(html),
      },
      reportee_context: reporteeContext(html),
      row_samples: extractRows(html),
      form_samples: extractForms(html),
      hidden_inputs: extractHiddenInputs(html),
      link_samples: extractLinks(html),
      marker_contexts: extractMarkerContexts(html),
      script_samples: extractScripts(html),
      jours_evenement: extractJoursEvenementDiagnostics(html),
    };
    return result;
  } catch (error) {
    return {
      name: target.name,
      required: target.required,
      requested_url: target.url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const target of TARGETS) results.push(await fetchHtml(target));

const programme = await fetchProgrammeSamples();
const primary = results.find((result) => result.name === 'calendar_with_fctid' && result.ok);
const date_select_probes = [];
if (primary && primaryCalendarHtml && programme.dates.length > 0) {
  const sample = programme.dates[0];
  const result = await exerciseDateSelect({
    sourceUrl: primary.final_url,
    html: primaryCalendarHtml,
    date: sample.date,
    expectedVenue: sample.venue_label,
  });
  date_select_probes.push({ ...result, session_basis: 'initial_successful_calendar_get' });
}

const artifact = {
  schema_version: 'sorec-non-running-route-probe-v1',
  probe_revision: 'jsf-date-select-v9-report-only-date-safety',
  generated_at: new Date().toISOString(),
  purpose: 'Diagnose the official SOREC calendar route for explicit meeting-level Réunion reportée evidence. No source absence is treated as cancellation.',
  results,
  programme,
  date_select_probes,
};

fs.writeFileSync('probe-sorec-non-running.json', JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify(artifact, null, 2));

const requiredFailures = results.filter((result) => result.required && !result.ok);
if (requiredFailures.length) {
  throw new Error('Required SOREC calendar route was not fetchable from GitHub Actions');
}
