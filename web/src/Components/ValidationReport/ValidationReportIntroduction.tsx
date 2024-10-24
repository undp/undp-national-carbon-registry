import React, { useEffect } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import { ProcessSteps } from './ValidationStepperComponent';

const ValidationReportIntroduction = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate, existingFormValues } = props;

  useEffect(() => {
    if (existingFormValues) {
      form.setFieldsValue({
        ...existingFormValues,
      });
    }
  }, []);

  const onFinish = (values: any) => {
    const introductionFormValues = {
      objective: values?.objective,
      scopeAndCriteria: values?.scopeAndCriteria,
      titleOfTheProjectActivity: values?.titleOfTheProjectActivity,
      projectParticipants: values?.projectParticipants,
      hostParty: values?.hostParty,
      consultantOfTheProject: values?.consultantOfTheProject,
      summaryDescriptionProject: values?.summaryDescriptionProject,
    };

    console.log(ProcessSteps.VR_INTRODUCTION, introductionFormValues);

    handleValuesUpdate({ [ProcessSteps.VR_INTRODUCTION]: introductionFormValues });
  };

  return (
    <>
      {current === 1 && (
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
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Form.Item
                className="full-width-form-item"
                label={`1.1 ${t('validationReport:objective')}`}
                name="objective"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:objective')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder="Explain the purpose of the validation." />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.2 ${t('validationReport:scopeAndCriteria')}`}
                name="scopeAndCriteria"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:scopeAndCriteria')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the scope and criteria of the validation."
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.3 ${t('validationReport:involvedPartiesAndParticipeant')}`}
                name="involvedPartiesAndParticipeant"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:involvedPartiesAndParticipeant')}  ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <div className="form-section mg-top-1">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={24} md={24}>
                      <div className="step-form-right-col form-grid">
                        <Form.Item
                          label={t('validationReport:titleOfTheProjectActivity')}
                          name="titleOfTheProjectActivity"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:titleOfTheProjectActivity')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:projectParticipants')}
                          name="projectParticipants"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:projectParticipants')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:hostParty')}
                          name="hostParty"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:hostParty')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:consultantOfTheProject')}
                          name="consultantOfTheProject"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:consultantOfTheProject')} ${t(
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
                </div>
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.4 ${t('validationReport:summaryDescriptionProject')}`}
                name="summaryDescriptionProject"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:summaryDescriptionProject')} `,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project (no more than one page)."
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  onClick={next}
                  // htmlType="submit"
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

export default ValidationReportIntroduction;
