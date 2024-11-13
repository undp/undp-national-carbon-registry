import { useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select, Steps, Upload, message } from 'antd';
import {
  InfoCircleOutlined,
  MinusCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './SLCFProgrammeCreationComponent.scss';
import moment from 'moment';
import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocType } from '../../../Definitions/Enums/document.type';
import { MapSourceData } from '../../../Definitions/Definitions/mapComponent.definitions';
import { MapComponent } from '../../Maps/mapComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useNavigate } from 'react-router-dom';
import GetMultipleLocationsMapComponent from '../../Maps/GetMultipleLocationsMapComponent';
import { Loading } from '../../Loading/loading';

type SizeType = Parameters<typeof Form>[0]['size'];

const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
  ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
  : 5000000;

const PROJECT_GEOGRAPHY: { [key: string]: string } = {
  SINGLE: 'Single Location',
  MULTIPLE: 'Scattered in multiple locations',
};

const PROJECT_CATEGORIES: { [key: string]: string } = {
  RENEWABLE_ENERGY: 'Renewable Energy',
  AFFORESTATION: 'Afforestation',
  REFORESTATION: 'Reforestation',
  OTHER: 'Other',
};

const PROJECT_STATUS: { [key: string]: string } = {
  PROPOSAL_STAGE: 'Proposal Stage',
  PROCUREMENT_STAGE: 'Procurement',
  CONSTRUCTION_STAGE: 'Construction',
  INSTALLATION_STAGE: 'Installation',
};

export const PURPOSE_CREDIT_DEVELOPMENT: { [key: string]: string } = {
  TRACK_1: 'Track 1',
  TRACK_2: 'Track 2',
};

export const SLCFProgrammeCreationComponent = (props: any) => {
  const { useLocation, onNavigateToProgrammeView, translator } = props;
  const [current, setCurrent] = useState<number>(0);
  const navigate = useNavigate();
  const { post } = useConnection();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);

  const [projectCategory, setProjectCategory] = useState<string>();
  const [isMultipleLocations, setIsMultipleLocations] = useState<boolean>(false);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [dsDivisions, setDsDivisions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

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
      setCities(tempCities);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
    // getCities();
  }, []);

  const onProvinceSelect = async (value: any) => {
    getDistricts(value);
    try {
    } catch (error) {}
  };

  const onDistrictSelect = (value: string) => {
    getDivisions(value);
  };

  const onDivisionSelect = (value: string) => {
    getCities(value);
  };

  const onGeographyOfProjectSelect = (value: string) => {
    if (value === 'MULTIPLE') {
      setIsMultipleLocations(true);
    } else {
      setIsMultipleLocations(false);
    }
  };

  const onProjectCategorySelect = (value: string) => {
    setProjectCategory(value);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const t = translator.t;

  const submitForm = async (values: any) => {
    const base64Docs: string[] = [];

    if (values?.optionalDocuments && values?.optionalDocuments.length > 0) {
      const docs = values.optionalDocuments;
      for (let i = 0; i < docs.length; i++) {
        const temp = await getBase64(docs[i]?.originFileObj as RcFile);
        base64Docs.push(temp); // No need for Promise.resolve
      }
    }

    const body: any = {
      title: values?.title,
      projectCategory: values?.projectCategory,
      province: values?.province || 'test',
      district: values?.district || 'test',
      dsDivision: values?.dsDivision || 'test',
      city: values?.city || 'test',
      community: values?.community,
      geographicalLocationCoordinates: values?.projectLocation,
      projectGeography: values?.projectGeography,
      otherProjectCategory: values?.otherCategory,
      landExtent: (function () {
        if (values?.landExtent) {
          const lands = [Number(Number(values?.landExtent).toFixed(2))];
          if (values?.landList) {
            values?.landList.forEach((item: any) =>
              lands.push(Number(Number(item.land).toFixed(2)))
            );
          }
          return lands;
        }
        return undefined;
      })(),
      proposedProjectCapacity: values?.projectCapacity,
      projectStatusDescription: values?.projectStatusDescription,
      speciesPlanted: values?.speciesPlanted,
      projectDescription: values?.briefProjectDescription,
      projectStatus: values?.projectStatus,
      purposeOfCreditDevelopment: values?.creditDevelopmentPurpose,
      startDate: moment(values?.startTime).startOf('day').unix(),
      additionalDocuments: base64Docs,
    };

    setLoading(true);
    try {
      const res = await post('national/programmeSl/create', body);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: t('addProgramme:programmeCreationSuccess'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/programmeManagementSLCF/viewAll');
      }
    } catch (error: any) {
      if (error && error.errors && error.errors.length > 0) {
        error.errors.forEach((err: any) => {
          Object.keys(err).forEach((field) => {
            console.log(`Error in ${field}: ${err[field].join(', ')}`);
            message.open({
              type: 'error',
              content: err[field].join(', '),
              duration: 4,
              style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
            });
          });
        });
      } else {
        message.open({
          type: 'error',
          content: error?.message,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <div className="main">{t('addProgramme:initalNotificationFormTitle')}</div>
      </div>
      <div className="adding-section">
        <div className="form-section">
          <Steps
            progressDot
            direction="vertical"
            current={current}
            items={[
              {
                title: (
                  <div className="step-title-container">
                    <div className="title">Project Details</div>
                  </div>
                ),
                description: current === 0 && (
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
                        onFinish={submitForm}
                      >
                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={12} md={24}>
                            <div className="details-part-one">
                              <Form.Item
                                label={t('addProgramme:title')}
                                name="title"
                                // initialValue={state?.record?.name}
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
                                          `${t('addProgramme:title')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input size="large" />
                              </Form.Item>
                              <Form.Item
                                label={t('addProgramme:province')}
                                name="province"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:province')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  onChange={onProvinceSelect}
                                  placeholder={t('addProgramme:provincePlaceholder')}
                                >
                                  {provinces.map((province: string, index: number) => (
                                    <Select.Option value={province}>{province}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t('addProgramme:district')}
                                name="district"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:district')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:districtPlaceholder')}
                                  onSelect={onDistrictSelect}
                                >
                                  {districts?.map((district: string, index: number) => (
                                    <Select.Option key={district}>{district}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('addProgramme:dsDivision')}
                                name="dsDivision"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:dsDivision')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:dsDivisionPlaceholder')}
                                  onSelect={onDivisionSelect}
                                >
                                  {dsDivisions.map((division: string) => (
                                    <Select.Option value={division}>{division}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('addProgramme:city')}
                                name="city"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:city')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:cityPlaceholder')}
                                >
                                  {cities.map((city: string) => (
                                    <Select.Option value={city}>{city}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t('addProgramme:community')}
                                name="community"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:community')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" />
                              </Form.Item>
                              <Form.Item
                                label={t('addProgramme:projectGeography')}
                                name="projectGeography"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:projectGeography')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:projectGeographyPlaceholder')}
                                  onChange={onGeographyOfProjectSelect}
                                >
                                  {Object.keys(PROJECT_GEOGRAPHY).map((geography: string) => (
                                    <Select.Option value={geography}>
                                      {PROJECT_GEOGRAPHY[geography]}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Row justify="space-between">
                                <Col span={9}>
                                  <Form.Item
                                    label={t('addProgramme:projectCategory')}
                                    name="projectCategory"
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('addProgramme:projectCategory')}`,
                                      },
                                    ]}
                                  >
                                    <Select size="large" onChange={onProjectCategorySelect}>
                                      {Object.keys(PROJECT_CATEGORIES).map((category: string) => (
                                        <Select.Option value={category}>
                                          {PROJECT_CATEGORIES[category]}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                {projectCategory === 'OTHER' && (
                                  <Col span={14}>
                                    <Form.Item
                                      label={t('addProgramme:otherCategory')}
                                      name="otherCategory"
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('addProgramme:otherCategory')} ${t(
                                            'isRequired'
                                          )}`,
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </Col>
                                )}
                              </Row>

                              {(projectCategory === 'AFFORESTATION' ||
                                projectCategory === 'REFORESTATION') && (
                                <>
                                  <Form.Item
                                    label={t('addProgramme:landExtent')}
                                    name="landExtent"
                                    className="landList-input"
                                    tooltip={{
                                      title: `${t('addProgramme:landExtentAndSpeciesPlantedInfo')}`,
                                      icon: (
                                        <InfoCircleOutlined
                                          style={{ color: 'rgba(58, 53, 65, 0.5)' }}
                                        />
                                      ),
                                      placement: 'topLeft',
                                    }}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('addProgramme:landExtent')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                      {
                                        validator(rule, value) {
                                          if (!value) {
                                            return Promise.resolve();
                                          }

                                          // eslint-disable-next-line no-restricted-globals
                                          if (isNaN(value)) {
                                            return Promise.reject(
                                              new Error('Land Extent should be an number')
                                            );
                                          }

                                          return Promise.resolve();
                                        },
                                      },
                                    ]}
                                  >
                                    <Input size="large" addonAfter="ha" />
                                  </Form.Item>
                                  <p>{isMultipleLocations}</p>
                                  {isMultipleLocations && (
                                    <>
                                      <Form.List name="landList">
                                        {(fields, { add, remove }) => (
                                          <>
                                            {fields.map(({ key, name, ...restField }) => (
                                              <div className="landList">
                                                <Form.Item
                                                  {...restField}
                                                  name={[name, 'land']}
                                                  label={t('addProgramme:landExtent')}
                                                  // wrapperCol={{ span: 22 }}
                                                  className="landList-input"
                                                  tooltip={{
                                                    title: `${t(
                                                      'addProgramme:landExtentAndSpeciesPlantedInfo'
                                                    )}`,
                                                    icon: (
                                                      <InfoCircleOutlined
                                                        style={{ color: 'rgba(58, 53, 65, 0.5)' }}
                                                      />
                                                    ),
                                                  }}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: `${t('addProgramme:landExtent')} ${t(
                                                        'isRequired'
                                                      )}`,
                                                    },
                                                    {
                                                      validator(rule, value) {
                                                        if (!value) {
                                                          return Promise.resolve();
                                                        }

                                                        // eslint-disable-next-line no-restricted-globals
                                                        if (isNaN(value)) {
                                                          return Promise.reject(
                                                            new Error(
                                                              'Land Extent should be an number'
                                                            )
                                                          );
                                                        }

                                                        return Promise.resolve();
                                                      },
                                                    },
                                                  ]}
                                                >
                                                  <Input size="large" addonAfter="ha" />
                                                </Form.Item>
                                                <Form.Item>
                                                  <Button
                                                    type="dashed"
                                                    onClick={() => remove(name)}
                                                    className="addMinusBtn"
                                                    icon={<MinusOutlined />}
                                                  ></Button>
                                                </Form.Item>
                                              </div>
                                            ))}
                                            <Form.Item>
                                              <Button
                                                type="dashed"
                                                onClick={() => {
                                                  add();
                                                }}
                                                size="large"
                                                className="addMinusBtn"
                                                // block
                                                icon={<PlusOutlined />}
                                              ></Button>
                                            </Form.Item>
                                          </>
                                        )}
                                      </Form.List>
                                    </>
                                  )}
                                </>
                              )}

                              {(projectCategory === 'AFFORESTATION' ||
                                projectCategory === 'REFORESTATION') && (
                                <>
                                  <Form.Item
                                    label={t('addProgramme:speciesPlanted')}
                                    name="speciesPlanted"
                                    tooltip={{
                                      title: `${t('addProgramme:landExtentAndSpeciesPlantedInfo')}`,
                                      icon: (
                                        <InfoCircleOutlined
                                          style={{ color: 'rgba(58, 53, 65, 0.5)' }}
                                        />
                                      ),
                                    }}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('addProgramme:speciesPlanted')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </>
                              )}

                              <Form.Item
                                label={t('addProgramme:projectStatus')}
                                name="projectStatus"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:projectStatus')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:projectStatusPlaceholder')}
                                >
                                  {Object.keys(PROJECT_STATUS).map((status: string) => (
                                    <Select.Option value={status}>
                                      {PROJECT_STATUS[status]}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t('addProgramme:projectStatusDescription')}
                                name={'projectStatusDescription'}
                              >
                                <Input />
                              </Form.Item>

                              <Form.Item
                                label={t('addProgramme:creditDevelopmentPurpose')}
                                name="creditDevelopmentPurpose"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:creditDevelopmentPurpose')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    'addProgramme:creditDevelopmentPurposePlaceholder'
                                  )}
                                >
                                  {Object.keys(PURPOSE_CREDIT_DEVELOPMENT).map(
                                    (purpose: string) => (
                                      <Select.Option value={purpose}>
                                        {PURPOSE_CREDIT_DEVELOPMENT[purpose]}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>
                            </div>
                          </Col>

                          <Col xl={12} md={24}>
                            <div className="details-part-two">
                              <Form.Item
                                label={t('addProgramme:projectLocation')}
                                name="projectLocation"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:projectLocation')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <GetMultipleLocationsMapComponent
                                  form={form}
                                  formItemName={'projectLocation'}
                                  disableMultipleLocations={!isMultipleLocations}
                                />
                              </Form.Item>

                              <Form.Item
                                label={t('addProgramme:startTime')}
                                name="startTime"
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
                                          `${t('addProgramme:startTime')} ${t('isRequired')}`
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

                              {projectCategory === 'RENEWABLE_ENERGY' && (
                                <Form.Item
                                  label={t('addProgramme:projectCapacity')}
                                  name="projectCapacity"
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('addProgramme:projectCapacity')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                    {
                                      validator(rule, value) {
                                        if (!value) {
                                          return Promise.resolve();
                                        }

                                        // eslint-disable-next-line no-restricted-globals
                                        // if (!Number.isInteger(Number(value))) {
                                        //   return Promise.reject(
                                        //     new Error(
                                        //       `${t(
                                        //         'addProgramme:projectCapacity'
                                        //       )} should be an integer!`
                                        //     )
                                        //   );
                                        // }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              )}

                              <Form.Item
                                label={t('addProgramme:briefProjectDescription')}
                                name="briefProjectDescription"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('addProgramme:briefProjectDescription')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <TextArea
                                  rows={4}
                                  placeholder={`${t(
                                    'addProgramme:briefProjectDescriptionPlaceholder'
                                  )}`}
                                />
                              </Form.Item>

                              <Form.Item
                                label={t('addProgramme:documentUpload')}
                                name="optionalDocuments"
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                                required={false}
                                rules={[
                                  {
                                    validator: async (rule, file) => {
                                      if (file?.length > 0) {
                                        if (
                                          !isValidateFileType(
                                            file[0]?.type,
                                            DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                          )
                                        ) {
                                          throw new Error(`${t('addProgramme:invalidFileFormat')}`);
                                        } else if (file[0]?.size > maximumImageSize) {
                                          // default size format of files would be in bytes -> 1MB = 1000000bytes
                                          throw new Error(`${t('common:maxSizeVal')}`);
                                        }
                                      }
                                    },
                                  },
                                ]}
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
                                  >
                                    Upload
                                  </Button>
                                </Upload>
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>

                        <div className="steps-actions">
                          <Button type="primary" htmlType="submit">
                            Submit
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                ),
              },
            ]}
          ></Steps>
        </div>
      </div>
    </div>
  );
};
