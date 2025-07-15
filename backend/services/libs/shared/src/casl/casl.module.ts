import { Module } from "@nestjs/common";
import { CaslAbilityFactory } from "./casl-ability.factory";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [UtilModule],
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
