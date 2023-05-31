import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from "@casl/ability";
import { Injectable, ForbiddenException } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { Action } from "./action.enum";
import { Role } from "./role.enum";
import { EntitySubject } from "../entities/entity.subject";
import { Programme } from "../entities/programme.entity";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { Company } from "../entities/company.entity";
import { Stat } from "../dto/stat.dto";
import { StatType } from "../enum/stat.type.enum";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { ProgrammeCertify } from "../dto/programme.certify";
import { TransferStatus } from "../enum/transform.status.enum";
import { ProgrammeTransferRequest } from "../dto/programme.transfer.request";
import { ConfigurationSettings } from "../entities/configuration.settings";

type Subjects = InferSubjects<typeof EntitySubject> | "all";

export type AppAbility = MongoAbility<[Action, Subjects]>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

const unAuthErrorMessage = "This action is unauthorised";

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    console.log("createForUser", user);
    const { can, cannot, build } = new AbilityBuilder(createAppAbility);
    if (user) {
      if (user.role == Role.Root) {
        can(Action.Manage, "all");
        cannot([Action.Update], Company, {
          companyId: { $ne: user.companyId },
        });
        cannot([Action.Update], User, {
          companyId: { $ne: user.companyId },
        });
      } else if (
        user.role == Role.Admin &&
        user.companyRole == CompanyRole.GOVERNMENT
      ) {
        can(Action.Manage, User, { role: { $ne: Role.Root } });
        can([Action.Manage], ConfigurationSettings);
        can([Action.Manage], Company);
        cannot([Action.Update, Action.Delete], User, {
          companyId: { $ne: user.companyId },
        });
        cannot(Action.Update, Company, { companyId: { $ne: user.companyId } });
      } else if (
        user.role == Role.Admin &&
        user.companyRole != CompanyRole.GOVERNMENT
      ) {
        can(Action.Manage, User, { role: { $ne: Role.Root } });
        can(Action.Read, Company);
        can(Action.Update, Company, { companyId: { $eq: user.companyId } });
        cannot([Action.Update, Action.Delete, Action.Read], User, {
          companyId: { $ne: user.companyId },
        });
        cannot([Action.Create], Company);
      } else {
        if (user.companyRole == CompanyRole.GOVERNMENT) {
          can(Action.Read, User);
          if (user.role === Role.Manager) {
            can([Action.Delete], Company);
          }
        } else {
          can(Action.Read, User, { companyId: { $eq: user.companyId } });
        }

        cannot([Action.Create], Company);
        cannot(Action.Create, User);
      }

      can(Action.Read, Company);
      can(Action.Update, User, { id: { $eq: user.id } });
      can(Action.Delete, User, { id: { $eq: user.id } });
      cannot(
        Action.Update,
        User,
        ["role", "apiKey", "password", "companyRole", "email"],
        { id: { $eq: user.id } }
      );

      if (user.companyRole == CompanyRole.GOVERNMENT) {
        if (user.role != Role.ViewOnly) {
          can(Action.Manage, ProgrammeTransfer);
          can(Action.Manage, Programme);
          can(Action.Manage, ProgrammeTransferRequest);
        } else {
          can(Action.Read, ProgrammeTransfer);
          can(Action.Read, Programme);
        }
      }

      if (
        user.role != Role.ViewOnly &&
        user.companyRole != CompanyRole.PROGRAMME_DEVELOPER
      ) {
        can(Action.Manage, ProgrammeCertify);
      }

      if (user.role == Role.Admin && user.companyRole == CompanyRole.MRV) {
        can([Action.Create, Action.Read], Programme);
      } else if (user.companyRole == CompanyRole.CERTIFIER) {
        can(Action.Read, Programme, {
          currentStage: { $in: [ProgrammeStage.AUTHORISED] },
        });
        can(Action.Read, Programme, {
          certifierId: { $elemMatch: { $eq: user.companyId } },
        });
        can(Action.Read, ProgrammeTransfer, {
          status: { $in: [TransferStatus.APPROVED, TransferStatus.RECOGNISED] },
        });
      } else if (user.companyRole == CompanyRole.PROGRAMME_DEVELOPER) {
        can(Action.Read, Programme, {
          currentStage: { $eq: ProgrammeStage.AUTHORISED },
        });
        can(Action.Read, ProgrammeTransfer, {
          status: { $in: [TransferStatus.APPROVED, TransferStatus.RECOGNISED] },
        });
        if (user.role != Role.ViewOnly) {
          can(Action.Manage, Programme, {
            companyId: { $elemMatch: { $eq: user.companyId } },
          });
          can(Action.Manage, ProgrammeTransfer, {
            toCompanyId: { $eq: user.companyId },
          });
          can(Action.Manage, ProgrammeTransfer, {
            fromCompanyId: { $eq: user.companyId },
          });
          can(Action.Manage, ProgrammeTransfer, {
            initiatorCompanyId: { $eq: user.companyId },
          });
          can(Action.Manage, ProgrammeTransferRequest);
        } else {
          can(Action.Read, Programme, {
            companyId: { $elemMatch: { $eq: user.companyId } },
          });
          can(Action.Read, ProgrammeTransfer, {
            toCompanyId: { $eq: user.companyId },
          });
          can(Action.Read, ProgrammeTransfer, {
            fromCompanyId: { $eq: user.companyId },
          });
          can(Action.Read, ProgrammeTransfer, {
            initiatorCompanyId: { $eq: user.companyId },
          });
        }
      }

      if (user.companyRole == CompanyRole.CERTIFIER) {
        can(Action.Read, Stat);
      } else {
        can(Action.Read, Stat);
      }

      cannot([Action.Delete], Company, {
        companyRole: { $eq: CompanyRole.GOVERNMENT },
      });

      if (user.companyState === 0) {
        cannot(Action.Create, "all");
        cannot(Action.Delete, "all");
        cannot(Action.Update, User, { id: { $ne: user.id } });
        cannot(Action.Update, Programme);
        cannot(Action.Update, Company);
      }
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
