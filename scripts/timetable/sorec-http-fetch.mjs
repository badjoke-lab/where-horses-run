// SOREC anonymous official GET: one bounded retry for transient transport/5xx
// failures. Never retry access refusal (403), rate limiting (429), or 4xx.
const RETRYABLE_HTTP = new Set([500, 502, 503, 504]);
export function mayRetrySorecFetch(error) {
  const code = error?.httpStatus;
  return code == null || RETRYABLE_HTTP.has(code);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function fetchSorecHtml(url, label, {
  request = fetch,
  sleep = delay,
  timeoutMs = 20_000,
} = {}) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await request(url, {
        headers: {
          'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
          accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`${label} returned HTTP ${response.status}`);
        error.httpStatus = response.status;
        throw error;
      }
      return await response.text();
    } catch (error) {
      if (attempt === 2 || !mayRetrySorecFetch(error)) throw error;
    } finally {
      clearTimeout(timer);
    }
    // No IP/proxy rotation, impersonation, credentials, CAPTCHA or 403/429 bypass.
    await sleep(1_200);
  }
}
