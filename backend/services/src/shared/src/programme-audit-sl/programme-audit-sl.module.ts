import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProgrammeAuditLogSl } from "../entities/programmeAuditLogSl.entity";
import { ProgrammeAuditSlService } from "./programmeAuditSL.service";

@Module({
  imports: [TypeOrmModule.forFeature([ProgrammeAuditLogSl])],
  providers: [Logger, ProgrammeAuditSlService],
  exports: [ProgrammeAuditSlService],
})
export class ProgrammeAuditSlModule {}
