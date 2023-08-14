import { Body, Controller, Get, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Programme } from '../shared/entities/programme.entity';
import { ProgrammeDto } from 'carbon-services-lib';
import { ProgrammeService } from '../shared/programme/programme.service';
import { QueryDto } from 'carbon-services-lib';
import { ConstantUpdateDto } from 'carbon-services-lib';
import { ProgrammeApprove } from 'carbon-services-lib';
import { ProgrammeReject } from 'carbon-services-lib';
import { ProgrammeRetire } from 'carbon-services-lib';
import { ApiKeyJwtAuthGuard ,Action,AppAbility,CheckPolicies, PoliciesGuard, TransferFreezeGuard,PoliciesGuardEx} from "carbon-services-lib";
import { ProgrammeTransferRequest } from 'carbon-services-lib';
import { ProgrammeTransfer } from '../shared/entities/programme.transfer';
import { ProgrammeTransferApprove } from 'carbon-services-lib';
import { ProgrammeTransferReject } from 'carbon-services-lib';
import { ProgrammeCertify } from 'carbon-services-lib';
import { ProgrammeTransferCancel } from 'carbon-services-lib';
import { ProgrammeIssue } from 'carbon-services-lib';
import { ProgrammeRevoke } from 'carbon-services-lib';
import { ProgrammeDocumentDto } from 'carbon-services-lib';
import { MitigationProperties } from 'carbon-services-lib';
import { OwnershipUpdateDto } from 'carbon-services-lib';
import { MitigationAddDto } from 'carbon-services-lib';
import { ProgrammeAcceptedDto } from 'carbon-services-lib';

@ApiTags('Programme')
@ApiBearerAuth()
@Controller('programme')
export class ProgrammeController {

    constructor(private programmeService: ProgrammeService) {

    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
    @Post('create')
    async addProgramme(@Body()programme: ProgrammeDto) {
      return this.programmeService.create(programme)
    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
    @Post('addDocument')
    async addDocument(@Body()document: ProgrammeDocumentDto) {
      return this.programmeService.addDocument(document)
    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
    @Post('acceptProgramme')
    async acceptProgramme(@Body()acc: ProgrammeAcceptedDto) {
      return this.programmeService.programmeAccept(acc)
    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
    @Post('addMitigation')
    async addMitigation(@Body()mitigation: MitigationAddDto) {
      return this.programmeService.addMitigation(mitigation)
    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Programme))
    @Post('updateOwnership')
    async updateOwnership(@Body()update: OwnershipUpdateDto) {
      return this.programmeService.updateOwnership(update)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Programme, true))
    // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
    @Post('query')
    async getAll(@Body()query: QueryDto, @Request() req) {
      return this.programmeService.query(query, req.abilityCondition)
    }

    @ApiBearerAuth('api_key')
    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Programme, true))
    @Get('getHistory')
    async getHistory(@Query('programmeId') programmeId: string, @Request() req) {
        return this.programmeService.getProgrammeEvents(programmeId, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Post('updateConfigs')
    async updateConfigs(@Body() config: ConstantUpdateDto) {
        return this.programmeService.updateCustomConstants(config.type, config);
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('authorize')
    async programmeApprove(@Body() body: ProgrammeApprove, @Request() req) {
        return this.programmeService.approveProgramme(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('issue')
    async programmeIssue(@Body() body: ProgrammeIssue, @Request() req) {
        return this.programmeService.issueProgrammeCredit(body, req.user)
    }


    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('reject')
    async programmeReject(@Body() body: ProgrammeReject, @Request() req) {
        return this.programmeService.rejectProgramme(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(TransferFreezeGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeTransferRequest))
    @Put('retire')
    async programmeRetire(@Body() body: ProgrammeRetire, @Request() req) {
        return this.programmeService.retireProgramme(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeCertify))
    @Put('certify')
    async programmeCertify(@Body() body: ProgrammeCertify, @Request() req) {
        return this.programmeService.certify(body, true, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeCertify))
    @Put('revoke')
    async programmeRevoke(@Body() body: ProgrammeRevoke, @Request() req) {
        return this.programmeService.certify(body, false, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(TransferFreezeGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Create, ProgrammeTransferRequest))
    @Post('transferRequest')
    async transferRequest(@Body() body: ProgrammeTransferRequest, @Request() req) {
        return this.programmeService.transferRequest(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(TransferFreezeGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Create, ProgrammeTransferRequest))
    @Post('transferApprove')
    async transferApprove(@Body() body: ProgrammeTransferApprove, @Request() req) {
        return this.programmeService.transferApprove(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(TransferFreezeGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Delete, ProgrammeTransfer))
    @Post('transferReject')
    async transferReject(@Body() body: ProgrammeTransferReject, @Request() req) {
        return this.programmeService.transferReject(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(TransferFreezeGuard, ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Delete, ProgrammeTransfer))
    @Post('transferCancel')
    async transferCancel(@Body() body: ProgrammeTransferCancel, @Request() req) {
        return this.programmeService.transferCancel(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
    @Post('transferQuery')
    queryUser(@Body()query: QueryDto, @Request() req) {
      console.log(req.abilityCondition)
      return this.programmeService.queryProgrammeTransfers(query, req.abilityCondition, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
    @Get('transfersByProgrammeId')
    transfersByProgrammeId(@Query('programmeId') programmeId: string, @Request() req) {
      console.log(req.abilityCondition)
      return this.programmeService.getTransferByProgrammeId(programmeId, req.abilityCondition, req.user)
    }
}