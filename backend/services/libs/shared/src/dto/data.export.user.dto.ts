import { DataExportDto } from "./data.export.dto";

export class DataExportUserDto extends DataExportDto {
    id;
    email;
    role;
    name;
    country;
    phoneNo;
    companyId;
    companyName;
    companyRole;
    createdTime;
    isPending;
}