import { Injectable } from "@nestjs/common";
import { LocationDataType } from "src/enum/locationDataType.enum";

@Injectable()
export abstract class LocationInterface {

  public abstract init(data: any, locationDataType: LocationDataType): Promise<void>;
  public abstract getCoordinatesForRegion(regions: string[]): Promise<number[][]>;
}
