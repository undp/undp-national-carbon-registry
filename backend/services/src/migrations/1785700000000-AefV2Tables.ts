import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Article 6.2 AEF V2 — the five tables of Decision 4/CMA.6 Annex II.
 *
 * Prefixed `aef_v2_` to stay clear of the V1 `aef_actions_table`, which is left
 * untouched and still serves the existing reports.
 *
 * Relationships come in two kinds and are stored differently:
 *
 *  - **Internal** — Submission, Authorization, Authorized entity. This library
 *    owns all three tables, so these are real `uuid` foreign keys.
 *    `ON DELETE` differs on purpose: **CASCADE** from Submission, because a
 *    Submission *is* the reporting year and its rows have no meaning without it;
 *    **SET NULL** from Authorization, because an Action outliving its
 *    Authorization is a data problem `validateSubmission` reports as
 *    `missing-authorization` — deleting the Action would hide it.
 *  - **External** — `projectId` and `unitId`. These belong to the host registry,
 *    so they are plain indexed `varchar` columns with no constraint.
 *    Deliberately not `uuid`: this registry uses a refId like
 *    `CA0004-VU-CH-356-1-3000-2023`, a CAD Trust node a UUID.
 *
 * All five tables are created first and every foreign key added afterwards,
 * because Table 2 and Table 5 reference each other — CAD Trust's own model — and
 * neither can be created with its constraint already in place.
 *
 * The Submission unique constraint spans **version** as well as party and year.
 * A revision creates a new row for the same year, so `(party, year)` alone would
 * block every correction, while still preventing a cron tick and an operator
 * button from both inserting version 1.0.
 */
export class AefV2Tables1785700000000 implements MigrationInterface {
  name = "AefV2Tables1785700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."aef_v2_t1_submission_status_enum" AS ENUM (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SUPERSEDED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "aef_v2_t1_submission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "aefT1SubmissionParty" character varying(8) NOT NULL,
        "aefT1SubmissionVersion" character varying(16) NOT NULL,
        "aefT1SubmissionReportYear" integer NOT NULL,
        "aefT1SubmissionSubmissionDate" character varying(32),
        "aefT1SubmissionReviewStatus" text,
        "aefT1SubmissionResultCheck" text,
        "aefT1SubmissionNdcFirstYear" integer,
        "aefT1SubmissionNdcLastYear" integer,
        "aefT1SubmissionReferenceReviewReport" text,
        "status" "public"."aef_v2_t1_submission_status_enum" NOT NULL DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_aef_v2_t1_submission_party_year_version"
          UNIQUE ("aefT1SubmissionParty", "aefT1SubmissionReportYear", "aefT1SubmissionVersion"),
        CONSTRAINT "PK_aef_v2_t1_submission" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "aef_v2_t2_authorizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "aefT2AuthorizationsId" character varying(255) NOT NULL,
        "aefT2AuthorizationsDate" character varying(32),
        "aefT2AuthorizationsCooperativeApproachId" character varying(32),
        "aefT2AuthorizationsVersion" integer,
        "aefT2AuthorizationsQuantity" bigint,
        "aefT2AuthorizationsMetric" character varying(32),
        "aefT2AuthorizationsGwpValue" text,
        "aefT2AuthorizationsApplicableNonGhgMetric" text,
        "aefT2AuthorizationsSector" text,
        "aefT2AuthorizationsActivityType" text,
        "aefT2AuthorizationsPurposesForAuthorization" character varying(64),
        "aefT2AuthorizationsAuthorizedPartyId" text,
        "aefT2AuthorizationsAuthoziedEntityId" text,
        "aefT2AuthorizationsOimpAuthorizedParty" text,
        "aefT2AuthorizationsAuthorizedTimeframe" character varying(32),
        "aefT2AuthorizationsAuthorizationTerms" text,
        "aefT2AuthorizationsAuthorizationDocumentation" text,
        "aefT2AuthorizationsFirstTransferDefinitionOimp" character varying(64),
        "aefT2AuthorizationsAdditionalInformation" text,
        "aefT1SubmissionId" uuid,
        "aefT5AuthorizedEntitiesId" uuid,
        "projectId" character varying(255),
        "unitId" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aef_v2_t2_authorizations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "aef_v2_t3_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "aefT3ActionsDate" character varying(40),
        "aefT3ActionsType" character varying(64),
        "aefT3ActionsSubtype" character varying(128),
        "aefT3ActionsCooperativeApproachId" character varying(32),
        "aefT3ActionsAuthorizationId" character varying(255),
        "aefT3ActionsFirstTransferringPartyId" character varying(8),
        "aefT3ActionsPartyItmoRegistryId" character varying(16),
        "aefT3ActionsItmoFirstId" bigint,
        "aefT3ActionsItmoLastId" bigint,
        "aefT3ActionsUnitRegistryId" character varying(32),
        "aefT3ActionsUnitFirstId" bigint,
        "aefT3ActionsUnitLastId" bigint,
        "aefT3ActionsMetric" character varying(32),
        "aefT3ActionsGwpValue" text,
        "aefT3ActionsApplicableNonGhgMetric" text,
        "aefT3ActionsQuantityTCo2" numeric(20,2),
        "aefT3ActionsQuantityNonGhg" text,
        "aefT3ActionsMitigationType" character varying(64),
        "aefT3ActionsVintageYear" integer,
        "aefT3ActionsTransferringPartyId" character varying(8),
        "aefT3ActionsAcquiringPartyId" character varying(8),
        "aefT3ActionsPurposeOfUseOimp" text,
        "aefT3ActionsUsingParticipatingPartyId" character varying(8),
        "aefT3ActionsUsingAuthorizedEntityId" text,
        "aefT3ActionsItmoUsedYear" integer,
        "aefT3ActionsConsistencyCheckResult" text,
        "aefT3ActionsAdditionalInformation" text,
        "aefT1SubmissionId" uuid,
        "aefT2AuthorizationsId" uuid,
        "projectId" character varying(255),
        "unitId" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aef_v2_t3_actions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "aef_v2_t4_holdings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "aefT4HoldingsCooperativeApproachId" character varying(32),
        "aefT4HoldingsAuthorizationId" character varying(255),
        "aefT4HoldingsFirstTransferringPartyId" character varying(8),
        "aefT4HoldingsPartyItmoRegistryId" character varying(16),
        "aefT4HoldingsItmoFirstId" bigint,
        "aefT4HoldingsItmoLastId" bigint,
        "aefT4HoldingsUnitRegistryId" character varying(32),
        "aefT4HoldingsUnitFirstId" bigint,
        "aefT4HoldingsUnitLastId" bigint,
        "aefT4HoldingsMetric" character varying(32),
        "aefT4HoldingsGwpValue" text,
        "aefT4HoldingsApplicableNonGhgMetric" text,
        "aefT4HoldingsQuantityTCo2" numeric(20,2),
        "aefT4HoldingsQuantityNonGhg" text,
        "aefT4HoldingsMitigationType" character varying(64),
        "aefT4HoldingsVintageYear" integer,
        "snapshotAt" TIMESTAMP WITH TIME ZONE,
        "aefT1SubmissionId" uuid,
        "aefT2AuthorizationsId" uuid,
        "projectId" character varying(255),
        "unitId" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aef_v2_t4_holdings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "aef_v2_t5_authorized_entities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "aefT5AuthorizedEntitiesAuthorizationDate" character varying(32),
        "aefT5AuthorizedEntitiesName" character varying(255),
        "aefT5AuthorizedEntitiesIncorporationCountry" character varying(8),
        "aefT5AuthorizedEntitiesId" character varying(255),
        "aefT5AuthorizedEntitiesCooperativeApproachId" character varying(32),
        "aefT5AuthorizedEntitiesConditions" text,
        "aefT5AuthorizedEntitiesChangeConditions" text,
        "aefT5AuthorizedEntitiesAdditionalInformation" text,
        "aefT1SubmissionId" uuid,
        "aefT2AuthorizationsId" uuid,
        "projectId" character varying(255),
        "unitId" character varying(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aef_v2_t5_authorized_entities" PRIMARY KEY ("id")
      )
    `);

    // Business-key lookups: Actions and Holdings reference Authorizations by
    // `Authorization ID`, which is a spec field rather than a foreign key.
    await queryRunner.query(
      `CREATE INDEX "IDX_aef_v2_t2_authorization_id" ON "aef_v2_t2_authorizations" ("aefT2AuthorizationsId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aef_v2_t3_authorization_id" ON "aef_v2_t3_actions" ("aefT3ActionsAuthorizationId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aef_v2_t4_authorization_id" ON "aef_v2_t4_holdings" ("aefT4HoldingsAuthorizationId")`
    );

    // Relationship indexes.
    const relationIndexes: [string, string, string][] = [
      ["IDX_aef_v2_t2_submission", "aef_v2_t2_authorizations", "aefT1SubmissionId"],
      ["IDX_aef_v2_t2_authorized_entity", "aef_v2_t2_authorizations", "aefT5AuthorizedEntitiesId"],
      ["IDX_aef_v2_t2_project", "aef_v2_t2_authorizations", "projectId"],
      ["IDX_aef_v2_t2_unit", "aef_v2_t2_authorizations", "unitId"],
      ["IDX_aef_v2_t3_submission", "aef_v2_t3_actions", "aefT1SubmissionId"],
      ["IDX_aef_v2_t3_authorization", "aef_v2_t3_actions", "aefT2AuthorizationsId"],
      ["IDX_aef_v2_t3_project", "aef_v2_t3_actions", "projectId"],
      ["IDX_aef_v2_t3_unit", "aef_v2_t3_actions", "unitId"],
      ["IDX_aef_v2_t4_submission", "aef_v2_t4_holdings", "aefT1SubmissionId"],
      ["IDX_aef_v2_t4_authorization", "aef_v2_t4_holdings", "aefT2AuthorizationsId"],
      ["IDX_aef_v2_t4_project", "aef_v2_t4_holdings", "projectId"],
      ["IDX_aef_v2_t4_unit", "aef_v2_t4_holdings", "unitId"],
      ["IDX_aef_v2_t5_submission", "aef_v2_t5_authorized_entities", "aefT1SubmissionId"],
      ["IDX_aef_v2_t5_authorization", "aef_v2_t5_authorized_entities", "aefT2AuthorizationsId"],
      ["IDX_aef_v2_t5_project", "aef_v2_t5_authorized_entities", "projectId"],
      ["IDX_aef_v2_t5_unit", "aef_v2_t5_authorized_entities", "unitId"],
    ];

    for (const [name, table, column] of relationIndexes) {
      await queryRunner.query(`CREATE INDEX "${name}" ON "${table}" ("${column}")`);
    }

    // Foreign keys, added after every table exists so the circular T2 <-> T5
    // pair can be satisfied.
    const foreignKeys: [string, string, string, string, "CASCADE" | "SET NULL"][] = [
      ["FK_aef_v2_t2_submission", "aef_v2_t2_authorizations", "aefT1SubmissionId", "aef_v2_t1_submission", "CASCADE"],
      ["FK_aef_v2_t2_authorized_entity", "aef_v2_t2_authorizations", "aefT5AuthorizedEntitiesId", "aef_v2_t5_authorized_entities", "SET NULL"],
      ["FK_aef_v2_t3_submission", "aef_v2_t3_actions", "aefT1SubmissionId", "aef_v2_t1_submission", "CASCADE"],
      ["FK_aef_v2_t3_authorization", "aef_v2_t3_actions", "aefT2AuthorizationsId", "aef_v2_t2_authorizations", "SET NULL"],
      ["FK_aef_v2_t4_submission", "aef_v2_t4_holdings", "aefT1SubmissionId", "aef_v2_t1_submission", "CASCADE"],
      ["FK_aef_v2_t4_authorization", "aef_v2_t4_holdings", "aefT2AuthorizationsId", "aef_v2_t2_authorizations", "SET NULL"],
      ["FK_aef_v2_t5_submission", "aef_v2_t5_authorized_entities", "aefT1SubmissionId", "aef_v2_t1_submission", "CASCADE"],
      ["FK_aef_v2_t5_authorization", "aef_v2_t5_authorized_entities", "aefT2AuthorizationsId", "aef_v2_t2_authorizations", "SET NULL"],
    ];

    for (const [name, table, column, target, onDelete] of foreignKeys) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ADD CONSTRAINT "${name}"
          FOREIGN KEY ("${column}") REFERENCES "${target}"("id")
          ON DELETE ${onDelete} ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const foreignKeys: [string, string][] = [
      ["aef_v2_t5_authorized_entities", "FK_aef_v2_t5_authorization"],
      ["aef_v2_t5_authorized_entities", "FK_aef_v2_t5_submission"],
      ["aef_v2_t4_holdings", "FK_aef_v2_t4_authorization"],
      ["aef_v2_t4_holdings", "FK_aef_v2_t4_submission"],
      ["aef_v2_t3_actions", "FK_aef_v2_t3_authorization"],
      ["aef_v2_t3_actions", "FK_aef_v2_t3_submission"],
      ["aef_v2_t2_authorizations", "FK_aef_v2_t2_authorized_entity"],
      ["aef_v2_t2_authorizations", "FK_aef_v2_t2_submission"],
    ];

    for (const [table, name] of foreignKeys) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);
    }

    // Indexes go with their tables; only the tables need dropping.
    await queryRunner.query(`DROP TABLE IF EXISTS "aef_v2_t5_authorized_entities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "aef_v2_t4_holdings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "aef_v2_t3_actions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "aef_v2_t2_authorizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "aef_v2_t1_submission"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."aef_v2_t1_submission_status_enum"`);
  }
}
