import { DocType } from '../Definitions/Enums/document.type';

const allowedFileTypes = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'image/png',
  'image/jpeg',
];

const environmentalImpactAssessmentAllowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export const isValidateFileType = (fileType: string, docType?: string): boolean => {
  if (docType === DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT) {
    return environmentalImpactAssessmentAllowedTypes.includes(fileType);
  } else {
    return allowedFileTypes.includes(fileType);
  }
};
