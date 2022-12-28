import { AgricultureCal } from "./calculators/agricultureCal";
import { SolarCal } from "./calculators/solarCal";
import { AgricultureCreationRequest } from "./requests/agricultureCreationRequest";
import { CreditCreationRequest } from "./requests/creditCreationRequest";
import { SolarCreationRequest } from "./requests/solarCreationRequest";

export const PRECISION = 2
export const calculateCredit = (request: CreditCreationRequest): number => {
    if (request instanceof AgricultureCreationRequest) {
        return AgricultureCal.calculate(request)
    } else if (request instanceof SolarCreationRequest) {
        return SolarCal.calculate(request)
    } else {
        throw Error("Not implemented")
    }
}