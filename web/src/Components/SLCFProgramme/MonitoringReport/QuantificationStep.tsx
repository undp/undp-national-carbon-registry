import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { DocType } from '../../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import moment from 'moment';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { fileUploadValueExtract } from '../../../Utils/utilityHelper';
export const QualificationStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, prev, onValueChange } = props;
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

  const calculateAnnualAverage = () => {
    const years = form.getFieldValue('yearsTotal');

    const beTotal = form.getFieldValue('baselineEmissionsTotal') || 0;
    const beAvg = Number(beTotal) / Number(years);
    form.setFieldValue('baselineEmissionsAverage', beAvg.toFixed(2));

    const peTotal = form.getFieldValue('projectEmissionsTotal') || 0;
    const peAvg = Number(peTotal) / Number(years);
    form.setFieldValue('projectEmissionsAverage', peAvg.toFixed(2));

    const leTotal = form.getFieldValue('leakageEmissionsTotal') || 0;
    const leAvg = Number(leTotal) / Number(years);
    form.setFieldValue('leakageEmissionsAverage', leAvg.toFixed(2));

    const ghgTotal = form.getFieldValue('ghgEmissionsTotal') || 0;
    const ghgAvg = Number(ghgTotal) / Number(years);
    form.setFieldValue('ghgEmissionsAverage', ghgAvg.toFixed(2));
  };

  const onEmissionsYearChange = () => {
    const listVals = form.getFieldValue('emissionReductionsRemovalsList');
    form.setFieldValue('yearsTotal', listVals.length);
    calculateAnnualAverage();
  };

  const onBaselineEmissionsChange = () => {
    const listVals = form.getFieldValue('emissionReductionsRemovalsList');
    let tempTotal = 0;
    if (listVals?.length) {
      listVals.forEach((item: any) => {
        tempTotal =
          typeof item?.baselineEmissions !== 'undefined'
            ? Number(item?.baselineEmissions) + tempTotal
            : tempTotal;
      });
    }
    form.setFieldValue('baselineEmissionsTotal', String(tempTotal));
    calculateAnnualAverage();
  };

  const onProjectEmissionsChange = () => {
    const listVals = form.getFieldValue('emissionReductionsRemovalsList');
    let tempTotal = 0;
    if (listVals?.length) {
      listVals.forEach((item: any) => {
        tempTotal =
          typeof item?.projectEmissions !== 'undefined'
            ? Number(item?.projectEmissions) + tempTotal
            : tempTotal;
      });
    }
    form.setFieldValue('projectEmissionsTotal', String(tempTotal));
    calculateAnnualAverage();
  };

  const onLeakageEmissionsChange = () => {
    const listVals = form.getFieldValue('emissionReductionsRemovalsList');
    let tempTotal = 0;
    if (listVals?.length) {
      listVals.forEach((item: any) => {
        tempTotal =
          typeof item?.leakageEmissions !== 'undefined'
            ? Number(item?.leakageEmissions) + tempTotal
            : tempTotal;
      });
    }
    form.setFieldValue('leakageEmissionsTotal', String(tempTotal));
    calculateAnnualAverage();
  };
  const onGhgEmissionsChange = () => {
    const listVals = form.getFieldValue('emissionReductionsRemovalsList');
    let tempTotal = 0;
    if (listVals?.length) {
      listVals.forEach((item: any) => {
        tempTotal =
          typeof item?.ghgEmissions !== 'undefined'
            ? Number(item?.ghgEmissions) + tempTotal
            : tempTotal;
      });
    }
    form.setFieldValue('ghgEmissionsTotal', String(tempTotal));
    calculateAnnualAverage();
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
              disabled={FormMode.VIEW === formMode}
              initialValues={{
                q_baselineEmission2:
                  'B𝑬𝒚 = 𝑬𝑮𝒚×𝑬F\nWhere,  BEy= Baseline Emissions in year y (tCO2e)  EGy = Quantity of net electricity supplied to the grid as a result of the implementation of the Clean Development Mechanism (CDM) project activity in year y (MWh).\nEFy = CO2 Emission factor of the grid in the year 2020 (tCO2/ MWh)',
              }}
              onFinish={async (values: any) => {
                onValueChange({ quantifications: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`5.1 ${t('monitoringReport:q_baselineEmission')}`}
                      name="q_baselineEmission"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_baselineEmission')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item name="q_baselineEmission2">
                      <TextArea rows={4} disabled={true} />
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
                        // maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
                    </Form.Item>

                    <Form.Item
                      label={`5.2 ${t('monitoringReport:q_projectEmissions')}`}
                      name="q_projectEmissions"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_projectEmissions')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`5.3 ${t('monitoringReport:q_leakage')}`}
                      name="q_leakage"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_leakage')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <>
                      <h4 className="form-section-title">
                        {`5.4 ${t('monitoringReport:q_emissionRedictionAndRemovals')}`}
                      </h4>

                      <Row justify={'space-between'} gutter={[40, 16]}>
                        <Col xl={24} md={24}>
                          <div className="step-form-left-col">
                            <Form.Item
                              name="q_ghgEmission"
                              rules={[
                                {
                                  required: true,
                                  message: `${t(
                                    'monitoringReport:q_emissionRedictionAndRemovals'
                                  )} ${t('isRequired')}`,
                                },
                              ]}
                            >
                              <TextArea
                                rows={4}
                                disabled={FormMode.VIEW === formMode}
                                placeholder="Quantify the net GHG emission reductions and removals, summarizing the key results  using the table below. Specify breakdown of GHG emission reductions and removals by  annually. 
For AFOLU projects, include quantification of the net change in carbon stocks. Also, state  the non-permanence risk rating (as determined in the AFOLU non-permanence risk  report) and calculate the total number of buffer credits that need to be deposited into the  AFOLU pooled buffer account. Attach the non-permanence risk report as either an  appendix or a separate document."
                              />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>
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

                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:leakageEmissionsTitle')}</h4>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:ghgEmissionsTitle')}</h4>
                          </div>
                        </Col>
                        <Col xl={1} md={24}></Col>
                      </Row>

                      <Form.List name="emissionReductionsRemovalsList">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
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
                                                  `${t('monitoringReport:startDate')} ${t(
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
                                      <h4 className="to-lable">{t('monitoringReport:to')}</h4>
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
                                                  `${t('monitoringReport:endDate')} ${t(
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
                                        <Input
                                          size="large"
                                          onChange={(val) => onBaselineEmissionsChange()}
                                        />
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
                                        <Input
                                          size="large"
                                          onChange={(val) => onProjectEmissionsChange()}
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={3} md={24}>
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
                                        <Input
                                          size="large"
                                          onChange={(val) => onLeakageEmissionsChange()}
                                        />
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
                                        <Input
                                          size="large"
                                          onChange={(val) => onGhgEmissionsChange()}
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                  <Col xl={1} md={24}>
                                    <div className="form-list-actions">
                                      <Form.Item>
                                        {name !== 0 && (
                                          <Button
                                            onClick={() => {
                                              remove(name);
                                              onBaselineEmissionsChange();
                                              onProjectEmissionsChange();
                                              onLeakageEmissionsChange();
                                              onGhgEmissionsChange();
                                              onEmissionsYearChange();
                                            }}
                                            size="large"
                                            className="addMinusBtn"
                                            // block
                                            icon={<MinusOutlined />}
                                          >
                                            {/* Remove Entity */}
                                          </Button>
                                        )}
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
                                    onEmissionsYearChange();
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
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="projectEmissionsTotal">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="leakageEmissionsTotal">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="ghgEmissionsTotal">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={1} md={24}></Col>
                      </Row>
                      <Row gutter={[16, 16]} className="form-section">
                        <Col xl={9} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:totalYears')}</h4>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="yearsTotal">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>

                      <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                        <Col xl={9} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:annualAverage')}</h4>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="baselineEmissionsAverage">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={4} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="projectEmissionsAverage">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="leakageEmissionsAverage">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={3} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item name="ghgEmissionsAverage">
                              <Input size="large" disabled />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={1} md={24}></Col>
                      </Row>
                    </>

                    <>
                      <h4 className="form-section-title">
                        {`5.5 ${t('monitoringReport:q_comparisonWithCMA')}`}
                      </h4>

                      <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                        <Col xl={6} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:item')}</h4>
                          </div>
                        </Col>

                        <Col xl={6} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:valueApplied')}</h4>
                          </div>
                        </Col>

                        <Col xl={12} md={24}>
                          <div className="step-form-right-col">
                            <h4>{t('monitoringReport:actualValues')}</h4>
                          </div>
                        </Col>
                      </Row>
                      <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                        <Col xl={6} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="item"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:item')} ${t('isRequired')}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={6} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="valueApplied"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:valueApplied')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>
                          </div>
                        </Col>
                        <Col xl={12} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              name="actualValues"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:actualValues')} ${t(
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
                    <Form.Item
                      label={`5.6 ${t('monitoringReport:q_remarks')}`}
                      name="q_remarks"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:q_remarks')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
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
