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
import { extractFilePropertiesFromLink } from '../../../Utils/utilityHelper';
const StepperComponent = (props: any) => {
  const { useLocation, translator, countries } = props;
  const navigationLocation = useLocation();
  const { mode } = navigationLocation.state || {};
  const navigate = useNavigate();
  const [verificationRequestId, setVerificationRequestId] = useState(0);
  const [reportId, setReportId] = useState(0);
  const [current, setCurrent] = useState(0);

  const [formValues, setFormValues] = useState({});
  const { get, post } = useConnection();
  const { id } = useParams();
  const t = translator.t;
  const reportVersion = process.env.VERIFICATION_REPORT_VERSION
    ? process.env.VERIFICATION_REPORT_VERSION
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
      const body = { content: JSON.stringify({ ...formValues, ...newValues }), programmeId: id };
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

  const getProjectById = async (programId: any) => {
    try {
      const { data } = await post('national/programmeSl/getProjectById', {
        programmeId: programId,
      });

      const {
        data: { user },
      } = await get('national/User/profile');
      console.log('-----response-------', data, user);

      projectDetailsForm.setFieldsValue({
        projectName: data?.title,
      });
    } catch (error) {
      console.log('error');
    }
  };

  const getLatestVerificationReport = async (programId: any) => {
    try {
      const { data } = await post('national/programmeSl/getDocLastVersion', {
        programmeId: programId,
        docType: DocumentTypeEnum.VERIFICATION_REPORT,
      });
      if (data && data?.content) {
        setReportId(data?.id);
        setVerificationRequestId(data?.verificationRequestId);
        const content = data?.content;
        projectDetailsForm.setFieldsValue({
          ...content?.projectDetails,
          completionDate: moment.unix(content?.projectDetails?.completionDate),
          versionDate: moment.unix(content?.projectDetails?.versionDate),
          monitoringPeriodStart: moment.unix(content?.projectDetails?.monitoringPeriodStart),
          monitoringPeriodEnd: moment.unix(content?.projectDetails?.monitoringPeriodEnd),
        });
        introductionForm.setFieldsValue({
          ...content?.introduction,
          creditionPeriodStart: moment.unix(content?.introduction?.creditionPeriodStart),
          creditionPeriodEnd: moment.unix(content?.introduction?.creditionPeriodEnd),
          periodVerifiedStart: moment.unix(content?.introduction?.periodVerifiedStart),
          periodVerifiedEnd: moment.unix(content?.introduction?.periodVerifiedEnd),
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
              commissioningDate: moment.unix(val?.commissioningDate),
            };
          }),
        });

        verificationOpinionForm.setFieldsValue({
          ...content?.verificationOpinion,
          dateOfSignature1: moment.unix(content?.verificationOpinion?.dateOfSignature1),
          dateOfSignature2: moment.unix(content?.verificationOpinion?.dateOfSignature2),
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
        });
      } else {
        methodologyForm.setFieldsValue({
          verificationTeamList: [
            {
              name: '',
              company: '',
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
          siteLocations: [
            {
              siteLocation: '',
              commissioningDate: '',
            },
          ],
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
    getLatestVerificationReport(id);
    getProjectById(id);
  }, []);

  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          {/* <div className="step-count"></div> */}
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
          form={appendixForm}
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
