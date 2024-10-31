import React from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Input, Col, Upload, DatePicker } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { DocType } from '../../Definitions/Enums/document.type';
import TextArea from 'antd/lib/input/TextArea';
import { ProcessSteps } from './ValidationStepperComponent';
import moment from 'moment';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

const ValidationOpinion = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate, formMode } = props;

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    const sig1 = (await fileUploadValueExtract(values, 'validator1Signature'))[0];
    const sig2 = (await fileUploadValueExtract(values, 'validator2Signature'))[0];

    const validationOpinionFormValues: any = {
      opinion: values?.opinion,
      validator1Signature: sig1,
      validator1Designation: values?.validator1Designation,
      validator1Name: values?.validator1Name,
      validator1DateOfSign: moment(values?.validator1DateOfSign).valueOf(),
      validator2Designation: values?.validator2Designation,
      validator2Name: values?.validator2Name,
      validator2Signature: sig2,
      validator2DateOfSign: moment(values?.validator2DateOfSign).valueOf(),
    };

    console.log(ProcessSteps.VR_VALIDATION_OPINION, validationOpinionFormValues);
    handleValuesUpdate({ [ProcessSteps.VR_VALIDATION_OPINION]: validationOpinionFormValues });
  };

  return (
    <>
      {current === 5 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
              disabled={FormMode.VIEW === formMode}
            >
              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:validationOpinion')}`}
                name="opinion"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:validationOpinion')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
              </Form.Item>

              <Row justify={'space-between'} gutter={40} className="mg-top-1">
                <Col md={24} xl={10}>
                  <p className="no-margin-p">{t('validationReport:witness')}</p>

                  <div className="signature-upload">
                    <Form.Item
                      name="validator1Signature"
                      label={t('validationReport:signature')}
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      // required={true}
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:signature')}  ${t('isRequired')}`,
                        },
                        {
                          validator: async (rule, file) => {
                            if (file?.length > 0) {
                              // if (
                              //   !isValidateFileType(
                              //     file[0]?.type,
                              //     DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              //   )
                              // ) {
                              //   throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                              // } else
                              if (file[0]?.size > maximumImageSize) {
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
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="validator1Name"
                    label={t('validationReport:name')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:name')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="validator1Designation"
                    label={t('validationReport:designation')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:designation')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="validator1DateOfSign"
                    label={t('validationReport:dateOfSignature')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:dateOfSignature')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    />
                  </Form.Item>
                </Col>
                <Col md={24} xl={10}>
                  <p className="no-margin-p">{t('validationReport:witness')}</p>

                  <div className="signature-upload">
                    <Form.Item
                      name="validator2Signature"
                      label={t('validationReport:signature')}
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      // required={true}
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:signature')}  ${t('isRequired')}`,
                        },
                        {
                          validator: async (rule, file) => {
                            if (file?.length > 0) {
                              // if (
                              //   !isValidateFileType(
                              //     file[0]?.type,
                              //     DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              //   )
                              // ) {
                              //   throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                              // } else
                              if (file[0]?.size > maximumImageSize) {
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
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="validator2Name"
                    label={t('validationReport:name')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:name')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="validator2Designation"
                    label={t('validationReport:designation')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:designation')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="validator2DateOfSign"
                    label={t('validationReport:dateOfSignature')}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:dateOfSignature')}  ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  disabled={false}
                  // onClick={next}
                  // onClick={() => {
                  //   console.log(form.getFieldsValue());
                  // }}
                  htmlType="submit"
                >
                  {t('validationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ValidationOpinion;
