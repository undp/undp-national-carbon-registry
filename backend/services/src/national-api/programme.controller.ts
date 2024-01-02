import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  ApiKeyJwtAuthGuard,
  Action,
  AppAbility,
  CheckPolicies,
  PoliciesGuard,
  TransferFreezeGuard,
  PoliciesGuardEx,
  ConstantUpdateDto,
  JwtAuthGuard,
  Programme,
  ProgrammeAcceptedDto,
  ProgrammeApprove,
  ProgrammeCertify,
  ProgrammeDocumentDto,
  ProgrammeDto,
  ProgrammeIssue,
  ProgrammeReject,
  ProgrammeRetire,
  ProgrammeRevoke,
  ProgrammeService,
  ProgrammeTransfer,
  ProgrammeTransferApprove,
  ProgrammeTransferCancel,
  ProgrammeTransferReject,
  ProgrammeTransferRequest,
  QueryDto,
  DocumentAction,
  NDCActionDto,
  NDCActionViewEntity,
  ProgrammeDocumentViewEntity,
  InvestmentRequestDto,
  Investment,
  InvestmentApprove,
  InvestmentReject,
  InvestmentCancel,
  ProgrammeMitigationIssue,
  NdcDetailsActionDto,
  NdcDetailsPeriodDto,
  BaseIdDto
} from "@undp/carbon-services-lib";

@ApiTags("Programme")
@ApiBearerAuth()
@Controller("programme")
export class ProgrammeController {
  constructor(private programmeService: ProgrammeService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
  @Post("create")
  async addProgramme(@Body() programme: ProgrammeDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.create(programme, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
  @Post("addNDCAction")
  async addNDCAction(@Body() ndcAction: NDCActionDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.addNDCAction(ndcAction, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, DocumentAction)
  )
  @Post("addDocument")
  async addDocument(@Body() docDto: ProgrammeDocumentDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.addDocument(docDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, DocumentAction)
  )
  @Post("docAction")
  async docAction(@Body() docAction: DocumentAction, @Request() req) {
    return this.programmeService.docAction(docAction, req.user);
  }

  // @ApiBearerAuth("api_key")
  // @ApiBearerAuth()
  // @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
  // @Post("acceptProgramme")
  // async acceptProgramme(@Body() acc: ProgrammeAcceptedDto) {
  //   return this.programmeService.programmeAccept(acc);
  // }

  // @ApiBearerAuth('api_key')
  // @ApiBearerAuth()
  // @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
  // @Post('addMitigation')
  // async addMitigation(@Body()mitigation: MitigationAddDto) {
  //   return this.programmeService.addMitigation(mitigation)
  // }

  // @ApiBearerAuth("api_key")
  // @ApiBearerAuth()
  // @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
  // @Post("updateOwnership")
  // async updateOwnership(@Body() update: OwnershipUpdateDto) {
  //   return this.programmeService.updateOwnership(update);
  // }


  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, ProgrammeDocumentViewEntity, true)
  )
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("queryDocs")
  async queryDocuments(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.queryDocuments(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, NDCActionViewEntity, true)
  )
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("queryNdcActions")
  async queryNdcActions(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.queryNdcActions(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, Programme, true)
  )
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth("api_key")
  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, Programme, true)
  )
  @Get("getHistory")
  async getHistory(@Query("programmeId") programmeId: string, @Request() req) {
    return this.programmeService.getProgrammeEvents(programmeId, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, Programme)
  )
  @Post("updateConfigs")
  async updateConfigs(@Body() config: ConstantUpdateDto) {
    return this.programmeService.updateCustomConstants(config.type, config);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, Programme)
  )
  @Put("authorize")
  async programmeApprove(@Body() body: ProgrammeApprove, @Request() req) {
    return this.programmeService.approveProgramme(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, Programme)
  )
  @Put("issue")
  async programmeIssue(@Body() body: ProgrammeMitigationIssue, @Request() req) {
    return this.programmeService.issueProgrammeCredit(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, Programme)
  )
  @Put("reject")
  async programmeReject(@Body() body: ProgrammeReject, @Request() req) {
    return this.programmeService.rejectProgramme(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ProgrammeTransferRequest)
  )
  @Put("retire")
  async programmeRetire(@Body() body: ProgrammeRetire, @Request() req) {
    return this.programmeService.retireProgramme(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ProgrammeCertify)
  )
  @Put("certify")
  async programmeCertify(@Body() body: ProgrammeCertify, @Request() req) {
    return this.programmeService.certify(body, true, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ProgrammeCertify)
  )
  @Put("revoke")
  async programmeRevoke(@Body() body: ProgrammeRevoke, @Request() req) {
    return this.programmeService.certify(body, false, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, ProgrammeTransferRequest)
  )
  @Post("transferRequest")
  async transferRequest(
    @Body() body: ProgrammeTransferRequest,
    @Request() req
  ) {
    return this.programmeService.transferRequest(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, ProgrammeTransferRequest)
  )
  @Post("transferApprove")
  async transferApprove(
    @Body() body: ProgrammeTransferApprove,
    @Request() req
  ) {
    return this.programmeService.transferApprove(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Delete, ProgrammeTransfer)
  )
  @Post("transferReject")
  async transferReject(@Body() body: ProgrammeTransferReject, @Request() req) {
    return this.programmeService.transferReject(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Delete, ProgrammeTransfer)
  )
  @Post("transferCancel")
  async transferCancel(@Body() body: ProgrammeTransferCancel, @Request() req) {
    return this.programmeService.transferCancel(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true)
  )
  @Post("transferQuery")
  queryUser(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.programmeService.queryProgrammeTransfers(
      query,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true)
  )
  @Get("transfersByProgrammeId")
  transfersByProgrammeId(
    @Query("programmeId") programmeId: string,
    @Request() req
  ) {
    console.log(req.abilityCondition);
    return this.programmeService.getTransferByProgrammeId(
      programmeId,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Investment))
  @Post('addInvestment')
  async addInvestment(@Body() investment: InvestmentRequestDto, @Request() req) {
    return this.programmeService.addInvestment(investment, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Create, Investment))
  @Post('investmentApprove')
  async investmentApprove(@Body() body: InvestmentApprove, @Request() req) {
    return this.programmeService.investmentApprove(body, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Investment))
  @Post('investmentReject')
  async investmentReject(@Body() body: InvestmentReject, @Request() req) {
    return this.programmeService.investmentReject(body, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Delete, Investment))
  @Post('investmentCancel')
  async investmentCancel(@Body() body: InvestmentCancel, @Request() req) {
    return this.programmeService.investmentCancel(body, req.user)
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Investment, true))
  @Post('investmentQuery')
  queryInvestmentUser(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition)
    return this.programmeService.queryInvestment(query, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get("queryNdcDetailsPeriod")
  getNdcDetailsPeriods(@Request() req) {
    return this.programmeService.getNdcDetailsPeriods(req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post("addNdcDetailsPeriod")
  addNdcDetailsPeriod(@Body() body: NdcDetailsPeriodDto, @Request() req) {
    return this.programmeService.addNdcDetailsPeriod(body, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post("deleteNdcDetailsPeriod")
  deleteNdcDetailsPeriod(@Body() id: number, @Request() req) {
    return this.programmeService.deleteNdcDetailsPeriod(id, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post("finalizeNdcDetailsPeriod")
  finalizeNdcDetailsPeriod(@Body() id: number, @Request() req) {
    return this.programmeService.finalizeNdcDetailsPeriod(id, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('queryNdcDetailsAction')
  getNdcDetailActions(@Request() req) {
    return this.programmeService.getNdcDetailActions(req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('addNdcDetailsAction')
  addNdcDetailsAction(@Body() body: NdcDetailsActionDto, @Request() req) {
    return this.programmeService.addNdcDetailAction(body, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Put('updateNdcDetailsAction')
  updateNdcDetailsAction(@Body() body: NdcDetailsActionDto, @Request() req) {
    return this.programmeService.updateNdcDetailsAction(body, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('approveNdcDetailsAction')
  approveNdcDetailsAction(@Body() baseIdDto: BaseIdDto, @Request() req) {
    return this.programmeService.approveNdcDetailsAction(baseIdDto, req.abilityCondition, req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('rejectNdcDetailsAction')
  rejectNdcDetailsAction(@Body() baseIdDto: BaseIdDto, @Request() req) {
    return this.programmeService.rejectNdcDetailsAction(baseIdDto, req.abilityCondition, req.user)
  }

}
