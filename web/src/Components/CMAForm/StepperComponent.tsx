import React, { useEffect, useRef, useState } from 'react';
import { Steps, Button, Form, message } from 'antd';
import './CMAForm.scss';
// import './SLCFMonitoringReportComponent.scss';

import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import EligibilityCriteria from './EligibilityCriteria';
import ApplicationOfMethodology from './ApplicationOfMethodology';
import QuantificationOfEmissions from './QuantificationOfEmissions';
import ProjectDetails from './ProjectDetails';
import DescriptionOfProjectActivity from './DescriptionOfProjectActivity';
import EnvironmentImpacts from './EnvironmentImpacts';
import Monitoring from './Monitoring';
import Appendix from './Appendix';
import LocalStakeholderConsultation from './LocalStakeholderConsultation';
import moment from 'moment';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  appendixDataMapToFields,
  applicationOfMethodologyDataMapToFields,
  descriptionOfProjectActivityDataMapToFields,
  eligibilityCriteriaDataMapToFields,
  environmentImpactsDataMaptoFields,
  localStakeholderConsultationDataMaptoFields,
  monitoringDataMapToFields,
  projectDetailsDataMapToFields,
  quantificationOfGHGDataMapToFields,
} from './viewDataMap';

const CMA_STEPS = {};

const StepperComponent = (props: any) => {
  const { t, form } = props;
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const { state } = useLocation();
  const isView = !!state?.isView;
  const isEdit = !!state?.isEdit;
  const { id } = useParams();

  const scrollSection = useRef({} as any);

  const scrollToDiv = () => {
    if (scrollSection.current) {
      scrollSection.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };

  const [values, setValues] = useState({
    programmeId: id,
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
    scrollToDiv();
  };

  const prev = () => {
    setCurrent(current - 1);
    scrollToDiv();
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
  const [form9] = useForm();

  const getProgrammeDetailsById = async (programId: any) => {
    try {
      const { data } = await post('national/programmeSL/getProjectById', {
        programmeId: programId,
      });

      const {
        data: { user },
      } = await get('national/User/profile');

      if (!(isView || isEdit)) {
        form1.setFieldsValue({
          title: data?.title,
          dateOfIssue: moment(),
          preparedBy: user?.name,
          physicalAddress: data?.company?.address,
          email: data?.company?.email,
          projectProponent: data?.company?.name,
          telephone: data?.company?.phoneNo,
          website: data?.company?.website,
        });

        setProjectCategory(data?.projectCategory);
        form2.setFieldsValue({
          projectTrack: data?.purposeOfCreditDevelopment,
          organizationName: data?.company?.name,
          email: data?.company?.email,
          telephone: data?.company?.phoneNo,
          address: data?.company?.address,
          fax: data?.company?.faxNo,
        });
      }

      setValues((prevVal) => ({
        ...prevVal,
        companyId: data?.company?.companyId,
      }));
    } catch (error) {
      console.log('error');
    }
  };

  useEffect(() => {
    const getViewData = async () => {
      if (isView || isEdit) {
        const res = await post('national/programmeSl/getDocLastVersion', {
          programmeId: id,
          docType: 'cma',
        });

        if (res?.statusText === 'SUCCESS') {
          const content = JSON.parse(res?.data.content);

          const projectDetails = projectDetailsDataMapToFields(content?.projectDetails);
          form1.setFieldsValue(projectDetails);
          const descripitonOfProjectActivity = descriptionOfProjectActivityDataMapToFields(
            content?.projectActivity
          );
          form2.setFieldsValue(descripitonOfProjectActivity);

          const environmentImpacts = environmentImpactsDataMaptoFields(content?.environmentImpacts);
          form3.setFieldsValue(environmentImpacts);

          const localStakeholderConsultation = localStakeholderConsultationDataMaptoFields(
            content?.localStakeholderConsultation
          );
          form4.setFieldsValue(localStakeholderConsultation);

          const eligibilityCriteria = eligibilityCriteriaDataMapToFields(
            content?.eligibilityCriteria
          );
          form5.setFieldsValue(eligibilityCriteria);

          const applicationOfMethodology = applicationOfMethodologyDataMapToFields(
            content?.applicationOfMethodology
          );
          form6.setFieldsValue(applicationOfMethodology);

          const quantificationOfGHG = quantificationOfGHGDataMapToFields(
            content?.quantificationOfGHG
          );
          form7.setFieldsValue(quantificationOfGHG);

          const monitoring = monitoringDataMapToFields(content?.monitoring);
          form8.setFieldsValue(monitoring);

          const appendix = appendixDataMapToFields(content?.appendix);
          form9.setFieldsValue(appendix);
        }
      }
    };

    getViewData();

    if (isView) {
      setDisableFields(true);
    }
  }, []);

  const submitForm = async (appendixVals: any) => {
    const tempValues = {
      ...values,
      content: {
        ...values.content,
        appendix: appendixVals,
      },
    };

    try {
      const res = await post('national/programmeSl/createCMA', tempValues);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: isEdit
            ? 'CMA form has been edited successfully'
            : 'CMA form has been submitted successfully',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
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
    getProgrammeDetailsById(id);
  }, []);

  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container">
          {/* <div className="step-count">00</div> */}
          <div className="title">{t('CMAForm:form01Title')}</div>
        </div>
      ),
      description: (
        <ProjectDetails
          prev={navigateToDetailsPage} // will take user to details page
          next={next}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
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
        <DescriptionOfProjectActivity
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
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
      description: (
        <EnvironmentImpacts
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('CMAForm:form04Title')}</div>
        </div>
      ),
      description: (
        <LocalStakeholderConsultation
          next={next}
          prev={prev}
          form={form4}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('CMAForm:form05Title')}</div>
        </div>
      ),
      description: (
        <EligibilityCriteria
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('CMAForm:form06Title')}</div>
        </div>
      ),
      description: (
        <ApplicationOfMethodology
          next={next}
          prev={prev}
          form={form6}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('CMAForm:form07Title')}</div>
        </div>
      ),
      description: (
        <QuantificationOfEmissions
          next={next}
          prev={prev}
          form={form7}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t('CMAForm:form08Title')}</div>
        </div>
      ),
      description: (
        <Monitoring
          next={next}
          prev={prev}
          form={form8}
          current={current}
          t={t}
          projectCategory={projectCategory}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">08</div>
          <div className="title">{t('CMAForm:form09Title')}</div>
        </div>
      ),
      description: (
        <Appendix
          next={navigateToDetailsPage} // will take user to details page
          prev={prev}
          form={form9}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          submitForm={submitForm}
          disableFields={disableFields}
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
