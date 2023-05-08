import { Column, Entity, PrimaryColumn } from "typeorm";
import { ConfigurationSettingsType } from "../enum/configuration.settings.type.enum";

@Entity()
export class ConfigurationSettings {
  @PrimaryColumn({
    type: "enum",
    enum: ConfigurationSettingsType,
    array: false,
  })
  id: ConfigurationSettingsType;

  @Column()
  settingValue: string;
}
