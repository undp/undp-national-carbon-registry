import React from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form } from 'antd';

const ProjectActivity = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;
  return (
    <>
      {current === 1 && (
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
                // onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              {/* <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:stakeHolderConsultationProcess')}`}
                name="stakeHolderConsultationProcess"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:stakeHolderConsultationProcess')} ${t('isRequired')}`,
                  },
                ]}
                tooltip={{
                  title: (
                    <div>
                      <p>
                        Describe the process for, and the outcomes from, the local stakeholder
                        consultation conducted prior to validation. Include details on the
                        following:
                      </p>
                      <ul>
                        <li>
                          The procedures or methods used for engaging local stakeholders (e.g.,
                          dates of announcements or meetings, periods during which input was
                          sought).
                        </li>
                        <li>
                          The procedures or methods used for documenting the outcomes of the local
                          stakeholder consultation.{' '}
                        </li>
                        <li>The mechanism for on-going communication with local stakeholders.</li>
                        <li>
                          How due account of all and any input received during the consultation has
                          been taken. Include details on any updates to the project design or
                          justify why updates are not appropriate.
                        </li>
                      </ul>

                      <p>
                        For AFOLU projects, also demonstrate how the project has or will communicate
                        the following:
                      </p>
                      <ul>
                        <li>
                          The project design and implementation, including the results of
                          monitoring.
                        </li>
                        <li>
                          The risks, costs and benefits the project may bring to local stakeholders.
                        </li>
                        <li>
                          All relevant laws and regulations covering workers’ rights in the host
                          country.
                        </li>
                        <li>
                          The process of SLCCS validation and verification and the
                          validation/verification body’s site visit.
                        </li>
                      </ul>
                    </div>
                  ),
                }}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:summaryOfCommentsRecieved')}`}
                name="summaryOfCommentsRecieved"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:summaryOfCommentsRecieved')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:summaryOfCommentsRecievedPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:considerationOfCommentsRecieved')}`}
                name="considerationOfCommentsRecieved"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:considerationOfCommentsRecieved')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:considerationOfCommentsRecievedPlaceholder')}`}
                />
              </Form.Item> */}

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

export default ProjectActivity;
