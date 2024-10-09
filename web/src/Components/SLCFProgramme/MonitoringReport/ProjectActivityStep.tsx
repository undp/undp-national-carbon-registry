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
                    <h4 className="form-section-title">{t('monitoringReport:projectProponent')}</h4>

                    <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                      <Col xl={12} md={24}>
                        <div className="step-form-right-col">
                          <Form.Item
                            label={t('monitoringReport:organizationName')}
                            name="organizationName"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:organizationName')} ${t(
                                  'isRequired'
                                )}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:contactPerson')}
                            name="contactPerson"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:contactPerson')} ${t(
                                  'isRequired'
                                )}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:telephone')}
                            name="telephone"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:telephone')} ${t('isRequired')}`,
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
                                      `${t('monitoringReport:telephone')} ${t('isRequired')}`
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
                                          `${t('monitoringReport:telephone')} ${t('isRequired')}`
                                        );
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(
                                            `${t('monitoringReport:telephone')} ${t('isInvalid')}`
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
                              // placeholder={t('monitoringReport:telephone')}
                              international
                              value={formatPhoneNumberIntl(contactNoInput)}
                              defaultCountry="LK"
                              countryCallingCodeEditable={false}
                              onChange={(v) => {}}
                              countries={countries as Country[]}
                            />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:fax')}
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
                                    throw new Error(
                                      `${t('monitoringReport:fax')} ${t('isRequired')}`
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
                                          `${t('monitoringReport:fax')} ${t('isRequired')}`
                                        );
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(
                                            `${t('monitoringReport:fax')} ${t('isInvalid')}`
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
                              // placeholder={t('monitoringReport:telephone')}
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
                          label={t('monitoringReport:email')}
                          name="email"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:email')} ${t('isRequired')}`,
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
                          label={t('monitoringReport:title')}
                          name="title"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:title')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('monitoringReport:address')}
                          name="address"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:address')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <>
                      <h4 className="form-section-title">
                        {t('monitoringReport:otherEntitiesInProject')}
                      </h4>

                      <h4>Entity 1</h4>
                      <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                        <Col xl={12} md={24}>
                          <div className="step-form-right-col">
                            <Form.Item
                              label={t('monitoringReport:organizationName')}
                              name="organizationName"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:organizationName')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>

                            <Form.Item
                              label={t('monitoringReport:contactPerson')}
                              name="contactPerson"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:contactPerson')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <Input size="large" />
                            </Form.Item>

                            <Form.Item
                              label={t('monitoringReport:roleInTheProject')}
                              name={'roleInTheProject'}
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:roleInTheProject')} ${t(
                                    'isRequired'
                                  )}`,
                                },
                              ]}
                            >
                              <TextArea rows={4} />
                            </Form.Item>

                            <Form.Item
                              label={t('monitoringReport:telephone')}
                              name="telephone"
                              rules={[
                                {
                                  required: true,
                                  message: `${t('monitoringReport:telephone')} ${t('isRequired')}`,
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
                                        `${t('monitoringReport:telephone')} ${t('isRequired')}`
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
                                            `${t('monitoringReport:telephone')} ${t('isRequired')}`
                                          );
                                        } else {
                                          if (!isPossiblePhoneNumber(String(value))) {
                                            throw new Error(
                                              `${t('monitoringReport:telephone')} ${t('isInvalid')}`
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
                                // placeholder={t('monitoringReport:telephone')}
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
                            label={t('monitoringReport:email')}
                            name="email"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:email')} ${t('isRequired')}`,
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
                            label={t('monitoringReport:title')}
                            name="title"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:title')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <Input size="large" />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:address')}
                            name="address"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:address')} ${t('isRequired')}`,
                              },
                            ]}
                          >
                            <TextArea rows={4} />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:fax')}
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
                                    throw new Error(
                                      `${t('monitoringReport:fax')} ${t('isRequired')}`
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
                                          `${t('monitoringReport:fax')} ${t('isRequired')}`
                                        );
                                      } else {
                                        if (!isPossiblePhoneNumber(String(value))) {
                                          throw new Error(
                                            `${t('monitoringReport:fax')} ${t('isInvalid')}`
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
                              // placeholder={t('monitoringReport:telephone')}
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
                                <Row
                                  justify={'space-between'}
                                  gutter={[40, 16]}
                                  className="form-section"
                                >
                                  <Col xl={12} md={24}>
                                    <div className="step-form-right-col">
                                      <Form.Item
                                        label={t('monitoringReport:organizationName')}
                                        name={[name, 'organizationName']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:organizationName')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>

                                      <Form.Item
                                        label={t('monitoringReport:contactPerson')}
                                        name={[name, 'contactPerson']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:contactPerson')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>

                                      <Form.Item
                                        label={t('monitoringReport:roleInTheProject')}
                                        name={[name, 'roleInTheProject']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:roleInTheProject')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <TextArea rows={4} />
                                      </Form.Item>

                                      <Form.Item
                                        label={t('monitoringReport:telephone')}
                                        name={[name, 'telephone']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('monitoringReport:telephone')} ${t(
                                              'isRequired'
                                            )}`,
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
                                                  `${t('monitoringReport:telephone')} ${t(
                                                    'isRequired'
                                                  )}`
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
                                                      `${t('monitoringReport:telephone')} ${t(
                                                        'isRequired'
                                                      )}`
                                                    );
                                                  } else {
                                                    if (!isPossiblePhoneNumber(String(value))) {
                                                      throw new Error(
                                                        `${t('monitoringReport:telephone')} ${t(
                                                          'isInvalid'
                                                        )}`
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
                                          // placeholder={t('monitoringReport:telephone')}
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
                                      label={t('monitoringReport:email')}
                                      name={[name, 'email']}
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('monitoringReport:email')} ${t(
                                            'isRequired'
                                          )}`,
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
                                      label={t('monitoringReport:title')}
                                      name={[name, 'title']}
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('monitoringReport:title')} ${t(
                                            'isRequired'
                                          )}`,
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>

                                    <Form.Item
                                      label={t('monitoringReport:address')}
                                      name={[name, 'address']}
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('monitoringReport:address')} ${t(
                                            'isRequired'
                                          )}`,
                                        },
                                      ]}
                                    >
                                      <TextArea rows={4} />
                                    </Form.Item>

                                    <Form.Item
                                      label={t('monitoringReport:fax')}
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
                                              throw new Error(
                                                `${t('monitoringReport:fax')} ${t('isRequired')}`
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
                                                    `${t('monitoringReport:fax')} ${t(
                                                      'isRequired'
                                                    )}`
                                                  );
                                                } else {
                                                  if (!isPossiblePhoneNumber(String(value))) {
                                                    throw new Error(
                                                      `${t('monitoringReport:fax')} ${t(
                                                        'isInvalid'
                                                      )}`
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
                                        // placeholder={t('monitoringReport:telephone')}
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
                  </div>
                </Col>
              </Row>
              <h4 className="form-section-title">
                {t('monitoringReport:titleAndReferenceOfMethodology')}
              </h4>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:title')}
                      name="title"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:title')} ${t('isRequired')}`,
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
                      label={t('monitoringReport:methodology')}
                      name="methodology"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:methodology')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:reference')}
                      name="reference"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:reference')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_referencePlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:participationGhgPrograms')}
                      name="participationGhgPrograms"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:participationGhgPrograms')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:participationGhgProgramsPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:otherFormsOfCredit')}
                      name="otherFormsOfCredit"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:otherFormsOfCredit')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:otherFormsOfCreditPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:sustainableDevelopment')}
                      name="sustainableDevelopment"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:sustainableDevelopment')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:sustainableDevelopmentPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
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
