import { buildUaeEraArticleArtifacts, UAE_ERA_SEASON_ARTICLE_V1 } from './uae-era-season-article-parser-core.mjs';

const timeoutMs = 20000;

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public timetable research; review-artifacts-only)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const body = await response.text();
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

async function probePdf(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+public timetable research; review-artifacts-only)',
        accept: 'application/pdf,*/*;q=0.8',
      },
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      requested_url: url,
      http_status: response.status,
      response_ok: response.ok,
      final_url: response.url,
      final_host: new URL(response.url).hostname.toLowerCase(),
      content_type: response.headers.get('content-type'),
      response_bytes: bytes.length,
      pdf_magic: bytes.subarray(0, 5).toString('ascii') === '%PDF-',
      raw_pdf_stored: false,
    };
  } catch (error) {
    return {
      requested_url: url,
      network_error: String(error?.cause?.code ?? error?.message ?? error),
      raw_pdf_stored: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

const checkedAt = new Date().toISOString();
const articleResult = await fetchText(UAE_ERA_SEASON_ARTICLE_V1.article_url);
if (!articleResult.response.ok) throw new Error(`ERA article returned HTTP ${articleResult.response.status}`);
if (new URL(articleResult.response.url).hostname.toLowerCase() !== 'emiratesracing.com') throw new Error('ERA article redirected away from official host');

const built = buildUaeEraArticleArtifacts({
  html: articleResult.body,
  generatedAt: checkedAt,
  checkedAt,
  batchId: 'uae-era-pilot-02-live-article-evidence',
  campaignId: 'uae-era-stage-10-pilot',
  jobId: 'uae-era-pilot-02-live-article-evidence-job',
});
const { observation, artifacts } = built;
const pdfProbe = await probePdf(UAE_ERA_SEASON_ARTICLE_V1.pdf_url);

const summary = {
  schema_version: 'calendar-uae-era-pilot-02-source-route-evidence-summary-v1',
  work_id: 'WHR-CAL-UAE-ERA',
  implementation_unit: 'UAE-PILOT-02',
  checked_at: checkedAt,
  article_route: {
    requested_url: UAE_ERA_SEASON_ARTICLE_V1.article_url,
    http_status: articleResult.response.status,
    response_ok: articleResult.response.ok,
    final_url: articleResult.response.url,
    final_host: new URL(articleResult.response.url).hostname.toLowerCase(),
    response_bytes: Buffer.byteLength(articleResult.body),
    season_start_year: observation.season_start_year,
    season_end_year: observation.season_end_year,
    opening_date: observation.opening_date,
    opening_venue_label: observation.opening_venue_label,
    closing_date: observation.closing_date,
    total_race_meetings: observation.total_race_meetings,
    total_racecourses: observation.total_racecourses,
    venue_meeting_counts: observation.venue_meeting_counts,
    venue_count_sum: observation.venue_count_sum,
    mapped_meeting_ids: observation.mapped_meetings.map((meeting) => meeting.meeting_id),
    unresolved_venue_observations: observation.unresolved_venue_observations,
    pdf_url_observed: observation.pdf_url,
    raw_html_stored: false,
  },
  candidate_artifacts: {
    records_discovered: artifacts.manifest.records_discovered,
    records_updated: artifacts.manifest.records_updated,
    rank_counts: artifacts.manifest.rank_counts,
    coverage_claim: artifacts.coverage.coverage_claim,
    unresolved_dates: artifacts.coverage.unresolved_dates,
    source_error_count: artifacts.coverage.source_errors.length,
    candidate_review_state: artifacts.candidate.review.status,
    promotion_target: artifacts.candidate.review.promotion_target,
    registry_activation: artifacts.report.registry_activation,
    canonical_write: artifacts.report.canonical_write,
    public_write: artifacts.report.public_write,
    publication_effect: artifacts.report.publication_effect,
  },
  pdf_route: pdfProbe,
  boundaries: {
    raw_html_stored: false,
    raw_pdf_stored: false,
    registry_activation: false,
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
    canonical_write: false,
    public_write: false,
  },
};

console.log(JSON.stringify(summary, null, 2));
