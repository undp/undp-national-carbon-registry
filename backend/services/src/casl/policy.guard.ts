import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { plainToClass } from "class-transformer";
import { Stat } from "../dto/stat.dto";
import { EntitySubject } from "../entities/entity.subject";
import { User } from "../entities/user.entity";
import { Action } from "./action.enum";
import { CaslAbilityFactory, AppAbility } from "./casl-ability.factory";
import { CHECK_POLICIES_KEY } from "./policy.decorator";
import { PolicyHandler } from "./policy.handler";
import { HelperService } from "../util/helpers.service";
const { rulesToQuery } = require("@casl/ability/extra");

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    public reflector: Reflector,
    public caslAbilityFactory: CaslAbilityFactory,
    public helperService: HelperService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler()
      ) || [];

    const { user, body } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    const pHandlers = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability, body)
    );
    if (pHandlers) {
      return pHandlers;
    } else {
      throw new ForbiddenException(
        this.helperService.formatReqMessagesString("user.userUnAUth", [])
      );
    }
  }

  public execPolicyHandler(
    handler: PolicyHandler,
    ability: AppAbility,
    body: any
  ) {
    if (typeof handler === "function") {
      return handler(ability, body);
    }
    return handler.handle(ability, body);
  }
}

export const PoliciesGuardEx = (
  injectQuery: boolean,
  action?: Action,
  subject?: typeof EntitySubject,
  onlyInject?: boolean,
  dropArrayFields?: boolean
) => {
  @Injectable()
  class PoliciesGuardMixin implements CanActivate {
    constructor(
      public reflector: Reflector,
      public caslAbilityFactory: CaslAbilityFactory,
      public helperService: HelperService
    ) {}

    parseMongoQueryToSQL(mongoQuery, isNot = false, key = undefined) {
      let final = undefined;
      for (let operator in mongoQuery) {
        if (operator.startsWith("$")) {
          if (operator == "$and" || operator == "$or") {
            const val = mongoQuery[operator].map(st => this.parseMongoQueryToSQL(st)).join(` ${operator.replace("$", '')} `)
            final = final == undefined ? val : `${final} and ${val}`
          } else if (operator == "$not") {
            return this.parseMongoQueryToSQL(mongoQuery["$not"], !isNot)
          } else if (operator == "$eq") {
            const value = (typeof mongoQuery["$eq"] === "number") ? String(mongoQuery["$eq"]) : `'${mongoQuery["$eq"]}'`
            return `"${key}" ${isNot ? "!=" : "="} ${value}`
          } else if (operator == "$ne") {
            const value = (typeof mongoQuery["$ne"] === "number") ? String(mongoQuery["$ne"]) : `'${mongoQuery["$ne"]}'`
            return `"${key}" ${isNot ? "=" : "!="} ${value}`
          }
        } else {
          return this.parseMongoQueryToSQL(mongoQuery[operator], isNot, operator)
        }
      }
      return final;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const policyHandlers =
        this.reflector.get<PolicyHandler[]>(
          CHECK_POLICIES_KEY,
          context.getHandler()
        ) || [];

      const { user, body } = context.switchToHttp().getRequest();
      const ability = this.caslAbilityFactory.createForUser(user);

      if (injectQuery) {
        context.switchToHttp().getRequest()['ability'] = ability;

        const mongoQuery = JSON.stringify(rulesToQuery(ability, action, subject, rule => {
          return rule.inverted ? { $not: rule.conditions } : rule.conditions
        }))
        console.log(JSON.stringify(mongoQuery))

        if (mongoQuery && mongoQuery != "" && mongoQuery != "{}" && mongoQuery != '{"$or":[{}]}') {
          // const whereQuery = this.parseMongoQueryToSQL(JSON.parse(mongoQuery));
          // console.log("Where", whereQuery)
          context.switchToHttp().getRequest()['abilityCondition'] = JSON.parse(mongoQuery);
        }
      }

      if (dropArrayFields) {
        const obj = Object.assign(new subject(), body);
        let abilityCan: boolean = true;
        for (const key in obj) {
          const possible = [];
          if (obj[key] instanceof Array) {
            // console.log(obj[key]);
            for (const en of obj[key]) {
              for (const key2 in en) {
                // console.log(action, en, key2);
                if (ability.can(action, plainToClass(Stat, en), key2)) {
                  possible.push(en);
                }
              }
            }
            obj[key] = possible;
            context.switchToHttp().getRequest()["body"] = obj;
            abilityCan = possible.length > 0;
            if (abilityCan) {
              return abilityCan;
            } else {
              throw new ForbiddenException(
                this.helperService.formatReqMessagesString(
                  "user.userUnAUth",
                  []
                )
              );
            }
          }
        }
      }

      if (policyHandlers.length == 0 && action && subject && !onlyInject) {
        const obj = Object.assign(new subject(), body);
        let abilityCan: boolean = true;
        // console.log(obj);
        if (action == Action.Update) {
          if (obj instanceof User && obj.companyId == undefined) {
            obj.companyId = user.companyId;
          }
          for (const key in obj) {
            if (!ability.can(action, obj, key)) {
              console.log(
                "Failed due to",
                JSON.stringify(ability),
                action,
                obj,
                key
              );
              abilityCan = false;
            }
          }
        } else if (action == Action.Delete) {
          abilityCan = ability.can(action, subject);
        } else {
          abilityCan = ability.can(action, obj);
        }
        if (abilityCan) {
          return abilityCan;
        } else {
          throw new ForbiddenException(
            this.helperService.formatReqMessagesString("user.userUnAUth", [])
          );
        }
      }

      const pHandler = policyHandlers.every((handler) =>
        this.execPolicyHandler(handler, ability, body)
      );
      if (pHandler) {
        return pHandler;
      } else {
        throw new ForbiddenException(
          this.helperService.formatReqMessagesString("user.userUnAUth", [])
        );
      }
    }

    public execPolicyHandler(
      handler: PolicyHandler,
      ability: AppAbility,
      body: any
    ) {
      if (typeof handler === "function") {
        return handler(ability, body);
      }
      return handler.handle(ability, body);
    }
  }

  const guard = mixin(PoliciesGuardMixin);
  return guard;
};
