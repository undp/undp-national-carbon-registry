import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';

export const ImplementationStatusStep = (props: any) => {
  const { useLocation, translator, current, form, next, prev } = props;

  const t = translator.t;
  return (
    <>
      {current === 2 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => console.log('-----form values-------', values)}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:is_statusOfPA')}
                      name="is_statusOfPA"
                      tooltip={{
                        title: (
                          <div className="tooltip">
                            <p> The description should include</p>
                            <ul>
                              <li>
                                The operation of the project activity(s) during this monitoring
                                period, including any information on events that may impact the GHG
                                emission reductions or removals and monitoring.
                              </li>
                              <li>
                                For AFOLU projects, where no new project activities that lead to the
                                intended GHG benefit commenced during the monitoring period, discuss
                                whether project activities that commenced prior to the monitoring
                                period continued to be implemented during the monitoring period.
                              </li>
                              <li>
                                Where applicable, describe how leakage and non-permanence risk
                                factors are being monitored and managed for AFOLU projects.
                              </li>
                              <li>
                                Any other changes (eg, to project proponent or other entities).
                              </li>
                            </ul>
                          </div>
                        ),
                        icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                        placement: 'topLeft',
                      }}
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_statusOfPA')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:is_statusOfPA')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <h4 className="form-section-title">{t('monitoringReport:is_deviations')}</h4>
                    <Form.Item
                      label={t('monitoringReport:is_methodologyDeviations')}
                      name="is_methodologyDeviations"
                      tooltip={{
                        title: (
                          <div className="tooltip">
                            <p> Include evidence to demonstrate the following</p>
                            <ul>
                              <li>
                                The deviation does not negatively impact the conservativeness of the
                                quantification of GHG emission reductions or removals.
                              </li>
                              <li>
                                The deviations relates only to the criteria and procedures for
                                monitoring or measurement, and do not relate to any other part of
                                the methodology
                              </li>
                            </ul>
                          </div>
                        ),
                        icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                        placement: 'topLeft',
                      }}
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_methodologyDeviations')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:is_methodologyDeviationsPlacholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:is_descriptionDeviations')}
                      name="is_descriptionDeviations"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_descriptionDeviations')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:is_descriptionDeviationsPlacholder')}`}
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
                <Button type="primary" onClick={next}>
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
