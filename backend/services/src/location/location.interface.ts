import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class LocationInterface {

  public abstract init(data: any): Promise<void>;
  public abstract getCoordinatesForRegion(regions: string[]): Promise<number[][]>;
}
