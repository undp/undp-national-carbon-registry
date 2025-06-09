export enum EnablementTypes {
    CapacityBuilding = 'Capacity Building',
    TechnologyTransfer = 'Technology Transfer',
    Financial = 'Financial',
    EnhancedTransparency= 'Enhanced Transparency'
  }
  
  export const enablementTypesAndValues = [
    { type: EnablementTypes.CapacityBuilding.valueOf(), col: 4 },
    {
      type: EnablementTypes.TechnologyTransfer.valueOf(),
      col: 5,
    },
    { type: EnablementTypes.Financial.valueOf(), col: 4 },
  ];
  