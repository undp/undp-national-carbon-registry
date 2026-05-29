import { Module } from "@nestjs/common";
import { CoreService } from "./core.service";
import { AppConfigModule } from "./app-config/app-config.module";

@Module({
  imports: [AppConfigModule],
  providers: [CoreService],
  exports: [CoreService, AppConfigModule],
})
export class CoreModule {}
