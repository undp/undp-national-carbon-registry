import { LocationCreateInput } from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CadTrustPicklistService } from "../cadtrust-picklist.service";
import { PICKLIST_KEYS } from "./picklist.map";

/** Max length CAD Trust documents for `locationGis`. */
const LOCATION_GIS_MAX_LENGTH = 10000;

/**
 * The INF document's jsonb content -> CAD Trust `LocationCreateInput`.
 *
 * `ProjectCreateDto` and `ProjectEntity` have no location fields at all. The
 * frontend's INF form (`ProgrammeCreationComponent.tsx`) sends `province`,
 * `district`, `city`, `postalCode`, `street` and `geographicalLocationCoordinates`
 * as undeclared extras that survive validation and land only in
 * `document_entity.content` — the same escape hatch `CadTrustProjectMapper`
 * already uses for `projectDescription`.
 *
 * ## Known frontend landmine — deliberately not filtered here
 *
 * The INF form falls back to the literal string `"test"` for `province` /
 * `district` / `city` when those fields are empty (`ProgrammeCreationComponent.tsx:436-438`).
 * That means CAD Trust can genuinely receive `locationRegion: "test"`. This is
 * an upstream data-quality bug in the form, not a mapping decision — this
 * mapper passes through whatever `document_entity.content` holds. Filtering it
 * out here would hide the real bug rather than fix it.
 *
 * ## Only one Location record per project
 *
 * CAD Trust's own docs note a project can have multiple locations, and this
 * registry's `projectGeography: "MULTIPLE"` flag hints at multi-site projects
 * — but the INF form only ever captures one province/district/city/coordinate
 * set regardless of that flag, so there is only ever one Location record to
 * stage. Decomposing a multi-polygon coordinate shape into several Location
 * rows is a real future enhancement, not something guessed at here.
 */
@Injectable()
export class CadTrustLocationMapper {
  constructor(
    private readonly configService: ConfigService,
    private readonly picklistService: CadTrustPicklistService,
    private readonly logger: Logger
  ) {}

  /** Returns undefined — not an error — when the INF has no location data at all. */
  async toCreateInput(
    cadTrustProjectId: string,
    infContent?: any
  ): Promise<LocationCreateInput | undefined> {
    const province = typeof infContent?.province === "string" ? infContent.province.trim() : undefined;
    const coordinates = infContent?.geographicalLocationCoordinates;
    const hasCoordinates = Array.isArray(coordinates) && coordinates.length > 0;

    if (!province && !hasCoordinates) {
      return undefined;
    }

    const country = this.countryName();
    await this.picklistService.warnOnUnknownValues(PICKLIST_KEYS.locationCountry, [country]);

    const input: LocationCreateInput = {
      cadTrustProjectId,
      locationCountry: country,
    };

    if (province) {
      input.locationRegion = province;
    }

    if (hasCoordinates) {
      const serialized = JSON.stringify(coordinates);
      if (serialized.length > LOCATION_GIS_MAX_LENGTH) {
        // A truncated JSON blob would be invalid data — worse than none.
        this.logger.warn(
          `CAD Trust location GIS data for project ${cadTrustProjectId} is ` +
            `${serialized.length} characters, over the documented ${LOCATION_GIS_MAX_LENGTH}-character ` +
            `limit for locationGis; omitting it rather than sending truncated (invalid) JSON.`
        );
      } else {
        input.locationGis = serialized;
      }
    }

    return input;
  }

  private countryName(): string {
    return this.configService.get<string>("systemCountryName");
  }
}
