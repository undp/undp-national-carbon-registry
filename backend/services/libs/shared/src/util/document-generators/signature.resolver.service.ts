import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { ConfigurationSettings } from "../../entities/configuration.settings";
import { ConfigurationSettingsType } from "../../enum/configuration.settings.type.enum";
import { FileHandlerInterface } from "../../file-handler/filehandler.interface";
import { resolveStoredFile } from "../../file-handler/storage-key";
const fs = require("fs");

/**
 * Resolves the CEO / chairman signature images the certificate generators stamp
 * onto their PDFs.
 *
 * Signatures are uploaded through `FileHandlerInterface`, so under any remote
 * backend they are not on the container's disk. Reads the stored reference, with
 * the old `public/signatures/*.jpg` path kept as a fallback for signatures
 * uploaded before that was true.
 */
@Injectable()
export class SignatureResolverService {
  constructor(
    @InjectRepository(ConfigurationSettings)
    private configSettingsRepo: Repository<ConfigurationSettings>,
    private fileHandler: FileHandlerInterface,
    private logger: Logger
  ) {}

  public async getChairmanSignature(): Promise<Buffer | undefined> {
    return this.resolve(
      ConfigurationSettingsType.chairmanSign,
      "public/signatures/chairman.jpg"
    );
  }

  public async getCeoSignature(): Promise<Buffer | undefined> {
    return this.resolve(
      ConfigurationSettingsType.ceoSign,
      "public/signatures/ceo.jpg"
    );
  }

  private async resolve(
    type: ConfigurationSettingsType,
    localPath: string
  ): Promise<Buffer | undefined> {
    const setting = await this.configSettingsRepo
      .findOneBy({ id: type })
      .catch((err) => {
        this.logger.error(
          `Failed to read signature setting ${ConfigurationSettingsType[type]}`,
          err
        );
        return undefined;
      });

    const stored = setting?.settingValue;
    if (stored && typeof stored === "string") {
      // Runs outside the request pipeline, so the response interceptor that
      // resolves keys elsewhere does not apply here.
      const url = await resolveStoredFile(this.fileHandler, stored);

      try {
        // Bounded so a hanging endpoint falls through to the local copy rather
        // than stalling certificate generation.
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        return Buffer.from(response.data);
      } catch (err) {
        this.logger.error(`Failed to fetch signature image from ${url}`, err);
        // fall through to the local copy
      }
    }

    return this.localFallback(localPath, type);
  }

  private localFallback(
    localPath: string,
    type: ConfigurationSettingsType
  ): Buffer | undefined {
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    // Certificates have always rendered without a signature rather than failing
    // outright when one is missing; keep that, but make it visible.
    this.logger.error(
      `No signature available for ${ConfigurationSettingsType[type]} - checked the stored setting and ${localPath}. The certificate will be generated unsigned.`
    );
    return undefined;
  }
}
