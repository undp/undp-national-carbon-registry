export interface UserTableDataType {
  id?: number;
  name?: string;
  phoneNo?: string;
  role?: string;
  email?: string;
  companyId?: number;
  companyRole?: string;
  company: {
    name?: string;
    address?: string;
    companyId?: number;
    companyRole?: string;
    country?: string;
    email?: string;
    phoneNo?: string;
    taxId?: string;
    website?: string;
    state?: string;
    logo?: string;
  };
}
