import React, { useEffect, useState } from 'react';
import { Steps, Button, Form, message } from 'antd';
import './ValidationReport.scss';
// import './SLCFMonitoringReportComponent.scss';

import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import ProjectDetails from './ProjectDetails';
import ProjectActivity from './ProjectActivity';
import Appendix from './Appendix';
import ValidationProcess from './ValidationProcess';
import ValidationFindings from './ValidationFindings';
import ValidationConclusion from './ValidationConclusion';
import GHGProjectDescription from './GHGProjectDescription';

const StepperComponent = (props: any) => {
  const { t } = props;
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const [values, setValues] = useState({
    programmeId: '001',
    companyId: undefined,
    content: {},
  });

  const handleValuesUpdate = (val: any) => {
    setValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.content,
        ...val,
      };
      return { ...prevVal, content: tempContent };
    });
  };

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const [countries, setCountries] = useState<[]>([]);
  const [projectCategory, setProjectCategory] = useState<string>('');

  const { get, post } = useConnection();

  const [form1] = useForm();
  const [form2] = useForm();
  const [form3] = useForm();
  const [form4] = useForm();
  const [form5] = useForm();
  const [form6] = useForm();
  const [form7] = useForm();
  const [form8] = useForm();

  // const getProgrammeDetailsById = async (id: string) => {
  //   try {
  //     const { data } = await post('national/programmeSL/getProjectById', {
  //       programmeId: id,
  //     });

  //     const {
  //       data: { user },
  //     } = await get('national/User/profile');
  //     console.log('-----response-------', data, user);

  //     // const dateOfIssue = moment().unix();
  //     form1.setFieldsValue({
  //       title: data?.title,
  //       dateOfIssue: moment(),
  //       preparedBy: user?.name,
  //       physicalAddress: data?.company?.address,
  //       email: data?.company?.email,
  //       projectProponent: data?.company?.name,
  //       telephone: data?.company?.phoneNo,
  //       website: data?.company?.website,
  //     });

  //     setProjectCategory(data?.projectCategory);
  //     form2.setFieldsValue({
  //       projectTrack: data?.purposeOfCreditDevelopment,
  //       // projectTrack: 'TRACK_2',
  //       organizationName: data?.company?.name,
  //       email: data?.company?.email,
  //       telephone: data?.company?.phoneNo,
  //       address: data?.company?.address,
  //       fax: data?.company?.faxNo,
  //     });

  //     setValues((prevVal) => ({
  //       ...prevVal,
  //       companyId: data?.company?.companyId,
  //     }));
  //   } catch (error) {
  //     console.log('error');
  //   }
  // };

  const submitForm = async (appendixVals: any) => {
    const tempValues = {
      ...values,
      content: {
        ...values.content,
        appendix: appendixVals,
      },
    };
    console.log('------------final values--------------', tempValues);
    try {
      const res = await post('national/programmeSl/createCMA', tempValues);
      console.log(res);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: 'CMA form has been submitted successfully',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        // navigate('/programmeManagementSLCF/viewAll');
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: 'Something went wrong',
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
  };
  const getCountryList = async () => {
    try {
      const response = await get('national/organisation/countries');
      if (response.data) {
        const alpha2Names = response.data.map((item: any) => {
          return item.alpha2;
        });
        setCountries(alpha2Names);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCountryList();
    // getProgrammeDetailsById('001');
  }, []);

  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          {/* <div className="step-count">00</div> */}
          <div className="title">{t('validationReport:form01Title')}</div>
        </div>
      ),
      description: (
        <ProjectDetails
          next={next}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('validationReport:form02Title')}</div>
        </div>
      ),
      description: (
        <ProjectActivity
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t('validationReport:form03Title')}</div>
        </div>
      ),
      description: (
        <GHGProjectDescription
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('validationReport:form04Title')}</div>
        </div>
      ),
      description: (
        <ValidationProcess
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('validationReport:form05Title')}</div>
        </div>
      ),
      description: (
        <ValidationFindings
          next={next}
          prev={prev}
          form={form4}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('validationReport:form06Title')}</div>
        </div>
      ),
      description: (
        <ValidationConclusion
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('validationReport:form07Title')}</div>
        </div>
      ),
      description: (
        <Appendix
          next={next}
          prev={prev}
          form={form6}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
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
