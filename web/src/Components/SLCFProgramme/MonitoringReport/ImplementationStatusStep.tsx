import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';

export const ImplementationStatusStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, prev, onValueChange } = props;

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
              disabled={FormMode.VIEW === formMode}
              onFinish={(values: any) => {
                onValueChange({ implementationStatus: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`2.1 ${t('monitoringReport:is_statusOfPA')}`}
                      name="statusOfPA"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_statusOfPA')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <h4 className="form-section-title">{`2.2 ${t(
                      'monitoringReport:is_deviations'
                    )}`}</h4>
                    <Form.Item
                      label={`2.2.1 ${t('monitoringReport:is_methodologyDeviations')}`}
                      name="methodologyDeviations"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_methodologyDeviations')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`2.2.2 ${t('monitoringReport:is_descriptionDeviations')}`}
                      name="descriptionDeviations"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:is_descriptionDeviations')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
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
