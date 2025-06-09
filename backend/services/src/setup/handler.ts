import { NestFactory } from "@nestjs/core";
import { Handler } from "aws-lambda";
import { ConfigService } from "@nestjs/config";
import { Role } from "../casl/role.enum";
import { CompanyModule } from "../company/company.module";
import { CompanyService } from "../company/company.service";
import { OrganisationDto } from "../dto/organisation.dto";
import { UserDto } from "../dto/user.dto";
import { Country } from "../entities/country.entity";
import { CreditOverall } from "../entities/credit.overall.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { GovDepartment } from "../enum/govDep.enum";
import { Ministry } from "../enum/ministry.enum";
import { TxType } from "../enum/txtype.enum";
import { LedgerDbModule } from "../ledger-db/ledger-db.module";
import { LedgerDBInterface } from "../ledger-db/ledger.db.interface";
import { LocationInterface } from "../location/location.interface";
import { LocationModule } from "../location/location.module";
import { ProgrammeModule } from "../programme/programme.module";
import { ProgrammeService } from "../programme/programme.service";
import { getLogger } from "../server";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { CountryService } from "../util/country.service";
import { UtilModule } from "../util/util.module";
const fs = require("fs");

export const handler: Handler = async (event) => {
  console.log(`Setup Handler Started with: ${event}`);

  if (!event) {
    event = process.env;
  }

  function mapEnvironmentToEnum<T>(envValue: string, targetEnum: T): T[keyof T] | undefined {
    const enumValues = Object.values(targetEnum).filter((value) => typeof value === 'string') as string[];
    if (enumValues.includes(envValue)) {
      return envValue as T[keyof T];
    }
    return undefined;
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
      let fields = user.split(",");
      if (fields.length < 7) {
        continue;
      }
      fields = fields.map(f => f.trim())
      // (name: string, companyRole: CompanyRole, taxId: string, password: string, email: string, userRole: string
      const cr =
        fields[4] == "Government"
          ? CompanyRole.GOVERNMENT
          : fields[4] == "Certifier"
          ? CompanyRole.CERTIFIER
          : fields[4] == "API"
          ? CompanyRole.API
          :CompanyRole.PROGRAMME_DEVELOPER;
      const ur =
        fields[5] == "admin"
          ? Role.Admin
          : fields[5] == "Manager"
          ? Role.Manager
          : Role.ViewOnly;

      try {
        await userService.createUserWithPassword(
          fields[0],
          cr,
          fields[3],
          fields[6],
          fields[1],
          ur,
          fields[2],
          (cr === CompanyRole.API && fields.length > 7) ? fields[7] : undefined
        );
      } catch (e) {
        console.log('Fail to create user', fields[1], e)
      }
     
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
      let fields = company.split(",");
      if (fields.length < 5) {
        continue;
      }
      fields = fields.map(f => f.trim())
      // (name: string, companyRole: CompanyRole, taxId: string, password: string, email: string, userRole: string
      const cr = fields[4] == "Certifier"
          ? CompanyRole.CERTIFIER
          : fields[4] == "API"
          ? CompanyRole.API
          : CompanyRole.PROGRAMME_DEVELOPER;

      try {
        const org = await companyService.create({
              taxId: fields[3],
              companyId: undefined,
              paymentId: undefined,
              name: fields[0],
              email: fields[1],
              phoneNo: fields[2],
              nameOfMinister:undefined,
              sectoralScope:undefined,
              ministry:undefined,
              govDep:undefined,
              website: undefined,
              address: configService.get("systemCountryName"),
              logo: undefined,
              country: configService.get("systemCountry"),
              companyRole: cr,
              createdTime: undefined,
              regions: [],
              state: undefined //double check this
            });

      } catch (e) {
        console.log('Fail to create company', fields[1])
      }
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

  } catch (e) {
    console.log("QLDB table does not create", e);
  }

  try {
    const company = new OrganisationDto();
    company.country = event["systemCountryCode"];
    company.name = event["name"];
    company.logo = event["logoBase64"];
    company.companyRole = CompanyRole.GOVERNMENT;
    company.taxId = `00000${event["systemCountryCode"]}`
    company.govDep = GovDepartment[event["Department"]];
    company.ministry = mapEnvironmentToEnum(event["Ministry"], Ministry);

    const user = new UserDto();
    user.email = event["rootEmail"];
    user.name = "Root";
    user.role = Role.Root;
    user.phoneNo = "-";
    user.company = company;

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
  const regionRawData = fs.readFileSync('regions.csv', 'utf8');
  await locationInterface.init(regionRawData);
};
