import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  BRAZIL_SYSTEMS,
  buildBrazilJcbMeetingRecord,
  parseBrazilJcbCurrentMeetings,
  parseBrazilJcbRaceday,
} from './timetable/brazil-jcb-current-meetings-core.mjs';

const sourceUrl='https://site.jcb.com.br/conteudo/Reunioes?cn=BNL&cp=BNL_site';
const html=`<html><body><h1>REUNIÕES</h1><table>
<tr><td>26/09/2026</td><td>Sábado</td><td>1233</td><td>Cristal RS</td><td>Baixar</td></tr>
<tr><td>27/09/2026</td><td>Domingo</td><td>1286</td><td>Gavea</td><td>Baixar</td></tr>
<tr><td>28/09/2026</td><td>Segunda-feira</td><td>1301</td><td>Gávea</td><td>Baixar</td></tr>
<tr><td>03/10/2026</td><td>Sábado</td><td>1400</td><td>Cidade Jardim</td><td>Baixar</td></tr>
</table></body></html>`;

const parsed=parseBrazilJcbCurrentMeetings(html,{sourceUrl});
assert.deepEqual(parsed.records.map(r=>[r.date,r.system_key,r.racecourse_id]),[
 ['2026-09-26','cristal',BRAZIL_SYSTEMS.cristal.racecourse_id],
 ['2026-09-27','gavea',BRAZIL_SYSTEMS.gavea.racecourse_id],
 ['2026-09-28','gavea',BRAZIL_SYSTEMS.gavea.racecourse_id],
]);
assert.equal(parsed.source_warnings.length,1);
assert.equal(parsed.source_warnings[0].code,'recognized_but_unrouted_venue');

const detailHtml=`<html><body>
<h3>Reunião 1286 - Gávea - 27/09/2026</h3>
<h2>Páreo 1 15:36 PRÊMIO IVAR Normal NO - Normal Páreos em que se dividem os animais por sexo, vitória e idade. 1.300m Areia Aberto</h2>
<h2>Páreo 2 16:14 PRÊMIO ENERGIA FRIBBY Normal NO - Normal Páreos em que se dividem os animais por sexo, vitória e idade. 1.000m Grama Aberto</h2>
</body></html>`;
const detail=parseBrazilJcbRaceday(detailHtml,{
  expectedSystemKey:'gavea',
  expectedDate:'2026-09-27',
  sourceUrl:'https://apostas.jcb.com.br/pt-br/raceday?dia=2026-09-27',
});
assert.equal(detail.status,'available');
assert.deepEqual(detail.rows,[
  {label:'Race 1',race_number:1,post_time_local:'15:36',race_name:'PRÊMIO IVAR',distance_m:1300,surface:'dirt',course_label:'Aberto'},
  {label:'Race 2',race_number:2,post_time_local:'16:14',race_name:'PRÊMIO ENERGIA FRIBBY',distance_m:1000,surface:'turf',course_label:'Aberto'},
]);

const checkedAt='2026-09-26T00:00:00Z';
const gaveaRow=parsed.records.find(row=>row.system_key==='gavea');
const record=buildBrazilJcbMeetingRecord(gaveaRow,{checkedAt,detail});
assert.equal(record.country_id,'brazil');
assert.equal(record.capability_rank,'A+');
assert.equal(record.first_race_time_local,'15:36');
assert.equal(record.last_race_time_local,'16:14');
assert.equal(record.timetable_rows.length,2);
assert.equal(record.acquisition_completion.disposition,'complete_current_best_available');
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt:record.acquisition_attempt,
  acquisition_completion:record.acquisition_completion,
  evidence_support:record.evidence_support,
}),[]);

const scheduleOnly=buildBrazilJcbMeetingRecord(parsed.records.find(row=>row.system_key==='cristal'),{
  checkedAt,
  detail:{status:'not_published',rows:[],detail_url:'https://apostas.jcb.com.br/pt-br/raceday?dia=2026-09-26',evaluated_capability_rank:'A+'},
});
assert.equal(scheduleOnly.capability_rank,'C');
assert.equal(scheduleOnly.acquisition_completion.disposition,'pending_publication');
console.log('BRAZIL_JCB_CURRENT_MEETINGS_ADAPTER: pass');
