import { MethodologyCreateInput, ProgramCreateInput } from "@app/cadtrust";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CadTrustPicklistService } from "./cadtrust-picklist.service";
import { PICKLIST_KEYS } from "./mappers/picklist.map";

/**
 * The three env-derived defaults that make an unconfigured deployment look
 * configured. Publishing a program or methodology under one of these is
 * materially worse than doing it for a project (see `assertConfigured`) —
 * this is the exact set `configuration.ts` falls back to.
 */
const SENTINEL_COUNTRY_NAME = "CountryX";
const SENTINEL_SYSTEM_NAME = "SystemX";
const SENTINEL_COUNTRY_CODE = "NG";

/**
 * Single source for the CAD Trust bootstrap values: the registry's own
 * organization name (verify-only — see `handlers/bootstrap.handler.ts`), and
 * the one program and one methodology this deployment publishes under.
 *
 * This registry is UNDP's NCR for one hosting country, so there is exactly one
 * of each — they are configured, not modelled as local entities. Everything
 * that needs one of these values reads through here rather than `ConfigService`
 * directly, so a later move to a DB-backed registry profile (there isn't one
 * today — see the CAD Trust context notes) touches this file only.
 */
@Injectable()
export class CadTrustRegistryProfileService {
  constructor(
    private readonly configService: ConfigService,
    private readonly picklistService: CadTrustPicklistService
  ) {}

  /** Used only for logging and the verify-only organization check. */
  getOrganizationName(): string {
    return (
      this.configService.get<string>("cadTrustV2.orgName") ||
      this.configService.get<string>("cadTrustV2.registryName")
    );
  }

  /**
   * The host Party — this registry's own country — as an ISO 3166-1 alpha-2 code. Every party
   * field in this registry (`systemCountry`, `hostParty`, `participatingParties`,
   * `RetirementUseData.country`) is alpha-2; see `CountryService.getAlpha3()`'s comment.
   */
  getHostCountryCode(): string {
    return this.configService.get<string>("systemCountry");
  }

  /** The host Party's display name — the same value `location.mapper.ts` uses for `locationCountry`. */
  getHostCountryName(): string {
    return this.configService.get<string>("systemCountryName");
  }

  /** Always used for CAD Trust's validationBody — see configuration.ts's cadTrustV2.validationBodyDefault. */
  getValidationBodyDefault(): string {
    return this.configService.get<string>("cadTrustV2.validationBodyDefault");
  }

  /** Always used for CAD Trust's verificationBody — see configuration.ts's cadTrustV2.verificationBodyDefault. */
  getVerificationBodyDefault(): string {
    return this.configService.get<string>("cadTrustV2.verificationBodyDefault");
  }

  /**
   * CAD Trust's required `unitType` field. Unlike every other getter here, this can return
   * `undefined` — no safe placeholder exists (see `mappers/picklist.map.ts`'s doc on
   * `PICKLIST_KEYS.unitType`). Callers must not invent a fallback string; an unset value should
   * reach CAD Trust as-is (or be rejected by it) so the gap stays visible rather than silently
   * papered over.
   */
  getUnitType(): string | undefined {
    return this.configService.get<string>("cadTrustV2.unitType");
  }

  getProgramInput(): ProgramCreateInput {
    const input: ProgramCreateInput = {
      programName: this.configService.get<string>("cadTrustV2.program.name"),
      programRegistry: this.configService.get<string>("cadTrustV2.program.registry"),
      programRegistryActivityId: this.configService.get<string>(
        "cadTrustV2.program.registryActivityId"
      ),
    };

    const registryProgramId = this.configService.get<string>(
      "cadTrustV2.program.registryProgramId"
    );
    if (registryProgramId) {
      input.programRegistryProgramId = registryProgramId;
    }

    const description = this.configService.get<string>("cadTrustV2.program.description");
    if (description) {
      input.programDescription = description;
    }

    return input;
  }

  /**
   * `methodologyType` is the only picklist-constrained field on this input, and
   * it is optional — left unset by default so bootstrap does not need a live
   * picklist fetch to succeed. When it is set, validate it warn-only, the same
   * as every other picklist field in this adaptor.
   */
  async getMethodologyInput(): Promise<MethodologyCreateInput> {
    const input: MethodologyCreateInput = {
      methodologyCode: this.configService.get<string>("cadTrustV2.methodology.code"),
      methodologyName: this.configService.get<string>("cadTrustV2.methodology.name"),
    };

    const version = this.configService.get<string>("cadTrustV2.methodology.version");
    if (version) {
      input.methodologyVersion = version;
    }
    const date = this.configService.get<string>("cadTrustV2.methodology.date");
    if (date) {
      input.methodologyDate = date;
    }
    const link = this.configService.get<string>("cadTrustV2.methodology.link");
    if (link) {
      input.methodologyLink = link;
    }
    const type = this.configService.get<string>("cadTrustV2.methodology.type");
    if (type) {
      input.methodologyType = type;
      await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.methodologyType, [type]);
    }

    return input;
  }

  /**
   * Blocking problems with the current configuration, empty when it is safe to
   * stage. Checked against `process.env` directly rather than the resolved
   * config values: `systemCountryCode` legitimately defaults to a real country
   * ("NG" happens to also be Nigeria's own code), so the only reliable signal
   * that a value is a placeholder is that *nothing* — neither the specific
   * `CADT_V2_*` override nor the broader system config it would otherwise fall
   * back to — was ever set.
   *
   * This matters more here than for a project sync: once anything references a
   * committed program, CAD Trust refuses to delete it (409 referential
   * integrity), and every project is meant to reference this one.
   */
  assertConfigured(): string[] {
    const problems: string[] = [];

    if (!process.env.CADT_V2_PROGRAM_NAME && !process.env.systemCountryName) {
      problems.push(
        `CADT_V2_PROGRAM_NAME is unset and systemCountryName defaults to the placeholder ` +
          `"${SENTINEL_COUNTRY_NAME}" — set one of them.`
      );
    }

    if (
      !process.env.CADT_V2_PROGRAM_REGISTRY &&
      !process.env.CADT_V2_REGISTRY_NAME &&
      !process.env.SYSTEM_NAME
    ) {
      problems.push(
        `CADT_V2_PROGRAM_REGISTRY, CADT_V2_REGISTRY_NAME and SYSTEM_NAME are all unset — ` +
          `programRegistry would publish as the placeholder "${SENTINEL_SYSTEM_NAME}".`
      );
    }

    if (!process.env.CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID && !process.env.systemCountryCode) {
      problems.push(
        `CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID and systemCountryCode are both unset — ` +
          `programRegistryActivityId would publish as the placeholder country code "${SENTINEL_COUNTRY_CODE}".`
      );
    }

    if (!process.env.CADT_V2_METHODOLOGY_CODE && !process.env.systemCountryCode) {
      problems.push(
        `CADT_V2_METHODOLOGY_CODE and systemCountryCode are both unset — ` +
          `methodologyCode would publish using the placeholder country code "${SENTINEL_COUNTRY_CODE}".`
      );
    }

    return problems;
  }
}
