import { Button, Col, DatePicker, Form, Input, message, Row, Upload } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { i18n } from 'i18next';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import './ValidationAgreement.scss';
import TextArea from 'antd/lib/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { DocType } from '../../Definitions/Enums/document.type';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getBase64, getFileName } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';
import { Loading } from '../Loading/loading';

const ValidationAgreement = (props: { translator: i18n }) => {
  const { translator } = props;
  const t = translator.t;

  const { state } = useLocation();
  const [isView, setIsView] = useState<boolean>(!!state?.isView);
  const [loading, setLoading] = useState<boolean>(isView);

  const [form] = useForm();

  const { id } = useParams();

  const { get, post } = useConnection();

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const navigate = useNavigate();

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };

  const viewDataMapToFields = (val: any) => {
    const tempInitialValues = {
      dateOfIssue: val?.dateOfIssue ? moment.unix(val?.dateOfIssue) : undefined,
      between: val?.climateFundDescription,
      and: val?.projectParticipantDescription,
      definitions: val?.definitions,
      whereas: val?.whereasConditions,
      settlementFee: val?.settlementFee,
      SLCFSignature: [
        {
          uid: 'slcf_signature',
          name: getFileName(val?.climateFundSignature),
          status: 'done',
          url: val?.climateFundSignature,
        },
      ],
      clientBehalf: val?.projectParticipantName,
      clientSignature: [
        {
          uid: 'participant_signature',
          name: getFileName(val?.projectParticipantSignature),
          status: 'done',
          url: val?.projectParticipantSignature,
        },
      ],
      clientAuthorizedSignatory: val?.projectParticipantSignatory,
      SLCFWitnessSignature: [
        {
          uid: 'witness_1_sign',
          name: getFileName(val?.climateFundWitnessSignature),
          status: 'done',
          url: val?.climateFundWitnessSignature,
        },
      ],
      SLCFWitnessName: val?.climateFundWitnessName,
      SLCFWitnessDesignation: val?.climateFundWitnessDesignation,
      ClientWitness: val?.witness2Label,
      ClientWitnessSignature: [
        {
          uid: 'witness_2_sign',
          name: getFileName(val?.projectParticipantWitnessSignature),
          status: 'done',
          url: val?.projectParticipantWitnessSignature,
        },
      ],
      clientWitnessName: val?.projectParticipantWitnessName,
      clientWitnessDesignation: val?.projectParticipantWitnessDesignation,
      annexureAadditionalComments: val?.annexureAComment,
      annexureAadditionalDocs: val?.annexureADoc && [
        {
          uid: 'appendix_1',
          name: getFileName(val?.annexureADoc),
          status: 'done',
          url: val?.annexureADoc,
        },
      ],
      annexureBadditionalComments: val?.annexureBComment,
      annexureBadditionalDocs: val?.annexureBDoc && [
        {
          uid: 'appendix_2',
          name: getFileName(val?.annexureBDoc),
          status: 'done',
          url: val?.annexureBDoc,
        },
      ],
    };

    form.setFieldsValue(tempInitialValues);
  };

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const setMigratedData = async () => {
    try {
      setLoading(true);
      const { data } = await post('national/programmeSl/getProjectById', {
        programmeId: id,
      });

      form.setFieldsValue({
        clientBehalf: data?.company?.name,
      });
    } catch (error) {
      console.log('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getViewData = async () => {
      if (isView) {
        setLoading(true);
        try {
          const res = await post('national/programmeSl/getDocLastVersion', {
            programmeId: id,
            docType: 'validationAgreement',
          });

          if (res?.statusText === 'SUCCESS') {
            const content = JSON.parse(res?.data.content);
            viewDataMapToFields(content);
          }
        } catch (error) {
          console.log('error', error);
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();
  }, [form]);

  useEffect(() => {
    if (!isView) {
      setMigratedData();
    }
  }, []);

  const convertFileToBase64 = async (image: any) => {
    const res = await getBase64(image?.originFileObj as RcFile);
    return res;
  };

  const onFinish = async (values: any) => {
    const climateFundSignature =
      values?.SLCFSignature && values?.SLCFSignature?.length > 0 && values?.SLCFSignature[0]
        ? await convertFileToBase64(values?.SLCFSignature[0])
        : undefined;

    const projectParticipantSignature =
      values?.clientSignature && values?.clientSignature?.length > 0 && values?.clientSignature[0]
        ? await convertFileToBase64(values?.clientSignature[0])
        : undefined;

    const climateFundWitnessSignature =
      values?.SLCFWitnessSignature &&
      values?.SLCFWitnessSignature?.length > 0 &&
      values?.SLCFWitnessSignature[0]
        ? await convertFileToBase64(values?.SLCFWitnessSignature[0])
        : undefined;

    const projectParticipantWitnessSignature =
      values?.ClientWitnessSignature &&
      values?.ClientWitnessSignature?.length > 0 &&
      values?.ClientWitnessSignature[0]
        ? await convertFileToBase64(values?.ClientWitnessSignature[0])
        : undefined;

    const annexureADoc =
      values?.annexureAadditionalDocs &&
      values?.annexureAadditionalDocs?.length > 0 &&
      values?.annexureAadditionalDocs[0]
        ? await convertFileToBase64(values?.annexureAadditionalDocs[0])
        : undefined;

    const annexureBDoc =
      values?.annexureBadditionalDocs &&
      values?.annexureAadditionalDocs?.length > 0 &&
      values?.annexureBadditionalDocs[0]
        ? await convertFileToBase64(values?.annexureBadditionalDocs[0])
        : undefined;

    const tempValues = {
      programmeId: id,
      content: {
        dateOfIssue: moment(values?.dateOfIssue).unix(),
        climateFundDescription: values?.between,
        projectParticipantDescription: values?.and,
        definitions: values?.definitions,
        whereasConditions: values?.whereas,
        settlementFee: Number(values?.settlementFee),
        climateFundSignature,
        projectParticipantName: values?.clientBehalf,
        projectParticipantSignature,
        projectParticipantSignatory: values?.clientAuthorizedSignatory,
        climateFundWitnessSignature,
        climateFundWitnessName: values?.SLCFWitnessName,
        climateFundWitnessDesignation: values?.SLCFWitnessDesignation,
        projectParticipantWitnessSignature,
        projectParticipantWitnessName: values?.clientWitnessName,
        projectParticipantWitnessDesignation: values?.clientWitnessDesignation,
        annexureAComment: values?.annexureAadditionalComments,
        annexureADoc,
        annexureBComment: values?.annexureBadditionalComments,
        annexureBDoc,
      },
    };

    try {
      setLoading(true);
      const res = await post('national/programmeSl/createValidationAgreement', tempValues);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: 'Validation agreement submitted successfully',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
      }
    } catch (error) {
      message.open({
        type: 'error',
        content: 'Something went wrong!',
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }
  return (
    <div className="validation-agreement-container">
      <div className="title-container">
        <div className="main">{t('validationAgreement:title')}</div>
      </div>

      <div className="agreement-container">
        <Form
          labelCol={{ span: 20 }}
          wrapperCol={{ span: 24 }}
          className="agreement-form"
          layout="vertical"
          requiredMark={true}
          form={form}
          onFinish={(values) => {
            onFinish(values);
          }}
        >
          <Form.Item
            name="dateOfIssue"
            label="Date of Issue"
            className="date-of-issue"
            rules={[
              {
                required: true,
                message: ``,
              },
              {
                validator: async (rule, value) => {
                  if (
                    String(value).trim() === '' ||
                    String(value).trim() === undefined ||
                    value === null ||
                    value === undefined
                  ) {
                    throw new Error(`Date of Issue ${t('isRequired')}`);
                  }
                },
              },
            ]}
          >
            <DatePicker
              size="large"
              disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
              disabled={isView}
            />
          </Form.Item>

          <Form.Item
            name="between"
            label="Between"
            rules={[
              {
                required: true,
                message: `Between ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} disabled={isView} />
          </Form.Item>

          <Form.Item
            name="and"
            label="And"
            rules={[
              {
                required: true,
                message: `And ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} disabled={isView} />
          </Form.Item>

          <Form.Item
            name="definitions"
            label="Definitions"
            rules={[
              {
                required: true,
                message: `Definitions ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} disabled={isView} />
          </Form.Item>

          <Form.Item
            name="whereas"
            label="Whereas"
            rules={[
              {
                required: true,
                message: `Whereas ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} disabled={isView} />
          </Form.Item>

          {/* section 1 start */}
          <>
            <h4 className="mg-top-1 section-title">
              {t('validationAgreement:sectionTitlePart01')}
              <br />
              {t('validationAgreement:sectionTitlePart02')}
            </h4>

            <div className="section-list mg-bottom-1">
              <ul>
                <li className="mg-bottom-1">{t('validationAgreement:point1.1')}</li>
                <li className="mg-bottom-1">{t('validationAgreement:point1.2')}</li>
                <li className="mg-bottom-1">
                  {t('validationAgreement:point1.3')}
                  <ul className="inner-list">
                    <li>{t('validationAgreement:point1.3Item01')}</li>
                    <li>{t('validationAgreement:point1.3Item02')}</li>
                    <li>{t('validationAgreement:point1.3Item03')}</li>
                    <li>{t('validationAgreement:point1.3Item04')}</li>
                    <li>{t('validationAgreement:point1.3Item05')}</li>
                  </ul>
                </li>
                <li>{t('validationAgreement:point1.4')}</li>
              </ul>
            </div>
          </>
          {/* section 1 end */}
          <br />
          {/* section 2 start */}
          <div></div>
          <h4 className="section-title">{t('validationAgreement:point2')}</h4>

          <div className="section-list mg-bottom-1">
            <ul>
              <li>
                {t('validationAgreement:point2.1')}
                <ul className="inner-list">
                  <li>{t('validationAgreement:point2.1Item01')}</li>
                  <li>{t('validationAgreement:point2.1Item02')}</li>
                  <li>{t('validationAgreement:point2.1Item03')}</li>
                </ul>
              </li>
            </ul>
          </div>
          {/* section 2 end */}
          <br />
          {/* section 3 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point3')}</h4>
            <div className="section-description mg-bottom-1">
              <p className="settlement-fee-label">{t('validationAgreement:point3.1')}</p>
              <div className="mg-left-1 settlement-fee">
                {t('validationAgreement:point3.1Label01')}
                <Form.Item
                  name="settlementFee"
                  className="settlement-fee-input"
                  rules={[
                    {
                      required: true,
                      message: `Verification fee ${t('isRequired')}`,
                    },
                    {
                      validator(rule, value) {
                        if (!value) {
                          return Promise.resolve();
                        }

                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be a number!'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input disabled={isView} />
                </Form.Item>
                {t('validationAgreement:point3.1Label02')}
              </div>

              <p>{t('validationAgreement:point3.2')}</p>
              <p className="no-margin-p">{t('validationAgreement:point3.2Item01')}</p>
              <p className="no-margin-p">{t('validationAgreement:point3.2Item02')}</p>
            </div>
          </>
          {/* section 3 end */}
          <br />
          {/* section 4 start */}
          <h4 className="section-title">{t('validationAgreement:point4')}</h4>
          <div className="section-list">
            <ul>
              <li>
                {t('validationAgreement:point4.1')}
                <ul className="inner-list">
                  <li className="mg-bottom-1">{t('validationAgreement:point4.1Item01')}</li>
                  <li className="mg-bottom-1">{t('validationAgreement:point4.1Item02')}</li>
                </ul>
              </li>
            </ul>
          </div>
          {/* section 4 end */}

          {/* section 5 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point5')}</h4>
            <div className="section-description mg-bottom-1">
              {t('validationAgreement:point5.1')}
            </div>
          </>
          {/* section 5 end */}
          <br />

          {/* section 6 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point6')}</h4>
            <div className="section-description mg-bottom-1">
              {t('validationAgreement:point6.1')}
            </div>
          </>
          {/* section 6 end */}
          <br />
          {/* section 7 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point7')}</h4>
            <div className="section-description mg-bottom-1">
              <p>{t('validationAgreement:point7.1')}</p>
              <p>{t('validationAgreement:point7.2')}</p>
            </div>
          </>
          {/* section 7 end */}
          <br />
          {/* section 8 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point8')}</h4>
            <div className="section-description mg-bottom-1">
              <p>{t('validationAgreement:point8.1')}</p>
              <p>{t('validationAgreement:point8.2')}</p>
              <p>{t('validationAgreement:point8.3')}</p>
            </div>
          </>
          {/* section 8 end */}
          <br />
          {/* section 9 start */}
          <>
            <h4 className="section-title">{t('validationAgreement:point9')}</h4>
            <div className="section-description mg-bottom-1">
              <p>{t('validationAgreement:point9.1')}</p>
            </div>
          </>
          {/* section 9 end */}
          <br />
          <br />

          {/* Signatures and annexure start */}
          <div className="signatures-annexures">
            <h4 className="section-description">{t('validationAgreement:inWitness')}</h4>

            <Row justify={'space-between'} gutter={40} className="mg-top-1">
              <Col md={24} xl={10}>
                <p className="no-margin-p">{t('validationAgreement:onBehalf')}</p>
                <p className="no-margin-p">Sri Lanka Climate Fund (Pvt) Ltd.</p>

                <div className="signature-upload">
                  <LabelWithTooltip label="Signature" required={true} />
                  <Form.Item
                    name="SLCFSignature"
                    // label="Signature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `Signature ${t('isRequired')}`,
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
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                      // defaultFileList={form.getFieldValue('SLCFSignature') || []}
                      fileList={form.getFieldValue('SLCFSignature') || []}
                      disabled={isView}
                    >
                      <Button
                        className="upload-doc"
                        size="large"
                        icon={<UploadOutlined />}
                        disabled={isView}
                      >
                        {t('validationAgreement:upload')}
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>

                <div className="authorized-signatory">
                  <p>Authorized Signatory </p>
                  <p>Zimbabwe Climate Fund (Pvt) Ltd.</p>
                  <p>“Sobadam Piyasa”, </p>
                  <p>No. 416/C/1, </p>
                  <p>Robert Gunawardana Mawatha, </p>
                  <p>Battaramulla, Zimbabwe.</p>
                </div>
              </Col>

              <Col md={24} xl={10}>
                <span className="client-behalf">
                  <Form.Item
                    name="clientBehalf"
                    label="On behalf of;"
                    rules={[
                      {
                        required: true,
                        message: `On Behalf of; ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled />
                  </Form.Item>
                </span>

                <span className="signature-upload">
                  <div className="mg-top-1">
                    <LabelWithTooltip label="Signature" required={true} />
                  </div>
                  <Form.Item
                    name="clientSignature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[
                      {
                        required: true,
                        message: `Signature ${t('isRequired')}`,
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
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                      fileList={form.getFieldValue('clientSignature') || []}
                      disabled={isView}
                    >
                      <Button
                        className="upload-doc"
                        size="large"
                        icon={<UploadOutlined />}
                        disabled={isView}
                      >
                        {t('validationAgreement:upload')}
                      </Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item
                    name="clientAuthorizedSignatory"
                    className="authorized-signatory"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={5} disabled={isView} />
                  </Form.Item>
                </span>
              </Col>
            </Row>

            <Row justify={'space-between'} gutter={40} className="mg-top-1">
              <Col md={24} xl={10}>
                <Form.Item name="SLCFWitness" label="Witness" className="witness-input">
                  <Input
                    defaultValue={'Zimbabwe Climate Fund (PVT) Ltd'}
                    placeholder="Zimbabwe Climate Fund (PVT) Ltd"
                    disabled
                  />
                </Form.Item>

                <div>
                  <LabelWithTooltip label="Signature" required={true} />
                  <Form.Item
                    name="SLCFWitnessSignature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[
                      {
                        required: true,
                        message: `Signature ${t('isRequired')}`,
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
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                      disabled={isView}
                      fileList={form.getFieldValue('SLCFWitnessSignature') || []}
                    >
                      <Button
                        className="upload-doc"
                        size="large"
                        icon={<UploadOutlined />}
                        disabled={isView}
                      >
                        {t('validationAgreement:upload')}
                      </Button>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="SLCFWitnessName"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: `Name ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={isView} />
                  </Form.Item>

                  <Form.Item
                    name="SLCFWitnessDesignation"
                    label="Designation"
                    rules={[
                      {
                        required: true,
                        message: `Designation ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={isView} />
                  </Form.Item>
                </div>
              </Col>
              <Col md={24} xl={10}>
                <Form.Item
                  name="clientBehalf"
                  label="Witness"
                  className="witness-input"
                  rules={[
                    {
                      required: true,
                      message: `Witness ${t('isRequired')}`,
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>

                <div>
                  <LabelWithTooltip label="Signature" required={true} />
                  <Form.Item
                    name="ClientWitnessSignature"
                    // label="Signature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `Signature ${t('isRequired')}`,
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
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                      disabled={isView}
                      // defaultFileList={form.getFieldValue('ClientWitnessSignature') || []}
                      fileList={form.getFieldValue('ClientWitnessSignature') || []}
                    >
                      <Button
                        className="upload-doc"
                        size="large"
                        icon={<UploadOutlined />}
                        disabled={isView}
                      >
                        {t('validationAgreement:upload')}
                      </Button>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="clientWitnessName"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: `Name is ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={isView} />
                  </Form.Item>

                  <Form.Item
                    name="clientWitnessDesignation"
                    label="Designation"
                    rules={[
                      {
                        required: true,
                        message: `Designation ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={isView} />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            <h4 className="annexures">{t('validationAgreement:annexureA')}</h4>

            <Form.Item
              label="Additional Comments"
              name="annexureAadditionalComments"
              rules={[
                {
                  required: true,
                  message: `Additional Comments ${t('isRequired')}`,
                },
              ]}
            >
              <TextArea rows={3} disabled={isView} />
            </Form.Item>

            <>
              <LabelWithTooltip
                label={`${t('validationAgreement:uploadAdditionalDocuments')}`}
                required={true}
              />
              <Form.Item
                name="annexureAadditionalDocs"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (file?.length > 0) {
                        if (
                          !isValidateFileType(
                            file[0]?.type,
                            DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                          )
                        ) {
                          throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                  name="design"
                  action="/upload.do"
                  listType="picture"
                  multiple={false}
                  maxCount={1}
                  disabled={isView}
                  fileList={form.getFieldValue('annexureAadditionalDocs') || []}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={isView}
                  >
                    {t('validationAgreement:upload')}
                  </Button>
                </Upload>
              </Form.Item>
            </>

            <h4 className="annexures">{t('validationAgreement:annexureB')}</h4>

            <Form.Item
              label="Additional Comments"
              name="annexureBadditionalComments"
              rules={[
                {
                  required: true,
                  message: `Additional Comments ${t('isRequired')}`,
                },
              ]}
            >
              <TextArea rows={3} disabled={isView} />
            </Form.Item>

            <>
              <LabelWithTooltip
                label={`${t('validationAgreement:uploadAdditionalDocuments')}`}
                required={true}
              />
              <Form.Item
                name="annexureBadditionalDocs"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (file?.length > 0) {
                        if (
                          !isValidateFileType(
                            file[0]?.type,
                            DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                          )
                        ) {
                          throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                  name="design"
                  action="/upload.do"
                  listType="picture"
                  multiple={false}
                  maxCount={1}
                  disabled={isView}
                  fileList={form.getFieldValue('annexureBadditionalDocs') || []}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={isView}
                  >
                    {t('validationAgreement:upload')}
                  </Button>
                </Upload>
              </Form.Item>
            </>
          </div>
          {/* Signatures and annexure end */}

          <Row justify={'end'} className="step-actions-end">
            {isView ? (
              <>
                <Button danger size={'large'} onClick={navigateToDetailsPage}>
                  {t('validationAgreement:back')}
                </Button>
              </>
            ) : (
              <>
                <Button danger size={'large'} onClick={navigateToDetailsPage}>
                  {t('validationAgreement:cancel')}
                </Button>
                <Button type="primary" size={'large'} htmlType="submit">
                  {t('validationAgreement:submit')}
                </Button>
              </>
            )}
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default ValidationAgreement;
