import { Role } from "../casl/role.enum"
import { CompanyRole } from "../enum/company.role.enum"

export class JWTPayload {
    constructor(
        public u: string,
        public sub: number,
        public r: Role,
        public cid: number,
        public cr: CompanyRole
    ) {

    }
}