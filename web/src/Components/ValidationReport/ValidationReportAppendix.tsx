import { Row, Button, Form, Upload, Col, Input, DatePicker } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { CustomStepsProps } from '../PDD/StepProps';
import { RcFile } from 'antd/lib/upload';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { ProcessSteps } from './ValidationStepperComponent';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import moment from 'moment';
import { useEffect } from 'react';

const ValidationReportAppendix = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, submitForm, t, formMode } = props;

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  useEffect(() => {
    form.setFieldValue('documentsReviewed', [{ author: '' }]);
  }, []);

  const onFinish = async (values: any) => {
    const appendixFormValues: any = {
      ...values,
      appendix1Documents: (await fileUploadValueExtract(values, 'appendix1Documents'))[0],
    };

    console.log(ProcessSteps.VR_APPENDIX, appendixFormValues);
    handleValuesUpdate({ appendix: appendixFormValues });
  };

  return (
    <>
      {current === 9 && (
        <div>
          <div className="val-report-step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                console.log('-------onFInish', values);
                onFinish(values);
              }}
              // disabled={FormMode.VIEW === formMode}
            >
              {/* appendix 1 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t('validationReport:appendix')} 1</i>: {t('validationReport:appendix1Title')}
                </h4>
                <Form.Item
                  // label={`${t('PDD:additionalComments')}`}
                  name="appendix1Comments"
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
                            `${t('validationReport:additionalComments')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={4} />
                </Form.Item>

                <Form.Item
                  label={t('validationReport:uploadDocs')}
                  name="appendix1Documents"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  required={false}
                  rules={[
                    {
                      validator: async (rule, file) => {
                        // if (disableFields) return;
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
                    // disabled={disableFields}
                    // maxCount={1}
                  >
                    <Button
                      className="upload-doc"
                      size="large"
                      icon={<UploadOutlined />}
                      // disabled={disableFields}
                    >
                      {t('validationReport:upload')}
                    </Button>
                  </Upload>
                </Form.Item>
              </>
              {/* appendix 1 end */}

              {/* appendix 2 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t('validationReport:appendix')} 2 </i>: {t('validationReport:appendix2Title')}
                </h4>

                {/* //////////// need to add table */}
                <div className="appendix-documents-reviewed-table">
                  <div className="header">
                    <Row>
                      <Col xl={1} className="col-1 col">
                        No
                      </Col>
                      <Col xl={5} className="col-2 col">
                        Author
                      </Col>
                      <Col xl={5} className="col-3 col">
                        Title
                      </Col>
                      <Col xl={5} className="col-4 col">
                        References to the document
                      </Col>
                      <Col xl={5} className="col-5 col">
                        Provider
                      </Col>
                      <Col xl={2}></Col>
                    </Row>
                  </div>

                  <div className="body">
                    <Form.List name="documentsReviewed">
                      {(fields, { add, remove }) => (
                        <Row>
                          {fields.map(({ key, name, ...restFields }) => (
                            <>
                              <Col xl={1} className="col-1 col" key={key}>
                                {name + 1 < 10 && '0'}
                                {name + 1}
                              </Col>
                              <Col xl={5} className="col-2 col">
                                <Form.Item
                                  name={[name, 'author']}
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
                                            `${t('validationReport:author')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col xl={5} className="col-3 col">
                                <Form.Item
                                  name={[name, 'title']}
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
                                            `${t('validationReport:title')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col xl={5} className="col-4 col">
                                <Form.Item
                                  name={[name, 'referencesToDocument']}
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
                                            `${t('validationReport:referencesToDocument')} ${t(
                                              'isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col xl={5} className="col-5 col">
                                <Form.Item
                                  name={[name, 'provider']}
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
                                            `${t('validationReport:provider')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col xl={3} className="col action-col">
                                {name > 0 && (
                                  <Form.Item>
                                    <Button
                                      // type="dashed"
                                      onClick={() => {
                                        // removeParticipants(name2);
                                        remove(name);
                                      }}
                                      size="small"
                                      className="addMinusBtn"
                                      // block
                                      icon={<MinusOutlined />}
                                      // disabled={disableFields}
                                    >
                                      {/* Minus Participant */}
                                    </Button>
                                  </Form.Item>
                                )}
                                <Form.Item>
                                  <Button
                                    onClick={add}
                                    size="small"
                                    className="addMinusBtn"
                                    icon={<PlusOutlined />}
                                  ></Button>
                                </Form.Item>
                              </Col>
                            </>
                          ))}
                        </Row>
                      )}
                    </Form.List>
                  </div>
                </div>
              </>
              {/* appendix 2 end */}

              {/* appendix 3 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t('validationReport:appendix')} 3 </i>: {t('validationReport:appendix3Title')}
                </h4>

                {/* table 1 start */}
                <h4 className="appendix-title">{t('validationReport:appendixTable1Title')}</h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:cl_id')}`}
                        name="cl_id"
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
                                  `${t('validationReport:cl_id')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="cl_date"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:section')}`}
                        name="cl_section"
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
                                  `${t('validationReport:section')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:description')}`}
                        name="cl_description"
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
                                  `${t('validationReport:description')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:projectParticipantResponse')}`}
                        name="cl_projectParticipantResponse"
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
                                  `${t('validationReport:projectParticipantResponse')} ${t(
                                    'isRequired'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="cl_projectParticipantResponseDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:documentationProvidedByProjectParticipant')}`}
                        name="cl_documentationProvidedByProjectParticipant"
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
                                  `${t(
                                    'validationReport:documentationProvidedByProjectParticipant'
                                  )} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:doeAssesment')}`}
                        name="cl_doeAssesment"
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
                                  `${t('validationReport:doeAssesment')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="cl_doeAssesmentDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                  </Row>
                </div>
                {/* table 1 end */}

                {/* table 2 start */}
                <h4 className="appendix-title">{t('validationReport:appendixTable2Title')}</h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:car_id')}`}
                        name="car_id"
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
                                  `${t('validationReport:car_id')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="car_date"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:section')}`}
                        name="car_section"
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
                                  `${t('validationReport:section')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:description')}`}
                        name="car_description"
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
                                  `${t('validationReport:description')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:projectParticipantResponse')}`}
                        name="car_projectParticipantResponse"
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
                                  `${t('validationReport:projectParticipantResponse')} ${t(
                                    'isRequired'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="car_projectParticipantResponseDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:documentationProvidedByProjectParticipant')}`}
                        name="car_documentationByProjectParticipant"
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
                                  `${t(
                                    'validationReport:documentationProvidedByProjectParticipant'
                                  )} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:doeAssesment')}`}
                        name="car_doeAssesment"
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
                                  `${t('validationReport:doeAssesment')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="car_doeAssesmentDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                  </Row>
                </div>
                {/* table 2 end */}

                {/* table 3 start */}
                <h4 className="appendix-title">{t('validationReport:appendixTable3Title')}</h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:far_id')}`}
                        name="far_id"
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
                                  `${t('validationReport:far_id')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="far_date"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:section')}`}
                        name="far_section"
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
                                  `${t('validationReport:section')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:description')}`}
                        name="far_description"
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
                                  `${t('validationReport:description')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:projectParticipantResponse')}`}
                        name="far_projectParticipantResponse"
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
                                  `${t('validationReport:projectParticipantResponse')} ${t(
                                    'isRequired'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="far_projectParticipantResponseDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t('validationReport:documentationProvidedByProjectParticipant')}`}
                        name="far_documentationByProjectParticipant"
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
                                  `${t(
                                    'validationReport:documentationProvidedByProjectParticipant'
                                  )} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:doeAssesment')}`}
                        name="far_doeAssesment"
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
                                  `${t('validationReport:doeAssesment')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t('validationReport:date')}`}
                        name="far_doeAssesmentDate"
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
                                throw new Error(`${t('validationReport:date')} ${t('isRequired')}`);
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
                    </Col>
                  </Row>
                </div>
                {/* table 3 end */}
              </>
              {/* appendix 3 end */}

              <Row justify={'end'} className="step-actions-end mg-top-2">
                <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                {FormMode.VIEW !== formMode && (
                  <Button type="primary" size={'large'} htmlType="submit" disabled={false}>
                    {t('validationReport:submit')}
                  </Button>
                )}
                {FormMode.VIEW === formMode && (
                  <Button type="primary" size={'large'} disabled={false} onClick={next}>
                    {t('validationReport:backtoProjectDetails')}
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

export default ValidationReportAppendix;
