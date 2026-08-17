/**
 * Article 6.2 AEF reporting configuration.
 *
 * Per-country deployment setting, so it belongs here alongside the other
 * customisation touchpoints rather than being hardcoded in a component.
 *
 * The reporting Party's display name is **not** configured here: it is read
 * from `national/cooperativeApproach/hostParty` at runtime (see
 * `ReportingComponent`), because that endpoint is the registry's actual
 * source of truth for which country this deployment represents.
 */
export const AEF_CONFIG = {
  /**
   * Party ITMO registry identifier — alpha-3 code plus a two-digit registry
   * number (Common Nomenclature Table 28).
   */
  partyItmoRegistryId: import.meta.env.VITE_AEF_PARTY_ITMO_REGISTRY_ID ?? "VUT01",

  /** NDC implementation period containing the reported year. */
  ndcFirstYear: Number(import.meta.env.VITE_AEF_NDC_FIRST_YEAR ?? 2021),
  ndcLastYear: Number(import.meta.env.VITE_AEF_NDC_LAST_YEAR ?? 2030),
};
