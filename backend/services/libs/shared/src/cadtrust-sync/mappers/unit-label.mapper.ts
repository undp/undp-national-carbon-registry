import { UnitLabelCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";

/**
 * Links one ITMO-authorized unit to this registry's singleton "Article 6 - Authorisation" label.
 * No picklist fields, no I/O — the plainest mapper in this module.
 */
@Injectable()
export class CadTrustUnitLabelMapper {
  toCreateInput(
    cadTrustLabelId: string,
    cadTrustUnitId: string,
    labelUnitDate: string
  ): UnitLabelCreateInput {
    return { cadTrustLabelId, cadTrustUnitId, labelUnitDate };
  }
}
