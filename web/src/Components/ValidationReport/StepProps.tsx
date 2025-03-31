import { FormInstance } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

export interface ValidationStepsProps {
  next?: () => void;
  prev?: () => void;
  form: FormInstance;
  current: number;
  countries?: string[];
  t: any;
  handleValuesUpdate: (val: any) => void;
  submitForm?: (appendixVals: any) => void;
  projectCategory?: string;
  cmaDetails?: any;
  existingFormValues?: any;
  formMode?: FormMode;
  disableFields?: boolean;
  documentId?: string; 
  handleLoading?: (val: boolean) => void;
}
