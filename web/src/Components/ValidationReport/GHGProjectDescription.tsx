import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col } from 'antd';
import TextArea from 'antd/lib/input/TextArea';

const ValidationConclusion = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;
  return (
    <>
      {current === 2 && (
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
              <Form.Item
                className="full-width-form-item"
                label={`2.1 ${t('validationReport:methodAndCriteria')}`}
                name="methodAndCriteria"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:methodAndCriteria')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the method and criteria, including the sampling plan, used for undertaking the  validation. Where sampling plans are used as a part of the validation, include a  description of the sampling approach, important assumptions and justification of the  chosen approach."
                />
              </Form.Item>

              <Row gutter={60}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.2 ${t('validationReport:documentReview')}`}
                    name="documentReview"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:documentReview')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Describe how the validation was performed as an audit where the project description and  any supporting documents were reviewed, cross-checked and compared with identified  and stated requirements."
                    />
                  </Form.Item>
                </Col>

                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.3 ${t('validationReport:interviews')}`}
                    name="interviews"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:interviews')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Describe the interview process and identify personnel, including their roles, who were  interviewed and/or provided information additional to that provided in the project  description and any supporting documents."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={60}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.4 ${t('validationReport:siteInspection')}`}
                    name="siteInspection"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:siteInspection')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Describe how the validation was performed as an audit where the project description and  any supporting documents were reviewed, cross-checked and compared with identified  and stated requirements."
                    />
                  </Form.Item>
                </Col>

                <Col md={24} xl={12}>
                  <Form.Item
                    label={`2.5.1 ${t('validationReport:forwardActionRequests')}`}
                    name="forwardActionRequests"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:forwardActionRequests')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Provide details of any forward action requests raised during the validation, for the  benefit of subsequent project audits."
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

export default ValidationConclusion;
