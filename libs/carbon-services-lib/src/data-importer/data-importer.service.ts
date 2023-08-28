import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ImporterInterface } from "./importer.interface";
import { ITMOSystemImporter } from "./importers/itmo-system.service";
import { CertifierScrapeService } from "./importers/certifier-scrape.service";
import { ProgrammeService } from "../shared/programme/programme.service";
import { UserService } from "../shared/user/user.service";
import { CompanyService } from "../shared/company/company.service";
import { Company } from "../shared/entities/company.entity";

@Injectable()
export class DataImporterService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    private logger: Logger,
    private configService: ConfigService,
    private companyService: CompanyService,
    private userService: UserService,
    private programmeService: ProgrammeService
  ) {}

  private getImporter(type: string): ImporterInterface {
    switch(type) {
      case 'ITMO_SYSTEM':
        return new ITMOSystemImporter(this.logger, this.configService, this.companyService, this.userService, this.programmeService);
    }
    switch(type) {
      case 'CERTIFIER_SCRAPING':
        return new CertifierScrapeService(this.companyRepo, this.logger, this.configService, this.companyService, this.userService);
    }
    return null;
  }

  async importData(event): Promise<any> {
    this.logger.log("Event received", JSON.stringify(event));
    if (event.importTypes) {
      const types = event.importTypes.split(',');
      for (const type of types) {
        await this.getImporter(type)?.start(type);
      }
    }
  }
}
