import glossary from '../../data/static/glossary.json';
import racecourses from '../../data/static/racecourses.json';

export type RacingType = {
  id: string;
  slug: string;
  name_en: string;
  name_ja: string;
  summary_en: string;
  summary_ja: string;
  glossary_id: string;
  related_term_ids: string[];
};

const racingTypes: RacingType[] = [
  {
    id: 'thoroughbred-flat',
    slug: 'thoroughbred-flat',
    name_en: 'Thoroughbred flat racing',
    name_ja: 'サラブレッド平地競馬',
    summary_en: 'Flat racing for Thoroughbred horses. This type page connects countries, racecourses, and glossary context without republishing racecards.',
    summary_ja: 'サラブレッドによる平地競馬。この種別ページは国・競馬場・用語をつなぎ、レースカード全文は再掲載しません。',
    glossary_id: 'thoroughbred-racing',
    related_term_ids: ['thoroughbred-racing', 'racecourse', 'meeting', 'fixture', 'racecard', 'post-time', 'jockey', 'trainer']
  },
  {
    id: 'jump-racing',
    slug: 'jump-racing',
    name_en: 'Jump racing',
    name_ja: '障害競走',
    summary_en: 'Horse racing over jumps. Coverage is limited to listed countries and racecourses until official sources are verified.',
    summary_ja: '障害を越えて行う競馬。公式ソース確認済みの国・競馬場に限って扱います。',
    glossary_id: 'racecourse',
    related_term_ids: ['racecourse', 'meeting', 'fixture', 'racecard', 'post-time', 'jockey', 'trainer']
  },
  {
    id: 'harness-racing',
    slug: 'harness-racing',
    name_en: 'Harness racing',
    name_ja: '繋駕競走',
    summary_en: 'Racing where horses pull a sulky and are driven rather than ridden.',
    summary_ja: '馬が二輪車を引き、騎手ではなくドライバーが操縦する競走形式。',
    glossary_id: 'harness-racing',
    related_term_ids: ['harness-racing', 'trotting', 'pacing', 'driver', 'racecourse', 'meeting', 'fixture', 'post-time']
  },
  {
    id: 'trotting',
    slug: 'trotting',
    name_en: 'Trotting',
    name_ja: 'トロット',
    summary_en: 'A harness racing gait where diagonal pairs of legs move together.',
    summary_ja: '対角線上の脚が同時に動く歩様で行う繋駕競走の形式。',
    glossary_id: 'trotting',
    related_term_ids: ['trotting', 'harness-racing', 'driver', 'meeting', 'fixture', 'post-time']
  },
  {
    id: 'pacing',
    slug: 'pacing',
    name_en: 'Pacing',
    name_ja: 'ペース',
    summary_en: 'A harness racing gait where legs on the same side move together.',
    summary_ja: '同じ側の脚が同時に動く歩様で行う繋駕競走の形式。',
    glossary_id: 'pacing',
    related_term_ids: ['pacing', 'harness-racing', 'driver', 'meeting', 'fixture', 'post-time']
  },
  {
    id: 'arabian-racing',
    slug: 'arabian-racing',
    name_en: 'Arabian racing',
    name_ja: 'アラブ競馬',
    summary_en: 'Racing for Arabian horses, common in some Middle Eastern and North African jurisdictions.',
    summary_ja: 'アラブ馬による競馬。中東や北アフリカなどで見られる。',
    glossary_id: 'arabian-racing',
    related_term_ids: ['arabian-racing', 'racecourse', 'meeting', 'fixture', 'racecard', 'post-time', 'jockey', 'trainer']
  },
  {
    id: 'quarter-horse-racing',
    slug: 'quarter-horse-racing',
    name_en: 'Quarter Horse racing',
    name_ja: 'クォーターホース競馬',
    summary_en: 'Short-distance racing for American Quarter Horses, often focused on sprint speed.',
    summary_ja: 'アメリカン・クォーターホースによる短距離競走。瞬発力を重視する。',
    glossary_id: 'quarter-horse-racing',
    related_term_ids: ['quarter-horse-racing', 'racecourse', 'meeting', 'fixture', 'racecard', 'post-time', 'jockey', 'trainer']
  },
  {
    id: 'banei-racing',
    slug: 'banei-racing',
    name_en: 'Banei racing',
    name_ja: 'ばんえい競馬',
    summary_en: 'A Japanese draft-horse racing format where horses pull weighted sleds over obstacles.',
    summary_ja: '大型馬が重量のあるそりを引き、障害を越える日本独自の競馬形式。',
    glossary_id: 'banei-racing',
    related_term_ids: ['banei-racing', 'racecourse', 'meeting', 'fixture', 'racecard', 'post-time', 'driver']
  }
];

export function getRacingTypes(): RacingType[] {
  return [...racingTypes];
}

export function getRacingTypeBySlug(slug: string): RacingType | undefined {
  return racingTypes.find((type) => type.slug === slug);
}

export function getRacingTypeById(id: string): RacingType | undefined {
  return racingTypes.find((type) => type.id === id);
}

export function getRacingTypeGlossaryEntry(type: RacingType) {
  return glossary.find((entry) => entry.id === type.glossary_id);
}

export function getRacingTypeRelatedGlossaryEntries(type: RacingType) {
  return type.related_term_ids
    .map((termId) => glossary.find((entry) => entry.id === termId))
    .filter(Boolean);
}

export function getRacecoursesByRacingTypeId(typeId: string) {
  return racecourses.filter((track) => track.racing_types.includes(typeId));
}
