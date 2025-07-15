import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Query,
  Delete,
  Put,
} from "@nestjs/common";

import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiKeyJwtAuthGuard } from "@app/shared/auth/guards/api-jwt-key.guard";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { CaslAbilityFactory } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard, PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { DataExportQueryDto } from "@app/shared/dto/data.export.query.dto";
import { PasswordUpdateDto } from "@app/shared/dto/password.update.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { UserDto } from "@app/shared/dto/user.dto";
import { UserUpdateDto } from "@app/shared/dto/user.update.dto";
import { User } from "@app/shared/entities/user.entity";
import { UserService } from "@app/shared/user/user.service";
import { HelperService } from "@app/shared/util/helpers.service";

@ApiTags("User")
@ApiBearerAuth()
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req) {
    return await this.userService.getUserProfileDetails(req.user.id, true);
  }

  @ApiBearerAuth("api_key")
  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability, body) =>
    ability.can(Action.Create, Object.assign(new User(), body))
  )
  @Post("add")
  addUser(@Body() user: UserDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.create(
      user,
      req.user.companyId,
      req.user.companyRole,
      false,
      req.user.role
    );
  }

  @Post("register")
  registerUser(@Body() user: UserDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.create(user, null, user.company?.companyRole, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, User))
  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("update")
  updateUser(@Body() user: UserUpdateDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.update(user, req.abilityCondition, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, User, true))
  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("resetPassword")
  resetPassword(@Body() reset: PasswordUpdateDto, @Request() req) {
    return this.userService.resetPassword(
      req.user.id,
      reset,
      req.abilityCondition
    );
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
    return this.userService.query(query, req.abilityCondition, req.user);
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
    return this.userService.delete(userId, req.abilityCondition, req.user);
  }
}
