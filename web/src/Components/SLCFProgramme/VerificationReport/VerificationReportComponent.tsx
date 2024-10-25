import { useEffect, useState } from 'react';
import './VerificationReport.scss';
import StepperComponent from './StepperComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';

export const VerificationReportComponent = (props: any) => {
  const [countries, setCountries] = useState<[]>([]);
  const { put, get, post } = useConnection();

  const { useLocation, onNavigateToProgrammeView, translator } = props;

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
        <div className="main">{t('verificationReport:verificationReport')}</div>
      </div>
      <div className="adding-section">
        <div className="form-section">
          <StepperComponent
            useLocation={useLocation}
            translator={translator}
            countries={countries}
          ></StepperComponent>
        </div>
      </div>
    </div>
  );
};
