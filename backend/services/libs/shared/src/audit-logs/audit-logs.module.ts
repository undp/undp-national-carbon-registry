import { Module } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditEntity } from "../entities/audit.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AuditEntity])],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
