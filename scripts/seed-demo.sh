#!/usr/bin/env bash
# Seed a clean demo dataset against the local dev stack.
#
# Prereqs:
#   - podman-compose stack running (db, national, replicator, web)
#   - demo data tables truncated; users/companies/regions preserved.
#     See README in docs/testing/e2e-coverage.md for the wipe procedure.
#
# Produces 3 cooperative approaches in varied states + 4 programmes
# spanning Awaiting/Approved/Authorised/Authorised+Issued under the
# active CA, plus a CA-ADJ calculation. Idempotent only against an
# empty DB (CA / IR / programme ids are server-generated counters that
# only restart from 1 after a wipe).

set -euo pipefail

API=http://localhost:3000/national
DB_CONTAINER=db
EVENTS_DB=carbondevEvents

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
extract() { python3 -c "import sys,json; d=json.load(sys.stdin); inner=d.get('data') if isinstance(d.get('data'), dict) else d; print(inner.get('$1') if inner else '')"; }

login() {
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"123\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])'
}

DNA=$(login palinda+add@xeptagon.com)
PD=$(login palinda+dev@xeptagon.com)
echo "[seed] tokens acquired"

# call returns the body and exits non-zero on non-2xx HTTP status.
# Some endpoints return a wrapped DataResponseDto with statusCode, others
# return the raw entity, so we trust the HTTP status from curl, not the
# body's statusCode field. Caller does `set -e` so non-zero halts.
call() {
  # call <method> <token> <path> [<body>]
  local method=$1 token=$2 path=$3 body=${4:-}
  local tmp=$(mktemp)
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -o "$tmp" -w '%{http_code}' -X "$method" "$API$path" \
      -H "Authorization: Bearer $token" \
      -H 'Content-Type: application/json' \
      -d "$body")
  else
    code=$(curl -s -o "$tmp" -w '%{http_code}' -X "$method" "$API$path" \
      -H "Authorization: Bearer $token")
  fi
  local out=$(cat "$tmp")
  rm -f "$tmp"
  if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
    echo "  !! HTTP $code on $method $path :: $(echo "$out" | head -c 200)" >&2
    return 1
  fi
  echo "$out"
}

wait_for_programme_in_rdbms() {
  # The replicator polls every 1s. addDocument's findById reads the
  # RDBMS, so we have to wait until the freshly-created programme has
  # been replicated from the ledger. Cap at 15s.
  local pid=$1 deadline=$(($(date +%s) + 15))
  while [ $(date +%s) -lt $deadline ]; do
    if podman exec "$DB_CONTAINER" psql -U root -d carbondev -tAc "SELECT 1 FROM programme WHERE \"programmeId\"='$pid'" 2>/dev/null | grep -q 1; then
      return 0
    fi
    sleep 0.5
  done
  echo "  !! programme $pid did not replicate to RDBMS within 15s"
  return 1
}

PDF='data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKCg=='
NOW_MS=$(($(date +%s) * 1000))
START_MS=$((NOW_MS + 86400000))
END_MS=$((START_MS + 86400000 * 365))
COUNTRY=NG

# ---------------------------------------------------------------------
# Ledger init rows. authProgrammeStatus reads `overall` keyed by country
# code and `company` rows for each programme proponent
# (programme-ledger.service.ts:1830-1836). On a freshly-truncated DB we
# need to seed both.
# ---------------------------------------------------------------------
echo "[seed] Wiping + initialising ledger overall + company tables"
podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c "TRUNCATE overall, company RESTART IDENTITY;" > /dev/null
podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c \
  "INSERT INTO overall (data, meta) VALUES ('{\"txId\":\"$COUNTRY\",\"txRef\":\"seed-init\",\"txType\":\"0\",\"credit\":0}'::jsonb, '{}'::jsonb);" \
  > /dev/null
# Seed a company ledger row per RDBMS company so authProgrammeStatus's
# companyIds lookup (programme-ledger.service.ts:1834) finds an entry.
podman exec "$DB_CONTAINER" psql -U root -d carbondev -tAc "SELECT \"companyId\" FROM company;" 2>/dev/null \
  | while read cid; do
    [ -z "$cid" ] && continue
    podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c \
      "INSERT INTO company (data, meta) VALUES ('{\"txId\":\"$cid\",\"txRef\":\"seed-init\",\"txType\":\"0\",\"credit\":0}'::jsonb, '{}'::jsonb);" \
      > /dev/null
  done
echo "  + overall + company ledger rows seeded"

# ---------------------------------------------------------------------
# Cooperative Approaches
# ---------------------------------------------------------------------
echo "[seed] CA-1 Ghana-Switzerland (target: Active + Submitted IR)"
RESP=$(call POST "$DNA" /cooperativeApproach/create '{"title":"Ghana-Switzerland Cooperative Approach","participatingParties":["GH","CH"],"hostParty":"NG","description":"Bilateral approach to authorize ITMO transfers from Ghana to Switzerland under Decision 2/CMA.3.","expectedMitigationOutcomes":"500000","environmentalIntegrityAssessment":"Conservative baselines; no double-counting; additionality demonstrated."}')
CA1=$(echo "$RESP" | extract cooperativeApproachId)
echo "  $CA1"
RESP=$(call PUT "$DNA" /cooperativeApproach/update "{\"cooperativeApproachId\":\"$CA1\",\"status\":\"Active\"}")
RESP=$(call POST "$DNA" /initialReport/generate "{\"cooperativeApproachId\":\"$CA1\"}")
IR1=$(echo "$RESP" | extract reportId)
RESP=$(call PUT "$DNA" "/initialReport/submit?id=$IR1")
echo "  $IR1 Submitted"

echo "[seed] CA-2 Nigeria-Japan (target: Active + Draft IR)"
RESP=$(call POST "$DNA" /cooperativeApproach/create '{"title":"Nigeria-Japan Cooperative Approach","participatingParties":["NG","JP"],"hostParty":"NG","description":"Bilateral approach for energy-sector ITMO transfers.","expectedMitigationOutcomes":"250000","environmentalIntegrityAssessment":"Conservative baselines."}')
CA2=$(echo "$RESP" | extract cooperativeApproachId)
echo "  $CA2"
RESP=$(call PUT "$DNA" /cooperativeApproach/update "{\"cooperativeApproachId\":\"$CA2\",\"status\":\"Active\"}")
RESP=$(call POST "$DNA" /initialReport/generate "{\"cooperativeApproachId\":\"$CA2\"}")
IR2=$(echo "$RESP" | extract reportId)
echo "  $IR2 Draft"

echo "[seed] CA-3 Test CA — Suspended"
RESP=$(call POST "$DNA" /cooperativeApproach/create '{"title":"Test CA — Suspended","participatingParties":["NG","DE"],"hostParty":"NG","description":"Suspended CA to demonstrate the Draft -/CMA.5 paras 20-21 authorize gate.","expectedMitigationOutcomes":"100000","environmentalIntegrityAssessment":"Pending."}')
CA3=$(echo "$RESP" | extract cooperativeApproachId)
echo "  $CA3"
RESP=$(call PUT "$DNA" /cooperativeApproach/update "{\"cooperativeApproachId\":\"$CA3\",\"status\":\"Active\"}")
RESP=$(call PUT "$DNA" /cooperativeApproach/update "{\"cooperativeApproachId\":\"$CA3\",\"status\":\"Suspended\"}")

# ---------------------------------------------------------------------
# Programmes (all under CA-1)
# ---------------------------------------------------------------------
create_programme() {
  local title=$1 ext=$2
  local body=$(cat <<JSON
{
  "title":"$title",
  "externalId":"$ext",
  "sectoralScope":"1",
  "sector":"Energy",
  "startTime":$START_MS,
  "endTime":$END_MS,
  "proponentTaxVatId":["33333"],
  "proponentPercentage":[100],
  "article6trade":true,
  "cooperativeApproachId":"$CA1",
  "creditEst":1000,
  "creditUnit":"tCO2e",
  "implementinguser":6,
  "environmentalAssessmentRegistrationNo":"EAR-$ext",
  "designDocument":"$PDF",
  "programmeProperties":{"estimatedProgrammeCostUSD":10000,"geographicalLocation":["Abia"],"greenHouseGasses":["CO2"]}
}
JSON
)
  local resp
  resp=$(call POST "$DNA" /programme/create "$body")
  echo "$resp" | extract programmeId
}

upload_methodology() {
  local pid=$1
  wait_for_programme_in_rdbms "$pid"
  call POST "$DNA" /programme/addDocument "{\"programmeId\":\"$pid\",\"type\":\"1\",\"data\":\"$PDF\"}" > /dev/null
}

# Programme A — AwaitingAuthorization (no methodology)
echo "[seed] Programme A (target: AwaitingAuthorization)"
PA=$(create_programme "Solar PV Mini-grid — Awaiting Authorization" "DEMO-PROG-AWAITING")
echo "  $PA"

# Programme B — Approved
echo "[seed] Programme B (target: Approved)"
PB=$(create_programme "Mangrove Reforestation — Approved" "DEMO-PROG-APPROVED")
upload_methodology "$PB"
echo "  $PB"

# Programme C — Authorised
echo "[seed] Programme C (target: Authorised)"
PC=$(create_programme "Cookstove Distribution — Authorised" "DEMO-PROG-AUTHORISED")
upload_methodology "$PC"
RESP=$(call PUT "$DNA" /programme/authorize "{\"programmeId\":\"$PC\",\"comment\":\"Authorized for ITMO issuance under Decision 2/CMA.3 para 18.\"}")
echo "  $PC"

# Programme D — Authorised + Issued (1000 credits)
#
# Order matters: the verified mitigation action has to be appended to
# the ledger BEFORE /authorize, otherwise the SQL inject's txTime can
# race past the subsequent /issue event's Node-side txTime (clock skew
# between the db container and the national container is ~50-200ms).
# When that happens the replicator's "previousTxTime <= incoming"
# guard (process.event.service.ts:340) silently drops the /issue
# update and the RDBMS programme row stays at creditIssued=0.
echo "[seed] Programme D (target: Authorised + Issued)"
PD_ID=$(create_programme "Wind Farm — Authorised + Issued" "DEMO-PROG-ISSUED")
upload_methodology "$PD_ID"

# Inject verified mitigation action onto the post-METHODOLOGY ledger row.
NDC_ID=NDC-DEMO-D
ACTION_PAYLOAD="{\"typeOfMitigation\":\"Energy industries\",\"userEstimatedCredits\":1000,\"systemEstimatedCredits\":1000,\"actionId\":\"$NDC_ID\",\"projectMaterial\":[\"https://example.com/VERIFICATION_REPORT/$NDC_ID.pdf\"],\"properties\":{\"issuedCredits\":0,\"availableCredits\":1000},\"constantVersion\":\"1.0\"}"
podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c "
WITH latest AS (
  SELECT data FROM programmes
  WHERE data->>'programmeId' = '$PD_ID'
  ORDER BY hash DESC LIMIT 1
)
INSERT INTO programmes (data, meta)
SELECT
  jsonb_set(
    jsonb_set(data, '{mitigationActions}', COALESCE(data->'mitigationActions','[]'::jsonb) || '$ACTION_PAYLOAD'::jsonb),
    '{txTime}',
    to_jsonb((extract(epoch from now())::bigint * 1000) - 10000)
  ),
  '{}'::jsonb
FROM latest;" > /dev/null
echo "  + verified mitigation action seeded onto ledger (pre-authorize)"

call PUT "$DNA" /programme/authorize "{\"programmeId\":\"$PD_ID\",\"comment\":\"Authorized.\"}" > /dev/null
RESP=$(call PUT "$DNA" /programme/issue "{\"programmeId\":\"$PD_ID\",\"issueAmount\":[{\"actionId\":\"$NDC_ID\",\"issueCredit\":1000}]}") || true
echo "  $PD_ID Authorised + issued 1000 credits"

# Materialise credit blocks directly. /programme/issue updates the
# programme.creditIssued counter via the ledger, but the local
# CARBON_UNIFIED mode doesn't append credit_blocks ledger events from
# this code path (the project-flow issuance at programme-ledger
# .service.ts:482 does, but Article 6.2 /programme/issue does not).
# Seed three blocks so the Credit Balance page has demo content
# reflecting the OMGE / SOP deductions.
SEED_YEAR=$(date +%Y)
# itmoSerial: Dec 6/CMA.4 Annex I para 5 structured serial — party,
# itmoType, vintage, activityId, range. Stable across splits per
# Draft -/CMA.5 ¶132.
ITMO_SERIAL_BASE="NG-tCO2e-1-$PD_ID-$SEED_YEAR"
ITMO_HOLDING="$ITMO_SERIAL_BASE-1-930"
ITMO_OMGE="$ITMO_SERIAL_BASE-931-950"
ITMO_SOP="$ITMO_SERIAL_BASE-951-1000"
# serialNumber: must follow composeNumberedSerialNumber's 7-part shape
# `<prefix>-<start>-<end>-<vintage>` (prefix is 4 dash-separated parts)
# so splitCreditBlockSerialNumber/getCreditBlockId can parse it during
# transfer or partial-retire flows. A flat label like "SN-DEMO-D-HOLD"
# parses to NaN start/end and breaks split → "SN-...-NaN-NaN-undefined".
SN_PREFIX="NG-tCO2e-1-$PD_ID"
SN_HOLDING="$SN_PREFIX-1-930-$SEED_YEAR"
SN_OMGE="$SN_PREFIX-931-950-$SEED_YEAR"
SN_SOP="$SN_PREFIX-951-1000-$SEED_YEAR"
podman exec "$DB_CONTAINER" psql -U root -d carbondev -c "
INSERT INTO credit_blocks_entity (
  \"creditBlockId\",\"txRef\",\"txType\",\"txTime\",\"ownerCompanyId\",
  \"projectRefId\",\"serialNumber\",\"itmoSerial\",\"vintage\",
  \"creditAmount\",\"isNotTransferred\",\"reservedCreditAmount\",\"createTime\",
  \"cooperativeApproachId\",\"authorizationPurpose\",
  \"accountType\",\"omgeDeductedAtIssuance\",\"sopDeductedAtIssuance\"
) VALUES
  ('BLK-DEMO-D-HOLD','seed-init','2',(EXTRACT(EPOCH FROM NOW())::bigint*1000),1,
   '$PD_ID','$SN_HOLDING','$ITMO_HOLDING','$SEED_YEAR',
   930,TRUE,0,(EXTRACT(EPOCH FROM NOW())::bigint*1000),
   '$CA1','UseTowardsNDC','Holding',TRUE,TRUE),
  ('BLK-DEMO-D-OMGE','seed-init','2',(EXTRACT(EPOCH FROM NOW())::bigint*1000),1,
   '$PD_ID','$SN_OMGE','$ITMO_OMGE','$SEED_YEAR',
   20,TRUE,0,(EXTRACT(EPOCH FROM NOW())::bigint*1000),
   '$CA1','UseTowardsNDC','CancellationOMGE',TRUE,TRUE),
  ('BLK-DEMO-D-SOP','seed-init','2',(EXTRACT(EPOCH FROM NOW())::bigint*1000),1,
   '$PD_ID','$SN_SOP','$ITMO_SOP','$SEED_YEAR',
   50,TRUE,0,(EXTRACT(EPOCH FROM NOW())::bigint*1000),
   '$CA1','UseTowardsNDC','CancellationSOP',TRUE,TRUE);
" > /dev/null
echo "  + 3 credit blocks materialised (Holding 930, OMGE 20, SOP 50)"

# ---------------------------------------------------------------------
# Mirror programmes into the LEDGER `project` table. The credit-transfer
# and retire services do `getAndUpdateTx` against this ledger keyed by
# refId == projectRefId. credit_blocks_entity rows above carry
# projectRefId='<programmeId>', so each programme needs a matching
# ledger project row. Without this, transfer/retire would 400 with
# "project.programmeNotExistWIthId<id>" even though the credit blocks
# are present in the RDBMS. Mirrors the seedTransferrableBlock factory
# pattern from tests/e2e/article6/support/factories.ts:394.
# ---------------------------------------------------------------------
echo "[seed] Seeding ledger project rows for transfer/retire flows"
seed_ledger_project() {
  local pid=$1 title=$2 issued=$3 balance=$4
  local data=$(cat <<JSON
{"refId":"$pid","title":"$title","companyId":1,"independentCertifiers":[],"sector":"Energy","sectoralScope":"1","txType":"1","txRef":"seed-init","txTime":$NOW_MS,"createTime":$NOW_MS,"updateTime":$NOW_MS,"creditEst":1000,"creditBalance":$balance,"creditRetired":0,"creditTransferred":0,"creditIssued":$issued,"creditChange":0,"cooperativeApproachId":"$CA1","authorizationPurpose":"UseTowardsNDC"}
JSON
)
  podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c \
    "INSERT INTO project (data, meta) VALUES ('$(echo "$data" | sed "s/'/''/g")'::jsonb, '{}'::jsonb);" \
    > /dev/null
}
seed_ledger_project "$PA"    "Solar PV Mini-grid — Awaiting Authorization" 0    0
seed_ledger_project "$PB"    "Mangrove Reforestation — Approved"           0    0
seed_ledger_project "$PC"    "Cookstove Distribution — Authorised"         0    0
seed_ledger_project "$PD_ID" "Wind Farm — Authorised + Issued"             1000 1000
echo "  + 4 ledger project rows"

# ---------------------------------------------------------------------
# Mirror credit blocks into the LEDGER `credit_blocks` table. The
# credit-transfer / retire-request services do `getAndUpdateTx` against
# this ledger keyed by creditBlockId. Without this, transfer/retire
# would 400 with "project.creditBlockNotExistWIthCreditBlockId<id>"
# even though credit_blocks_entity (RDBMS) was just populated above.
# Mirrors the seedTransferrableBlock factory pattern from
# tests/e2e/article6/support/factories.ts:427.
# ---------------------------------------------------------------------
seed_ledger_credit_block() {
  local block_id=$1 sn=$2 itmo=$3 amount=$4 account=$5
  local data=$(cat <<JSON
{"creditBlockId":"$block_id","txRef":"seed-init","txType":"2","txTime":$NOW_MS,"ownerCompanyId":1,"projectRefId":"$PD_ID","serialNumber":"$sn","itmoSerial":"$itmo","vintage":"$SEED_YEAR","creditAmount":$amount,"isNotTransferred":true,"reservedCreditAmount":0,"createTime":$NOW_MS,"accountType":"$account","authorizationPurpose":"UseTowardsNDC","cooperativeApproachId":"$CA1","omgeDeductedAtIssuance":true,"sopDeductedAtIssuance":true,"transactionRecords":[]}
JSON
)
  podman exec "$DB_CONTAINER" psql -U root -d "$EVENTS_DB" -c \
    "INSERT INTO credit_blocks (data, meta) VALUES ('$(echo "$data" | sed "s/'/''/g")'::jsonb, '{}'::jsonb);" \
    > /dev/null
}
seed_ledger_credit_block "BLK-DEMO-D-HOLD" "$SN_HOLDING" "$ITMO_HOLDING" 930 "Holding"
seed_ledger_credit_block "BLK-DEMO-D-OMGE" "$SN_OMGE"    "$ITMO_OMGE"     20 "CancellationOMGE"
seed_ledger_credit_block "BLK-DEMO-D-SOP"  "$SN_SOP"     "$ITMO_SOP"      50 "CancellationSOP"
echo "  + 3 ledger credit_blocks rows"

# ---------------------------------------------------------------------
# Mirror the four programmes into project_entity so the UI's
# "Project Details" page (/programmeManagement/viewAll →
# /national/projectManagement/query) sees them. The dev codebase
# carries two parallel project models — the legacy `programme` table
# populated by /programme/create, and the newer `project_entity`
# powering the UI's project list. Real production traffic populates
# both via parallel async writes; the local seed bypass writes
# project_entity directly.
# ---------------------------------------------------------------------
echo "[seed] Mirroring programmes -> project_entity for UI list visibility"
mirror_project() {
  local pid=$1 title=$2 stage=$3 issued=$4 balance=$5
  # ON CONFLICT DO UPDATE so this step is idempotent against rows the
  # replicator may already have written (it writes project_entity for
  # programmes that have been through the methodology+authorize event
  # chain — i.e. our 003 + 004 — once the replicator catches up).
  podman exec "$DB_CONTAINER" psql -U root -d carbondev -c "
INSERT INTO project_entity (
  \"refId\",\"title\",\"companyId\",\"independentCertifiers\",\"projectProposalStage\",
  \"sector\",\"sectoralScope\",\"projectAuthorizationTime\",\"txType\",\"txTime\",
  \"createTime\",\"updateTime\",\"creditEst\",\"creditBalance\",\"creditIssued\",\"creditChange\",
  \"cooperativeApproachId\",\"authorizationPurpose\"
) VALUES (
  '$pid','$title',1,'{}','$stage',
  'Energy','1',$([ "$stage" = "AUTHORISED" ] && echo "$NOW_MS" || echo "NULL"),'0',(EXTRACT(EPOCH FROM NOW())::bigint*1000),
  (EXTRACT(EPOCH FROM NOW())::bigint*1000),(EXTRACT(EPOCH FROM NOW())::bigint*1000),
  1000,$balance,$issued,0,
  '$CA1','UseTowardsNDC'
)
ON CONFLICT (\"refId\") DO UPDATE SET
  \"title\" = EXCLUDED.\"title\",
  \"projectProposalStage\" = EXCLUDED.\"projectProposalStage\",
  \"creditEst\" = EXCLUDED.\"creditEst\",
  \"creditBalance\" = EXCLUDED.\"creditBalance\",
  \"creditIssued\" = EXCLUDED.\"creditIssued\",
  \"cooperativeApproachId\" = EXCLUDED.\"cooperativeApproachId\",
  \"authorizationPurpose\" = EXCLUDED.\"authorizationPurpose\";" > /dev/null
}
mirror_project "$PA"     "Solar PV Mini-grid — Awaiting Authorization" "PENDING"    0    0
mirror_project "$PB"     "Mangrove Reforestation — Approved"           "APPROVED"   0    0
mirror_project "$PC"     "Cookstove Distribution — Authorised"         "AUTHORISED" 0    0
mirror_project "$PD_ID"  "Wind Farm — Authorised + Issued"             "AUTHORISED" 1000 1000
echo "  + 4 project_entity rows"

# ---------------------------------------------------------------------
# Corresponding Adjustment
# ---------------------------------------------------------------------
YEAR=$(date +%Y)
echo "[seed] CA-ADJ for $CA1 year=$YEAR"
RESP=$(call POST "$DNA" /correspondingAdjustment/calculate "{\"year\":$YEAR,\"cooperativeApproachId\":\"$CA1\",\"ndcType\":\"SingleYear\",\"caMethod\":\"Trajectory\"}")
CA_ADJ=$(echo "$RESP" | extract caId)
echo "  $CA_ADJ"

# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------
echo
echo "[seed] Done. Login as DNA Admin (palinda+add@xeptagon.com / 123) and visit:"
echo "  Cooperative Approaches    -> $CA1 Active, $CA2 Active, $CA3 Suspended"
echo "  Initial Reports           -> $IR1 Submitted, $IR2 Draft"
echo "  Project Details           -> $PA Awaiting, $PB Approved, $PC Authorised, $PD_ID Authorised+Issued"
echo "  Credits / Credit Balance  -> issued blocks from $PD_ID"
echo "  Corresponding Adjustments -> $CA_ADJ"
