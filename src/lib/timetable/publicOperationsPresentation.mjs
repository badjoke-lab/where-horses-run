export const PUBLIC_CALENDAR_DATA_STATUSES = [
  'current_window_available',
  'no_public_records',
  'records_before_window',
  'records_after_window',
  'stale_generation_with_window_records',
];

export const PUBLIC_SOURCE_PRESENTATION_STATUSES = [
  'visible_sources_reviewed',
  'visible_source_attention',
  'source_failure_under_review',
];

export const PUBLIC_RETRY_OWNERSHIP_STATUSES = [
  'reviewed_operations',
  'no_visible_gap',
];

const SOURCE_ATTENTION_VALUES = new Set(['partial', 'stale']);

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
}

export function derivePublicOperationsPresentation({
  records,
  dataState,
  sourceFailureCount = 0,
  retryOwnershipStatus = 'reviewed_operations',
}) {
  if (!Array.isArray(records)) throw new Error('records must be an array.');
  if (!PUBLIC_CALENDAR_DATA_STATUSES.includes(dataState?.status)) {
    throw new Error(`Unsupported Calendar data status: ${dataState?.status}`);
  }
  assertNonNegativeInteger(sourceFailureCount, 'sourceFailureCount');
  if (!PUBLIC_RETRY_OWNERSHIP_STATUSES.includes(retryOwnershipStatus)) {
    throw new Error(`Unsupported retry ownership status: ${retryOwnershipStatus}`);
  }

  const visibleSourceAttentionCount = records.filter((record) =>
    SOURCE_ATTENTION_VALUES.has(record.source_status),
  ).length;

  const sourcePresentationStatus = sourceFailureCount > 0
    ? 'source_failure_under_review'
    : visibleSourceAttentionCount > 0
      ? 'visible_source_attention'
      : 'visible_sources_reviewed';

  return {
    data_status: dataState.status,
    source_presentation_status: sourcePresentationStatus,
    visible_source_attention_count: visibleSourceAttentionCount,
    source_failure_count: sourceFailureCount,
    retry_ownership_status: retryOwnershipStatus,
    automatic_publication: false,
  };
}

const COPY = {
  en: {
    source: {
      visible_sources_reviewed: 'Listed meetings retain a reviewed source status and last checked date.',
      visible_source_attention: 'Some listed meetings use partial or stale source evidence. Their source status and last checked date remain visible.',
      source_failure_under_review: 'A known source route is unavailable or failed review. No meeting is invented from that failure; official sources remain the fallback.',
    },
    retry: {
      reviewed_operations: 'Additional detail and source recovery are handled through reviewed operations. Updates are not automatic.',
      no_visible_gap: 'No additional public-rank gap is visible in this view. Future changes still require reviewed publication.',
    },
    automatic: 'Automatic publication is disabled.',
  },
  ja: {
    source: {
      visible_sources_reviewed: '掲載開催には、確認済みのソース状態と最終確認日を表示しています。',
      visible_source_attention: '一部の掲載開催は、部分的または古いソース証拠に基づきます。ソース状態と最終確認日は表示したままにします。',
      source_failure_under_review: '取得不能または確認失敗となった既知のソース経路があります。その失敗から開催情報を補完せず、公式ソースを確認先として残します。',
    },
    retry: {
      reviewed_operations: '追加詳細の取得とソース復旧は、人間レビューを伴う運用で管理します。更新は自動ではありません。',
      no_visible_gap: 'この表示には追加の公開ランク差がありません。将来の変更もレビュー済み公開が必要です。',
    },
    automatic: '自動公開は無効です。',
  },
};

export function getPublicOperationsCopy(presentation, lang = 'en') {
  const locale = lang === 'ja' ? 'ja' : 'en';
  if (!PUBLIC_SOURCE_PRESENTATION_STATUSES.includes(presentation?.source_presentation_status)) {
    throw new Error(`Unsupported source presentation status: ${presentation?.source_presentation_status}`);
  }
  if (!PUBLIC_RETRY_OWNERSHIP_STATUSES.includes(presentation?.retry_ownership_status)) {
    throw new Error(`Unsupported retry ownership status: ${presentation?.retry_ownership_status}`);
  }
  return {
    source: COPY[locale].source[presentation.source_presentation_status],
    retry: COPY[locale].retry[presentation.retry_ownership_status],
    automatic: COPY[locale].automatic,
  };
}
