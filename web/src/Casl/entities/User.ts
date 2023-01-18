import { EntitySubject } from "./EntitySubject";

export class User implements EntitySubject {
    id?: number;
    role?: string;
    companyId?: number;
    companyRole?: string;
    companyLogo?: string;
}