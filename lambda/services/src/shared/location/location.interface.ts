import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class LocationInterface {

  public abstract getCoordinatesForRegion(regions: string[]): Promise<number[][]>;
}
