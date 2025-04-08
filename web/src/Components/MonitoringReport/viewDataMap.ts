import moment from "moment";
import { mapBase64ToFields } from "../../Utils/mapBase64ToFields";

export const basicInformationMapDataToFields = (vals: any) => {
  console.log("--------bi------------", vals);
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    bi_completionDate: vals?.bi_completionDate
      ? moment.unix(vals?.bi_completionDate)
      : undefined,
    b_signature: mapBase64ToFields(vals.b_signature),
  };

  console.log("-----------ret bi----------", tempVals);
  return tempVals;
};

export const projectActivityMapDataToFields = (vals: any) => {
  console.log("--------vals---------", vals);
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    locationDetails:
      vals?.locationofProjectActivity &&
      vals.locationofProjectActivity.map((item: any) => {
        return {
          ...item,
          pa_uploadImages: mapBase64ToFields(item?.pa_uploadImages),
        };
      }),
    pa_projectCreditingPeriod: vals?.pa_projectCreditingPeriod
      ? moment.unix(vals?.pa_projectCreditingPeriod)
      : undefined,
    pa_projectCreditingPeriodEndDate: vals?.pa_projectCreditingPeriodEndDate
      ? moment.unix(vals?.pa_projectCreditingPeriodEndDate)
      : undefined,
  };

  return tempVals;
};

export const implementationOfProjectAcitivityMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const descriptionOfMMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const dataAndParametersMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const calcEmissionReductionMapDataToFields = (vals: any) => {
  console.log("--------cal---------", vals);
  if (vals === undefined) return;

  const ghgEmissionReductions = vals?.netGHGEmissionReductions;
  const yearlyReductions = ghgEmissionReductions?.yearlyGHGEmissionReductions;
  const firstYearlyReductions =
    yearlyReductions !== undefined && yearlyReductions.length > 0
      ? yearlyReductions.shift()
      : undefined;

  const tempVals = {
    ...vals,
    ce_documentUpload: mapBase64ToFields(vals?.ce_documentUpload),
    emissionsPeriodStart: firstYearlyReductions?.startDate
      ? moment.unix(firstYearlyReductions?.startDate)
      : undefined,
    emissionsPeriodEnd: firstYearlyReductions?.endDate
      ? moment.unix(firstYearlyReductions?.endDate)
      : undefined,
    baselineEmissionReductions: String(
      firstYearlyReductions?.baselineEmissionReductions
    ),
    projectEmissionReductions: String(
      firstYearlyReductions?.projectEmissionReductions
    ),
    leakageEmissionReductions: String(
      firstYearlyReductions?.leakageEmissionReductions
    ),
    netEmissionReductions: String(firstYearlyReductions?.netEmissionReductions),
    extraEmissionReductions: (function () {
      let tempExtraReductions: any = [];

      if (yearlyReductions !== undefined && yearlyReductions?.length > 0) {
        tempExtraReductions = yearlyReductions.map((reductions: any) => {
          return {
            emissionsPeriodStart: reductions?.startDate
              ? moment.unix(reductions?.startDate)
              : undefined,
            emissionsPeriodEnd: reductions?.endDate
              ? moment.unix(reductions?.endDate)
              : undefined,
            baselineEmissionReductions: String(
              reductions?.baselineEmissionReductions
            ),
            projectEmissionReductions: String(
              reductions?.projectEmissionReductions
            ),
            leakageEmissionReductions: String(
              reductions?.leakageEmissionReductions
            ),
            netEmissionReductions: String(reductions?.netEmissionReductions),
          };
        });
      }
      return tempExtraReductions;
    })(),
    totalBaselineEmissionReductions: String(
      ghgEmissionReductions?.totalBaselineEmissionReductions
    ),
    totalProjectEmissionReductions: String(
      ghgEmissionReductions?.totalProjectEmissionReductions
    ),
    totalLeakageEmissionReductions: String(
      ghgEmissionReductions?.totalLeakageEmissionReductions
    ),
    totalNetEmissionReductions: String(
      ghgEmissionReductions?.totalNetEmissionReductions
    ),
    totalCreditingYears: String(
      ghgEmissionReductions?.totalNumberOfCreditingYears
    ),
    avgBaselineEmissionReductions: String(
      ghgEmissionReductions?.avgBaselineEmissionReductions
    ),
    avgProjectEmissionReductions: String(
      ghgEmissionReductions?.avgProjectEmissionReductions
    ),
    avgLeakageEmissionReductions: String(
      ghgEmissionReductions?.avgLeakageEmissionReductions
    ),
    avgNetEmissionReductions: String(
      ghgEmissionReductions?.avgNetEmissionReductions
    ),
  };

  return tempVals;
};

export const AnnexureMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    a_appendix: vals?.appendix,
    a_uploadDoc: mapBase64ToFields(vals?.a_uploadDoc),
  };

  return tempVals;
};
