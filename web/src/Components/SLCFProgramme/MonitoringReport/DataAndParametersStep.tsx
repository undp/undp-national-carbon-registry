import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  Upload,
  message,
} from 'antd';
import {
  InfoCircleOutlined,
  MinusCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
// import './SLCFMonitoringReportComponent.scss';
import moment from 'moment';
import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocType } from '../../../Definitions/Enums/document.type';
import { MapSourceData } from '../../../Definitions/Definitions/mapComponent.definitions';
import { MapComponent } from '../../Maps/mapComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';

type SizeType = Parameters<typeof Form>[0]['size'];

const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
  ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
  : 5000000;

const PROVINCES_AND_DISTRICTS: { [key: string]: string[] } = {
  'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Eastern Province': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
  'Nothern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western Province': ['Kurunegala', 'Puttalam'],
  'Sabaragamuwa Province': ['Kegalle', 'Ratnapura'],
  'Southern Province': ['Galle', 'Hambanthota', 'Matara'],
  'Uva Province': ['Badulla', 'Monaragala'],
  'Western Province': ['Colombo', 'Gampaha', 'Kaluthara'],
};

const PROJECT_GEOGRAPHY: { [key: string]: string } = {
  singleLocation: 'Single Location',
  multipleLocations: 'Scattered in multiple locations',
};

const PROJECT_CATEGORIES: { [key: string]: string } = {
  renewableEnergy: 'Renewable Energy',
  afforestation: 'Afforestation',
  reforestation: 'Reforestation',
  other: 'Other',
};

const PROJECT_STATUS: { [key: string]: string } = {
  proposalStage: 'Proposal Stage',
  procurement: 'Procurement',
  construction: 'Construction',
  installation: 'Installation',
};

const PURPOSE_CREDIT_DEVELOPMENT: { [key: string]: string } = {
  track1: 'Track 1 - for trading',
  track2: 'Track 2 - for internal offsetting',
};
export const DataAndParametersStep = (props: any) => {
  const { useLocation, translator, current, form, next, prev } = props;

  const { post } = useConnection();
  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : 'Mapbox';
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const [projectLocation, setProjectLocation] = useState<any[]>([]);
  const [projectLocationMapSource, setProjectLocationMapSource] = useState<any>();
  const [projectLocationMapLayer, setProjectLocationMapLayer] = useState<any>();
  const [projectLocationMapOutlineLayer, setProjectLocationMapOutlineLayer] = useState<any>();
  const [projectLocationMapCenter, setProjectLocationMapCenter] = useState<number[]>([]);

  const getCenter = (list: any[]) => {
    let count = 0;
    let lat = 0;
    let long = 0;
    for (const l of list) {
      if (l === null || l === 'null') {
        continue;
      }
      count += 1;
      lat += l[0];
      long += l[1];
    }
    return [lat / count, long / count];
  };

  useEffect(() => {
    setProjectLocationMapCenter(
      projectLocation?.length > 0 ? getCenter(projectLocation) : [7.4924165, 5.5324032]
    );

    const mapSource: MapSourceData = {
      key: 'projectLocation',
      data: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [projectLocation],
          },
          properties: null,
        },
      },
    };

    setProjectLocationMapSource(mapSource);

    setProjectLocationMapLayer({
      id: 'projectLocation',
      type: 'fill',
      source: 'projectLocation',
      layout: {},
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.5,
      },
    });

    setProjectLocationMapOutlineLayer({
      id: 'projectLocationOutline',
      type: 'line',
      source: 'projectLocation',
      layout: {},
      paint: {
        'line-color': '#000',
        'line-width': 1,
      },
    });
  }, [projectLocation]);

  const onPolygonComplete = function (data: any) {
    if (data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates[0];
      form.setFieldValue('projectLocation', coordinates);
      setProjectLocation(coordinates);
    }
  };

  const mapComponentMemoizedValue = useMemo(() => {
    return (
      <MapComponent
        mapType={mapType}
        center={projectLocationMapCenter}
        zoom={4}
        height={250}
        style="mapbox://styles/mapbox/light-v11"
        accessToken={accessToken}
        onPolygonComplete={onPolygonComplete}
        mapSource={projectLocationMapSource}
        layer={projectLocationMapLayer}
        outlineLayer={projectLocationMapOutlineLayer}
      ></MapComponent>
    );
  }, [
    projectLocationMapCenter,
    projectLocationMapSource,
    projectLocationMapLayer,
    projectLocationMapOutlineLayer,
  ]);

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
      console.log('-------res----------', data, tempProvinces);
      setProvinces(tempProvinces);
    } catch (error) {
      console.log(error);
    }
  };

  const getDistricts = async (provinceName: string) => {
    try {
      console.log('--getting data value dis');
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
      console.log('--------- value district res--------', data);
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

  const getCities = async (division: string) => {
    try {
      const { data } = await post('national/location/division', {
        filterAnd: [
          {
            key: 'divisionName',
            operation: '=',
            value: division,
          },
        ],
      });

      const tempCities = data.map((cityData: any) => cityData.cityName);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
  }, []);

  const onProvinceSelect = async (value: any) => {
    console.log('------value dis------', value);
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
    console.log('------value geography-----', value, PROJECT_GEOGRAPHY.multipleLocations);
    if (value === PROJECT_GEOGRAPHY.multipleLocations) {
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
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="details-part-one">
                    <Form.Item
                      label={t('monitoringReport:title')}
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
                              throw new Error(`${t('monitoringReport:title')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:province')}
                      name="province"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:province')} ${t('isRequired')}}`,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        onChange={onProvinceSelect}
                        placeholder={t('monitoringReport:provincePlaceholder')}
                      >
                        {provinces.map((province: string, index: number) => (
                          <Select.Option value={province}>{province}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:district')}
                      name="district"
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
                        onSelect={onDistrictSelect}
                      >
                        {districts?.map((district: string, index: number) => (
                          <Select.Option key={district}>{district}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:dsDivision')}
                      name="dsDivision"
                      rules={
                        [
                          // {
                          //   required: true,
                          //   message: `${t('monitoringReport:dsDivision')} ${t('isRequired')}`,
                          // },
                        ]
                      }
                    >
                      <Select
                        size="large"
                        placeholder={t('monitoringReport:dsDivisionPlaceholder')}
                      >
                        {dsDivisions.map((division: string) => (
                          <Select.Option value={division}>{division}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:city')}
                      name="city"
                      rules={
                        [
                          // {
                          //   required: true,
                          //   message: `${t('monitoringReport:city')} ${t('isRequired')}`,
                          // },
                        ]
                      }
                    >
                      <Select
                        size="large"
                        placeholder={t('monitoringReport:cityPlaceholder')}
                      ></Select>
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:community')}
                      name="community"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:community')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:projectGeography')}
                      name="projectGeography"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:projectGeography')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder={t('monitoringReport:projectGeographyPlaceholder')}
                        onChange={onGeographyOfProjectSelect}
                      >
                        {Object.keys(PROJECT_GEOGRAPHY).map((geography: string) => (
                          <Select.Option value={PROJECT_GEOGRAPHY[geography]}>
                            {PROJECT_GEOGRAPHY[geography]}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Row justify="space-between">
                      <Col span={9}>
                        <Form.Item
                          label={t('monitoringReport:projectCategory')}
                          name="projectCategory"
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:projectCategory')}`,
                            },
                          ]}
                        >
                          <Select size="large" onChange={onProjectCategorySelect}>
                            {Object.keys(PROJECT_CATEGORIES).map((category: string) => (
                              <Select.Option value={PROJECT_CATEGORIES[category]}>
                                {PROJECT_CATEGORIES[category]}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      {projectCategory === 'other' && (
                        <Col span={14}>
                          <Form.Item
                            label={t('monitoringReport:otherCategory')}
                            name="otherCategory"
                          >
                            <Input size="large" />
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                    {(projectCategory === PROJECT_CATEGORIES.afforestation ||
                      projectCategory === PROJECT_CATEGORIES.reforestation) && (
                      <>
                        <Form.Item
                          label={t('monitoringReport:landExtent')}
                          name="landExtent"
                          className="landList-input"
                          tooltip={{
                            title: `${t('monitoringReport:landExtentAndSpeciesPlantedInfo')}`,
                            icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                          }}
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:landExtent')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
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
                                        label={t('monitoringReport:landExtent')}
                                        // wrapperCol={{ span: 22 }}
                                        className="landList-input"
                                        tooltip={{
                                          title: `${t(
                                            'monitoringReport:landExtentAndSpeciesPlantedInfo'
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
                                            message: `${t('monitoringReport:landExtent')} ${t(
                                              'isRequired'
                                            )}`,
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
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

                    {(projectCategory === PROJECT_CATEGORIES.afforestation ||
                      projectCategory === PROJECT_CATEGORIES.reforestation) && (
                      <>
                        <Form.Item
                          label={t('monitoringReport:speciesPlanted')}
                          name="speciesPlanted"
                          tooltip={{
                            title: `${t('monitoringReport:landExtentAndSpeciesPlantedInfo')}`,
                            icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                          }}
                          rules={[
                            {
                              required: true,
                              message: `${t('monitoringReport:speciesPlanted')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      </>
                    )}

                    <Form.Item
                      label={t('monitoringReport:projectStatus')}
                      name="projectStatus"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:projectStatus')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder={t('monitoringReport:projectStatusPlaceholder')}
                      >
                        {Object.keys(PROJECT_STATUS).map((status: string) => (
                          <Select.Option value={PROJECT_STATUS[status]}>
                            {PROJECT_STATUS[status]}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:creditDevelopmentPurpose')}
                      name="creditDevelopmentPurpose"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:creditDevelopmentPurpose')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder={t('monitoringReport:creditDevelopmentPurposePlaceholder')}
                      >
                        {Object.keys(PURPOSE_CREDIT_DEVELOPMENT).map((purpose: string) => (
                          <Select.Option value={PURPOSE_CREDIT_DEVELOPMENT[purpose]}>
                            {PURPOSE_CREDIT_DEVELOPMENT[purpose]}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="details-part-two">
                    <Form.Item
                      label={t('monitoringReport:projectLocation')}
                      name="projectLocation"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:projectLocation')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      {mapComponentMemoizedValue}
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:startTime')}
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
                                `${t('monitoringReport:startTime')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:projectCapacity')}
                      name="projectCapacity"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:projectCapacity')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:briefProjectDescription')}
                      name="briefProjectDescription"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:briefProjectDescription')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${t('monitoringReport:briefProjectDescriptionPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:documentUpload')}
                      name="document"
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
                                throw new Error(`${t('monitoringReport:invalidFileFormat')}`);
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
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
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
