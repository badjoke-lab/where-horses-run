import fs from 'node:fs';
import crypto from 'node:crypto';

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

const artifact = {
  schema_version: 'sorec-non-running-route-probe-v1',
  generated_at: new Date().toISOString(),
  purpose: 'Diagnose the official SOREC calendar route for explicit meeting-level Réunion reportée evidence. No source absence is treated as cancellation.',
  results,
};

fs.writeFileSync('probe-sorec-non-running.json', JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify(artifact, null, 2));

const requiredFailures = results.filter((result) => result.required && !result.ok);
if (requiredFailures.length) {
  throw new Error('Required SOREC calendar route was not fetchable from GitHub Actions');
}
