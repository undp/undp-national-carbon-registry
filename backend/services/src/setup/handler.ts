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
import { LedgerDBInterface } from "../shared/ledger-db/ledger.db.interface";
import { Handler } from "aws-lambda";
import { LocationModule } from "../shared/location/location.module";
import { LocationInterface } from "../shared/location/location.interface";
import { ProgrammeModule } from "../shared/programme/programme.module";
import { ProgrammeService } from "../shared/programme/programme.service";
import { ConfigService } from "@nestjs/config";
const fs = require("fs");

export const handler: Handler = async (event) => {
  console.log(`Setup Handler Started with: ${event}`);

  if (!event) {
    event = process.env;
  }

  const userApp = await NestFactory.createApplicationContext(UserModule, {
    logger: getLogger(UserModule),
  });
  const userService = userApp.get(UserService);

  if (event.type === "IMPORT_USERS" && event.body) {

    const users = event.body.split("\n");

    let c = 0;
    for (const user of users) {
      c++;
      if (c === 1) {
        continue;
      }
      const fields = user.split(",");
      if (fields.length < 7) {
        continue;
      }
      // (name: string, companyRole: CompanyRole, taxId: string, password: string, email: string, userRole: string
      const cr =
        fields[4] == "Government"
          ? CompanyRole.GOVERNMENT
          : fields[4] == "Certifier"
          ? CompanyRole.CERTIFIER
          : CompanyRole.PROGRAMME_DEVELOPER;
      const ur =
        fields[5] == "admin"
          ? Role.Admin
          : fields[5] == "Manager"
          ? Role.Manager
          : Role.ViewOnly;
      console.log('Inserting user', fields[0],
      cr,
      fields[3],
      fields[1],
      ur,
      fields[2])
      await userService.createUserWithPassword(
        fields[0],
        cr,
        fields[3],
        fields[6],
        fields[1],
        ur,
        fields[2]
      );
    }
    return;
  }

  if (event.type === "IMPORT_ORG" && event.body) {
    const companyApp = await NestFactory.createApplicationContext(
      CompanyModule,
      {
        logger: getLogger(CompanyModule),
      }
    );
    const companyService = companyApp.get(CompanyService);
    const configService = companyApp.get(ConfigService);

    const companies = event.body.split("\n");

    let c = 0;
    for (const company of companies) {
      c++;
      if (c === 1) {
        continue;
      }
      const fields = company.split(",");
      if (fields.length < 5) {
        continue;
      }
      // (name: string, companyRole: CompanyRole, taxId: string, password: string, email: string, userRole: string
      const cr = fields[4] == "Certifier"
          ? CompanyRole.CERTIFIER
          : CompanyRole.PROGRAMME_DEVELOPER;
      const org = await companyService.create({
            taxId: fields[3],
            companyId: undefined,
            name: fields[0],
            email: fields[1],
            phoneNo: fields[2],
            website: undefined,
            address: configService.get("systemCountryName"),
            logo: undefined,
            country: configService.get("systemCountry"),
            companyRole: cr,
            createdTime: undefined,
          });
      console.log('Company created', org)
    }
    return;
  }

  if (event.type === "UPDATE_COORDINATES") {
    const prApp = await NestFactory.createApplicationContext(ProgrammeModule, {
      logger: getLogger(ProgrammeModule),
    });
    const programmeService = prApp.get(ProgrammeService);
    await programmeService.regenerateRegionCoordinates();
    return;
  }

  const u = await userService.findOne(event["rootEmail"]);
  if (u != undefined) {
    console.log("Root user already created and setup is completed");
  }

  const app = await NestFactory.createApplicationContext(LedgerDbModule, {
    logger: getLogger(LedgerDbModule),
  });
  try {
    const ledgerModule = app.get(LedgerDBInterface);

    await ledgerModule.createTable("company");
    await ledgerModule.createIndex("txId", "company");

    await ledgerModule.createTable("overall");
    await ledgerModule.createIndex("txId", "overall");
    const creditOverall = new CreditOverall();
    creditOverall.credit = 0;
    creditOverall.txId = event["systemCountryCode"];
    creditOverall.txRef = "genesis block";
    creditOverall.txType = TxType.ISSUE;
    await ledgerModule.insertRecord(creditOverall, "overall");
    await ledgerModule.createTable();
    await ledgerModule.createIndex("programmeId");
    console.log("QLDB Table created");
  } catch (e) {
    console.log("QLDB table does not create", e);
  }

  try {
    const company = new OrganisationDto();
    company.country = event["systemCountryCode"];
    company.name = event["name"];
    company.logo = event["logoBase64"];
    company.companyRole = CompanyRole.GOVERNMENT;

    const user = new UserDto();
    user.email = event["rootEmail"];
    user.name = "Root";
    user.role = Role.Root;
    user.phoneNo = "-";
    user.company = company;

    console.log("Adding company", company);
    console.log("Adding user", user);

    await userService.create(user, -1, CompanyRole.GOVERNMENT);
  } catch (e) {
    console.log(`User ${event["rootEmail"]} failed to create`, e);
  }

  const countryData = fs.readFileSync("countries.json", "utf8");
  const jsonCountryData = JSON.parse(countryData);
  const utils = await NestFactory.createApplicationContext(UtilModule);
  const countryService = utils.get(CountryService);

  jsonCountryData.forEach(async (countryItem) => {
    if (countryItem["UN Member States"] === "x") {
      const country = new Country();
      country.alpha2 = countryItem["ISO-alpha2 Code"];
      country.alpha3 = countryItem["ISO-alpha3 Code"];
      country.name = countryItem["English short"];
      await countryService.insertCountry(country);
    }
  });

  const locationApp = await NestFactory.createApplicationContext(
    LocationModule,
    {
      logger: getLogger(UserModule),
    }
  );
  const locationInterface = locationApp.get(LocationInterface);
  await locationInterface.init();
};
