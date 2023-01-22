import { NestFactory } from "@nestjs/core";
import { Role } from "../shared/casl/role.enum";
import { UserDto } from "../shared/dto/user.dto";
import { LedgerDbModule } from "../shared/ledger-db/ledger-db.module";
import { LedgerDbService } from "../shared/ledger-db/ledger-db.service";
import { getLogger } from "../shared/server";
import { UtilModule } from "../shared/util/util.module";
import { Country } from "../shared/entities/country.entity";
import { CountryService } from "../shared/util/country.service";
import { CreditOverall } from "../shared/entities/credit.overall.entity";
import { CompanyModule } from "../shared/company/company.module";
import { CompanyDto } from "../shared/dto/company.dto";
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
      const ledgerModule = app.get(LedgerDbService)

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

      const company = new CompanyDto()
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

    console.log('Creating countries')
    const data = fs.readFileSync('countries.json', 'utf8')
    const jsonData = JSON.parse(data)

    const utils = await NestFactory.createApplicationContext(UtilModule)
    const countryService = utils.get(CountryService)
    for (const jsn of jsonData) {
      if (jsn['ISO-alpha2 Code'] == undefined || jsn['ISO-alpha2 Code'] == "") {
        continue;
      }
      const country = new Country()
      country.alpha2 = jsn['ISO-alpha2 Code']
      country.alpha3 = jsn['ISO-alpha3 Code']
      country.name = jsn['Country or Area']
      await countryService.insertCountry(country)
      console.log('Country inserted', country)
    }
}