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
export const IntroductionStep = (props: any) => {
  const { useLocation, translator, current, form, next, countries, prev, onValueChange } = props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [dsDivisions, setDsDivisions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
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

  const getDistricts = async (provinceName: string) => {
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
      setDistricts(tempDistricts);
    } catch (error) {
      console.log(error);
    }
  };

  const getDivisions = async (districtName: string) => {
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
      setDsDivisions(tempDivisions);
    } catch (error) {
      console.log(error);
    }
  };

  const getCities = async (division?: string) => {
    try {
      const { data } = await post('national/location/city');

      const tempCities = data.map((cityData: any) => cityData.cityName);
      setCities(tempCities);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
    getCities();
  }, []);

  const onProvinceSelect = async (value: any) => {
    getDistricts(value);
    try {
    } catch (error) {}
  };

  const onDistrictSelect = (value: string) => {
    getDivisions(value);
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
              initialValues={{}}
              onFinish={async (values: any) => {
                onValueChange({ introduction: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:introduction')}`}
                      name="introduction"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:introduction')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                    <Form.Item
                      label={`1.1 ${t('verificationReport:objective')}`}
                      name="objective"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:objective')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                    <Form.Item
                      label={`1.2 ${t('verificationReport:scopeAndCriteria')}`}
                      name="scopeAndCriteria"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:scopeAndCriteria')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <h4 className="form-section-title">{`1.3  ${t(
                'verificationReport:projectActivityDescription'
              )}`}</h4>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:titleOfTheActivity')}
                      name="title"
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
                                `${t('verificationReport:titleOfTheActivity')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:hostParty')}
                      name="hostParty"
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
                                `${t('verificationReport:hostParty')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <h4 className="form-section-title">
                      {`${t('verificationReport:creditionPeriod')}`}
                    </h4>
                    <Row>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="creditionPeriodStart"
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
                                    `${t('verificationReport:creditionPeriodStart')} ${t(
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
                          />
                        </Form.Item>
                      </Col>
                      <Col xl={2} md={24}>
                        <div className="step-form-right-col">
                          <h4 className="to-lable">{t('verificationReport:to')}</h4>
                        </div>
                      </Col>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="creditionPeriodEnd"
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
                                    `${t('verificationReport:creditionPeriodEnd')} ${t(
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
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('verificationReport:projectParticipants')}
                      name="tiprojectParticipantstle"
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
                                `${t('verificationReport:projectParticipants')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:monitoringMethodology')}
                      name="monitoringMethodology"
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
                                `${t('verificationReport:monitoringMethodology')} ${t(
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
                    <h4 className="form-section-title">
                      {`${t('verificationReport:periodVerified')}`}
                    </h4>
                    <Row>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="periodVerifiedStart"
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
                                    `${t('verificationReport:periodVerifiedStart')} ${t(
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
                          />
                        </Form.Item>
                      </Col>
                      <Col xl={2} md={24}>
                        <div className="step-form-right-col">
                          <h4 className="to-lable">{t('verificationReport:to')}</h4>
                        </div>
                      </Col>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="periodVerifiedEnd"
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
                                    `${t('verificationReport:periodVerifiedEnd')} ${t(
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
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`1.4 ${t('verificationReport:emissionReductionMethodology')}`}
                      name="methodology"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:emissionReductionMethodology')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} />
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
