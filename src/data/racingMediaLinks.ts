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
 * access-control bypasses. Runtime live detection may promote a reviewed
 * official YouTube channel landing route to the current watch page, but never
 * to a stream manifest or media CDN URL.
 */
export const reviewedRacingMediaLinks: readonly RacingMediaLink[] = [
  {
    id: 'jra-youtube-live-2026',
    kind: 'live',
    scope: 'authority',
    coverage: 'all_meetings',
    access: 'geo_restricted',
    provider: 'authority',
    provider_label: 'JRA',
    platform: 'youtube',
    delivery: 'link',
    authority_id: 'jra',
    landing_url: 'https://www.youtube.com/channel/UCj6AKkCWS6FJqf0o5wP45eQ/live',
    evidence_url: 'https://www.jra.go.jp/tvradio/racelive/',
    verified_at: '2026-09-03',
    label_en: 'Official live',
    label_ja: '公式ライブ',
    youtube_channel_id: 'UCj6AKkCWS6FJqf0o5wP45eQ',
    access_note_en: 'Official JRA YouTube live route; availability may be region-restricted.',
    access_note_ja: 'JRA公式YouTubeライブ・地域により視聴制限がある場合があります',
  },
  {
    id: 'nar-monbetsu-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Monbetsu', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['monbetsu-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UC6tQosgNJOmZUGmtkSvI6zA/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UC6tQosgNJOmZUGmtkSvI6zA',
    access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-iwate-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Iwate Keiba', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['morioka-racecourse', 'mizusawa-racecourse'],
    landing_url: 'https://www.youtube.com/@IwateKeibaITV/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-urawa-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Urawa', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['urawa-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCdtB0m4BIjadiqV3C0Vi9SQ/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCdtB0m4BIjadiqV3C0Vi9SQ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-funabashi-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Funabashi', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['funabashi-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCfnIcvhLkVVCTd86yemmGnQ/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCfnIcvhLkVVCTd86yemmGnQ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-oi-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Tokyo City Keiba', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['oi-racecourse'],
    landing_url: 'https://www.youtube.com/@tckkeiba/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-kawasaki-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Kawasaki', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['kawasaki-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCF7v-dGy_jQ_7bOi7oab2PA/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCF7v-dGy_jQ_7bOi7oab2PA', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-kanazawa-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Kanazawa', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['kanazawa-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCMRX5ABMJWPR6aWlyZYeKog/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCMRX5ABMJWPR6aWlyZYeKog', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-kasamatsu-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Kasamatsu', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['kasamatsu-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCmPuLUWCwfAW99ezdCj6ayQ/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCmPuLUWCwfAW99ezdCj6ayQ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-nagoya-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Nagoya', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['nagoya-racecourse'],
    landing_url: 'https://www.youtube.com/channel/UCuAGB0_QDb68etl8v-JcSzA/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', youtube_channel_id: 'UCuAGB0_QDb68etl8v-JcSzA', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-hyogo-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Sonoda / Himeji', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['sonoda-racecourse', 'himeji-racecourse'],
    landing_url: 'https://www.youtube.com/@sonodahimejiweb/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-kochi-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Kochi', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['kochi-racecourse'],
    landing_url: 'https://www.youtube.com/@KeibaOrJp/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
  },
  {
    id: 'nar-saga-youtube-live-2026',
    kind: 'live', scope: 'track', coverage: 'all_meetings', access: 'open', provider: 'racecourse', provider_label: 'Saga', platform: 'youtube', delivery: 'link',
    authority_id: 'nar-local-government-racing', racecourse_ids: ['saga-racecourse'],
    landing_url: 'https://www.youtube.com/@sagakeibaofficial/live', evidence_url: 'https://www.keiba.go.jp/live/', verified_at: '2026-09-03',
    label_en: 'Official live', label_ja: '公式ライブ', access_note_en: 'Official YouTube live route listed by NAR.', access_note_ja: 'NAR掲載の公式YouTubeライブ',
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
    youtube_channel_id: 'UCyjlxPcoYAbpwlr5wjUA_5g',
    access_note_en: 'Free official YouTube live.',
    access_note_ja: '無料の公式YouTubeライブ',
  },
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
    access_note_en: 'Free live video for all local racecourses.',
    access_note_ja: '地方競馬全場を無料配信',
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
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
    label_en: 'Official live',
    label_ja: '公式ライブ',
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
