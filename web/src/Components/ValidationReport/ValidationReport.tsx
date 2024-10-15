import React from 'react';
import ValidationStepperComponent from './ValidationStepperComponent';
import { i18n } from 'i18next';
import './ValidationReport.scss';

const ValidationReport = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;

  return (
    <div className="validation-form-container ">
      <div className="title-container">
        <div className="main">{t('validationReport:validationTitle')}</div>
      </div>

      <div className="forms-container">
        <div className="stepper-container">
          <ValidationStepperComponent t={t} />
        </div>
      </div>
    </div>
  );
};

export default ValidationReport;
