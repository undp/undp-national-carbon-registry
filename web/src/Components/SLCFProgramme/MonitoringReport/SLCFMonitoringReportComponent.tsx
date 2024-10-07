import { useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  Upload,
  message,
} from 'antd';

import './SLCFMonitoringReportComponent.scss';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import StepperComponent from './StepperComponent';

type SizeType = Parameters<typeof Form>[0]['size'];

const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
  ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
  : 5000000;

const PROVINCES_AND_DISTRICTS: { [key: string]: string[] } = {
  'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Eastern Province': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
  'Nothern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western Province': ['Kurunegala', 'Puttalam'],
  'Sabaragamuwa Province': ['Kegalle', 'Ratnapura'],
  'Southern Province': ['Galle', 'Hambanthota', 'Matara'],
  'Uva Province': ['Badulla', 'Monaragala'],
  'Western Province': ['Colombo', 'Gampaha', 'Kaluthara'],
};

const PROJECT_GEOGRAPHY: { [key: string]: string } = {
  singleLocation: 'Single Location',
  multipleLocations: 'Scattered in multiple locations',
};

const PROJECT_CATEGORIES: { [key: string]: string } = {
  renewableEnergy: 'Renewable Energy',
  afforestation: 'Afforestation',
  reforestation: 'Reforestation',
  other: 'Other',
};

const PROJECT_STATUS: { [key: string]: string } = {
  proposalStage: 'Proposal Stage',
  procurement: 'Procurement',
  construction: 'Construction',
  installation: 'Installation',
};

const PURPOSE_CREDIT_DEVELOPMENT: { [key: string]: string } = {
  track1: 'Track 1 - for trading',
  track2: 'Track 2 - for internal offsetting',
};
export const SLCFMonitoringReportComponent = (props: any) => {
  const { useLocation, onNavigateToProgrammeView, translator } = props;
  const [current, setCurrent] = useState<number>(0);

  const [form] = Form.useForm();

  const t = translator.t;
  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <div className="main">{t('monitoringReport:monitoringReport')}</div>
      </div>
      <div className="adding-section">
        <div className="form-section">
          <StepperComponent
            useLocation={useLocation}
            translator={translator}
            form={form}
          ></StepperComponent>
        </div>
      </div>
    </div>
  );
};
