import { Logger, Module } from "@nestjs/common";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { EmailService } from "./email.service";

@Module({
  imports: [FileHandlerModule],
  providers: [EmailService, Logger],
  exports: [EmailService],
})
export class EmailModule {}
