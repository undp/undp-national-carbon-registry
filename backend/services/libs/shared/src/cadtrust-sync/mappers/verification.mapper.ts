import { VerificationCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";

import { CadTrustPicklistService } from "../cadtrust-picklist.service";
import { CadTrustRegistryProfileService } from "../cadtrust-registry-profile.service";
import { CadTrustVerificationSyncProps } from "../cadtrust-sync.enqueue.service";
import { PICKLIST_KEYS } from "./picklist.map";

/**
 * A verification-sync payload (captured request-side — see `CadTrustVerificationSyncProps`'s doc)
 * -> CAD Trust `VerificationCreateInput`.
 *
 * ## `verificationBody` is always the configured default, never the real verifying body's name
 *
 * Same closed, ~90-name international VVB list as `validation_body` — see
 * `validation.mapper.ts`'s class doc for the full reasoning, which applies here verbatim.
 * `CadTrustRegistryProfileService.getVerificationBodyDefault()` is used unconditionally instead of
 * `props.verificationBodyName`, which is carried on the payload for local audit context only.
 */
@Injectable()
export class CadTrustVerificationMapper {
  constructor(
    private readonly picklistService: CadTrustPicklistService,
    private readonly profile: CadTrustRegistryProfileService
  ) {}

  async toCreateInput(
    props: CadTrustVerificationSyncProps,
    verificationId: string,
    cadTrustProjectId: string,
    cadTrustValidationId?: string
  ): Promise<VerificationCreateInput> {
    const verificationBody = this.profile.getVerificationBodyDefault();

    // Warn (never block) if the configured default itself has drifted from the node's current
    // verification_body picklist — see the class doc for why this is the default, not the real
    // verifying body's name.
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.verificationBody, [verificationBody]);

    const input: VerificationCreateInput = {
      verificationId,
      cadTrustProjectId,
      verificationBody,
    };

    if (props.verificationStartDate) {
      input.verificationStartDate = props.verificationStartDate;
    }
    if (props.verificationEndDate) {
      input.verificationEndDate = props.verificationEndDate;
    }
    // Optional, best-effort link back to this project's validation record — a validation report
    // isn't guaranteed to have synced (or even exist, for a project authorized before validation
    // sync existed), so this is omitted rather than failing the verification sync when absent.
    if (cadTrustValidationId) {
      input.cadTrustValidationId = cadTrustValidationId;
    }

    return input;
  }
}
