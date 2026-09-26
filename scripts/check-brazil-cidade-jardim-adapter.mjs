import assert from 'node:assert/strict';
import { buildCidadeJardimMeetingRecord,parseCidadeJardimProjectIndex,parseCidadeJardimProjectText } from './timetable/brazil-cidade-jardim-core.mjs';

const indexHtml=`<a href="/proj_inscricoes/Projeto-OUTUBRO2026.pdf">PROJETO DE INSCRIÇÕES PARA O MÊS DE OUTUBRO DE 2026</a><a href="/proj_inscricoes/Projeto-SETEMBRO2026.pdf">PROJETO DE INSCRIÇÕES PARA O MÊS DE SETEMBRO DE 2026</a>`;
const links=parseCidadeJardimProjectIndex(indexHtml,{baseUrl:'https://www.jockeysp.com.br/corridas/projetodeinscricoes.asp'});
assert.deepEqual(links.map(x=>[x.year,x.month]),[[2026,9],[2026,10]]);
const rows=parseCidadeJardimProjectText('Projeto de Inscrições para o mês de OUTUBRO de 2026 3 10 17 31 CLASSE 1 - Programação Clássica e Provas Especiais Obs.: No dia 24, não haverá corridas em CJ.',{sourceUrl:links[1].url});
assert.deepEqual(rows.map(r=>r.date),['2026-10-03','2026-10-10','2026-10-17','2026-10-31']);
const rec=buildCidadeJardimMeetingRecord(rows[0],{checkedAt:'2026-09-26T00:00:00Z'});
assert.equal(rec.country_id,'brazil');
assert.equal(rec.authority_id,'jockey-club-de-sao-paulo');
assert.equal(rec.racing_system_id,'brazil-cidade-jardim-system');
assert.equal(rec.racecourse_id,'brazil--hipodromo-de-cidade-jardim');
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.equal(rec.acquisition_completion.disposition,'not_applicable');
console.log('BRAZIL_CIDADE_JARDIM_ADAPTER: pass');
