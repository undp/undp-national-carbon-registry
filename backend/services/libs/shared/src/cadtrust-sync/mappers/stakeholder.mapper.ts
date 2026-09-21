import { StakeholderCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";

import { CadTrustPicklistService } from "../cadtrust-picklist.service";
import { PICKLIST_KEYS, STAKEHOLDER_TYPE_DEVELOPER } from "./picklist.map";

/**
 * The owning PD `Company` -> CAD Trust `StakeholderCreateInput`.
 *
 * Every project's owning company is staged as a stakeholder exactly once — see
 * `CadTrustProjectCreateHandler.ensureStakeholder` for the dedup-by-companyId
 * logic. This mapper only builds the payload; it has no opinion on whether the
 * company needs staging at all.
 */
@Injectable()
export class CadTrustStakeholderMapper {
  constructor(private readonly picklistService: CadTrustPicklistService) {}

  async toCreateInput(company: { name: string; website?: string }): Promise<StakeholderCreateInput> {
    // Warn-only: a stale local mapping must not stop data reaching CAD Trust.
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.stakeholderType, [
      STAKEHOLDER_TYPE_DEVELOPER,
    ]);

    const input: StakeholderCreateInput = {
      stakeholderName: company.name,
      stakeholderType: STAKEHOLDER_TYPE_DEVELOPER,
    };

    // CAD Trust validates this as a URI; Company.website can legitimately be
    // an empty string (company.service.ts forces it to "" when an update omits
    // it), which is not a valid URI, so an empty value must be omitted rather
    // than sent.
    if (company.website && company.website.trim().length > 0) {
      input.stakeholderLink = company.website.trim();
    }

    return input;
  }
}
