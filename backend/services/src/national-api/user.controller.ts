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
import { Action } from "../shared/casl/action.enum";
import {
  AppAbility,
  CaslAbilityFactory,
} from "../shared/casl/casl-ability.factory";
import { CheckPolicies } from "../shared/casl/policy.decorator";
import { PoliciesGuard, PoliciesGuardEx } from "../shared/casl/policy.guard";
import { User } from "../shared/entities/user.entity";
import { UserDto } from "../shared/dto/user.dto";
import { UserService } from "../shared/user/user.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { QueryDto } from "../shared/dto/query.dto";
import { UserUpdateDto } from "../shared/dto/user.update.dto";
import { PasswordUpdateDto } from "../shared/dto/password.update.dto";
import { Role } from "../shared/casl/role.enum";
import { JwtAuthGuard } from "../shared/auth/guards/jwt-auth.guard";
import { HelperService } from "../shared/util/helpers.service";

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability, body) =>
    ability.can(Action.Create, Object.assign(new User(), body))
  )
  @Post("add")
  addUser(@Body() user: UserDto, @Request() req) {
    if (user.role == Role.Root) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.rootCreatesRoot", []),
        HttpStatus.FORBIDDEN
      );
    }
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.userService.create(
      user,
      req.user.companyId,
      req.user.companyRole
    );
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
    console.log(req.abilityCondition);
    return this.userService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Delete, User))
  @Delete("delete")
  deleteUser(@Query("userId") userId: number, @Request() req) {
    return this.userService.delete(userId, req.abilityCondition);
  }
}
