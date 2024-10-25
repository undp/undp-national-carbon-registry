import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';

export const VerificationFindingStep = (props: any) => {
  const { useLocation, translator, current, form, next, prev, onValueChange } = props;

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
              onFinish={(values: any) => {
                onValueChange({ safeguards: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:verificationFinding')}`}
                      name="verificationFinding"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:verificationFinding')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>

                    <Form.Item
                      label={`3.1 ${t('verificationReport:remainingIssues')}`}
                      name="remainingIssues"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:remainingIssues')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>

                    <Form.Item
                      label={`3.2 ${t('verificationReport:monitoringReport')}`}
                      name="monitoringReport"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:monitoringReport')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                    <Form.Item
                      label={`3.3 ${t('verificationReport:projectImplementation')}`}
                      name="projectImplementation"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:projectImplementation')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                    <Col xl={4} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:siteLocation')}</h4>
                      </div>
                    </Col>

                    <Col xl={4} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:commissioningDate')}</h4>
                      </div>
                    </Col>
                  </Row>
                  <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                    <Col xl={4} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          name="siteLocation"
                          rules={[
                            {
                              required: true,
                              message: `${t('verificationReport:siteLocation')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      </div>
                    </Col>
                    <Col xl={4} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          name="commissioningDate"
                          rules={[
                            {
                              required: true,
                              message: '',
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
                                    `${t('verificationReport:commissioningDate')} ${t(
                                      'isRequired'
                                    )}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <DatePicker
                            size="large"
                            disabledDate={(currentDate: any) =>
                              currentDate < moment().startOf('day')
                            }
                          />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xl={1} md={24}></Col>
                  </Row>

                  <Form.List name="siteLocations">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row
                              justify={'space-between'}
                              gutter={[16, 16]}
                              className="form-section"
                            >
                              <Col xl={4} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'siteLocation']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:siteLocation')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={4} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'commissioningDate']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '',
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
                                              `${t('verificationReport:commissioningDate')} ${t(
                                                'isRequired'
                                              )}`
                                            );
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <DatePicker
                                      size="large"
                                      disabledDate={(currentDate: any) =>
                                        currentDate < moment().startOf('day')
                                      }
                                    />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={1} md={24}>
                                <div className="form-list-actions">
                                  {/* <h4>Entity {name + 2}</h4> */}
                                  <Form.Item>
                                    <Button
                                      // type="dashed"
                                      onClick={() => {
                                        remove(name);
                                      }}
                                      size="large"
                                      className="addMinusBtn"
                                      // block
                                      icon={<MinusOutlined />}
                                    >
                                      {/* Remove Entity */}
                                    </Button>
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                          </>
                        ))}
                        <div className="form-list-actions">
                          <Form.Item>
                            <Button
                              // type="dashed"
                              onClick={() => {
                                add();
                              }}
                              size="large"
                              className="addMinusBtn"
                              // block
                              icon={<PlusOutlined />}
                            >
                              {/* Add Entity */}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
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
