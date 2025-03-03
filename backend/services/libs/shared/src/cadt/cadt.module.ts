import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "../../../core/src/app-config/configuration";
import { CadtApiService } from "./cadt.api.service";
import { CompanyModule } from "../company/company.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "../entities/programme.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Programme]), CompanyModule],
  providers: [CadtApiService, Logger],
  exports: [CadtApiService],
})
export class CadtModule {}
