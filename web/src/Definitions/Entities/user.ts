import { BaseEntity } from './baseEntity';

export class User implements BaseEntity {
  id?: number;

  email?: string;

  role?: string;

  name?: string;

  country?: string;

  phoneNo?: string;

  companyId?: number;

  companyRole?: string;

  companyState?: number;
}
