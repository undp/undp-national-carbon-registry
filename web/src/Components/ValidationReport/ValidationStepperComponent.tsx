import { Steps } from 'antd';
import { useEffect, useState } from 'react';
import './ValidationReport.scss';
// import './SLCFMonitoringReportComponent.scss';

import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import DataValidationProcess from './DataValidationProcess';
import ValidationReportIntroduction from './ValidationReportIntroduction';
import ProjectDetails from './ProjectDetails';
import Reference from './Reference';
import ValicationReportGHGDescriptionOfProjectActivity from './ValicationReportGHGDescriptionOfProjectActivity';
import ValidationMethodology from './ValidationMethodology';
import ValidationOpinion from './ValidationOpinion';
import ValidationReportAppendix from './ValidationReportAppendix';

export enum ProcessSteps {
  VR_PROJECT_DETAILS = 'VR_PROJECT_DETAILS',
  VR_INTRODUCTION = 'VR_INTRODUCTION',
  VR_GHG_PROJECT_DESCRIPTION = 'VR_GHG_PROJECT_DESCRIPTION',
  VR_VALIDATION_METHODOLOGY = 'VR_VALIDATION_METHODOLOGY',
  VR_VALIDATION_PROCESS = 'VR_VALIDATION_PROCESS',
  VR_VALIDATION_OPINION = 'VR_VALIDATION_OPINION',
  VR_REFERENCE = 'VR_REFERENCE',
  VR_APPENDIX = 'VR_APPENDIX',
}

const StepperComponent = (props: any) => {
  const { t } = props;
  const [current, setCurrent] = useState(4);
  const navigate = useNavigate();
  const { id: programId } = useParams();

  const [existingFormValues, setExistingFormValues] = useState({
    programmeId: '001',
    companyId: undefined,
    content: {
      [ProcessSteps.VR_PROJECT_DETAILS]: {},
      [ProcessSteps.VR_INTRODUCTION]: {},
      [ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]: {},
      [ProcessSteps.VR_VALIDATION_METHODOLOGY]: {},
      [ProcessSteps.VR_VALIDATION_PROCESS]: {},
      [ProcessSteps.VR_VALIDATION_OPINION]: {},
      [ProcessSteps.VR_REFERENCE]: {},
      [ProcessSteps.VR_APPENDIX]: {},
    },
  });

  const handleValuesUpdate = (val: any) => {
    setExistingFormValues((prevVal: any) => {
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

  const getProgrammeDetailsById = async (id: string) => {
    try {
      const { data } = await post('national/programmeSL/getProjectById', {
        programmeId: id,
      });

      const {
        data: { user },
      } = await get('national/User/profile');
      console.log('-----response-------', data, user);

      form1.setFieldsValue({
        title: data?.title,
        dateOfIssue: moment(),
        client: data.title,
      });

      setProjectCategory(data?.projectCategory);

      setExistingFormValues((prevVal) => ({
        ...prevVal,
        companyId: data?.company?.companyId,
      }));
    } catch (error) {
      console.log('error');
    }
  };

  // const submitForm = async (appendixVals: any) => {
  //   const tempValues = {
  //     ...values,
  //     content: {
  //       ...values.content,
  //       appendix: appendixVals,
  //     },
  //   };
  //   console.log('------------final values--------------', tempValues);
  //   try {
  //     const res = await post('national/programmeSl/createCMA', tempValues);
  //     console.log(res);
  //     if (res?.response?.data?.statusCode === 200) {
  //       message.open({
  //         type: 'success',
  //         content: 'CMA form has been submitted successfully',
  //         duration: 4,
  //         style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //       });
  //       // navigate('/programmeManagementSLCF/viewAll');
  //     }
  //   } catch (error: any) {
  //     message.open({
  //       type: 'error',
  //       content: 'Something went wrong',
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   }
  // };

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

  const getCMALastVersion = async (id: string) => {
    try {
      const {
        data: { content },
      } = await post('national/programmeSL/getDocLastVersion', {
        programmeId: id,
        docType: 'cma',
      });

      const projectContent = JSON.parse(content);

      // const dateOfIssue = moment().unix();
      form1.setFieldsValue({
        telephone: projectContent?.projectDetails?.telephone,
        email: projectContent?.projectDetails?.email,
        physicalAddress: projectContent?.projectDetails?.physicalAddress,
        website: projectContent?.projectDetails?.website,
        reportId: `SLCCS/VDR/${new Date().getFullYear()}/${id}`,
      });

      form2.setFieldsValue({
        titleOfTheProjectActivity: projectContent?.projectDetails?.title,
        projectParticipants: projectContent?.projectActivity?.projectProponent?.organizationName,
      });

      form3.setFieldsValue({
        creditingPeriod: projectContent?.projectActivity?.totalCreditingYears,
        locationsOfProjectActivity: projectContent?.projectActivity.locationsOfProjectActivity.map(
          (location: any) => {
            return {
              ...location,
              technicalProjectDescriptionItems: [
                {
                  technicalProjectDescriptionItem: '',
                  technicalProjectDescriptionLocationParameterValues: [
                    {
                      technicalProjectDescriptionParameter: '',
                      technicalProjectDescriptionValue: '',
                    },
                  ],
                },
              ],
            };
          }
        ),
      });

      form4.setFieldsValue({
        resolutionsOfFindings: [
          {
            type: '',
            findingNo: '',
            refToCMA: '',
            actionRequestByTeam: '',
            summaryOfProjectOwnerResponse: '',
            validationTeamAssessment: '',
            conclusion: [],
          },
        ],
      });

      const baseLine = [
        {
          type: 'unit',
          location: t('units'),
          projectCapacity: 'kWp',
          plantFactor: '%',
          averageEnergyOutput: 'MWh/Year',
          gridEmissionFactor: 'tCO2/MWh',
          emissionReduction: 'tCO2/Yea',
        },
        ...projectContent?.projectActivity.locationsOfProjectActivity.map(
          (location: any, index: number) => {
            return {
              type: 'value',
              location: location.locationOfProjectActivity,
              projectCapacity: '',
              plantFactor: '',
              averageEnergyOutput: '',
              gridEmissionFactor: '',
              emissionReduction: '',
            };
          }
        ),
      ];

      form5.setFieldsValue({
        employedTechnology: projectContent?.projectActivity.locationsOfProjectActivity.map(
          (location: any, index: number) => {
            return {
              siteNo: index + 1,
              location: location.locationOfProjectActivity,
              capacity: '',
            };
          }
        ),
        baselineEmissions: baseLine,
      });

      // setProjectCategory(data?.projectCategory);
      // form2.setFieldsValue({
      //   projectTrack: data?.purposeOfCreditDevelopment,
      //   // projectTrack: 'TRACK_2',
      //   organizationName: data?.company?.name,
      //   email: data?.company?.email,
      //   telephone: data?.company?.phoneNo,
      //   address: data?.company?.address,
      //   fax: data?.company?.faxNo,
      // });

      // setValues((prevVal) => ({
      //   ...prevVal,
      //   companyId: data?.company?.companyId,
      // }));
    } catch (error) {
      console.log('error');
    }
  };

  useEffect(() => {
    getCountryList();
    if (programId) {
      getProgrammeDetailsById(programId);
      getCMALastVersion(programId);
    }
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
          existingFormValues={existingFormValues.content[ProcessSteps.VR_PROJECT_DETAILS]}
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
        <ValidationReportIntroduction
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_INTRODUCTION]}
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
        <ValicationReportGHGDescriptionOfProjectActivity
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]}
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
        <ValidationMethodology
          next={next}
          prev={prev}
          form={form4}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_METHODOLOGY]}
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
        <DataValidationProcess
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_PROCESS]}
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
        <ValidationOpinion
          next={next}
          prev={prev}
          form={form6}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_OPINION]}
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
        <Reference
          next={next}
          prev={prev}
          form={form7}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_REFERENCE]}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t('validationReport:form08Title')}</div>
        </div>
      ),
      description: (
        <ValidationReportAppendix
          next={next}
          prev={prev}
          form={form7}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
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
