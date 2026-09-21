import { AefSubmissionDefaults } from "@app/aef-v2";
import { ConfigService } from "@nestjs/config";

import { CountryService } from "../util/country.service";

// AefSubmissionDefaults.aefT1SubmissionParty must be ISO 3166-1 alpha-3.
// AEF_V2.party lets a deployment set that explicitly; when unset, this falls
// back to an alpha-3 lookup of `systemCountry` (alpha-2) rather than
// defaulting to something that would fail PARTY_CODE_PATTERN validation.
export async function aefSubmissionDefaultsFactory(
  configService: ConfigService,
  countryService: CountryService
): Promise<AefSubmissionDefaults> {
  const configuredParty = configService.get<string>("AEF_V2.party");
  const party =
    configuredParty || (await countryService.getAlpha3(configService.get<string>("systemCountry")));

  return {
    aefT1SubmissionParty: party,
    aefT1SubmissionNdcFirstYear: configService.get<number>("AEF_V2.ndcFirstYear"),
    aefT1SubmissionNdcLastYear: configService.get<number>("AEF_V2.ndcLastYear"),
  };
}

/**
 * `PARTY_ITMO_REGISTRY_ID_PATTERN` (alpha-3 Party code + 2 digits) has no
 * registry source of its own — CARP hasn't assigned one; see the pre-existing
 * "No registry source for this today" note on AEF_V2.partyItmoRegistryId in
 * configuration.ts. Deriving it from the already-resolved Party keeps every
 * Actions/Holdings row valid against the pattern with nothing extra to keep
 * in sync, in place of the previous unset-by-default env var (which left the
 * field blank, failing its `required` check on every row).
 */
export function derivePartyItmoRegistryId(party: string): string {
  return `${party}01`;
}

/**
 * `AEF_V2.partyItmoRegistryId` (`AEF_PARTY_ITMO_REGISTRY_ID`) stays a valid
 * explicit override — a deployment with a real CARP-assigned ID that doesn't
 * follow the `${party}01` convention can still set it directly.
 */
export function resolvePartyItmoRegistryId(configService: ConfigService, party: string): string {
  return configService.get<string>("AEF_V2.partyItmoRegistryId") || derivePartyItmoRegistryId(party);
}
