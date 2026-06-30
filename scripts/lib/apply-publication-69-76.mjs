export function applyPublication6976(rows) {
  const published = new Set(['69', '70', '71', '72', '73', '74', '75', '76']);
  for (const row of rows) {
    if (!published.has(row.delivery_no)) continue;
    row.programme_status = 'published';
    row.en_route_status = 'published';
    row.ja_route_status = 'published';
    row.qa_status = 'passed';
    row.page_published_at = '2026-06-30';
  }
  return rows;
}
