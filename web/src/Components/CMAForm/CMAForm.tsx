import { i18n } from 'i18next';
import React from 'react';
import './CMAForm.scss';
import StepperComponent from './StepperComponent';

const SLCFCMAForm = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;
  return (
    <div className="cma-form-container">
      <div className="title-container">
        <div className="main">{t('CMAForm:cmaFormTitle')}</div>
      </div>

      <div className="forms-container">
        <div className="stepper-container">
          <StepperComponent t={t} />
        </div>
      </div>
    </div>
  );
};

export default SLCFCMAForm;
