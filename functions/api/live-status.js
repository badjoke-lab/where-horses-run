const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const JAPAN_TIME_ZONE = 'Asia/Tokyo';
const CHANNEL_CACHE_SECONDS = 7 * 24 * 60 * 60;
const KNOWN_VIDEO_CACHE_SECONDS = 6 * 60 * 60;

// Runtime detectors are deliberately separate from public media links. The
// Calendar continues to open only reviewed official landing pages. These
// sources are used only to determine whether an official race broadcast is
// actually live/upcoming/offline.
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

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`YouTube API ${response.status}`);
  return response.json();
}

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
  const state = video ? statusFromVideo(video) : 'offline';
  const scheduledStart = video?.liveStreamingDetails?.scheduledStartTime ?? null;
  const actualStart = video?.liveStreamingDetails?.actualStartTime ?? null;
  const eventInstant = actualStart ?? scheduledStart;
  return {
    detector_id: detector.id,
    // Retained for compatibility with the original single-source response.
    media_id: detector.id,
    status: state,
    video_id: safeVideoId(video?.id),
    event_date: japanDateFor(eventInstant),
    scheduled_start_at: scheduledStart,
    checked_at: new Date().toISOString(),
  };
};

const refreshSecondsFor = (status) => {
  if (status.status === 'live') return 60;
  if (status.status !== 'upcoming') return status.status === 'ended' ? 300 : 900;

  const scheduled = Date.parse(status.scheduled_start_at ?? '');
  if (!Number.isFinite(scheduled)) return 300;
  const untilStart = Math.max(0, scheduled - Date.now());
  if (untilStart > 24 * 60 * 60 * 1000) return 3600;
  if (untilStart > 6 * 60 * 60 * 1000) return 1800;
  if (untilStart > 60 * 60 * 1000) return 300;
  return 60;
};

const internalCacheKey = (request, namespace, detectorId) => {
  const origin = new URL(request.url).origin;
  return new Request(`${origin}/api/live-status/__cache/${namespace}/${encodeURIComponent(detectorId)}`, { method: 'GET' });
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

async function resolveUploadsPlaylistId({ request, apiKey, detector, cache, waitUntil }) {
  const key = internalCacheKey(request, 'channel', detector.id);
  const cached = await readCachedJson(cache, key);
  if (typeof cached?.uploads_playlist_id === 'string') return cached.uploads_playlist_id;

  const url = new URL(`${YOUTUBE_API}/channels`);
  url.searchParams.set('part', 'contentDetails');
  if (detector.channel_id) url.searchParams.set('id', detector.channel_id);
  else url.searchParams.set('forHandle', detector.handle);
  url.searchParams.set('key', apiKey);
  const payload = await fetchJson(url);
  const uploadsPlaylistId = payload?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error(`YouTube uploads playlist unavailable for ${detector.id}`);

  storeCachedJson(cache, key, { uploads_playlist_id: uploadsPlaylistId }, CHANNEL_CACHE_SECONDS, waitUntil);
  return uploadsPlaylistId;
}

async function inspectVideo(apiKey, videoId) {
  const url = new URL(`${YOUTUBE_API}/videos`);
  url.searchParams.set('part', 'snippet,liveStreamingDetails');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);
  const payload = await fetchJson(url);
  return payload?.items?.[0] ?? null;
}

async function discoverActiveVideo({ request, apiKey, detector, cache, waitUntil }) {
  const uploadsPlaylistId = await resolveUploadsPlaylistId({ request, apiKey, detector, cache, waitUntil });
  const playlistUrl = new URL(`${YOUTUBE_API}/playlistItems`);
  playlistUrl.searchParams.set('part', 'contentDetails');
  playlistUrl.searchParams.set('playlistId', uploadsPlaylistId);
  playlistUrl.searchParams.set('maxResults', '25');
  playlistUrl.searchParams.set('key', apiKey);
  const playlistPayload = await fetchJson(playlistUrl);
  const ids = (Array.isArray(playlistPayload?.items) ? playlistPayload.items : [])
    .map((item) => safeVideoId(item?.contentDetails?.videoId))
    .filter(Boolean);
  if (!ids.length) return null;

  const videosUrl = new URL(`${YOUTUBE_API}/videos`);
  videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', apiKey);
  const videosPayload = await fetchJson(videosUrl);
  const videos = Array.isArray(videosPayload?.items) ? videosPayload.items : [];
  return videos.find((video) => video?.snippet?.liveBroadcastContent === 'live')
    ?? videos.find((video) => video?.snippet?.liveBroadcastContent === 'upcoming')
    ?? null;
}

async function detectorStatus({ request, apiKey, detector, cache, waitUntil }) {
  const statusKey = internalCacheKey(request, 'status', detector.id);
  const cachedStatus = await readCachedJson(cache, statusKey);
  if (cachedStatus?.detector_id === detector.id) return cachedStatus;

  const videoKey = internalCacheKey(request, 'video', detector.id);
  const cachedVideo = await readCachedJson(cache, videoKey);
  const knownVideoId = safeVideoId(cachedVideo?.video_id);
  if (knownVideoId) {
    const video = await inspectVideo(apiKey, knownVideoId);
    const knownStatus = video ? normalizedStatus(detector, video) : null;
    if (knownStatus?.status === 'live' || knownStatus?.status === 'upcoming') {
      const ttl = refreshSecondsFor(knownStatus);
      storeCachedJson(cache, statusKey, knownStatus, ttl, waitUntil);
      storeCachedJson(cache, videoKey, { video_id: knownVideoId }, KNOWN_VIDEO_CACHE_SECONDS, waitUntil);
      return knownStatus;
    }
    await cache.delete(videoKey);
  }

  const activeVideo = await discoverActiveVideo({ request, apiKey, detector, cache, waitUntil });
  const status = normalizedStatus(detector, activeVideo);
  const ttl = refreshSecondsFor(status);
  storeCachedJson(cache, statusKey, status, ttl, waitUntil);
  if (status.video_id) {
    storeCachedJson(cache, videoKey, { video_id: status.video_id }, KNOWN_VIDEO_CACHE_SECONDS, waitUntil);
  }
  return status;
}

export async function onRequestGet({ request, env, waitUntil }) {
  const apiKey = env?.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return json({ configured: false, statuses: [], error: 'live_status_unavailable' }, 503);
  }

  const cache = caches.default;
  const settled = await Promise.allSettled(YOUTUBE_LIVE_DETECTORS.map((detector) => detectorStatus({
    request,
    apiKey,
    detector,
    cache,
    waitUntil,
  })));
  const statuses = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const failedDetectorIds = settled
    .map((result, index) => result.status === 'rejected' ? YOUTUBE_LIVE_DETECTORS[index].id : null)
    .filter(Boolean);

  if (!statuses.length) {
    return json({ configured: false, statuses: [], error: 'live_status_unavailable' }, 503);
  }

  const refreshAfterSeconds = Math.min(...statuses.map(refreshSecondsFor));
  return json({
    configured: true,
    statuses,
    refresh_after_seconds: refreshAfterSeconds,
    failed_detector_ids: failedDetectorIds,
  }, 200, Math.min(refreshAfterSeconds, 300));
}
