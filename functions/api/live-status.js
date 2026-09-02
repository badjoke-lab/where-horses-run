const BANEI_MEDIA_ID = 'banei-youtube-live-2026';
const BANEI_CHANNEL_ID = 'UCyjlxPcoYAbpwlr5wjUA_5g';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

const safeVideoId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value) ? value : null;

const statusFromVideo = (video) => {
  const content = video?.snippet?.liveBroadcastContent;
  if (content === 'live') return 'live';
  if (content === 'upcoming') return 'upcoming';
  if (video?.liveStreamingDetails?.actualEndTime) return 'ended';
  return 'offline';
};

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
  const url = new URL(`${YOUTUBE_API}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', BANEI_CHANNEL_ID);
  url.searchParams.set('type', 'video');
  url.searchParams.set('order', 'date');
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('key', apiKey);
  const payload = await fetchJson(url);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const active = items.find((item) => item?.snippet?.liveBroadcastContent === 'live')
    ?? items.find((item) => item?.snippet?.liveBroadcastContent === 'upcoming');
  const videoId = safeVideoId(active?.id?.videoId);
  return {
    media_id: BANEI_MEDIA_ID,
    status: active?.snippet?.liveBroadcastContent === 'live'
      ? 'live'
      : active?.snippet?.liveBroadcastContent === 'upcoming'
        ? 'upcoming'
        : 'offline',
    video_id: videoId,
    checked_at: new Date().toISOString(),
  };
}

export async function onRequestGet({ request, env }) {
  const apiKey = env?.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return json({ statuses: [], error: 'live_status_unavailable' }, 503);
  }

  try {
    const requestUrl = new URL(request.url);
    const videoId = safeVideoId(requestUrl.searchParams.get('video_id'));
    const status = videoId
      ? await inspectKnownVideo(apiKey, videoId) ?? await discoverCurrentOrUpcoming(apiKey)
      : await discoverCurrentOrUpcoming(apiKey);
    return json({ statuses: [status] });
  } catch {
    return json({ statuses: [], error: 'live_status_unavailable' }, 503);
  }
}
