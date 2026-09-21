import { AefTableName } from '../../tables';
import { AefV2T1SubmissionEntity } from './aef-v2-t1-submission.entity';
import { AefV2T2AuthorizationsEntity } from './aef-v2-t2-authorizations.entity';
import { AefV2T3ActionsEntity } from './aef-v2-t3-actions.entity';
import { AefV2T4HoldingsEntity } from './aef-v2-t4-holdings.entity';
import { AefV2T5AuthorizedEntitiesEntity } from './aef-v2-t5-authorized-entities.entity';

export * from './aef-v2-t1-submission.entity';
export * from './aef-v2-t2-authorizations.entity';
export * from './aef-v2-t3-actions.entity';
export * from './aef-v2-t4-holdings.entity';
export * from './aef-v2-t5-authorized-entities.entity';

/** Pass to `TypeOrmModule.forFeature`. */
export const AEF_V2_ENTITIES = [
  AefV2T1SubmissionEntity,
  AefV2T2AuthorizationsEntity,
  AefV2T3ActionsEntity,
  AefV2T4HoldingsEntity,
  AefV2T5AuthorizedEntitiesEntity,
];

export const AEF_ENTITY_BY_TABLE: Readonly<Record<AefTableName, (typeof AEF_V2_ENTITIES)[number]>> = {
  t1Submission: AefV2T1SubmissionEntity,
  t2Authorizations: AefV2T2AuthorizationsEntity,
  t3Actions: AefV2T3ActionsEntity,
  t4Holdings: AefV2T4HoldingsEntity,
  t5AuthorizedEntities: AefV2T5AuthorizedEntitiesEntity,
};

export const AEF_TABLE_BY_NAME: Readonly<Record<AefTableName, string>> = {
  t1Submission: 'aef_v2_t1_submission',
  t2Authorizations: 'aef_v2_t2_authorizations',
  t3Actions: 'aef_v2_t3_actions',
  t4Holdings: 'aef_v2_t4_holdings',
  t5AuthorizedEntities: 'aef_v2_t5_authorized_entities',
};
