import { ValidationCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";

import { CadTrustPicklistService } from "../cadtrust-picklist.service";
import { CadTrustRegistryProfileService } from "../cadtrust-registry-profile.service";
import { CadTrustValidationSyncProps } from "../cadtrust-sync.enqueue.service";
import { PICKLIST_KEYS, VALIDATION_TYPE_PDD_APPROVAL } from "./picklist.map";

/**
 * A validation-sync payload (captured request-side — see
 * `CadTrustValidationSyncProps`'s doc) -> CAD Trust `ValidationCreateInput`.
 *
 * Both events this registry syncs to CAD Trust's `validation` resource
 * (`APPROVE_PDD_BY_DNA`, `APPROVE_VALIDATION`) use the same `validationType` —
 * see `VALIDATION_TYPE_PDD_APPROVAL`'s doc in picklist.map.ts for why.
 *
 * ## `validationBody` is always the configured default, never the real IC name
 *
 * CAD Trust's `validation_body` picklist is a closed, international list of ~90 accredited VVBs
 * (see `picklistValues.ts`'s doc comment) — a national Independent Certifier will essentially never
 * be on it by name, and the node enforces this: sending the real name (as this mapper used to,
 * via `props.validationBodyName`) is rejected with "validationBody does not include a valid
 * option". `CadTrustRegistryProfileService.getValidationBodyDefault()` is used unconditionally
 * instead — see `configuration.ts`'s `cadTrustV2.validationBodyDefault`. The real IC's identity
 * isn't lost, it just isn't republished under this field; it remains in this registry's own
 * `document_entity`/company/user tables, which are the actual source of truth locally.
 */
@Injectable()
export class CadTrustValidationMapper {
  constructor(
    private readonly picklistService: CadTrustPicklistService,
    private readonly profile: CadTrustRegistryProfileService
  ) {}

  async toCreateInput(
    props: CadTrustValidationSyncProps,
    validationId: string,
    cadTrustProjectId: string
  ): Promise<ValidationCreateInput> {
    const validationBody = this.profile.getValidationBodyDefault();

    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.validationType, [
      VALIDATION_TYPE_PDD_APPROVAL,
    ]);
    // Warn (never block) if the configured default itself has drifted from the node's current
    // validation_body picklist — see the class doc for why this is the default, not the real IC name.
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.validationBody, [validationBody]);

    const input: ValidationCreateInput = {
      validationId,
      cadTrustProjectId,
      validationType: VALIDATION_TYPE_PDD_APPROVAL,
      validationBody,
    };

    if (props.validationDate) {
      input.validationDate = props.validationDate;
    }
    if (props.creditPeriodStartDate) {
      input.validationCreditPeriodStartDate = props.creditPeriodStartDate;
    }
    if (props.creditPeriodEndDate) {
      input.validationCreditPeriodEndDate = props.creditPeriodEndDate;
    }

    return input;
  }
}
