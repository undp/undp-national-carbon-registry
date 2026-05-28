export function createMockConfigService(
  overrides: Record<string, any> = {}
) {
  const defaults: Record<string, any> = {
    "cadTrustV2.enable": true,
    "cadTrustV2.endpoint": "http://localhost:31310/",
    "cadTrustV2.apiKey": "test-api-key",
    systemCountryName: "Nigeria",
    systemCountry: "NG",
    host: "https://test.carbreg.org",
    "serialNumber.creditIdentifier": "CA0NNN",
    "serialNumber.firstTransferringPartyId": "XX",
    "serialNumber.seperator": "-",
    "AEF.party": "Nigeria",
    "AEF.cooperativeApproach": "Article 6.2",
    "AEF.metric": "tCO2e",
    "AEF.firstTransferingParty": "NG",
    "AEF.transferingParty": "NG",
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => defaults[key]),
  };
}
