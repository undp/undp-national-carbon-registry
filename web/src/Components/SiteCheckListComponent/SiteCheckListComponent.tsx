import { Button, Col, DatePicker, Form, message, Row, Select, TimePicker, Upload } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import Input from 'antd/lib/input/Input';
import { i18n } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SiteCheckListComponent.scss';
import moment from 'moment';
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';

import TextArea from 'antd/lib/input/TextArea';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { DocType } from '../../Definitions/Enums/document.type';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { PURPOSE_CREDIT_DEVELOPMENT } from '../SLCFProgramme/AddNewProgramme/SLCFProgrammeCreationComponent';

const SiteCheckListComponent = (props: { translator: i18n }) => {
  const [form] = useForm();
  const { translator } = props;

  const [contactNoInput] = useState<any>();

  const { state } = useLocation();
  const isView = !!state?.isView;

  const navigate = useNavigate();

  const { id } = useParams();

  const { get, post } = useConnection();

  const naviagetToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };

  const getDataToPopulate = async (programmeId: any) => {
    try {
      const { data } = await post('national/programmeSL/getProjectById', {
        programmeId: programmeId,
      });

      console.log('-----response-------', data);

      const tempValues = {
        projectName: data?.title,
        organizationName: data?.company?.name,
        projectTrack: data?.purposeOfCreditDevelopment,
      };

      form.setFieldsValue(tempValues);
    } catch (error) {
      console.log('--------error---------', error);
    }
  };

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const [countries, setCountries] = useState<[]>([]);

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

  const { t } = translator;

  const [disableFields, setDisableFields] = useState<boolean>(false);

  useEffect(() => {
    getCountryList();
  }, []);

  const viewDataMapToFields = (vals: any) => {
    const firstStakeholder =
      vals?.stakeholderInterviews && vals?.stakeholderInterviews.length > 0
        ? vals?.stakeholderInterviews.shift()
        : undefined;

    const fileUrlParts = vals?.validatorSignature.split('/');
    const fileName = fileUrlParts[fileUrlParts.length - 1];

    console.log('signature', vals?.validatorSignature, fileName);

    const tempVals = {
      projectName: vals?.projectName,
      organizationName: vals?.organizationName,
      location: vals?.location,
      date: moment.unix(vals?.date),
      time: moment.unix(vals?.time),
      projectStartDate: moment.unix(vals?.projectStartDate),
      projectCommissionDate: moment.unix(vals?.projectCommissionDate),
      projectTrack: vals?.projectTrack,
      projectCapacity: vals?.projectCapacity,
      projectFactor: vals?.projectFactor,
      projectEmission: vals?.projectEmission,
      leakageEmission: vals?.leakageEmission,
      eligibility1YesNo: vals?.eligibility1YesNo,
      eligibility1Comment: vals?.eligibility1Comment,
      eligibility2YesNo: vals?.eligibility2YesNo,
      eligibility2Comment: vals?.eligibility2Comment,
      eligibility3YesNo: vals?.eligibility3YesNo,
      eligibility3Comment: vals?.eligibility3Comment,
      eligibility4YesNo: vals?.eligibility4YesNo,
      eligibility4Comment: vals?.eligibility4Comment,
      eligibility5YesNo: vals?.eligibility5YesNo,
      eligibility5Comment: vals?.eligibility5Comment,
      eligibility6YesNo: vals?.eligibility6YesNo,
      eligibility6Comment: vals?.eligibility6Comment,
      doc1FeasibilityStudiesAvailability: vals?.doc1FeasibilityStudiesAvailability,
      doc1FeasibilityStudiesComment: vals?.doc1FeasibilityStudiesComment,
      doc2PowerPurchasingAgreementAvailability: vals?.doc2PowerPurchasingAgreementAvailability,
      doc2PowerPurchasingAgreementComment: vals?.doc2PowerPurchasingAgreementComment,
      doc3TestingCertificateAvailability: vals?.doc3TestingCertificateAvailability,
      doc3TestingCertificateComment: vals?.doc3TestingCertificateComment,
      doc4CalibrationReportsAvailability: vals?.doc4CalibrationReportsAvailability,
      doc4CalibrationReportsComment: vals?.doc4CalibrationReportsComment,
      doc5DataManagementAvailability: vals?.doc5DataManagementAvailability,
      doc5DataManagementComment: vals?.doc5DataManagementComment,
      doc6MonthlyElectricityRecordsAvailability: vals?.doc6MonthlyElectricityRecordsAvailability,
      doc6MonthlyElectricityRecordsComment: vals?.doc6MonthlyElectricityRecordsComment,
      doc7MonthlyElectricityInvoicesAvailability: vals?.doc7MonthlyElectricityInvoicesAvailability,
      doc7MonthlyElectricityInvoicesComment: vals?.doc7MonthlyElectricityInvoicesComment,
      doc8TrainingRecordsAvailability: vals?.doc8TrainingRecordsAvailability,
      doc8TrainingRecordsComment: vals?.doc8TrainingRecordsComment,
      doc9InternalAuditReportsAvailability: vals?.doc9InternalAuditReportsAvailability,
      stakeholderName: firstStakeholder?.stakeholderName,
      contactDetails: firstStakeholder?.stakeholderContactNo,
      designation: firstStakeholder?.stakeholderDesignation,
      subjectCovered: firstStakeholder?.subjectCovered,
      extraStakeholders: (function () {
        const tempStakeholderObjs: any = [];

        const stakeholderInterviews = vals?.stakeholderInterviews;

        if (stakeholderInterviews && stakeholderInterviews.length > 0) {
          stakeholderInterviews.forEach((stakeholder: any) => {
            const tempStakeholder = {
              stakeholderName: stakeholder?.stakeholderName,
              contactDetails: stakeholder?.stakeholderContactNo,
              designation: stakeholder?.stakeholderDesignation,
              subjectCovered: stakeholder?.subjectCovered,
            };
            tempStakeholderObjs.push(tempStakeholder);
          });
        }

        return tempStakeholderObjs;
      })(),
      validatorName: vals?.validatorName,
      validationDate: moment.unix(vals?.validationDate),
      validatorDesignation: vals?.validatorDesignation,
      validatorSignature: [
        {
          uid: 'validation_signature',
          name: fileName,
          status: 'done',
          url: vals?.validatorSignature,
        },
      ],
    };

    form.setFieldsValue(tempVals);
  };

  useEffect(() => {
    getDataToPopulate(id);
    const getViewData = async () => {
      console.log('-------isView----------', isView);
      if (isView) {
        const res = await post('national/programmeSl/getDocLastVersion', {
          programmeId: id,
          docType: 'siteVisitChecklist',
        });

        if (res?.statusText === 'SUCCESS') {
          const content = JSON.parse(res?.data.content);
          console.log('------content---------', content);
          viewDataMapToFields(content);
        }
      } else {
        getDataToPopulate(id);
      }
    };

    getViewData();

    if (isView) {
      setDisableFields(true);
    }
  }, []);

  const convertFileToBase64 = async (image: any) => {
    const res = await getBase64(image?.originFileObj as RcFile);
    return res;
  };

  const onFinish = async (values: any) => {
    console.log('-------values--------', values?.projectTrack);

    const validatorSignatureBase64 = await convertFileToBase64(values?.validatorSignature[0]);

    const tempValues = {
      projectName: values?.projectName,
      organizationName: values?.organizationName,
      location: values?.location,
      date: moment(values?.date).startOf('day').unix(),
      time: moment(values?.time).unix(),
      projectStartDate: moment(values?.projectStartDate).startOf('day').unix(),
      projectCommissionDate: moment(values?.projectCommissionDate).startOf('day').unix(),
      projectTrack: form.getFieldValue('projectTrack'),
      projectCapacity: Number(values?.projectCapacity),
      projectFactor: values?.projectFactor,
      projectEmission: values?.projectEmission,
      leakageEmission: values?.leakageEmission,
      eligibility1YesNo: values?.eligibility1YesNo,
      eligibility1Comment: values?.eligibility1Comment,
      eligibility2YesNo: values?.eligibility2YesNo,
      eligibility2Comment: values?.eligibility2Comment,
      eligibility3YesNo: values?.eligibility3YesNo,
      eligibility3Comment: values?.eligibility3Comment,
      eligibility4YesNo: values?.eligibility4YesNo,
      eligibility4Comment: values?.eligibility4Comment,
      eligibility5YesNo: values?.eligibility5YesNo,
      eligibility5Comment: values?.eligibility5Comment,
      eligibility6YesNo: values?.eligibility6YesNo,
      eligibility6Comment: values?.eligibility6Comment,
      doc1FeasibilityStudiesAvailability: values?.doc1FeasibilityStudiesAvailability,
      doc1FeasibilityStudiesComment: values?.doc1FeasibilityStudiesComment,
      doc2PowerPurchasingAgreementAvailability: values?.doc2PowerPurchasingAgreementAvailability,
      doc2PowerPurchasingAgreementComment: values?.doc2PowerPurchasingAgreementComment,
      doc3TestingCertificateAvailability: values?.doc3TestingCertificateAvailability,
      doc3TestingCertificateComment: values?.doc3TestingCertificateComment,
      doc4CalibrationReportsAvailability: values?.doc4CalibrationReportsAvailability,
      doc4CalibrationReportsComment: values?.doc4CalibrationReportsComment,
      doc5DataManagementAvailability: values?.doc5DataManagementAvailability,
      doc5DataManagementComment: values?.doc5DataManagementComment,
      doc6MonthlyElectricityRecordsAvailability: values?.doc6MonthlyElectricityRecordsAvailability,
      doc6MonthlyElectricityRecordsComment: values?.doc6MonthlyElectricityRecordsComment,
      doc7MonthlyElectricityInvoicesAvailability:
        values?.doc7MonthlyElectricityInvoicesAvailability,
      doc7MonthlyElectricityInvoicesComment: values?.doc7MonthlyElectricityInvoicesComment,
      doc8TrainingRecordsAvailability: values?.doc8TrainingRecordsAvailability,
      doc8TrainingRecordsComment: values?.doc8TrainingRecordsComment,
      doc9InternalAuditReportsAvailability: values?.doc9InternalAuditReportsAvailability,
      doc9InternalAuditReportsComment: values?.doc9InternalAuditReportsComment,
      stakeholderInterviews: (function () {
        const tempStakeholderObjs: any = [];
        const firstStakeholder = {
          stakeholderName: values?.stakeholderName,
          stakeholderContactNo: values?.contactDetails,
          stakeholderDesignation: values?.designation,
          subjectCovered: values?.subjectCovered,
        };
        tempStakeholderObjs.push(firstStakeholder);

        const extraStakeholders = values?.extraStakeholders;

        if (
          extraStakeholders !== undefined &&
          extraStakeholders.length > 0 &&
          extraStakeholders[0] !== undefined
        ) {
          extraStakeholders.forEach((stakeholder: any) => {
            const tempStakeholderObj = {
              stakeholderName: stakeholder?.stakeholderName,
              stakeholderContactNo: stakeholder?.contactDetails,
              stakeholderDesignation: stakeholder?.designation,
              subjectCovered: stakeholder?.subjectCovered,
            };
            tempStakeholderObjs.push(tempStakeholderObj);
          });
        }

        return tempStakeholderObjs;
      })(),
      validatorName: values?.validatorName,
      validationDate: moment(values?.validationDate).startOf('day').unix(),
      validatorDesignation: values?.validatorDesignation,
      validatorSignature: validatorSignatureBase64,
    };

    try {
      const res = await post('national/programmeSl/cma/approve', {
        programmeId: id,
        content: tempValues,
      });

      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: 'CMA Approve success',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        naviagetToDetailsPage();
      }
    } catch (error) {
      console.log(error);
      message.open({
        type: 'error',
        content: 'Something went wrong!',
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
  };

  return (
    <div className="site-check-list-container">
      <div className="title-container">
        <div className="main">Site Visit Checklist</div>
      </div>

      <div className="forms-container">
        <Form
          className="site-check-list-form"
          layout="vertical"
          requiredMark={true}
          form={form}
          onFinish={(values: any) => {
            onFinish(values);
          }}
        >
          <Row>
            <Col md={14} xl={14}>
              <Form.Item
                label="Project Name"
                name="projectName"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Project Name ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled />
              </Form.Item>

              <Form.Item
                label="Organization Name"
                name="organizationName"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Organization Name ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled />
              </Form.Item>

              <Form.Item
                label="Location"
                name="location"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Location ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Date"
                name="date"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Date ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <DatePicker size="large" disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Time"
                name="time"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Time ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TimePicker size="large" placeholder="Select Time" disabled={disableFields} />
              </Form.Item>
            </Col>
          </Row>

          {/* Project Details Start */}
          <>
            <h4 className="section-title">Project Details</h4>

            <Row gutter={40}>
              <Col md={12} xl={12}>
                <Form.Item
                  label="Project Start Date"
                  name="projectStartDate"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Project Start Date ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <DatePicker size="large" disabled={disableFields} />
                </Form.Item>

                <div className="projectTrack mg-bottom-1">
                  <div>
                    <p
                      className="custom-required"
                      style={{ marginBottom: '8px', color: 'rgba(58, 53, 65, 0.5' }}
                    >
                      Project Track
                    </p>
                    <Input
                      size="large"
                      disabled
                      value={PURPOSE_CREDIT_DEVELOPMENT[form.getFieldValue('projectTrack')]}
                    />
                  </div>

                  <div
                    style={{ fontSize: '12px', marginLeft: '8px', color: 'rgba(58, 53, 65, 0.5' }}
                    className="mg-top-2"
                  >
                    {form.getFieldValue('projectTrack') === 'TRACK_2' && (
                      <>
                        *Issued carbon credits from project will only be used for internal
                        offsetting of emissions.
                      </>
                    )}
                  </div>
                </div>

                <Form.Item
                  label="Project Factor"
                  name="projectFactor"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Project Factor ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label="Leakage Emission"
                  name="leakageEmission"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Leakage Emission ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>
              </Col>

              <Col md={12} xl={12}>
                <Form.Item
                  label="Project Commission Date"
                  name="projectCommissionDate"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Project Commision Date ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <DatePicker size="large" disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label="Project Capacity"
                  name="projectCapacity"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule, value) => {
                        if (!value) {
                        }

                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Project Capacity ${t('isRequired')}`);
                        }

                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          throw new Error('Should be an integer!');
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label="Project Emission"
                  name="projectEmission"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule, value) => {
                        if (!value) {
                        }
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`Project Emission ${t('isRequired')}`);
                        }

                        // // eslint-disable-next-line no-restricted-globals
                        // if (isNaN(value)) {
                        //   return Promise.reject(new Error('Should be an integer!'));
                        // }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>
          </>
          {/* Project Details End */}

          {/* Eligibility Criteria Start */}
          <>
            <h4 className="section-title mg-top-1">Eligibility</h4>
            <div className="checklist-table-form">
              <Row className="header" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10}>
                  Eligibility Criteria
                </Col>
                <Col md={4} xl={4}>
                  Yes/No
                </Col>
                <Col md={8} xl={8}>
                  Comments
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>1.</div>
                    <div>
                      The project activity shall be a new project, which will reduce/absorb GHG
                      emissions or the project activity shall be a project, which was implemented on
                      or after 2010 in order to offset GHG emission within the organization.
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility1YesNo"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility1Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>2.</div>
                    <div>The project activity shall be located in Sri Lanka.</div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility2YesNo"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility2Comment"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>3.</div>
                    <div>
                      The project activity shall not happen in the absence of benefits received from
                      trading Sri Lanka Certified Emission Reduction units (SCERs). (This is not
                      applicable Track II)
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility3YesNo"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility3Comment"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>4.</div>
                    <div>
                      The project shall be implemented voluntarily by the project owner but not
                      implemented based on legislation or regulations in the country
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility4YesNo"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility4Comment"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>5.</div>
                    <div>
                      The project activity satisfies environmental standard and regulations of the
                      country
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility5YesNo"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility5Comment"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>6.</div>
                    <div>
                      The project shall not have been registered under any other national or
                      international scheme. However, if a registered project under other scheme is
                      willing to register with SLCCS, then, such project shall be deregistered from
                      the other scheme in order to be eligible
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility6YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility6Comment"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('siteVisitCheckList:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </>
          {/* Eligibility Criteria End */}

          {/* Document Review Start */}
          <h4 className="section-title mg-top-2">Document Review</h4>
          <div className="checklist-table-form ">
            <Row className="header" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10}>
                Document Name
              </Col>
              <Col md={4} xl={4}>
                Availability
              </Col>
              <Col md={8} xl={8}>
                Comments
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>1.</div>
                  <div>
                    Feasibility studies or preliminary assessments undertaken for the project
                    activities.
                  </div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc1FeasibilityStudiesAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc1FeasibilityStudiesComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>2.</div>
                  <div>Power purchasing agreement.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc2PowerPurchasingAgreementAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc2PowerPurchasingAgreementComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>3.</div>
                  <div>Testing and commissioning certificates.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc3TestingCertificateAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc3TestingCertificateComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>4.</div>
                  <div>Calibration Reports of Energy meters.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc4CalibrationReportsAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc4CalibrationReportsComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>5.</div>
                  <div>Data management systems.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc5DataManagementAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc5DataManagementComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>6.</div>
                  <div>Monthly electricity generation records (Spreadsheets).</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc6MonthlyElectricityRecordsAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc6MonthlyElectricityRecordsComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>7.</div>
                  <div>Monthly electricity invoices.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc7MonthlyElectricityInvoicesAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc7MonthlyElectricityInvoicesComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>8.</div>
                  <div>Training records of personnel engaging in the monitoring activities.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc8TrainingRecordsAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc8TrainingRecordsComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>9.</div>
                  <div>Internal audit reports (If available)</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc9InternalAuditReportsAvailability"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc9InternalAuditReportsComment"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('siteVisitCheckList:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>
          </div>
          {/* Document Review End */}

          {/* Interview of the StakeHolders start*/}
          <>
            <h4 className="section-title mg-top-1">Interview of the Stakeholders</h4>
            <div className="mg-top-1 mg-bottom-1">Stakeholder 1</div>
            <div className="stakeholders-section">
              <Row gutter={40}>
                <Col md={12} xl={12}>
                  <Form.Item
                    label="Stakeholder Name"
                    name="stakeholderName"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`Stakeholder Name ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    label="Contact Details"
                    name="contactDetails"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`Contact Details ${t('isRequired')}`);
                          } else {
                            const phoneNo = formatPhoneNumber(String(value));
                            if (String(value).trim() !== '') {
                              if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                throw new Error(`Contact Details ${t('isRequired')}`);
                              } else {
                                if (!isPossiblePhoneNumber(String(value))) {
                                  throw new Error(`Contact Details ${t('isInvalid')}`);
                                }
                              }
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <PhoneInput
                      // placeholder={t('projectProposal:phoneNo')}
                      international
                      value={formatPhoneNumberIntl(contactNoInput)}
                      defaultCountry="LK"
                      countryCallingCodeEditable={false}
                      onChange={(v) => {}}
                      countries={countries as Country[]}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>

                <Col md={12} xl={12}>
                  <Form.Item
                    label="Designation"
                    name="designation"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`Designation ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    label="Subject Covered"
                    name="subjectCovered"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`Subject Covered ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Form.List name="extraStakeholders">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <>
                      <div className="mg-top-2 stakeholders-title">
                        <span>Stakeholder {name + 2}</span>
                        <Form.Item>
                          <Button
                            onClick={() => {
                              remove(name);
                            }}
                            icon={<MinusOutlined />}
                            disabled={disableFields}
                          />
                        </Form.Item>
                      </div>
                      <div className="stakeholders-section">
                        <Row gutter={40}>
                          <Col md={12} xl={12}>
                            <Form.Item
                              label="Stakeholder Name"
                              name={[name, 'stakeholderName']}
                              rules={[
                                {
                                  required: true,
                                  message: `Stakeholder Name ${t('isRequired')}`,
                                },
                                {
                                  validator: async (rule: any, value: any) => {
                                    if (
                                      String(value).trim() === '' ||
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(`Stakeholder Name ${t('isRequired')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>

                            <Form.Item
                              label="Contact Details"
                              name={[name, 'contactDetails']}
                              rules={[
                                {
                                  required: true,
                                  message: ``,
                                },
                                {
                                  validator: async (rule: any, value: any) => {
                                    if (
                                      String(value).trim() === '' ||
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(`Contact Details ${t('isRequired')}`);
                                    } else {
                                      const phoneNo = formatPhoneNumber(String(value));
                                      if (String(value).trim() !== '') {
                                        if (
                                          phoneNo === null ||
                                          phoneNo === '' ||
                                          phoneNo === undefined
                                        ) {
                                          throw new Error(`Contact Details ${t('isRequired')}`);
                                        } else {
                                          if (!isPossiblePhoneNumber(String(value))) {
                                            throw new Error(`Contact Details ${t('isInvalid')}`);
                                          }
                                        }
                                      }
                                    }
                                  },
                                },
                              ]}
                            >
                              <PhoneInput
                                // placeholder={t('projectProposal:phoneNo')}
                                international
                                value={formatPhoneNumberIntl(contactNoInput)}
                                defaultCountry="LK"
                                countryCallingCodeEditable={false}
                                onChange={(v) => {}}
                                countries={countries as Country[]}
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>

                          <Col md={12} xl={12}>
                            <Form.Item
                              label="Designation"
                              name={[name, 'designation']}
                              rules={[
                                {
                                  required: true,
                                  message: ``,
                                },
                                {
                                  validator: async (rule: any, value: any) => {
                                    if (
                                      String(value).trim() === '' ||
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(`Designation ${t('isRequired')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>

                            <Form.Item
                              label="Subject Covered"
                              name={[name, 'subjectCovered']}
                              rules={[
                                {
                                  required: true,
                                  message: ``,
                                },
                                {
                                  validator: async (rule: any, value: any) => {
                                    if (
                                      String(value).trim() === '' ||
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(`Subject Covered ${t('isRequired')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </>
                  ))}
                  <Form.Item>
                    <Button
                      className="mg-top-1"
                      onClick={() => {
                        add();
                      }}
                      icon={<PlusOutlined />}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
          {/* Interview of the StakeHolders end*/}

          <Row gutter={40} className="validator-info">
            <Col md={24} xl={12}>
              <Form.Item
                label="Validator Name"
                name="validatorName"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Validator Name ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Date"
                name="validationDate"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Date ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <DatePicker picker="date" size="large" disabled={disableFields} />
              </Form.Item>
            </Col>

            <Col md={24} xl={12}>
              <Form.Item
                label="Designation"
                name="validatorDesignation"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule: any, value: any) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Designation ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled={disableFields} />
              </Form.Item>

              <Form.Item
                name="validatorSignature"
                label="Signature"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                // required={true}
                rules={[
                  {
                    required: true,
                    message: `${t('siteVisitCheckList:required')}`,
                  },
                  {
                    validator: async (rule, file) => {
                      if (file?.length > 0) {
                        if (
                          !isValidateFileType(
                            file[0]?.type,
                            DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                          )
                        ) {
                          throw new Error(`${t('common:invalidFileFormat')}`);
                        } else if (file[0]?.size > maximumImageSize) {
                          // default size format of files would be in bytes -> 1MB = 1000000bytes
                          throw new Error(`${t('common:maxSizeVal')}`);
                        }
                      }
                    },
                  },
                ]}
              >
                <Upload
                  accept=".doc, .docx, .pdf, .png, .jpg"
                  beforeUpload={(file: any) => {
                    return false;
                  }}
                  className="design-upload-section"
                  name="design"
                  action="/upload.do"
                  listType="picture"
                  multiple={false}
                  maxCount={1}
                  disabled={disableFields}
                  // defaultFileList={form.getFieldValue('ClientWitnessSignature') || []}
                  fileList={form.getFieldValue('ClientWitnessSignature') || []}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    Upload
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row justify={'end'} className="step-actions-end">
            {isView ? (
              <>
                <Button danger size={'large'} onClick={naviagetToDetailsPage}>
                  Back
                </Button>
              </>
            ) : (
              <>
                <Button danger size={'large'} onClick={naviagetToDetailsPage}>
                  Cancel
                </Button>
                <Button type="primary" size={'large'} htmlType="submit">
                  submit
                </Button>
              </>
            )}
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default SiteCheckListComponent;
