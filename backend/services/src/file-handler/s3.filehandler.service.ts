import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "./filehandler.interface";
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

    const encodeFileName = encodeURIComponent(path);
    return `https://${this.configService.get<string>("s3CommonBucket.name")}.s3.amazonaws.com/${encodeFileName}`
    
    // uploadParams.Key = `profile_images/${companyId}_${new Date().getTime()}.png`;
    // uploadParams.Key = path
    // return (await s3
    //   .upload(uploadParams)
    //   .promise())?.Location;
  }


  public getUrl(path: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  
}