import { ControlledValueKey, ControlledValueProvider } from "@app/aef-v2";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { CooperativeApproach } from "../../entities/cooperative.approach.entity";

/**
 * Supplies the one controlled value the library's own defaults cannot know:
 * cooperative approach IDs, which are registry data agreed continuously
 * rather than nomenclature data. Everything else falls through to
 * `defaultControlledValueProvider`'s nomenclature defaults by returning
 * `undefined` — per the library's own docs, "no list known" is not evidence
 * a value is wrong.
 *
 * Warmed once at startup and left to go stale between deploys; a cooperative
 * approach getting its reference number assigned mid-session is rare enough
 * that a restart, not a cache-invalidation scheme, is the acceptable fix.
 */
@Injectable()
export class RegistryControlledValueProvider implements ControlledValueProvider, OnModuleInit {
  private cooperativeApproachIds: readonly string[] = [];

  constructor(
    @InjectRepository(CooperativeApproach)
    private readonly cooperativeApproachRepo: Repository<CooperativeApproach>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const rows = await this.cooperativeApproachRepo.find({
      where: { caReferenceNumber: Not(IsNull()) },
      select: { caReferenceNumber: true },
    });
    this.cooperativeApproachIds = rows
      .map((row) => row.caReferenceNumber)
      .filter((value): value is string => !!value);
  }

  get(key: ControlledValueKey): readonly string[] | undefined {
    if (key !== "cooperativeApproachId") {
      return undefined;
    }
    return this.cooperativeApproachIds;
  }
}
