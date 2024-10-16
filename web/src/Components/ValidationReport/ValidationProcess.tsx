import React from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined } from '@ant-design/icons';

const ValidationProcess = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;
  return (
    <>
      {current === 3 && (
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
                // onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <h4>3.2 {t('validationReport:safeguards')}</h4>

              <Row gutter={60}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.2 ${t('validationReport:noNetHarm')}`}
                    name="noNetHarm"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:noNetHarm')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Identify and discuss any potential negative environmental and socio-economic impacts  identified by the project proponent. Discuss whether reasonable steps have been taken  to mitigate such impacts."
                    />
                  </Form.Item>
                </Col>

                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.3 ${t('validationReport:environmentImpact')}`}
                    name="environmentImpact"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:environmentImpact')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder={`Identify and discuss the implications of any environmental impact assessments  conducted with respect to the project.`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                className="full-width-form-item"
                label={`3.2.2 ${t('validationReport:localStakeholderConsultation')}`}
                name="localStakeholderConsultation"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:localStakeholderConsultation')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder={`Summarize any stakeholder input received during the local stakeholder consultation.  Assess whether the project proponent has taken due account of all and any input, and  provide an overall conclusion regarding local stakeholder input. Include the project proponent’s response to all input, describe any resultant changes to  the project design and provide an explanation of how the project proponent’s responses  are appropriate. For AFOLU projects, identify, discuss and justify a conclusion regarding whether the  project communicated information about the project design and implementation, risks,  costs and benefits, relevant laws and regulations.`}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.2.2 ${t('validationReport:localStakeholderConsultation')}`}
                name="localStakeholderConsultation"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:localStakeholderConsultation')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder={`Summarize any stakeholder input received during the local stakeholder consultation.  Assess whether the project proponent has taken due account of all and any input, and  provide an overall conclusion regarding local stakeholder input. Include the project proponent’s response to all input, describe any resultant changes to  the project design and provide an explanation of how the project proponent’s responses  are appropriate. For AFOLU projects, identify, discuss and justify a conclusion regarding whether the  project communicated information about the project design and implementation, risks,  costs and benefits, relevant laws and regulations.`}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.2.2 ${t('validationReport:aflouSafeGuards')}`}
                name="aflouSafeGuards"
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>For AFOLU projects, describe the steps taken to assess: </p>
                      <ul>
                        <li>
                          The local stakeholder identification process and the description of
                          results.{' '}
                        </li>
                        <li>
                          Risks to local stakeholders due to project implementation and how the
                          project will mitigate such risks.
                        </li>
                        <li>
                          Risks to local stakeholder resources due to project implementation and how
                          the project will mitigate such risks, including plans to ensure the
                          project will not impact local stakeholders’ property rights without the
                          free, prior and informed consent.{' '}
                        </li>
                        <li>
                          Processes to ensure ongoing communication and consultation, including a
                          grievance redress procedure to resolve any conflicts that may arise
                          between the project proponent and local stakeholders.
                        </li>
                      </ul>
                      <p>
                        Identify, discuss and justify a conclusion regarding whether the project has
                        been designed and, as appropriate, is implementing, plans and processes to
                        ensure the project will not create any negative impacts on local
                        stakeholders or mitigates such impacts where necessary. For AFOLU projects
                        that have claimed to have no impacts on local stakeholders, provide an
                        assessment of the evidence provided and identify, discuss and justify a
                        conclusion as to whether the project has no impacts on local stakeholders.
                        For non-AFOLU projects, this section is not required.
                      </p>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:aflouSafeGuards')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Row gutter={60}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`${t('validationReport:publicCommments')}`}
                    name="publicCommments"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:publicCommments')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Summarize any public comments submitted during the public comment period. Assess  whether the project proponent has taken due account of all and any comments, and  provide an overall conclusion regarding public comments."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <h4 className="mg-top-1 mg-bottom-1">
                {t('validationReport:applicationOfMethodology')}
              </h4>

              <p className="custom-required">{t('validationReport:titleAndReference')}</p>
              <Row gutter={60}>
                <Col md={24} xl={12}>
                  <Form.Item
                    name="title"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:titleAndReference')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input placeholder="Provide the title" />
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    name="titleAndReference"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:titleAndReference')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Provide the title and reference of the applied methodology and any tools. Note that the  methodology and tools, and the specific versions of them applied by the project, must be  valid at the time of validation"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                className="full-width-form-item"
                label={`2.5 ${t('validationReport:resolutionOfFindings')}`}
                name="resolutionOfFindings"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:resolutionOfFindings')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the process for the resolution of findings (corrective actions, clarifications or  other findings) raised by the validation team during the validation.  State the total number of corrective action requests, clarification requests, forward  action requests and other findings raised during the validation. Provide a summary of each finding, including the issue raised, the response(s)  provided by the project proponent, and the final conclusion and any resulting changes  to project documents."
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={next}
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

export default ValidationProcess;
