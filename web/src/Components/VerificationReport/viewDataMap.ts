import moment from 'moment';
import { mapBase64ToFields } from '../../Utils/mapBase64ToFields';

export const basicInformationMapDataToView = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    b_completionDate: vals?.b_completionDate ? moment.unix(vals?.b_completionDate) : undefined,
    b_signature: mapBase64ToFields([vals?.b_signature]),
  };

  console.log('--------------vals after------------', tempVals);
  return tempVals;
};

export const ghgProjectDescriptionMapDataToFields = (vals: any) => {
  console.log('----------ghg project description----------', vals);
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    estimatedNetEmissionReductions: vals?.estimatedNetEmissionReductions.map((item: any) => {
      return {
        ...item,
        startDate: item?.startDate ? moment.unix(item?.startDate) : undefined,
        endDate: item?.endDate ? moment.unix(item?.endDate) : undefined,
      };
    }),
  };

  return tempVals;
};

export const executiveSummaryMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const verificationTeamsMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const applicationOfMaterialityMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const meansOfVerificationMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    siteInspectionDurationStart: vals?.siteInspectionDurationStart
      ? moment.unix(vals?.siteInspectionDurationStart)
      : undefined,
    siteInspectionDurationEnd: vals?.siteInspectionDurationEnd
      ? moment.unix(vals?.siteInspectionDurationEnd)
      : undefined,
    onSiteInspection: vals?.onSiteInspection?.map((item: any) => {
      const temp = {
        ...item,
        siteLocation: item?.siteLocation,
        activityPerformedDate: item?.activityPerformedDate
          ? moment.unix(item?.activityPerformedDate)
          : undefined,
      };
      return temp;
    }),
    interviewees: vals?.interviewees.map((item: any) => {
      const temp = {
        ...item,
        date: item?.date ? moment.unix(item?.date) : undefined,
      };

      return temp;
    }),
  };

  return tempVals;
};

export const verificationFindingsMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const internalQualityControlMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const verificationOpinionMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const certificaitonMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
  };

  return tempVals;
};

export const appendixMapDataToFields = (vals: any) => {
  console.log('--------verification report---------', vals);
  if (vals === undefined) return;

  const tempVals = {
    ...vals,
    appendix1Document: mapBase64ToFields(vals?.appendix1Document),
    farIdDate: vals?.farIdDate ? moment.unix(vals?.farIdDate) : undefined,
    responseDate: vals?.responseDate ? moment.unix(vals?.responseDate) : undefined,
    doeDate: vals?.doeDate ? moment.unix(vals?.doeDate) : undefined,
  };

  return tempVals;
};
