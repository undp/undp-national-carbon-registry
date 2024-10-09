import { Button, Col, Form, Input, Row, StepProps } from 'antd';
import React, { useEffect, useState } from 'react';
import { CustomStepsProps } from './StepProps';
import {
  InfoCircleFilled,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import TextArea from 'antd/lib/input/TextArea';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
  Country,
} from 'react-phone-number-input';

const Step02 = (props: CustomStepsProps) => {
  const { next, prev, form, current, t, countries } = props;
  const [contactNoInput] = useState<any>();

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
              onFinish={(values: any) => {
                console.log('-----values---------', values);
              }}
            >
              <Form.Item
                className="full-width-form-item"
                label={t('CMAForm:projectActivity')}
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>Should include:</p>
                      <ul>
                        <li>
                          A summary description of the technologies/measures to be implemented by
                          the project.{' '}
                        </li>
                        <li>The location of the project.</li>
                        <li>
                          An explanation of how the project is expected to generate GHG emission
                          reductions or removals.{' '}
                        </li>
                        <li>
                          A brief description of the scenario existing prior to the implementation
                          of the project.
                        </li>
                        <li>
                          An estimate of annual average and total GHG emission reductions and
                          removals.
                        </li>
                      </ul>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                name="projectActivity"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:projectActiviy')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project to enable an understanding of the nature  of the project and its implementation"
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={t('sectoralScopeProjectType')}
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:sectoralScopeProjectType')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project to enable an understanding of the nature  of the project and its implementation"
                />
              </Form.Item>
              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'}>
                  {t('CMAForm:cancel')}
                </Button>
                <Button type="primary" size={'large'} onClick={next}>
                  {t('CMAForm:next')}
                </Button>
              </Row>

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
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(`${t('CMAForm:telephone')} ${t('isInvalid')}`);
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
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
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

              <>
                <h4 className="form-section-title">{t('CMAForm:otherEntitiesInProject')}</h4>

                <h4>Entity 1</h4>
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
                                  if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                    throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
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
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
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
                        <>
                          <div className="form-list-actions">
                            <h4>Entity {name + 2}</h4>
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
                          <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
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
              </>

              <></>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default Step02;
