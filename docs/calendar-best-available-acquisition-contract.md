# Calendar Best Available acquisition contract

`C`, `B`, `B+`, and `A` are evidence states, not terminal acquisition success states.

For every scheduled refresh, a currently implemented Calendar acquisition system must:

1. re-run meeting discovery for its configured future window, including dates that were blank on the previous run;
2. preserve every published detail route discovered from the authority/source page;
3. for every meeting below `A+`, attempt every currently published configured higher-detail route applicable to that meeting;
4. derive the resulting rank only from normalized evidence;
5. retry lower-rank meetings on later scheduled refreshes because richer programme/racecard data may be published later;
6. continue to refresh `A+` meetings for changes, cancellations and corrections even though no rank escalation remains.

A lower rank may be the correct observed rank for a run. It must never suppress later discovery or enrichment attempts.

Collector artifacts must expose, at minimum, whether lower-rank meetings existed, how many detail routes were published, how many were attempted/succeeded, and which meetings remain pending publication of a configured detail route.
