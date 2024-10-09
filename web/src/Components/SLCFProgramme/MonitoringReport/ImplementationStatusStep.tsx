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

                    <Form.Item label={t('monitoringReport:is_deviations')}></Form.Item>
                    <Form.Item
                      label={t('monitoringReport:is_methodologyDeviations')}
                      name="is_methodologyDeviations"
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
                        placeholder={`${t('monitoringReport:is_methodologyDeviations')}`}
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
                        placeholder={`${t('monitoringReport:is_descriptionDeviations')}`}
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
