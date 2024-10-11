import React, { useEffect, useState } from 'react';
import { Steps, Button, Form } from 'antd';
import './CMAForm.scss';
// import './SLCFMonitoringReportComponent.scss';
import StepO1 from './Step01';
import Step02 from './Step02';
import Step03 from './Step03';
import Step05 from './Step05';
import Step06 from './Step06';
import Step07 from './Step07';
import Step04 from './Step04';
import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

const StepperComponent = (props: any) => {
  const { t, form } = props;
  const [current, setCurrent] = useState(0);

  const [values, setValues] = useState();

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const [countries, setCountries] = useState<[]>([]);

  const { get, post } = useConnection();

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

  const [form1] = useForm();
  const [form2] = useForm();
  const [form3] = useForm();
  const [form4] = useForm();
  const [form5] = useForm();
  const [form6] = useForm();
  const [form7] = useForm();
  const [form8] = useForm();

  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">00</div>
          <div className="title">{t('CMAForm:form01Title')}</div>
        </div>
      ),
      description: (
        <StepO1 next={next} form={form1} current={current} t={t} countries={countries} />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('CMAForm:form02Title')}</div>
        </div>
      ),
      description: (
        <Step02
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t('CMAForm:form03Title')}</div>
        </div>
      ),
      description: <Step03 next={next} prev={prev} form={form3} current={current} t={t} />,
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('CMAForm:form04Title')}</div>
        </div>
      ),
      description: <Step04 next={next} prev={prev} form={form4} current={current} t={t} />,
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('CMAForm:form05Title')}</div>
        </div>
      ),
      description: <Step05 next={next} prev={prev} form={form5} current={current} t={t} />,
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('CMAForm:form06Title')}</div>
        </div>
      ),
      description: <Step06 next={next} prev={prev} form={form6} current={current} t={t} />,
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('CMAForm:form07Title')}</div>
        </div>
      ),
      description: <Step07 next={next} prev={prev} form={form7} current={current} t={t} />,
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
