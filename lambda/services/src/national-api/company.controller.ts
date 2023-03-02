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
import { Company } from "../shared/entities/company.entity";
import { Action } from "../shared/casl/action.enum";
import { PoliciesGuardEx } from "../shared/casl/policy.guard";
import { QueryDto } from "../shared/dto/query.dto";
import { CompanyService } from "../shared/company/company.service";
import { CaslAbilityFactory } from "../shared/casl/casl-ability.factory";
import { JwtAuthGuard } from "../shared/auth/guards/jwt-auth.guard";
import { OrganisationSuspendDto } from "../shared/dto/organisation.suspend.dto";
import { FindOrganisationQueryDto } from "../shared/dto/find.organisation.dto";
import { OrganisationUpdateDto } from "../shared/dto/organisation.update.dto";
import { CountryService } from "../shared/util/country.service";
import { HelperService } from "../shared/util/helpers.service";

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
    console.log(req.abilityCondition);
    return this.companyService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company, true))
  @Post("queryNames")
  queryNames(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.companyService.queryNames(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Company))
  @Put("suspend")
  suspend(
    @Query("id") companyId: number,
    @Body() body: OrganisationSuspendDto,
    @Request() req
  ) {
    if (companyId == req.user.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "company.cantSuspendUrOwn",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
    return this.companyService.suspend(
      companyId,
      req.user,
      body.remarks,
      req.abilityCondition
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Company))
  @Put("activate")
  revoke(
    @Query("id") companyId: number,
    @Body() body: OrganisationSuspendDto,
    @Request() req
  ) {
    if (companyId == req.user.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "company.cantActivateUrOwn",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
    return this.companyService.activate(
      companyId,
      req.user,
      body.remarks,
      req.abilityCondition
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, Company))
  @Post("findByIds")
  async findByCompanyId(
    @Body() body: FindOrganisationQueryDto,
    @Request() req
  ) {
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
    return await this.companyService.update(company, req.abilityCondition);
  }

  @UseGuards(JwtAuthGuard)
  @Post("countries")
  async getCountries(@Body() query: QueryDto, @Request() req) {
    return await this.countryService.getCountryList(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("countries")
  async getAvailableCountries(@Request() req) {
    return await this.countryService.getAvailableCountries();
  }
}
