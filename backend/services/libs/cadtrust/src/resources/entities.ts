/**
 * Thin typed wrappers, one per resource.
 *
 * Deliberately the only place duplication is tolerated, and it is one line per
 * resource: `makeResource` in ./crud.ts holds the entire implementation, and each
 * entry below does nothing but bind the real types from ../interfaces to the real
 * path/primary-key from ./registry.ts. If you find yourself writing a fetch call
 * in this file, something has gone wrong.
 */

import { CadTrustContext } from '../config';
import { ResourceClient, makeResource } from './crud';
import { RESOURCES } from './registry';

import type {
  ProgramCreateInput,
  ProgramUpdateInput,
  ProgramRecord,
  ProgramCreateResponse,
  ProgramMutationResponse,
} from '../interfaces/program';
import type {
  MethodologyCreateInput,
  MethodologyUpdateInput,
  MethodologyRecord,
  MethodologyCreateResponse,
  MethodologyMutationResponse,
} from '../interfaces/methodology';
import type {
  StakeholderCreateInput,
  StakeholderUpdateInput,
  StakeholderRecord,
  StakeholderCreateResponse,
  StakeholderMutationResponse,
} from '../interfaces/stakeholder';
import type {
  LabelCreateInput,
  LabelUpdateInput,
  LabelRecord,
  LabelCreateResponse,
  LabelMutationResponse,
} from '../interfaces/label';
import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectRecord,
  ProjectCreateResponse,
  ProjectMutationResponse,
} from '../interfaces/project';
import type {
  ProjectMethodologyCreateInput,
  ProjectMethodologyUpdateInput,
  ProjectMethodologyRecord,
  ProjectMethodologyCreateResponse,
  ProjectMethodologyMutationResponse,
} from '../interfaces/projectMethodology';
import type {
  StakeholderProjectCreateInput,
  StakeholderProjectUpdateInput,
  StakeholderProjectRecord,
  StakeholderProjectCreateResponse,
  StakeholderProjectMutationResponse,
} from '../interfaces/stakeholderProject';
import type {
  ValidationCreateInput,
  ValidationUpdateInput,
  ValidationRecord,
  ValidationCreateResponse,
  ValidationMutationResponse,
} from '../interfaces/validation';
import type {
  VerificationCreateInput,
  VerificationUpdateInput,
  VerificationRecord,
  VerificationCreateResponse,
  VerificationMutationResponse,
} from '../interfaces/verification';
import type {
  LocationCreateInput,
  LocationUpdateInput,
  LocationRecord,
  LocationCreateResponse,
  LocationMutationResponse,
} from '../interfaces/location';
import type {
  EstimationCreateInput,
  EstimationUpdateInput,
  EstimationRecord,
  EstimationCreateResponse,
  EstimationMutationResponse,
} from '../interfaces/estimation';
import type {
  RatingCreateInput,
  RatingUpdateInput,
  RatingRecord,
  RatingCreateResponse,
  RatingMutationResponse,
} from '../interfaces/rating';
import type {
  CoBenefitCreateInput,
  CoBenefitUpdateInput,
  CoBenefitRecord,
  CoBenefitCreateResponse,
  CoBenefitMutationResponse,
} from '../interfaces/coBenefit';
import type {
  IssuanceCreateInput,
  IssuanceUpdateInput,
  IssuanceRecord,
  IssuanceCreateResponse,
  IssuanceMutationResponse,
} from '../interfaces/issuance';
import type {
  UnitCreateInput,
  UnitUpdateInput,
  UnitRecord,
  UnitCreateResponse,
  UnitMutationResponse,
} from '../interfaces/unit';
import type {
  UnitLabelCreateInput,
  UnitLabelUpdateInput,
  UnitLabelRecord,
  UnitLabelCreateResponse,
  UnitLabelMutationResponse,
} from '../interfaces/unitLabel';
import type {
  AefT1SubmissionCreateInput,
  AefT1SubmissionUpdateInput,
  AefT1SubmissionRecord,
  AefT1SubmissionCreateResponse,
  AefT1SubmissionMutationResponse,
} from '../interfaces/aef/aefT1Submission';
import type {
  AefT2AuthorizationsCreateInput,
  AefT2AuthorizationsUpdateInput,
  AefT2AuthorizationsRecord,
  AefT2AuthorizationsCreateResponse,
  AefT2AuthorizationsMutationResponse,
} from '../interfaces/aef/aefT2Authorizations';
import type {
  AefT3ActionsCreateInput,
  AefT3ActionsUpdateInput,
  AefT3ActionsRecord,
  AefT3ActionsCreateResponse,
  AefT3ActionsMutationResponse,
} from '../interfaces/aef/aefT3Actions';
import type {
  AefT4HoldingsCreateInput,
  AefT4HoldingsUpdateInput,
  AefT4HoldingsRecord,
  AefT4HoldingsCreateResponse,
  AefT4HoldingsMutationResponse,
} from '../interfaces/aef/aefT4Holdings';
import type {
  AefT5AuthorizedEntitiesCreateInput,
  AefT5AuthorizedEntitiesUpdateInput,
  AefT5AuthorizedEntitiesRecord,
  AefT5AuthorizedEntitiesCreateResponse,
  AefT5AuthorizedEntitiesMutationResponse,
} from '../interfaces/aef/aefT5AuthorizedEntities';

export interface CadTrustResources {
  program: ResourceClient<
    ProgramCreateInput,
    ProgramUpdateInput,
    ProgramRecord,
    ProgramCreateResponse,
    ProgramMutationResponse
  >;
  methodology: ResourceClient<
    MethodologyCreateInput,
    MethodologyUpdateInput,
    MethodologyRecord,
    MethodologyCreateResponse,
    MethodologyMutationResponse
  >;
  stakeholder: ResourceClient<
    StakeholderCreateInput,
    StakeholderUpdateInput,
    StakeholderRecord,
    StakeholderCreateResponse,
    StakeholderMutationResponse
  >;
  label: ResourceClient<
    LabelCreateInput,
    LabelUpdateInput,
    LabelRecord,
    LabelCreateResponse,
    LabelMutationResponse
  >;
  project: ResourceClient<
    ProjectCreateInput,
    ProjectUpdateInput,
    ProjectRecord,
    ProjectCreateResponse,
    ProjectMutationResponse
  >;
  projectMethodology: ResourceClient<
    ProjectMethodologyCreateInput,
    ProjectMethodologyUpdateInput,
    ProjectMethodologyRecord,
    ProjectMethodologyCreateResponse,
    ProjectMethodologyMutationResponse
  >;
  stakeholderProject: ResourceClient<
    StakeholderProjectCreateInput,
    StakeholderProjectUpdateInput,
    StakeholderProjectRecord,
    StakeholderProjectCreateResponse,
    StakeholderProjectMutationResponse
  >;
  validation: ResourceClient<
    ValidationCreateInput,
    ValidationUpdateInput,
    ValidationRecord,
    ValidationCreateResponse,
    ValidationMutationResponse
  >;
  verification: ResourceClient<
    VerificationCreateInput,
    VerificationUpdateInput,
    VerificationRecord,
    VerificationCreateResponse,
    VerificationMutationResponse
  >;
  location: ResourceClient<
    LocationCreateInput,
    LocationUpdateInput,
    LocationRecord,
    LocationCreateResponse,
    LocationMutationResponse
  >;
  estimation: ResourceClient<
    EstimationCreateInput,
    EstimationUpdateInput,
    EstimationRecord,
    EstimationCreateResponse,
    EstimationMutationResponse
  >;
  rating: ResourceClient<
    RatingCreateInput,
    RatingUpdateInput,
    RatingRecord,
    RatingCreateResponse,
    RatingMutationResponse
  >;
  coBenefit: ResourceClient<
    CoBenefitCreateInput,
    CoBenefitUpdateInput,
    CoBenefitRecord,
    CoBenefitCreateResponse,
    CoBenefitMutationResponse
  >;
  issuance: ResourceClient<
    IssuanceCreateInput,
    IssuanceUpdateInput,
    IssuanceRecord,
    IssuanceCreateResponse,
    IssuanceMutationResponse
  >;
  unit: ResourceClient<
    UnitCreateInput,
    UnitUpdateInput,
    UnitRecord,
    UnitCreateResponse,
    UnitMutationResponse
  >;
  unitLabel: ResourceClient<
    UnitLabelCreateInput,
    UnitLabelUpdateInput,
    UnitLabelRecord,
    UnitLabelCreateResponse,
    UnitLabelMutationResponse
  >;
  aefT1Submission: ResourceClient<
    AefT1SubmissionCreateInput,
    AefT1SubmissionUpdateInput,
    AefT1SubmissionRecord,
    AefT1SubmissionCreateResponse,
    AefT1SubmissionMutationResponse
  >;
  aefT2Authorizations: ResourceClient<
    AefT2AuthorizationsCreateInput,
    AefT2AuthorizationsUpdateInput,
    AefT2AuthorizationsRecord,
    AefT2AuthorizationsCreateResponse,
    AefT2AuthorizationsMutationResponse
  >;
  aefT3Actions: ResourceClient<
    AefT3ActionsCreateInput,
    AefT3ActionsUpdateInput,
    AefT3ActionsRecord,
    AefT3ActionsCreateResponse,
    AefT3ActionsMutationResponse
  >;
  aefT4Holdings: ResourceClient<
    AefT4HoldingsCreateInput,
    AefT4HoldingsUpdateInput,
    AefT4HoldingsRecord,
    AefT4HoldingsCreateResponse,
    AefT4HoldingsMutationResponse
  >;
  aefT5AuthorizedEntities: ResourceClient<
    AefT5AuthorizedEntitiesCreateInput,
    AefT5AuthorizedEntitiesUpdateInput,
    AefT5AuthorizedEntitiesRecord,
    AefT5AuthorizedEntitiesCreateResponse,
    AefT5AuthorizedEntitiesMutationResponse
  >;
}

export function createResources(ctx: CadTrustContext): CadTrustResources {
  return {
    program: makeResource(ctx, RESOURCES.program),
    methodology: makeResource(ctx, RESOURCES.methodology),
    stakeholder: makeResource(ctx, RESOURCES.stakeholder),
    label: makeResource(ctx, RESOURCES.label),
    project: makeResource(ctx, RESOURCES.project),
    projectMethodology: makeResource(ctx, RESOURCES.projectMethodology),
    stakeholderProject: makeResource(ctx, RESOURCES.stakeholderProject),
    validation: makeResource(ctx, RESOURCES.validation),
    verification: makeResource(ctx, RESOURCES.verification),
    location: makeResource(ctx, RESOURCES.location),
    estimation: makeResource(ctx, RESOURCES.estimation),
    rating: makeResource(ctx, RESOURCES.rating),
    coBenefit: makeResource(ctx, RESOURCES.coBenefit),
    issuance: makeResource(ctx, RESOURCES.issuance),
    unit: makeResource(ctx, RESOURCES.unit),
    unitLabel: makeResource(ctx, RESOURCES.unitLabel),
    aefT1Submission: makeResource(ctx, RESOURCES.aefT1Submission),
    aefT2Authorizations: makeResource(ctx, RESOURCES.aefT2Authorizations),
    aefT3Actions: makeResource(ctx, RESOURCES.aefT3Actions),
    aefT4Holdings: makeResource(ctx, RESOURCES.aefT4Holdings),
    aefT5AuthorizedEntities: makeResource(ctx, RESOURCES.aefT5AuthorizedEntities),
  };
}
