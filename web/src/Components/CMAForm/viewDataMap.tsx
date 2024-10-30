import moment from 'moment';

export const projectDetailsDataMapToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
    dateOfIssue: vals?.dateOfIssue ? moment.unix(vals?.dateOfIssue) : undefined,
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

  const firstGHGEmissionReduction =
    vals?.estimatedAnnualGHGEmissions && vals?.estimatedAnnualGHGEmissions?.length > 0
      ? vals?.estimatedAnnualGHGEmissions.shift()
      : undefined;

  const tempValues = {
    introduction: vals?.introduction,
    sectoralScopeAndProjectType: vals?.sectoralScopeAndProjectType,
    organizationName: vals?.projectProponent?.organizationName,
    email: vals?.projectProponent?.email,
    contactPerson: vals?.projectProponent?.contactPerson,
    title: vals?.projectProponent?.title,
    telephone: vals?.projectProponent?.telephone,
    fax: vals?.projectProponent?.fax,
    address: vals?.projectProponent?.address,
    entityOrganizationName: firstEntity?.orgainzationName,
    entityEmail: firstEntity?.email,
    entityTitle: firstEntity?.title,
    entityRoleInTheProject: firstEntity?.role,
    entityTelephone: firstEntity?.telephone,
    entityContactPerson: firstEntity?.contactPerson,
    entityFax: firstEntity?.fax,
    entityAddress: firstEntity?.address,
    extraOtherEntities: (function () {
      const tempEntities: any[] = [];
      const otherEntities = vals?.otherEntities;
      if (otherEntities !== undefined && otherEntities.length > 0) {
        otherEntities.forEach((item: any) => {
          const tempObj = {
            organizationName: item?.organizationName,
            email: item?.email,
            contactPerson: item?.contactPerson,
            roleInTheProject: item?.role,
            title: item?.title,
            telephone: item?.telephone,
            fax: item?.fax,
            address: item?.address,
          };
          tempEntities.push(tempObj);
        });
      }
      return tempEntities;
    })(),
    locationOfProjectActivity: firstLocation?.locationOfProjectActivity,
    province: firstLocation?.province,
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
    projectOwnership: vals?.projectOwnership,
    projectTrack: vals?.projectTrack,
    creditingPeriodStartDate: vals?.creditingPeriodStartDate
      ? moment.unix(vals?.creditingPeriodStartDate)
      : undefined,
    creditingPeriodEndDate: vals?.creditingPeriodEndDate
      ? moment.unix(vals?.creditingPeriodEndDate)
      : undefined,
    creditingPeriodDescription: vals?.creditingPeriodDescription,
    projectScale: vals?.projectScaleType,
    estimatedAnnualGHGEmissionsYear: firstGHGEmissionReduction?.year
      ? moment.unix(firstGHGEmissionReduction?.year)
      : undefined,
    estimatedAnnualGHGEmissionsValue: firstGHGEmissionReduction?.ghgEmissionReduction,
    extraGHGEmmissions: (function () {
      const emmissions = vals?.estimatedAnnualGHGEmissions;

      const tempEmmissions: any = [];
      if (emmissions !== undefined && emmissions?.length > 0) {
        emmissions.forEach((emmision: any) => {
          const temp = {
            estimatedAnnualGHGEmissionsYear: emmision?.year
              ? moment.unix(emmision?.year)
              : undefined,
            estimatedAnnualGHGEmissionsValue: emmision?.ghgEmissionReduction,
          };

          tempEmmissions.push(temp);
        });
      }

      return tempEmmissions;
    })(),
    totalEstimatedGHGERs: String(vals?.totalEstimatedGHGERs),
    totalCreditingYears: String(vals?.totalCreditingYears),
    avgAnnualERs: String(vals?.avgAnnualERs),
    projectActivityDescription: vals?.description,
    optionalProjectActivityDocuments: mapBase64ToFields(vals?.additionalDocuments),
    conditionsPriorToProjectInitiation: vals?.conditionsPriorToProjectInitiation,
    complianceWithLaws: vals?.complianceWithLaws,
    participationPrograms: vals?.participationUnderOtherGHGPrograms,
    otherFormsOfCredit: vals?.otherFormsOfCredit,
    sustainableDevelopment: vals?.sustainableDevelopment,
    leakageManagement: vals?.leakageManagement,
    commerciallySensitiveInformation: vals?.commerciallySensitiveInfo,
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

  const tempValues = {
    titleAndReferenceOfMethodology: vals?.titleAndReference,
    applicabilityOfMethodology: vals?.applicability,
    baselineScenario: vals?.baselineScenario,
    additionality: vals?.additionality,
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
    additionalComments: vals?.annexures,
    appendixDocuments: mapBase64ToFields(vals?.additionalDocuments),
  };

  return tempValues;
};
