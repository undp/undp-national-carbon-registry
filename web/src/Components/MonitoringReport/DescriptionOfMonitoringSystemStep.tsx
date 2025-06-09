import { Button, Col, Form, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';
import { CustomStepsProps } from './StepProps';

export const DescriptionOfMSStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    // console.log('onFinish triggered');
    // console.log('-----------temp Values before-------');
    const descriptionOfMonitoringReport: any = {
      descriptionOfMonitoringReport: {
        do_descriptionOfMonitoringSystem: values?.do_descriptionOfMonitoringSystem,
      },
    };
    // console.log('----------tempValues-------------', tempValues);
    handleValuesUpdate(descriptionOfMonitoringReport);
  };
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
              // disabled={FormMode.VIEW === formMode}
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
                      label={`${t('monitoringReport:do_descriptionOfMonitoringSystem')}`}
                      name="do_descriptionOfMonitoringSystem"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:do_descriptionOfMonitoringSystem')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false} danger>
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
