import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const authorityInventory = loadAuthoritySourceInventoryV1(process.cwd());
const readiness = loadCalendarReadinessV1(process.cwd());
const source = authorityInventory.records.find((record) => record.country_id === 'hong-kong' && record.authority_id === 'hkjc' && record.official_source_id === 'hkjc-detail-reviewed-import');
if (!source) throw new Error('HKJC detail Authority/Source record missing');
if (source.capability_rank !== 'A+' || source.source_status !== 'verified') throw new Error('HKJC detail Authority/Source state differs');
const record = readiness.records.find((entry) => entry.authority_source_key === 'hong-kong/hkjc/hkjc-detail-reviewed-import');
if (!record) throw new Error('HKJC detail Calendar Readiness record missing');
if (record.system_id !== 'hong-kong-hkjc-system' || record.technical_rank !== 'A+' || record.public_ceiling !== 'A') throw new Error('HKJC detail Calendar Readiness rank state differs');
if (record.automation_mode !== 'manual_import' || record.implementation_status !== 'manual_operation') throw new Error('HKJC detail Calendar Readiness operating mode differs');
if (!record.racecourse_ids.includes('happy-valley-racecourse') || !record.racecourse_ids.includes('sha-tin-racecourse')) throw new Error('HKJC detail Calendar Readiness racecourse scope differs');
console.log('CALENDAR_HKJC_RANK_UPGRADE_READINESS_STAGE: pass');
