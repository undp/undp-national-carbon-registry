export enum CompanyState {
    SUSPENDED = '0',
    ACTIVE = '1',
    PENDING = '2',
    REJECTED = '3'
}

// Alphabetical order of each state's displayed label (Active, Deactivated,
// Pending, Rejected - see organisationStatus.tsx / companyProfile/en.json).
// Keep in sync when adding a new CompanyState.
export const COMPANY_STATE_ALPHABETICAL_ORDER: CompanyState[] = [
    CompanyState.ACTIVE,
    CompanyState.SUSPENDED,
    CompanyState.PENDING,
    CompanyState.REJECTED,
];