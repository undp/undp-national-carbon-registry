import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Query,
  Req,
  HttpException,
  HttpStatus,
  Delete,
  Put,
} from "@nestjs/common";

import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiKeyJwtAuthGuard } from "../auth/guards/api-jwt-key.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Action } from "../casl/action.enum";
import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { CheckPolicies } from "../casl/policy.decorator";
import { PoliciesGuard, PoliciesGuardEx } from "../casl/policy.guard";
import { Role } from "../casl/role.enum";
import { DataExportQueryDto } from "../dto/data.export.query.dto";
import { PasswordUpdateDto } from "../dto/password.update.dto";
import { QueryDto } from "../dto/query.dto";
import { UserDto } from "../dto/user.dto";
import { UserUpdateDto } from "../dto/user.update.dto";
import { User } from "../entities/user.entity";
import { UserService } from "../user/user.service";
import { HelperService } from "../util/helpers.service";

@ApiTags("User")
@ApiBearerAuth()
@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private caslAbilityFactory: CaslAbilityFactory,
    private helperService: HelperService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req) {
    return await this.userService.getUserProfileDetails(req.user.id);
  }

  @ApiBearerAuth("api_key")
  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability, body) => ability.can(Action.Create, Object.assign(new User(), body)))
  @Post("add")
  addUser(@Body() user: UserDto, @Request() req) {
    if (user.role == Role.Root) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.rootCreatesRoot", []),
        HttpStatus.FORBIDDEN
      );
    }
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.create(user, req.user.companyId, req.user.companyRole);
  }

  @Post("register")
  registerUser(@Body() user: UserDto, @Request() req) {
    if (user.role == Role.Root) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.rootCreatesRoot", []),
        HttpStatus.FORBIDDEN
      );
    }
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.create(user, null, user.company.companyRole, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, User))
  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("update")
  updateUser(@Body() user: UserUpdateDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.update(user, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, User, true))
  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("resetPassword")
  resetPassword(@Body() reset: PasswordUpdateDto, @Request() req) {
    return this.userService.resetPassword(req.user.id, reset, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, User, true))
  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("regenerateApiKey")
  resetApiKey(@Query("email") email: string, @Request() req) {
    return this.userService.regenerateApiKey(email, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("query")
  queryUser(@Body() query: QueryDto, @Request() req) {
    return this.userService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  // @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, User, true))
  @Post("download")
  async getDownload(@Body() query: DataExportQueryDto, @Request() req) {
    try {
      return this.userService.download(query, req.abilityCondition); // Return the filePath as a JSON response
    } catch (err) {
      return { error: "Error generating the CSV file." };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, User))
  @Delete("delete")
  deleteUser(@Query("userId") userId: number, @Request() req) {
    return this.userService.delete(userId, req.abilityCondition);
  }
}
