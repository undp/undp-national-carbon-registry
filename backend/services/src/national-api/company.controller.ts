import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Put,
  HttpException,
  HttpStatus,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiKeyJwtAuthGuard } from "src/auth/guards/api-jwt-key.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action } from "src/casl/action.enum";
import { CaslAbilityFactory } from "src/casl/casl-ability.factory";
import { PoliciesGuardEx } from "src/casl/policy.guard";
import { CompanyService } from "src/company/company.service";
import { DataExportQueryDto } from "src/dto/data.export.query.dto";
import { FindOrganisationQueryDto } from "src/dto/find.organisation.dto";
import { InvestmentDto } from "src/dto/investment.dto";
import { OrganisationSuspendDto } from "src/dto/organisation.suspend.dto";
import { OrganisationUpdateDto } from "src/dto/organisation.update.dto";
import { QueryDto } from "src/dto/query.dto";
import { Company } from "src/entities/company.entity";
import { Investment } from "src/entities/investment.entity";
import { CountryService } from "src/util/country.service";
import { HelperService } from "src/util/helpers.service";

@ApiTags("Organisation")
@ApiBearerAuth()
@Controller("organisation")
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly countryService: CountryService,
    private caslAbilityFactory: CaslAbilityFactory,
    private helperService: HelperService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company, true))
  @Post("query")
  query(@Body() query: QueryDto, @Request() req) {
    return this.companyService.query(query, req.abilityCondition, req.user.companyRole);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company, true))
  @Post("queryNames")
  queryNames(@Body() query: QueryDto, @Request() req) {
    return this.companyService.queryNames(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company, true))
  @Post("download")
  async getDownload(@Body() query: DataExportQueryDto, @Request() req) {
    try {
      return this.companyService.download(query, req.abilityCondition, req.user.companyRole); // Return the filePath as a JSON response
    } catch (err) {
      return { error: "Error generating the CSV file." };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Company))
  @Put("suspend")
  suspend(@Query("id") companyId: number, @Body() body: OrganisationSuspendDto, @Request() req) {
    if (companyId == req.user.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("company.cantSuspendUrOwn", []),
        HttpStatus.FORBIDDEN
      );
    }
    return this.companyService.suspend(companyId, req.user, body.remarks, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Company))
  @Put("activate")
  revoke(@Query("id") companyId: number, @Body() body: OrganisationSuspendDto, @Request() req) {
    if (companyId == req.user.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("company.cantActivateUrOwn", []),
        HttpStatus.FORBIDDEN
      );
    }
    return this.companyService.activate(companyId, req.user, body.remarks, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Approve, Company))
  @Put("approve")
  approve(@Query("id") companyId: number, @Body() body: OrganisationSuspendDto, @Request() req) {
    return this.companyService.approve(companyId, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Reject, Company))
  @Put("reject")
  reject(@Query("id") companyId: number, @Body() body: OrganisationSuspendDto, @Request() req) {
    return this.companyService.reject(companyId, req.user, body.remarks, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company))
  @Post("findByIds")
  async findByCompanyId(@Body() body: FindOrganisationQueryDto, @Request() req) {
    return this.companyService.findByCompanyIds(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getCompany(@Query("id") companyId: number, @Request() req) {
    return await this.companyService.findByCompanyId(companyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, Company))
  @Put("update")
  async updateCompany(@Body() company: OrganisationUpdateDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return await this.companyService.update(company, req.abilityCondition);
  }

  @Post("countries")
  async getCountries(@Body() query: QueryDto, @Request() req) {
    return await this.countryService.getCountryList(query);
  }

  @Get("countries")
  async getAvailableCountries(@Request() req) {
    return await this.countryService.getAvailableCountries();
  }

  @Post("regions")
  async getRegionList(@Body() query: QueryDto, @Request() req) {
    return await this.countryService.getRegionList(query);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Investment))
  @Post("addInvestment")
  async addInvestment(@Body() investment: InvestmentDto, @Request() req) {
    return this.companyService.addNationalInvestment(investment, req.user);
  }

  @ApiBearerAuth()
  @Get("getMinistries")
  getMinistryUser(@Request() req) {
    return this.companyService.getMinistries();
  }
}
