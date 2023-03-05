import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "./filehandler.interface";
var AWS = require("aws-sdk");
const s3 = new AWS.S3();

@Injectable()
export class S3FileHandlerService implements FileHandlerInterface {

  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {}
  
  public async uploadFile(path: string, content: string): Promise<string> {
    const imgBuffer = Buffer.from(content, "base64");
    var uploadParams = {
      Bucket: this.configService.get<string>("s3CommonBucket.name"),
      Key: "",
      Body: imgBuffer,
      ContentEncoding: "base64",
      ContentType: "image/png",
    };
    
    // uploadParams.Key = `profile_images/${companyId}_${new Date().getTime()}.png`;
    uploadParams.Key = path
    return (await s3
      .upload(uploadParams)
      .promise())?.map( e => e.Location);
  }


  public getUrl(path: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  
}