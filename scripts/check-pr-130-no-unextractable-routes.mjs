import fs from 'node:fs';

const routesPath = 'data/generated/timetable/june-2026-source-routes.json';
const data = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
const badRoutes = (data.routes || []).filter((route) => route.status === 'route_not_yet_extractable');

if (badRoutes.length > 0) {
  console.error('[pr-130-no-unextractable-routes] route_not_yet_extractable remains:');
  for (const route of badRoutes) {
    console.error(`- ${route.country_id}/${route.group_id}`);
  }
  process.exit(1);
}

console.log(`[pr-130-no-unextractable-routes] PASS ${(data.routes || []).length} routes`);
