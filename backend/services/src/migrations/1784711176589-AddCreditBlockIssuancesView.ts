import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditBlockIssuancesView1784711176589 implements MigrationInterface {
    name = 'AddCreditBlockIssuancesView1784711176589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE VIEW "credit_block_issuances_view_entity" AS
    SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "issuanceDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        ct."recieverId" AS "organizationId",
        r."name" AS "organizationName",
        r."logo" AS "organizationLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_block_issuances_view_entity","SELECT\n        ct.\"id\" AS \"id\",\n        ct.\"serialNumber\" AS \"serialNumber\",\n        ct.\"amount\" AS \"creditAmount\",\n        ct.\"createTime\" AS \"issuanceDate\",\n        ct.\"projectRefId\" AS \"projectId\",\n        p.\"title\" AS \"projectName\",\n        ct.\"recieverId\" AS \"organizationId\",\n        r.\"name\" AS \"organizationName\",\n        r.\"logo\" AS \"organizationLogo\"\n      FROM \"credit_transactions_entity\" ct\n      LEFT JOIN project_entity p ON ct.\"projectRefId\" = p.\"refId\"\n      LEFT JOIN company r ON ct.\"recieverId\" = r.\"companyId\"\n      WHERE ct.\"type\" = 'Issued'"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_block_issuances_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_block_issuances_view_entity"`);
    }

}
