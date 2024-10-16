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
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action } from "src/casl/action.enum";
import { AppAbility } from "src/casl/casl-ability.factory";
import { CheckPolicies } from "src/casl/policy.decorator";
import { PoliciesGuard, PoliciesGuardEx } from "src/casl/policy.guard";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { ProgrammeSlService } from "../programme-sl/programme-sl.service";
import { ProgrammeSlDto } from "../dto/programmeSl.dto";
import { CMADto } from "src/dto/cma.dto";
import { GetDocDto } from "src/dto/getDoc.dto";
import { QueryDto } from "src/dto/query.dto";

@ApiTags("ProgrammeSl")
@ApiBearerAuth()
@Controller("programmeSl")
export class ProgrammeSlController {
  constructor(private programmeService: ProgrammeSlService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, ProgrammeSl)
  )
  @Post("create")
  async addProgramme(@Body() programme: ProgrammeSlDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.create(programme, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectById")
  async getProjectById(@Body("programmeId") programmeId: string) {
    return this.programmeService.getProjectById(programmeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProgrammeSl))
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.programmeService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Create, ProgrammeSl)
  )
  @Post("createCMA")
  async createCMA(@Body() cmaDto: CMADto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.createCMA(cmaDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProgrammeSl))
  @Post("getDocs")
  async getDocs(@Body() getDocDto: GetDocDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.programmeService.getDocs(getDocDto, req.user);
  }
}
