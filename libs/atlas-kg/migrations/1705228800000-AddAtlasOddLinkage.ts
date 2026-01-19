import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add ATLAS ODD Linkage columns to ProjectEntity
 * 
 * Phase 1: Proof of Concept (Week 1)
 * - Ajouter odd_links (JSONB)
 * - Ajouter kg_relations (JSONB)
 * 
 * Rollback safe: Les colonnes sont nullable
 */
export class AddAtlasOddLinkage1705228800000 implements MigrationInterface {
  name = 'AddAtlasOddLinkage1705228800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Running migration: AddAtlasOddLinkage1705228800000');

    // 1. Ajouter colonne odd_links (ODD primaires/secondaires)
    await queryRunner.addColumn(
      'project',
      new TableColumn({
        name: 'odd_links',
        type: 'jsonb',
        isNullable: true,
        comment: 'ATLAS ODD linkage with primary/secondary SDG codes',
      }),
    );

    console.log('✅ Added column: project.odd_links (JSONB)');

    // 2. Ajouter colonne kg_relations (Knowledge Graph relations)
    await queryRunner.addColumn(
      'project',
      new TableColumn({
        name: 'kg_relations',
        type: 'jsonb',
        isNullable: true,
        comment: 'ATLAS Knowledge Graph relations (ODD, NDC, PROJECT nodes)',
      }),
    );

    console.log('✅ Added column: project.kg_relations (JSONB)');

    // 3. Créer index GIN pour recherche rapide sur ODD
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_odd_links 
      ON project USING GIN (odd_links);
    `);

    console.log('✅ Created GIN index: idx_project_odd_links');

    // 4. Créer index GIN pour recherche rapide sur KG relations
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_kg_relations 
      ON project USING GIN (kg_relations);
    `);

    console.log('✅ Created GIN index: idx_project_kg_relations');

    console.log('Migration completed successfully! 🚀');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back migration: AddAtlasOddLinkage1705228800000');

    // 1. Supprimer index KG relations
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_project_kg_relations;
    `);

    console.log('✅ Dropped index: idx_project_kg_relations');

    // 2. Supprimer index ODD links
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_project_odd_links;
    `);

    console.log('✅ Dropped index: idx_project_odd_links');

    // 3. Supprimer colonne kg_relations
    await queryRunner.dropColumn('project', 'kg_relations');

    console.log('✅ Dropped column: project.kg_relations');

    // 4. Supprimer colonne odd_links
    await queryRunner.dropColumn('project', 'odd_links');

    console.log('✅ Dropped column: project.odd_links');

    console.log('Rollback completed! ✅');
  }
}
