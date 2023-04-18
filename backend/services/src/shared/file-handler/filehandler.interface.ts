import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CompanyService } from "../company/company.service";
import { Company } from "../entities/company.entity";
import { Programme } from "../entities/programme.entity";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { UserService } from "../user/user.service";

@Injectable()
export abstract class FileHandlerInterface {
  
  public abstract uploadFile(path: string, content: string): Promise<string>;

  public abstract getUrl(path: string): Promise<string>;

}
