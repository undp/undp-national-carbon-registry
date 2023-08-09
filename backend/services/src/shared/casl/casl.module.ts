import { Module } from "@nestjs/common";
import { CaslAbilityFactory } from "./casl-ability.factory";
import { UtilModule } from "carbon-services-lib";

@Module({
  imports: [UtilModule],
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
