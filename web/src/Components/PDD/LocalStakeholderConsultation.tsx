import { Button, Form, Row, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';
import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';

const LocalStakeholderConsultation = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    const tempValues = {
      stakeholderConsultationProcess: values?.stakeHolderConsultationProcess,
      summaryOfComments: values?.summaryOfCommentsRecieved,
      considerationOfComments: values?.considerationOfCommentsRecieved,
    };

    handleValuesUpdate({ localStakeholderConsultation: tempValues });
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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <>
                <LabelWithTooltip
                  label={`${t('PDD:stakeHolderConsultationProcess')}`}
                  required={true}
                  tooltipPosition={TooltipPostion.bottom}
                  tooltipWidth={700}
                  tooltipContent={
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
                  }
                />
                <Form.Item
                  className="full-width-form-item"
                  name="stakeHolderConsultationProcess"
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
                            `${t('PDD:stakeHolderConsultationProcess')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={4} disabled={disableFields} />
                </Form.Item>
              </>

              <Form.Item
                className="full-width-form-item"
                label={`${t('PDD:summaryOfCommentsRecieved')}`}
                name="summaryOfCommentsRecieved"
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
                        throw new Error(`${t('PDD:summaryOfCommentsRecieved')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  // placeholder={`${t('PDD:summaryOfCommentsRecievedPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('PDD:considerationOfCommentsRecieved')}`}
                name="considerationOfCommentsRecieved"
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
                          `${t('PDD:considerationOfCommentsRecieved')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  // placeholder={`${t('PDD:considerationOfCommentsRecievedPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('PDD:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('PDD:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('PDD:next')}
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

export default LocalStakeholderConsultation;
