import React, { useEffect, useRef, useState } from 'react';
import { Steps, Button, Form, message } from 'antd';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import './MonitoringReport.scss';
import { ProjectActivityStep } from './ProjectActivityStep';
import { ImplementationStatusStep } from './ImplementationStatusStep';
import { SafeguardsStep } from './SafeguardsStep';
import { DataAndParametersStep } from './DataAndParametersStep';
import { QualificationStep } from './QuantificationStep';
import { AnnexureStep } from './AnnexureStep';
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
import { SlcfFormActionModel } from '../../Models/SlcfFormActionModel';
import { PopupInfo } from '../../../Definitions/Definitions/ndcDetails.definitions';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
const StepperComponent = (props: any) => {
  const navigate = useNavigate();
  const { useLocation, translator, countries, selectedVersion, handleDocumentStatus } = props;
  const [current, setCurrent] = useState(0);
  // const [verificationRequestId, setVerificationRequestId] = useState(0);
  const [reportId, setReportId] = useState(0);
  const [status, setStatus] = useState(null);
  const [formValues, setFormValues] = useState({});
  const { get, post } = useConnection();
  const { id, verificationRequestId } = useParams();
  const navigationLocation = useLocation();
  const [projectCategory, setProjectCategory] = useState<string>('');
  const { mode, docId } = navigationLocation.state || {};
  const t = translator.t;
  const [popupInfo, setPopupInfo] = useState<PopupInfo>();
  const [slcfActionModalVisible, setSlcfActioModalVisible] = useState<boolean>(false);

  const onValueChange = (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
  };

  const scrollSection = useRef({} as any);

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };

  const showModalOnAction = (info: PopupInfo) => {
    setSlcfActioModalVisible(true);
    setPopupInfo(info);
  };

  const approveOrReject = async (verify: boolean, remark?: string) => {
    const body = {
      verify: verify,
      verificationRequestId: Number(verificationRequestId),
      reportId: reportId,
      remark,
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
      // if (docId === null) {
      if (mode === FormMode.CREATE) {
        const { data } = await post('national/programmeSl/getDocLastVersion', {
          programmeId: programId,
          docType: DocumentTypeEnum.CMA,
        });

        if (data && data?.content) {
          const cmaData = JSON.parse(data?.content);

          projectDetailsForm.setFieldsValue({
            title: cmaData?.projectDetails?.title,
            projectProponent: cmaData?.projectDetails?.projectProponent,
            dateOfIssue: moment(Date.now()),
            physicalAddress: cmaData?.projectDetails?.physicalAddress,
            email: cmaData?.projectDetails?.email,
            telephone: cmaData?.projectDetails?.telephone,
            website: cmaData?.projectDetails?.website,
            preparedBy: cmaData?.projectDetails?.preparedBy,
          });

          projectActivityForm.setFieldsValue({
            pp_organizationName: cmaData?.projectActivity?.projectProponent?.organizationName,
            pp_contactPerson: cmaData?.projectActivity?.projectProponent?.contactPerson,
            pp_telephone: cmaData?.projectActivity?.projectProponent?.telephone,
            pp_email: cmaData?.projectActivity?.projectProponent?.email,
            pp_address: cmaData?.projectActivity?.projectProponent?.address,
            projectProponentsList: cmaData?.projectActivity.otherEntities.map((entity: any) => {
              return {
                ...entity,
                organizationName: entity?.orgainzationName,
              };
            }),
            creditingPeriodFromDate: moment(
              cmaData?.projectActivity?.creditingPeriodStartDate * 1000
            ),
            creditingPeriodToDate: moment(cmaData?.projectActivity?.creditingPeriodEndDate * 1000),
            creditingPeriodComment: cmaData?.projectActivity?.creditingPeriodDescription,
            projectTrackAndCreditUse: cmaData?.projectActivity?.projectTrack,
            projectActivityLocationsList: cmaData?.projectActivity?.locationsOfProjectActivity?.map(
              (location: any) => {
                return {
                  ...location,
                  optionalDocuments:
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
                  location: location?.geographicalLocationCoordinates,
                  projectStartDate: moment(location?.startDate * 1000),
                };
              }
            ),
          });
        }

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
      } else if (mode === FormMode.VIEW || mode === FormMode.EDIT) {
        // const { data } = await post('national/programmeSl/getDocumentById', {
        //   docId: docId,
        // });

        const { data } =
          mode === FormMode.VIEW && selectedVersion
            ? await post('national/programmeSl/getVerificationDocByVersion', {
                programmeId: id,
                docType: DocumentTypeEnum.MONITORING_REPORT,
                version: selectedVersion,
                verificationRequestId: Number(verificationRequestId),
              })
            : await post('national/programmeSl/getVerificationDocLastVersion', {
                programmeId: id,
                docType: DocumentTypeEnum.MONITORING_REPORT,
                verificationRequestId: Number(verificationRequestId),
              });

        if (mode === FormMode.VIEW) {
          handleDocumentStatus(data.status);
        }
        if (data && data?.content) {
          setReportId(data?.id);
          setStatus(data?.status);
          // setVerificationRequestId(data?.verificationRequestId);
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
  }, [selectedVersion]);

  useEffect(() => {
    getLatestReports(id);
  }, []);
  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container">
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
        <AnnexureStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          status={status}
          form={annexuresForm}
          formMode={mode}
          prev={prev}
          cancel={navigateToDetailsPage}
          approve={() => {
            showModalOnAction({
              actionBtnText: t('monitoringReport:btnApprove'),
              icon: <CheckCircleOutlined />,
              title: t('monitoringReport:approveMonitoringModalTitle'),
              okAction: () => {
                approveOrReject(true);
              },
              remarkRequired: false,
              type: 'primary',
            });
          }}
          reject={() => {
            showModalOnAction({
              actionBtnText: t('monitoringReport:btnReject'),
              icon: <CloseCircleOutlined />,
              title: t('monitoringReport:rejectMonitoringModalTitle'),
              okAction: (remark: string) => {
                approveOrReject(false, remark);
              },
              remarkRequired: true,
              type: 'danger',
            });
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
      {popupInfo && (
        <SlcfFormActionModel
          onCancel={() => {
            setSlcfActioModalVisible(false);
          }}
          actionBtnText={popupInfo!.actionBtnText}
          onFinish={popupInfo!.okAction}
          subText={''}
          openModal={slcfActionModalVisible}
          icon={popupInfo!.icon}
          title={popupInfo!.title}
          type={popupInfo!.type}
          remarkRequired={popupInfo!.remarkRequired}
          t={t}
        />
      )}
    </>
  );
};

export default StepperComponent;
