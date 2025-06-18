import { Button, Col, Form, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { CustomStepsProps } from './StepProps';

export const ImplementationOfProjectActivityStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    // console.log('onFinish triggered');
    // console.log('-----------temp Values before-------');
    const implementationOfProjectActivityDetails: any = {
      implementationOfProjectActivityDetails: {
        io_descriptionOfPA: values?.io_descriptionOfPA,
        io_postRegistrationChanges: values?.io_postRegistrationChanges,
        io_tempDeviations: values?.io_tempDeviations,
        io_corrections: values?.io_corrections,
        io_changesToTheStartDate: values?.io_changesToTheStartDate,
        io_inclusionOfMP: values?.io_inclusionOfMP,
        io_permanantMonitoringPlan: values?.io_permanantMonitoringPlan,
        io_changesToProjectDesign: values?.io_changesToProjectDesign,
        io_changesSpecificToAfforestrationOrReforestration:
          values?.io_changesSpecificToAfforestrationOrReforestration,
      },
    };
    // console.log('----------tempValues-------------', tempValues);
    handleValuesUpdate(implementationOfProjectActivityDetails);
  };
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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('monitoringReport:io_descriptionOfPA')}`}
                      name="io_descriptionOfPA"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_descriptionOfPA')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_postRegistrationChanges')}`}
                      name="io_postRegistrationChanges"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_postRegistrationChanges')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_tempDeviations')}`}
                      name="io_tempDeviations"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_tempDeviations')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_corrections')}`}
                      name="io_corrections"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_corrections')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_changesToTheStartDate')}`}
                      name="io_changesToTheStartDate"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_changesToTheStartDate')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_inclusionOfMP')}`}
                      name="io_inclusionOfMP"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_inclusionOfMP')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_permanantMonitoringPlan')}`}
                      name="io_permanantMonitoringPlan"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_permanantMonitoringPlan')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:io_changesToProjectDesign')}`}
                      name="io_changesToProjectDesign"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:io_changesToProjectDesign')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t(
                        'monitoringReport:io_changesSpecificToAfforestrationOrReforestration'
                      )}`}
                      name="io_changesSpecificToAfforestrationOrReforestration"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            'monitoringReport:io_changesSpecificToAfforestrationOrReforestration'
                          )} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={5} disabled={disableFields} />
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
