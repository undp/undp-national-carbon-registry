import { AefT5AuthorizedEntitiesCreateInput } from "@app/aef-v2";

import { CaAuthorizedEntity } from "../../entities/ca.authorized.entity.entity";
import { AUTHORIZED_ENTITY_CHANGE_CONDITIONS_LABEL, NOT_APPLICABLE } from "./aef-code.maps";

// CaAuthorizedEntity was modelled on AEF Table 5 to begin with, so this map
// is close to 1:1. Country resolution (alpha-2 -> alpha-3) is async and is
// therefore the caller's job, same reasoning as the block mapper.
export function mapCaAuthorizedEntityToAef(
  entity: CaAuthorizedEntity,
  caReferenceNumber: string | undefined,
  incorporationCountryAlpha3: string | undefined,
  authorizationDateDdMmYyyy: string | undefined
): AefT5AuthorizedEntitiesCreateInput {
  return {
    aefT5AuthorizedEntitiesAuthorizationDate: authorizationDateDdMmYyyy,
    aefT5AuthorizedEntitiesName: entity.entityName,
    aefT5AuthorizedEntitiesIncorporationCountry: incorporationCountryAlpha3,
    // entityIdentifier is nullable in this registry but required by AEF;
    // falling back to the row's own id keeps every entity exportable, at the
    // cost of a value CARP did not assign — flag if this proves wrong.
    aefT5AuthorizedEntitiesId: entity.entityIdentifier ?? entity.id,
    aefT5AuthorizedEntitiesCooperativeApproachId: caReferenceNumber,
    // The entity's current status. Written at whatever instant this mapper
    // runs — a real-time write records it as of that action, and the
    // year-end snapshot's reconciliation (snapshotAuthorizedEntitiesForYear)
    // re-runs this same mapper and updates the row in place, so a status
    // change later in the year is picked up before the row is frozen.
    aefT5AuthorizedEntitiesConditions: entity.status,
    aefT5AuthorizedEntitiesChangeConditions: AUTHORIZED_ENTITY_CHANGE_CONDITIONS_LABEL,
    // This registry has nothing further to add beyond the other Table 5
    // fields — aefT5AuthorizedEntitiesConditions above already carries the
    // entity's raw status (e.g. a deactivation), so nothing is lost by not
    // repeating it here.
    aefT5AuthorizedEntitiesAdditionalInformation: NOT_APPLICABLE,
  };
}
