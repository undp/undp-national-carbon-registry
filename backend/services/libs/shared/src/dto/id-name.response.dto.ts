import { CompanyState } from "../enum/company.state.enum";

export class IDNameResponse {
    id: number;
    name: string;
    state: CompanyState;

    constructor(id: number, name: string, state: CompanyState) {
        this.id = id;
        this.name = name;
        this.state=state;
    }
}
