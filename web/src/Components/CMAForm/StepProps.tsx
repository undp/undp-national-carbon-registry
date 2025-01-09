import { FormInstance } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

export interface CustomStepsProps {
  next?: () => void;
  prev?: () => void;
  form: FormInstance;
  current: number;
  countries?: string[];
  t: any;
  handleValuesUpdate: (val: any) => void;
  submitForm?: (appendixVals: any) => void;
  projectCategory?: string;
  existingFormValues?: any;
  disableFields?: boolean;
  formMode?: FormMode;
}
