export const LEGACY_COUNTRY_PROFILE_COMPATIBILITY_IDS = ['japan', 'hong-kong'] as const;

const legacyCompatibilityIds = new Set<string>(LEGACY_COUNTRY_PROFILE_COMPATIBILITY_IDS);

export type CountryProfileOrigin = 'v2' | 'legacy-compat';
export type PublicDisplayCeiling = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'pending';
export type SourceTestStatus = 'complete' | 'partial' | 'pending' | 'not_applicable';
export type CountryPageKind = 'country' | 'special' | 'explanatory' | 'archive';

export interface CountryProfileNamedItem {
  id: string;
  name_en: string;
  name_ja: string;
  summary_en: string;
  summary_ja: string;
}

export interface CountryProfileV2System extends CountryProfileNamedItem {
  organiser_source_ids: string[];
  distributor_source_ids: string[];
}

export interface CountryProfileV2 {
  schema_version: '2.0.0';
  country_id: string;
  slug: string;
  status: 'draft' | 'reviewed';
  page_kind: CountryPageKind;
  last_reviewed: string;
  public_display_ceiling: PublicDisplayCeiling;
  source_test_status: SourceTestStatus;
  hero: {
    summary_en: string;
    summary_ja: string;
  };
  overview: {
    paragraphs_en: string[];
    paragraphs_ja: string[];
  };
  racing_types: CountryProfileNamedItem[];
  seasonality: {
    pattern: string;
    summary_en: string;
    summary_ja: string;
  };
  schedule: {
    timezone: string;
    utc_offset_label: string;
    day_patterns: string[];
    time_patterns: string[];
    summary_en: string;
    summary_ja: string;
  };
  surfaces: {
    ids: string[];
    summary_en: string;
    summary_ja: string;
  };
  systems: CountryProfileV2System[];
  principal_racecourse_ids: string[];
  calendar_guidance_en: string;
  calendar_guidance_ja: string;
  coverage_note_en: string;
  coverage_note_ja: string;
  revalidation: {
    triggers_en: string[];
    triggers_ja: string[];
  };
  related_glossary_ids: string[];
}

export interface CountryDetailProfile {
  country_id: string;
  slug: string;
  status: string;
  page_kind: CountryPageKind;
  last_reviewed: string;
  public_display_ceiling?: PublicDisplayCeiling;
  source_test_status?: SourceTestStatus;
  hero_summary_en: string;
  hero_summary_ja: string;
  overview_en: string;
  overview_ja: string;
  overview_paragraphs_en: string[];
  overview_paragraphs_ja: string[];
  horse_and_format_summary_en?: string;
  horse_and_format_summary_ja?: string;
  racing_types: CountryProfileNamedItem[];
  seasonality: {
    pattern: string;
    summary_en: string;
    summary_ja: string;
  };
  surfaces_and_tracks: {
    surfaces: string[];
    summary_en: string;
    summary_ja: string;
  };
  typical_schedule: {
    timezone: string;
    utc_offset_label: string;
    day_patterns: string[];
    time_patterns: string[];
    summary_en: string;
    summary_ja: string;
  };
  racing_systems: Array<CountryProfileNamedItem & {
    source_ids: string[];
    organiser_source_ids?: string[];
    distributor_source_ids?: string[];
  }>;
  principal_racecourse_ids?: string[];
  calendar_guidance_en: string;
  calendar_guidance_ja: string;
  beginner_guide_en?: string;
  beginner_guide_ja?: string;
  coverage_note_en: string;
  coverage_note_ja: string;
  revalidation?: {
    triggers_en: string[];
    triggers_ja: string[];
  };
  related_glossary_ids: string[];
  profile_origin: CountryProfileOrigin;
}

const unique = (values: string[]) => [...new Set(values)];

export function adaptCountryProfileV2(profile: CountryProfileV2): CountryDetailProfile {
  const firstOverviewEn = profile.overview.paragraphs_en[0] ?? profile.hero.summary_en;
  const firstOverviewJa = profile.overview.paragraphs_ja[0] ?? profile.hero.summary_ja;

  return {
    country_id: profile.country_id,
    slug: profile.slug,
    status: profile.status,
    page_kind: profile.page_kind,
    last_reviewed: profile.last_reviewed,
    public_display_ceiling: profile.public_display_ceiling,
    source_test_status: profile.source_test_status,
    hero_summary_en: profile.hero.summary_en,
    hero_summary_ja: profile.hero.summary_ja,
    overview_en: firstOverviewEn,
    overview_ja: firstOverviewJa,
    overview_paragraphs_en: profile.overview.paragraphs_en,
    overview_paragraphs_ja: profile.overview.paragraphs_ja,
    horse_and_format_summary_en: profile.overview.paragraphs_en.at(-1),
    horse_and_format_summary_ja: profile.overview.paragraphs_ja.at(-1),
    racing_types: profile.racing_types,
    seasonality: {
      ...profile.seasonality,
      pattern: profile.seasonality.pattern.replaceAll('-', '_')
    },
    surfaces_and_tracks: {
      surfaces: profile.surfaces.ids,
      summary_en: profile.surfaces.summary_en,
      summary_ja: profile.surfaces.summary_ja
    },
    typical_schedule: profile.schedule,
    racing_systems: profile.systems.map((system) => ({
      ...system,
      source_ids: unique([...system.organiser_source_ids, ...system.distributor_source_ids])
    })),
    principal_racecourse_ids: profile.principal_racecourse_ids,
    calendar_guidance_en: profile.calendar_guidance_en,
    calendar_guidance_ja: profile.calendar_guidance_ja,
    coverage_note_en: profile.coverage_note_en,
    coverage_note_ja: profile.coverage_note_ja,
    revalidation: profile.revalidation,
    related_glossary_ids: profile.related_glossary_ids,
    profile_origin: 'v2'
  };
}

function adaptLegacyCountryProfile(input: Record<string, unknown>): CountryDetailProfile {
  const legacy = input as unknown as CountryDetailProfile;
  const overviewParagraphsEn = legacy.overview_paragraphs_en ?? [legacy.overview_en];
  const overviewParagraphsJa = legacy.overview_paragraphs_ja ?? [legacy.overview_ja];

  return {
    ...legacy,
    page_kind: legacy.page_kind ?? 'country',
    hero_summary_en: legacy.hero_summary_en ?? legacy.overview_en,
    hero_summary_ja: legacy.hero_summary_ja ?? legacy.overview_ja,
    overview_paragraphs_en: overviewParagraphsEn,
    overview_paragraphs_ja: overviewParagraphsJa,
    profile_origin: 'legacy-compat'
  };
}

export function buildCountryDetailProfiles(
  v2Input: unknown,
  legacyInput: unknown
): CountryDetailProfile[] {
  const v2Profiles = Array.isArray(v2Input) ? v2Input as CountryProfileV2[] : [];
  const legacyProfiles = Array.isArray(legacyInput) ? legacyInput as Record<string, unknown>[] : [];
  const adaptedV2Profiles = v2Profiles.map(adaptCountryProfileV2);
  const v2CountryIds = new Set(adaptedV2Profiles.map((profile) => profile.country_id));

  const compatibilityProfiles = legacyProfiles
    .filter((profile) => {
      const countryId = typeof profile.country_id === 'string' ? profile.country_id : '';
      return legacyCompatibilityIds.has(countryId) && !v2CountryIds.has(countryId);
    })
    .map(adaptLegacyCountryProfile);

  return [...adaptedV2Profiles, ...compatibilityProfiles];
}
