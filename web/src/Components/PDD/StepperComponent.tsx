import BasicInformation from './BasicInformation';
import { useEffect, useRef, useState } from 'react';
import { Steps, message } from 'antd';
import './PDD.scss';

import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import EligibilityCriteria from './EligibilityCriteria';
import ApplicationOfMethodology from './ApplicationOfMethodology';
import QuantificationOfEmissions from './QuantificationOfEmissions';

import DescriptionOfProjectActivity from './DescriptionOfProjectActivity';
import EnvironmentImpacts from './EnvironmentImpacts';
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
import { Loading } from '../Loading/loading';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import ApprovalAndAuthoriziation from './ApprovalAndAuthoriziation';
import StartDateCreditingPeriod from './StartDateCreditingPeriod';
import { API_PATHS } from '../../Config/apiConfig';
import Monitoring from './Monitoring';
import { DocumentEnum } from '../../Definitions/Enums/document.enum';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CMA_STEPS = {};

const StepperComponent = (props: any) => {
  const { t, selectedVersion, handleDocumentStatus } = props;
  const [current, setCurrent] = useState(7);

  const navigate = useNavigate();

  const { state } = useLocation();
  const isView = !!state?.isView;
  const isEdit = !!state?.isEdit;

  const [loading, setLoading] = useState<boolean>(isView || isEdit);
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
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
  };

  const [values, setValues] = useState({
    projectRefId: id,
    name: 'PDD',
    companyId: undefined,
    documentType: DocumentEnum.PDD,
    data: {},
  });

  const handleValuesUpdate = (val: any) => {
    console.log('----------temp vals-------------', val);
    setValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
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

  const getProgrammeDetailsById = async (programId: any) => {
    try {
      setLoading(true);
      // const { data } = await post(API_PATHS.PROJECT_BY_ID, {
      //   programmeId: programId,
      // });

      // const {
      //   data: { user },
      // } = await get(API_PATHS.USER_PROFILE);

      if (!(isView || isEdit)) {
        form1.setFieldsValue({
          // title: data?.title,
          // dateOfIssue: moment(),
          // preparedBy: data?.company?.name,
          // physicalAddress: data?.company?.address,
          // email: data?.company?.email,
          // projectProponent: data?.company?.name, // changed to project participants in the UI but key is kept the same
          // telephone: data?.company?.phoneNo,
          // website: data?.company?.website,
        });

        // setProjectCategory(data?.projectCategory);
        form2.setFieldsValue({
          // projectTrack: data?.purposeOfCreditDevelopment,
          // organizationName: data?.company?.name,
          // email: data?.company?.email,
          // telephone: data?.company?.phoneNo,
          // address: data?.company?.address,
          // fax: data?.company?.faxNo,
          // contactPerson: data?.contactName,
          // projectParticipants: [{ partiesInvolved: '', projectParticipant: '' }],
        });
      }

      console.log('----------running form values--------', form2.getFieldsValue());
      setValues((prevVal) => ({
        ...prevVal,
        // companyId: data?.company?.companyId,
      }));
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getViewData = async () => {
      if (isView || isEdit) {
        setLoading(true);
        let res;
        try {
          if (isView && selectedVersion) {
            res = await post(API_PATHS.DOC_BY_VERSION, {
              programmeId: id,
              docType: 'cma',
              version: selectedVersion,
            });
          } else {
            res = await post(API_PATHS.LAST_DOC_VERSION, {
              programmeId: id,
              docType: 'cma',
            });
          }
          if (isView) {
            handleDocumentStatus(res.data.status);
          }

          if (res?.statusText === 'SUCCESS') {
            const content = JSON.parse(res?.data.content);

            // const projectDetails = projectDetailsDataMapToFields(content?.projectDetails);
            // form1.setFieldsValue(projectDetails);
            // const descripitonOfProjectActivity = descriptionOfProjectActivityDataMapToFields(
            //   content?.projectActivity
            // );
            // form2.setFieldsValue(descripitonOfProjectActivity);

            // const environmentImpacts = environmentImpactsDataMaptoFields(
            //   content?.environmentImpacts
            // );
            // form3.setFieldsValue(environmentImpacts);

            // const localStakeholderConsultation = localStakeholderConsultationDataMaptoFields(
            //   content?.localStakeholderConsultation
            // );
            // form4.setFieldsValue(localStakeholderConsultation);

            // const eligibilityCriteria = eligibilityCriteriaDataMapToFields(
            //   content?.eligibilityCriteria
            // );
            // form5.setFieldsValue(eligibilityCriteria);

            // const applicationOfMethodology = applicationOfMethodologyDataMapToFields(
            //   content?.applicationOfMethodology
            // );
            // form6.setFieldsValue(applicationOfMethodology);

            // const quantificationOfGHG = quantificationOfGHGDataMapToFields(
            //   content?.quantificationOfGHG
            // );
            // form7.setFieldsValue(quantificationOfGHG);

            // const monitoring = monitoringDataMapToFields(content?.monitoring);
            // form8.setFieldsValue(monitoring);

            // const appendix = appendixDataMapToFields(content?.appendix);
            // form9.setFieldsValue(appendix);
          }
        } catch (error) {
          console.log('error', error);
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();

    if (isView) {
      setDisableFields(true);
    }
  }, [selectedVersion]);

  const submitForm = async (appendixVals: any) => {
    const tempValues = {
      ...values,
      data: {
        ...values.data,
        appendix: appendixVals,
      },
    };

    try {
      setLoading(true);
      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: isEdit
            ? 'Project Design Document has been edited successfully'
            : 'Project Design Document has been submitted successfully',
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
    } finally {
      setLoading(false);
    }
  };

  const getCountryList = async () => {
    try {
      const response = await get(API_PATHS.COUNTRY_LIST);
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
    form2.setFieldValue('projectParticipants', [
      { partiesInvolved: '', projectParticipants: [{ participant: '' }] },
    ]);
  }, []);

  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container">
          {/* <div className="step-count">00</div> */}
          <div className="title">{t('PDD:form01Title')}</div>
        </div>
      ),
      description: (
        <BasicInformation
          prev={navigateToDetailsPage} // will take user to details page
          next={next}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
          formMode={isView ? FormMode.VIEW : isEdit ? FormMode.EDIT : FormMode.CREATE}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('PDD:form02Title')}</div>
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
          <div className="title">{t('PDD:form03Title')}</div>
        </div>
      ),
      description: (
        <ApplicationOfMethodology
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
          <div className="title">{t('PDD:form04Title')}</div>
        </div>
      ),
      description: (
        <StartDateCreditingPeriod
          next={next}
          prev={prev}
          form={form4}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
        // <Monitoring
        //   next={next}
        //   prev={prev}
        //   form={form4}
        //   current={current}
        //   t={t}
        //   handleValuesUpdate={handleValuesUpdate}
        //   disableFields={disableFields}
        // />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('PDD:form05Title')}</div>
        </div>
      ),
      description: (
        <EnvironmentImpacts
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
        />
        // <EligibilityCriteria
        //   next={next}
        //   prev={prev}
        //   form={form5}
        //   current={current}
        //   t={t}
        //   handleValuesUpdate={handleValuesUpdate}
        //   disableFields={disableFields}
        // />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('PDD:form06Title')}</div>
        </div>
      ),
      description: (
        // <ApplicationOfMethodology
        //   next={next}
        //   prev={prev}
        //   form={form6}
        //   current={current}
        //   t={t}
        //   handleValuesUpdate={handleValuesUpdate}
        //   disableFields={disableFields}
        // />
        <LocalStakeholderConsultation
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
          <div className="title">{t('PDD:form07Title')}</div>
        </div>
      ),
      description: (
        <ApprovalAndAuthoriziation
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
          <div className="title">{t('PDD:form08Title')}</div>
        </div>
      ),
      description: (
        <Appendix
          next={navigateToDetailsPage} // will take user to details page
          prev={prev}
          form={form8}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          submitForm={submitForm}
          disableFields={disableFields}
        />
      ),
    },
  ];

  if (loading) {
    return <Loading />;
  }
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
