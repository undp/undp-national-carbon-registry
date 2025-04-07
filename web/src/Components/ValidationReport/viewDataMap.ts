import moment from 'moment';
import { mapBase64ToFields } from '../../Utils/mapBase64ToFields';

export const basicInformationMapDataToFields = (vals: any) => {
  console.log('----------vals----------', vals);
  if (vals === undefined || vals === null) {
    return;
  }

  // const firstLocation =
  //   vals?.locationsOfProjectActivity && vals?.locationsOfProjectActivity?.length > 0
  //     ? vals?.locationsOfProjectActivity.shift()
  //     : undefined;

  const tempVals = {
    ...vals,
    locationOfProjectActivity: vals?.locationOfProjectActivity,
    province: vals?.province,
    siteNo: vals?.siteNo,
    district: vals?.district,
    dsDivision: vals?.dsDivision,
    city: vals?.city,
    community: vals?.community,
    location: vals?.location,
    optionalImages: mapBase64ToFields(vals?.additionalDocuments),
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
            location: location?.location,
            optionalImages: mapBase64ToFields(location?.additionalDocuments),
          };
          return tempObj;
        });
      }
      return tempExtraLocations;
    })(),
    // approverSignature: mapBase64ToFields(vals?.approverSignature),
    completionDate: vals?.completionDate ? moment.unix(vals?.completionDate) : undefined,
    pddUploadedGlobalStakeholderConsultation: vals?.pddUploadedGlobalStakeholderConsultation
      ? moment.unix(vals?.pddUploadedGlobalStakeholderConsultation)
      : undefined,
    approverSignature: mapBase64ToFields([vals?.approverSignature]),
    creditingPeriodStart: vals?.creditingPeriodStart
      ? moment.unix(vals?.creditingPeriodStart)
      : undefined,
    creditingPeriodEnd: vals?.creditingPeriodEnd
      ? moment.unix(vals?.creditingPeriodEnd)
      : undefined,
  };

  console.log('----------vals after bb--------', tempVals);
  return tempVals;
};

export const ghgProjectDescriptionMapDataToFields = (vals: any) => {
  console.log('-------ghg vals-------', vals);
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
    estimatedNetEmissionReductions: vals?.estimatedNetEmissionReductions.map((item: any) => {
      return {
        ...item,
        startDate: item?.startDate ? moment.unix(item?.startDate) : undefined,
        endDate: item?.endDate ? moment.unix(item?.endDate) : undefined,
      };
    }),
  };

  console.log('--------ghg vals after---------', tempValues);
  return tempValues;
};

export const executiveSummaryMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const validationMethodologyMapDataToFields = (vals: any) => {
  console.log('---------validation----------', vals);
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const meansOfValidationMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
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
        date: item?.date ? moment.unix(item?.date) : undefined,
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

  return tempValues;
};

export const validationFindingsMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const internalQualityControlMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const validationOpinionMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
  };

  return tempValues;
};

export const validationReportAppendixMapDataToFields = (vals: any) => {
  if (vals === undefined) return;

  const tempValues = {
    ...vals,
    appendix1Documents: mapBase64ToFields(vals?.appendix1Documents),
    cl_date: vals?.cl_date ? moment.unix(vals?.cl_date) : undefined,
    cl_projectParticipantResponseDate: vals?.cl_projectParticipantResponseDate
      ? moment.unix(vals?.cl_projectParticipantResponseDate)
      : undefined,
    cl_doeAssesmentDate: vals?.cl_doeAssesmentDate
      ? moment.unix(vals?.cl_doeAssesmentDate)
      : undefined,
    car_date: vals?.car_date ? moment.unix(vals?.car_date) : undefined,
    car_projectParticipantResponseDate: vals?.car_projectParticipantResponseDate
      ? moment.unix(vals?.car_projectParticipantResponseDate)
      : undefined,
    car_doeAssesmentDate: vals?.car_doeAssesmentDate
      ? moment.unix(vals?.car_doeAssesmentDate)
      : undefined,
    far_date: vals?.far_date ? moment.unix(vals?.far_date) : undefined,
    far_projectParticipantResponseDate: vals?.far_projectParticipantResponseDate
      ? moment.unix(vals?.far_projectParticipantResponseDate)
      : undefined,
    far_doeAssesmentDate: vals?.far_doeAssesmentDate
      ? moment.unix(vals?.far_doeAssesmentDate)
      : undefined,
  };

  console.log('----------tempValues-------------', tempValues);

  return tempValues;
};
