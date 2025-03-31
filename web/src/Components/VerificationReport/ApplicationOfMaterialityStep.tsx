import { Button, Col, Form, Row, Input } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { DocumentStatus } from '../../Definitions/Enums/document.status';
import i18n from '../Internationalization/i18n';
import { VerificationStepProps } from './StepProps';

export const ApplicationOfMaterialityStep = (props: VerificationStepProps) => {
  const { current, form, formMode, prev, handleValuesUpdate, next, disableFields } = props;
  const { userInfoState } = useUserContext();
  const t = i18n.t;
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      form.setFieldValue('materialityTable', [{ riskLevel: '' }]);
    }
  }, []);

  const onFinish = (values: any) => {
    console.log('--------values-----------', values);
    const body = { ...values };
    handleValuesUpdate({
      applicationOfMateriality: body,
    });
  };

  return (
    <>
      {current === 4 && (
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
                    {/* materiality table starts */}
                    <>
                      <h3 className="form-section-heading">
                        {t('verificationReport:am_considerationOfMateriality')}
                      </h3>
                      <div className="materialityTable">
                        <Row className="header">
                          <Col xl={1} className="col col-1">
                            No
                          </Col>
                          <Col xl={4} className="col other-cols">
                            Risk that could lead to material errors, omissions or misstatements
                          </Col>
                          <Col xl={12} className="assesment-col">
                            <Row>
                              <Col xl={24} className="col other-cols">
                                Assesment
                              </Col>
                            </Row>
                            <Row>
                              <Col xl={8} className="assesment-col-subCols-first">
                                Risk Level
                              </Col>
                              <Col xl={16} className="assesment-col-subCols-last">
                                Justification
                              </Col>
                            </Row>
                          </Col>
                          <Col xl={4} className="col other-cols">
                            Response to the risk in the verification plan and/or sampling plan
                          </Col>
                          <Col xl={2}></Col>
                        </Row>

                        <Row className="body mg-bottom-2">
                          <Form.List name="materialityTable">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restFields }) => (
                                  <>
                                    <Col xl={1} className="col-1 col">
                                      {name + 1 < 10 && '0'}
                                      {name + 1}
                                    </Col>
                                    <Col xl={4} className="other-cols col">
                                      <Form.Item
                                        name={[name, 'riskThatCouldLead']}
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
                                                  `${t('verificationReport:required')}`
                                                );
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
                                        name={[name, 'riskLevel']}
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
                                                  `${t('verificationReport:required')}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={8} className="other-cols col">
                                      <Form.Item
                                        name={[name, 'justification ']}
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
                                                  `${t('verificationReport:required')}`
                                                );
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
                                        name={[name, 'response']}
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
                                                  `${t('verificationReport:required')}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="action-col">
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
                                            disabled={disableFields}
                                          >
                                            {/* Minus Participant */}
                                          </Button>
                                        </Form.Item>
                                      )}
                                    </Col>
                                  </>
                                ))}
                              </>
                            )}
                          </Form.List>
                        </Row>
                      </div>
                    </>
                    {/* materiality table ends */}

                    <Form.Item
                      label={t('verificationReport:am_considerationOfMaterialityTextBox')}
                      name="am_considerationOfMaterialityTextBox"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            'verificationReport:am_considerationOfMaterialityTextBox'
                          )} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev} disabled={false}>
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
