import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import moment from 'moment';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { CustomStepsProps } from './StepProps';

export const BasicInformationStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    // console.log('onFinish triggered');
    // console.log('-----------temp Values before-------');
    const tempValues: any = {
      projectDetails: {
        bi_projectTitle: values?.bi_projectTitle,
        bi_applicablePDDVersionNo: values?.bi_applicablePDDVersionNo,
        bi_completionDate: moment(values?.bi_completionDate).startOf('day').unix(),
        bi_duration: values?.bi_duration,
        bi_projectDeveloper: values?.bi_projectDeveloper,
        bi_appliedMethodologies: values?.bi_appliedMethodologies,
        bi_achievedGHGReductions: values?.bi_achievedGHGReductions,
        bi_unfccRefNo: values?.bi_unfccRefNo,
        bi_versionNoOfMR: values?.bi_versionNoOfMR,
        bi_monitoringPeriodNo: values?.bi_monitoringPeriodNo,
        bi_monitoringNoForMonitoringPeriod: values?.bi_monitoringNoForMonitoringPeriod,
        bi_hostParty: values?.bi_hostParty,
        bi_sectoralScope: values?.bi_sectoralScope,
        bi_projectedGHGReductions: values?.bi_projectedGHGReductions,
      },
    };
    handleValuesUpdate(tempValues);
  };

  return (
    <>
      {current === 0 && (
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
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:bi_projectTitle')}
                      name="bi_projectTitle"
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
                                `${t('monitoringReport:bi_projectTitle')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_applicablePDDVersionNo')}
                      name="bi_applicablePDDVersionNo"
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
                                `${t('monitoringReport:bi_applicablePDDVersionNo')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:bi_completionDate')}
                      name="bi_completionDate"
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
                                `${t('monitoringReport:bi_completionDate')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        disabled={disableFields}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:bi_duration')}
                      name="bi_duration"
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
                                `${t('monitoringReport:bi_duration')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_projectDeveloper')}
                      name="bi_projectDeveloper"
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
                                `${t('monitoringReport:bi_projectDeveloper')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_appliedMethodologies')}
                      name="bi_appliedMethodologies"
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
                                `${t('monitoringReport:bi_appliedMethodologies')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_achievedGHGReductions')}
                      name="bi_achievedGHGReductions"
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
                                `${t('monitoringReport:bi_achievedGHGReductions')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:bi_unfccRefNo')}
                      name="bi_unfccRefNo"
                      rules={[
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('monitoringReport:bi_unfccRefNo')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_versionNoOfMR')}
                      name="bi_versionNoOfMR"
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
                                `${t('monitoringReport:bi_versionNoOfMR')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={true} />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_monitoringPeriodNo')}
                      name="bi_monitoringPeriodNo"
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
                                `${t('monitoringReport:bi_monitoringPeriodNo')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_monitoringNoForMonitoringPeriod')}
                      name="bi_monitoringNoForMonitoringPeriod"
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
                                `${t('monitoringReport:bi_monitoringNoForMonitoringPeriod')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_hostParty')}
                      name="bi_hostParty"
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
                                `${t('monitoringReport:bi_hostParty')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_sectoralScope')}
                      name="bi_sectoralScope"
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
                                `${t('monitoringReport:bi_sectoralScope')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:bi_projectedGHGReductions')}
                      name="bi_projectedGHGReductions"
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
                                `${t('monitoringReport:bi_projectedGHGReductions')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    {/* <Form.Item
                      name="telephone"
                      label={t('monitoringReport:pd_telephone')}
                      initialValue={useLocation?.record?.phoneNo}
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule: any, value: any) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('monitoringReport:pd_telephone')} ${t('isRequired')}`
                              );
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(
                                    `${t('monitoringReport:pd_telephone')} ${t('isRequired')}`
                                  );
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(
                                      `${t('monitoringReport:pd_telephone')} ${t('isInvalid')}`
                                    );
                                  }
                                }
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <PhoneInput
                        disabled
                        placeholder={t('monitoringReport:pd_telephone')}
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries}
                      />
                    </Form.Item> */}
                    {/* {FormMode.VIEW === formMode ? (
                      <Form.Item label={t('monitoringReport:reportID')} name="reportID">
                        <Input size={'large'} disabled />
                      </Form.Item>
                    ) : (
                      ''
                    )} */}
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button onClick={prev} disabled={false} danger>
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
