import { Body, Controller, Get, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Programme } from '../shared/entities/programme.entity';
import { Action } from '../shared/casl/action.enum';
import { AppAbility } from '../shared/casl/casl-ability.factory';
import { CheckPolicies } from '../shared/casl/policy.decorator';
import { PoliciesGuard, PoliciesGuardEx } from '../shared/casl/policy.guard';
import { ProgrammeDto } from '../shared/dto/programme.dto';
import { ProgrammeService } from '../shared/programme/programme.service';
import { QueryDto } from '../shared/dto/query.dto';
import { ConstantUpdateDto } from '../shared/dto/constants.update.dto';
import { ProgrammeStage } from '../shared/enum/programme-status.enum';
import { ProgrammeApprove } from '../shared/dto/programme.approve';
import { ProgrammeReject } from '../shared/dto/programme.reject';
import { ProgrammeRetire } from '../shared/dto/programme.retire';
import { ApiKeyJwtAuthGuard } from '../shared/auth/guards/api-jwt-key.guard';
import { ProgrammeTransferRequest } from '../shared/dto/programme.transfer.request';
import { ProgrammeTransfer } from '../shared/entities/programme.transfer';
import { ProgrammeTransferApprove } from '../shared/dto/programme.transfer.approve';
import { ProgrammeTransferReject } from '../shared/dto/programme.transfer.reject';
import { JwtAuthGuard } from '../shared/auth/guards/jwt-auth.guard';
import { ProgrammeCertify } from '../shared/dto/programme.certify';
import { ProgrammeTransferCancel } from '../shared/dto/programme.transfer.cancel';
import { ProgrammeIssue } from '../shared/dto/programme.issue';

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
        return this.programmeService.getProgrammeEvents(programmeId, req.user.companyId)
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
        return this.programmeService.approveProgramme(body, `${req.user.id}#${req.user.name}`)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('issue')
    async programmeIssue(@Body() body: ProgrammeIssue, @Request() req) {
        return this.programmeService.issueProgrammeCredit(body, `${req.user.id}#${req.user.name}`)
    }


    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('reject')
    async programmeReject(@Body() body: ProgrammeReject, @Request() req) {
        return this.programmeService.rejectProgramme(body, `${req.user.id}#${req.user.name}`)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, Programme))
    @Put('retire')
    async programmeRetire(@Body() body: ProgrammeRetire, @Request() req) {
        return this.programmeService.retireProgramme(body, `${req.user.id}#${req.user.name}`)
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
    async programmeRevoke(@Body() body: ProgrammeCertify, @Request() req) {
        return this.programmeService.certify(body, false, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Create, ProgrammeTransfer))
    @Post('transferRequest')
    async transferRequest(@Body() body: ProgrammeTransferRequest, @Request() req) {
        return this.programmeService.transferRequest(body, req.user)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeTransfer))
    @Post('transferApprove')
    async transferApprove(@Body() body: ProgrammeTransferApprove, @Request() req) {
        return this.programmeService.transferApprove(body, req.user.companyId)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeTransfer))
    @Post('transferReject')
    async transferReject(@Body() body: ProgrammeTransferReject, @Request() req) {
        return this.programmeService.transferReject(body, req.user.companyId)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Update, ProgrammeTransfer))
    @Post('transferCancel')
    async transferCancel(@Body() body: ProgrammeTransferCancel, @Request() req) {
        return this.programmeService.transferCancel(body, req.user.companyId)
    }

    @ApiBearerAuth()
    @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, ProgrammeTransfer, true))
    @Post('transferQuery')
    queryUser(@Body()query: QueryDto, @Request() req) {
      console.log(req.abilityCondition)
      return this.programmeService.queryProgrammeTransfers(query, req.abilityCondition)
    }
}
