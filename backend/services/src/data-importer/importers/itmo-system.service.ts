import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ImporterInterface } from "../importer.interface";

@Injectable()
export class ITMOSystemImporter implements ImporterInterface{
  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {}

  async start(type: string): Promise<any> {
    await axios
        .get(url)
  }
}
