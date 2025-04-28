import moment from 'moment';
import { toMoment } from '../../Utils/convertTime';

export const BasicInformationDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
    completionDate: vals?.completionDate ? moment.unix(vals?.completionDate) : undefined,
  };

  return tempValues;
};

const mapBase64ToFields = (fileUrls: string[]) => {
  let fileObjs: any[] = [];

  if (fileUrls !== undefined && fileUrls.length > 0) {
    fileObjs = fileUrls.map((item: any, index) => {
      const nameParts = item.split('/');
      const name = nameParts[nameParts.length - 1];
      const tempObj = {
        uid: name,
        name: name,
        status: 'done',
        url: item,
      };
      return tempObj;
    });
  }

  return fileObjs;
};

export const descriptionOfProjectActivityDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const firstEntity =
    vals?.otherEntities && vals?.otherEntities?.length > 0
      ? vals?.otherEntities.shift()
      : undefined;

  const firstLocation =
    vals?.locationsOfProjectActivity && vals?.locationsOfProjectActivity?.length > 0
      ? vals?.locationsOfProjectActivity.shift()
      : undefined;

  const tempValues = {
    ...vals,
    introduction: vals?.introduction,
    locationOfProjectActivity: firstLocation?.locationOfProjectActivity,
    province: firstLocation?.province,
    siteNo: firstLocation?.siteNo,
    district: firstLocation?.district,
    dsDivision: firstLocation?.dsDivision,
    city: firstLocation?.city,
    community: firstLocation?.community,
    location: firstLocation?.geographicalLocationCoordinates,
    optionalImages: mapBase64ToFields(firstLocation?.additionalDocuments),
    projectFundings: firstLocation?.projectFundings,
    projectStartDate: firstLocation?.startDate ? moment.unix(firstLocation?.startDate) : undefined,
    projectCommisionDate: firstLocation?.commissioningDate
      ? moment.unix(firstLocation?.commissioningDate)
      : undefined,
    extraLocations: (function () {
      const locations = vals?.locationsOfProjectActivity;
      let tempExtraLocations: any[] = [];
      if (locations !== 0 && locations.length > 0) {
        tempExtraLocations = locations.map((location: any) => {
          const tempObj = {
            locationOfProjectActivity: location?.locationOfProjectActivity,
            province: location?.province,
            district: location?.district,
            dsDivision: location?.dsDivision,
            siteNo: location?.siteNo,
            city: location?.city,
            community: location?.community,
            location: location?.geographicalLocationCoordinates,
            optionalImages: mapBase64ToFields(location?.additionalDocuments),
            projectFundings: location?.projectFundings,
            projectStartDate: location?.startDate ? moment.unix(location?.startDate) : undefined,
            projectCommisionDate: location?.startDate
              ? moment.unix(location?.commissioningDate)
              : undefined,
          };
          return tempObj;
        });
      }
      return tempExtraLocations;
    })(),
  };

  return tempValues;
};

export const environmentImpactsDataMaptoFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    analysisEnvironmentalImpacts: vals?.analysis,
    environmentalImpactAssessment: vals?.assessment,
  };

  return tempValues;
};

export const localStakeholderConsultationDataMaptoFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    stakeHolderConsultationProcess: vals?.stakeholderConsultationProcess,
    summaryOfCommentsRecieved: vals?.summaryOfComments,
    considerationOfCommentsRecieved: vals?.considerationOfComments,
  };

  return tempValues;
};

export const approvalAndAuthorizationDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return vals;
};

export const eligibilityCriteriaDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const applicationOfMethodologyDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const projectBoundary = vals?.projectBoundary;
  const baselineArray = projectBoundary?.baseline;
  const firstBaseline =
    baselineArray !== undefined && baselineArray?.length > 0 ? baselineArray.shift() : undefined;

  const projectArray = projectBoundary?.project;

  const firstProject =
    projectArray !== undefined && projectArray?.length > 0 ? projectArray.shift() : undefined;

  const ghgEmissionReductions = vals?.netGHGEmissionReductions;
  const yearlyReductions = ghgEmissionReductions?.yearlyGHGEmissionReductions;
  const firstYearlyReductions =
    yearlyReductions !== undefined && yearlyReductions.length > 0
      ? yearlyReductions.shift()
      : undefined;

  const tempValues = {
    ...vals,
    titleAndReferenceOfMethodology: vals?.titleAndReference,
    applicabilityOfMethodology: vals?.applicability,

    methodologyDeviations: vals?.methodologyDeviations,
    projectBoundary: projectBoundary?.description,
    baselineSource: firstBaseline?.source,
    baselineIsCO2Included: firstBaseline?.isCO2Included,
    baselineco2Justification: firstBaseline?.co2Justification,
    baselineIsCH4Included: firstBaseline?.isCH4Included,
    baselinech4Justification: firstBaseline?.ch4Justification,
    baselineIsN2OIncluded: firstBaseline?.isN2OIncluded,
    baselinen2oJustification: firstBaseline?.n2oJustification,
    baselineIsOtherIncluded: firstBaseline?.isOtherIncluded,
    baselineotherJustification: firstBaseline?.otherJustification,
    projectSource: firstProject?.source,
    projectIsCO2Included: firstProject?.isCO2Included,
    projectco2Justification: firstProject?.co2Justification,
    projectIsCH4Included: firstProject?.isCH4Included,
    projectch4Justification: firstProject?.ch4Justification,
    projectIsN2OIncluded: firstProject?.isN2OIncluded,
    projectn2oJustification: firstProject?.n2oJustification,
    projectIsOtherIncluded: firstProject?.isOtherIncluded,
    projectotherJustification: firstProject?.otherJustification,
    extraBaseline: (function () {
      let tempExtraBaseline: any[] = [];
      if (baselineArray !== undefined && baselineArray.length > 0) {
        tempExtraBaseline = baselineArray;
      }
      return tempExtraBaseline;
    })(),
    extraProject: (function () {
      let tempExtraProject: any[] = [];
      if (projectArray !== undefined && projectArray?.length > 0) {
        tempExtraProject = projectArray;
      }
      return tempExtraProject;
    })(),
    monitoringParameter: vals?.dataAndParametersMonitored?.monitoringParameter,
    monitoringUnit: vals?.dataAndParametersMonitored?.monitoringUnit,
    monitoringDescription: vals?.dataAndParametersMonitored?.monitoringDescription,
    data_parameterDescription: vals?.dataAndParametersMonitored?.data_parameterDescription,
    monitoringSource: vals?.dataAndParametersMonitored?.monitoringSource,
    monitoringMeasurementMethods: vals?.dataAndParametersMonitored?.monitoringMeasurementMethods,
    monitoringFrequency: vals?.dataAndParametersMonitored?.monitoringFrequency,
    monitoringValueApplied: vals?.dataAndParametersMonitored?.monitoringValueApplied,
    monitoringEquipment: vals?.dataAndParametersMonitored?.monitoringEquipment,
    monitoringQAProcedures: vals?.dataAndParametersMonitored?.monitoringQAProcedures,
    monitoringPurpose: vals?.dataAndParametersMonitored?.monitoringPurpose,
    monitoringCalculation: vals?.dataAndParametersMonitored?.monitoringCalculation,
    monitoringComments: vals?.dataAndParametersMonitored?.monitoringComments,
    parameter: vals?.dataAndParametersExAnte?.parameter,
    unit: vals?.dataAndParametersExAnte?.unit,
    description: vals?.dataAndParametersExAnte?.description,
    source: vals?.dataAndParametersExAnte?.source,
    valueApplied: vals?.dataAndParametersExAnte?.valueApplied,
    descriptionOfMeasurementMethods: vals?.dataAndParametersExAnte?.descriptionOfMeasurementMethods,
    purpose: vals?.dataAndParametersExAnte?.purpose,

    comments: vals?.dataAndParametersExAnte?.comments,
    vintage: firstYearlyReductions?.vintage
      ? toMoment(firstYearlyReductions?.vintage)
      : undefined,
    baselineEmissionReductions: String(firstYearlyReductions?.baselineEmissionReductions),
    projectEmissionReductions: String(firstYearlyReductions?.projectEmissionReductions),
    leakageEmissionReductions: String(firstYearlyReductions?.leakageEmissionReductions),
    netEmissionReductions: String(firstYearlyReductions?.netEmissionReductions),
    extraEmissionReductions: (function () {
      let tempExtraReductions: any = [];

      if (yearlyReductions !== undefined && yearlyReductions?.length > 0) {
        tempExtraReductions = yearlyReductions.map((reductions: any) => {
          return {
            vintage: reductions?.vintage
              ? toMoment(reductions?.vintage)
              : undefined,
            baselineEmissionReductions: String(reductions?.baselineEmissionReductions),
            projectEmissionReductions: String(reductions?.projectEmissionReductions),
            leakageEmissionReductions: String(reductions?.leakageEmissionReductions),
            netEmissionReductions: String(reductions?.netEmissionReductions),
          };
        });
      }
      return tempExtraReductions;
    })(),
    totalBaselineEmissionReductions: String(ghgEmissionReductions?.totalBaselineEmissionReductions),
    totalProjectEmissionReductions: String(ghgEmissionReductions?.totalProjectEmissionReductions),
    totalLeakageEmissionReductions: String(ghgEmissionReductions?.totalLeakageEmissionReductions),
    totalNetEmissionReductions: String(ghgEmissionReductions?.totalNetEmissionReductions),
    totalCreditingYears: String(ghgEmissionReductions?.totalNumberOfCredingYears),
    avgBaselineEmissionReductions: String(ghgEmissionReductions?.avgBaselineEmissionReductions),
    avgProjectEmissionReductions: String(ghgEmissionReductions?.avgProjectEmissionReductions),
    avgLeakageEmissionReductions: String(ghgEmissionReductions?.avgLeakageEmissionReductions),
    avgNetEmissionReductions: String(ghgEmissionReductions?.avgNetEmissionReductions),
  };

  return tempValues;
};

export const startDateCreditingPeriodDataMapToFields = (vals: any) => {
  const tempValues = {
    ...vals,
    projectCreditingPeriodStartDate: vals?.projectCreditingPeriodStartDate
      ? moment.unix(vals?.projectCreditingPeriodStartDate)
      : undefined,
    projectCreditingPeriodEndDate: vals?.projectCreditingPeriodEndDate
      ? moment.unix(vals?.projectCreditingPeriodEndDate)
      : undefined,
    creditingPeriodStart: vals?.creditingPeriodStart
      ? moment.unix(vals?.creditingPeriodStart)
      : undefined,
    projectActivityStartDate: vals?.projectActivityStartDate
      ? moment.unix(vals?.projectActivityStartDate)
      : undefined,
  };
  return tempValues;
};

export const quantificationOfGHGDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const ghgEmissionReductions = vals?.netGHGEmissionReductions;

  const yearlyReductions = ghgEmissionReductions?.yearlyGHGEmissionReductions;
  const firstYearlyReductions =
    yearlyReductions !== undefined && yearlyReductions.length > 0
      ? yearlyReductions.shift()
      : undefined;

  const tempValues = {
    baselineEmissions: vals?.baselineEmissions,
    projectEmissions: vals?.projectEmissions,
    leakage: vals?.leakage,
    netGHGEmissionReductionsAndRemovals: ghgEmissionReductions?.description,
    emissionsPeriodStart: firstYearlyReductions?.startDate
      ? moment.unix(firstYearlyReductions?.startDate)
      : undefined,
    emissionsPeriodEnd: firstYearlyReductions?.endDate
      ? moment.unix(firstYearlyReductions?.endDate)
      : undefined,
    baselineEmissionReductions: String(firstYearlyReductions?.baselineEmissionReductions),
    projectEmissionReductions: String(firstYearlyReductions?.projectEmissionReductions),
    leakageEmissionReductions: String(firstYearlyReductions?.leakageEmissionReductions),
    netEmissionReductions: String(firstYearlyReductions?.netEmissionReductions),
    extraEmissionReductions: (function () {
      let tempExtraReductions: any = [];

      if (yearlyReductions !== undefined && yearlyReductions?.length > 0) {
        tempExtraReductions = yearlyReductions.map((reductions: any) => {
          return {
            emissionsPeriodStart: reductions?.startDate
              ? moment.unix(reductions?.startDate)
              : undefined,
            emissionsPeriodEnd: reductions?.endDate ? moment.unix(reductions?.endDate) : undefined,
            baselineEmissionReductions: String(reductions?.baselineEmissionReductions),
            projectEmissionReductions: String(reductions?.projectEmissionReductions),
            leakageEmissionReductions: String(reductions?.leakageEmissionReductions),
            netEmissionReductions: String(reductions?.netEmissionReductions),
          };
        });
      }
      return tempExtraReductions;
    })(),
    totalBaselineEmissionReductions: String(ghgEmissionReductions?.totalBaselineEmissionReductions),
    totalProjectEmissionReductions: String(ghgEmissionReductions?.totalProjectEmissionReductions),
    totalLeakageEmissionReductions: String(ghgEmissionReductions?.totalLeakageEmissionReductions),
    totalNetEmissionReductions: String(ghgEmissionReductions?.totalNetEmissionReductions),
    totalCreditingYears: String(ghgEmissionReductions?.totalNumberOfCredingYears),
    avgBaselineEmissionReductions: String(ghgEmissionReductions?.avgBaselineEmissionReductions),
    avgProjectEmissionReductions: String(ghgEmissionReductions?.avgProjectEmissionReductions),
    avgLeakageEmissionReductions: String(ghgEmissionReductions?.avgLeakageEmissionReductions),
    avgNetEmissionReductions: String(ghgEmissionReductions?.avgNetEmissionReductions),
  };

  return tempValues;
};

export const monitoringDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    dataAndParametersAvailable: vals?.dataAndParametersDescription,
    parameter: vals?.validationParameters?.parameter,
    unit: vals?.validationParameters?.unit,
    description: vals?.validationParameters?.description,
    source: vals?.validationParameters?.source,
    purpose: vals?.validationParameters?.purpose,
    valueApplied: vals?.validationParameters?.valueApplied,
    justification: vals?.validationParameters?.justification,
    monitoringParameter: vals?.monitoredParameters?.parameter,
    monitoringUnit: vals?.monitoredParameters?.unit,
    monitoringDescription: vals?.monitoredParameters?.description,
    monitoringSource: vals?.monitoredParameters?.source,
    monitoringMeasurementMethods: vals?.monitoredParameters?.measurementMethods,
    monitoringFrequency: vals?.monitoredParameters?.frequency,
    monitoringValueApplied: vals?.monitoredParameters?.valueApplied,
    monitoringEquipment: vals?.monitoredParameters?.monitoringEquipment,
    monitoringQAProcedures: vals?.monitoredParameters?.qaQCProcedures,
    monitoringPurpose: vals?.monitoredParameters?.purpose,
    monitoringCalculation: vals?.monitoredParameters?.calculationMethod,
    monitoringComments: vals?.monitoredParameters?.comments,
    monitoringPlan: vals?.monitoringPlan,
  };

  return tempValues;
};

export const appendixDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
    appendix2Documents: mapBase64ToFields(vals?.appendix2Documents),
    appendix3Documents: mapBase64ToFields(vals?.appendix3Documents),
    appendix4Documents: mapBase64ToFields(vals?.appendix4Documents),
    appendix5Documents: mapBase64ToFields(vals?.appendix5Documents),
    appendix6Documents: mapBase64ToFields(vals?.appendix6Documents),
    appendix7Documents: mapBase64ToFields(vals?.appendix7Documents),
  };

  return tempValues;
};
