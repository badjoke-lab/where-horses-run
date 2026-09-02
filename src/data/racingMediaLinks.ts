export type RacingMediaKind = 'live' | 'replay';
export type RacingMediaScope = 'national' | 'authority' | 'state' | 'track' | 'event';
export type RacingMediaCoverage = 'all_meetings' | 'selected_meetings' | 'feature_only' | 'seasonal';
export type RacingMediaAccess =
  | 'open'
  | 'free_account'
  | 'betting_account'
  | 'subscription'
  | 'geo_restricted'
  | 'unknown';
export type RacingMediaProvider = 'authority' | 'racecourse' | 'broadcaster' | 'betting_operator';
export type RacingMediaPlatform = 'official_web' | 'youtube';
export type RacingMediaDelivery = 'link';

export type RacingMediaLink = {
  id: string;
  kind: RacingMediaKind;
  scope: RacingMediaScope;
  coverage: RacingMediaCoverage;
  access: RacingMediaAccess;
  provider: RacingMediaProvider;
  provider_label: string;
  platform: RacingMediaPlatform;
  delivery: RacingMediaDelivery;
  authority_id: string;
  racecourse_ids?: readonly string[];
  landing_url: string;
  evidence_url: string;
  verified_at: string;
  label_en: string;
  label_ja: string;
  youtube_channel_id?: string;
  access_note_en?: string;
  access_note_ja?: string;
};

/**
 * Reviewed public media routes only.
 *
 * Keep these records separate from timetable capability rank. A meeting can be
 * C/B/B+/A/A+ independently of whether a live/replay route exists.
 *
 * Calendar delivery is deliberately link-only. Never add iframe/embed payloads,
 * direct media manifests, expiring/session URLs, unofficial mirrors, or
 * access-control bypasses. A runtime live-status detector may use the optional
 * YouTube channel id, but the Calendar opens only the reviewed landing URL.
 */
export const reviewedRacingMediaLinks: readonly RacingMediaLink[] = [
  {
    id: 'jra-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'geo_restricted',
    provider: 'authority',
    provider_label: 'JRA',
    platform: 'official_web',
    delivery: 'link',
    authority_id: 'jra',
    landing_url: 'https://www.jra.go.jp/tvradio/racelive/',
    evidence_url: 'https://www.jra.go.jp/tvradio/racelive/',
    verified_at: '2026-09-02',
    label_en: 'Live video',
    label_ja: 'ライブ映像',
    access_note_en: 'Free; viewing is limited to Japan.',
    access_note_ja: '無料・日本国内限定',
  },
  {
    id: 'nar-local-racing-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'open',
    provider: 'authority',
    provider_label: 'Local Racing Live (NAR)',
    platform: 'official_web',
    delivery: 'link',
    authority_id: 'nar-local-government-racing',
    landing_url: 'https://www.keiba.go.jp/live/',
    evidence_url: 'https://www.keiba.go.jp/live/',
    verified_at: '2026-09-02',
    label_en: 'Live video',
    label_ja: 'ライブ映像',
    access_note_en: 'Free live video for all local racecourses.',
    access_note_ja: '地方競馬全場を無料配信',
  },
  {
    id: 'banei-youtube-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'open',
    provider: 'authority',
    provider_label: 'ばんえい十勝',
    platform: 'youtube',
    delivery: 'link',
    authority_id: 'banei-tokachi',
    landing_url: 'https://www.youtube.com/channel/UCyjlxPcoYAbpwlr5wjUA_5g/live',
    evidence_url: 'https://www.banei-keiba.or.jp/',
    verified_at: '2026-09-02',
    label_en: 'YouTube Live',
    label_ja: 'YouTubeライブ',
    youtube_channel_id: 'UCyjlxPcoYAbpwlr5wjUA_5g',
    access_note_en: 'Free official YouTube live.',
    access_note_ja: '無料の公式YouTubeライブ',
  },
  {
    id: 'hkjc-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'unknown',
    provider: 'authority',
    provider_label: 'Hong Kong Jockey Club',
    platform: 'official_web',
    delivery: 'link',
    authority_id: 'hkjc',
    landing_url: 'https://racing.hkjc.com/en-US/index',
    evidence_url: 'https://racing.hkjc.com/en-US/index',
    verified_at: '2026-09-02',
    label_en: 'Live broadcast',
    label_ja: 'ライブ中継',
    access_note_en: 'Use the HKJC Audio and Video → Live Broadcast route; access conditions may vary.',
    access_note_ja: 'HKJCの「Audio and Video → Live Broadcast」から視聴・利用条件は変動する場合があります',
  },
  {
    id: 'era-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'unknown',
    provider: 'authority',
    provider_label: 'Emirates Racing Authority',
    platform: 'official_web',
    delivery: 'link',
    authority_id: 'emirates-racing-authority',
    landing_url: 'https://emiratesracing.com/',
    evidence_url: 'https://emiratesracing.com/',
    verified_at: '2026-09-02',
    label_en: 'Live stream',
    label_ja: 'ライブ中継',
    access_note_en: 'The official ERA site exposes a Live stream route; access conditions may vary.',
    access_note_ja: 'ERA公式サイトの「Live stream」から視聴・利用条件は変動する場合があります',
  },
  {
    id: 'tjk-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'geo_restricted',
    provider: 'authority',
    provider_label: 'Türkiye Jokey Kulübü',
    platform: 'official_web',
    delivery: 'link',
    authority_id: 'turkiye-jokey-kulubu',
    landing_url: 'https://www.tjk.org/EN/YarisSever/Static/page/canli',
    evidence_url: 'https://www.tjk.org/TR/YarisSever/Static/page/canli',
    verified_at: '2026-09-02',
    label_en: 'Live stream',
    label_ja: 'ライブ中継',
    access_note_en: 'TJK TV web live is geo-restricted; availability outside Türkiye is not guaranteed.',
    access_note_ja: 'TJK TVのWebライブは地域制限あり',
  },
] as const;

export function getVerifiedLiveMediaForMeeting(input: {
  authority_id: string;
  racecourse_id: string;
}): RacingMediaLink | null {
  return reviewedRacingMediaLinks.find((record) => {
    if (record.kind !== 'live' || record.authority_id !== input.authority_id) {
      return false;
    }

    return !record.racecourse_ids || record.racecourse_ids.includes(input.racecourse_id);
  }) ?? null;
}
