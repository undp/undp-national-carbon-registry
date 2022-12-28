import { SectoralScope } from "./constants/sectoralScope"

export const generateSerialNumber = (
    countryISO2Code: string,
    sectoralScope: SectoralScope,
    programmeId: string,
    year: number,
    blockStartCredit: number,
    blockEndCredit: number,
    creditUnit: string
    ): string => {
        return `${countryISO2Code}-${creditUnit}-${sectoralScope}-${programmeId}-${year}-0-${blockStartCredit}-${blockEndCredit}`
}