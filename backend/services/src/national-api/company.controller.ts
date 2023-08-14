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
import { QueryDto } from "carbon-services-lib";
import { OrganisationSuspendDto } from "carbon-services-lib";
import { FindOrganisationQueryDto } from "carbon-services-lib";
import { OrganisationUpdateDto } from "carbon-services-lib";
import { HelperService,CountryService,CompanyService ,JwtAuthGuard,Action,PoliciesGuardEx,CaslAbilityFactory} from 'carbon-services-lib';

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
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
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
