import { Steps, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import './ValidationReport.scss';
// import './SLCFMonitoringReportComponent.scss';

import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

import moment from 'moment';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DataValidationProcess from './DataValidationProcess';
import ValidationReportIntroduction from './ValidationReportIntroduction';
// import Reference from './Reference';
// import ValicationReportGHGDescriptionOfProjectActivity from './ValicationReportGHGDescriptionOfProjectActivity';
import ValidationMethodology from './ValidationMethodology';
import ValidationOpinion from './ValidationOpinion';
import ValidationReportAppendix from './ValidationReportAppendix';
import { projectScopeList } from './validationReportHelper';
import { extractFilePropertiesFromLink } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { API_PATHS } from '../../Config/apiConfig';
import { ROUTES } from '../../Config/uiRoutingConfig';
import BasicInformation from './BasicInformation';
import ExecutiveSummary from './ExecutiveSummary';
import InternalQualityControl from './InternalQualityControl';
import GHGProjectDescription from './GHGProjectDescription';
import MeansOfValidation from './MeansOfValidation';
import ValidationFindings from './ValidationFindings';
import { DocumentEnum } from '../../Definitions/Enums/document.enum';

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
  const { t, selectedVersion, handleDocumentStatus } = props;

  const [current, setCurrent] = useState(8);

  const navigate = useNavigate();
  const { id: programId } = useParams();
  const { get, post } = useConnection();
  const navigationLocation = useLocation();
  const scrollSection = useRef({} as any);
  const { mode } = navigationLocation.state || {};
  const isEdit = true;
  const countryName = process.env.REACT_APP_COUNTRY_NAME || 'CountryX';
  const registryName = process.env.REACT_APP_COUNTRY_NAME || 'RegistryX';

  const [existingFormValues, setExistingFormValues] = useState({
    projectRefId: programId,
    documentType: DocumentEnum.VALIDATION_REPORT,
    name: 'Validation',
    data: {},
  });

  const navigateToDetailsPage = () => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(programId)));
  };

  const scrollToDiv = () => {
    if (scrollSection.current) {
      scrollSection.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const submitForm = async (formValues: any) => {
    try {
      const res = await post(API_PATHS.ADD_DOCUMENT, formValues);
      console.log(res);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: 'Validation report has been submitted successfully',
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

  const next = () => {
    if (current === 7 && mode === FormMode.VIEW) {
      navigateToDetailsPage();
      return;
    }
    setCurrent(current + 1);
    setTimeout(() => {
      scrollToDiv();
    }, 300);
  };

  const prev = () => {
    if (current === 0) {
      navigateToDetailsPage();
      return;
    }
    setCurrent(current - 1);
  };

  const [countries, setCountries] = useState<[]>([]);
  const [projectCategory, setProjectCategory] = useState<string>('');

  const [form1] = useForm();
  const [form2] = useForm();
  const [form3] = useForm();
  const [form4] = useForm();
  const [form5] = useForm();
  const [form6] = useForm();
  const [form7] = useForm();
  const [form8] = useForm();
  const [form9] = useForm();

  // const getProgrammeDetailsById = async (id: string) => {
  //   try {
  //     const { data } = await post(API_PATHS.PROJECT_BY_ID, {
  //       programmeId: id,
  //     });

  //     const {
  //       data: { user },
  //     } = await get(API_PATHS.USER_PROFILE);

  //     form1.setFieldsValue({
  //       projectTitle: data?.title,
  //       dateOfIssue: moment(),
  //       client: data.title,
  //     });

  //     setProjectCategory(data?.projectCategory);

  //     setExistingFormValues((prevVal) => ({
  //       ...prevVal,
  //       companyId: data?.company?.companyId,
  //     }));
  //   } catch (error) {
  //     console.log('error');
  //   }
  // };

  // const getCountryList = async () => {
  //   try {
  //     const response = await get(API_PATHS.COUNTRY_LIST);
  //     if (response.data) {
  //       const alpha2Names = response.data.map((item: any) => {
  //         return item.alpha2;
  //       });
  //       setCountries(alpha2Names);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const getCMALastVersion = async (id: string) => {
    try {
      const {
        data: { content },
      } = await post(API_PATHS.LAST_DOC_VERSION, {
        programmeId: id,
        docType: 'cma',
      });

      const projectContent = JSON.parse(content);

      form1.setFieldsValue({
        telephone: projectContent?.projectDetails?.telephone,
        email: projectContent?.projectDetails?.email,
        address: projectContent?.projectDetails?.physicalAddress,
        website: projectContent?.projectDetails?.website,
        reportNo: `SLCCS/VDR/${new Date().getFullYear()}/${id}`,
        workCarriedOutBy: `Validation Division - ${registryName}`,
      });

      form2.setFieldsValue({
        titleOfProjectActivity: projectContent?.projectDetails?.title,
        projectParticipant: projectContent?.projectActivity?.projectProponent?.organizationName,
      });

      form3.setFieldsValue({
        creditingPeriod: Number(projectContent?.projectActivity?.totalCreditingYears),
        startDateCreditingPeriod: moment(
          projectContent?.projectActivity?.creditingPeriodStartDate * 1000
        ),
        locationsOfProjectActivity: projectContent?.projectActivity.locationsOfProjectActivity.map(
          (location: any) => {
            return {
              ...location,
              additionalDocuments:
                location.additionalDocuments && location.additionalDocuments?.length > 0
                  ? location.additionalDocuments?.map((document: string, index: number) => {
                      return {
                        uid: index,
                        name: extractFilePropertiesFromLink(document).fileName,
                        status: 'done',
                        url: document,
                      };
                    })
                  : [],
              technicalProjectDescriptionItems: [
                {
                  item: '',
                  parameterValue: [
                    {
                      parameter: '',
                      value: '',
                    },
                  ],
                },
              ],
            };
          }
        ),
      });

      form4.setFieldsValue({
        validationReportFinding: [
          {
            typeOfFinding: '',
            findingNo: '',
            rfToCMA: '',
            actionRequestsByValidationTeam: '',
            summaryOfProjectOwnerResponse: '',
            validationTeamAssessment: '',
            conclusion: [],
          },
        ],
        teamMembers: [
          {
            name: '',
            company: `${t('validationReport:ClimateFund', { countryName: countryName })}`,
            function: '',
            taskPerformed: '',
          },
        ],
        followupInterviews: [
          {
            name: '',
            designation: '',
            organization: '',
          },
        ],
      });

      form5.setFieldsValue({
        employedTechnologies: projectContent?.projectActivity.locationsOfProjectActivity.map(
          (location: any, index: number) => {
            return {
              siteNo: index + 1,
              location: location.locationOfProjectActivity,
              capacity: '',
            };
          }
        ),
        gridEmissionFactorUnit: 'tCO2e/MWh',
        gridEmissionFactorValueGlobal: 0.72222,
        baselineEmissions: [
          ...projectContent?.projectActivity.locationsOfProjectActivity.map(
            (location: any, index: number) => {
              return {
                type: 'value',
                location: location.locationOfProjectActivity,
                projectCapacityValue: '',
                plantFactorValue: '',
                avgEnergyOutputValue: '',
                gridEmissionFactorValue: '',
                emissionReductionValue: '',
              };
            }
          ),
        ],
        estimatedNetEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions?.yearlyGHGEmissionReductions.map(
            (emissionData: any) => {
              return {
                startDate: moment(emissionData.startDate * 1000),
                endDate: moment(emissionData.endDate * 1000),
                baselineEmissionReductions: emissionData.baselineEmissionReductions,
                projectEmissionReductions: emissionData.projectEmissionReductions,
                leakageEmissionReductions: emissionData.leakageEmissionReductions,
                netEmissionReductions: emissionData.netEmissionReductions,
              };
            }
          ),
        totalBaselineEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.totalBaselineEmissionReductions,
        totalProjectEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.totalProjectEmissionReductions,
        totalLeakageEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.totalLeakageEmissionReductions,
        totalNetEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions?.totalNetEmissionReductions,
        avgBaselineEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.avgBaselineEmissionReductions,
        avgProjectEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.avgProjectEmissionReductions,
        avgLeakageEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions
            ?.avgLeakageEmissionReductions,
        avgNetEmissionReductions:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions?.avgNetEmissionReductions,
        totalNumberOfCredingYears:
          projectContent?.quantificationOfGHG?.netGHGEmissionReductions?.totalNumberOfCredingYears,
      });
    } catch (error) {
      console.log('error');
    }
  };

  const handleValuesUpdate = (val: any) => {
    setExistingFormValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
    });

    if (current === 9) {
      const formValues = {
        ...existingFormValues,
        data: { ...existingFormValues.data, appendix: val },
      };
      submitForm(formValues);
    }

    const isFinal = val[ProcessSteps.VR_APPENDIX];
  };

  // const getValidationReportByVersion = async (id: string) => {
  //   try {
  //     const res =
  //       mode === FormMode.VIEW && selectedVersion
  //         ? await post(API_PATHS.DOC_BY_VERSION, {
  //             programmeId: id,
  //             docType: 'validationReport',
  //             version: selectedVersion,
  //           })
  //         : await post(API_PATHS.LAST_DOC_VERSION, {
  //             programmeId: id,
  //             docType: 'validationReport',
  //           });

  //     if (mode === FormMode.VIEW) {
  //       handleDocumentStatus(res.data.status);
  //     }
  //     const validationReportContent = JSON.parse(res.data.content);

  //     const projectDetails = validationReportContent.projectDetails;
  //     const introductionDetails = validationReportContent.introduction;
  //     const ghgProjectDescription = validationReportContent.ghgProjectDescription;
  //     const validationMethodology = validationReportContent.validationMethodology;
  //     const dataForValidationProcess = validationReportContent.dataForValidationProcess;
  //     const validationOpinion = validationReportContent.validationOpinion;
  //     const references = validationReportContent.references;
  //     const appendix = validationReportContent.appendix;

  //     form1.setFieldsValue({
  //       client: projectDetails?.client,
  //       address: projectDetails?.address,
  //       dateOfIssue: moment(projectDetails?.dateOfIssue),
  //       email: projectDetails?.email,
  //       projectTitle: projectDetails?.projectTitle,
  //       reportID: projectDetails?.reportID ? projectDetails?.reportID : projectDetails?.reportNo,
  //       telephone: projectDetails?.telephone,
  //       versionDate: moment(projectDetails?.versionDate),
  //       versionNo: projectDetails?.versionNo,
  //       website: projectDetails?.website,
  //       summary: projectDetails?.summary,
  //       workApprovedBy: projectDetails?.workApprovedBy,
  //       workCarriedOutBy: projectDetails?.workCarriedOutBy,
  //     });

  //     form2.setFieldsValue({
  //       objective: introductionDetails?.objective,
  //       scopeAndCriteria: introductionDetails?.scopeAndCriteria,
  //       titleOfProjectActivity: introductionDetails?.titleOfProjectActivity,
  //       projectParticipant: introductionDetails?.projectParticipant,
  //       hostParty: introductionDetails?.hostParty,
  //       consultant: introductionDetails?.consultant,
  //       summary: introductionDetails?.summary,
  //     });

  //     const projectLocations = ghgProjectDescription.locationsOfProjectActivity.map(
  //       (location: any) => {
  //         return {
  //           technicalProjectDescriptionItems: location.technicalProjectDescription,
  //           locationOfProjectActivity: location.locationOfProjectActivity,
  //           province: location.province,
  //           district: location.district,
  //           dsDivision: location.dsDivision,
  //           city: location.city,
  //           community: location.community,
  //           additionalDocuments: location.additionalDocuments?.map(
  //             (document: string, index: number) => {
  //               return {
  //                 uid: index,
  //                 name: extractFilePropertiesFromLink(document).fileName,
  //                 status: 'done',
  //                 url: document,
  //               };
  //             }
  //           ),
  //           geographicalLocationCoordinates: location.geographicalLocationCoordinates[0][0],
  //         };
  //       }
  //     );

  //     form3.setFieldsValue({
  //       ...ghgProjectDescription,
  //       projectScopeUNFCC: projectScopeList(t)
  //         .filter((item: any) => {
  //           return ghgProjectDescription[item.id];
  //         })
  //         .map((pItem: any) => pItem.id),
  //       locationsOfProjectActivity: projectLocations,
  //       startDateCreditingPeriod: moment(ghgProjectDescription.startDateCreditingPeriod),
  //     });

  //     form4.setFieldsValue({
  //       ...validationMethodology,
  //     });

  //     const netEmissionReduction = dataForValidationProcess.estimatedNetEmissionReductions[0];
  //     form5.setFieldsValue({
  //       ...dataForValidationProcess,
  //       gridEmissionFactorUnit: 'tCO2e/MWh',
  //       gridEmissionFactorValueGlobal: 0.72222,
  //       totalCapacity: `${dataForValidationProcess?.totalCapacity} kWp`,
  //       baselineEmissions: [
  //         ...dataForValidationProcess?.baselineEmissions?.map((emissions: any) => {
  //           return {
  //             location: emissions.location,
  //             projectCapacityValue: emissions.projectCapacityValue,
  //             plantFactorValue: emissions.plantFactorValue,
  //             avgEnergyOutputValue: emissions.avgEnergyOutputValue,
  //             gridEmissionFactorValue: emissions.gridEmissionFactorValue,
  //             emissionReductionValue: emissions.emissionReductionValue,
  //           };
  //         }),
  //       ],
  //       estimatedNetEmissionReductions: netEmissionReduction.yearlyGHGEmissionReductions.map(
  //         (netEmission: any) => {
  //           return {
  //             ...netEmission,
  //             startDate: moment(netEmission.startDate),
  //             endDate: moment(netEmission.endDate),
  //           };
  //         }
  //       ),
  //       totalBaselineEmissionReductions: Number(
  //         netEmissionReduction.totalBaselineEmissionReductions
  //       ),
  //       totalProjectEmissionReductions: Number(netEmissionReduction.totalProjectEmissionReductions),
  //       totalLeakageEmissionReductions: Number(netEmissionReduction.totalLeakageEmissionReductions),
  //       totalNetEmissionReductions: Number(netEmissionReduction.totalNetEmissionReductions),
  //       totalBufferPoolAllocations: Number(netEmissionReduction.totalBufferPoolAllocations),
  //       totalNumberOfCredingYears: Number(netEmissionReduction.totalNumberOfCredingYears),
  //       avgBaselineEmissionReductions: Number(netEmissionReduction.avgBaselineEmissionReductions),
  //       avgProjectEmissionReductions: Number(netEmissionReduction.avgProjectEmissionReductions),
  //       avgLeakageEmissionReductions: Number(netEmissionReduction.avgLeakageEmissionReductions),
  //       avgNetEmissionReductions: Number(netEmissionReduction.avgNetEmissionReductions),
  //       avgBufferPoolAllocations: Number(netEmissionReduction.avgBufferPoolAllocations),
  //     });

  //     form6.setFieldsValue({
  //       opinion: validationOpinion?.opinion,
  //       validator1Signature: [
  //         {
  //           uid: '1',
  //           name: extractFilePropertiesFromLink(validationOpinion.validator1Signature).fileName,
  //           status: 'done',
  //           url: `${validationOpinion.validator1Signature}`,
  //         },
  //       ],
  //       validator1Designation: validationOpinion?.validator1Designation,
  //       validator1Name: validationOpinion?.validator1Name,
  //       validator1DateOfSign: moment(validationOpinion?.validator1DateOfSign),
  //       validator2Designation: validationOpinion?.validator2Designation,
  //       validator2Name: validationOpinion?.validator2Name,
  //       validator2Signature: [
  //         {
  //           uid: '2',
  //           name: extractFilePropertiesFromLink(validationOpinion.validator1Signature).fileName,
  //           status: 'done',
  //           url: validationOpinion.validator2Signature,
  //         },
  //       ],
  //       validator2DateOfSign: moment(validationOpinion?.validator2DateOfSign),
  //     });

  //     form7.setFieldsValue({
  //       references: references?.references,
  //     });

  //     form8.setFieldsValue({
  //       comments: appendix?.comments,
  //       additionalDocuments: appendix.additionalDocuments.map((document: any, index: number) => {
  //         return {
  //           uid: index,
  //           name: extractFilePropertiesFromLink(document).fileName,
  //           status: 'done',
  //           url: document,
  //         };
  //       }),
  //     });
  //   } catch (error) {
  //     console.log('error');
  //   }
  // };

  // useEffect(() => {
  //   getCountryList();
  //   if (programId) {
  //     if (mode === FormMode.VIEW || mode === FormMode.EDIT) {
  //       getValidationReportByVersion(programId);
  //     } else {
  //       getProgrammeDetailsById(programId);
  //       getCMALastVersion(programId);
  //     }
  //   }
  // }, [selectedVersion]);

  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container project-detail-title">
          <div className="title">{t('validationReport:form01Title')}</div>
        </div>
      ),
      description: (
        <BasicInformation
          next={next}
          prev={prev}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_PROJECT_DETAILS]}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          {/* <div className="step-count">01</div> */}
          <div className="title">{t('validationReport:form02Title')}</div>
        </div>
      ),
      description: (
        <GHGProjectDescription
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_INTRODUCTION]}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('validationReport:form03Title')}</div>
        </div>
      ),
      description: (
        <ExecutiveSummary
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
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
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_METHODOLOGY]}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('validationReport:form05Title')}</div>
        </div>
      ),
      description: (
        <MeansOfValidation
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_PROCESS]}
          projectCategory={projectCategory}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t('validationReport:form06Title')}</div>
        </div>
      ),
      description: (
        <ValidationFindings
          next={next}
          prev={prev}
          form={form6}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_PROCESS]}
          projectCategory={projectCategory}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t('validationReport:form07Title')}</div>
        </div>
      ),
      description: (
        <InternalQualityControl
          next={next}
          prev={prev}
          form={form7}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_REFERENCE]}
          formMode={mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('validationReport:form08Title')}</div>
        </div>
      ),
      description: (
        <ValidationOpinion
          next={next}
          prev={prev}
          form={form8}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_OPINION]}
          formMode={mode}
        />
        // <ValidationReportAppendix
        //   next={next}
        //   prev={prev}
        //   form={form8}
        //   current={current}
        //   t={t}
        //   handleValuesUpdate={handleValuesUpdate}
        //   existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
        //   formMode={mode}
        // />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t('validationReport:form09Title')}</div>
        </div>
      ),
      description: (
        <ValidationReportAppendix
          next={next}
          prev={prev}
          form={form9}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
          formMode={mode}
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
