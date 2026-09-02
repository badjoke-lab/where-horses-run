const BANEI_MEDIA_ID = 'banei-youtube-live-2026';
const BANEI_CHANNEL_ID = 'UCyjlxPcoYAbpwlr5wjUA_5g';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

const safeVideoId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;

const statusFromVideo = (video) => {
  const content = video?.snippet?.liveBroadcastContent;
  if (content === 'live') return 'live';
  if (content === 'upcoming') return 'upcoming';
  if (video?.liveStreamingDetails?.actualEndTime) return 'ended';
  return 'offline';
};

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

async function inspectKnownVideo(apiKey, videoId) {
  const url = new URL(`${YOUTUBE_API}/videos`);
  url.searchParams.set('part', 'snippet,liveStreamingDetails');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);
  const payload = await fetchJson(url);
  const video = payload?.items?.[0];
  if (!video) return null;
  return {
    media_id: BANEI_MEDIA_ID,
    status: statusFromVideo(video),
    video_id: videoId,
    checked_at: new Date().toISOString(),
  };
}

async function discoverCurrentOrUpcoming(apiKey) {
  // Avoid search.list entirely. The Search Queries pool is intentionally kept
  // untouched; discovery walks the channel's uploads playlist instead.
  const channelUrl = new URL(`${YOUTUBE_API}/channels`);
  channelUrl.searchParams.set('part', 'contentDetails');
  channelUrl.searchParams.set('id', BANEI_CHANNEL_ID);
  channelUrl.searchParams.set('key', apiKey);
  const channelPayload = await fetchJson(channelUrl);
  const uploadsPlaylistId = channelPayload?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('YouTube uploads playlist unavailable');

  const playlistUrl = new URL(`${YOUTUBE_API}/playlistItems`);
  playlistUrl.searchParams.set('part', 'contentDetails');
  playlistUrl.searchParams.set('playlistId', uploadsPlaylistId);
  playlistUrl.searchParams.set('maxResults', '10');
  playlistUrl.searchParams.set('key', apiKey);
  const playlistPayload = await fetchJson(playlistUrl);
  const ids = (Array.isArray(playlistPayload?.items) ? playlistPayload.items : [])
    .map((item) => safeVideoId(item?.contentDetails?.videoId))
    .filter(Boolean);

  if (!ids.length) {
    return {
      media_id: BANEI_MEDIA_ID,
      status: 'offline',
      video_id: null,
      checked_at: new Date().toISOString(),
    };
  }

  const videosUrl = new URL(`${YOUTUBE_API}/videos`);
  videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', apiKey);
  const videosPayload = await fetchJson(videosUrl);
  const videos = Array.isArray(videosPayload?.items) ? videosPayload.items : [];
  const active = videos.find((video) => video?.snippet?.liveBroadcastContent === 'live')
    ?? videos.find((video) => video?.snippet?.liveBroadcastContent === 'upcoming');

  return {
    media_id: BANEI_MEDIA_ID,
    status: active ? statusFromVideo(active) : 'offline',
    video_id: safeVideoId(active?.id),
    checked_at: new Date().toISOString(),
  };
}

const cacheSecondsFor = (status, knownVideo) => {
  if (status === 'live' || status === 'upcoming') return 60;
  if (knownVideo) return 300;
  return 900;
};

export async function onRequestGet({ request, env, waitUntil }) {
  const apiKey = env?.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return json({ configured: false, statuses: [], error: 'live_status_unavailable' }, 503);
  }

  const requestUrl = new URL(request.url);
  const videoId = safeVideoId(requestUrl.searchParams.get('video_id'));
  const cacheUrl = new URL(requestUrl.origin + requestUrl.pathname);
  if (videoId) cacheUrl.searchParams.set('video_id', videoId);
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const status = videoId
      ? await inspectKnownVideo(apiKey, videoId) ?? await discoverCurrentOrUpcoming(apiKey)
      : await discoverCurrentOrUpcoming(apiKey);
    const ttl = cacheSecondsFor(status.status, Boolean(videoId));
    const response = json({ configured: true, statuses: [status] }, 200, ttl);
    if (typeof waitUntil === 'function') waitUntil(cache.put(cacheKey, response.clone()));
    else await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    return json({ configured: false, statuses: [], error: 'live_status_unavailable' }, 503);
  }
}
