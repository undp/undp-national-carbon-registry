import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImporterInterface } from './importer.interface';
import { ITMOSystemImporter } from './importers/itmo-system.service';
import { CertifierScrapeService } from './importers/certifier-scrape.service';
import { ProgrammeService } from '../programme/programme.service';
import { UserService } from '../user/user.service';
import { CompanyService } from '../company/company.service';
import { Company } from '../entities/company.entity';
import { AnnualReportImport } from './importers/annual-report.service';
import { ProgrammeDocument } from '../entities/programme.document';
import { AnnualReportGen } from '../annualreport/annual.report.gen';
import { ProgrammeLedgerService } from '../programme-ledger/programme-ledger.service';
import { EmailHelperService } from "../email-helper/email-helper.service";
import { AuthorizationLetterGen } from '../util/authorisation.letter.gen';
@Injectable()
export class DataImporterService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(ProgrammeDocument)
    private documentRepo: Repository<ProgrammeDocument>,
    private logger: Logger,
    private configService: ConfigService,
    private companyService: CompanyService,
    private userService: UserService,
    private programmeService: ProgrammeService,
    private annualReportGen: AnnualReportGen,
    private programmeLedger: ProgrammeLedgerService,
    private emailHelperService: EmailHelperService,
    private authLetter: AuthorizationLetterGen,
  ) {}

  private getImporter(type: string): ImporterInterface {
    switch (type) {
      case 'ITMO_SYSTEM':
        return new ITMOSystemImporter(
          this.logger,
          this.configService,
          this.companyService,
          this.userService,
          this.programmeService,
          this.programmeLedger,
          this.emailHelperService,
          this.authLetter,
        );
        break;
      case 'CERTIFIER_SCRAPING':
        return new CertifierScrapeService(
          this.companyRepo,
          this.logger,
          this.configService,
          this.companyService,
          this.userService,
        );
        break
      case 'ANNUAL_REPORT':
        return new AnnualReportImport(
          this.documentRepo,
          this.configService,
          this.annualReportGen,
        );
        break
    }
    return null;
  }

  async importData(event): Promise<any> {
    this.logger.log('Event received', JSON.stringify(event));
    if (event.importTypes) {
      const types = event.importTypes.split(',');
      for (const type of types) {
        await this.getImporter(type)?.start(type);
      }
    }
  }
}
