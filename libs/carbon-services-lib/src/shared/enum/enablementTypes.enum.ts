export enum EnablementTypes {
    CapacityBuilding = 'Capacity Building',
    InstitutionalArrangement = 'Institutional Arrangement',
    StakeholderFramework = 'Stakeholder Framework',
    TechnologyTransfer = 'Technology Transfer',
  }
  
  export const enablementTypesAndValues = [
    { type: EnablementTypes.CapacityBuilding.valueOf(), col: 4 },
    {
      type: EnablementTypes.InstitutionalArrangement.valueOf(),
      col: 5,
    },
    { type: EnablementTypes.StakeholderFramework.valueOf(), col: 5 },
    { type: EnablementTypes.TechnologyTransfer.valueOf(), col: 4 },
  ];
  