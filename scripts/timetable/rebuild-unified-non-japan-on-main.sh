#!/usr/bin/env bash
set -euo pipefail

DAYS="${2:?days required}"

refresh_non_japan_on_main() {
  local remote_main="$1"
  echo "Resetting to latest main $remote_main and rebuilding non-Japan snapshot."
  git reset --hard "$remote_main"
  npm install --no-package-lock --no-audit --no-fund
  rm -rf .calendar-unified
  mkdir -p .calendar-unified
  node scripts/timetable/run-hkjc-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/hkjc.json
  node scripts/timetable/run-uae-era-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/uae.json
  node scripts/timetable/run-kra-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/kra.json
  node scripts/timetable/run-tjk-current-best-available.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/tjk.json
  node scripts/timetable/run-sorec-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/sorec.json
  node scripts/timetable/run-chile-teletrak-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/chile.json
  node scripts/timetable/run-ireland-hri-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/ireland.json
  node scripts/timetable/run-peru-monterrico-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/peru.json
  node scripts/timetable/run-saudi-jcsa-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/saudi-arabia.json
  node scripts/timetable/run-france-fnch-official-window.mjs \
    --days="${DAYS}" \
    --galop-output=.calendar-unified/france-galop.json \
    --letrot-output=.calendar-unified/france-letrot.json
  node scripts/timetable/run-new-zealand-official-window.mjs \
    --days="${DAYS}" \
    --thoroughbred-output=.calendar-unified/new-zealand-thoroughbred.json \
    --harness-output=.calendar-unified/new-zealand-harness.json
  node scripts/timetable/run-united-kingdom-bha-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/united-kingdom.json
  node scripts/timetable/run-slovakia-zavodisko-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/slovakia.json
  node scripts/timetable/run-bahrain-btc-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/bahrain.json
  node scripts/timetable/run-sweden-svensk-galopp-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/sweden.json
  node scripts/timetable/run-germany-deutscher-galopp-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/germany.json
  node scripts/timetable/run-spain-zarzuela-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/spain.json
  node scripts/timetable/run-italy-masaf-official-window.mjs \
    --days="${DAYS}" \
    --gallop-output=.calendar-unified/italy-gallop.json \
    --trot-output=.calendar-unified/italy-trot.json
  node scripts/timetable/run-south-africa-race-coast-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/south-africa-race-coast.json
  node scripts/timetable/run-south-africa-four-racing-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/south-africa-four-racing.json
  node scripts/timetable/run-panama-presidente-remon-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/panama.json
  node scripts/timetable/run-brazil-jcb-reunioes-official-window.mjs \
    --days="${DAYS}" \
    --gavea-output=.calendar-unified/brazil-gavea.json \
    --cristal-output=.calendar-unified/brazil-cristal.json
  node scripts/timetable/run-brazil-cidade-jardim-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/brazil-cidade-jardim.json
  node scripts/timetable/run-brazil-sorocaba-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/brazil-sorocaba.json
  node scripts/timetable/run-mexico-americas-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/mexico.json
  node scripts/timetable/run-uruguay-hru-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/uruguay.json
  node scripts/timetable/run-finland-hippos-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/finland.json
  node scripts/timetable/run-jamaica-caymanas-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/jamaica.json
  node scripts/timetable/run-czech-dostihy-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/czech.json
  node scripts/timetable/run-denmark-klampenborg-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/denmark.json
  node scripts/timetable/run-hungary-kincsem-galopp-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/hungary.json
  node scripts/timetable/run-dominican-hvc-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/dominican-hvc.json
  node scripts/timetable/run-norway-dnt-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/norway-dnt.json
  node scripts/timetable/run-norway-ovrevoll-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/norway-ovrevoll.json
  node scripts/timetable/run-austria-krieau-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/austria.json
  node scripts/timetable/run-croatia-hgs-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/croatia.json
  node scripts/timetable/run-serbia-belgrade-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/serbia.json
  node scripts/timetable/run-switzerland-suisse-trot-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/switzerland-trot.json
  node scripts/timetable/run-switzerland-galop-suisse-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/switzerland-galop.json
  node scripts/timetable/run-netherlands-ndr-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/netherlands.json
  node scripts/timetable/run-poland-pkwk-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/poland.json
  node scripts/timetable/run-romania-ploiesti-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/romania.json
  node scripts/timetable/run-malaysia-mra-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/malaysia.json
  node scripts/timetable/run-cyprus-nrc-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/cyprus.json
  node scripts/timetable/run-belgium-trotting-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/belgium-trotting.json
  node scripts/timetable/run-belize-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/belize.json
  node scripts/timetable/run-puerto-rico-camarero-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/puerto-rico.json
  node scripts/timetable/run-qatar-qrec-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/qatar.json
  node scripts/timetable/run-barbados-official-window.mjs \
    --days="${DAYS}" \
    --output=.calendar-unified/barbados.json
  node scripts/timetable/enforce-reviewed-calendar-exclusions.mjs \
    --artifact=.calendar-unified/hkjc.json \
    --artifact=.calendar-unified/uae.json \
    --artifact=.calendar-unified/kra.json \
    --artifact=.calendar-unified/tjk.json \
    --artifact=.calendar-unified/sorec.json \
    --artifact=.calendar-unified/chile.json \
    --artifact=.calendar-unified/ireland.json \
    --artifact=.calendar-unified/peru.json \
    --artifact=.calendar-unified/saudi-arabia.json \
    --artifact=.calendar-unified/france-galop.json \
    --artifact=.calendar-unified/france-letrot.json \
    --artifact=.calendar-unified/new-zealand-thoroughbred.json \
    --artifact=.calendar-unified/new-zealand-harness.json \
    --artifact=.calendar-unified/united-kingdom.json \
    --artifact=.calendar-unified/slovakia.json \
    --artifact=.calendar-unified/bahrain.json \
    --artifact=.calendar-unified/sweden.json \
    --artifact=.calendar-unified/germany.json \
    --artifact=.calendar-unified/spain.json \
    --artifact=.calendar-unified/italy-gallop.json \
    --artifact=.calendar-unified/italy-trot.json \
    --artifact=.calendar-unified/south-africa-race-coast.json \
    --artifact=.calendar-unified/south-africa-four-racing.json \
  --artifact=.calendar-unified/panama.json \
  --artifact=.calendar-unified/brazil-gavea.json \
  --artifact=.calendar-unified/brazil-cristal.json \
  --artifact=.calendar-unified/brazil-cidade-jardim.json \
  --artifact=.calendar-unified/brazil-sorocaba.json \
  --artifact=.calendar-unified/mexico.json \
  --artifact=.calendar-unified/uruguay.json \
  --artifact=.calendar-unified/finland.json \
  --artifact=.calendar-unified/jamaica.json \
  --artifact=.calendar-unified/czech.json \
  --artifact=.calendar-unified/denmark.json \
  --artifact=.calendar-unified/hungary.json \
  --artifact=.calendar-unified/dominican-hvc.json \
  --artifact=.calendar-unified/norway-dnt.json \
  --artifact=.calendar-unified/norway-ovrevoll.json \
  --artifact=.calendar-unified/austria.json \
  --artifact=.calendar-unified/croatia.json \
  --artifact=.calendar-unified/serbia.json \
  --artifact=.calendar-unified/switzerland-trot.json \
  --artifact=.calendar-unified/switzerland-galop.json \
  --artifact=.calendar-unified/netherlands.json \
  --artifact=.calendar-unified/poland.json \
  --artifact=.calendar-unified/romania.json \
  --artifact=.calendar-unified/malaysia.json \
  --artifact=.calendar-unified/cyprus.json \
  --artifact=.calendar-unified/belgium-trotting.json \
  --artifact=.calendar-unified/belize.json \
  --artifact=.calendar-unified/puerto-rico.json \
  --artifact=.calendar-unified/qatar.json \
  --artifact=.calendar-unified/barbados.json
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/hkjc.json \
    --country-id=hong-kong \
    --authority-id=hkjc \
    --racing-system-id=hong-kong-hkjc-system \
    --timezone=Asia/Hong_Kong
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/uae.json \
    --country-id=united-arab-emirates \
    --authority-id=emirates-racing-authority \
    --racing-system-id=uae-national-racing-system \
    --timezone=Asia/Dubai
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/kra.json \
    --country-id=south-korea \
    --authority-id=korea-racing-authority \
    --racing-system-id=kra-national-racing-system \
    --timezone=Asia/Seoul
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/tjk.json \
    --country-id=turkey \
    --authority-id=turkiye-jokey-kulubu \
    --racing-system-id=tjk-national-racing-system \
    --timezone=Europe/Istanbul
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/sorec.json \
    --country-id=morocco \
    --authority-id=sorec \
    --racing-system-id=sorec-racing-information-system \
    --timezone=Africa/Casablanca
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/chile.json \
    --country-id=chile \
    --authority-id=teletrak-chile \
    --racing-system-id=chile-teletrak-racing-system \
    --timezone=America/Santiago
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/ireland.json \
    --country-id=ireland \
    --authority-id=horse-racing-ireland \
    --racing-system-id=ireland-hri-racing-system \
    --timezone=Europe/Dublin
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/peru.json \
    --country-id=peru \
    --authority-id=hipodromo-de-monterrico \
    --racing-system-id=peru-monterrico-programme-system \
    --timezone=America/Lima
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/saudi-arabia.json \
    --country-id=saudi-arabia \
    --authority-id=jockey-club-of-saudi-arabia \
    --racing-system-id=saudi-arabia-jcsa-system \
    --timezone=Asia/Riyadh
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/france-galop.json \
    --country-id=france \
    --authority-id=france-galop \
    --racing-system-id=france-france-galop-system \
    --timezone=Europe/Paris
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/france-letrot.json \
    --country-id=france \
    --authority-id=letrot \
    --racing-system-id=france-letrot-system \
    --timezone=Europe/Paris
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/new-zealand-thoroughbred.json \
    --country-id=new-zealand \
    --authority-id=new-zealand-thoroughbred-racing \
    --racing-system-id=new-zealand-thoroughbred-system \
    --timezone=Pacific/Auckland
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/new-zealand-harness.json \
    --country-id=new-zealand \
    --authority-id=harness-racing-new-zealand \
    --racing-system-id=new-zealand-harness-system \
    --timezone=Pacific/Auckland
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/united-kingdom.json \
    --country-id=united-kingdom \
    --authority-id=british-horseracing-authority \
    --racing-system-id=united-kingdom-bha-system \
    --timezone=Europe/London
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/slovakia.json \
    --country-id=slovakia \
    --authority-id=zavodisko \
    --racing-system-id=slovakia-zavodisko-system \
    --timezone=Europe/Bratislava
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/bahrain.json \
    --country-id=bahrain \
    --authority-id=bahrain-turf-club \
    --racing-system-id=bahrain-turf-club-system \
    --timezone=Asia/Bahrain
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/sweden.json \
    --country-id=sweden \
    --authority-id=svensk-galopp \
    --racing-system-id=sweden-svensk-galopp-system \
    --timezone=Europe/Stockholm
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/germany.json \
    --country-id=germany \
    --authority-id=deutscher-galopp \
    --racing-system-id=germany-deutscher-galopp-system \
    --timezone=Europe/Berlin
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/spain.json \
    --country-id=spain \
    --authority-id=hipodromo-zarzuela \
    --racing-system-id=spain-reviewed-gallop-system \
    --timezone=Europe/Madrid
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/italy-gallop.json \
    --country-id=italy \
    --authority-id=masaf \
    --racing-system-id=italy-masaf-gallop-system \
    --timezone=Europe/Rome
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/italy-trot.json \
    --country-id=italy \
    --authority-id=masaf \
    --racing-system-id=italy-masaf-trot-system \
    --timezone=Europe/Rome
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/south-africa-race-coast.json \
    --country-id=south-africa \
    --authority-id=race-coast \
    --racing-system-id=south-africa-race-coast-system \
    --timezone=Africa/Johannesburg
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/south-africa-four-racing.json \
    --country-id=south-africa \
    --authority-id=four-racing \
    --racing-system-id=south-africa-4racing-system \
    --timezone=Africa/Johannesburg
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/panama.json \
    --country-id=panama \
    --authority-id=hipica-de-panama \
    --racing-system-id=presidente-remon-racing-system \
    --timezone=America/Panama
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/brazil-gavea.json \
    --country-id=brazil \
    --authority-id=jockey-club-brasileiro \
    --racing-system-id=brazil-gavea-system \
    --timezone=America/Sao_Paulo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/brazil-cristal.json \
    --country-id=brazil \
    --authority-id=jockey-club-do-rio-grande-do-sul \
    --racing-system-id=brazil-cristal-system \
    --timezone=America/Sao_Paulo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/brazil-cidade-jardim.json \
    --country-id=brazil \
    --authority-id=jockey-club-de-sao-paulo \
    --racing-system-id=brazil-cidade-jardim-system \
    --timezone=America/Sao_Paulo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/brazil-sorocaba.json \
    --country-id=brazil \
    --authority-id=jockey-club-de-sorocaba \
    --racing-system-id=brazil-sorocaba-system \
    --timezone=America/Sao_Paulo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/mexico.json \
    --country-id=mexico \
    --authority-id=hipodromo-de-las-americas \
    --racing-system-id=mexico-hipodromo-las-americas-system \
    --timezone=America/Mexico_City
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/uruguay.json \
    --country-id=uruguay \
    --authority-id=hru \
    --racing-system-id=uruguay-hru-system \
    --timezone=America/Montevideo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/finland.json \
    --country-id=finland \
    --authority-id=suomen-hippos \
    --racing-system-id=finland-suomen-hippos-harness-system \
    --timezone=Europe/Helsinki
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/jamaica.json \
    --country-id=jamaica \
    --authority-id=caymanas-park-svrel \
    --racing-system-id=jamaica-reviewed-system \
    --timezone=America/Jamaica
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/czech.json \
    --country-id=czech-republic \
    --authority-id=czech-racing-calendar \
    --racing-system-id=czech-national-calendar-system \
    --timezone=Europe/Prague
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/denmark.json \
    --country-id=denmark \
    --authority-id=klampenborg-galopbane \
    --racing-system-id=denmark-klampenborg-system \
    --timezone=Europe/Copenhagen
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/hungary.json \
    --country-id=hungary \
    --authority-id=kincsem-park \
    --racing-system-id=hungary-kincsem-galopp-calendar-system \
    --timezone=Europe/Budapest
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/dominican-hvc.json \
    --country-id=dominican-republic \
    --authority-id=hipodromo-v-centenario \
    --racing-system-id=hvc-racing-system \
    --timezone=America/Santo_Domingo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/norway-dnt.json \
    --country-id=norway \
    --authority-id=det-norske-travselskap \
    --racing-system-id=norway-dnt-harness-system \
    --timezone=Europe/Oslo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/norway-ovrevoll.json \
    --country-id=norway \
    --authority-id=ovrevoll \
    --racing-system-id=norway-ovrevoll-gallop-system \
    --timezone=Europe/Oslo
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/austria.json \
    --country-id=austria \
    --authority-id=wiener-trabrenn-verein \
    --racing-system-id=austria-krieau-calendar-system \
    --timezone=Europe/Vienna
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/croatia.json \
    --country-id=croatia \
    --authority-id=hrvatski-galopski-savez \
    --racing-system-id=croatian-gallop-system \
    --timezone=Europe/Zagreb
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/serbia.json \
    --country-id=serbia \
    --authority-id=belgrade-hippodrome \
    --racing-system-id=serbia-belgrade-hippodrome-system \
    --timezone=Europe/Belgrade
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/switzerland-trot.json \
    --country-id=switzerland \
    --authority-id=suisse-trot \
    --racing-system-id=switzerland-suisse-trot-system \
    --timezone=Europe/Zurich
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/switzerland-galop.json \
    --country-id=switzerland \
    --authority-id=galop-suisse \
    --racing-system-id=switzerland-galop-suisse-system \
    --timezone=Europe/Zurich
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/netherlands.json \
    --country-id=netherlands \
    --authority-id=ndr \
    --racing-system-id=netherlands-ndr-racing-calendar-system \
    --timezone=Europe/Amsterdam
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/poland.json \
    --country-id=poland \
    --authority-id=pkwk \
    --racing-system-id=poland-pkwk-national-plan-system \
    --timezone=Europe/Warsaw
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/romania.json \
    --country-id=romania \
    --authority-id=csm-ploiesti \
    --racing-system-id=romania-ploiesti-system \
    --timezone=Europe/Bucharest
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/malaysia.json \
    --country-id=malaysia \
    --authority-id=mra \
    --racing-system-id=malaysia-mra-system \
    --timezone=Asia/Kuala_Lumpur
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/cyprus.json \
    --country-id=cyprus \
    --authority-id=nicosia-race-club \
    --racing-system-id=nicosia-national-racing-system \
    --timezone=Europe/Nicosia
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/belgium-trotting.json \
    --country-id=belgium \
    --authority-id=belgian-federation-horse-racing \
    --racing-system-id=belgian-trotting-programme-system \
    --timezone=Europe/Brussels
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/belize.json \
    --country-id=belize \
    --authority-id=horse-racing-investments-limited \
    --racing-system-id=national-racing-schedule \
    --timezone=America/Belize
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/puerto-rico.json \
    --country-id=puerto-rico \
    --authority-id=hipodromo-camarero \
    --racing-system-id=puerto-rico-reviewed-system \
    --timezone=America/Puerto_Rico
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/qatar.json \
    --country-id=qatar \
    --authority-id=qatar-racing-and-equestrian-club \
    --racing-system-id=qatar-qrec-calendar-system \
    --timezone=Asia/Qatar
  node scripts/timetable/apply-official-rolling-observations.mjs \
    --artifact=.calendar-unified/barbados.json \
    --country-id=barbados \
    --authority-id=barbados-turf-club \
    --racing-system-id=barbados-reviewed-system \
    --timezone=America/Barbados
  node scripts/timetable/apply-reviewed-calendar-observations.mjs
  node scripts/timetable/apply-meeting-presence-dispositions.mjs \
  --artifact=.calendar-unified/hkjc.json \
  --artifact=.calendar-unified/uae.json \
  --artifact=.calendar-unified/kra.json \
  --artifact=.calendar-unified/tjk.json \
  --artifact=.calendar-unified/sorec.json \
  --artifact=.calendar-unified/chile.json \
  --artifact=.calendar-unified/ireland.json \
  --artifact=.calendar-unified/peru.json \
  --artifact=.calendar-unified/france-galop.json \
  --artifact=.calendar-unified/france-letrot.json \
  --artifact=.calendar-unified/new-zealand-thoroughbred.json \
  --artifact=.calendar-unified/new-zealand-harness.json \
  --artifact=.calendar-unified/united-kingdom.json
  node scripts/check-confirmed-non-running-publication.mjs
  npm run validate:calendar-public-map-parity
  npm run build
}

stage_remaining_state() {
  git add \
    data/generated/timetable/canonical/meetings.json \
    data/generated/timetable/canonical/meeting-details.json \
    data/generated/timetable/public/meeting-list.json \
    data/generated/timetable/public/meeting-details.json
  git add data/generated/timetable/japan-zero-based-30d-reconciliation.json 2>/dev/null || true
  git add data/generated/timetable/japan-zero-based-3d-reconciliation.json 2>/dev/null || true
  git add data/generated/timetable/meeting-presence.json 2>/dev/null || true
}

git fetch origin main
remote_main="$(git rev-parse origin/main)"
if [[ "$(git rev-parse HEAD)" != "$remote_main" ]]; then
  refresh_non_japan_on_main "$remote_main"
fi


refresh_non_japan_on_main "${1:?remote main sha required}"
