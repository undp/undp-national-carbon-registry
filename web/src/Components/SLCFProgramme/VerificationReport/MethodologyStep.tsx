import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';

export const MethodologyStep = (props: any) => {
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
                onValueChange({ methodology: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <div>
                      <h4>{t('verificationReport:methodologyHeader01')}</h4>
                      <ul>
                        <li>{t('verificationReport:methodologyList01Item01')}</li>
                        <li>{t('verificationReport:methodologyList01Item02')}</li>
                        <li>{t('verificationReport:methodologyList01Item03')}</li>
                        <li>{t('verificationReport:methodologyList01Item04')}</li>
                        <li>{t('verificationReport:methodologyList01Item05')}</li>
                        <li>{t('verificationReport:methodologyList01Item06')}</li>
                        <li>{t('verificationReport:methodologyList01Item07')}</li>
                        <li>{t('verificationReport:methodologyList01Item08')}</li>
                        <li>{t('verificationReport:methodologyList01Item09')}</li>
                        <li>{t('verificationReport:methodologyList01Item10')}</li>
                        <li>{t('verificationReport:methodologyList01Item11')}</li>
                      </ul>
                      <h4>{t('verificationReport:methodologyHeader02')}</h4>
                      <ul>
                        <li>{t('verificationReport:methodologyList02Item01')}</li>
                        <li>{t('verificationReport:methodologyList02Item02')}</li>
                      </ul>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <div>
                      <h3>
                        <b>{t('verificationReport:verificationTeam')}</b>
                      </h3>
                      <h4>{t('verificationReport:verificationTeamSubTitle')}</h4>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                <Col xl={5} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:name')}</h4>
                  </div>
                </Col>

                <Col xl={5} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:company')}</h4>
                  </div>
                </Col>

                <Col xl={6} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:role')}</h4>
                  </div>
                </Col>

                <Col xl={6} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:taskPerformed')}</h4>
                  </div>
                </Col>
                <Col xl={2} md={24}></Col>
              </Row>

              <Form.List name="verificationTeamList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <>
                        <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                          <Col xl={5} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'name']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:name')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" />
                              </Form.Item>
                            </div>
                          </Col>
                          <Col xl={5} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'company']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:company')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled />
                              </Form.Item>
                            </div>
                          </Col>
                          <Col xl={6} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'function']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:function')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Checkbox.Group style={{ display: 'flex' }}>
                                  <Checkbox value={t('verificationReport:tl')}>
                                    {t('verificationReport:tl')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:tm')}>
                                    {t('verificationReport:tm')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:te')}>
                                    {t('verificationReport:te')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:itr')}>
                                    {t('verificationReport:itr')}
                                  </Checkbox>
                                </Checkbox.Group>
                              </Form.Item>
                            </div>
                          </Col>
                          <Col xl={6} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'taskPerformed']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:taskPerformed')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Checkbox.Group style={{ display: 'flex' }}>
                                  <Checkbox value={t('verificationReport:dr')}>
                                    {t('verificationReport:dr')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:sv')}>
                                    {t('verificationReport:sv')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:ri')}>
                                    {t('verificationReport:ri')}
                                  </Checkbox>
                                  <Checkbox value={t('verificationReport:tr')}>
                                    {t('verificationReport:tr')}
                                  </Checkbox>
                                </Checkbox.Group>
                              </Form.Item>
                            </div>
                          </Col>
                          <Col md={24} xl={2} style={{ verticalAlign: 'top' }}>
                            <Form.Item>
                              {fields.length > 1 && (
                                <Button
                                  // type="dashed"
                                  style={{ marginRight: 5 }}
                                  onClick={() => {
                                    // reduceTotalCreditingYears()
                                    remove(name);
                                  }}
                                  size="small"
                                  className="addMinusBtn"
                                  // block
                                  icon={<MinusOutlined />}
                                >
                                  {/* Add Entity */}
                                </Button>
                              )}
                              {name === fields.length - 1 && (
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    // reduceTotalCreditingYears()
                                    add();
                                  }}
                                  size="middle"
                                  className="addMinusBtn"
                                  // block
                                  icon={<PlusOutlined />}
                                >
                                  {/* Add Entity */}
                                </Button>
                              )}
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    ))}
                  </>
                )}
              </Form.List>
              <h4 className="form-section-title">
                TL -Team Leader TE- Technical Expert TM- Team Member ITR- Internal Technical
                Reviewer
              </h4>
              <h4 className="form-section-title">
                DR- Document Review SV- Site Visit RI- Report Issuance TR- Technical Review
              </h4>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`2.1 ${t('verificationReport:publication')}`}
                      name="publication"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:publication')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`2.2 ${t('verificationReport:deskReview')}`}
                      name="deskReview"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:deskReview')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`2.3 ${t('verificationReport:onSiteInspection')}`}
                      name="onSiteInspection"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:onSiteInspection')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                <Col xl={4} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:name')}</h4>
                  </div>
                </Col>

                <Col xl={4} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:designation')}</h4>
                  </div>
                </Col>

                <Col xl={4} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:organizationEntity')}</h4>
                  </div>
                </Col>

                <Col xl={4} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:method')}</h4>
                  </div>
                </Col>
                <Col xl={5} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:mainTopics')}</h4>
                  </div>
                </Col>
                <Col xl={3} md={24}></Col>
              </Row>

              <Form.List name="inspectionsList">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <>
                        <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                          <Col xl={4} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'inspectionName']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:name')} ${t('isRequired')}`,
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
                                name={[name, 'designation']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:designation')} ${t(
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
                                name={[name, 'organizationEntity']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:organizationEntity')} ${t(
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
                                name={[name, 'method']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:method')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" />
                              </Form.Item>
                            </div>
                          </Col>
                          <Col xl={5} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                name={[name, 'mainTopics']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('verificationReport:mainTopics')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <TextArea rows={2} disabled={FormMode.VIEW === formMode} />
                              </Form.Item>
                            </div>
                          </Col>
                          <Col md={24} xl={3} style={{ verticalAlign: 'top' }}>
                            <Form.Item>
                              {fields.length > 1 && (
                                <Button
                                  // type="dashed"
                                  style={{ marginRight: 5 }}
                                  onClick={() => {
                                    // reduceTotalCreditingYears()
                                    remove(name);
                                  }}
                                  size="small"
                                  className="addMinusBtn"
                                  // block
                                  icon={<MinusOutlined />}
                                >
                                  {/* Add Entity */}
                                </Button>
                              )}
                              {name === fields.length - 1 && (
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    // reduceTotalCreditingYears()
                                    add();
                                  }}
                                  size="middle"
                                  className="addMinusBtn"
                                  // block
                                  icon={<PlusOutlined />}
                                >
                                  {/* Add Entity */}
                                </Button>
                              )}
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    ))}
                  </>
                )}
              </Form.List>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`2.4 ${t('verificationReport:independentReview')}`}
                      name="independentReview"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:independentReview')} ${t(
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
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <h4 className="form-section-title">{`2.5  ${t(
                      'verificationReport:reportingOfFindings'
                    )}`}</h4>
                    <div>
                      <h4>{t('verificationReport:reportingFindingHeader01')}</h4>
                      <h4>{t('verificationReport:reportingFindingHeader02')}</h4>
                      <h4></h4>
                      <ul>
                        <li>{t('verificationReport:reportingFindingListItem01')}</li>
                        <li>{t('verificationReport:reportingFindingListItem02')}</li>
                        <li>{t('verificationReport:reportingFindingListItem03')}</li>
                        <li>{t('verificationReport:reportingFindingListItem04')}</li>
                      </ul>
                      <h4>{t('verificationReport:reportingFindingHeader03')}</h4>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false}>
                  {t('verificationReport:back')}
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
                  {t('verificationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
