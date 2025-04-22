import { FormInstance } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { TFunction } from 'i18next';
import { i18n } from 'i18next';

export interface CustomStepsProps {
  next?: () => void;
  prev?: () => void;
  cancel?: () => void;
  form: FormInstance;
  current: number;
  translator: i18n;
  t: TFunction<string[], undefined, string[]>;
  handleValuesUpdate: (val: any) => void;
  submitForm?: (appendixVals: any) => void;
  disableFields?: boolean;
  formMode?: FormMode;
  handleLoading?: (val: boolean) => void;
  documentId?: string; 
  maxNetGHGReduction?: number;
  // countries?: string[];
  // projectCategory?: string;
  // existingFormValues?: any;
}
