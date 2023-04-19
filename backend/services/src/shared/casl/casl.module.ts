import { UtilModule } from "../util/util.module";

@Module({
  imports: [UtilModule],
    providers: [CaslAbilityFactory],
    exports: [CaslAbilityFactory],
})
export class CaslModule {}
