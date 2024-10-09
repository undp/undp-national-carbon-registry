import { useEffect, useState } from 'react';
import { Form } from 'antd';
import './MonitoringReport.scss';
import StepperComponent from './StepperComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';

export const SLCFMonitoringReportComponent = (props: any) => {
  const [countries, setCountries] = useState<[]>([]);
  const { put, get, post } = useConnection();

  const { useLocation, onNavigateToProgrammeView, translator } = props;
  const [current, setCurrent] = useState<number>(0);

  const [form] = Form.useForm();
  const getCountryList = async () => {
    const response = await get('national/organisation/countries');
    if (response.data) {
      const alpha2Names = response.data.map((item: any) => {
        return item.alpha2;
      });
      setCountries(alpha2Names);
    }
  };
  useEffect(() => {
    getCountryList();
  }, []);
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
            countries={countries}
          ></StepperComponent>
        </div>
      </div>
    </div>
  );
};
