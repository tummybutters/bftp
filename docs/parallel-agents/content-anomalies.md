# Content Anomalies

Use this file to log live-site content problems that should be preserved for clone fidelity now and only cleaned later by explicit choice.

## Round 2 Snapshot

- automated anomaly coverage now spans the full long-tail city corpus, with checks aimed at:
  - neighborhood and service-area drift
  - regulation-copy locality drift
  - county-label drift
  - city-label drift
  - source taxonomy mismatches
  - visible live-copy typos
- the generator now filters obvious county-name false positives such as `Los Angeles County` references so the anomaly feed is narrower and more actionable
- current high-signal counts in `site/data/generated/content-anomalies.json`:
  - `20` `source_family_mismatch`
  - `3` `locality_drift_regulations`
  - `1` `locality_drift_service_area`
  - `1` `locality_drift_neighborhoods`
  - visible typo buckets across the FAQ and regulation corpus

## High-Signal Locality Drift

- Rancho Santa Margarita:
  - the neighborhood/service-area block drifts into Carlsbad neighborhood copy
  - the automated audit also flags Carlsbad mentions inside the mapped service-area block
- Mission Viejo:
  - the regulations section injects Tustin-specific requirements mid-page
  - this is preserved in the generated payload and logged as `locality_drift_regulations`
- Hollywood:
  - the regulations payload still blends heavily into Los Angeles-specific agency and authority language
  - keep as-is for clone fidelity now; this is a likely round 3 manual-review candidate rather than something to auto-clean

## Taxonomy Drift

- `20` San Diego city pages are source-labeled as `core_service` in the forensic CSVs even though their slug pattern and ordered sections clearly fit the county/city landing family
- generated payloads preserve the original source label in `sourceTemplateFamily` and expose the corrected render family in `family`

## Visible Copy Defects To Preserve

- Alhambra preserves the visible H2 typo `Intallation`
- core-service FAQ and promo copy preserve visible typos such as `differnt` and `installationn`
- regulation copy still includes visible typo cases such as `Regualatory`

## Archived-Only Decisions

- `/annual-backflow-testing` should redirect to `/backflow-testing`
- `/contact-us` should redirect to `/contact-backflowtestpros`
- `/flowexpo` should stay out of the rebuild unless backlink or campaign continuity later proves it needs a live destination
- `/landscape-expo` should stay out of the rebuild unless marketing continuity later proves it needs a live destination

## Preservation Rule

- do not silently clean these defects in the generated datasets
- do not “fix” locality drift in templates; render what the payload says
- if a later round chooses to normalize copy, treat that as a deliberate content cleanup pass, not an accidental side effect of the rebuild
