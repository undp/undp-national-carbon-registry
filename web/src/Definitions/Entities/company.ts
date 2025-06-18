import { BaseEntity } from './baseEntity';

export class Company implements BaseEntity {
  companyId?: number;

  taxId?: string;

  name?: string;

  email?: string;

  phoneNo?: string;

  website?: string;

  address?: string;

  logo?: string;

  country?: string;

  companyRole?: string;
}
