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
  approvalAndAuthorizationDataMapToFields,
  BasicInformationDataMapToFields,
  descriptionOfProjectActivityDataMapToFields,
  eligibilityCriteriaDataMapToFields,
  environmentImpactsDataMaptoFields,
  localStakeholderConsultationDataMaptoFields,
  monitoringDataMapToFields,
  quantificationOfGHGDataMapToFields,
  startDateCreditingPeriodDataMapToFields,
} from './viewDataMap';
import { Loading } from '../Loading/loading';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import ApprovalAndAuthoriziation from './ApprovalAndAuthoriziation';
import StartDateCreditingPeriod from './StartDateCreditingPeriod';
import { API_PATHS } from '../../Config/apiConfig';
import Monitoring from './Monitoring';
import { DocumentEnum } from '../../Definitions/Enums/document.enum';
import { ROUTES } from '../../Config/uiRoutingConfig';
import { INF_SECTORAL_SCOPE } from '../AddNewProgramme/ProgrammeCreationComponent';
import { toMoment } from '../../Utils/convertTime';
import { safeClone } from '../../Utils/deepCopy';
import { defaultTimeout } from '../../Definitions/Constants/defaultTimeout';

const CMA_STEPS = {};

const StepperComponent = (props: any) => {
  const { t, selectedVersion, handleDocumentStatus } = props;
  const [current, setCurrent] = useState(0);
  const [documentId, setDocumentId] = useState<string>();
  const navigate = useNavigate();
  const { state } = useLocation();
  //console.log('---state-----', state);
  // const isView = !!state?.isView;
  // const isEdit = !!state?.isEdit;

  const [loading, setLoading] = useState<boolean>(
    state?.mode === FormMode.VIEW ||
      state?.mode === FormMode.EDIT ||
      state?.mode === FormMode?.VERIFY
  );
  const { id } = useParams();

  const handleLoading = (val: boolean) => {
    setLoading(val);
  };

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
    //console.log('----------temp vals-------------', val);

    setValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
    });
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

  const next = () => {
    if (current === 0) {
      const country = form1.getFieldValue('hostParty');
      form8.setFieldsValue({
        country: country,
      });
    }
    setCurrent(current + 1);
    scrollToDiv();
  };

  const prev = () => {
    setCurrent(current - 1);
    scrollToDiv();
  };

  const getProgrammeDetailsById = async (programId: any) => {
    try {
      setLoading(true);
      const { data } = await post(API_PATHS.PROGRAMME_BY_ID, {
        programmeId: programId,
      });
      // const {
      //   data: { user },
      // } = await get(API_PATHS.USER_PROFILE);
      if (state?.mode === FormMode?.CREATE) {
        form1.setFieldsValue({
          projectTitle: data?.title,
          versionNumber: 1,
          projectProponent: data?.company?.name,
          sectoralScope: INF_SECTORAL_SCOPE[data?.sectoralScope] || 'N/A',
        });
        form4.setFieldsValue({
          projectActivityStartDate: toMoment(data?.startDate).format('YYYY-MM-DD'),
        });
      }
      //.log('----------running form values--------', form4.getFieldsValue());
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

  const getOrganizationDetails = async () => {
    try {
      setLoading(true);
      const { data } = await get(API_PATHS.USER_PROFILE_DETAILS);
      //console.log('----------data----------', data);
      if (state?.mode === FormMode?.CREATE) {
        form8.setFieldsValue({
          organizationName: data?.Organisation?.name,
          address: data?.Organisation?.address,
          email: data?.Organisation?.email,
          website: data?.Organisation?.website,
          telephone: data?.Organisation?.phoneNo,
          fax: data?.Organisation?.faxNo,
          contactPerson: data?.user?.name,
        });
      }
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getViewData = async () => {
      if (
        state?.mode === FormMode.EDIT ||
        state?.mode === FormMode.VERIFY ||
        state?.mode === FormMode?.VIEW
      ) {
        setLoading(true);
        let res;
        try {
          res = await post(API_PATHS.QUERY_DOCUMENT, {
            refId: state?.documentRefId,
            documentType: DocumentEnum.PDD,
          });
          console.log('------PDD data-----', res?.data);
          if (res?.statusText === 'SUCCESS') {
            const data = res?.data;
            setDocumentId(data?.refId);

            let projectDetails = BasicInformationDataMapToFields(data.data?.projectDetails);

            if (state?.mode === FormMode.EDIT) {
              const docVersions = state?.documents?.[DocumentEnum.PDD]?.version;
              console.log('----------state-------', state);
              const latestVersion = docVersions ? docVersions + 1 : 1;

              projectDetails = {
                ...projectDetails,
                versionNumber: latestVersion,
              };
            }
            form1.setFieldsValue(projectDetails);

            const descripitonOfProjectActivity = descriptionOfProjectActivityDataMapToFields(
              data.data?.projectActivity
            );
            form2.setFieldsValue(descripitonOfProjectActivity);

            const applicationOfMethodology = applicationOfMethodologyDataMapToFields(
              data?.data?.applicationOfMethodology
            );
            form3.setFieldsValue(applicationOfMethodology);

            const startDateCreditingPeriod = startDateCreditingPeriodDataMapToFields(
              data?.data?.startDateCreditingPeriod
            );

            form4.setFieldsValue(startDateCreditingPeriod);

            const environmentImpacts = environmentImpactsDataMaptoFields(
              data?.data?.environmentImpacts
            );

            form5.setFieldsValue(environmentImpacts);

            const localStakeholderConsultation = localStakeholderConsultationDataMaptoFields(
              data?.data.localStakeholderConsultation
            );
            form6.setFieldsValue(localStakeholderConsultation);

            const approvalAndAuthorization = approvalAndAuthorizationDataMapToFields(
              data?.data.approvalAndAuthorization
            );
            form7.setFieldsValue(approvalAndAuthorization);

            const appendix = appendixDataMapToFields(data?.data.appendix);
            form8.setFieldsValue(appendix);
          }
        } catch (error) {
          console.log('error', error);
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();

    if (state?.mode === FormMode.VERIFY || state?.mode === FormMode.VIEW) {
      setDisableFields(true);
    }
  }, [selectedVersion]);

  const submitForm = async (appendixVals: any) => {
    const tempValues = {
      ...safeClone(values),
      data: {
        ...safeClone(values.data),
        appendix: appendixVals,
      },
    };

    try {
      setLoading(true);
      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      //console.log('------res------------', res);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content:
            state?.mode === FormMode.EDIT
              ? 'Project Design Document has been edited successfully'
              : 'Project Design Document has been submitted successfully',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        
        setTimeout(() => {
          navigateToDetailsPage();
          setLoading(false);
        }, defaultTimeout)
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: 'Something went wrong',
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
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
    if (id) {
      getCountryList();
      getProgrammeDetailsById(id);
      getOrganizationDetails();
      form2.setFieldValue('projectParticipants', [
        { partiesInvolved: '', projectParticipants: [{ participant: '' }] },
      ]);
    }
  }, [id]);

  //console.log('----------disableFields----------', disableFields);
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
          // formMode={isView ? FormMode.VIEW : isEdit ? FormMode.EDIT : FormMode.CREATE}
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
          documentId={documentId}
          handleLoading={handleLoading}
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
