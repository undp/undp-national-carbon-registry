import React, { useState } from 'react';
import { Steps, Button, Form } from 'antd';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import './SLCFMonitoringReportComponent.scss';
import { ProjectActivityStep } from './ProjectActivityStep';
import { ImplementationStatusStep } from './ImplementationStatusStep';
import { SafeguardsStep } from './SafeguardsStep';
import { DataAndParametersStep } from './DataAndParametersStep';
import { QualificationStep } from './QualificationStep';
import { AnnexuresStep } from './AnnexuresStep';
import { useTranslation } from 'react-i18next';
const StepperComponent = (props: any) => {
  const { useLocation, translator, form, countries } = props;
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: '01 Project Details',
      description: (
        <ProjectDetailsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          countries={countries}
        />
      ),
    },
    {
      title: '02 Project Activity',
      description: (
        <ProjectActivityStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          prev={prev}
          countries={countries}
        />
      ),
    },
    {
      title: '03 Implementation Status',
      description: (
        <ImplementationStatusStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          prev={prev}
        />
      ),
    },
    {
      title: '04 Safeguards',
      description: (
        <SafeguardsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          prev={prev}
        />
      ),
    },
    {
      title: '05 Data and Parameters',
      description: (
        <DataAndParametersStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          prev={prev}
        />
      ),
    },
    {
      title: '06 Quantification of GHG Emission Reductions and Removals',
      description: (
        <QualificationStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
          prev={prev}
        />
      ),
    },
    {
      title: '07 Annexures',
      description: (
        <AnnexuresStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          prev={prev}
        />
      ),
    },
  ];

  return (
    <>
      <Steps
        progressDot
        direction="vertical"
        current={current}
        items={steps.map((step) => ({
          title: step.title,
          description: step.description,
        }))}
      />
    </>
  );
};

export default StepperComponent;
