import { UnitCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";

import { CreditBlocksEntity } from "../../entities/credit.blocks.entity";
import { CreditTransactionsEntity } from "../../entities/credit.transactions.entity";
import { AccountType } from "../../enum/account.type.enum";
import { SerialNumberManagementService } from "../../serial-number-management/serial-number-management.service";
import { CadTrustPicklistService } from "../cadtrust-picklist.service";
import { CadTrustRegistryProfileService } from "../cadtrust-registry-profile.service";
import { toCadTrustIsoDate } from "../iso-date";
import {
  PICKLIST_KEYS,
  PROJECT_UNIT_METRIC,
  UNIT_STATUS_HELD,
  UNIT_STATUS_REASON_BY_SUBTYPE,
  UNIT_STATUS_REASON_FALLBACK,
  UNIT_STATUS_REASON_MAP,
  UNIT_STATUS_RETIRED,
} from "./picklist.map";

/**
 * The owner + retirement-beneficiary trio for a CAD Trust unit body, resolved by
 * `CadTrustCreditResourceService` (which owns the repositories the lookups need) and handed to the
 * mapper as plain strings. `currentOwner` follows the credit's *destination*; `beneficiaryId` is
 * always an externally-resolvable id (an ISO country code, a tax id, an AEF entity identifier),
 * never a bare internal UUID.
 */
export interface CadTrustUnitParties {
  currentOwner?: string;
  beneficiary?: string;
  beneficiaryId?: string;
}

/**
 * A `CreditBlocksEntity` row (+ its latest retirement transaction, when retired) -> CAD Trust
 * `UnitCreateInput`/`UnitUpdateInput` — identical bodies, since `UnitUpdateInput` is a full-replace
 * alias of `UnitCreateInput` (see `unit.ts`). One method builds the complete shape for both a
 * fresh create and every later full-replace update; the caller
 * (`CadTrustCreditResourceService`) decides which CAD Trust endpoint to call.
 *
 * ## Every registry `creditBlockId` gets exactly one CAD Trust unit — never `unit.split`
 *
 * See `cadtrust-sync/README.md`'s "Why not unit.split": a split is represented here as an ordinary
 * UPDATE to the existing (shrunken) unit plus an ordinary CREATE of a brand-new one for the
 * newly-materialized block — this mapper doesn't need to know which case it's building for, since
 * both produce the identical full-object shape from current `CreditBlocksEntity` state.
 *
 * ## `unitStatus` from `accountType`, `unitStatusReason` from the retirement's `subType`
 *
 * `accountType === HOLDING` covers every state this registry considers "still held": a freshly
 * issued block, an ordinarily transferred block, an ITMO-authorized-but-not-yet-retired block, and
 * the retained/shrunken side of any partial split. Every other `AccountType` member is a
 * retirement/cancellation bucket, so `unitStatus` follows directly from it. `unitStatusReason`,
 * though, keys on the latest retirement's `subType` (`UNIT_STATUS_REASON_BY_SUBTYPE`) because
 * `accountType` cannot tell a domestic MO `USE_TOWARDS_NDC` from an international ITMO
 * `FIRST_TRANSFER_TOWARDS_NDC` — both land in `RETIREMENT_NDC`. The `accountType` map is the
 * fallback for retirement rows with no `subType` (legacy).
 *
 * ## `unitCurrentOwner` / beneficiary fields are resolved by the caller, not here
 *
 * A retirement sets `creditBlock.ownerCompanyId` to the `0` sentinel (not a real company) and
 * moves the real former owner into `previousOwnerCompanyId`. This mapper takes the already-resolved
 * owner + beneficiary trio as plain strings (`CadTrustUnitParties`) —
 * `CadTrustCreditResourceService` owns the MO/ITMO-aware lookups.
 */
@Injectable()
export class CadTrustCreditUnitMapper {
  constructor(
    private readonly picklistService: CadTrustPicklistService,
    private readonly profile: CadTrustRegistryProfileService,
    private readonly serialNumberManagementService: SerialNumberManagementService
  ) {}

  async toUnitInput(
    creditBlock: CreditBlocksEntity,
    cadTrustIssuanceId: string,
    parties: CadTrustUnitParties,
    latestRetirement?: CreditTransactionsEntity
  ): Promise<UnitCreateInput> {
    const { start, end } = this.serialNumberManagementService.getBlockRange(creditBlock.serialNumber);
    const isRetired = creditBlock.accountType !== AccountType.HOLDING;
    const unitStatus = isRetired ? UNIT_STATUS_RETIRED : UNIT_STATUS_HELD;
    const reasonBySubType = latestRetirement?.subType
      ? UNIT_STATUS_REASON_BY_SUBTYPE[latestRetirement.subType]
      : undefined;
    const unitStatusReason = isRetired
      ? reasonBySubType ??
        UNIT_STATUS_REASON_MAP[creditBlock.accountType] ??
        UNIT_STATUS_REASON_FALLBACK
      : "Newly issued";
    // No confirmed unitType value exists for this registry — see picklist.map.ts's doc. An unset
    // CADT_V2_UNIT_TYPE reaches CAD Trust as an empty string on purpose, so the node's own
    // rejection surfaces the gap rather than this mapper guessing a value.
    const unitType = this.profile.getUnitType() ?? "";

    // Warn-only: a stale/unset local mapping must not stop data reaching CAD Trust.
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.unitStatus, [unitStatus]);
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.unitType, [unitType]);

    const input: UnitCreateInput = {
      unitSerialId: creditBlock.serialNumber,
      unitStartBlock: String(start),
      unitEndBlock: String(end),
      unitVintageYear: Number(creditBlock.vintage),
      cadTrustIssuanceId,
      unitCount: creditBlock.creditAmount,
      unitType,
      unitStatus,
      unitStatusReason,
      // The approval instant (creditBlock.txTime), not a transaction row's createTime (request
      // time) — see credit-issuance.handler.ts's / unit-update.handler.ts's class docs for why
      // that distinction matters here. Required by UnitCreateInput, so fall back to the block's
      // own createTime and finally to "now" rather than emit an empty string.
      unitStatusDate:
        toCadTrustIsoDate(creditBlock.txTime) ??
        toCadTrustIsoDate(creditBlock.createTime) ??
        new Date().toISOString().split("T")[0],
      unitMetric: PROJECT_UNIT_METRIC,
    };

    if (parties.currentOwner) {
      input.unitCurrentOwner = parties.currentOwner;
    }
    if (creditBlock.itmoSerial) {
      input.unitItmosReferenceId = creditBlock.itmoSerial;
    }

    if (isRetired) {
      // `remarks` is the one field both RetirementUseData and RetirementCancellationData carry;
      // the beneficiary trio is already resolved MO/ITMO-aware by the caller (see
      // `CadTrustUnitParties`).
      const remarks = (latestRetirement?.data as { remarks?: string } | undefined)?.remarks;
      if (remarks) {
        input.unitRetirementDetail = remarks;
      }
      if (parties.beneficiary) {
        input.unitRetirementBeneficiary = parties.beneficiary;
      }
      if (parties.beneficiaryId) {
        input.unitRetirementBeneficiaryId = parties.beneficiaryId;
      }
    }

    return input;
  }
}
