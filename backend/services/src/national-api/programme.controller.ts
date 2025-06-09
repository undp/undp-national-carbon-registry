import { Body, Controller, Get, Post, Put, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiKeyJwtAuthGuard } from "src/auth/guards/api-jwt-key.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { TransferFreezeGuard } from "src/auth/guards/transfer-freeze.guard";
import { Action } from "src/casl/action.enum";
import { AppAbility } from "src/casl/casl-ability.factory";
import { CheckPolicies } from "src/casl/policy.decorator";
import { PoliciesGuard, PoliciesGuardEx } from "src/casl/policy.guard";
import { BaseIdDto } from "src/dto/base.id.dto";
import { ConstantUpdateDto } from "src/dto/constants.update.dto";
import { DataExportQueryDto } from "src/dto/data.export.query.dto";
import { DocumentAction } from "src/dto/document.action";
import { InvestmentApprove } from "src/dto/investment.approve";
import { InvestmentCancel } from "src/dto/investment.cancel";
import { InvestmentReject } from "src/dto/investment.reject";
import { InvestmentRequestDto } from "src/dto/investment.request.dto";
import { NDCActionDto } from "src/dto/ndc.action.dto";
import { NdcDetailsActionDto } from "src/dto/ndc.details.action.dto";
import { NdcDetailsPeriodDto } from "src/dto/ndc.details.period.dto";
import { ProgrammeApprove } from "src/dto/programme.approve";
import { ProgrammeCertify } from "src/dto/programme.certify";
import { ProgrammeDocumentDto } from "src/dto/programme.document.dto";
import { ProgrammeDto } from "src/dto/programme.dto";
import { ProgrammeMitigationIssue } from "src/dto/programme.mitigation.issue";
import { ProgrammeReject } from "src/dto/programme.reject";
import { ProgrammeRetire } from "src/dto/programme.retire";
import { ProgrammeRevoke } from "src/dto/programme.revoke";
import { ProgrammeTransferApprove } from "src/dto/programme.transfer.approve";
import { ProgrammeTransferCancel } from "src/dto/programme.transfer.cancel";
import { ProgrammeTransferReject } from "src/dto/programme.transfer.reject";
import { ProgrammeTransferRequest } from "src/dto/programme.transfer.request";
import { QueryDto } from "src/dto/query.dto";
import { ProgrammeDocumentViewEntity } from "src/entities/document.view.entity";
import { Investment } from "src/entities/investment.entity";
import { NDCActionViewEntity } from "src/entities/ndc.view.entity";
import { Programme } from "src/entities/programme.entity";
import { ProgrammeTransfer } from "src/entities/programme.transfer";
import { ProgrammeService } from "src/programme/programme.service";

@ApiTags("Programme")
@ApiBearerAuth()
@Controller("programme")
export class ProgrammeController {
  constructor(private programmeService: ProgrammeService) {}

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
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, DocumentAction))
  @Post("addDocument")
  async addDocument(@Body() docDto: ProgrammeDocumentDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.addDocument(docDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, DocumentAction))
  @Post("docAction")
  async docAction(@Body() docAction: DocumentAction, @Request() req) {
    return this.programmeService.docAction(docAction, req.user);
  }

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
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, NDCActionViewEntity, true))
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("queryNdcActions")
  async queryNdcActions(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.queryNdcActions(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, NDCActionViewEntity, true))
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("queryNdcActions/download")
  async getNdcDownload(@Body() query: DataExportQueryDto, @Request() req) {
    return this.programmeService.downloadNdcActions(query, req.abilityCondition); // Return the filePath as a JSON response
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Programme, true))
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Programme, true))
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("download")
  async getDownload(@Body() query: DataExportQueryDto, @Request() req) {
    return this.programmeService.downloadProgrammes(query, req.abilityCondition); // Return the filePath as a JSON response
  }

  @ApiBearerAuth("api_key")
  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Programme, true))
  @Get("getHistory")
  async getHistory(@Query("programmeId") programmeId: string, @Request() req) {
    return this.programmeService.getProgrammeEvents(programmeId, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
  @Post("updateConfigs")
  async updateConfigs(@Body() config: ConstantUpdateDto) {
    return this.programmeService.updateCustomConstants(config.type, config);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
  @Put("authorize")
  async programmeApprove(@Body() body: ProgrammeApprove, @Request() req) {
    return this.programmeService.authorizeProgramme(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
  @Put("issue")
  async programmeIssue(@Body() body: ProgrammeMitigationIssue, @Request() req) {
    return this.programmeService.issueProgrammeCredit(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
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
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeCertify))
  @Put("certify")
  async programmeCertify(@Body() body: ProgrammeCertify, @Request() req) {
    return this.programmeService.certify(body, true, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeCertify))
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
  async transferRequest(@Body() body: ProgrammeTransferRequest, @Request() req) {
    return this.programmeService.transferRequest(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    TransferFreezeGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, ProgrammeTransferRequest)
  )
  @Post("transferApprove")
  async transferApprove(@Body() body: ProgrammeTransferApprove, @Request() req) {
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
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
  @Post("transferQuery")
  queryUser(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.queryProgrammeTransfers(query, req.abilityCondition, req.user);
  }
  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
  @Post("transfers/download")
  async getTransfersDownload(@Body() query: DataExportQueryDto, @Request() req) {
    return this.programmeService.downloadTransfers(query, req.abilityCondition, req.user); // Return the filePath as a JSON response
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
  @Get("transfersByProgrammeId")
  transfersByProgrammeId(@Query("programmeId") programmeId: string, @Request() req) {
    return this.programmeService.getTransferByProgrammeId(
      programmeId,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Investment))
  @Post("addInvestment")
  async addInvestment(@Body() investment: InvestmentRequestDto, @Request() req) {
    return this.programmeService.addInvestment(investment, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, Investment)
  )
  @Post("investmentApprove")
  async investmentApprove(@Body() body: InvestmentApprove, @Request() req) {
    return this.programmeService.investmentApprove(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Delete, Investment)
  )
  @Post("investmentReject")
  async investmentReject(@Body() body: InvestmentReject, @Request() req) {
    return this.programmeService.investmentReject(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Delete, Investment)
  )
  @Post("investmentCancel")
  async investmentCancel(@Body() body: InvestmentCancel, @Request() req) {
    return this.programmeService.investmentCancel(body, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Investment, true))
  @Post("investmentQuery")
  queryInvestmentUser(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.queryInvestment(query, req.abilityCondition, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Investment, true))
  @Post("investments/download")
  async getInvestmentsDownload(@Body() query: DataExportQueryDto, @Request() req) {
    return this.programmeService.downloadInvestments(query, req.abilityCondition, req.user); // Return the filePath as a JSON response
  }

  @UseGuards(JwtAuthGuard)
  @Get("queryNdcDetailsPeriod")
  getNdcDetailsPeriods(@Request() req) {
    return this.programmeService.getNdcDetailsPeriods(req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("addNdcDetailsPeriod")
  addNdcDetailsPeriod(@Body() body: NdcDetailsPeriodDto, @Request() req) {
    return this.programmeService.addNdcDetailsPeriod(body, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("deleteNdcDetailsPeriod")
  deleteNdcDetailsPeriod(@Body() id: number, @Request() req) {
    return this.programmeService.deleteNdcDetailsPeriod(id, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("finalizeNdcDetailsPeriod")
  finalizeNdcDetailsPeriod(@Body() id: number, @Request() req) {
    return this.programmeService.finalizeNdcDetailsPeriod(id, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("queryNdcDetailsAction")
  getNdcDetailActions(@Request() req) {
    return this.programmeService.getNdcDetailActions(req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("addNdcDetailsAction")
  addNdcDetailsAction(@Body() body: NdcDetailsActionDto, @Request() req) {
    return this.programmeService.addNdcDetailAction(body, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put("updateNdcDetailsAction")
  updateNdcDetailsAction(@Body() body: NdcDetailsActionDto, @Request() req) {
    return this.programmeService.updateNdcDetailsAction(body, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("approveNdcDetailsAction")
  approveNdcDetailsAction(@Body() baseIdDto: BaseIdDto, @Request() req) {
    return this.programmeService.approveNdcDetailsAction(baseIdDto, req.abilityCondition, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("rejectNdcDetailsAction")
  rejectNdcDetailsAction(@Body() baseIdDto: BaseIdDto, @Request() req) {
    return this.programmeService.rejectNdcDetailsAction(baseIdDto, req.abilityCondition, req.user);
  }
}
