import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1784708229614 implements MigrationInterface {
    name = 'Migrations1784708229614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE VIEW "credit_block_explorer_view_entity" AS 
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "balance",
      cb."reservedCreditAmount" AS "reserved",
      CASE
        WHEN cb."ownerCompanyId" = 0 THEN 'Retired'
        ELSE 'Assigned'
      END AS "status",
      cb."txTime" AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","credit_block_explorer_view_entity","SELECT\n      cb.\"creditBlockId\" AS \"id\",\n      cb.\"serialNumber\" AS \"serialNumber\",\n      cb.\"ownerCompanyId\" AS \"organizationId\",\n      o.\"name\" AS \"organizationName\",\n      o.\"logo\" AS \"organizationLogo\",\n      cb.\"projectRefId\" AS \"projectId\",\n      p.\"title\" AS \"projectName\",\n      (cb.\"creditAmount\" - cb.\"reservedCreditAmount\") AS \"balance\",\n      cb.\"reservedCreditAmount\" AS \"reserved\",\n      CASE\n        WHEN cb.\"ownerCompanyId\" = 0 THEN 'Retired'\n        ELSE 'Assigned'\n      END AS \"status\",\n      cb.\"txTime\" AS \"updatedTime\"\n    FROM credit_blocks_entity cb\n    LEFT JOIN project_entity p ON cb.\"projectRefId\" = p.\"refId\"\n    LEFT JOIN company o ON cb.\"ownerCompanyId\" = o.\"companyId\""]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","credit_block_explorer_view_entity","public"]);
        await queryRunner.query(`DROP VIEW "credit_block_explorer_view_entity"`);
    }

}
