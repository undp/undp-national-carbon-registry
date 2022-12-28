import { calculateCredit } from "./calculator";
import { AgricultureCreationRequest } from "./requests/agricultureCreationRequest";
import { SolarCreationRequest } from "./requests/solarCreationRequest";

describe("Agriculture calculation", () => {
    it("example", () => {
        const req = new AgricultureCreationRequest();
        req.duration = 120
        req.durationUnit = 'd'
        req.landArea = 16
        req.landAreaUnit = 'ha'
        expect(calculateCredit(req)).toBe(88.32);
    });

    it("km2 test", () => {
        const req = new AgricultureCreationRequest();
        req.duration = 120
        req.durationUnit = 'd'
        req.landArea = 0.16
        req.landAreaUnit = 'km2'
        expect(calculateCredit(req)).toBe(88.32);
    });

    it("hours test", () => {
        const req = new AgricultureCreationRequest();
        req.duration = 2880
        req.durationUnit = 'h'
        req.landArea = 0.16
        req.landAreaUnit = 'km2'
        expect(calculateCredit(req)).toBe(88.32);
    });

    it("example 2", () => {
        const req = new AgricultureCreationRequest();
        req.duration = 365
        req.durationUnit = 'd'
        req.landArea = 50
        req.landAreaUnit = 'ha'
        expect(calculateCredit(req)).toBe(839.5);
    });

    it("test error", () => {
        const req = new AgricultureCreationRequest();
        req.duration = 365
        req.durationUnit = 'd'
        req.landArea = 50
        req.landAreaUnit = 'ha'
        req.agricultureConstants.emissionFactorUnit = "km"
        expect(() => calculateCredit(req)).toThrow("Invalid emission factor unit km");
    });
});

describe("Solar calculation", () => {
    it("example1", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 20
        req.energyGenerationUnit = 'kWh/year/unit'
        req.buildingType = 'Household'
        expect(calculateCredit(req)).toBe(0.136);
    });

    it("example1 MWh", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 0.020
        req.energyGenerationUnit = 'MWh/year/unit'
        req.buildingType = 'Household'
        expect(calculateCredit(req)).toBe(0.136);
    });

    it("example2", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 105
        req.energyGenerationUnit = 'kWh/year/unit'
        req.buildingType = 'Household'
        expect(calculateCredit(req)).toBe(0.439);
    });

    it("example2 MWh", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 0.105
        req.energyGenerationUnit = 'MWh/year/unit'
        req.buildingType = 'Household'
        expect(calculateCredit(req)).toBe(0.439);
    });
    
    it("example1 error", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 20
        req.energyGenerationUnit = 'kWh/year/unit'
        req.buildingType = 'Household'
        req.solarConstants.emissionFactorUnit = "m"
        expect(() => calculateCredit(req)).toThrow("Invalid emission factor unit m");
    });

    it("example1 error 2", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 20
        req.buildingType = 'Household'
        req.energyGenerationUnit = 'km'
        expect(() => calculateCredit(req)).toThrow("Invalid measured unit km");
    });

    it("example1 error build type", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 20
        req.buildingType = 'TestType'
        req.energyGenerationUnit = 'kWh/year/unit'
        expect(() => calculateCredit(req)).toThrow("Invalid building type TestType");
    });

    it("Rounding issue fix", () => {
        const req = new SolarCreationRequest();
        req.energyGeneration = 8520000000
        req.buildingType = 'TestType'
        req.solarConstants.buildingTypes = {
            'TestType': 825
        };
        req.energyGenerationUnit = 'Wh/year/unit'
        expect(calculateCredit(req)).toBe(11080.538);
    });
});