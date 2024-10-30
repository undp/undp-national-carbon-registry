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
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { version } from 'os';
import { DocType } from '../../../Definitions/Enums/document.type';
import { DocumentTypeEnum } from '../../../Definitions/Enums/document.type.enum';
const StepperComponent = (props: any) => {
  const { useLocation, translator, countries } = props;
  const [current, setCurrent] = useState(0);
  const [formValues, setFormValues] = useState({});
  const { get, post } = useConnection();
  const { id } = useParams();
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

  const onFinish = async (newValues: any) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
    const body = { content: JSON.stringify({ ...formValues, ...newValues }), programmeId: id };
    try {
      const res = await post('national/verification/createMonitoringReport', body);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: t('monitoringReport:uploadMonitoringReportSuccess'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        // navigate('/programmeManagementSLCF/viewAll');
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
          dateOfIssue: moment.unix(cmaData?.projectDetails?.dateOfIssue),
          version: reportVersion,
          physicalAddress: cmaData?.projectDetails?.physicalAddress,
          email: cmaData?.projectDetails?.email,
          telephone: cmaData?.projectDetails?.telephone,
          website: cmaData?.projectDetails?.website,
          preparedBy: cmaData?.projectDetails?.preparedBy,
        });
      }
    } catch (error) {
      console.log('error');
    }

    try {
      const { data } = await post('national/programmeSl/getDocLastVersion', {
        programmeId: programId,
        docType: DocumentTypeEnum.MONITORING_REPORT,
      });
      if (data && data?.content) {
        projectDetailsForm.setFieldsValue({
          ...data?.content?.projectDetails,
          dateOfIssue: moment.unix(data?.content?.projectDetails?.dateOfIssue),
        });

        projectActivityForm.setFieldsValue({
          ...data?.content?.projectActivity,
          creditingPeriodFromDate: moment.unix(
            data?.content?.projectActivity?.creditingPeriodFromDate
          ),
          creditingPeriodToDate: moment.unix(data?.content?.projectActivity?.creditingPeriodToDate),
          registrationDateOfTheActivity: moment.unix(
            data?.content?.projectActivity?.registrationDateOfTheActivity
          ),
          projectActivityLocationsList:
            data?.content?.projectActivity?.projectActivityLocationsList?.map((val: any) => {
              return {
                ...val,
                projectStartDate: moment.unix(val?.projectStartDate),
                // location: val.location[0][0],
              };
            }),
        });
        qualificationForm.setFieldsValue({
          ...data?.content?.quantifications,
          emissionReductionsRemovalsList:
            data?.content?.quantifications?.emissionReductionsRemovalsList?.map((val: any) => {
              return {
                ...val,
                startDate: moment.unix(val?.startDate),
                endDate: moment.unix(val?.endDate),
              };
            }),
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
        // projectActivityForm.setFieldsValue({
        //   projectProponentsList: [
        //     {
        //       organizationName: '',
        //       email: '',
        //       telephone: '',
        //       address: '',
        //       designation: '',
        //       contactPerson: '',
        //       roleInTheProject: '',
        //       fax: '',
        //     },
        //   ],
        //   projectActivityLocationsList: [
        //     {
        //       location: '',
        //       province: '',
        //       district: '',
        //       dsDivision: '',
        //       city: '',
        //       community: '',
        //       optionalDocuments: [],
        //       projectStartDate: '',
        //     },
        //   ],
        // });
      } else {
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
      }
    } catch (error) {
      console.log('error');
    }
  };

  useEffect(() => {
    getLatestReports(id);
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
          next={next}
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
          <div className="title">{t('monitoringReport:title07')}</div>
        </div>
      ),
      description: (
        <AnnexuresStep
          useLocation={useLocation}
          translator={translator}
          current={current}
          form={annexuresForm}
          prev={prev}
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
