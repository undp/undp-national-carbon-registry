import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { ProjectCreateDto } from "@app/shared/dto/project.create.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { ProjectManagementService } from "@app/shared/project-management/project-management.service";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@ApiTags("ProjectManagement")
@ApiBearerAuth()
@Controller("projectManagement")
export class ProjectManagementController {
  constructor(private projectManagementService: ProjectManagementService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, ProgrammeSl)
  )
  @Post("create")
  async addProject(@Body() body: any, @Request() req) {
    const dtoData = JSON.parse(body.data);
    const dto = plainToInstance(ProjectCreateDto, dtoData);
    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log("validation failed");
      throw new HttpException(errors, HttpStatus.BAD_REQUEST);
    }
    return this.projectManagementService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProgrammeSl)
  )
  @Post("inf/approve")
  async approveINF(@Body("refId") refId: string, @Request() req) {
    return this.projectManagementService.approveINF(refId, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProgrammeSl)
  )
  @Post("inf/reject")
  async rejectINF(
    @Body("refId") refId: string,
    @Body("remark") remark: string,
    @Request() req
  ) {
    return this.projectManagementService.rejectINF(refId, remark, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProgrammeSl))
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.projectManagementService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProgrammeSl))
  @Get("logs")
  getLogs(@Query("refId") refId: string, @Request() req) {
    return this.projectManagementService.getLogs(refId);
  }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("createCostQuotation")
  // async createCostQuotation(
  //   @Body() costQuotationDto: CostQuotationDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.createCostQuotation(
  //     costQuotationDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("createProjectProposal")
  // async createProjectProposal(
  //   @Body() projectProposalDto: ProjectProposalDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.createProjectProposal(
  //     projectProposalDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("createValidationAgreement")
  // async createValidationAgreement(
  //   @Body() validationAgreementDto: ValidationAgreementDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.createValidationAgreement(
  //     validationAgreementDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("proposal/approve")
  // async approveProposal(
  //   @Body("programmeId") programmeId: string,
  //   @Request() req
  // ) {
  //   return this.programmeService.approveProposal(programmeId, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("proposal/reject")
  // async rejectProposal(
  //   @Body("programmeId") programmeId: string,
  //   @Body("remark") remark: string,
  //   @Request() req
  // ) {
  //   return this.programmeService.rejectProposal(programmeId, remark, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("createCMA")
  // async createCMA(@Body() cmaDto: CMADto, @Request() req) {
  //   return this.programmeService.createCMA(cmaDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("cma/approve")
  // async approveCMA(@Body() cmaApproveDto: CMAApproveDto, @Request() req) {
  //   return this.programmeService.approveCMA(cmaApproveDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("cma/reject")
  // async rejectCMA(
  //   @Body("programmeId") programmeId: string,
  //   @Body("remark") remark: string,
  //   @Request() req
  // ) {
  //   return this.programmeService.rejectCMA(programmeId, remark, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("validation/create")
  // async createValidationReport(
  //   @Body() validationReportDto: ValidationReportDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.createValidationReport(
  //     validationReportDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("validation/approve")
  // async approveValidation(
  //   @Body("programmeId") programmeId: string,
  //   @Request() req
  // ) {
  //   return this.programmeService.approveValidation(programmeId, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  // @Post("validation/reject")
  // async rejectValidation(
  //   @Body("programmeId") programmeId: string,
  //   @Body("remark") remark: string,
  //   @Request() req
  // ) {
  //   return this.programmeService.rejectValidation(
  //     programmeId,
  //     remark,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getDocs")
  // async getDocs(@Body() getDocDto: GetDocDto, @Request() req) {
  //   return this.programmeService.getDocs(getDocDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getDocVersions")
  // async getDocVersions(@Body() getDocDto: GetDocDto, @Request() req) {
  //   return this.programmeService.getDocVersions(getDocDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getVerificationDocVersions")
  // async getVerificationDocVersions(
  //   @Body() getDocDto: GetDocDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.getVerificationDocVersions(
  //     getDocDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getDocByVersion")
  // async getDocByVersion(@Body() getDocDto: GetDocDto, @Request() req) {
  //   return this.programmeService.getDocByVersion(getDocDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getVerificationDocByVersion")
  // async getVerificationDocByVersion(
  //   @Body() getDocDto: GetDocDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.getVerificationDocByVersion(
  //     getDocDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getDocLastVersion")
  // async getDocLastVersion(@Body() getDocDto: GetDocDto, @Request() req) {
  //   return this.programmeService.getDocLastVersion(getDocDto, req.user);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getVerificationDocLastVersion")
  // async getVerificationDocLastVersion(
  //   @Body() getDocDto: GetDocDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.getVerificationDocLastVersion(
  //     getDocDto,
  //     req.user
  //   );
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Read, DocumentEntity)
  // )
  // @Post("getDocumentById")
  // async getDocumentById(@Body("docId") docId: number, @Request() req) {
  //   return this.programmeService.getDocumentById(docId);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @Post("getProjectById")
  // async getProjectById(@Body("programmeId") programmeId: string) {
  //   return this.programmeService.getProjectById(programmeId);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @Post("getCarbonNeutralCertificates")
  // async getCncByCompanyId(@Body("companyId") companyId: number) {
  //   return this.programmeService.getCarbonNeutralCertificateDocs(companyId);
  // }

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @Post("requestCarbonNeutralCertificate")
  // async createCncRequest(
  //   @Body("programmeId") programmeId: string,
  //   @Body("companyId") companyId: number,
  //   @Request() req
  // ) {
  //   return this.programmeService.requestCarbonNeutralCertificate(
  //     programmeId,
  //     companyId,
  //     req.user
  //   );
  // }

  // @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @Post("issueCarbonNeutralCertificate")
  // async approveCarbonNeutralCertificate(
  //   @Body() cNCertificateIssueDto: CNCertificateIssueDto,
  //   @Request() req
  // ) {
  //   return this.programmeService.approveCarbonNeutralCertificate(
  //     cNCertificateIssueDto,
  //     req.user
  //   );
  // }

  // @UseGuards(ProjectRateLimiterGuard)
  // @Post("public/get")
  // async getPublicProjectDetails(@Body() query: QueryDto, @Request() req) {
  //   return this.programmeService.getPublicProjectDetails(query);
  // }
}
