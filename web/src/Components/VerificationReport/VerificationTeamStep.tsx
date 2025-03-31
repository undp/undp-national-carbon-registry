import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row, Select, Radio } from 'antd';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { VerificationStepProps } from './StepProps';

export const VerificationTeamStep = (props: VerificationStepProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  console.log('---------formMode--------------', formMode);
  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      form.setFieldValue('verificationTeamMembers', [{ role: '' }]);
      form.setFieldValue('technicalReviews', [{ role: '' }]);
    }
  }, []);

  const onFinish = (values: any) => {
    console.log('--------values-----------', values);
    const body = { ...values };
    handleValuesUpdate({
      verificationTeam: body,
    });
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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  {/* <div className="step-form-left-col"> */}
                  {/* Validation team member table start */}
                  <h3 className="form-section-heading">
                    {t('verificationReport:v_TeamMemberTableTitle')}
                  </h3>
                  <div className="verification-team-member-table">
                    <Row className="header">
                      <Col xl={1} className="col-1 col">
                        No
                      </Col>
                      <Col xl={4} className="other-cols col">
                        Role
                      </Col>
                      <Col xl={3} className="other-cols col">
                        Type Of Resource
                      </Col>
                      <Col xl={3} className="other-cols col">
                        Last name
                      </Col>
                      <Col xl={3} className="other-cols col">
                        First name
                      </Col>
                      <Col xl={3} className="other-cols col">
                        Affliation
                      </Col>
                      <Col xl={4}>
                        <Row>
                          <Col className="other-cols col" xl={24}>
                            Involvement in
                          </Col>
                        </Row>
                        <Row>
                          <Col xl={6} className="vertical-col">
                            Desk/Document Review
                          </Col>
                          <Col xl={6} className="vertical-col">
                            On-site inspection
                          </Col>
                          <Col xl={6} className="vertical-col">
                            Interviews
                          </Col>
                          <Col xl={6} className="vertical-col">
                            Validation Findings
                          </Col>
                        </Row>
                      </Col>
                      <Col xl={3}></Col>
                    </Row>

                    <Form.List name="verificationTeamMembers">
                      {(fields, { add, remove }) => (
                        <Row className="body">
                          {fields.map(({ key, name, ...restFields }) => (
                            <>
                              <Col xl={1} className="col-1 col">
                                {name + 1 < 10 && '0'}
                                {name + 1}
                              </Col>
                              <Col xl={4} className="col other-cols">
                                <Form.Item
                                  name={[name, 'role']}
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
                                          throw new Error(`${t('verificationReport:required')}`);
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select disabled={disableFields}>
                                    <Select.Option value={'TL'}>
                                      {t('verificationReport:teamLeader')}
                                    </Select.Option>
                                    <Select.Option value={'TE'}>
                                      {t('verificationReport:technicalExpert')}
                                    </Select.Option>
                                    <Select.Option value={'TM'}>
                                      {t('verificationReport:teamMember')}
                                    </Select.Option>
                                    <Select.Option value={'ITR'}>
                                      {t('verificationReport:internalTechnicalReviewer')}
                                    </Select.Option>
                                    <Select.Option value={'DR'}>
                                      {t('verificationReport:documentReviewOption')}
                                    </Select.Option>
                                    <Select.Option value={'SV'}>
                                      {t('verificationReport:siteVisit')}
                                    </Select.Option>
                                    <Select.Option value={'RI'}>
                                      {t('verificationReport:reportIssuance')}
                                    </Select.Option>
                                    <Select.Option value={'TR'}>
                                      {t('verificationReport:technicalReview')}
                                    </Select.Option>
                                  </Select>
                                </Form.Item>
                              </Col>

                              <Col xl={3} className="other-cols col">
                                <Form.Item
                                  name={[name, 'typeOfResource']}
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
                                          throw new Error(`${t('verificationReport:required')}`);
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Radio.Group className="radio-btn-grp" disabled={disableFields}>
                                    <Radio value="IR">{t('verificationReport:IR')}</Radio>
                                    <Radio value="ER">{t('verificationReport:ER')}</Radio>
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                              <Col xl={3} className="other-cols col">
                                <Form.Item
                                  name={[name, 'lastName']}
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
                                            `${t('verificationReport:referencesToDocument')} ${t(
                                              'isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={3} className="other-cols col">
                                <Form.Item
                                  name={[name, 'firstName']}
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
                                            `${t('verificationReport:provider')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={3} className="other-cols col">
                                <Form.Item
                                  name={[name, 'affliation']}
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
                                            `${t('verificationReport:provider')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={4}>
                                <Row>
                                  <Col xl={6} className="other-cols checkbox-cols">
                                    <Form.Item
                                      name={[name, 'documentReview']}
                                      valuePropName="checked"
                                    >
                                      <Checkbox disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={6} className="other-cols checkbox-cols">
                                    <Form.Item
                                      name={[name, 'onsiteInspections']}
                                      valuePropName="checked"
                                    >
                                      <Checkbox disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={6} className="other-cols checkbox-cols">
                                    <Form.Item name={[name, 'interviews']} valuePropName="checked">
                                      <Checkbox disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={6} className="other-cols checkbox-cols">
                                    <Form.Item
                                      name={[name, 'verificationFindings']}
                                      valuePropName="checked"
                                    >
                                      <Checkbox disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Col>
                              <Col xl={3} className="col action-col">
                                <Form.Item>
                                  <Button
                                    onClick={add}
                                    size="small"
                                    className="addMinusBtn"
                                    icon={<PlusOutlined />}
                                    disabled={disableFields}
                                  ></Button>
                                </Form.Item>
                                {name > 0 && (
                                  <Form.Item>
                                    <Button
                                      // type="dashed"
                                      onClick={() => {
                                        // removeParticipants(name2);
                                        remove(name);
                                      }}
                                      size="small"
                                      className="addMinusBtn"
                                      // block
                                      icon={<MinusOutlined />}
                                      // disabled={disableFields}
                                    >
                                      {/* Minus Participant */}
                                    </Button>
                                  </Form.Item>
                                )}
                              </Col>
                            </>
                          ))}
                        </Row>
                      )}
                    </Form.List>
                  </div>
                  {/* Validation team member table end */}

                  {/* Technical reviewer table start */}
                  <h4 className="form-section-heading">
                    {t('verificationReport:technicalReviewerTableTitle')}
                  </h4>

                  <div className="technical-reviewer-table">
                    <div className="header">
                      <Row>
                        <Col xl={1} className="col-1 col">
                          No
                        </Col>
                        <Col xl={4} className="other-cols col">
                          Role
                        </Col>
                        <Col xl={4} className="other-cols col">
                          Type of resource
                        </Col>
                        <Col xl={4} className="other-cols col">
                          Last name
                        </Col>
                        <Col xl={4} className="other-cols col">
                          First name
                        </Col>
                        <Col xl={4} className="other-cols col">
                          Affliation
                        </Col>
                        <Col xl={2}></Col>
                      </Row>
                    </div>

                    <div className="body">
                      <Form.List name="technicalReviews">
                        {(fields, { add, remove }) => (
                          <Row>
                            {fields.map(({ key, name, ...restFields }) => (
                              <>
                                <Col xl={1} className="col-1 col" key={key}>
                                  {name + 1 < 10 && '0'}
                                  {name + 1}
                                </Col>
                                <Col xl={4} className="other-cols col">
                                  <Form.Item
                                    name={[name, 'role']}
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
                                            throw new Error(`${t('verificationReport:required')}`);
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Select disabled={disableFields}>
                                      <Select.Option value="technicalReviewer">
                                        {t('verificationReport:technicalReviewer')}
                                      </Select.Option>
                                      <Select.Option value="approver">
                                        {t('verificationReport:approver')}
                                      </Select.Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col xl={4} className="other-cols col">
                                  <Form.Item
                                    name={[name, 'typeOfResource']}
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
                                            throw new Error(`${t('verificationReport:required')}`);
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Radio.Group className="radio-btn-grp" disabled={disableFields}>
                                      <Radio value="IR">{t('verificationReport:IR')}</Radio>
                                      <Radio value="ER">{t('verificationReport:ER')}</Radio>
                                    </Radio.Group>
                                  </Form.Item>
                                </Col>
                                <Col xl={4} className="other-cols col">
                                  <Form.Item
                                    name={[name, 'lastName']}
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
                                            throw new Error(`${t('verificationReport:required')}`);
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Input disabled={disableFields} />
                                  </Form.Item>
                                </Col>
                                <Col xl={4} className="other-cols col">
                                  <Form.Item
                                    name={[name, 'firstName']}
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
                                            throw new Error(`${t('verificationReport:required')}`);
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Input disabled={disableFields} />
                                  </Form.Item>
                                </Col>
                                <Col xl={4} className="other-cols col">
                                  <Form.Item
                                    name={[name, 'affliation']}
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
                                            throw new Error(`${t('verificationReport:required')}`);
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Input disabled={disableFields} />
                                  </Form.Item>
                                </Col>
                                <Col xl={3} className="col action-col">
                                  <Form.Item>
                                    <Button
                                      onClick={add}
                                      size="small"
                                      className="addMinusBtn"
                                      disabled={disableFields}
                                      icon={<PlusOutlined />}
                                    ></Button>
                                  </Form.Item>
                                  {name > 0 && (
                                    <Form.Item>
                                      <Button
                                        // type="dashed"
                                        onClick={() => {
                                          // removeParticipants(name2);
                                          remove(name);
                                        }}
                                        size="small"
                                        className="addMinusBtn"
                                        // block
                                        icon={<MinusOutlined />}
                                        disabled={disableFields}
                                      >
                                        {/* Minus Participant */}
                                      </Button>
                                    </Form.Item>
                                  )}
                                </Col>
                              </>
                            ))}
                          </Row>
                        )}
                      </Form.List>
                    </div>
                  </div>
                  {/* Technical reviewer table end */}
                  {/* </div> */}
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col"></div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
                  {t('verificationReport:back')}
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
