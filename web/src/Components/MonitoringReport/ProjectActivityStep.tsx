import { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select, Upload } from 'antd';
import PhoneInput, {
  Country,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';
import moment from 'moment';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import GetLocationMapComponent from '../Maps/GetLocationMapComponent';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';
import { API_PATHS } from '../../Config/apiConfig';
import { CustomStepsProps } from '../MonitoringReport/StepProps';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';

export const ProjectActivityStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;

  const { post } = useConnection();
  // const [contactNoInput] = useState<any>();
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ [key: number]: string[] }>({});
  // const [dsDivisions, setDsDivisions] = useState<{ [key: number]: string[] }>({});
  const [cities, setCities] = useState<{ [key: number]: string[] }>({});
  const [locationData, setLocationData] = useState<any[]>([]);

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
      const { data } = await post(API_PATHS.PROVINCES);
      const tempProvinces = data.map((provinceData: any) => provinceData.provinceName);
      setProvinces(tempProvinces);
    } catch (error) {
      console.log(error);
    }
  };

  const getDistricts = async (provinceName: string, index: number) => {
    try {
      const { data } = await post(API_PATHS.DISTRICTS, {
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

  const getCities = async (districtName: string, index: number) => {
    try {
      const { data } = await post(API_PATHS.CITIES, {
        filterAnd: [
          {
            key: 'districtName',
            operation: '=',
            value: districtName,
          },
        ],
      });
      console.log({ data });
      const tempCities = data.map((cityData: any) => cityData.cityName);
      setCities((prev3) => ({ ...prev3, [index]: tempCities }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
  }, [form]);

  const onProvinceSelect = async (value: any, index: number) => {
    getDistricts(value, index);
  };

  const onDistrictSelect = (value: string, index: number) => {
    getCities(value, index);
  };

  const onFinish = async (values: any) => {
    // console.log('onFinish triggered');
    // console.log('-----------temp Values before-------');

    // const firstObj = {
    //   locationOfProjectActivity: values?.locationOfProjectActivity,
    //   siteNo: values?.pa_siteNo,
    //   province: values?.province,
    //   district: values?.district,
    //   city: values?.pa_city,
    //   community: values?.community,
    //   geographicalLocationCoordinates: values?.location,
    //   uploadImages: await async function () {
    //     const base64Docs: string[] = [];

    //     if (values?.optionalImages && values?.optionalImages.length > 0) {
    //       const docs = values.optionalImages;
    //       for (let i = 0; i < docs.length; i++) {
    //         if (docs[i]?.originFileObj === undefined) {
    //           base64Docs.push(docs[i]?.url);
    //         } else {
    //           const temp = await getBase64(docs[i]?.originFileObj as RcFile);
    //           base64Docs.push(temp); // No need for Promise.resolve
    //         }
    //       }
    //     }

    //     return base64Docs;
    //   },
    // };
    // tempList.push(firstObj);
    // console.log(firstObj);

    const locationDetailsOfProjectActivity = await (async function () {
      const tempList: any[] = [];

      if (values?.extraLocations) {
        for (const item of values.extraLocations) {
          const tempObj = {
            locationOfProjectActivity: item.locationOfProjectActivity, // Use item, not values
            siteNo: item.siteNo,
            province: item.province,
            district: item.district,
            city: item.city,
            community: item.community,
            geographicalLocationCoordinates: item.geographicalLocationCoordinates, // Use item, not values
            pa_uploadImages: await fileUploadValueExtract(item?.pa_uploadImages, 'pa_uploadImages'),
          };
          tempList.push(tempObj);
        }
      }
      // console.log('Final tempList:', tempList);
      return tempList;
    })();

    const tempValues: any = {
      projectActivityDetails: {
        pa_monitoringPurpose: values?.pa_monitoringPurpose,
        locationOfProjectActivity: locationDetailsOfProjectActivity,
        projectParticipants: values?.projectParticipants,
        pa_methodology: values?.pa_methodology,
        pa_creditingPeriodType: values?.pa_creditingPeriodType,
        pa_projectCreditingPeriod: moment(values?.pa_projectCreditingPeriod).startOf('day').unix(),
        pa_projectCreditingPeriodEndDate: moment(values?.pa_projectCreditingPeriodEndDate)
          .startOf('day')
          .unix(),
      },
    };
    console.log(tempValues);
    handleValuesUpdate(tempValues);
  };

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
              // disabled={FormMode.VIEW === formMode}
              initialValues={{}}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  {/* <div className="step-form-left-col"> */}
                  <Form.Item
                    label={`${t('monitoringReport:pa_monitoringPurpose')}`}
                    name="pa_monitoringPurpose"
                    rules={[
                      {
                        required: true,
                        message: `${t('monitoringReport:pa_monitoringPurpose')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      disabled={disableFields}
                      rows={6}
                      // placeholder={`${t('monitoringReport:pa_monitoringObjectivePlaceholder')}`}
                    />
                  </Form.Item>

                  <h3 className="form-section-title">{`${t(
                    'monitoringReport:projectActivityLocation'
                  )}`}</h3>

                  {/* ----------------------handle dynamic fields  ---------------------------*/}
                  <Form.List name="extraLocations">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <div className="form-list-actions">
                              <h4 className="list-item-title">Location {name + 1}</h4>
                              <Form.Item>
                                <Button
                                  // type="dashed"
                                  onClick={() => {
                                    remove(name);
                                    if (districts[name + 1]) {
                                      delete districts[name + 1];
                                    }
                                    // if (dsDivisions[name + 1]) {
                                    //   delete dsDivisions[name + 1];
                                    // }
                                    if (cities[name + 1]) {
                                      delete cities[name + 1];
                                    }
                                  }}
                                  size="large"
                                  className="addMinusBtn"
                                  // block
                                  disabled={true}
                                  icon={<MinusOutlined />}
                                >
                                  {/* Remove Entity */}
                                </Button>
                              </Form.Item>
                            </div>

                            <Row
                              justify={'space-between'}
                              gutter={[40, 16]}
                              style={{ borderRadius: '8px' }}
                              className="form-section"
                            >
                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('monitoringReport:locationOfProjectActivity')}
                                  name={[name, 'locationOfProjectActivity']}
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
                                            `${t('monitoringReport:locationOfProjectActivity')} ${t(
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
                                  label={t('monitoringReport:pa_siteNo')}
                                  name={[name, 'siteNo']}
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
                                            `${t('PDD:pa_siteNo')} ${t('isRequired')}`
                                          );
                                        }
                                      },
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
                                            `${t('monitoringReport:province')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={(value) => onProvinceSelect(value, name + 1)}
                                    // placeholder={t('PDD:provincePlaceholder')}
                                    disabled
                                  >
                                    {provinces.map((province: string, index: number) => (
                                      <Select.Option value={province} key={name + province + index}>
                                        {province}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t('monitoringReport:district')}
                                  name={[name, 'district']}
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
                                            `${t('monitoringReport:district')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('PDD:districtPlaceholder')}
                                    onSelect={(value) => onDistrictSelect(value, name + 1)}
                                    disabled
                                  >
                                    {districts[name + 1]?.map((district: string, index: number) => (
                                      <Select.Option key={name + district + index} value={district}>
                                        {district}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t('monitoringReport:pa_city')}
                                  name={[name, 'city']}
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
                                            `${t('monitoringReport:pa_city')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('PDD:cityPlaceholder')}
                                    disabled
                                  >
                                    {cities[name + 1]?.map((city: string, index: number) => (
                                      <Select.Option value={city} key={name + city + index}>
                                        {city}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('monitoringReport:community')}
                                  name={[name, 'community']}
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
                                            `${t('monitoringReport:community')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('monitoringReport:setLocation')}
                                  name={[name, 'geographicalLocationCoordinates']}
                                  // rules={[
                                  //   {
                                  //     required: true,
                                  //     message: ``,
                                  //   },
                                  //   {
                                  //     validator: async (rule, value) => {
                                  //       if (
                                  //         String(value).trim() === '' ||
                                  //         String(value).trim() === undefined ||
                                  //         value === null ||
                                  //         value === undefined
                                  //       ) {
                                  //         throw new Error(
                                  //           `${t('monitoringReport:setLocation')} ${t(
                                  //             'isRequired'
                                  //           )}`
                                  //         );
                                  //       }
                                  //     },
                                  //   },
                                  // ]}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, 'geographicalLocationCoordinates']}
                                    listName="locationsDetails"
                                    disabled={true}
                                    existingCordinate={
                                      form?.getFieldValue('extraLocations')[name]
                                        ?.geographicalLocationCoordinates
                                    }
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t('monitoringReport:pa_uploadImages')}
                                  name={[name, 'uploadImages']}
                                  valuePropName="fileList"
                                  getValueFromEvent={normFile}
                                  required={false}
                                  rules={[
                                    {
                                      validator: async (rule, file) => {
                                        if (file?.length > 0) {
                                          if (file[0]?.size > maximumImageSize) {
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
                                    disabled={true}
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
                              disabled={true}
                            >
                              {/* Add Entity */}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                  {/* </div> */}
                </Col>
              </Row>

              {/* project participant table start */}

              <h3 className="form-section-title">
                {`${t('monitoringReport:pa_partiesAndProjectParticipants')}`}
              </h3>

              <div className="projectParticipantsTable">
                <div className="header">
                  <div className="col-1">{t('monitoringReport:pa_partiesInvolved')}</div>
                  <div className="col-2">{t('monitoringReport:pa_projectParticipants')}</div>
                </div>

                <div className="data-body">
                  <Form.List name="projectParticipants">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restFields }) => (
                          <div className="row" key={key}>
                            <div className="col-1">
                              <Form.Item
                                name={[name, 'partiesInvolved']}
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
                                          `${t('monitoringReport:pa_partiesInvolved')} ${t(
                                            'isRequired'
                                          )}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input disabled />
                              </Form.Item>
                            </div>
                            <div className="col-2">
                              <Form.List name={[name, 'projectParticipants']}>
                                {(
                                  fields2,
                                  { add: addParticipants, remove: removeParticipants }
                                ) => (
                                  <div key={key + name} className="participant-row">
                                    {fields2.map(({ key: key2, name: name2 }) => (
                                      <div className="participant-col">
                                        <Form.Item
                                          name={[name2, 'participant']}
                                          className="participant-form-item"
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
                                                    `${t(
                                                      'monitoringReport:pa_projectParticipants'
                                                    )} ${t('isRequired')}`
                                                  );
                                                }
                                              },
                                            },
                                          ]}
                                        >
                                          <Input disabled />
                                        </Form.Item>

                                        <Form.Item>
                                          <Button
                                            // type="dashed"
                                            onClick={() => {
                                              addParticipants();
                                            }}
                                            size="large"
                                            className="addMinusBtn"
                                            // block
                                            icon={<PlusOutlined />}
                                            disabled
                                          >
                                            {/* Add Participant */}
                                          </Button>
                                        </Form.Item>

                                        {key2 !== 0 && (
                                          <Form.Item>
                                            <Button
                                              // type="dashed"
                                              onClick={() => {
                                                removeParticipants(name2);
                                              }}
                                              size="large"
                                              className="addMinusBtn"
                                              // block
                                              icon={<MinusOutlined />}
                                              disabled={disableFields}
                                            >
                                              {/* Minus Participant */}
                                            </Button>
                                          </Form.Item>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </Form.List>
                            </div>
                          </div>
                        ))}

                        <div className="btn">
                          <Form.Item>
                            <Button
                              disabled
                              onClick={() => {
                                // add();
                                const temp = form.getFieldValue('projectParticipants');
                                console.log('---------temp--------', temp);
                                temp[fields.length] = {
                                  partiesInvolved: '',
                                  projectParticipants: [{ participant: '' }],
                                };
                                console.log('---------temp after--------', temp);
                                form.setFieldValue('projectParticipants', temp);
                              }}
                            >
                              {t('monitoringReport:pa_addProjectParticipant')}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                  <Form.List name="projectParticipants">
                    {(fields, { add, remove }) => (
                      <>
                        <>{console.log('fields', fields[0])}</>
                        {fields.map(({ key, name, ...restField }) => {
                          <div>
                            123
                            <div className="col-1">
                              a
                              <Form.Item
                                name={[name, 'partiesInvolved']}
                                rules={[
                                  {
                                    validator: async (rule, value) => {
                                      if (
                                        String(value).trim() === '' ||
                                        String(value).trim() === undefined ||
                                        value === null ||
                                        value === undefined
                                      ) {
                                        throw new Error(
                                          `${t('PDD:partiesInvolved')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </div>
                            <div className="col-2">
                              b
                              <Form.Item
                                name={[name, 'projectParticipant']}
                                rules={[
                                  {
                                    validator: async (rule, value) => {
                                      if (
                                        String(value).trim() === '' ||
                                        String(value).trim() === undefined ||
                                        value === null ||
                                        value === undefined
                                      ) {
                                        throw new Error(
                                          `${t('PDD:projectParticipant')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </div>
                            <button onClick={add}>+</button>
                          </div>;
                        })}
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
              {/* project participant table end */}

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:pa_methodology')}
                      name="pa_methodology"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_methodology')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>
                  </div>
                  <LabelWithTooltip
                    label={t('monitoringReport:pa_projectCreditingPeriod')}
                    required={true}
                  />
                  <Row gutter={[40, 16]} justify={'space-between'} align={'stretch'}>
                    <Col md={11} xl={11}>
                      <Form.Item
                        // label={`${t('PDD:pa_projectCreditingStartDate')}`}
                        name="pa_projectCreditingPeriod"
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
                                  `${t('monitoringReport:pa_projectCreditingPeriod')} ${t(
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
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                          disabled={disableFields}
                          // onChange={() => updateCreditingPeriodDuration()}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      <p className="to-margin">to</p>
                    </Col>
                    <Col md={11} xl={11}>
                      <Form.Item
                        // label={`${t('monitoringReport:pa_projectCreditingPeriodEndDate')}`}
                        name="pa_projectCreditingPeriodEndDate"
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
                                  `${t('monitoringReport:pa_projectCreditingPeriodEndDate')} ${t(
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
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                          disabled={disableFields}
                          // onChange={() => updateCreditingPeriodDuration()}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:pa_creditingPeriodType')}
                      name="pa_creditingPeriodType"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_creditingPeriodType')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
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
