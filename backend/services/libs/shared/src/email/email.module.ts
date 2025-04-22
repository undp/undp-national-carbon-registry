import { Logger, Module } from "@nestjs/common";
import { EmailService } from "./email.service";

@Module({
  providers: [EmailService, Logger],
  exports: [EmailService],
})
export class EmailModule {}
