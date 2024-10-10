import React, { useState } from 'react';
import { Steps, Button, Form, message } from 'antd';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import './MonitoringReport.scss';
import { ProjectActivityStep } from './ProjectActivityStep';
import { ImplementationStatusStep } from './ImplementationStatusStep';
import { SafeguardsStep } from './SafeguardsStep';
import { DataAndParametersStep } from './DataAndParametersStep';
import { QualificationStep } from './QualificationStep';
import { AnnexuresStep } from './AnnexuresStep';
import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
const StepperComponent = (props: any) => {
  const { useLocation, translator, countries } = props;
  const [current, setCurrent] = useState(0);
  const [formValues, setFormValues] = useState({});
  const { post } = useConnection();
  const t = translator.t;

  const onValueChange = (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    console.log(JSON.stringify(formValues));
  };

  const onFinish = async (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    const body = { content: JSON.stringify({ ...formValues, ...newValues }), programmeId: '1' };
    try {
      const res = await post('national/verification/uploadMonitoringReport', body);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: t('monitoringReport:uploadMonitoringReportSuccess'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        // navigate('/programmeManagementSLCF/viewAll');
      }
    } catch (error: any) {
      if (error && error.errors && error.errors.length > 0) {
        error.errors.forEach((err: any) => {
          Object.keys(err).forEach((field) => {
            console.log(`Error in ${field}: ${err[field].join(', ')}`);
            message.open({
              type: 'error',
              content: err[field].join(', '),
              duration: 4,
              style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
            });
          });
        });
      } else {
        message.open({
          type: 'error',
          content: error?.message,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    }
  };

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };
  const [projectDetailsForm] = useForm();
  const [projectActivityForm] = useForm();
  const [implementationStatusForm] = useForm();
  const [safeguardsForm] = useForm();
  const [dataAndParametersForm] = useForm();
  const [qualificationForm] = useForm();
  const [annexuresForm] = useForm();

  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('monitoringReport:title01')}</div>
        </div>
      ),
      description: (
        <ProjectDetailsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={projectDetailsForm}
          next={next}
          countries={countries}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t('monitoringReport:title02')}</div>
        </div>
      ),
      description: (
        <ProjectActivityStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={projectActivityForm}
          next={next}
          prev={prev}
          countries={countries}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('monitoringReport:title03')}</div>
        </div>
      ),
      description: (
        <ImplementationStatusStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={implementationStatusForm}
          next={next}
          prev={prev}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('monitoringReport:title04')}</div>
        </div>
      ),
      description: (
        <SafeguardsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={safeguardsForm}
          next={next}
          prev={prev}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('monitoringReport:title05')}</div>
        </div>
      ),
      description: (
        <DataAndParametersStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={dataAndParametersForm}
          next={next}
          prev={prev}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('monitoringReport:title06')}</div>
        </div>
      ),
      description: (
        <QualificationStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={qualificationForm}
          next={next}
          prev={prev}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t('monitoringReport:title07')}</div>
        </div>
      ),
      description: (
        <AnnexuresStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={annexuresForm}
          prev={prev}
          onFinish={onFinish}
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
