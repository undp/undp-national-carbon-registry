import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined } from '@ant-design/icons';

export const DataAndParametersStep = (props: any) => {
  const { useLocation, translator, current, form, next, countries, prev, onValueChange } = props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const t = translator.t;
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
              onFinish={(values: any) => {
                onValueChange({ dataAndParameters: values });
                next();
              }}
            >
              <h4 className="form-section-title">{`4.1 ${t('monitoringReport:dp_title')}`}</h4>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_dataParameter')}
                      name="dp_dataParameter"
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
                                `${t('monitoringReport:dp_dataParameter')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:dp_dataUnit')}
                      name="dp_dataUnit"
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
                                `${t('monitoringReport:dp_dataUnit')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_description')}
                      name="dp_description"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_description')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} maxLength={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_sourceOfData')}
                      name="dp_sourceOfData"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_sourceOfData')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} maxLength={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_justification')}
                      name="dp_justification"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_justification')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} maxLength={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_purposeOfData')}
                      name="dp_purposeOfData"
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
                                `${t('monitoringReport:dp_purposeOfData')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:dp_valueApplied')}
                      name="dp_valueApplied"
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
                                `${t('monitoringReport:dp_valueApplied')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dp_comments')}
                      name="dp_comments"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_comments')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} maxLength={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <h4 className="form-section-title">{`4.2 ${t('monitoringReport:dpm_title')}`}</h4>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_dataParameter')}
                      name="dpm_dataParameter"
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
                                `${t('monitoringReport:dpm_dataParameter')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_dataUnit')}
                      name="dpm_dataUnit"
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
                                `${t('monitoringReport:dpm_dataUnit')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_description')}
                      name="dpm_description"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_description')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_descriptionPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_sourceOfData')}
                      name="dpm_sourceOfData"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_sourceOfData')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_sourceOfDataPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_measurmentMethodsDescription')}
                      name="dpm_measurmentMethodsDescription"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_measurmentMethodsDescription')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t(
                          'monitoringReport:dpm_measurmentMethodsDescriptionPlaceholder'
                        )}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_frequencyOfMonitoring')}
                      name="dpm_frequencyOfMonitoring"
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
                                `${t('monitoringReport:dpm_frequencyOfMonitoringPlaceholder')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_valueApplied')}
                      name="dpm_valueApplied"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_valueApplied')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_valueAppliedPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_monitoringEquipment')}
                      name="dpm_monitoringEquipment"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_monitoringEquipment')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_monitoringEquipmentPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_qaQcProcedures')}
                      name="dpm_qaQcProcedures"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_qaQcProcedures')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_qaQcProceduresPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_purposeOfData')}
                      name="dpm_purposeOfData"
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
                                `${t('monitoringReport:dpm_purposeOfData')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_calculationMethod')}
                      name="dpm_calculationMethod"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_calculationMethod')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_calculationMethodPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:dpm_comments')}
                      name="dpm_comments"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_comments')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        maxLength={6}
                        placeholder={t('monitoringReport:dpm_commentsPlaceholder')}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`4.3 ${t('monitoringReport:dpm_planDescription')}`}
                      name="dpm_planDescription"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_planDescription')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} maxLength={6} />
                    </Form.Item>
                  </div>
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
