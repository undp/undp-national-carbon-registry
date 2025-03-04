import { Button, Col, Form, Input, Row, StepProps, Upload } from 'antd';
import React, { useState } from 'react';
import { CustomStepsProps } from './StepProps';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';
import { UploadOutlined } from '@ant-design/icons';
import { DocType } from '../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
  Country,
} from 'react-phone-number-input';
import validator from 'validator';

// import { countries } from 'react-circle-flags';

const Step08 = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, submitForm, disableFields, countries } =
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

  const onFinish = async (values: any) => {
    const tempValues = {
      organizationName: values?.organizationName,
      email: values?.email,
      website: values?.website,
      telephone: values?.telephone,
      contactPerson: values?.contactPerson,
      country: values?.country,
      address: values?.address,
      annexures: values?.additionalComments,
      appendix2Comments: values?.appendix2Comments,
      appendix2Documents: await (async function () {
        const base64Docs: string[] = [];
        if (values?.appendix2Documents && values?.appendix2Documents.length > 0) {
          const docs = values.appendix2Documents;
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]?.originFileObj === undefined) {
              base64Docs.push(docs[i]?.url);
            } else {
              const temp = await getBase64(docs[i]?.originFileObj as RcFile);
              base64Docs.push(temp); // No need for Promise.resolve
            }
          }
        }
        return base64Docs;
      })(),
      appendix3Comments: values?.appendix2Comments,
      appendix3Documents: await (async function () {
        const base64Docs: string[] = [];
        if (values?.appendix3Documents && values?.appendix3Documents.length > 0) {
          const docs = values.appendix3Documents;
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]?.originFileObj === undefined) {
              base64Docs.push(docs[i]?.url);
            } else {
              const temp = await getBase64(docs[i]?.originFileObj as RcFile);
              base64Docs.push(temp); // No need for Promise.resolve
            }
          }
        }
        return base64Docs;
      })(),
      appendix4Comments: values?.appendix2Comments,
      appendix4Documents: await (async function () {
        const base64Docs: string[] = [];
        if (values?.appendix4Documents && values?.appendix4Documents.length > 0) {
          const docs = values.appendix4Documents;
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]?.originFileObj === undefined) {
              base64Docs.push(docs[i]?.url);
            } else {
              const temp = await getBase64(docs[i]?.originFileObj as RcFile);
              base64Docs.push(temp); // No need for Promise.resolve
            }
          }
        }
        return base64Docs;
      })(),
      appendix5Comments: values?.appendix2Comments,
      appendix5Documents: await (async function () {
        const base64Docs: string[] = [];
        if (values?.appendix5Documents && values?.appendix5Documents.length > 0) {
          const docs = values.appendix5Documents;
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]?.originFileObj === undefined) {
              base64Docs.push(docs[i]?.url);
            } else {
              const temp = await getBase64(docs[i]?.originFileObj as RcFile);
              base64Docs.push(temp); // No need for Promise.resolve
            }
          }
        }
        return base64Docs;
      })(),
      appendix6Comments: values?.appendix2Comments,
      appendix6Documents: await (async function () {
        const base64Docs: string[] = [];
        if (values?.appendix6Documents && values?.appendix6Documents.length > 0) {
          const docs = values.appendix6Documents;
          for (let i = 0; i < docs.length; i++) {
            if (docs[i]?.originFileObj === undefined) {
              base64Docs.push(docs[i]?.url);
            } else {
              const temp = await getBase64(docs[i]?.originFileObj as RcFile);
              base64Docs.push(temp); // No need for Promise.resolve
            }
          }
        }
        return base64Docs;
      })(),
    };

    console.log('----------tempValues-----------', tempValues);
    if (submitForm) {
      submitForm(tempValues);
    }
    // handleValuesUpdate({ appendix: tempValues });
  };

  const [contactNoInput] = useState<any>();

  console.log('---countries---', countries);

  return (
    <>
      {current === 7 && (
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

                // if (submitForm) {
                //   setTimeout(() => submitForm(), 1000);
                // }
                // if (next) {
                //   next()
                // }
              }}
            >
              <>
                {/* appendix 1 start */}
                <h4 className="appendix-title">
                  <i>{`${t('PDD:appendix1')}`}</i> : {t('PDD:appendix1Title')}
                </h4>
                <div>
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('PDD:organizationName')}
                          name="organizationName"
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
                                  throw new Error(
                                    `${t('PDD:organizationName')} ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('PDD:email')}
                          name="email"
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
                                  throw new Error(`${t('PDD:email')} ${t('isRequired')}`);
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(`${t('PDD:email')} ${t('isInvalid')}`);
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('PDD:website')}
                          name="website"
                          className="website-input"
                          rules={[
                            {
                              required: true,
                              message: `${t('PDD:website')} ${t('isRequired')}`,
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() !== '' ||
                                  String(value).trim() !== undefined ||
                                  value !== null ||
                                  value !== undefined
                                ) {
                                  if (value && !validator.isURL(value))
                                    throw new Error(`${t('PDD:website')} ${t('isInvalid')}`);
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" disabled={disableFields} />
                        </Form.Item>

                        <Form.Item
                          label={t('PDD:telephone')}
                          name="telephone"
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
                                  throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                                } else {
                                  const phoneNo = formatPhoneNumber(String(value));
                                  if (String(value).trim() !== '') {
                                    if (
                                      phoneNo === null ||
                                      phoneNo === '' ||
                                      phoneNo === undefined
                                    ) {
                                      throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                                    } else {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(`${t('PDD:telephone')} ${t('isInvalid')}`);
                                      }
                                    }
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <PhoneInput
                            // placeholder={t('PDD:telephone')}
                            international
                            value={formatPhoneNumberIntl(contactNoInput)}
                            defaultCountry="LK"
                            countryCallingCodeEditable={false}
                            onChange={(v) => {}}
                            countries={countries as Country[]}
                          />
                        </Form.Item>

                        <Form.Item
                          label={t('PDD:contactPerson')}
                          name="contactPerson"
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
                                  throw new Error(`${t('PDD:contactPerson')} ${t('isRequired')}`);
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('PDD:country')}
                        name="country"
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
                                throw new Error(`${t('PDD:country')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('PDD:address')}
                        name="address"
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
                                throw new Error(`${t('PDD:address')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={5} />
                      </Form.Item>

                      <div className="appendix-fax-top-margin">
                        <Form.Item
                          label={t('PDD:fax')}
                          name="fax"
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
                                  throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                                } else {
                                  const phoneNo = formatPhoneNumber(String(value));
                                  if (String(value).trim() !== '') {
                                    if (
                                      phoneNo === null ||
                                      phoneNo === '' ||
                                      phoneNo === undefined
                                    ) {
                                      throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                                    } else {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(`${t('PDD:telephone')} ${t('isInvalid')}`);
                                      }
                                    }
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <PhoneInput
                            // placeholder={t('PDD:telephone')}
                            international
                            value={formatPhoneNumberIntl(contactNoInput)}
                            defaultCountry="LK"
                            countryCallingCodeEditable={false}
                            onChange={(v) => {}}
                            countries={countries as Country[]}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </div>
              </>
              {/* appendix 1 end */}

              {/* appendix 2 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix2')}`}</i> : {t('PDD:appendix2Title')}
              </h4>
              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix2Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix2Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 2 end */}

              {/* appendix 3 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix3')}`}</i> : {t('PDD:appendix3Title')}
              </h4>
              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix3Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix3Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 3 end */}

              {/* appendix 4 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix4')}`}</i> : {t('PDD:appendix4Title')}
              </h4>
              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix4Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix4Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 4 end */}

              {/* appendix 5 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix5')}`}</i> : {t('PDD:appendix5Title')}
              </h4>

              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix5Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix5Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 5 end */}

              {/* appendix 6 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix6')}`}</i> : {t('PDD:appendix6Title')}
              </h4>

              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix6Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix6Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 6 end */}

              {/* appendix 7 start */}
              <h4 className="appendix-title">
                <i>{`${t('PDD:appendix7')}`}</i> : {t('PDD:appendix7Title')}
              </h4>

              <Form.Item
                className='className="full-width-form-item'
                // label={`${t('PDD:additionalComments')}`}
                name="appendix7Comments"
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
                        throw new Error(`${t('PDD:additionalComments')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label={t('PDD:uploadDocsAppendix')}
                name="appendix7Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;
                      if (file?.length > 0) {
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
                  multiple={true}
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item>
              {/* appendix 7 end */}

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('PDD:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('PDD:goBackProjectDetails')}
                  </Button>
                ) : (
                  <Button type="primary" size={'large'} htmlType={'submit'}>
                    {t('PDD:submit')}
                  </Button>
                )}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default Step08;
