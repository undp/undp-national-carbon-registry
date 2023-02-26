import { NestFactory } from "@nestjs/core";
import { Role } from "../shared/casl/role.enum";
import { UserDto } from "../shared/dto/user.dto";
import { LedgerDbModule } from "../shared/ledger-db/ledger-db.module";
import { QLDBLedgerService } from "../shared/ledger-db/qldb-ledger.service";
import { getLogger } from "../shared/server";
import { UtilModule } from "../shared/util/util.module";
import { Country } from "../shared/entities/country.entity";
import { CountryService } from "../shared/util/country.service";
import { CreditOverall } from "../shared/entities/credit.overall.entity";
import { CompanyModule } from "../shared/company/company.module";
import { OrganisationDto as OrganisationDto } from "../shared/dto/organisation.dto";
import { CompanyRole } from "../shared/enum/company.role.enum";
import { CompanyService } from "../shared/company/company.service";
import { UserModule } from "../shared/user/user.module";
import { UserService } from "../shared/user/user.service";
import { TxType } from "../shared/enum/txtype.enum";
const fs = require('fs')

exports.handler = async (event) => {
    console.log(`Setup Handler Started with: ${JSON.stringify(event)}`)

    const userApp = await NestFactory.createApplicationContext(UserModule, {
      logger: getLogger(UserModule),
    });
    const userService = userApp.get(UserService);
    const u = await userService.findOne(event['rootEmail']);
    if (u != undefined) {
      console.log('Root user already created and setup is completed')
    }

    const app = await NestFactory.createApplicationContext(LedgerDbModule, {
      logger: getLogger(LedgerDbModule),
    });
    try {
      const ledgerModule = app.get(QLDBLedgerService)

      await ledgerModule.createTable('company');
      await ledgerModule.createIndex('txId', 'company');

      await ledgerModule.createTable('overall');
      await ledgerModule.createIndex('txId', 'overall');
      const creditOverall = new CreditOverall()
      creditOverall.credit = 0;
      creditOverall.txId = event['systemCountryCode']
      creditOverall.txRef = 'genesis block'
      creditOverall.txType = TxType.ISSUE;
      await ledgerModule.insertRecord(creditOverall, 'overall')
      await ledgerModule.createTable();
      await ledgerModule.createIndex('programmeId');
      console.log('QLDB Table created')
    } catch(e) {
      console.log('QLDB table does not create', e) 
    }

    try {

      const company = new OrganisationDto()
      company.country = event['systemCountryCode']
      company.name = event['name']
      company.logo = event['logoBase64']
      company.companyRole = CompanyRole.GOVERNMENT

      const user = new UserDto()
      user.email = event['rootEmail']
      user.name = "Root"
      user.role = Role.Root;
      user.phoneNo = '-';
      user.company = company;
      
      await userService.create(user, -1, CompanyRole.GOVERNMENT)
    } catch (e) {
      console.log(`User ${event['rootEmail']} failed to create`, e) 
    }

    const countryData = fs.readFileSync('countries.json', 'utf8');
    const jsonCountryData = JSON.parse(countryData);
    const utils = await NestFactory.createApplicationContext(UtilModule)
    const countryService = utils.get(CountryService)

    jsonCountryData.forEach(async countryItem => {
      if(countryItem["UN Member States"] === "x"){
        const country = new Country()
        country.alpha2 = countryItem["ISO-alpha2 Code"]
        country.alpha3 = countryItem["ISO-alpha3 Code"]
        country.name = countryItem["English short"]
        await countryService.insertCountry(country)
      }
    });
}