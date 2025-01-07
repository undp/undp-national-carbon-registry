import { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select, Upload } from 'antd';
import PhoneInput, {
  Country,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import LocationMapComponent from './LocationMapComponent';
import { DocType } from '../../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import GetLocationMapComponent from '../../Maps/GetLocationMapComponent';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import LabelWithTooltip, { TooltipPostion } from '../../LabelWithTooltip/LabelWithTooltip';
import { fileUploadValueExtract } from '../../../Utils/utilityHelper';
export const ProjectActivityStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, countries, prev, onValueChange } =
    props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : 'pk.eyJ1IjoicGFsaW5kYSIsImEiOiJjbGMyNTdqcWEwZHBoM3FxdHhlYTN4ZmF6In0.KBvFaMTjzzvoRCr1Z1dN_g';

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ [key: number]: string[] }>({});
  const [dsDivisions, setDsDivisions] = useState<{ [key: number]: string[] }>({});
  const [cities, setCities] = useState<{ [key: number]: string[] }>({});

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const getExistingCordinate = (locationIndex: number) => {
    const locationList = form.getFieldValue('projectActivityLocationsList');
    console.log(locationList);
    if (locationList[locationIndex] && locationList[locationIndex].location)
      return locationList[locationIndex].location;

    return null;
  };

  const getProvinces = async () => {
    try {
      const { data } = await post('national/location/province');
      const tempProvinces = data.map((provinceData: any) => provinceData.provinceName);
      setProvinces(tempProvinces);
    } catch (error) {
      console.log(error);
    }
  };

  const getDistricts = async (provinceName: string, index: number) => {
    try {
      const { data } = await post('national/location/district', {
        filterAnd: [
          {
            key: 'provinceName',
            operation: '=',
            value: provinceName,
          },
        ],
      });
      const tempDistricts = data.map((districtData: any) => districtData.districtName);
      setDistricts((prev1) => ({ ...prev1, [index]: tempDistricts }));
    } catch (error) {
      console.log(error);
    }
  };

  const getDivisions = async (districtName: string, index: number) => {
    try {
      const { data } = await post('national/location/division', {
        filterAnd: [
          {
            key: 'districtName',
            operation: '=',
            value: districtName,
          },
        ],
      });

      const tempDivisions = data.map((divisionData: any) => divisionData.divisionName);
      setDsDivisions((prev2) => ({ ...prev2, [index]: tempDivisions }));
    } catch (error) {
      console.log(error);
    }
  };

  const getCities = async (division: string, index: number) => {
    try {
      const { data } = await post('national/location/city', {
        filterAnd: [
          {
            key: 'divisionName',
            operation: '=',
            value: division,
          },
        ],
      });
      // const { data } = await post('national/location/city');

      const tempCities = data.map((cityData: any) => cityData.cityName);
      setCities((prev3) => ({ ...prev3, [index]: tempCities }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
    // getCities();
  }, []);

  const onProvinceSelect = async (value: any, index: number) => {
    getDistricts(value, index);
  };

  const onDistrictSelect = (value: string, index: number) => {
    getDivisions(value, index);
  };

  const onDivisionSelect = (value: string, index: number) => {
    getCities(value, index);
  };

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
              disabled={FormMode.VIEW === formMode}
              initialValues={{}}
              onFinish={async (values: any) => {
                onValueChange({ projectActivity: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`1.1 ${t('monitoringReport:pa_monitoringObjective')}`}
                      name="monitoringObjective"
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
                        disabled={FormMode.VIEW === formMode}
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_monitoringObjectivePlaceholder')}`}
                      />
                    </Form.Item>
                    <LabelWithTooltip
                      label={`1.2 ${t('monitoringReport:pa_implementation')}`}
                      required={true}
                      tooltipPosition={TooltipPostion.bottom}
                      tooltipContent={
                        <div>
                          <p>Should include:</p>
                          <ul>
                            <li>
                              A summary description of the implementation status of the
                              technologies/measures(e.g. plant,equipment, process, or management or
                              conversion measures) included in the project.
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
                              Total GHG emission reductions or removals generated in this monitoring
                              period.
                            </li>
                          </ul>
                        </div>
                      }
                      tooltipWidth={600}
                    />
                    <Form.Item
                      name="implementation"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_implementation')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        disabled={FormMode.VIEW === formMode}
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_implementationPlaceholder')}`}
                      />
                    </Form.Item>
                    <Form.Item
                      label={`1.3 ${t('monitoringReport:pa_scopeAndType')}`}
                      name="scopeAndType"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_scopeAndType')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        disabled={FormMode.VIEW === formMode}
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_scopeAndTypePlaceholder')}`}
                      />
                    </Form.Item>
                    <h4 className="form-section-title">{`1.4  ${t(
                      'monitoringReport:projectProponent'
                    )}`}</h4>

                    <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                      <Col xl={12} md={24}>
                        <div className="step-form-right-col">
                          <Form.Item
                            label={t('monitoringReport:organizationName')}
                            name="pp_organizationName"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:organizationName')} ${t(
                                  'isRequired'
                                )}`,
                              },
                            ]}
                          >
                            <Input size="large" disabled />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:contactPerson')}
                            name="pp_contactPerson"
                            rules={[
                              {
                                required: true,
                                message: `${t('monitoringReport:contactPerson')} ${t(
                                  'isRequired'
                                )}`,
                              },
                            ]}
                          >
                            <Input size="large" disabled />
                          </Form.Item>

                          <Form.Item
                            label={t('monitoringReport:telephone')}
                            name="pp_telephone"
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
                                      `${t('monitoringReport:telephone')} ${t('isRequired')}`
                                    );
                                  } else {
                                    const phoneNo = formatPhoneNumber(String(value));
                                    if (String(value).trim() !== '') {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(
                                          `${t('monitoringReport:telephone')} ${t('isInvalid')}`
                                        );
                                      }
                                    }
                                  }
                                },
                              },
                            ]}
                          >
                            <PhoneInput
                              disabled
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
                          name="pp_email"
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
                                    `${t('monitoringReport:email')} ${t('isRequired')}`
                                  );
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(
                                      `${t('monitoringReport:email')} ${t('isInvalid')}`
                                    );
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('monitoringReport:designation')}
                          name="pp_designation"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:designation')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('monitoringReport:address')}
                          name="pp_address"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:address')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <TextArea rows={4} disabled />
                        </Form.Item>
                      </Col>
                    </Row>

                    <>
                      <h4 className="form-section-title">
                        {`1.5  ${t('monitoringReport:otherEntitiesInProject')}`}
                      </h4>

                      <Form.List name="projectProponentsList">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div className="form-list-actions">
                                  <h4>Entity {name + 1}</h4>
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
                                        disabled
                                      >
                                        {/* Remove Entity */}
                                      </Button>
                                    )}
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
                                        <Input size="large" disabled />
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
                                        <Input size="large" disabled />
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
                                        <TextArea rows={4} disabled />
                                      </Form.Item>

                                      <Form.Item
                                        label={t('monitoringReport:telephone')}
                                        name={[name, 'telephone']}
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
                                                  `${t('monitoringReport:telephone')} ${t(
                                                    'isRequired'
                                                  )}`
                                                );
                                              } else {
                                                const phoneNo = formatPhoneNumber(String(value));
                                                if (String(value).trim() !== '') {
                                                  if (!isPossiblePhoneNumber(String(value))) {
                                                    throw new Error(
                                                      `${t('monitoringReport:telephone')} ${t(
                                                        'isInvalid'
                                                      )}`
                                                    );
                                                  }
                                                }
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <PhoneInput
                                          disabled
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
                                                `${t('monitoringReport:email')} ${t('isRequired')}`
                                              );
                                            } else {
                                              const val = value.trim();
                                              const reg =
                                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                              const matches = val.match(reg) ? val.match(reg) : [];
                                              if (matches.length === 0) {
                                                throw new Error(
                                                  `${t('monitoringReport:email')} ${t('isInvalid')}`
                                                );
                                              }
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" disabled />
                                    </Form.Item>

                                    <Form.Item
                                      label={t('monitoringReport:designation')}
                                      name={[name, 'designation']}
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('monitoringReport:designation')} ${t(
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
                                      <TextArea rows={4} disabled />
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
                                  disabled
                                >
                                  {/* Add Entity */}
                                </Button>
                              </Form.Item>
                            </div>
                          </>
                        )}
                      </Form.List>
                    </>

                    <>
                      <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                        <Col xl={12} md={24}>
                          <div className="step-form-right-col">
                            <h4 className="form-section-title">
                              {`1.6  ${t('monitoringReport:projectCreditingPeriod')}`}{' '}
                              <span style={{ color: '#ff4d4f' }}> *</span>
                            </h4>
                            <Row>
                              <Col xl={11} md={24}>
                                <Form.Item
                                  name="creditingPeriodFromDate"
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
                                            `${t('monitoringReport:creditingPeriodFromDate')} ${t(
                                              'isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabledDate={(currentDate: any) =>
                                      currentDate < moment().startOf('day')
                                    }
                                    disabled
                                  />
                                </Form.Item>
                              </Col>
                              <Col xl={2} md={24}>
                                <div className="step-form-right-col">
                                  <h4 className="to-lable">{t('monitoringReport:to')}</h4>
                                </div>
                              </Col>
                              <Col xl={11} md={24}>
                                <Form.Item
                                  name="creditingPeriodToDate"
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
                                            `${t('monitoringReport:creditingPeriodToDate')} ${t(
                                              'isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabledDate={(currentDate: any) =>
                                      currentDate < moment().startOf('day')
                                    }
                                    disabled
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row>
                              <Col xl={24} md={24}>
                                <div className="step-form-left-col">
                                  <Form.Item
                                    name="creditingPeriodComment"
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t(
                                          'monitoringReport:creditingPeriodComment'
                                        )} ${t('isRequired')}`,
                                      },
                                    ]}
                                  >
                                    <TextArea rows={6} disabled />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Col>
                        <Col xl={12} md={24}>
                          <div className="step-form-right-col">
                            <h4 className="form-section-title">
                              {`1.7  ${t('monitoringReport:registrationDateOfTheActivity')}`}
                              <span style={{ color: '#ff4d4f' }}> *</span>
                            </h4>
                            <Row>
                              <Col xl={24} md={24}>
                                <Form.Item
                                  name="registrationDateOfTheActivity"
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
                                            `${t(
                                              'monitoringReport:registrationDateOfTheActivity'
                                            )} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabledDate={(currentDate: any) =>
                                      currentDate < moment().startOf('day')
                                    }
                                    disabled
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                          <div className="step-form-right-col">
                            <h4 className="form-section-title">
                              {`1.8  ${t('monitoringReport:projectTrackAndCreditUse')}`}
                              <span style={{ color: '#ff4d4f' }}> *</span>
                            </h4>
                            <Row>
                              <Col xl={24} md={24}>
                                <Form.Item
                                  name="projectTrackAndCreditUse"
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t(
                                        'monitoringReport:projectTrackAndCreditUse'
                                      )} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <TextArea rows={3} disabled />
                                </Form.Item>
                                <h4 className="form-section-title">
                                  {`${t('monitoringReport:projectTrackAndCreditUseComment')}`}
                                </h4>
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      </Row>
                    </>
                  </div>
                </Col>
              </Row>
              <>
                <h4 className="form-section-title">{`1.9 ${t(
                  'monitoringReport:locationOfProjectActivity'
                )}`}</h4>

                <Form.List name="projectActivityLocationsList">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }, locationIndex: number) => (
                        <>
                          <div className="form-list-actions">
                            <h4>Location {name + 1}</h4>
                            <Form.Item>
                              {name !== 0 && (
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    remove(name);
                                    if (districts[name]) {
                                      delete districts[name];
                                    }
                                    if (dsDivisions[name]) {
                                      delete dsDivisions[name];
                                    }
                                    if (cities[name]) {
                                      delete cities[name];
                                    }
                                  }}
                                  size="large"
                                  className="addMinusBtn"
                                  // block
                                  icon={<MinusOutlined />}
                                  disabled
                                >
                                  {/* Remove Entity */}
                                </Button>
                              )}
                            </Form.Item>
                          </div>
                          <Row
                            justify={'space-between'}
                            gutter={[40, 16]}
                            className="form-section"
                            style={{ borderRadius: '8px' }}
                          >
                            <Col xl={12} md={24}>
                              <Form.Item
                                label={t('monitoringReport:locationOfProjectActivity')}
                                name={[name, 'locationOfProjectActivity']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      'monitoringReport:locationOfProjectActivity'
                                    )} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled />
                              </Form.Item>

                              <Form.Item
                                label={t('monitoringReport:province')}
                                name={[name, 'province']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:province')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  onChange={(value) => onProvinceSelect(value, name)}
                                  placeholder={t('monitoringReport:provincePlaceholder')}
                                  disabled
                                >
                                  {provinces.map((province: string, index: number) => (
                                    <Select.Option value={province}>{province}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t('monitoringReport:district')}
                                name={[name, 'district']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:district')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('monitoringReport:districtPlaceholder')}
                                  onSelect={(value) => onDistrictSelect(value, name)}
                                  disabled
                                >
                                  {districts[name]?.map((district: string, index: number) => (
                                    <Select.Option key={district}>{district}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('monitoringReport:dsDivision')}
                                name={[name, 'dsDivision']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:dsDivision')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('monitoringReport:dsDivisionPlaceholder')}
                                  onSelect={(value) => onDivisionSelect(value, name)}
                                  disabled
                                >
                                  {dsDivisions[name]?.map((division: string) => (
                                    <Select.Option value={division}>{division}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('monitoringReport:city')}
                                name={[name, 'city']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:city')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('monitoringReport:cityPlaceholder')}
                                  disabled
                                >
                                  {cities[name]?.map((city: string) => (
                                    <Select.Option value={city}>{city}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('monitoringReport:community')}
                                name={[name, 'community']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:community')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled />
                              </Form.Item>
                            </Col>

                            <Col xl={12} md={24}>
                              <Form.Item
                                label={t('monitoringReport:setLocation')}
                                name={[name, 'location']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:location')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <GetLocationMapComponent
                                  form={form}
                                  formItemName={[name, 'location']}
                                  listName="projectActivityLocationsList"
                                  existingCordinate={getExistingCordinate(locationIndex)}
                                  disabled
                                />
                              </Form.Item>
                            </Col>
                            <Col xl={24} md={24}>
                              <Form.Item
                                label={t('monitoringReport:q_documentUpload')}
                                name={[name, 'optionalDocuments']}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                                required={false}
                                rules={
                                  formMode === FormMode.VIEW
                                    ? []
                                    : [
                                        {
                                          validator: async (rule, file) => {
                                            if (file?.length > 0) {
                                              if (file[0]?.size > maximumImageSize) {
                                                throw new Error(`${t('common:maxSizeVal')}`);
                                              }
                                            }
                                          },
                                        },
                                      ]
                                }
                              >
                                <Upload
                                  accept=".doc, .docx, .pdf, .png, .jpg"
                                  beforeUpload={(file: any) => {
                                    return false;
                                  }}
                                  className="design-upload-section"
                                  name="design"
                                  action="/upload.do"
                                  listType="picture"
                                  multiple={false}
                                  // maxCount={1}
                                >
                                  <Button
                                    className="upload-doc"
                                    size="large"
                                    icon={<UploadOutlined />}
                                    disabled
                                  >
                                    Upload
                                  </Button>
                                </Upload>
                              </Form.Item>
                            </Col>
                            <Col xl={12} md={24}>
                              <Form.Item
                                label={`1.10 ${t('monitoringReport:projectStartDate')}`}
                                name={[name, 'projectStartDate']}
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
                                          `${t('monitoringReport:projectStartDate')} ${t(
                                            'isRequired'
                                          )}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <DatePicker
                                  size="large"
                                  disabledDate={(currentDate: any) =>
                                    currentDate < moment().startOf('day')
                                  }
                                  disabled
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
                            disabled
                          >
                            {/* Add Entity */}
                          </Button>
                        </Form.Item>
                      </div>
                    </>
                  )}
                </Form.List>
              </>

              <h4 className="form-section-title">
                {`1.11 ${t('monitoringReport:titleAndReferenceOfMethodology')}`}
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
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`1.12 ${t('monitoringReport:participationGhgPrograms')}`}
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
                        disabled={FormMode.VIEW === formMode}
                        rows={6}
                        placeholder={`${t('monitoringReport:participationGhgProgramsPlaceholder')}`}
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={`1.13 ${t('monitoringReport:otherFormsOfCredit')}`}
                      name="otherFormsOfCredit"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:otherFormsOfCredit')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`1.14 ${t('monitoringReport:sustainableDevelopment')}`}
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
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
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
