export enum InvestmentLevel {
  NATIONAL = 'National',
  INTERNATIONAL = 'International',
}

export enum InvestmentStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export const getInvestmentStatusEnumVal = (value: string) => {
  const index = Object.keys(InvestmentStatus).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(InvestmentStatus)[index];
};

export const getStatusTagType = (status: InvestmentStatus) => {
  switch (getInvestmentStatusEnumVal(status)) {
    case InvestmentStatus.REJECTED:
      return 'error';
    case InvestmentStatus.PENDING:
      return 'success';
    case InvestmentStatus.APPROVED:
      return 'processing';
    default:
      return 'default';
  }
};

export enum InvestmentType {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
}

export enum InvestmentCreationType {
  EXISTING = 'Existing',
  NEW = 'New',
}

export enum InvestmentOwnershipType {
  PROJECT = 'Project',
  NATIONAL = 'National',
}

export enum InvestmentStream {
  CLIMATE_FINANCE = 'ClimateFinance',
  CARBON_MARKET = 'CarbonMarket',
}
