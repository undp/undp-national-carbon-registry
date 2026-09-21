import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViews1784277323343 implements MigrationInterface {
    name = 'AddViews1784277323343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE VIEW "activity_view_entity" AS 
    SELECT 
      a."refId",
      a."projectRefId",
      a."state" AS "stage",
      a."updatedTime" AS "activityLastUpdatedDate",
      jsonb_object_agg(
        d."type", 
        jsonb_build_object(
          'createdDate', d."createdTime",
          'documentType', d."type",
          'refId', d."id",
          'version', d."version"
        )
      ) FILTER (WHERE d."id" IS NOT NULL) AS "documents"
    FROM "activity_entity" a
    LEFT JOIN LATERAL (
      SELECT DISTINCT ON (d1."type") d1.*
      FROM "document_entity" d1
      WHERE d1."activityId" = a."id"
      AND d1."type" IN ('MONITORING', 'VERIFICATION')
      ORDER BY d1."type", d1."version" DESC
    ) d ON true
    GROUP BY a."refId",a."projectRefId", a."updatedTime", a."state"
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","activity_view_entity","SELECT \n      a.\"refId\",\n      a.\"projectRefId\",\n      a.\"state\" AS \"stage\",\n      a.\"updatedTime\" AS \"activityLastUpdatedDate\",\n      jsonb_object_agg(\n        d.\"type\", \n        jsonb_build_object(\n          'createdDate', d.\"createdTime\",\n          'documentType', d.\"type\",\n          'refId', d.\"id\",\n          'version', d.\"version\"\n        )\n      ) FILTER (WHERE d.\"id\" IS NOT NULL) AS \"documents\"\n    FROM \"activity_entity\" a\n    LEFT JOIN LATERAL (\n      SELECT DISTINCT ON (d1.\"type\") d1.*\n      FROM \"document_entity\" d1\n      WHERE d1.\"activityId\" = a.\"id\"\n      AND d1.\"type\" IN ('MONITORING', 'VERIFICATION')\n      ORDER BY d1.\"type\", d1.\"version\" DESC\n    ) d ON true\n    GROUP BY a.\"refId\",a.\"projectRefId\", a.\"updatedTime\", a.\"state\""]);
        await queryRunner.query(`CREATE VIEW "company_view_entity" AS 
    SELECT 
      c."companyId" as "refId", 
      c."taxId", 
      c."paymentId", 
      c."name", 
      c."email", 
      c."phoneNo", 
      c."faxNo", 
      c."website", 
      c."address", 
      c."logo", 
      c."country", 
      c."companyRole", 
      c."state", 
      c."creditBalance", 
      c."secondaryAccountBalance", 
      c."slcfAccountBalance", 
      c."programmeCount", 
      c."lastUpdateVersion", 
      c."creditTxTime", 
      c."remarks", 
      c."createdTime", 
      c."geographicalLocationCordintes", 
      c."provinces", 
      c."regions", 
      c."nameOfMinister", 
      c."sectoralScope", 
      c."omgePercentage", 
      c."nationalSopValue", 
      c."ministry", 
      c."govDep"
    FROM "company" c
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","company_view_entity","SELECT \n      c.\"companyId\" as \"refId\", \n      c.\"taxId\", \n      c.\"paymentId\", \n      c.\"name\", \n      c.\"email\", \n      c.\"phoneNo\", \n      c.\"faxNo\", \n      c.\"website\", \n      c.\"address\", \n      c.\"logo\", \n      c.\"country\", \n      c.\"companyRole\", \n      c.\"state\", \n      c.\"creditBalance\", \n      c.\"secondaryAccountBalance\", \n      c.\"slcfAccountBalance\", \n      c.\"programmeCount\", \n      c.\"lastUpdateVersion\", \n      c.\"creditTxTime\", \n      c.\"remarks\", \n      c.\"createdTime\", \n      c.\"geographicalLocationCordintes\", \n      c.\"provinces\", \n      c.\"regions\", \n      c.\"nameOfMinister\", \n      c.\"sectoralScope\", \n      c.\"omgePercentage\", \n      c.\"nationalSopValue\", \n      c.\"ministry\", \n      c.\"govDep\"\n    FROM \"company\" c"]);
        await queryRunner.query(`CREATE VIEW "credit_audit_log_view_entity" AS 
        SELECT CAL.*,
					PROG.TITLE AS "programmeTitle",
					PROG.SECTOR AS "programmeSector",
					EXTRACT(EPOCH FROM CAL."createdTime") AS created_epoch,
					PROG."companyId" AS "programmeCompanyId",
					JSON_AGG(DISTINCT COM.*) AS "company"
				FROM PUBLIC.CREDIT_AUDIT_LOG CAL
				LEFT JOIN PROGRAMME PROG ON PROG."programmeId" = CAL."programmeId"
				LEFT JOIN "company" COM ON COM."companyId" = ANY(PROG."companyId")
				GROUP BY CAL.ID,
					PROG."programmeId"
				ORDER BY ID ASC;
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_audit_log_view_entity","SELECT CAL.*,\n\t\t\t\t\tPROG.TITLE AS \"programmeTitle\",\n\t\t\t\t\tPROG.SECTOR AS \"programmeSector\",\n\t\t\t\t\tEXTRACT(EPOCH FROM CAL.\"createdTime\") AS created_epoch,\n\t\t\t\t\tPROG.\"companyId\" AS \"programmeCompanyId\",\n\t\t\t\t\tJSON_AGG(DISTINCT COM.*) AS \"company\"\n\t\t\t\tFROM PUBLIC.CREDIT_AUDIT_LOG CAL\n\t\t\t\tLEFT JOIN PROGRAMME PROG ON PROG.\"programmeId\" = CAL.\"programmeId\"\n\t\t\t\tLEFT JOIN \"company\" COM ON COM.\"companyId\" = ANY(PROG.\"companyId\")\n\t\t\t\tGROUP BY CAL.ID,\n\t\t\t\t\tPROG.\"programmeId\"\n\t\t\t\tORDER BY ID ASC;"]);
        await queryRunner.query(`CREATE VIEW "credit_block_retirements_view_entity" AS 
      SELECT 
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."retirementType" AS "retirementType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."organizationName",
        ct."remarks",
        p."title" AS "projectName",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."country" = country."alpha2"
      WHERE ct."type" = 'Retired'
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_block_retirements_view_entity","SELECT \n        ct.\"id\" AS \"id\",\n        ct.\"serialNumber\" AS \"serialNumber\",\n        ct.\"amount\" AS \"creditAmount\",\n        ct.\"createTime\" AS \"createdDate\",\n        ct.\"retirementType\" AS \"retirementType\",\n        ct.\"status\" AS \"status\",\n        ct.\"projectRefId\" AS \"projectId\",\n        country.\"name\" AS \"country\",\n        ct.\"organizationName\",\n        ct.\"remarks\",\n        p.\"title\" AS \"projectName\",\n        ct.\"senderId\" AS \"senderId\",\n        s.\"name\" AS \"senderName\",\n        s.\"logo\" AS \"senderLogo\"\n      FROM \"credit_transactions_entity\" ct\n      LEFT JOIN project_entity p ON ct.\"projectRefId\" = p.\"refId\"\n      LEFT JOIN company s ON ct.\"senderId\" = s.\"companyId\"\n      LEFT JOIN country ON ct.\"country\" = country.\"alpha2\"\n      WHERE ct.\"type\" = 'Retired'"]);
        await queryRunner.query(`CREATE VIEW "credit_block_balances_view_entity" AS 
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."createTime" AS "createdDate",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      cb."accountType"::text AS "accountType",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_block_balances_view_entity","SELECT\n      cb.\"creditBlockId\" AS \"id\",\n      cb.\"serialNumber\" AS \"serialNumber\",\n      cb.\"itmoSerial\" AS \"itmoSerial\",\n      (cb.\"creditAmount\" - cb.\"reservedCreditAmount\") AS \"creditAmount\",\n      cb.\"createTime\" AS \"createdDate\",\n      cb.\"projectRefId\" AS \"projectId\",\n      p.\"title\" AS \"projectName\",\n      cb.\"ownerCompanyId\" AS \"receiverId\",\n      r.\"name\" AS \"receiverName\",\n      r.\"logo\" AS \"receiverLogo\",\n      cb.\"previousOwnerCompanyId\" AS \"senderId\",\n      s.\"name\" AS \"senderName\",\n      s.\"logo\" AS \"senderLogo\",\n      CASE\n        WHEN cb.\"isNotTransferred\" = TRUE THEN 'issued'\n        ELSE 'received'\n      END AS \"type\",\n      cb.\"cooperativeApproachId\" AS \"cooperativeApproachId\",\n      cb.\"authorizationPurpose\"::text AS \"authorizationPurpose\",\n      cb.\"accountType\"::text AS \"accountType\",\n      COALESCE(cb.\"omgeDeductedAtIssuance\", FALSE) AS \"omgeDeductedAtIssuance\",\n      COALESCE(cb.\"sopDeductedAtIssuance\", FALSE) AS \"sopDeductedAtIssuance\"\n    FROM credit_blocks_entity cb\n    LEFT JOIN project_entity p ON cb.\"projectRefId\" = p.\"refId\"\n    LEFT JOIN company r ON cb.\"ownerCompanyId\" = r.\"companyId\"\n    LEFT JOIN company s ON cb.\"previousOwnerCompanyId\" = s.\"companyId\"\n    WHERE cb.\"ownerCompanyId\" != 0"]);
        await queryRunner.query(`CREATE VIEW "programme_document_view_entity" AS 
    SELECT programme_document.*, programme."companyId" as "companyId", json_agg(DISTINCT "company".*) as "company" FROM "programme_document" "programme_document" 
    LEFT JOIN "programme" "programme" ON "programme"."programmeId" =  "programme_document"."programmeId"
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "programme_document"."id", programme."companyId" ;
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","programme_document_view_entity","SELECT programme_document.*, programme.\"companyId\" as \"companyId\", json_agg(DISTINCT \"company\".*) as \"company\" FROM \"programme_document\" \"programme_document\" \n    LEFT JOIN \"programme\" \"programme\" ON \"programme\".\"programmeId\" =  \"programme_document\".\"programmeId\"\n    LEFT JOIN \"company\" \"company\" ON \"company\".\"companyId\" = ANY(\"programme\".\"companyId\") \n    group by \"programme_document\".\"id\", programme.\"companyId\" ;"]);
        await queryRunner.query(`CREATE VIEW "documents_view_entity" AS 
      SELECT 
        d."id" AS "refId",
        d."version",
        d."content" AS "data",
        d."type" AS "documentType",
        d."status" AS "state",
        d."createdTime" AS "createdDate",
        d."updatedTime" AS "updatedDate"
      FROM "document_entity" d
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","documents_view_entity","SELECT \n        d.\"id\" AS \"refId\",\n        d.\"version\",\n        d.\"content\" AS \"data\",\n        d.\"type\" AS \"documentType\",\n        d.\"status\" AS \"state\",\n        d.\"createdTime\" AS \"createdDate\",\n        d.\"updatedTime\" AS \"updatedDate\"\n      FROM \"document_entity\" d"]);
        await queryRunner.query(`CREATE VIEW "credit_block_transfers_view_entity" AS 
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        ct."recieverId" AS "recieverId",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        ct."type"::text AS "type",
        COALESCE(ct."isFirstTransfer", FALSE) AS "isFirstTransfer",
        ct."cooperativeApproachId" AS "cooperativeApproachId",
        ct."authorizationPurpose"::text AS "authorizationPurpose",
        ct."fromAccountType"::text AS "fromAccountType",
        ct."toAccountType"::text AS "toAccountType"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      -- Dec 2/CMA.3 Annex para 1(a) and Dec 4/CMA.6 Annex II Actions
      -- table require the "first transfer" to be surfaced alongside
      -- subsequent transfers. Prior to this commit the view filtered to
      -- type='Transfered' only, so FirstTransfer rows produced by the
      -- replicator were invisible to queryTransfers and to AEF Actions
      -- consumers. Broaden to include both types.
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_block_transfers_view_entity","SELECT\n        ct.\"id\" AS \"id\",\n        ct.\"serialNumber\" AS \"serialNumber\",\n        ct.\"amount\" AS \"creditAmount\",\n        ct.\"createTime\" AS \"createdDate\",\n        ct.\"projectRefId\" AS \"projectId\",\n        p.\"title\" AS \"projectName\",\n        ct.\"recieverId\" AS \"recieverId\",\n        r.\"name\" AS \"receiverName\",\n        r.\"logo\" AS \"receiverLogo\",\n        ct.\"senderId\" AS \"senderId\",\n        s.\"name\" AS \"senderName\",\n        s.\"logo\" AS \"senderLogo\",\n        ct.\"type\"::text AS \"type\",\n        COALESCE(ct.\"isFirstTransfer\", FALSE) AS \"isFirstTransfer\",\n        ct.\"cooperativeApproachId\" AS \"cooperativeApproachId\",\n        ct.\"authorizationPurpose\"::text AS \"authorizationPurpose\",\n        ct.\"fromAccountType\"::text AS \"fromAccountType\",\n        ct.\"toAccountType\"::text AS \"toAccountType\"\n      FROM \"credit_transactions_entity\" ct\n      LEFT JOIN project_entity p ON ct.\"projectRefId\" = p.\"refId\"\n      LEFT JOIN company r ON ct.\"recieverId\" = r.\"companyId\"\n      LEFT JOIN company s ON ct.\"senderId\" = s.\"companyId\"\n      -- Dec 2/CMA.3 Annex para 1(a) and Dec 4/CMA.6 Annex II Actions\n      -- table require the \"first transfer\" to be surfaced alongside\n      -- subsequent transfers. Prior to this commit the view filtered to\n      -- type='Transfered' only, so FirstTransfer rows produced by the\n      -- replicator were invisible to queryTransfers and to AEF Actions\n      -- consumers. Broaden to include both types.\n      WHERE ct.\"type\" IN ('Transfered', 'FirstTransfer')"]);
        await queryRunner.query(`CREATE VIEW "investment_view" AS 
        SELECT investment.*, JSON_AGG(distinct "requester".*) as "requester", JSON_AGG(distinct "receiver".*) as "receiver", "receiver"."geographicalLocationCordintes" as "toGeo",
         "prog"."title" as "programmeTitle", "prog"."sector" as "programmeSector",
        JSON_AGG(distinct "sender".*) as "sender", "sender"."geographicalLocationCordintes" as "fromGeo", "prog"."proponentTaxVatId" as "proponentTaxVatId", 
        "prog"."proponentPercentage" as "proponentPercentage", "prog"."creditOwnerPercentage" as "creditOwnerPercentage",
        "prog"."companyId" as "companyId" FROM "investment" "investment"
        LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "investment"."programmeId"
        LEFT JOIN "company" "requester" ON "requester"."companyId" = "investment"."initiatorCompanyId"
        LEFT JOIN "company" "receiver" ON "receiver"."companyId" = "investment"."toCompanyId"
        LEFT JOIN "company" "sender" ON "sender"."companyId" = "investment"."fromCompanyId"
        group by "investment"."requestId", "requester"."companyId", "prog"."programmeId", "toGeo", "fromGeo";
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","investment_view","SELECT investment.*, JSON_AGG(distinct \"requester\".*) as \"requester\", JSON_AGG(distinct \"receiver\".*) as \"receiver\", \"receiver\".\"geographicalLocationCordintes\" as \"toGeo\",\n         \"prog\".\"title\" as \"programmeTitle\", \"prog\".\"sector\" as \"programmeSector\",\n        JSON_AGG(distinct \"sender\".*) as \"sender\", \"sender\".\"geographicalLocationCordintes\" as \"fromGeo\", \"prog\".\"proponentTaxVatId\" as \"proponentTaxVatId\", \n        \"prog\".\"proponentPercentage\" as \"proponentPercentage\", \"prog\".\"creditOwnerPercentage\" as \"creditOwnerPercentage\",\n        \"prog\".\"companyId\" as \"companyId\" FROM \"investment\" \"investment\"\n        LEFT JOIN \"programme\" \"prog\" ON \"prog\".\"programmeId\" = \"investment\".\"programmeId\"\n        LEFT JOIN \"company\" \"requester\" ON \"requester\".\"companyId\" = \"investment\".\"initiatorCompanyId\"\n        LEFT JOIN \"company\" \"receiver\" ON \"receiver\".\"companyId\" = \"investment\".\"toCompanyId\"\n        LEFT JOIN \"company\" \"sender\" ON \"sender\".\"companyId\" = \"investment\".\"fromCompanyId\"\n        group by \"investment\".\"requestId\", \"requester\".\"companyId\", \"prog\".\"programmeId\", \"toGeo\", \"fromGeo\";"]);
        await queryRunner.query(`CREATE VIEW "ndc_action_view_entity" AS 
    SELECT ndc_action.*, programme."companyId" as "companyId",programme."title" as "programmeName", programme."emissionReductionExpected" as "emissionReductionExpected", programme."emissionReductionAchieved" as "emissionReductionAchieved", json_agg(DISTINCT "company".*) as "company" FROM "ndc_action" "ndc_action" 
    LEFT JOIN "programme" "programme" ON "programme"."programmeId" =  "ndc_action"."programmeId"
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "ndc_action"."id", programme."companyId", programme."title", programme."emissionReductionExpected", programme."emissionReductionAchieved";
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","ndc_action_view_entity","SELECT ndc_action.*, programme.\"companyId\" as \"companyId\",programme.\"title\" as \"programmeName\", programme.\"emissionReductionExpected\" as \"emissionReductionExpected\", programme.\"emissionReductionAchieved\" as \"emissionReductionAchieved\", json_agg(DISTINCT \"company\".*) as \"company\" FROM \"ndc_action\" \"ndc_action\" \n    LEFT JOIN \"programme\" \"programme\" ON \"programme\".\"programmeId\" =  \"ndc_action\".\"programmeId\"\n    LEFT JOIN \"company\" \"company\" ON \"company\".\"companyId\" = ANY(\"programme\".\"companyId\") \n    group by \"ndc_action\".\"id\", programme.\"companyId\", programme.\"title\", programme.\"emissionReductionExpected\", programme.\"emissionReductionAchieved\";"]);
        await queryRunner.query(`CREATE VIEW "user_company_view_entity" AS 
    SELECT 
      u.id, 
      u.name, 
      u."companyRole",  
      c."name" AS "companyName"
    FROM "user" u
    LEFT JOIN "company" c ON u."companyId" = c."companyId"
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","user_company_view_entity","SELECT \n      u.id, \n      u.name, \n      u.\"companyRole\",  \n      c.\"name\" AS \"companyName\"\n    FROM \"user\" u\n    LEFT JOIN \"company\" c ON u.\"companyId\" = c.\"companyId\""]);
        await queryRunner.query(`CREATE VIEW "programme_query_entity" AS 
    SELECT programme.*, json_agg(DISTINCT "company".*) as "company", json_agg(DISTINCT "cert".*) as "certifier" FROM "programme" "programme" 
    LEFT JOIN "company" "cert" ON "cert"."companyId" = ANY("programme"."certifierId") 
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "programme"."programmeId";
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","programme_query_entity","SELECT programme.*, json_agg(DISTINCT \"company\".*) as \"company\", json_agg(DISTINCT \"cert\".*) as \"certifier\" FROM \"programme\" \"programme\" \n    LEFT JOIN \"company\" \"cert\" ON \"cert\".\"companyId\" = ANY(\"programme\".\"certifierId\") \n    LEFT JOIN \"company\" \"company\" ON \"company\".\"companyId\" = ANY(\"programme\".\"companyId\") \n    group by \"programme\".\"programmeId\";"]);
        await queryRunner.query(`CREATE VIEW "programme_transfer_view_entity_query" AS 
        SELECT programme_transfer.*, JSON_AGG(distinct "requester".*) as "requester", JSON_AGG(distinct "receiver".*) as "receiver", 
        "prog"."creditBalance" as "creditBalance", "prog"."title" as "programmeTitle", "prog"."certifierId" as "programmeCertifierId", 
        "prog"."sector" as "programmeSector", "prog"."sectoralScope" as "programmeSectoralScope", JSON_AGG(distinct "certifier".*) as "certifier", 
        JSON_AGG(distinct "sender".*) as "sender", "prog"."proponentTaxVatId" as "proponentTaxVatId", 
        "prog"."proponentPercentage" as "proponentPercentage", "prog"."creditOwnerPercentage" as "creditOwnerPercentage",
        "prog"."companyId" as "companyId", "prog"."serialNo" as "serialNo"
        FROM "programme_transfer" "programme_transfer"
        LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "programme_transfer"."programmeId"
        LEFT JOIN "company" "requester" ON "requester"."companyId" = "programme_transfer"."initiatorCompanyId"
        LEFT JOIN "company" "receiver" ON "receiver"."companyId" = "programme_transfer"."toCompanyId"
        LEFT JOIN "company" "sender" ON "sender"."companyId" = "programme_transfer"."fromCompanyId"
        LEFT JOIN "company" "certifier" ON "certifier"."companyId" = ANY("prog"."certifierId")
        group by "programme_transfer"."requestId", "requester"."companyId", "prog"."programmeId";
    `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","programme_transfer_view_entity_query","SELECT programme_transfer.*, JSON_AGG(distinct \"requester\".*) as \"requester\", JSON_AGG(distinct \"receiver\".*) as \"receiver\", \n        \"prog\".\"creditBalance\" as \"creditBalance\", \"prog\".\"title\" as \"programmeTitle\", \"prog\".\"certifierId\" as \"programmeCertifierId\", \n        \"prog\".\"sector\" as \"programmeSector\", \"prog\".\"sectoralScope\" as \"programmeSectoralScope\", JSON_AGG(distinct \"certifier\".*) as \"certifier\", \n        JSON_AGG(distinct \"sender\".*) as \"sender\", \"prog\".\"proponentTaxVatId\" as \"proponentTaxVatId\", \n        \"prog\".\"proponentPercentage\" as \"proponentPercentage\", \"prog\".\"creditOwnerPercentage\" as \"creditOwnerPercentage\",\n        \"prog\".\"companyId\" as \"companyId\", \"prog\".\"serialNo\" as \"serialNo\"\n        FROM \"programme_transfer\" \"programme_transfer\"\n        LEFT JOIN \"programme\" \"prog\" ON \"prog\".\"programmeId\" = \"programme_transfer\".\"programmeId\"\n        LEFT JOIN \"company\" \"requester\" ON \"requester\".\"companyId\" = \"programme_transfer\".\"initiatorCompanyId\"\n        LEFT JOIN \"company\" \"receiver\" ON \"receiver\".\"companyId\" = \"programme_transfer\".\"toCompanyId\"\n        LEFT JOIN \"company\" \"sender\" ON \"sender\".\"companyId\" = \"programme_transfer\".\"fromCompanyId\"\n        LEFT JOIN \"company\" \"certifier\" ON \"certifier\".\"companyId\" = ANY(\"prog\".\"certifierId\")\n        group by \"programme_transfer\".\"requestId\", \"requester\".\"companyId\", \"prog\".\"programmeId\";"]);
        await queryRunner.query(`CREATE VIEW "project_view_entity" AS 
    SELECT 
      p."refId" as "projectId", 
      p."refId",
      p."title", 
      p."projectProposalStage", 
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."sector",
      p."sectoralScope",
      p."authorizationId",
      p."independentCertifiers",
      c."companyId", 
      c."name", 
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","project_view_entity","SELECT \n      p.\"refId\" as \"projectId\", \n      p.\"refId\",\n      p.\"title\", \n      p.\"projectProposalStage\", \n      p.\"createTime\" as \"createdTime\",\n      p.\"creditBalance\",\n      p.\"creditRetired\",\n      p.\"sector\",\n      p.\"sectoralScope\",\n      p.\"authorizationId\",\n      p.\"independentCertifiers\",\n      c.\"companyId\", \n      c.\"name\", \n      c.\"logo\",\n      c.\"companyRole\"\n    FROM \"project_entity\" p\n    JOIN \"company\" c ON p.\"companyId\" = c.\"companyId\""]);
        await queryRunner.query(`CREATE VIEW "project_details_view_entity" AS 
    SELECT
      p."refId",
      p."title",
      p."serialNumber" as "serialNo",
      p."authorizationId",
      p."projectProposalStage",
      p."creditEst",
      p."creditBalance",
      p."creditRetired",
      p."creditTransferred",
      p."independentCertifiers" as "certifierId",
      p."noObjectionLetterUrl",
      p."cooperativeApproachId",
      p."authorizationPurpose"::text AS "authorizationPurpose",
      p."acquiringPartyCountryCode",
      jsonb_build_object(
        'name', c."name",
        'logo', c."logo",
        'companyRole', c."companyRole",
        'state', c."state",
        'email', c."email",
        'companyId',p."companyId"
      ) AS "company"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","project_details_view_entity","SELECT\n      p.\"refId\",\n      p.\"title\",\n      p.\"serialNumber\" as \"serialNo\",\n      p.\"authorizationId\",\n      p.\"projectProposalStage\",\n      p.\"creditEst\",\n      p.\"creditBalance\",\n      p.\"creditRetired\",\n      p.\"creditTransferred\",\n      p.\"independentCertifiers\" as \"certifierId\",\n      p.\"noObjectionLetterUrl\",\n      p.\"cooperativeApproachId\",\n      p.\"authorizationPurpose\"::text AS \"authorizationPurpose\",\n      p.\"acquiringPartyCountryCode\",\n      jsonb_build_object(\n        'name', c.\"name\",\n        'logo', c.\"logo\",\n        'companyRole', c.\"companyRole\",\n        'state', c.\"state\",\n        'email', c.\"email\",\n        'companyId',p.\"companyId\"\n      ) AS \"company\"\n    FROM \"project_entity\" p\n    JOIN \"company\" c ON p.\"companyId\" = c.\"companyId\""]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","project_details_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "project_details_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","project_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "project_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","programme_transfer_view_entity_query","public"]);
        await queryRunner.query(`DROP VIEW "programme_transfer_view_entity_query"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","programme_query_entity","public"]);
        await queryRunner.query(`DROP VIEW "programme_query_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","user_company_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "user_company_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","ndc_action_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "ndc_action_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","investment_view","public"]);
        await queryRunner.query(`DROP VIEW "investment_view"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_block_transfers_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_block_transfers_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","documents_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "documents_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","programme_document_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "programme_document_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_block_balances_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_block_balances_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_block_retirements_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_block_retirements_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_audit_log_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_audit_log_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","company_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "company_view_entity"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","activity_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "activity_view_entity"`);
    }

}
