import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "./filehandler.interface";
import { encodeStorageKey } from "./storage-key";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class S3FileHandlerService implements FileHandlerInterface {

  private client = new S3Client({})
  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {}
  
  public async uploadFile(path: string, content: string): Promise<string> {
    const imgBuffer = Buffer.from(content, "base64");
    // var uploadParams = {
    //   Bucket: this.configService.get<string>("s3CommonBucket.name"),
    //   Key: "",
    //   Body: imgBuffer,
    //   ContentEncoding: "base64",
    //   ContentType: "image/png",
    // };
    
    const putCommand = new PutObjectCommand({
      Bucket: this.configService.get<string>("s3CommonBucket.name"),
      Key: path,
      Body: imgBuffer,
      ContentEncoding: "base64",
      //ContentType: "image/png",
    })
    const resp = await this.client.send(putCommand)

    return path;
  }


  public async getUrl(key: string): Promise<string> {
    const bucket = this.configService.get<string>("s3CommonBucket.name");
    return `https://${bucket}.s3.amazonaws.com/${encodeStorageKey(key)}`;
  }
  
}