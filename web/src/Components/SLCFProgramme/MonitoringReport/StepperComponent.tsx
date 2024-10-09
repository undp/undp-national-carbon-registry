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
  const { useLocation, form } = props;
  const [current, setCurrent] = useState(0);
  const { i18n: translator } = useTranslation(['common', 'addProgramme']);
  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: 'Project Details',
      description: (
        <ProjectDetailsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={form}
          next={next}
        />
      ),
    },
    {
      title: 'Project Activity',
      description: (
        <ProjectActivityStep
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
      title: 'Implementation Status',
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
      title: 'Safeguards',
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
      title: 'Data and Parameters',
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
      title: 'Quantification of GHG Emission Reductions and Removals',
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
      title: 'Annexures',
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
