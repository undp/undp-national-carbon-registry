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

export const DataAndParametersStep = (props: any) => {
  const { useLocation, translator, current, form, next, countries, prev } = props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const t = translator.t;
  return (
    <>
      {current === 4 && (
        <div className="programme-details-form-container">
          <div className="programme-details-form">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              name="programme-details"
              className="programme-details-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => console.log('-----form values-------', values)}
            >
              <Form.Item label={t('monitoringReport:dp_title')}></Form.Item>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="details-part-one">
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
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dp_description')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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

                    <Form.Item
                      label={t('monitoringReport:dp_purposeOfData')}
                      name="dp_purposeOfData"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_purposeOfData')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dp_purposeOfData')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dp_comments')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="details-part-two">
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
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dp_sourceOfData')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:dp_selectionAndMeasurement')}
                      name="dp_selectionAndMeasurement"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dp_selectionAndMeasurement')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:dp_selectionAndMeasurement')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Form.Item label={t('monitoringReport:dpm_title')}></Form.Item>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="details-part-one">
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
                        placeholder={`${t('monitoringReport:dpm_description')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:dpm_mmProcedures')}
                      name="dpm_mmProcedures"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_mmProcedures')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={5}
                        placeholder={`${t('monitoringReport:dpm_mmProcedures')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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
                        placeholder={`${t('monitoringReport:dpm_valueApplied')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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
                        placeholder={`${t('monitoringReport:dpm_qaQcProcedures')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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
                        placeholder={`${t('monitoringReport:dpm_comments')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="details-part-two">
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
                        placeholder={`${t('monitoringReport:dpm_sourceOfData')}`}
                        maxLength={6}
                      />
                    </Form.Item>

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
                        placeholder={`${t('monitoringReport:dpm_monitoringEquipment')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:dpm_purposeOfData')}
                      name="dpm_purposeOfData"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_purposeOfData')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dpm_purposeOfData')}`}
                        maxLength={6}
                      />
                    </Form.Item>
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
                                `${t('monitoringReport:dpm_frequencyOfMonitoring')} ${t(
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
                    <Form.Item
                      label={t('monitoringReport:dpm_calculationData')}
                      name="dpm_calculationData"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:dpm_calculationData')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={3}
                        placeholder={`${t('monitoringReport:dpm_calculationData')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="details-part-two">
                    <Form.Item
                      label={t('monitoringReport:dpm_planDescription')}
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
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:dpm_planDescription')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Form.Item>
                <div className="steps-actions">
                  <Button type="primary" onClick={next}>
                    Next
                  </Button>
                  <Button style={{ margin: '0 8px' }} onClick={prev}>
                    Back
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
