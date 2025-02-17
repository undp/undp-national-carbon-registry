import React, { useEffect, useState } from 'react';
import { Steps, message } from 'antd';
import { ProjectDetailsStep } from './ProjectDetailsStep';
import './VerificationReport.scss';
import { IntroductionStep } from './InstroductionStep';
import { MethodologyStep } from './MethodologyStep';
import { VerificationFindingStep } from './VerificationFindingStep';
import { VerificationOpinionStep } from './VerificationOpinionStep';
import { ReferenceStep } from './ReferenceStep';
import { AppendixStep } from './AppendixStep';
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
import { PopupInfo } from '../../../Definitions/Definitions/ndcDetails.definitions';
import { SlcfFormActionModel } from '../../Models/SlcfFormActionModel';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
const StepperComponent = (props: any) => {
  const { useLocation, translator, countries, selectedVersion, handleDocumentStatus } = props;
  const navigationLocation = useLocation();
  const { mode, docId } = navigationLocation.state || {};
  const navigate = useNavigate();
  const [reportId, setReportId] = useState(0);
  const [status, setStatus] = useState(null);
  const [current, setCurrent] = useState(0);
  const [verifiedScer, setVerifiedScer] = useState(0);

  const [formValues, setFormValues] = useState({});
  const { get, post } = useConnection();
  const { id, verificationRequestId } = useParams();
  const t = translator.t;

  const [popupInfo, setPopupInfo] = useState<PopupInfo>();
  const [slcfActionModalVisible, setSlcfActioModalVisible] = useState<boolean>(false);

  const onValueChange = (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    console.log(JSON.stringify(formValues));
  };

  const showModalOnAction = (info: PopupInfo) => {
    setSlcfActioModalVisible(true);
    setPopupInfo(info);
  };

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };

  const approveOrReject = async (verify: boolean, remark?: string) => {
    const body = {
      verify: verify,
      verificationRequestId: Number(verificationRequestId),
      reportId: reportId,
      remark,
    };
    try {
      const res = await post('national/verification/verifyVerificationReport', body);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: verify
            ? t('verificationReport:verificationReportApproveSuccess')
            : t('verificationReport:verificationReportRejectSuccess'),
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

  const onFinish = async (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    if (FormMode.VIEW === mode) {
      navigateToDetailsPage();
    } else {
      const content = { ...formValues, ...newValues };

      content.projectDetails.completionDate = moment(content?.projectDetails?.completionDate)
        .startOf('day')
        .valueOf();
      content.projectDetails.versionDate = moment(content?.projectDetails?.versionDate)
        .startOf('day')
        .valueOf();
      content.projectDetails.monitoringPeriodStart = moment(
        content?.projectDetails?.monitoringPeriodStart
      )
        .startOf('day')
        .valueOf();
      content.projectDetails.monitoringPeriodEnd = moment(
        content?.projectDetails?.monitoringPeriodEnd
      )
        .startOf('day')
        .valueOf();

      content.introduction.creditionPeriodStart = moment(
        content?.introduction?.creditionPeriodStart
      )
        .startOf('day')
        .valueOf();
      content.introduction.creditionPeriodEnd = moment(content?.introduction?.creditionPeriodEnd)
        .startOf('day')
        .valueOf();
      content.introduction.periodVerifiedStart = moment(content?.introduction?.periodVerifiedStart)
        .startOf('day')
        .valueOf();
      content.introduction.periodVerifiedEnd = moment(content?.introduction?.periodVerifiedEnd)
        .startOf('day')
        .valueOf();

      content.annexures.optionalDocuments = await fileUploadValueExtract(
        content?.annexures,
        'optionalDocuments'
      );

      content.verificationFinding.optionalDocuments = await fileUploadValueExtract(
        content?.verificationFinding,
        'optionalDocuments'
      );

      content?.verificationFinding?.siteLocations?.forEach(async (val: any) => {
        val.commissioningDate = moment(val?.commissioningDate).startOf('day').valueOf();
      });

      content.verificationOpinion.signature1 = await fileUploadValueExtract(
        content?.verificationOpinion,
        'signature1'
      );
      content.verificationOpinion.signature2 = await fileUploadValueExtract(
        content?.verificationOpinion,
        'signature2'
      );
      content.verificationOpinion.dateOfSignature1 = moment(
        content?.verificationOpinion?.dateOfSignature1
      )
        .startOf('day')
        .valueOf();
      content.verificationOpinion.dateOfSignature2 = moment(
        content?.verificationOpinion?.dateOfSignature2
      )
        .startOf('day')
        .valueOf();
      const body = { content: JSON.stringify(content), programmeId: id };
      try {
        const res = await post('national/verification/createVerificationReport', body);
        if (res?.statusText === 'SUCCESS') {
          message.open({
            type: 'success',
            content: t('verificationReport:createVerificationReportSuccess'),
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
    }
  };
  const [projectDetailsForm] = useForm();
  const [introductionForm] = useForm();
  const [methodologyForm] = useForm();
  const [verificationFindingForm] = useForm();
  const [verificationOpinionForm] = useForm();
  const [referenceForm] = useForm();
  const [appendixForm] = useForm();

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };
  const safeNumber = (value: any) => Number(value) || 0;

  const getProjectById = async (programId: any) => {
    try {
      const { data } = await post('national/programmeSl/getProjectById', {
        programmeId: programId,
      });
      const creditReceived =
        safeNumber(data.creditBalance) +
        safeNumber(data.creditFrozen) +
        safeNumber(data.creditRetired) +
        safeNumber(data.creditTransferred);
      const creditEst = safeNumber(data.creditEst);
      setVerifiedScer(creditEst - creditReceived);
      projectDetailsForm.setFieldsValue({
        projectTitle: data?.title,
      });
    } catch (error) {
      console.log('error');
    }
  };

  const getLatestReports = async (programId: any) => {
    try {
      if (mode === FormMode.VIEW || mode === FormMode.EDIT) {
        const { data } =
          mode === FormMode.VIEW && selectedVersion
            ? await post('national/programmeSl/getVerificationDocByVersion', {
                programmeId: id,
                docType: DocumentTypeEnum.VERIFICATION_REPORT,
                version: selectedVersion,
                verificationRequestId: Number(verificationRequestId),
              })
            : await post('national/programmeSl/getVerificationDocLastVersion', {
                programmeId: id,
                docType: DocumentTypeEnum.VERIFICATION_REPORT,
                verificationRequestId: Number(verificationRequestId),
              });

        if (mode === FormMode.VIEW) {
          handleDocumentStatus(data.status);
        }

        if (data && data?.content) {
          setReportId(data?.id);
          setStatus(data?.status);
          const content = data?.content;
          projectDetailsForm.setFieldsValue({
            ...content?.projectDetails,
            completionDate: moment(content?.projectDetails?.completionDate),
            versionDate: moment(content?.projectDetails?.versionDate),
            monitoringPeriodStart: moment(content?.projectDetails?.monitoringPeriodStart),
            monitoringPeriodEnd: moment(content?.projectDetails?.monitoringPeriodEnd),
            reportID: data?.content?.projectDetails?.reportID
              ? data?.content?.projectDetails?.reportID
              : data?.content?.projectDetails?.reportNo,
          });
          introductionForm.setFieldsValue({
            ...content?.introduction,
            creditionPeriodStart: moment(content?.introduction?.creditionPeriodStart),
            creditionPeriodEnd: moment(content?.introduction?.creditionPeriodEnd),
            periodVerifiedStart: moment(content?.introduction?.periodVerifiedStart),
            periodVerifiedEnd: moment(content?.introduction?.periodVerifiedEnd),
          });
          methodologyForm.setFieldsValue({
            ...content?.methodology,
          });
          verificationFindingForm.setFieldsValue({
            ...content?.verificationFinding,
            optionalDocuments: data?.content?.verificationFinding?.optionalDocuments?.map(
              (document: string, index: number) => {
                return {
                  uid: index,
                  name: extractFilePropertiesFromLink(document).fileName,
                  status: 'done',
                  url: document,
                };
              }
            ),
            siteLocations: content?.verificationFinding?.siteLocations?.map((val: any) => {
              return {
                ...val,
                commissioningDate: moment(val?.commissioningDate),
              };
            }),
          });

          verificationOpinionForm.setFieldsValue({
            ...content?.verificationOpinion,
            dateOfSignature1: moment(content?.verificationOpinion?.dateOfSignature1),
            dateOfSignature2: moment(content?.verificationOpinion?.dateOfSignature2),
            signature1: data?.content?.verificationOpinion?.signature1?.map(
              (document: string, index: number) => {
                return {
                  uid: index,
                  name: extractFilePropertiesFromLink(document).fileName,
                  status: 'done',
                  url: document,
                };
              }
            ),
            signature2: data?.content?.verificationOpinion?.signature2?.map(
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

          referenceForm.setFieldsValue({
            ...content?.reference,
          });

          appendixForm.setFieldsValue({
            ...content?.annexures,
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
      } else {
        const { data } = await post('national/programmeSl/getDocLastVersion', {
          programmeId: programId,
          docType: DocumentTypeEnum.CMA,
        });

        const { data: monitoringData } = await post(
          'national/programmeSl/getVerificationDocLastVersion',
          {
            programmeId: programId,
            docType: DocumentTypeEnum.MONITORING_REPORT,
            verificationRequestId: verificationRequestId,
          }
        );

        const cmaData = JSON.parse(data?.content);

        projectDetailsForm.setFieldsValue({
          projectTitle: cmaData?.projectDetails?.title,
          client: cmaData?.projectDetails?.projectProponent,
          address: cmaData?.projectDetails?.physicalAddress,
          email: cmaData?.projectDetails?.email,
          telephone: cmaData?.projectDetails?.telephone,
          contactPerson: cmaData?.projectActivity?.projectProponent?.contactPerson,
          estimatedScer: monitoringData?.content?.quantifications?.totalNetEmissionReductions,
          workCarriedOutBy: `Validation & Verification Division ${
            process.env.REACT_APP_COUNTRY_CLIMATE_FUND || 'CountryX Climate Fund (Pvt) Ltd.'
          }`,
        });

        introductionForm.setFieldsValue({
          title: cmaData?.projectDetails?.title,
          hostParty: process.env.REACT_APP_COUNTRY_NAME || 'CountryX',
          tiprojectParticipantstle: cmaData?.projectActivity?.projectProponent?.organizationName,
          monitoringMethodology: monitoringData?.content?.projectActivity?.methodology,
          creditionPeriodStart: moment(
            monitoringData?.content?.projectActivity?.creditingPeriodFromDate
          ),
          creditionPeriodEnd: moment(
            monitoringData?.content?.projectActivity?.creditingPeriodToDate
          ),
        });

        methodologyForm.setFieldsValue({
          verificationTeamList: [
            {
              name: '',
              company:
                process.env.REACT_APP_COUNTRY_CLIMATE_FUND || 'CountryX Climate Fund (Pvt) Ltd.',
              function: [],
              taskPerformed: [],
            },
          ],
          inspectionsList: [
            {
              name: '',
              designation: '',
              organizationEntity: '',
              method: '',
              mainTopics: '',
            },
          ],
        });
        verificationFindingForm.setFieldsValue({
          siteLocations: cmaData?.projectActivity.locationsOfProjectActivity.map(
            (location: any) => {
              console.log('location', location.locationOfProjectActivity);
              return {
                siteLocation: location?.locationOfProjectActivity,
                commissioningDate: moment(location?.commissioningDate * 1000),
              };
            }
          ),
          complianceList: [
            {
              dataParameter: '',
              sourceOfData: '',
              reportedValue: '',
            },
          ],
          resolutionOfFindings: [
            {
              type: [],
              findingNo: '',
              refToMR: '',
              description: '',
              summary: '',
              assesment: '',
              conclusion: [],
            },
          ],
        });
      }
    } catch (error) {
      console.log('error');
    }
  };

  useEffect(() => {
    getLatestReports(id);
    getProjectById(id);
  }, [selectedVersion]);

  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          <div className="title">{t('verificationReport:title01')}</div>
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
          verifiedScer={verifiedScer}
          onValueChange={onValueChange}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t('verificationReport:title02')}</div>
        </div>
      ),
      description: (
        <IntroductionStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={introductionForm}
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
          <div className="title">{t('verificationReport:title03')}</div>
        </div>
      ),
      description: (
        <MethodologyStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={methodologyForm}
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
          <div className="title">{t('verificationReport:title04')}</div>
        </div>
      ),
      description: (
        <VerificationFindingStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={verificationFindingForm}
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
          <div className="title">{t('verificationReport:title05')}</div>
        </div>
      ),
      description: (
        <VerificationOpinionStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={verificationOpinionForm}
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
          <div className="title">{t('verificationReport:title06')}</div>
        </div>
      ),
      description: (
        <ReferenceStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={referenceForm}
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
          <div className="step-count">06</div>
          <div className="title">{t('verificationReport:title07')}</div>
        </div>
      ),
      description: (
        <AppendixStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          status={status}
          form={appendixForm}
          formMode={mode}
          prev={prev}
          cancel={navigateToDetailsPage}
          approve={() => {
            showModalOnAction({
              actionBtnText: t('verificationReport:btnApprove'),
              icon: <CheckCircleOutlined />,
              title: t('verificationReport:approveVerificationModalTitle'),
              okAction: () => {
                approveOrReject(true);
              },
              remarkRequired: false,
              type: 'primary',
            });
          }}
          reject={() => {
            showModalOnAction({
              actionBtnText: t('verificationReport:btnReject'),
              icon: <CloseCircleOutlined />,
              title: t('verificationReport:rejectVerificationModalTitle'),
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
