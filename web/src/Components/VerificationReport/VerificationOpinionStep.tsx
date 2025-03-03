import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';

import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

export const VerificationOpinionStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, countries, prev, onValueChange } =
    props;
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const t = translator.t;
  return (
    <>
      {current === 4 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              disabled={FormMode.VIEW === formMode}
              onFinish={async (values: any) => {
                onValueChange({ verificationOpinion: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:verificationOpinion')}`}
                      name="verificationOpinion"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:verificationOpinion')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:signature')}
                      name="signature1"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={FormMode.VIEW !== formMode}
                      rules={
                        FormMode.VIEW === formMode
                          ? []
                          : [
                              {
                                validator: async (rule, file) => {
                                  if (file?.length > 0) {
                                    if (file[0]?.size > maximumImageSize) {
                                      // default size format of files would be in bytes -> 1MB = 1000000bytes
                                      throw new Error(`${t('common:maxSizeVal')}`);
                                    }
                                  }
                                },
                              },
                            ]
                      }
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
                        // maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          {t('verificationReport:upload')}
                        </Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:name')}
                      name="name1"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('verificationReport:name')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:designation')}
                      name="designation1"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:designation')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:dateOfSignature')}
                      name="dateOfSignature1"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:dateOfSignature')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('verificationReport:signature')}
                      name="signature2"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={FormMode.VIEW !== formMode}
                      rules={
                        FormMode.VIEW === formMode
                          ? []
                          : [
                              {
                                validator: async (rule, file) => {
                                  if (file?.length > 0) {
                                    if (file[0]?.size > maximumImageSize) {
                                      // default size format of files would be in bytes -> 1MB = 1000000bytes
                                      throw new Error(`${t('common:maxSizeVal')}`);
                                    }
                                  }
                                },
                              },
                            ]
                      }
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
                        // maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          {t('verificationReport:upload')}
                        </Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:name')}
                      name="name2"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('verificationReport:name')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:designation')}
                      name="designation2"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:designation')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:dateOfSignature')}
                      name="dateOfSignature2"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:dateOfSignature')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false}>
                  {t('verificationReport:back')}
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
                  {t('verificationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
