import { MigrationInterface, QueryRunner } from "typeorm";

// Article 6.2 AEF V2 — Table 5 snapshot support.
//
// aef_v2_t5_authorized_entities
//   - "snapshotAt" (timestamptz, nullable): library metadata marking a row as
//     a frozen year-end snapshot, mirroring the column already on
//     aef_v2_t4_holdings (see 1785700000000-AefV2Tables.ts). Absent means the
//     row is provisional. Never exported — export is driven by the field
//     spec, which holds only AEF fields.
//
// Needed by `snapshotAuthorizedEntitiesForYear`, the Table 5 counterpart to
// `snapshotHoldingsForYear`, which uses this column the same way Table 4's
// `snapshotAt` is used: present rows are frozen, `force` deletes and
// recreates them.
//
// Written by hand rather than via `migration:generate` - the local dev DB
// runs with synchronize=true (NODE_ENV=dev) and has already auto-synced this
// schema. Same convention as 1787300000000-CaAuthorizedEntityCountryOfIncorporation.ts.
export class AefV2T5SnapshotAt1787400000000 implements MigrationInterface {
  name = "AefV2T5SnapshotAt1787400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aef_v2_t5_authorized_entities" ADD "snapshotAt" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aef_v2_t5_authorized_entities" DROP COLUMN "snapshotAt"`
    );
  }
}
