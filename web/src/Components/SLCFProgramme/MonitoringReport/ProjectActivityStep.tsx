import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import PhoneInput, {
  Country,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';

export const ProjectActivityStep = (props: any) => {
  const { useLocation, translator, current, form, next, countries, prev } = props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const t = translator.t;
  return (
    <>
      {current === 1 && (
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
                      label={t('monitoringReport:pa_monitoringObjective')}
                      name="pa_monitoringObjective"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_monitoringObjective')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_monitoringObjectivePlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pa_implementation')}
                      name="pa_implementation"
                      tooltip={{
                        title: (
                          <div className="tooltip">
                            <p>Should include:</p>
                            <ul>
                              <li>
                                A summary description of the implementation status of the
                                technologies/measures(e.g. plant,equipment, process, or management
                                or conversion measures) included in the project.
                              </li>
                              <li>
                                Whether the project is a bundled project activity leading to an
                                aggregated emission reduction.
                              </li>
                              <li>
                                Relevent dates of the project activity (e.g. construction,
                                commissioningm continued operation periods, etc.)
                              </li>
                              <li>
                                Total GHG emission reductions or removals generated in this
                                monitoring period.
                              </li>
                            </ul>
                          </div>
                        ),
                        icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                        placement: 'topLeft',
                      }}
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_implementation')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_implementationPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pa_scopeAndType')}
                      name="pa_scopeAndType"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_scopeAndType')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_scopeAndTypePlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <h4 className="form-section-title">{t('CMAForm:projectProponent')}</h4>

                    <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                      <Col xl={12} md={24}>
                        <div className="step-form-right-col">
                          <Form.Item
                            label={t('CMAForm:organizationName')}
                            name="organizationName"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:organizationName')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:contactPerson')}
                            name="contactPerson"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:telephone')}
                            name="telephone"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
                              },
                              {
                                validator: async (rule: any, value: any) => {
                                  if (
                                    String(value).trim() === '' ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
                                  } else {
                                    const phoneNo = formatPhoneNumber(String(value));
                                    if (String(value).trim() !== '') {
                                      if (
                                        phoneNo === null ||
                                        phoneNo === '' ||
                                        phoneNo === undefined
                                      ) {
                                        throw new Error(
                                          `${t('CMAForm:telephone')} ${t('isRequired')}`
                                        );
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(
                                            `${t('CMAForm:telephone')} ${t('isInvalid')}`
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
                              // placeholder={t('CMAForm:telephone')}
                              international
                              value={formatPhoneNumberIntl(contactNoInput)}
                              defaultCountry="LK"
                              countryCallingCodeEditable={false}
                              onChange={(v) => {}}
                              countries={countries as Country[]}
                            />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:fax')}
                            name="telephone"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule: any, value: any) => {
                                  if (
                                    String(value).trim() === '' ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                  } else {
                                    const phoneNo = formatPhoneNumber(String(value));
                                    if (String(value).trim() !== '') {
                                      if (
                                        phoneNo === null ||
                                        phoneNo === '' ||
                                        phoneNo === undefined
                                      ) {
                                        throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(`${t('CMAForm:fax')} ${t('isInvalid')}`);
                                        }
                                      }
                                    }
                                  }
                                },
                              },
                            ]}
                          >
                            <PhoneInput
                              // placeholder={t('CMAForm:telephone')}
                              international
                              value={formatPhoneNumberIntl(contactNoInput)}
                              defaultCountry="LK"
                              countryCallingCodeEditable={false}
                              onChange={(v) => {}}
                              countries={countries as Country[]}
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xl={12} md={24}>
                        <Form.Item
                          label={t('CMAForm:email')}
                          name="email"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:email')} ${t('isRequired')}`,
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t('addCompany:email')} ${t('isRequired')}`);
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(`${t('addCompany:email')} ${t('isInvalid')}`);
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:title')}
                          name="title"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:title')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:address')}
                          name="address"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:address')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <h4 className="form-section-title">{t('CMAForm:otherEntitiesInProject')}</h4>

                    <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                      <Col xl={12} md={24}>
                        <div className="step-form-right-col">
                          <Form.Item
                            label={t('CMAForm:organizationName')}
                            name="organizationName"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:organizationName')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:contactPerson')}
                            name="contactPerson"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:roleInTheProject')}
                            name={'roleInTheProject'}
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:roleInTheProject')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <TextArea rows={4} />
                          </Form.Item>

                          <Form.Item
                            label={t('CMAForm:telephone')}
                            name="telephone"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
                              },
                              {
                                validator: async (rule: any, value: any) => {
                                  if (
                                    String(value).trim() === '' ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
                                  } else {
                                    const phoneNo = formatPhoneNumber(String(value));
                                    if (String(value).trim() !== '') {
                                      if (
                                        phoneNo === null ||
                                        phoneNo === '' ||
                                        phoneNo === undefined
                                      ) {
                                        throw new Error(
                                          `${t('CMAForm:telephone')} ${t('isRequired')}`
                                        );
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(
                                            `${t('CMAForm:telephone')} ${t('isInvalid')}`
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
                              // placeholder={t('CMAForm:telephone')}
                              international
                              value={formatPhoneNumberIntl(contactNoInput)}
                              defaultCountry="LK"
                              countryCallingCodeEditable={false}
                              onChange={(v) => {}}
                              countries={countries as Country[]}
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xl={12} md={24}>
                        <Form.Item
                          label={t('CMAForm:email')}
                          name="email"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:email')} ${t('isRequired')}`,
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t('addCompany:email')} ${t('isRequired')}`);
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(`${t('addCompany:email')} ${t('isInvalid')}`);
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:title')}
                          name="title"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:title')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:address')}
                          name="address"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:address')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <TextArea rows={4} />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:fax')}
                          name="fax"
                          rules={[
                            {
                              required: true,
                              message: ``,
                            },
                            {
                              validator: async (rule: any, value: any) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                } else {
                                  const phoneNo = formatPhoneNumber(String(value));
                                  if (String(value).trim() !== '') {
                                    if (
                                      phoneNo === null ||
                                      phoneNo === '' ||
                                      phoneNo === undefined
                                    ) {
                                      throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                    } else {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(`${t('CMAForm:fax')} ${t('isInvalid')}`);
                                      }
                                    }
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <PhoneInput
                            // placeholder={t('CMAForm:telephone')}
                            international
                            value={formatPhoneNumberIntl(contactNoInput)}
                            defaultCountry="LK"
                            countryCallingCodeEditable={false}
                            onChange={(v) => {}}
                            countries={countries as Country[]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.List name="extraOtherEntities">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <Row
                              justify={'space-between'}
                              gutter={[40, 16]}
                              className="form-section"
                            >
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    label={t('CMAForm:organizationName')}
                                    name={[name, 'organizationName']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('CMAForm:organizationName')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>

                                  <Form.Item
                                    label={t('CMAForm:contactPerson')}
                                    name={[name, 'contactPerson']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>

                                  <Form.Item
                                    label={t('CMAForm:roleInTheProject')}
                                    name={[name, 'roleInTheProject']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('CMAForm:roleInTheProject')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>

                                  <Form.Item
                                    label={t('CMAForm:telephone')}
                                    name={[name, 'telephone']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
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
                                              `${t('CMAForm:telephone')} ${t('isRequired')}`
                                            );
                                          } else {
                                            const phoneNo = formatPhoneNumber(String(value));
                                            if (String(value).trim() !== '') {
                                              if (
                                                phoneNo === null ||
                                                phoneNo === '' ||
                                                phoneNo === undefined
                                              ) {
                                                throw new Error(
                                                  `${t('CMAForm:telephone')} ${t('isRequired')}`
                                                );
                                              } else {
                                                if (!isPossiblePhoneNumber(String(value))) {
                                                  throw new Error(
                                                    `${t('CMAForm:telephone')} ${t('isInvalid')}`
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
                                      // placeholder={t('CMAForm:telephone')}
                                      international
                                      value={formatPhoneNumberIntl(contactNoInput)}
                                      defaultCountry="LK"
                                      countryCallingCodeEditable={false}
                                      onChange={(v) => {}}
                                      countries={countries as Country[]}
                                    />
                                  </Form.Item>
                                </div>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('CMAForm:email')}
                                  name={[name, 'email']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:email')} ${t('isRequired')}`,
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
                                            `${t('addCompany:email')} ${t('isRequired')}`
                                          );
                                        } else {
                                          const val = value.trim();
                                          const reg =
                                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                          const matches = val.match(reg) ? val.match(reg) : [];
                                          if (matches.length === 0) {
                                            throw new Error(
                                              `${t('addCompany:email')} ${t('isInvalid')}`
                                            );
                                          }
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:title')}
                                  name={[name, 'title']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:title')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:address')}
                                  name={[name, 'address']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:address')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <TextArea rows={4} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:fax')}
                                  name={[name, 'fax']}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule: any, value: any) => {
                                        if (
                                          String(value).trim() === '' ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                        } else {
                                          const phoneNo = formatPhoneNumber(String(value));
                                          if (String(value).trim() !== '') {
                                            if (
                                              phoneNo === null ||
                                              phoneNo === '' ||
                                              phoneNo === undefined
                                            ) {
                                              throw new Error(
                                                `${t('CMAForm:fax')} ${t('isRequired')}`
                                              );
                                            } else {
                                              if (!isPossiblePhoneNumber(String(value))) {
                                                throw new Error(
                                                  `${t('CMAForm:fax')} ${t('isInvalid')}`
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
                                    international
                                    value={formatPhoneNumberIntl(contactNoInput)}
                                    defaultCountry="LK"
                                    countryCallingCodeEditable={false}
                                    onChange={(v) => {}}
                                    countries={countries as Country[]}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
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
                                icon={<PlusOutlined />}
                              >
                                Add Entity
                              </Button>
                            </Form.Item>
                            {fields.length > 0 && (
                              <Form.Item>
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    const lastField = fields.length > 0 ? fields.pop() : undefined;
                                    if (lastField !== undefined) {
                                      remove(lastField.name);
                                    }
                                  }}
                                  size="large"
                                  className="addMinusBtn"
                                  icon={<MinusOutlined />}
                                >
                                  Remove Entity
                                </Button>
                              </Form.Item>
                            )}
                          </div>
                        </>
                      )}
                    </Form.List>
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
