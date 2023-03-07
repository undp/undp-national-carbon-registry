import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {

  constructor(private configService: ConfigService) {}
  
  createTypeOrmOptions(): TypeOrmModuleOptions {
    console.log('DB Config', this.configService.get<any>('database'))
    return this.configService.get<any>('database');
  }
}