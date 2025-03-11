import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { DocumentManagementService } from "@app/shared/document-management/document-management.service";
import { BaseDocumentDto } from "@app/shared/dto/base.document.dto";
import { DocumentActionRequestDto } from "@app/shared/dto/document.action.request.dto";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("documentManagement")
export class DocumentManagementController {
  constructor(
    private readonly documentManagementService: DocumentManagementService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  @Post("add")
  async add(@Body() documentDTO: BaseDocumentDto, @Request() req) {
    return await this.documentManagementService.addDocument(
      documentDTO,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  @Post("approve")
  async approve(
    @Query("refId") refId: string,
    @Body() dto: DocumentActionRequestDto,
    @Request() req
  ) {
    return await this.documentManagementService.approve(refId, dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  @Post("reject")
  async reject(
    @Query("refId") refId: string,
    @Body() dto: DocumentActionRequestDto,
    @Request() req
  ) {
    return await this.documentManagementService.reject(refId, dto, req.user);
  }
}
