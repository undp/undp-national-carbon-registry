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
import ProjectDetails from './ProjectDetails';
import Reference from './Reference';
import ValicationReportGHGDescriptionOfProjectActivity from './ValicationReportGHGDescriptionOfProjectActivity';
import ValidationMethodology from './ValidationMethodology';
import ValidationOpinion from './ValidationOpinion';
import ValidationReportAppendix from './ValidationReportAppendix';
import { projectScopeList } from './validationReportHelper';
import { extractFilePropertiesFromLink } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

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
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { id: programId } = useParams();
  const { get, post } = useConnection();
  const navigationLocation = useLocation();
  const scrollSection = useRef({} as any);
  const { mode } = navigationLocation.state || {};
  const isEdit = true;

  const [existingFormValues, setExistingFormValues] = useState({
    programmeId: programId,
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

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${programId}`);
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
    const validationData = {
      programmeId: programId,
      content: {
        projectDetails: formValues.content[ProcessSteps.VR_PROJECT_DETAILS],
        introduction: formValues.content[ProcessSteps.VR_INTRODUCTION],
        ghgProjectDescription: formValues.content[ProcessSteps.VR_GHG_PROJECT_DESCRIPTION],
        validationMethodology: formValues.content[ProcessSteps.VR_VALIDATION_METHODOLOGY],
        dataForValidationProcess: formValues.content[ProcessSteps.VR_VALIDATION_PROCESS],
        validationOpinion: formValues.content[ProcessSteps.VR_VALIDATION_OPINION],
        references: formValues.content[ProcessSteps.VR_REFERENCE],
        appendix: formValues.content[ProcessSteps.VR_APPENDIX],
      },
    };

    console.log('Validation Data', validationData);

    try {
      const res = await post('national/programmeSL/validation/create', validationData);
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
        reportNo: `SLCCS/VDR/${new Date().getFullYear()}/${id}`,
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
            company: `${t('validationReport:sriLankaClimateFund')}`,
            function: '',
            taskPerformed: '',
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
              };
            }
          ),
        totalNumberOfCredingYears: projectContent?.projectActivity?.totalCreditingYears,
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

  const handleValuesUpdate = (val: any) => {
    setExistingFormValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.content,
        ...val,
      };
      return { ...prevVal, content: tempContent };
    });

    if (current === 7) {
      const formValues = { ...existingFormValues };
      formValues.content[ProcessSteps.VR_APPENDIX] = val[ProcessSteps.VR_APPENDIX];
      submitForm(formValues);
    }

    const isFinal = val[ProcessSteps.VR_APPENDIX];
    // {
    //   projectDetails: {
    //     client: '',
    //     dateOfIssue: '',
    //     versionNo: '',
    //     versionDate: '',
    //     telephone: '',
    //     address: '',
    //     email: '',
    //     website: '',
    //     summary: '',
    //     projectTitle: '',
    //     reportNo: '',
    //     workCarriedOutBy: '',
    //     workApprovedBy: '',
    //   },
    //   introduction: {
    //     objective: '',
    //     scopeAndCriteria: '',
    //     titleOfProjectActivity: '',
    //     projectParticipant: '',
    //     hostParty: '',
    //     consultant: '',
    //     summary: '',
    //   },
    //   ghgProjectDescription: {
    //     projectTitle: '',
    //     projectSize: 'SMALL',
    //     isProjectScopeEnergyIndustries: '',
    //     isProjectScopeEnergyDistribution: '',
    //     isProjectScopeEnergyDemand: '',
    //     isProjectScopeManufacturingIndustries: '',
    //     isProjectScopeChemicalIndustries: '',
    //     isProjectScopeChemicalIndustry: '',
    //     isProjectScopeConstruction: '',
    //     isProjectScopeTransport: '',
    //     isProjectScopeMining: '',
    //     isProjectScopeFugitiveEmissionsFromFuel: '',
    //     isProjectScopeFugitiveEmissionsFromHalocarbons: '',
    //     isProjectScopeSolventsUse: '',
    //     isProjectScopeWasteHandling: '',
    //     isProjectScopeAfforestation: '',
    //     isProjectScopeAgriculture: '',
    //     appliedMethodology: '',
    //     technicalAreas: '',
    //     creditingPeriod: '',
    //     startDateCreditingPeriod: '',
    //     locationsOfProjectActivity: [
    //       {
    //         locationOfProjectActivity: '',
    //         province: '',
    //         district: '',
    //         dsDivision: '',
    //         city: '',
    //         community: '',
    //         geographicalLocationCoordinates: '',
    //         additionalDocuments: '',
    //         technicalProjectDescription: [
    //           {
    //             item: '',
    //             parameterValue: [{ parameter: '', value: '' }],
    //           },
    //         ],
    //       },
    //     ],
    //   },
    //   validationMethodology: {
    //     teamMembers: [
    //       {
    //         name: '',
    //         function: [],
    //         taskPerformed: [],
    //       },
    //     ],
    //     cmaPublicReview: '',
    //     onsiteInspection: '',
    //     followupInterviews: [
    //       {
    //         name: '',
    //         designation: '',
    //         organization: '',
    //         method: '',
    //         mainTopicsCovered: '',
    //       },
    //     ],
    //     validationReportFinding: [
    //       {
    //         typeOfFinding: 'CL',
    //         findingNo: '',
    //         rfToCMA: '',
    //         actionRequestsByValidationTeam: '',
    //         summaryOfProjectOwnerResponse: '',
    //         validationTeamAssessment: '',
    //         conclusion: 'CONCLUSION_1',
    //       },
    //     ],
    //     generalDescriptionNoOfCAR: 1,
    //     generalDescriptionNoOfCL: 1,
    //     generalDescriptionNoOfFAR: 1,
    //     involvedPartiesNoOfCAR: 1,
    //     involvedPartiesNoOfCL: 1,
    //     involvedPartiesNoOfFAR: 1,
    //     projectSpecificationNoOfCAR: 1,
    //     projectSpecificationNoOfCL: 1,
    //     projectSpecificationNoOfFAR: 1,
    //     startDateNoOfCAR: 1,
    //     startDateNoOfCL: 1,
    //     startDateNoOfFAR: 1,
    //     technicalProjectDescriptionNoOfCAR: 1,
    //     technicalProjectDescriptionNoOfCL: 1,
    //     technicalProjectDescriptionNoOfFAR: 1,
    //     contributionToSustainableDevelopmentNoOfCAR: 1,
    //     contributionToSustainableDevelopmentNoOfCL: 1,
    //     contributionToSustainableDevelopmentNoOfFAR: 1,
    //     technologyEmployedNoOfCAR: 1,
    //     technologyEmployedNoOfCL: 1,
    //     technologyEmployedNoOfFAR: 1,
    //     applicationOfMethodologyNoOfCAR: 1,
    //     applicationOfMethodologyNoOfCL: 1,
    //     applicationOfMethodologyNoOfFAR: 1,
    //     baselineIdentificationNoOfCAR: 1,
    //     baselineIdentificationNoOfCL: 1,
    //     baselineIdentificationNoOfFAR: 1,
    //     calculationOfGHGEmissionNoOfCAR: 1,
    //     calculationOfGHGEmissionNoOfCL: 1,
    //     calculationOfGHGEmissionNoOfFAR: 1,
    //     additionalityDeterminationNoOfCAR: 1,
    //     additionalityDeterminationNoOfCL: 1,
    //     additionalityDeterminationNoOfFAR: 1,
    //     monitoringMethodologyNoOfCAR: 1,
    //     monitoringMethodologyNoOfCL: 1,
    //     monitoringMethodologyNoOfFAR: 1,
    //     monitoringPlanNoOfCAR: 1,
    //     monitoringPlanNoOfFAR: 1,
    //     projectManagementPlanningNoOfCAR: 1,
    //     projectManagementPlanningNoOfCL: 1,
    //     projectManagementPlanningNoOfFAR: 1,
    //     durationOfProjectSpecificSection: 1,
    //     durationOfProjectNoOfCAR: 1,
    //     durationOfProjectNoOfCL: 1,
    //     durationOfProjectNoOfFAR: 1,
    //     environmentalImpactsSpecificSection: 1,
    //     environmentalImpactsNoOfCAR: 1,
    //     environmentalImpactsNoOfCL: 1,
    //     environmentalImpactsNoOfFAR: 1,
    //     stakeholderCommentsSpecificSection: 1,
    //     stakeholderCommentsNoOfCAR: 1,
    //     stakeholderCommentsNoOfCL: 1,
    //     stakeholderCommentsNoOfFAR: 1,
    //     sumNoOfCAR: 1,
    //     sumNoOfCL: 1,
    //     sumNoOfFAR: 1,
    //     finalValidation: 1,
    //     internalTechnicalReview: 1,
    //     finalApproval: 1,
    //   },
    //   dataForValidationProcess: {
    //     generalDescription: '',
    //     employedTechnologies: [
    //       {
    //         siteNo: 12,
    //         location: '',
    //         capacity: '',
    //       },
    //     ],
    //     totalCapacity: 1,
    //     approvals: '',
    //     applicationOfMethodologyTitle: '',
    //     applicationOfMethodologyApplicability: '',
    //     applicabilityCriteria1ProjectActivity: '',
    //     isApplicabilityCriteria1Met: '',
    //     applicabilityCriteria2ProjectActivity: '',
    //     isApplicabilityCriteria2Met: '',
    //     applicabilityCriteria3ProjectActivity: '',
    //     isApplicabilityCriteria3Met: '',
    //     applicabilityCriteria4ProjectActivity: '',
    //     isApplicabilityCriteria4Met: '',
    //     applicabilityCriteria5ProjectActivity: '',
    //     isApplicabilityCriteria5Met: '',
    //     applicabilityCriteria6ProjectActivity: '',
    //     isApplicabilityCriteria6Met: '',
    //     applicabilityCriteria7ProjectActivity: '',
    //     isApplicabilityCriteria7Met: '',
    //     applicabilityCriteria8ProjectActivity: '',
    //     isApplicabilityCriteria8Met: '',
    //     applicabilityCriteria9ProjectActivity: '',
    //     isApplicabilityCriteria9Met: '',
    //     applicabilityCriteria10ProjectActivity: '',
    //     isApplicabilityCriteria10Met: '',
    //     projectBoundary: '',
    //     baselineIdentification: '',
    //     formulasUsedToDetermineEmissionReductions: '',
    //     calculationOfBaselineEmissionFactor: '',
    //     gridEmissionFactorValue: '',
    //     gridEmissionFactorUnit: '',
    //     plantFactor: '',
    //     annualEmissionReductionCalculation: '',
    //     baselineEmissions: [
    //       {
    //         location: '',
    //         projectCapacityValue: 1,
    //         plantFactorValue: 1,
    //         avgEnergyOutputValue: 1,
    //         gridEmissionFactorValue: 1,
    //         emissionReductionValue: 1,
    //       },
    //     ],
    //     projectEmission: '',
    //     leakageEmission: '',
    //     estimatedNetEmissionReductions: [
    //       {
    //         yearlyGHGEmissionReductions: [
    //           {
    //             startDate: 212,
    //             endDate: 212,
    //             baselineEmissionReductions: 212,
    //             projectEmissionReductions: 212,
    //             leakageEmissionReductions: 212,
    //             netEmissionReductions: 212,
    //             bufferPoolAllocation: 212,
    //           },
    //         ],
    //         totalBaselineEmissionReductions: 1,
    //         totalProjectEmissionReductions: 1,
    //         totalLeakageEmissionReductions: 1,
    //         totalNetEmissionReductions: 1,
    //         totalBufferPoolAllocations: 1,
    //         totalNumberOfCredingYears: 1,
    //         avgBaselineEmissionReductions: 1,
    //         avgProjectEmissionReductions: 1,
    //         avgLeakageEmissionReductions: 1,
    //         avgNetEmissionReductions: 1,
    //         avgBufferPoolAllocations: 1,
    //       },
    //     ],
    //     methodologyDeviations: '',
    //     monitoringPlan: '',
    //     carbonManagementAssessment: '',
    //     changesOfProjectActivity: '',
    //     environmentImpact: '',
    //     commentsOfStakeholders: '',
    //   },
    //   validationOpinion: {
    //     opinion: '',
    //     validator1Signature: '',
    //     validator1Name: '',
    //     validator1Designation: '',
    //     validator1DateOfSign: 22222,
    //     validator2Signature: '',
    //     validator2Name: '',
    //     validator2Designation: '',
    //     validator2DateOfSign: 2222,
    //   },
    //   references: {
    //     references: '',
    //   },
    //   appendix: {
    //     comments: '',
    //     additionalDocuments: [],
    //   },
    // }
  };

  const getValidationReportLastVersion = async (id: string) => {
    try {
      const {
        data: { content },
      } = await post('national/programmeSL/getDocLastVersion', {
        programmeId: id,
        docType: 'validationReport',
      });

      const validationReportContent = JSON.parse(content);
      console.log(validationReportContent);

      const projectDetails = validationReportContent.projectDetails;
      const introductionDetails = validationReportContent.introduction;
      const ghgProjectDescription = validationReportContent.ghgProjectDescription;
      const validationMethodology = validationReportContent.validationMethodology;
      const dataForValidationProcess = validationReportContent.dataForValidationProcess;
      const validationOpinion = validationReportContent.validationOpinion;
      const references = validationReportContent.references;
      const appendix = validationReportContent.appendix;

      form1.setFieldsValue({
        client: projectDetails?.client,
        address: projectDetails?.address,
        dateOfIssue: moment(projectDetails?.dateOfIssue),
        email: projectDetails?.email,
        projectTitle: projectDetails?.projectTitle,
        reportNo: projectDetails?.reportNo,
        telephone: projectDetails?.telephone,
        versionDate: moment(projectDetails?.versionDate),
        versionNo: projectDetails?.versionNo,
        website: projectDetails?.website,
        summary: projectDetails?.summary,
        workApprovedBy: projectDetails?.workApprovedBy,
        workCarriedOutBy: projectDetails?.workCarriedOutBy,
      });

      form2.setFieldsValue({
        objective: introductionDetails?.objective,
        scopeAndCriteria: introductionDetails?.scopeAndCriteria,
        titleOfProjectActivity: introductionDetails?.titleOfProjectActivity,
        projectParticipant: introductionDetails?.projectParticipant,
        hostParty: introductionDetails?.hostParty,
        consultant: introductionDetails?.consultant,
        summary: introductionDetails?.summary,
      });

      const projectLocations = ghgProjectDescription.locationsOfProjectActivity.map(
        (location: any) => {
          return {
            technicalProjectDescriptionItems: location.technicalProjectDescription,
            locationOfProjectActivity: location.locationOfProjectActivity,
            province: location.province,
            district: location.district,
            dsDivision: location.dsDivision,
            city: location.city,
            community: location.community,
            additionalDocuments: location.additionalDocuments?.map(
              (document: string, index: number) => {
                return {
                  uid: index,
                  name: extractFilePropertiesFromLink(document).fileName,
                  status: 'done',
                  url: document,
                };
              }
            ),
            geographicalLocationCoordinates: location.geographicalLocationCoordinates[0][0],
          };
        }
      );

      form3.setFieldsValue({
        ...ghgProjectDescription,
        projectScopeUNFCC: projectScopeList(t)
          .filter((item: any) => {
            return ghgProjectDescription[item.id];
          })
          .map((pItem: any) => pItem.id),
        locationsOfProjectActivity: projectLocations,
        startDateCreditingPeriod: moment(ghgProjectDescription.startDateCreditingPeriod),
      });

      form4.setFieldsValue({
        ...validationMethodology,
      });

      const netEmissionReduction = dataForValidationProcess.estimatedNetEmissionReductions[0];
      form5.setFieldsValue({
        ...dataForValidationProcess,
        gridEmissionFactorUnit: 'tCO2e/MWh',
        gridEmissionFactorValueGlobal: 0.72222,
        totalCapacity: `${dataForValidationProcess?.totalCapacity} kWp`,
        baselineEmissions: [
          ...dataForValidationProcess?.baselineEmissions?.map((emissions: any) => {
            return {
              location: emissions.location,
              projectCapacityValue: emissions.projectCapacityValue,
              plantFactorValue: emissions.plantFactorValue,
              avgEnergyOutputValue: emissions.avgEnergyOutputValue,
              gridEmissionFactorValue: emissions.gridEmissionFactorValue,
              emissionReductionValue: emissions.emissionReductionValue,
            };
          }),
        ],
        estimatedNetEmissionReductions: netEmissionReduction.yearlyGHGEmissionReductions.map(
          (netEmission: any) => {
            return {
              ...netEmission,
              startDate: moment(netEmission.startDate),
              endDate: moment(netEmission.endDate),
            };
          }
        ),
        totalBaselineEmissionReductions: Number(
          netEmissionReduction.totalBaselineEmissionReductions
        ),
        totalProjectEmissionReductions: Number(netEmissionReduction.totalProjectEmissionReductions),
        totalLeakageEmissionReductions: Number(netEmissionReduction.totalLeakageEmissionReductions),
        totalNetEmissionReductions: Number(netEmissionReduction.totalNetEmissionReductions),
        totalBufferPoolAllocations: Number(netEmissionReduction.totalBufferPoolAllocations),
        totalNumberOfCredingYears: Number(netEmissionReduction.totalNumberOfCredingYears),
        avgBaselineEmissionReductions: Number(netEmissionReduction.avgBaselineEmissionReductions),
        avgProjectEmissionReductions: Number(netEmissionReduction.avgProjectEmissionReductions),
        avgLeakageEmissionReductions: Number(netEmissionReduction.avgLeakageEmissionReductions),
        avgNetEmissionReductions: Number(netEmissionReduction.avgNetEmissionReductions),
        avgBufferPoolAllocations: Number(netEmissionReduction.avgBufferPoolAllocations),
      });

      form6.setFieldsValue({
        opinion: validationOpinion?.opinion,
        validator1Signature: [
          {
            uid: '1',
            name: extractFilePropertiesFromLink(validationOpinion.validator1Signature).fileName,
            status: 'done',
            url: `${validationOpinion.validator1Signature}`,
          },
        ],
        validator1Designation: validationOpinion?.validator1Designation,
        validator1Name: validationOpinion?.validator1Name,
        validator1DateOfSign: moment(validationOpinion?.validator1DateOfSign),
        validator2Designation: validationOpinion?.validator2Designation,
        validator2Name: validationOpinion?.validator2Name,
        validator2Signature: [
          {
            uid: '2',
            name: extractFilePropertiesFromLink(validationOpinion.validator1Signature).fileName,
            status: 'done',
            url: validationOpinion.validator2Signature,
          },
        ],
        validator2DateOfSign: moment(validationOpinion?.validator2DateOfSign),
      });

      form7.setFieldsValue({
        references: references?.references,
      });

      form8.setFieldsValue({
        comments: appendix?.comments,
        additionalDocuments: appendix.additionalDocuments.map((document: any, index: number) => {
          return {
            uid: index,
            name: extractFilePropertiesFromLink(document).fileName,
            status: 'done',
            url: document,
          };
        }),
      });

      // form5.setFieldsValue({
      //   employedTechnologies: projectContent?.projectActivity.locationsOfProjectActivity.map(
      //     (location: any, index: number) => {
      //       return {
      //         siteNo: index + 1,
      //         location: location.locationOfProjectActivity,
      //         capacity: '',
      //       };
      //     }
      //   ),
      //   gridEmissionFactorUnit: 'tCO2e/MWh',
      //   gridEmissionFactorValueGlobal: 0.72222,
      //   baselineEmissions: [
      //     {
      //       type: 'unit',
      //       location: t('validationReport:units'),
      //       projectCapacityValue: 'kWp',
      //       plantFactorValue: '%',
      //       avgEnergyOutputValue: 'MWh/Year',
      //       gridEmissionFactorValue: 'tCO2/MWh',
      //       emissionReductionValue: 'tCO2/Yea',
      //     },
      //     ...projectContent?.projectActivity.locationsOfProjectActivity.map(
      //       (location: any, index: number) => {
      //         return {
      //           type: 'value',
      //           location: location.locationOfProjectActivity,
      //           projectCapacityValue: '',
      //           plantFactorValue: '',
      //           avgEnergyOutputValue: '',
      //           gridEmissionFactorValue: '',
      //           emissionReductionValue: '',
      //         };
      //       }
      //     ),
      //   ],
      //   estimatedNetEmissionReduction:
      //     projectContent?.quantificationOfGHG?.netGHGEmissionReductions?.yearlyGHGEmissionReductions.map(
      //       (emissionData: any) => {
      //         return {
      //           startDate: moment(emissionData.startDate * 1000),
      //           endDate: moment(emissionData.endDate * 1000),
      //         };
      //       }
      //     ),
      //   totalNumberOfCredingYears: projectContent?.projectActivity?.totalCreditingYears,
      // });

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
      if (mode === FormMode.VIEW || mode === FormMode.EDIT) {
        getValidationReportLastVersion(programId);
      } else {
        getProgrammeDetailsById(programId);
        getCMALastVersion(programId);
      }
    }
  }, []);

  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container project-detail-title">
          {/* <div className="step-count">00</div> */}
          <div className="title">{t('validationReport:form01Title')}</div>
        </div>
      ),
      description: (
        <ProjectDetails
          next={next}
          prev={prev}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_PROJECT_DETAILS]}
          formMode={mode}
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
          formMode={mode}
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
          formMode={mode}
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
          formMode={mode}
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
          projectCategory={projectCategory}
          formMode={mode}
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
          formMode={mode}
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
          formMode={mode}
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
          form={form8}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
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
