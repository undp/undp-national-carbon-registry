import { AefStore } from "@app/aef-v2";
import { AefTypeOrmStore } from "@app/aef-v2/typeorm";
import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";

// AefV2Module provides AEF_STORE from the root EntityManager, so writes
// through it run outside a caller's own transaction. The replicator commits
// each ledger event in `entityManager.transaction(async (em) => ...)`
// (process.event.service.ts) and this registry's AEF V2 write path must
// participate in that same transaction — otherwise a ledger row and its AEF
// row could commit independently, and a rollback of one would not roll back
// the other. `forManager(em)` is how a caller opts into that; `forManager()`
// with no argument is for read/export paths that have no ambient transaction.
@Injectable()
export class AefStoreFactory {
  constructor(@InjectEntityManager() private readonly root: EntityManager) {}

  forManager(em?: EntityManager): AefStore {
    return new AefTypeOrmStore(em ?? this.root);
  }
}
