import { Button, Col, Form, Input, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { CustomStepsProps } from './StepProps';

export const DataAndParametersStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  // const t = translator.t;

  const onFinish = (values: any) => {
    // console.log('onFinish triggered');
    // console.log('-----------temp Values before-------');
    const tempValues: any = {
      dataAndParameterDetails: {
        dp_dataParameter: values?.dp_dataParameter,
        dp_dataUnit: values?.dp_dataUnit,
        dp_description: values?.dp_description,
        dp_sourceOfData: values?.dp_sourceOfData,
        dp_valueApplied: values?.dp_valueApplied,
        dp_choiceOfDataOrMeasurement: values?.dp_choiceOfDataOrMeasurement,
        dp_purposeOfData: values?.dp_purposeOfData,
        dp_comments: values?.dp_comments,
        dp_implementationOfSamplingPlan: values?.dp_implementationOfSamplingPlan,
      },
    };
    // console.log('----------tempValues-------------', tempValues);
    handleValuesUpdate(tempValues);
  };
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
              // disabled={FormMode.VIEW === formMode}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <h3 className="form-section-title">{`${t('monitoringReport:dp_title')}`}</h3>
              <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={12} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_dataParameter')}
                        name="dp_dataParameter"
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
                                  `${t('monitoringReport:dp_dataParameter')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </div>
                  </Col>
                  <Col xl={12} md={24}>
                    <div className="step-form-right-col">
                      <Form.Item
                        label={t('monitoringReport:dp_dataUnit')}
                        name="dp_dataUnit"
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
                                  `${t('monitoringReport:dp_dataUnit')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_description')}
                        name="dp_description"
                        rules={[
                          {
                            required: true,
                            message: `${t('monitoringReport:dp_description')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          disabled={disableFields}
                          placeholder={`${t('monitoringReport:dp_descriptionPlaceholder')}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_sourceOfData')}
                        name="dp_sourceOfData"
                        rules={[
                          {
                            required: true,
                            message: `${t('monitoringReport:dp_sourceOfData')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          disabled={disableFields}
                          placeholder={`${t('monitoringReport:dp_sourceOfDataPlaceholder')}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_valueApplied')}
                        name="dp_valueApplied"
                        rules={[
                          {
                            required: true,
                            message: `${t('monitoringReport:dp_valueApplied')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          disabled={disableFields}
                          placeholder={`${t('monitoringReport:dp_valueAppliedPlaceholder')}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_choiceOfDataOrMeasurement')}
                        name="dp_choiceOfDataOrMeasurement"
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
                                  `${t('monitoringReport:dp_choiceOfDataOrMeasurement')} ${t(
                                    'isRequired'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={6}
                          disabled={disableFields}
                          placeholder={`${t(
                            'monitoringReport:dp_choiceOfDataOrMeasurementPlaceholder'
                          )}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-right-col">
                      <Form.Item
                        label={t('monitoringReport:dp_purposeOfData')}
                        name="dp_purposeOfData"
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
                                  `${t('monitoringReport:dp_purposeOfData')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          disabled={disableFields}
                          placeholder={`${t('monitoringReport:dp_purposeOfDataPlaceholder')}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={24} md={24}>
                    <div className="step-form-left-col">
                      <Form.Item
                        label={t('monitoringReport:dp_comments')}
                        name="dp_comments"
                        rules={[
                          {
                            required: true,
                            message: `${t('monitoringReport:dp_comments')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          disabled={disableFields}
                          placeholder={`${t('monitoringReport:dp_commentsPlaceholder')}`}
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_implementationOfSamplingPlan')}
                      name="dp_implementationOfSamplingPlan"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_implementationOfSamplingPlan')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        disabled={disableFields}
                        rows={6}
                        // placeholder={t('monitoringReport:dpm_descriptionPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button onClick={prev} disabled={false} danger>
                  {t('monitoringReport:back')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('monitoringReport:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('monitoringReport:next')}
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
