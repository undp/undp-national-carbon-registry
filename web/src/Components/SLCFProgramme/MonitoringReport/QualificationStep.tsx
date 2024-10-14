import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { DocType } from '../../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import moment from 'moment';
export const QualificationStep = (props: any) => {
  const { useLocation, translator, current, form, next, prev, onValueChange } = props;
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
                values?.emissionReductionsRemovalsList?.unshift({
                  startDate: values.startDate,
                  endDate: values.endDate,
                  baselineEmissions: values.baselineEmissions,
                  projectEmissions: values.projectEmissions,
                  leakageEmissions: values.leakageEmissions,
                  ghgEmissions: values.ghgEmissions,
                });
                delete values.startDate;
                delete values.endDate;
                delete values.baselineEmissions;
                delete values.projectEmissions;
                delete values.leakageEmissions;
                delete values.ghgEmissions;
                values?.emissionReductionsRemovalsList?.forEach((val: any) => {
                  val.startDate = moment(values?.startDate).startOf('day').unix();
                  val.endDate = moment(values?.endDate).startOf('day').unix();
                });
                onValueChange({ qualifications: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:q_baselineEmission')}
                      name="q_baselineEmission"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_baselineEmission')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:q_baselineEmissionPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:q_documentUpload')}
                      name="optionalDocuments"
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
                                throw new Error(`${t('monitoringReport:invalidFileFormat')}`);
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
                        // maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:q_projectEmissions')}
                      name="q_projectEmissions"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_projectEmissions')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:q_projectEmissionsPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:q_leakage')}
                      name="q_leakage"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_leakage')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:q_leakagePlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <>
                      <h4 className="form-section-title">
                        {t('monitoringReport:q_emissionRedictionAndRemovals')}
                      </h4>

                      <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                        <Col xl={9} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:year')}</h4>
                          </div>
                        </Col>

                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:baselineEmissionsTitle')}</h4>
                          </div>
                        </Col>

                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:projectEmissionsTitle')}</h4>
                          </div>
                        </Col>

                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:leakageEmissionsTitle')}</h4>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:ghgEmissionsTitle')}</h4>
                          </div>
                        </Col>
                      </Row>
                      <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="startDate"
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
                                        `${t('monitoringReport:selectDate')} ${t('isRequired')}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="large"
                                disabledDate={(currentDate: any) =>
                                  currentDate < moment().startOf('day')
                                }
                              />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={1} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:to')}</h4>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="endDate"
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
                                        `${t('monitoringReport:selectDate')} ${t('isRequired')}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="large"
                                disabledDate={(currentDate: any) => {
                                  return (
                                    currentDate &&
                                    currentDate <=
                                      moment(form.getFieldsValue().startDate, 'YYYY-MM-DD')
                                  );
                                }}
                              />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="baselineEmissions"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:baselineEmissions')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="projectEmissions"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:projectEmissions')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="leakageEmissions"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:leakageEmissions')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="ghgEmissions"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:ghgEmissions')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>

                      <Form.List name="emissionReductionsRemovalsList">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div className="form-list-actions">
                                  {/* <h4>Entity {name + 2}</h4> */}
                                  <Form.Item>
                                    <Button
                                      // type="dashed"
                                      onClick={() => {
                                        remove(name);
                                      }}
                                      size="large"
                                      className="addMinusBtn"
                                      // block
                                      icon={<MinusOutlined />}
                                    >
                                      {/* Remove Entity */}
                                    </Button>
                                  </Form.Item>
                                </div>
                                <Row
                                  justify={'space-between'}
                                  gutter={[16, 16]}
                                  className="form-section"
                                >
                                  <Col xl={4} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'startDate']}
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
                                                  `${t('monitoringReport:selectDate')} ${t(
                                                    'isRequired'
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <DatePicker
                                          size="large"
                                          disabledDate={(currentDate: any) =>
                                            currentDate < moment().startOf('day')
                                          }
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={1} md={24}>
                                    <div className="step-form-right-col">
                                      <h4>{t('monitoringReport:to')}</h4>
                                    </div>
                                  </Col>
                                  <Col xl={4} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'endDate']}
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
                                                  `${t('monitoringReport:selectDate')} ${t(
                                                    'isRequired'
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <DatePicker
                                          size="large"
                                          disabledDate={(currentDate: any) => {
                                            return (
                                              currentDate &&
                                              currentDate <=
                                                moment(
                                                  form.getFieldsValue()
                                                    .emissionReductionsRemovalsList[name].startDate,
                                                  'YYYY-MM-DD'
                                                )
                                            );
                                          }}
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={4} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'baselineEmissions']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t(
                                              'monitoringReport:baselineEmissions'
                                            )} ${t('isRequired')}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={4} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'projectEmissions']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:projectEmissions')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={4} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'leakageEmissions']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:leakageEmissions')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={3} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        name={[name, 'ghgEmissions']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:ghgEmissions')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                </Row>
                              </>
                            ))}
                            <div className="form-list-actions">
                              <Form.Item>
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    add();
                                  }}
                                  size="large"
                                  className="addMinusBtn"
                                  // block
                                  icon={<PlusOutlined />}
                                >
                                  {/* Add Entity */}
                                </Button>
                              </Form.Item>
                            </div>
                          </>
                        )}
                      </Form.List>

                      <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                        <Col xl={9} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:total')}</h4>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="baselineEmissionsTotal">
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="projectEmissionsTotal">
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="leakageEmissionsTotal">
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="ghgEmissionsTotal">
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>
                    </>

                    <Form.Item
                      label={t('monitoringReport:q_remarks')}
                      name="q_remarks"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_remarks')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:q_remarksPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
                  Next
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
