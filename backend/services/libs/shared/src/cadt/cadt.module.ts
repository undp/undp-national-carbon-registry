import { Logger, Module } from "@nestjs/common";
import { CadtApiService } from "./cadt.api.service";
import { CadtV2ApiService } from "./cadt-v2-api.service";
import { CadtV2MappingService } from "./cadt-v2-mapping.service";
import { CadtV2ExportService } from "./cadt-v2-export.service";
import { CompanyModule } from "../company/company.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "../entities/programme.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { Country } from "../entities/country.entity";
import { CadtV2EntityMap } from "../entities/cadt.v2.entity.map";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";
import { FileHandlerModule } from "../file-handler/filehandler.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Programme,
      ProjectEntity,
      CreditBlocksEntity,
      Country,
      CadtV2EntityMap,
      AefActionsTableEntity,
    ]),
    CompanyModule,
    FileHandlerModule,
  ],
  providers: [
    CadtApiService,
    CadtV2ApiService,
    CadtV2MappingService,
    CadtV2ExportService,
    Logger,
  ],
  exports: [CadtApiService, CadtV2ApiService, CadtV2ExportService],
})
export class CadtModule {}
