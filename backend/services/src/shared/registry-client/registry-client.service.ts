import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserDto } from "../dto/user.dto";
import axios from "axios";

@Injectable()
export class RegistryClientService {
  constructor(private configService: ConfigService, private logger: Logger) {}

  private async sendHttp(endpoint: string, data: any) {
    if (!this.configService.get("registry.syncEnable")) {
      this.logger.debug("Company created ignored due to registry sync disable");
      return;
    }

    return await axios
      .post(this.configService.get("registry.endpoint") + endpoint, data, {
        headers: {
          api_key: `${this.configService.get("registry.apiToken")}`,
        },
      })
      .catch((ex) => {
        console.log("Exception", ex.response?.data?.statusCode);
        if (
          ex.response?.data?.statusCode == 400 &&
          ex.response?.data?.message?.indexOf("already exist") >= 0
        ) {
          return true;
        }
        throw ex;
      });
  }

  public async createCompany(userDto: UserDto) {
    const resp = await this.sendHttp("/national/user/add", userDto);
    console.log(
      "Successfully create company on registry",
      userDto.company.name
    );
    return resp;
  }
}
