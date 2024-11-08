import React, { useEffect, useState } from 'react';
import { Steps, Button, Form, message } from 'antd';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import './MonitoringReport.scss';
import { ProjectActivityStep } from './ProjectActivityStep';
import { ImplementationStatusStep } from './ImplementationStatusStep';
import { SafeguardsStep } from './SafeguardsStep';
import { DataAndParametersStep } from './DataAndParametersStep';
import { QualificationStep } from './QuantificationStep';
import { AnnexuresStep } from './AnnexuresStep';
import { useForm } from 'antd/lib/form/Form';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { DocumentTypeEnum } from '../../../Definitions/Enums/document.type.enum';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import {
  extractFilePropertiesFromLink,
  fileUploadValueExtract,
} from '../../../Utils/utilityHelper';
import { VerificationRequestStatusEnum } from '../../../Definitions/Enums/verification.request.status.enum';
const StepperComponent = (props: any) => {
  const navigate = useNavigate();
  const { useLocation, translator, countries } = props;
  const [current, setCurrent] = useState(0);
  const [verificationRequestId, setVerificationRequestId] = useState(0);
  const [reportId, setReportId] = useState(0);
  const [formValues, setFormValues] = useState({});
  const { get, post } = useConnection();
  const { id } = useParams();
  const navigationLocation = useLocation();
  const [projectCategory, setProjectCategory] = useState<string>('');
  const { mode } = navigationLocation.state || {};
  const t = translator.t;
  const reportVersion = process.env.MONITORING_REPORT_VERSION
    ? process.env.MONITORING_REPORT_VERSION
    : 'Version 03';
  const onValueChange = (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    console.log(JSON.stringify(formValues));
  };

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };
  const approve = async (verify: boolean) => {
    const body = {
      verify: verify,
      verificationRequestId: verificationRequestId,
      reportId: reportId,
    };
    try {
      const res = await post('national/verification/verifyMonitoringReport', body);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: verify
            ? t('monitoringReport:monitoringReportApproveSuccess')
            : t('monitoringReport:monitoringReportRejectSuccess'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate(`/programmeManagementSLCF/view/${id}`);
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

  const getProgrammeDetailsById = async () => {
    try {
      const { data } = await post('national/programmeSL/getProjectById', {
        programmeId: id,
      });

      const {
        data: { user },
      } = await get('national/User/profile');

      setProjectCategory(data?.projectCategory);
    } catch (error) {
      console.log('error');
    }
  };

  const onFinish = async (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    if (FormMode.VIEW === mode) {
      navigateToDetailsPage();
    } else {
      const content = { ...formValues, ...newValues };

      content.projectActivity.creditingPeriodFromDate = moment(
        content?.projectActivity?.creditingPeriodFromDate
      )
        .startOf('day')
        .valueOf();
      content.projectActivity.creditingPeriodToDate = moment(
        content?.projectActivity?.creditingPeriodToDate
      )
        .startOf('day')
        .valueOf();
      content.projectActivity.registrationDateOfTheActivity = moment(
        content?.projectActivity?.registrationDateOfTheActivity
      )
        .startOf('day')
        .valueOf();
      await content.projectActivity?.projectActivityLocationsList?.forEach(async (val: any) => {
        val.projectStartDate = moment(val?.projectStartDate).startOf('day').valueOf();
        val.optionalDocuments = await fileUploadValueExtract(val, 'optionalDocuments');
      });

      content.projectDetails.dateOfIssue = moment(content?.projectDetails?.dateOfIssue)
        .startOf('day')
        .valueOf();

      content?.quantification?.emissionReductionsRemovalsList?.forEach((val: any) => {
        val.startDate = moment(content?.quantification?.startDate).startOf('day').valueOf();
        val.endDate = moment(content?.quantification?.endDate).startOf('day').valueOf();
      });
      content.quantifications.optionalDocuments = await fileUploadValueExtract(
        content?.quantifications,
        'optionalDocuments'
      );

      content.annexures.optionalDocuments = await fileUploadValueExtract(
        content?.annexures,
        'optionalDocuments'
      );
      const body = { content: JSON.stringify(content), programmeId: id };
      try {
        const res = await post('national/verification/createMonitoringReport', body);
        if (res?.statusText === 'SUCCESS') {
          message.open({
            type: 'success',
            content: t('monitoringReport:uploadMonitoringReportSuccess'),
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
          navigateToDetailsPage();
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

  const getLatestReports = async (programId: any) => {
    try {
      const { data } = await post('national/programmeSl/getDocLastVersion', {
        programmeId: programId,
        docType: DocumentTypeEnum.CMA,
      });

      if (data && data?.content) {
        const cmaData = JSON.parse(data?.content);

        projectDetailsForm.setFieldsValue({
          title: cmaData?.projectDetails?.title,
          projectProponent: cmaData?.projectDetails?.projectProponent,
          dateOfIssue: moment(cmaData?.projectDetails?.dateOfIssue),
          version: reportVersion,
          physicalAddress: cmaData?.projectDetails?.physicalAddress,
          email: cmaData?.projectDetails?.email,
          telephone: cmaData?.projectDetails?.telephone,
          website: cmaData?.projectDetails?.website,
          preparedBy: cmaData?.projectDetails?.preparedBy,
        });

        qualificationForm.setFieldsValue({
          estimatedNetEmissionReductions:
            cmaData?.quantifications?.estimatedNetEmissionReductions.map((emissionData: any) => {
              return {
                startDate: moment(emissionData.startDate * 1000),
                endDate: moment(emissionData.endDate * 1000),
                baselineEmissionReductions: emissionData.baselineEmissionReductions,
                projectEmissionReductions: emissionData.projectEmissionReductions,
                leakageEmissionReductions: emissionData.leakageEmissionReductions,
                netEmissionReductions: emissionData.netEmissionReductions,
              };
            }),
        });
      }
    } catch (error) {
      console.log('error');
    }

    try {
      const response: any = await get(`national/verification?programmeId=${programId}`);
      if (
        (response &&
          response.data &&
          response.data.length &&
          (response.data[0].status === VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED ||
            response.data[0].status ===
              VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED)) ||
        !(response && response.data && response.data.length)
      ) {
        projectActivityForm.setFieldsValue({
          projectProponentsList: [
            {
              organizationName: '',
              email: '',
              telephone: '',
              address: '',
              designation: '',
              contactPerson: '',
              roleInTheProject: '',
              fax: '',
            },
          ],
          projectActivityLocationsList: [
            {
              locationOfProjectActivity: '',
              province: '',
              district: '',
              dsDivision: '',
              city: '',
              community: '',
              optionalDocuments: [],
              projectStartDate: '',
            },
          ],
        });
        qualificationForm.setFieldsValue({
          estimatedNetEmissionReductions: [
            {
              startDate: '',
              endDate: '',
              baselineEmissionReductions: '',
              projectEmissionReductions: '',
              leakageEmissionReductions: '',
              netEmissionReductions: '',
            },
          ],
        });
      } else {
        const { data } = await post('national/programmeSl/getDocLastVersion', {
          programmeId: programId,
          docType: DocumentTypeEnum.MONITORING_REPORT,
        });
        if (data && data?.content) {
          setReportId(data?.id);
          setVerificationRequestId(data?.verificationRequestId);
          projectDetailsForm.setFieldsValue({
            ...data?.content?.projectDetails,
            dateOfIssue: moment(data?.content?.projectDetails?.dateOfIssue),
          });

          projectActivityForm.setFieldsValue({
            ...data?.content?.projectActivity,
            creditingPeriodFromDate: moment(
              data?.content?.projectActivity?.creditingPeriodFromDate
            ),
            creditingPeriodToDate: moment(data?.content?.projectActivity?.creditingPeriodToDate),
            registrationDateOfTheActivity: moment(
              data?.content?.projectActivity?.registrationDateOfTheActivity
            ),
            projectActivityLocationsList:
              data?.content?.projectActivity?.projectActivityLocationsList?.map((val: any) => {
                return {
                  ...val,
                  projectStartDate: moment(val?.projectStartDate),
                  optionalDocuments: val?.optionalDocuments?.map(
                    (document: string, index: number) => {
                      return {
                        uid: index,
                        name: extractFilePropertiesFromLink(document).fileName,
                        status: 'done',
                        url: document,
                      };
                    }
                  ),
                };
              }),
          });
          qualificationForm.setFieldsValue({
            ...data?.content?.quantifications,
            optionalDocuments: data?.content?.quantifications?.optionalDocuments?.map(
              (document: string, index: number) => {
                return {
                  uid: index,
                  name: extractFilePropertiesFromLink(document).fileName,
                  status: 'done',
                  url: document,
                };
              }
            ),

            estimatedNetEmissionReductions:
              data?.content?.quantifications?.estimatedNetEmissionReductions?.map(
                (netEmission: any) => {
                  return {
                    ...netEmission,
                    startDate: moment(netEmission.startDate),
                    endDate: moment(netEmission.endDate),
                  };
                }
              ),
          });
          implementationStatusForm.setFieldsValue({
            ...data?.content?.implementationStatus,
          });
          safeguardsForm.setFieldsValue({
            ...data?.content?.safeguards,
          });
          dataAndParametersForm.setFieldsValue({
            ...data?.content?.dataAndParameters,
          });
          annexuresForm.setFieldsValue({
            ...data?.content?.annexures,
            optionalDocuments: data?.content?.annexures?.optionalDocuments?.map(
              (document: string, index: number) => {
                return {
                  uid: index,
                  name: extractFilePropertiesFromLink(document).fileName,
                  status: 'done',
                  url: document,
                };
              }
            ),
          });
        }
      }
    } catch (error) {
      console.log('error');
    }
  };

  useEffect(() => {
    getLatestReports(id);
    getProgrammeDetailsById();
  }, []);

  useEffect(() => {
    // loadProjectDetails();
    // loadCMAForm();
  }, []);
  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          {/* <div className="step-count"></div> */}
          <div className="title">{t('monitoringReport:title01')}</div>
        </div>
      ),
      description: (
        <ProjectDetailsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={projectDetailsForm}
          formMode={mode}
          next={next}
          cancel={navigateToDetailsPage}
          countries={countries}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('monitoringReport:title02')}</div>
        </div>
      ),
      description: (
        <ProjectActivityStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={projectActivityForm}
          formMode={mode}
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
          <div className="step-count">02</div>
          <div className="title">{t('monitoringReport:title03')}</div>
        </div>
      ),
      description: (
        <ImplementationStatusStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={implementationStatusForm}
          formMode={mode}
          next={next}
          prev={prev}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t('monitoringReport:title04')}</div>
        </div>
      ),
      description: (
        <SafeguardsStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={safeguardsForm}
          formMode={mode}
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
          <div className="title">{t('monitoringReport:title05')}</div>
        </div>
      ),
      description: (
        <DataAndParametersStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={dataAndParametersForm}
          formMode={mode}
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
          <div className="title">{t('monitoringReport:title06')}</div>
        </div>
      ),
      description: (
        <QualificationStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={qualificationForm}
          formMode={mode}
          next={next}
          prev={prev}
          projectCategory={projectCategory}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t('monitoringReport:title07')}</div>
        </div>
      ),
      description: (
        <AnnexuresStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={annexuresForm}
          formMode={mode}
          prev={prev}
          cancel={navigateToDetailsPage}
          approve={() => {
            approve(true);
          }}
          reject={() => {
            approve(false);
          }}
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
