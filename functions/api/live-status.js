const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const JAPAN_TIME_ZONE = 'Asia/Tokyo';
const DISCOVERY_CACHE_SECONDS = 15 * 60;
const IDLE_STATUS_CACHE_SECONDS = 15 * 60;
const LIVE_STATUS_REFRESH_SECONDS = 60;
const UPCOMING_NEAR_REFRESH_SECONDS = 5 * 60;
const UPCOMING_DAY_REFRESH_SECONDS = 30 * 60;
const UPCOMING_FAR_REFRESH_SECONDS = 60 * 60;
const PLAYLIST_CONCURRENCY = 3;
const RECENT_VIDEO_LIMIT = 10;

// Runtime detectors are separate from public media links. Calendar links stay
// on reviewed official landing pages; these sources only determine live state.
const YOUTUBE_LIVE_DETECTORS = [
  { id: 'jra-youtube-live-2026', channel_id: 'UCj6AKkCWS6FJqf0o5wP45eQ' },
  { id: 'banei-youtube-live-2026', channel_id: 'UCyjlxPcoYAbpwlr5wjUA_5g' },
  { id: 'nar-monbetsu-youtube-live-2026', channel_id: 'UC6tQosgNJOmZUGmtkSvI6zA' },
  { id: 'nar-iwate-youtube-live-2026', handle: '@IwateKeibaITV' },
  { id: 'nar-urawa-youtube-live-2026', channel_id: 'UCdtB0m4BIjadiqV3C0Vi9SQ' },
  { id: 'nar-funabashi-youtube-live-2026', channel_id: 'UCfnIcvhLkVVCTd86yemmGnQ' },
  { id: 'nar-oi-youtube-live-2026', handle: '@tckkeiba' },
  { id: 'nar-kawasaki-youtube-live-2026', channel_id: 'UCF7v-dGy_jQ_7bOi7oab2PA' },
  { id: 'nar-kanazawa-youtube-live-2026', channel_id: 'UCMRX5ABMJWPR6aWlyZYeKog' },
  { id: 'nar-kasamatsu-youtube-live-2026', channel_id: 'UCmPuLUWCwfAW99ezdCj6ayQ' },
  { id: 'nar-nagoya-youtube-live-2026', channel_id: 'UCuAGB0_QDb68etl8v-JcSzA' },
  { id: 'nar-hyogo-youtube-live-2026', handle: '@sonodahimejiweb' },
  { id: 'nar-kochi-youtube-live-2026', handle: '@KeibaOrJp' },
  { id: 'nar-saga-youtube-live-2026', handle: '@sagakeibaofficial' },
];

const safeVideoId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;

const json = (body, status = 200, cacheSeconds = 0) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheSeconds > 0
      ? `public, max-age=30, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
      : 'no-store',
  },
});

const endpointName = (url) => new URL(url).pathname.split('/').filter(Boolean).at(-1) || 'youtube';

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`youtube_${endpointName(url)}_${response.status}`);
  return response.json();
}

const failureCode = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? 'unknown');
  if (/^youtube_[a-zA-Z]+_\d{3}$/.test(message)) return message;
  if (message === 'uploads_playlist_unavailable') return message;
  if (message === 'video_batch_unavailable') return message;
  return 'detector_unavailable';
};

const statusFromVideo = (video) => {
  const content = video?.snippet?.liveBroadcastContent;
  if (content === 'live') return 'live';
  if (content === 'upcoming') return 'upcoming';
  if (video?.liveStreamingDetails?.actualEndTime) return 'ended';
  return 'offline';
};

const japanDateFor = (isoValue) => {
  if (!isoValue) return null;
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: JAPAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  const year = value('year');
  const month = value('month');
  const day = value('day');
  return year && month && day ? `${year}-${month}-${day}` : null;
};

const normalizedStatus = (detector, video = null) => {
  const scheduledStart = video?.liveStreamingDetails?.scheduledStartTime ?? null;
  const actualStart = video?.liveStreamingDetails?.actualStartTime ?? null;
  return {
    detector_id: detector.id,
    media_id: detector.id,
    status: video ? statusFromVideo(video) : 'offline',
    video_id: safeVideoId(video?.id),
    event_date: japanDateFor(actualStart ?? scheduledStart),
    scheduled_start_at: scheduledStart,
    checked_at: new Date().toISOString(),
  };
};

const internalCacheKey = (request, namespace) => {
  const origin = new URL(request.url).origin;
  return new Request(`${origin}/api/live-status/__cache/${namespace}/v3`, { method: 'GET' });
};

async function readCachedJson(cache, key) {
  const response = await cache.match(key);
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function storeCachedJson(cache, key, value, ttl, waitUntil) {
  const response = new Response(JSON.stringify(value), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${ttl}`,
    },
  });
  const operation = cache.put(key, response);
  if (typeof waitUntil === 'function') waitUntil(operation);
  else return operation;
  return undefined;
}

const chunks = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { status: 'fulfilled', value: await mapper(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function resolveUploadsPlaylists(apiKey) {
  const playlistByDetector = new Map();
  const failures = new Map();
  const fixed = YOUTUBE_LIVE_DETECTORS.filter((detector) => detector.channel_id);
  const handles = YOUTUBE_LIVE_DETECTORS.filter((detector) => detector.handle);

  if (fixed.length) {
    try {
      const url = new URL(`${YOUTUBE_API}/channels`);
      url.searchParams.set('part', 'contentDetails');
      url.searchParams.set('id', fixed.map((detector) => detector.channel_id).join(','));
      url.searchParams.set('key', apiKey);
      const payload = await fetchJson(url);
      const byChannelId = new Map((Array.isArray(payload?.items) ? payload.items : []).map((item) => [item?.id, item]));
      for (const detector of fixed) {
        const uploads = byChannelId.get(detector.channel_id)?.contentDetails?.relatedPlaylists?.uploads;
        if (typeof uploads === 'string') playlistByDetector.set(detector.id, uploads);
        else failures.set(detector.id, 'uploads_playlist_unavailable');
      }
    } catch (error) {
      const code = failureCode(error);
      for (const detector of fixed) failures.set(detector.id, code);
    }
  }

  for (const detector of handles) {
    try {
      const url = new URL(`${YOUTUBE_API}/channels`);
      url.searchParams.set('part', 'contentDetails');
      url.searchParams.set('forHandle', detector.handle);
      url.searchParams.set('key', apiKey);
      const payload = await fetchJson(url);
      const uploads = payload?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (typeof uploads !== 'string') throw new Error('uploads_playlist_unavailable');
      playlistByDetector.set(detector.id, uploads);
    } catch (error) {
      failures.set(detector.id, failureCode(error));
    }
  }

  return { playlistByDetector, failures };
}

async function discoverSnapshot(apiKey) {
  const { playlistByDetector, failures } = await resolveUploadsPlaylists(apiKey);
  const playableDetectors = YOUTUBE_LIVE_DETECTORS.filter((detector) => playlistByDetector.has(detector.id));
  const playlistResults = await mapWithConcurrency(playableDetectors, PLAYLIST_CONCURRENCY, async (detector) => {
    const url = new URL(`${YOUTUBE_API}/playlistItems`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', playlistByDetector.get(detector.id));
    url.searchParams.set('maxResults', String(RECENT_VIDEO_LIMIT));
    url.searchParams.set('key', apiKey);
    const payload = await fetchJson(url);
    return (Array.isArray(payload?.items) ? payload.items : [])
      .map((item) => safeVideoId(item?.contentDetails?.videoId))
      .filter(Boolean);
  });

  const videoIdsByDetector = new Map();
  for (let index = 0; index < playableDetectors.length; index += 1) {
    const detector = playableDetectors[index];
    const result = playlistResults[index];
    if (result?.status === 'fulfilled') videoIdsByDetector.set(detector.id, result.value);
    else failures.set(detector.id, failureCode(result?.reason));
  }

  const allVideoIds = [...new Set([...videoIdsByDetector.values()].flat())];
  const videoById = new Map();
  for (const batch of chunks(allVideoIds, 50)) {
    if (!batch.length) continue;
    const url = new URL(`${YOUTUBE_API}/videos`);
    url.searchParams.set('part', 'snippet,liveStreamingDetails');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('key', apiKey);
    try {
      const payload = await fetchJson(url);
      for (const video of Array.isArray(payload?.items) ? payload.items : []) {
        if (safeVideoId(video?.id)) videoById.set(video.id, video);
      }
    } catch {
      for (const [detectorId, ids] of videoIdsByDetector) {
        if (ids.some((id) => batch.includes(id))) failures.set(detectorId, 'video_batch_unavailable');
      }
    }
  }

  const statuses = [];
  const activeByDetector = {};
  for (const detector of YOUTUBE_LIVE_DETECTORS) {
    if (failures.has(detector.id)) continue;
    const ids = videoIdsByDetector.get(detector.id) ?? [];
    const videos = ids.map((id) => videoById.get(id)).filter(Boolean);
    const active = videos.find((video) => video?.snippet?.liveBroadcastContent === 'live')
      ?? videos.find((video) => video?.snippet?.liveBroadcastContent === 'upcoming')
      ?? null;
    const status = normalizedStatus(detector, active);
    statuses.push(status);
    if (status.video_id) activeByDetector[detector.id] = status.video_id;
  }

  return {
    statuses,
    active_by_detector: activeByDetector,
    failures: Object.fromEntries(failures),
    discovered_at: new Date().toISOString(),
  };
}

async function refreshActiveStatuses(apiKey, snapshot) {
  const activeEntries = Object.entries(snapshot?.active_by_detector ?? {})
    .filter(([, videoId]) => safeVideoId(videoId));
  if (!activeEntries.length) return snapshot.statuses ?? [];

  const url = new URL(`${YOUTUBE_API}/videos`);
  url.searchParams.set('part', 'snippet,liveStreamingDetails');
  url.searchParams.set('id', activeEntries.map(([, videoId]) => videoId).join(','));
  url.searchParams.set('key', apiKey);
  const payload = await fetchJson(url);
  const videoById = new Map((Array.isArray(payload?.items) ? payload.items : []).map((video) => [video?.id, video]));
  const activeMap = new Map(activeEntries);
  const detectorById = new Map(YOUTUBE_LIVE_DETECTORS.map((detector) => [detector.id, detector]));

  return (snapshot.statuses ?? []).map((previous) => {
    const detector = detectorById.get(previous.detector_id);
    const videoId = activeMap.get(previous.detector_id);
    if (!detector || !videoId) return previous;
    const video = videoById.get(videoId);
    return normalizedStatus(detector, video ?? null);
  });
}

const refreshSecondsForStatus = (status, now = Date.now()) => {
  if (status.status === 'live') return LIVE_STATUS_REFRESH_SECONDS;
  if (status.status !== 'upcoming') return null;

  const scheduledStart = Date.parse(status.scheduled_start_at ?? '');
  if (!Number.isFinite(scheduledStart)) return UPCOMING_NEAR_REFRESH_SECONDS;
  const untilStart = scheduledStart - now;
  if (untilStart <= 60 * 60 * 1000) return LIVE_STATUS_REFRESH_SECONDS;
  if (untilStart <= 6 * 60 * 60 * 1000) return UPCOMING_NEAR_REFRESH_SECONDS;
  if (untilStart <= 24 * 60 * 60 * 1000) return UPCOMING_DAY_REFRESH_SECONDS;
  return UPCOMING_FAR_REFRESH_SECONDS;
};

const responseRefreshSecondsFor = (statuses) => {
  const now = Date.now();
  const activeRefreshes = statuses
    .map((status) => refreshSecondsForStatus(status, now))
    .filter((seconds) => Number.isFinite(seconds));
  return activeRefreshes.length ? Math.min(...activeRefreshes) : IDLE_STATUS_CACHE_SECONDS;
};

const edgeCacheSecondsFor = (refreshSeconds) => Math.min(refreshSeconds, DISCOVERY_CACHE_SECONDS);

export async function onRequestGet({ request, env, waitUntil }) {
  const apiKey = env?.YOUTUBE_DATA_API_KEY;
  if (!apiKey) return json({ configured: false, statuses: [], error: 'live_status_unavailable' }, 503);

  const cache = caches.default;
  const statusKey = internalCacheKey(request, 'aggregate-status');
  const cachedStatus = await readCachedJson(cache, statusKey);
  if (cachedStatus?.configured === true && Array.isArray(cachedStatus.statuses)) {
    const refreshSeconds = responseRefreshSecondsFor(cachedStatus.statuses);
    return json(cachedStatus, 200, edgeCacheSecondsFor(refreshSeconds));
  }

  const discoveryKey = internalCacheKey(request, 'aggregate-discovery');
  let snapshot = await readCachedJson(cache, discoveryKey);
  if (!snapshot?.statuses) {
    try {
      snapshot = await discoverSnapshot(apiKey);
      storeCachedJson(cache, discoveryKey, snapshot, DISCOVERY_CACHE_SECONDS, waitUntil);
    } catch (error) {
      return json({
        configured: false,
        statuses: [],
        error: 'live_status_unavailable',
        failure_code: failureCode(error),
      }, 503);
    }
  }

  let statuses;
  try {
    statuses = await refreshActiveStatuses(apiKey, snapshot);
  } catch (error) {
    statuses = snapshot.statuses ?? [];
    snapshot.failures = { ...(snapshot.failures ?? {}), active_refresh: failureCode(error) };
  }

  if (!statuses.length) {
    return json({
      configured: false,
      statuses: [],
      error: 'live_status_unavailable',
      failed_detector_ids: Object.keys(snapshot.failures ?? {}),
      failure_codes: snapshot.failures ?? {},
    }, 503);
  }

  const refreshSeconds = responseRefreshSecondsFor(statuses);
  const edgeCacheSeconds = edgeCacheSecondsFor(refreshSeconds);
  const body = {
    configured: true,
    statuses,
    refresh_after_seconds: refreshSeconds,
    failed_detector_ids: Object.keys(snapshot.failures ?? {}),
    failure_codes: snapshot.failures ?? {},
  };
  storeCachedJson(cache, statusKey, body, edgeCacheSeconds, waitUntil);
  return json(body, 200, edgeCacheSeconds);
}
