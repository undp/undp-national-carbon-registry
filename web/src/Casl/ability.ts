import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { EntitySubject } from './entities/EntitySubject';
import { User } from './entities/User';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type Subjects = InferSubjects<typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export const defineAbility = () => {
  const { build } = new AbilityBuilder(createAppAbility);

  return build({
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
  });
};
