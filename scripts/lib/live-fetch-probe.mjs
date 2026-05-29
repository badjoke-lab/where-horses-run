function nowIso() {
  return new Date().toISOString();
}

function safeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function headerValue(headers, name) {
  try {
    return safeString(headers?.get?.(name), '');
  } catch {
    return '';
  }
}

function publicErrorMessage(error) {
  return safeString(error?.message, 'unknown error').replace(/\s+/g, ' ').slice(0, 180);
}

export async function probeSourceUrl(source, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 10000;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const startedAt = safeString(options.startedAt, nowIso());
  const startedMs = Date.now();

  const base = {
    source_id: safeString(source?.id, 'unknown-source'),
    country_id: safeString(source?.country_id, 'unknown-country'),
    source_url: safeString(source?.url),
    checked_at: startedAt,
    live_network_enabled: true,
    probe_only: true,
    raw_content_saved: false,
    body_read: false,
    body_bytes_saved: 0,
    generated_files_written: false
  };

  if (typeof fetchImpl !== 'function') {
    return {
      ...base,
      status: 'network_unavailable',
      ok: false,
      http_status: null,
      content_type: '',
      final_url: base.source_url,
      redirected: false,
      duration_ms: Date.now() - startedMs,
      message: 'Fetch API is not available in this runtime.'
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(base.source_url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'WhereHorsesRun/0.1 live-fetch-probe'
      }
    });

    if (response?.body && typeof response.body.cancel === 'function') {
      await response.body.cancel().catch(() => {});
    }

    const httpStatus = Number.isFinite(response?.status) ? response.status : null;
    const contentType = headerValue(response?.headers, 'content-type');

    return {
      ...base,
      status: response?.ok ? 'reachable' : 'http_response',
      ok: Boolean(response?.ok),
      http_status: httpStatus,
      content_type: contentType,
      final_url: safeString(response?.url, base.source_url),
      redirected: Boolean(response?.redirected),
      duration_ms: Date.now() - startedMs,
      message: response?.ok
        ? 'Live fetch probe reached the official source. Response body was not read or saved.'
        : 'Live fetch probe received an HTTP response. Response body was not read or saved.'
    };
  } catch (error) {
    return {
      ...base,
      status: 'network_error',
      ok: false,
      http_status: null,
      content_type: '',
      final_url: base.source_url,
      redirected: false,
      duration_ms: Date.now() - startedMs,
      message: publicErrorMessage(error)
    };
  } finally {
    clearTimeout(timer);
  }
}
