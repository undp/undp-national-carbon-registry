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
                      <h4>
                        Verification was conducted using SLCCS procedures in line with the
                        requirements specified in the CDM Modalities and Procedures, the latest
                        version of the CDM Validation and Verification Standard. The verification
                        consisted of the following phases:
                      </h4>
                      <ul>
                        <li> Appointment of team members and technical reviewers </li>
                        <li> Publication of the monitoring report </li>
                        <li> Verification planning </li>
                        <li> Desk review of the monitoring report and supporting documents </li>
                        <li> On-Site assessment </li>
                        <li>
                          Background investigation and follow-up interviews with personnel of the
                          project developer and its contractors
                        </li>
                        <li> Draft verification reporting </li>
                        <li>
                          The resolution of outstanding issues and corrective actions (if any)
                        </li>
                        <li> Final verification reporting </li>
                        <li> Technical review </li>
                        <li> Final approval of the certification</li>
                      </ul>
                      <h4>
                        The verification of the emission reductions has assessed all factors and
                        issues that constitute the basis for emission reductions from the project.
                        These include:
                      </h4>
                      <ul>
                        <li>
                          Electricity generation - net export to grid and auxiliary consumptions, on
                          a monthly basis
                        </li>
                        <li> Grid emission factor </li>
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
                        <b>Verification Team</b>
                      </h3>
                      <h4>
                        On the basis of a competence analysis and individual availabilities, a
                        verification team, consisting of one team leader, one technical expert, one
                        team member, as well as one technical reviewer was appointed. The list of
                        involved personnel, the tasks assigned and the qualification status are
                        summarized in the table in Appendix
                      </h4>
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
                    <h4>{t('verificationReport:function')}</h4>
                  </div>
                </Col>

                <Col xl={8} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:taskPerformed')}</h4>
                  </div>
                </Col>
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
                                <Input size="large" />
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
                          <Col xl={7} md={24}>
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
                          <Col xl={1} md={24}>
                            <div className="form-list-actions">
                              {/* <h4>Entity {name + 2}</h4> */}
                              <Form.Item>
                                {name !== 0 && (
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
                                )}
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
                <Col xl={8} md={24}>
                  <div className="step-form-right-col">
                    <h4>{t('verificationReport:mainTopics')}</h4>
                  </div>
                </Col>
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
                          <Col xl={7} md={24}>
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
                          <Col xl={1} md={24}>
                            <div className="form-list-actions">
                              {/* <h4>Entity {name + 2}</h4> */}
                              <Form.Item>
                                {name !== 0 && (
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
                                )}
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
                      <h4>
                        A Clarification Request (CL) is raised where information is insufficient,
                        unclear or not transparent enough to establish whether the applicable SLCCS
                        requirements have been met.
                      </h4>
                      <h4>A Corrective Action Request (CAR) is issued where:</h4>
                      <ul>
                        <li>
                          Non-conformities with the monitoring plan or methodology are found in
                          monitoring and reporting, or if the evidence provided to prove conformity
                          is insufficient
                        </li>
                        <li>
                          Mistakes have been made in assumptions, application of the methodology or
                          the project documentation which will have a direct influence the project
                          results
                        </li>
                        <li>
                          The requirements deemed relevant for verification of the project with
                          certain characteristics have not been met or
                        </li>
                        <li>
                          There is a risk that the project would not be registered by the SLCCS or
                          that emission reductions would not be able to be verified and certified.
                        </li>
                      </ul>
                      <h4>
                        A Forward Action Request (FAR) is issued for actions if the monitoring and
                        reporting require attention and/or adjustment for the next verification
                        period
                      </h4>
                    </div>
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
