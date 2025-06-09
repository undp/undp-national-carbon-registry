export enum NdcActionTypes {
  Mitigation = 'mitigation',
  Adaptation = 'adaptation',
  Enablement = 'enablement',
  CrossCutting = 'crosscutting',
}

export const ndcActionTypeList = [
  // { value: NdcActionTypes.Adaptation.valueOf(), label: "Adaptation" },
  // { value: NdcActionTypes.CrossCutting.valueOf(), label: "Cross-cutting" },
  // { value: NdcActionTypes.Enablement.valueOf(), label: "Enablement" },
  { value: NdcActionTypes.Mitigation.valueOf(), label: 'Mitigation' },
];
