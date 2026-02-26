-- Test data seed for local development
-- Run against the carbondev database after the backend has initialized.

BEGIN;

-- ============================================================
--  Companies
-- ============================================================

INSERT INTO company ("companyId", "taxId", name, email, "phoneNo", country, "companyRole", state, "creditBalance", "programmeCount", "createdTime")
VALUES
  (100, 'PD-001-NG', 'Green Energy Nigeria Ltd', 'info@greenenergy.ng', '+234-800-1111', 'NG', 'PD', '1', 0, 0, EXTRACT(EPOCH FROM NOW())::bigint),
  (101, 'PD-002-NG', 'SolarAfrica Corp', 'contact@solarafrica.ng', '+234-800-2222', 'NG', 'PD', '1', 0, 0, EXTRACT(EPOCH FROM NOW())::bigint),
  (102, 'IC-001-NG', 'Verify Standards International', 'audit@verifystd.com', '+44-20-5555', 'NG', 'IC', '1', 0, 0, EXTRACT(EPOCH FROM NOW())::bigint)
ON CONFLICT ("companyId") DO NOTHING;

INSERT INTO "user" (id, email, password, name, role, "companyId", "companyRole", country, "isPending")
VALUES
  (100, 'pd1@carbon.dev', '123', 'PD1 Admin', 'Admin', 100, 'PD', 'NG', false),
  (101, 'pd2@carbon.dev', '123', 'PD2 Admin', 'Admin', 101, 'PD', 'NG', false),
  (102, 'ic@carbon.dev',  '123', 'IC Admin',  'Admin', 102, 'IC', 'NG', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  Programmes (5 in various stages)
-- ============================================================

INSERT INTO programme (
  "programmeId", "serialNo", title, "externalId",
  "sectoralScope", sector, "countryCodeA2", "currentStage",
  "startTime", "endTime",
  "creditEst", "emissionReductionExpected", "emissionReductionAchieved",
  "creditIssued", "creditBalance", "creditTransferred",
  "proponentTaxVatId", "companyId", "creditUnit",
  "programmeProperties", "txTime", "createdTime", "txType",
  "article6trade", "article68trade", "article64trade", "article62trade",
  "mvcAdjust", "mvcUnadjusted",
  "authTime", "statusUpdateTime"
) VALUES
-- 1) Authorized solar farm
(
  'P001', 'NG-100-2024-P001', 'Lagos Solar Farm Phase I', 'EXT-001',
  '1', 'Energy', 'NG', 'Authorised',
  EXTRACT(EPOCH FROM '2023-01-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2033-12-31'::timestamp)::bigint,
  50000, 50000, 12000,
  12000, 12000, '{0}',
  '{PD-001-NG}', '{100}', 'ITMO',
  '{"geographicalLocation":["Lagos"],"greenHouseGasses":["CO2"],"creditingPeriodInYears":10,"estimatedProgrammeCostUSD":2500000,"sourceOfFunding":"Other","carbonPriceUSDPerTon":15}',
  EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-06-15'::timestamp)::bigint, '8',
  true, false, false, false,
  false, false,
  EXTRACT(EPOCH FROM '2023-09-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2023-09-01'::timestamp)::bigint
),
-- 2) Authorized wind project
(
  'P002', 'NG-100-2024-P002', 'Abuja Wind Energy Project', 'EXT-002',
  '1', 'Energy', 'NG', 'Authorised',
  EXTRACT(EPOCH FROM '2023-03-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2033-02-28'::timestamp)::bigint,
  75000, 75000, 0,
  0, 0, '{0}',
  '{PD-001-NG}', '{100}', 'ITMO',
  '{"geographicalLocation":["Abuja"],"greenHouseGasses":["CO2"],"creditingPeriodInYears":10,"estimatedProgrammeCostUSD":5000000,"sourceOfFunding":"GovernmentGrantOrLoan","carbonPriceUSDPerTon":18}',
  EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-08-20'::timestamp)::bigint, '8',
  true, false, false, false,
  false, false,
  EXTRACT(EPOCH FROM '2024-01-15'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2024-01-15'::timestamp)::bigint
),
-- 3) Awaiting authorization - forestry
(
  'P003', 'NG-101-2024-P003', 'Niger Delta Reforestation', 'EXT-003',
  '14', 'Forestry', 'NG', 'AwaitingAuthorization',
  EXTRACT(EPOCH FROM '2024-01-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2044-12-31'::timestamp)::bigint,
  120000, 120000, 0,
  0, 0, '{0}',
  '{PD-002-NG}', '{101}', 'ITMO',
  '{"geographicalLocation":["Rivers","Bayelsa"],"greenHouseGasses":["CO2","CH4"],"creditingPeriodInYears":20,"estimatedProgrammeCostUSD":8000000,"sourceOfFunding":"Other","carbonPriceUSDPerTon":12}',
  EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2024-03-10'::timestamp)::bigint, '0',
  true, false, false, false,
  false, false,
  NULL, NULL
),
-- 4) Authorized waste-to-energy
(
  'P004', 'NG-101-2024-P004', 'Kano Waste-to-Energy Plant', 'EXT-004',
  '13', 'Waste', 'NG', 'Authorised',
  EXTRACT(EPOCH FROM '2023-06-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2030-05-31'::timestamp)::bigint,
  30000, 30000, 8500,
  8500, 5000, '{3500}',
  '{PD-002-NG}', '{101}', 'ITMO',
  '{"geographicalLocation":["Kano"],"greenHouseGasses":["CO2","CH4"],"creditingPeriodInYears":7,"estimatedProgrammeCostUSD":3200000,"sourceOfFunding":"Other","carbonPriceUSDPerTon":20}',
  EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-10-05'::timestamp)::bigint, '8',
  true, false, false, false,
  false, false,
  EXTRACT(EPOCH FROM '2024-02-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2024-02-01'::timestamp)::bigint
),
-- 5) Rejected agriculture project
(
  'P005', 'NG-100-2025-P005', 'Oyo Sustainable Agriculture', 'EXT-005',
  '15', 'Agriculture', 'NG', 'Rejected',
  EXTRACT(EPOCH FROM '2024-06-01'::timestamp)::bigint,
  EXTRACT(EPOCH FROM '2034-05-31'::timestamp)::bigint,
  20000, 20000, 0,
  0, 0, '{0}',
  '{PD-001-NG}', '{100}', 'ITMO',
  '{"geographicalLocation":["Oyo"],"greenHouseGasses":["N2O"],"creditingPeriodInYears":10,"estimatedProgrammeCostUSD":1500000,"sourceOfFunding":"Other","carbonPriceUSDPerTon":10}',
  EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2024-08-01'::timestamp)::bigint, '1',
  true, false, false, false,
  false, false,
  NULL,
  EXTRACT(EPOCH FROM '2024-09-15'::timestamp)::bigint
)
ON CONFLICT ("programmeId") DO NOTHING;

-- ============================================================
--  Projects (linked to the authorized programmes)
-- ============================================================

INSERT INTO project_entity (
  "refId", "serialNumber", title, "companyId",
  "independentCertifiers", sector, "sectoralScope",
  "projectProposalStage",
  "txType", "txTime", "createTime", "updateTime",
  "creditEst", "creditBalance", "creditRetired", "creditTransferred",
  "creditIssued", "creditChange",
  "projectAuthorizationTime"
) VALUES
(
  'NG-100-2024-P001', 'NG-100-2024-P001', 'Lagos Solar Farm Phase I', 100,
  '{102}', 'Energy', '1',
  'AUTHORIZED',
  '32', EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-06-15'::timestamp)::bigint, EXTRACT(EPOCH FROM NOW())::bigint,
  50000, 12000, 0, 0,
  12000, 0,
  EXTRACT(EPOCH FROM '2023-09-01'::timestamp)::bigint
),
(
  'NG-100-2024-P002', 'NG-100-2024-P002', 'Abuja Wind Energy Project', 100,
  '{102}', 'Energy', '1',
  'AUTHORIZED',
  '32', EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-08-20'::timestamp)::bigint, EXTRACT(EPOCH FROM NOW())::bigint,
  75000, 0, 0, 0,
  0, 0,
  EXTRACT(EPOCH FROM '2024-01-15'::timestamp)::bigint
),
(
  'NG-101-2024-P003', 'NG-101-2024-P003', 'Niger Delta Reforestation', 101,
  '{102}', 'Forestry', '14',
  'PENDING',
  '32', EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2024-03-10'::timestamp)::bigint, EXTRACT(EPOCH FROM NOW())::bigint,
  120000, 0, 0, 0,
  0, 0,
  NULL
),
(
  'NG-101-2024-P004', 'NG-101-2024-P004', 'Kano Waste-to-Energy Plant', 101,
  '{102}', 'Waste', '13',
  'AUTHORIZED',
  '32', EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM '2023-10-05'::timestamp)::bigint, EXTRACT(EPOCH FROM NOW())::bigint,
  30000, 5000, 0, 3500,
  8500, 0,
  EXTRACT(EPOCH FROM '2024-02-01'::timestamp)::bigint
)
ON CONFLICT ("refId") DO NOTHING;

-- ============================================================
--  Credit blocks (for programmes with issued credits)
-- ============================================================

INSERT INTO credit_blocks_entity (
  "creditBlockId", "txRef", "txType", "txTime",
  "ownerCompanyId", "projectRefId", "serialNumber",
  vintage, "creditAmount", "isNotTransferred", "reservedCreditAmount",
  "createTime", "transactionRecords"
) VALUES
(
  'CB-P001-2024-001', 'ISSUE-P001-2024', '2',
  EXTRACT(EPOCH FROM '2024-06-01'::timestamp)::bigint,
  100, 'NG-100-2024-P001', 'NG-100-2024-P001',
  '2024', 12000, true, 0,
  EXTRACT(EPOCH FROM '2024-06-01'::timestamp)::bigint,
  '[]'::jsonb
),
(
  'CB-P004-2024-001', 'ISSUE-P004-2024', '2',
  EXTRACT(EPOCH FROM '2024-08-15'::timestamp)::bigint,
  101, 'NG-101-2024-P004', 'NG-101-2024-P004',
  '2024', 5000, true, 0,
  EXTRACT(EPOCH FROM '2024-08-15'::timestamp)::bigint,
  '[]'::jsonb
),
(
  'CB-P004-2024-002', 'TRANSFER-P004-2024', '3',
  EXTRACT(EPOCH FROM '2024-09-01'::timestamp)::bigint,
  100, 'NG-101-2024-P004', 'NG-101-2024-P004',
  '2024', 3500, false, 0,
  EXTRACT(EPOCH FROM '2024-09-01'::timestamp)::bigint,
  '[]'::jsonb
)
ON CONFLICT ("creditBlockId") DO NOTHING;

-- ============================================================
--  Audit log entries (drives the dashboard analytics)
-- ============================================================

-- P001: PENDING -> APPROVED -> AUTHORISED, then CREDITS_ISSUED
INSERT INTO audit_entity ("refId", "logType", data, "userId", "createdTime") VALUES
  ('NG-100-2024-P001', 'PENDING',    '{"title":"Lagos Solar Farm Phase I"}',   100, EXTRACT(EPOCH FROM '2023-06-15'::timestamp)::bigint),
  ('NG-100-2024-P001', 'APPROVED',   '{"title":"Lagos Solar Farm Phase I"}',   5,   EXTRACT(EPOCH FROM '2023-07-01'::timestamp)::bigint),
  ('NG-100-2024-P001', 'AUTHORISED', '{"title":"Lagos Solar Farm Phase I"}',   5,   EXTRACT(EPOCH FROM '2023-09-01'::timestamp)::bigint),
  ('NG-100-2024-P001', 'CREDITS_ISSUED', '{"amount":12000}',                  5,   EXTRACT(EPOCH FROM '2024-06-01'::timestamp)::bigint);

-- P002: PENDING -> APPROVED -> AUTHORISED
INSERT INTO audit_entity ("refId", "logType", data, "userId", "createdTime") VALUES
  ('NG-100-2024-P002', 'PENDING',    '{"title":"Abuja Wind Energy Project"}',  100, EXTRACT(EPOCH FROM '2023-08-20'::timestamp)::bigint),
  ('NG-100-2024-P002', 'APPROVED',   '{"title":"Abuja Wind Energy Project"}',  5,   EXTRACT(EPOCH FROM '2023-10-01'::timestamp)::bigint),
  ('NG-100-2024-P002', 'AUTHORISED', '{"title":"Abuja Wind Energy Project"}',  5,   EXTRACT(EPOCH FROM '2024-01-15'::timestamp)::bigint);

-- P003: PENDING (still waiting)
INSERT INTO audit_entity ("refId", "logType", data, "userId", "createdTime") VALUES
  ('NG-101-2024-P003', 'PENDING',    '{"title":"Niger Delta Reforestation"}',  101, EXTRACT(EPOCH FROM '2024-03-10'::timestamp)::bigint);

-- P004: PENDING -> APPROVED -> AUTHORISED, then CREDITS_ISSUED + CREDIT_TRANSFERED
INSERT INTO audit_entity ("refId", "logType", data, "userId", "createdTime") VALUES
  ('NG-101-2024-P004', 'PENDING',    '{"title":"Kano Waste-to-Energy Plant"}', 101, EXTRACT(EPOCH FROM '2023-10-05'::timestamp)::bigint),
  ('NG-101-2024-P004', 'APPROVED',   '{"title":"Kano Waste-to-Energy Plant"}', 5,   EXTRACT(EPOCH FROM '2023-12-01'::timestamp)::bigint),
  ('NG-101-2024-P004', 'AUTHORISED', '{"title":"Kano Waste-to-Energy Plant"}', 5,   EXTRACT(EPOCH FROM '2024-02-01'::timestamp)::bigint),
  ('NG-101-2024-P004', 'CREDITS_ISSUED', '{"amount":8500}',                   5,   EXTRACT(EPOCH FROM '2024-08-15'::timestamp)::bigint),
  ('NG-101-2024-P004', 'CREDIT_TRANSFERED', '{"amount":3500}',                5,   EXTRACT(EPOCH FROM '2024-09-01'::timestamp)::bigint);

-- P005: PENDING -> REJECTED
INSERT INTO audit_entity ("refId", "logType", data, "userId", "createdTime") VALUES
  ('NG-100-2025-P005', 'PENDING',  '{"title":"Oyo Sustainable Agriculture"}',  100, EXTRACT(EPOCH FROM '2024-08-01'::timestamp)::bigint),
  ('NG-100-2025-P005', 'REJECTED', '{"title":"Oyo Sustainable Agriculture"}',  5,   EXTRACT(EPOCH FROM '2024-09-15'::timestamp)::bigint);

-- ============================================================
--  Enable CADT Export feature toggle
-- ============================================================

INSERT INTO configuration_settings (id, "settingValue")
VALUES ('3', 'true')
ON CONFLICT (id) DO UPDATE SET "settingValue" = 'true';

-- ============================================================
--  Update company credit balances and programme counts
-- ============================================================

UPDATE company SET "creditBalance" = 15500, "programmeCount" = 3 WHERE "companyId" = 100;
UPDATE company SET "creditBalance" = 5000,  "programmeCount" = 2 WHERE "companyId" = 101;

COMMIT;
