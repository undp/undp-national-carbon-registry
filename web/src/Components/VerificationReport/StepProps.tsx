import { FormInstance } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { TFunction } from 'i18next';
import { i18n } from 'i18next';

export interface VerificationStepProps {
  next?: () => void;
  prev?: () => void;
  form: FormInstance;
  current: number | undefined;
  countries?: string[];
  translator: i18n;
  t: TFunction<string[], undefined, string[]>;
  handleValuesUpdate: (val: any) => void;
  // submitForm?: (appendixVals: any) => void;
  // projectCategory?: string;
  // existingFormValues?: any;
  disableFields?: boolean;
  formMode?: FormMode;
  handleLoading?: (val: boolean) => void;
  documentId?: string;
  maxNetGHGReduction?: number;
  // selectedVersion: number | undefined;
  // handleDocumentStatus: (value: string) => void;
}
