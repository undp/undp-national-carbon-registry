import { EntitySubject } from "../entities/entity.subject";

// CASL subject marker for AEF V2 reporting (@app/aef-v2), following the
// `Stat` precedent: the AEF tables live in a portable library that cannot
// import EntitySubject (that would be an @app/shared import inside
// @app/aef-v2 — forbidden by libs/aef-v2/src/portability.spec.ts), so
// authorization is gated on this registry-side marker instead of the
// library's own entities.
export class AefReport extends EntitySubject {}
