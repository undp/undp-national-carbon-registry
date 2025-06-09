import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";
import { RiceCropsProperties } from "../dto/rice.crops.properties";
import { SoilEnhancementBiocharProperties } from "../dto/soil.enhancement.biochar.properties";
import { SubTypeOfMitigation } from "../enum/typeofmitigation.enum";
import { StovesHousesInNamibiaProperties } from "../dto/stoves.houses.in.namibia.properties";
import { SolarWaterPumpOffGridProperties } from "../dto/solar.water.pump.off.grid.properties";
import { SolarWaterPumpOnGridProperties } from "../dto/solar.water.pump.on.grid.properties";
import { SolarCreditCalculationProperties } from "../dto/solar.credit.cal.properties";
import { EnergyGenerationUnits } from "../enum/energy.generation.units.enum";

@ValidatorConstraint()
export class CreditCalculationPropertyValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const NDCActionDto = (args as any).object;

    if (NDCActionDto.subTypeOfMitigation) {
      if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.RICE_CROPS) {
        const riceCropsProperties = args?.value as RiceCropsProperties;
        return riceCropsProperties?.landArea !== undefined && riceCropsProperties?.landAreaUnit !== undefined;

      } else if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.SOIL_ENRICHMENT_BIOCHAR) {
        const soilEnhancementBiocharProperties = args.value as SoilEnhancementBiocharProperties;
        return soilEnhancementBiocharProperties?.weight !== undefined;

      } else if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.STOVES_HOUSES_IN_NAMIBIA) {
        const stovesHousesInNamibiaProperties = args?.value as StovesHousesInNamibiaProperties;
        return stovesHousesInNamibiaProperties?.numberOfDays !== undefined && stovesHousesInNamibiaProperties?.numberOfPeopleInHousehold !== undefined;

      } else if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_WATER_PUMPING_OFF_GRID) {
        const solarWaterPumpOffGridProperties = args?.value as SolarWaterPumpOffGridProperties;
        const unit: EnergyGenerationUnits = solarWaterPumpOffGridProperties?.energyGenerationUnit as EnergyGenerationUnits;
        return solarWaterPumpOffGridProperties?.energyGeneration !== undefined && solarWaterPumpOffGridProperties?.energyGenerationUnit !== undefined
        && Object.values(EnergyGenerationUnits).includes(unit);

      } else if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_WATER_PUMPING_ON_GRID) {
        const solarWaterPumpOnGridProperties = args?.value as SolarWaterPumpOnGridProperties;
        const unit: EnergyGenerationUnits = solarWaterPumpOnGridProperties?.energyGenerationUnit as EnergyGenerationUnits;
        return solarWaterPumpOnGridProperties?.energyGeneration !== undefined && solarWaterPumpOnGridProperties?.energyGenerationUnit !== undefined 
        && Object.values(EnergyGenerationUnits).includes(unit);

      } else if (NDCActionDto.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_PHOTOVOLTAICS_PV) {
        const solarCreditCalculationProperties = args?.value as SolarCreditCalculationProperties;
        return solarCreditCalculationProperties?.energyGeneration !== undefined && solarCreditCalculationProperties?.energyGenerationUnit !== undefined && solarCreditCalculationProperties?.consumerGroup !== undefined;
      }

    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const childClass = args.value;

    if (childClass == undefined || childClass == null) {
      return 'creditCalculationProperties is required';
    }

    if (childClass.subTypeOfMitigation == undefined || childClass.subTypeOfMitigation == null) {
      return 'subTypeOfMitigation is required';
    }

    if (childClass.subTypeOfMitigation == SubTypeOfMitigation.RICE_CROPS) {
      if (childClass.landArea === undefined) {
        return 'creditCalculationProperties.landArea is required'
      }
      if (childClass.landAreaUnit === undefined) {
        return 'creditCalculationProperties.landAreaUnit is required'
      }

    } else if (childClass.subTypeOfMitigation == SubTypeOfMitigation.SOIL_ENRICHMENT_BIOCHAR) {
      if (childClass.weight === undefined) {
        return 'creditCalculationProperties.weight is required'
      }

    } else if (childClass.subTypeOfMitigation == SubTypeOfMitigation.STOVES_HOUSES_IN_NAMIBIA) {
      if (childClass.numberOfDays === undefined) {
        return 'creditCalculationProperties.numberOfDays is required'
      }
      if (childClass.numberOfPeopleInHousehold === undefined) {
        return 'creditCalculationProperties.numberOfPeopleInHousehold is required'
      }

    } else if (childClass.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_WATER_PUMPING_OFF_GRID
      || childClass.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_WATER_PUMPING_ON_GRID) {
      if (childClass.energyGeneration === undefined) {
        return 'creditCalculationProperties.energyGeneration is required'
      }
      if (childClass.energyGenerationUnit === undefined) {
        return 'creditCalculationProperties.energyGenerationUnit is required'
      }
      if (!Object.values(EnergyGenerationUnits).includes(childClass.energyGenerationUnit)) {
        return 'Invalid energyGenerationUnit. Supported following values:' + Object.values(EnergyGenerationUnits);
      }

    } else if (childClass.subTypeOfMitigation == SubTypeOfMitigation.SOLAR_PHOTOVOLTAICS_PV) {
      if (childClass.energyGeneration === undefined) {
        return 'creditCalculationProperties.energyGeneration is required'
      }
      if (childClass.energyGenerationUnit === undefined) {
        return 'creditCalculationProperties.energyGenerationUnit is required'
      }
      if (Object.values(EnergyGenerationUnits).includes(childClass.energyGenerationUnit)) {
        return 'Invalid energyGenerationUnit. Supported following values:' + Object.values(EnergyGenerationUnits);
      }
      if (childClass.consumerGroup === undefined) {
        return 'creditCalculationProperties.consumerGroup is required'
      }

    }
    return 'creditCalculationProperties validation failed';
  }
}

export function IsChildClassValid(validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CreditCalculationPropertyValidator,
    });
  };
}