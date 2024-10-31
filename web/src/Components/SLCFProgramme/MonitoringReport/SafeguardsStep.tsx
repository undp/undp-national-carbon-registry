import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';

export const SafeguardsStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, prev, onValueChange } = props;

  const t = translator.t;
  return (
    <>
      {current === 3 && (
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
              onFinish={(values: any) => {
                onValueChange({ safeguards: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`3.1 ${t('monitoringReport:s_noNetHarm')}`}
                      name="noNetHarm"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:s_noNetHarm')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.2 ${t('monitoringReport:s_stakeholderConsultation')}`}
                      name="stakeholderConsultation"
                      tooltip={{
                        title: (
                          <div className="tooltip">
                            <p>
                              Describe the process for, and the outcomes from, ongoing communication
                              with local stakeholders conducted prior to verification. Include
                              details on the following
                            </p>
                            <ul>
                              <li>
                                The procedures or methods used for engaging local stakeholders (eg,
                                dates of announcements or meetings, periods during which input was
                                sought).
                              </li>
                              <li>
                                The procedures or methods used for documenting the outcomes of the
                                local stakeholder communication
                              </li>
                              <li>
                                The mechanism for on-going communication with local stakeholders
                              </li>
                              <li>
                                How due account of all and any input received during ongoing
                                communication has been taken. Include details on any updates to the
                                project design or justify why updates are not appropriate. For AFOLU
                              </li>
                            </ul>
                            <p>
                              Projects, also demonstrate how the project has communicated the
                              following with local stakeholders
                            </p>
                            <ul>
                              <li>
                                The results of project implementation, including the results of
                                monitoring
                              </li>
                              <li>
                                Any changes, where relevant, to risks, costs and benefits the
                                project may bring to local stakeholders
                              </li>
                              <li>
                                Any changes, where relevant, to relevant laws and regulations
                                covering workers’ right in the host country
                              </li>
                              <li>
                                The process of SLCCS verification and the validation/verification
                                body’s site visit
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
                          message: `${t('monitoringReport:s_stakeholderConsultation')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.3 ${t('monitoringReport:s_afoluSpecificSafeguards')}`}
                      name="afoluSpecificSafeguards"
                      tooltip={{
                        title: (
                          <div className="tooltip">
                            <p> For AFOLU projects, provide details on the following </p>
                            <ul>
                              <li>
                                Activities implemented to mitigate risks local stakeholders due to
                                project implementation.
                              </li>
                              <li>
                                Any updates, where relevant, to the property and land use rights of
                                the local stakeholders and a demonstration that the project has not
                                negatively impacted such rights without first obtaining the free,
                                prior and informed consent of the affected parties, and provided
                                just and fair compensation if done so.
                              </li>
                              <li>
                                The processes used to communicate and consult with local
                                stakeholders during the monitoring period, including any information
                                about any conflicts that arose between the project proponent and
                                local stakeholders and whether any such conflicts were resolved via
                                the established grievance redress procedure.
                              </li>
                            </ul>
                            <p>
                              For AFOLU projects with no impacts on local stakeholders, provide
                              evidence of such.
                            </p>
                            <p>For non-AFOLU projects, this section is not required.</p>
                          </div>
                        ),
                        icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                        placement: 'topLeft',
                      }}
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:s_afoluSpecificSafeguards')} ${t(
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
