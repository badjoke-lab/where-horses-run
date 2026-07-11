const routes = [
  {
    article_label: 'Meydan Racecourse',
    page_label: 'Meydan',
    slug: 'meydan',
  },
  {
    article_label: 'Abu Dhabi Turf Club',
    page_label: 'Abu Dhabi',
    slug: 'abu-dhabi-turf-club',
  },
  {
    article_label: 'Al Ain Racecourse',
    page_label: 'Al Ain',
    slug: 'al-ain',
  },
  {
    article_label: 'Jebel Ali Racecourse',
    page_label: 'Jebel Ali',
    slug: 'jebel-ali',
  },
  {
    article_label: 'Sharjah Racecourse',
    page_label: 'Sharjah',
    slug: 'sharjah',
  },
];

function visibleText(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public timetable research; review-artifacts-only)',
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

const pages = [];
for (const route of routes) {
  const requestedUrl = `https://emiratesracing.com/racecourses/${route.slug}`;
  const response = await fetchWithTimeout(requestedUrl);
  const html = await response.text();
  const text = visibleText(html);
  pages.push({
    article_label: route.article_label,
    page_label: route.page_label,
    slug: route.slug,
    requested_url: requestedUrl,
    http_status: response.status,
    response_ok: response.ok,
    final_url: response.url,
    final_host: new URL(response.url).hostname.toLowerCase(),
    response_bytes: Buffer.byteLength(html),
    page_label_observed: text.includes(route.page_label),
    raw_html_stored: false,
  });
}

const summary = {
  schema_version: 'calendar-uae-era-pilot-03-venue-page-evidence-summary-v1',
  work_id: 'WHR-CAL-UAE-ERA',
  implementation_unit: 'UAE-PILOT-03',
  checked_at: new Date().toISOString(),
  pages,
  page_count: pages.length,
  all_pages_reachable: pages.every((page) => page.response_ok === true && page.http_status === 200),
  all_final_hosts_official: pages.every((page) => page.final_host === 'emiratesracing.com'),
  all_page_labels_observed: pages.every((page) => page.page_label_observed === true),
  raw_html_stored: false,
};

console.log(JSON.stringify(summary, null, 2));
