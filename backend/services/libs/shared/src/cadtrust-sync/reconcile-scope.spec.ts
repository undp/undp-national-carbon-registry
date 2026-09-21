import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import {
  CADTRUST_RECONCILE_PASS,
  CadTrustReconcilePass,
  entityTypesForPass,
} from "./reconcile-scope";

/**
 * `CADTRUST_RECONCILE_PASS` is the single source of truth for which `CadTrustReconcileHandler` pass
 * (if any) re-drives a FAILED sync record of a given entity type. The `Record<…>` type already makes
 * a missing member a compile error; this pins the rest of the invariant at runtime, the same way
 * `action-type-ordinals.spec.ts` guards the enum ordinals. If it fails, fix the classification in
 * `reconcile-scope.ts` — do not weaken the test.
 */
describe("CADTRUST_RECONCILE_PASS", () => {
  const allEntityTypes = Object.values(CadTrustLocalEntityType);

  it("classifies every CadTrustLocalEntityType exactly once", () => {
    for (const type of allEntityTypes) {
      expect(CADTRUST_RECONCILE_PASS[type]).toBeDefined();
    }
    expect(Object.keys(CADTRUST_RECONCILE_PASS).sort()).toEqual([...allEntityTypes].sort());
  });

  it("partitions the enum across the passes with no overlap and no gaps", () => {
    const perPass = Object.values(CadTrustReconcilePass).flatMap((pass) => entityTypesForPass(pass));

    expect(perPass.sort()).toEqual([...allEntityTypes].sort());
    expect(new Set(perPass).size).toBe(perPass.length);
  });

  it("keeps the PROJECT and CREDIT_BLOCK sweeps' type lists in the order the SQL finders assert", () => {
    expect(entityTypesForPass(CadTrustReconcilePass.PROJECT)).toEqual([
      CadTrustLocalEntityType.PROJECT,
      CadTrustLocalEntityType.PROJECT_METHODOLOGY,
      CadTrustLocalEntityType.STAKEHOLDER_PROJECT,
      CadTrustLocalEntityType.LOCATION,
    ]);
    expect(entityTypesForPass(CadTrustReconcilePass.CREDIT_BLOCK)).toEqual([
      CadTrustLocalEntityType.UNIT,
      CadTrustLocalEntityType.UNIT_LABEL,
    ]);
  });

  it("drives VALIDATION / VERIFICATION / ISSUANCE through the SNAPSHOT sweep", () => {
    expect(entityTypesForPass(CadTrustReconcilePass.SNAPSHOT)).toEqual([
      CadTrustLocalEntityType.VALIDATION,
      CadTrustLocalEntityType.VERIFICATION,
      CadTrustLocalEntityType.ISSUANCE,
    ]);
  });

  it("never reconciles the bootstrap-owned singletons, in any sweep", () => {
    expect(entityTypesForPass(CadTrustReconcilePass.BOOTSTRAP_ONLY)).toEqual([
      CadTrustLocalEntityType.ORGANIZATION,
      CadTrustLocalEntityType.PROGRAM,
      CadTrustLocalEntityType.METHODOLOGY,
    ]);

    for (const pass of [
      CadTrustReconcilePass.PROJECT,
      CadTrustReconcilePass.CREDIT_BLOCK,
      CadTrustReconcilePass.SNAPSHOT,
    ]) {
      expect(entityTypesForPass(pass)).not.toContain(CadTrustLocalEntityType.ORGANIZATION);
      expect(entityTypesForPass(pass)).not.toContain(CadTrustLocalEntityType.PROGRAM);
      expect(entityTypesForPass(pass)).not.toContain(CadTrustLocalEntityType.METHODOLOGY);
    }
  });

  it("recovers STAKEHOLDER and LABEL only indirectly", () => {
    expect(CADTRUST_RECONCILE_PASS[CadTrustLocalEntityType.STAKEHOLDER]).toBe(CadTrustReconcilePass.INDIRECT);
    expect(CADTRUST_RECONCILE_PASS[CadTrustLocalEntityType.LABEL]).toBe(CadTrustReconcilePass.INDIRECT);
  });
});
