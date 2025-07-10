import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export abstract class LedgerReplicatorInterface {
  abstract replicate(event): Promise<any>;
}
