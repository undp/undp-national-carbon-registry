import React, { useEffect, useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, DatePicker, Input, Radio, Upload, Select } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';
import validator from 'validator';
import { ProcessSteps } from './ValidationStepperComponent';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';
import GetLocationMapComponent from '../Maps/GetLocationMapComponent';
import { API_PATHS } from '../../Config/apiConfig';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useLocation } from 'react-router-dom';

// import { Form } from 'react-router-dom';

const BasicInformation = (props: ValidationStepsProps) => {
  const {
    next,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    cmaDetails,
    existingFormValues,
    // formMode,
    disableFields,
    prev,
  } = props;

  const { post } = useConnection();

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const [contactNoInput] = useState<any>();

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ [key: number]: string[] }>({});
  // const [dsDivisions, setDsDivisions] = useState<{ [key: number]: string[] }>({});
  const [cities, setCities] = useState<{ [key: number]: string[] }>({});

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

  const getCities = async (division: string, index: number) => {
    try {
      const { data } = await post(API_PATHS.CITIES, {
        filterAnd: [
          {
            key: 'districtName',
            operation: '=',
            value: division,
          },
        ],
      });

      const tempCities = data.map((cityData: any) => cityData.cityName);
      setCities((prev3) => ({ ...prev3, [index]: tempCities }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProvinces();
  }, []);

  const onProvinceSelect = async (value: any, index: number) => {
    getDistricts(value, index);
  };

  const onDistrictSelect = (value: string, index: number) => {
    // getDivisions(value, index);
    getCities(value, index);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    const approverSignature = (await fileUploadValueExtract(values, 'approverSignature'))[0];
    const projectDetailsFormValues = {
      ...values,
      completionDate: moment(values?.completionDate).startOf('day').unix(),
      pddUploadedGlobalStakeholderConsultation: moment(
        values?.pddUploadedGlobalStakeholderConsultation
      )
        .startOf('day')
        .unix(),
      approverSignature: approverSignature,
      locationsOfProjectActivity: await (async function () {
        const tempList: any[] = [];
        if (values?.extraLocations) {
          values?.extraLocations.forEach(async (item: any) => {
            const tempObj = {
              locationOfProjectActivity: item?.locationOfProjectActivity,
              siteNo: item?.siteNo,
              province: item?.province,
              district: item?.district,
              // dsDivision: item?.dsDivision,
              city: item?.city,
              community: item?.community,
              geographicalLocationCoordinates: item?.geographicalLocationCoordinates,
              additionalDocuments: await (async function () {
                const base64Docs: string[] = [];

                if (item?.optionalImages && item?.optionalImages.length > 0) {
                  const docs = item.optionalImages;
                  for (let i = 0; i < docs.length; i++) {
                    if (docs[i]?.originFileObj === undefined) {
                      base64Docs.push(docs[i]?.url);
                    } else {
                      const temp = await getBase64(docs[i]?.originFileObj as RcFile);
                      base64Docs.push(temp); // No need for Promise.resolve
                    }
                  }
                }

                return base64Docs;
              })(),
            };

            tempList.push(tempObj);
          });
        }
        return tempList;
      })(),
      dateOfIssue: moment(values?.dateOfIssue).valueOf(),
      versionNumberPDD: values?.versionNumberPDD,
      versionNumberValidationReport: values?.versionNumberValidationReport,
      versionDate: moment(values?.versionDate).valueOf(),
      unfccRefNo: values?.unfccRefNo,
      telephone: values?.telephone,
      website: values?.website,
      mandatarySectoralScopes: values?.mandatarySectoralScopes,
      annualAverageGHGReduction: values?.annualAverageGHGReduction,
      approverName: values?.approverName,
      creditingPeriodStart: moment(values?.creditingPeriodStart).startOf('day').unix(),
      creditingPeriodEnd: moment(values?.creditingPeriodEnd).startOf('day').unix(),
    };

    console.log('basicInformation', projectDetailsFormValues);

    handleValuesUpdate({
      // [ProcessSteps.VR_PROJECT_DETAILS]: projectDetailsFormValues
      basicInformation: projectDetailsFormValues,
    });
  };

  return (
    <>
      {current === 0 && (
        <div>
          <div className="val-report-step-form-container">
            <Form
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
              // disabled={FormMode.VIEW === formMode}
            >
              <>
                <div className="mg-top-1">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('validationReport:titleOfTheProjectActivity')}
                          name="titleOfTheProjectActivity"
                          rules={[
                            {
                              required: false,
                              message: `${t('validationReport:titleOfTheProjectActivity')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:versionNumberValidationReport')}
                          name="versionNumberValidationReport"
                          rules={[
                            {
                              required: false,
                              message: `${t('validationReport:versionNumberValidationReport')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:versionNumberPDD')}
                          name="versionNumberPDD"
                          rules={[
                            {
                              required: false,
                              message: `${t('validationReport:versionNumberPDD')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:projectParticipants')}
                          name="projectDeveloper"
                          rules={[
                            {
                              required: false,
                              message: `${t('validationReport:projectParticipants')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:projectScale')}
                          name="projectScale"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:projectScale')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Radio.Group
                            className="project-scale-radio-btns"
                            disabled={disableFields}
                          >
                            <Radio value="Small Scale">{t('validationReport:smallScale')}</Radio>
                            <Radio value="Large Scale">{t('validationReport:largeScale')}</Radio>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:appliedMethodologies')}
                          name="appliedMethodologies"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:appliedMethodologies')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" disabled={disableFields} />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:conditionalSectoralScopes')}
                          name="conditionalSectoralScopes"
                        >
                          <Input size="large" disabled={disableFields} />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('validationReport:titleOfSpecificCase')}
                        name="titleOfSpecificCase"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:titleOfSpecificCase')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:completionDate')}
                        name="completionDate"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:completionDate')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker
                          disabled={disableFields}
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:pddUploadedGlobalStakeholderConsultation')}
                        name="pddUploadedGlobalStakeholderConsultation"
                        rules={[
                          {
                            required: true,
                            message: `${t(
                              'validationReport:pddUploadedGlobalStakeholderConsultation'
                            )} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:hostParty')}
                        name="hostParty"
                        rules={[
                          {
                            required: false,
                            message: `${t('validationReport:hostParty')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:mandatarySectoralScopes')}
                        name="mandatarySectoralScopes"
                        rules={[
                          {
                            required: false,
                            message: `${t('validationReport:mandatarySectoralScopes')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span>
                            {t('validationReport:annualAverageGHGReduction')}
                            <span
                              style={{
                                color: '#FF4D4F',
                                marginLeft: 2,
                                fontSize: '16px',
                                position: 'relative',
                                top: '3px',
                              }}
                            >
                              *
                            </span>
                          </span>
                        }
                        name="annualAverageGHGReduction"
                        required={false}
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:annualAverageGHGReduction')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:unfccRefNo')}
                        name="unfccRefNo"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:unfccRefNo')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              {/* Crediting Period  start */}
              <>
                <Row gutter={[40, 16]} justify={'space-between'}>
                  <Col md={24} xl={12}>
                    <Form.Item
                      label={t('validationReport:creditingPeriod')}
                      name="creditingPeriod"
                      rules={[
                        {
                          required: false,
                          message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                  </Col>

                  <Col md={24} xl={12}>
                    <LabelWithTooltip
                      label={t('validationReport:startDateofCreditingPeriod')}
                      required={false}
                    />
                    <div className="crediting-period-duration">
                      <Form.Item
                        // label={t('validationReport:creditingPeriod')}
                        name="creditingPeriodStart"
                        rules={[
                          {
                            required: false,
                            message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker size="large" disabled />
                      </Form.Item>
                      <p className="crediting-period-duration-to">to</p>
                      <Form.Item
                        // label={t('validationReport:creditingPeriod')}
                        name="creditingPeriodEnd"
                        rules={[
                          {
                            required: false,
                            message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker size="large" disabled />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>
              </>
              {/* Crediting Period  end */}

              <>
                <h4 className="form-section-heading">{`${t(
                  'validationReport:projectActivityLocations'
                )}`}</h4>

                <h4 className="list-item-title">Location 1</h4>
                <div className="form-section">
                  <h4 className="form-section-title">{`${t(
                    'validationReport:locationOfProjectActivity'
                  )}`}</h4>

                  <Row
                    // justify={'space-between'}
                    gutter={[40, 16]}
                    style={{ borderRadius: '8px' }}
                  >
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('validationReport:locationOfProjectActivity')}
                        name="locationOfProjectActivity"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:locationOfProjectActivity')} ${t(
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
                        label={t('validationReport:siteNo')}
                        name="siteNo"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:siteNo')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:province')}
                        name="province"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:province')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          disabled
                          onChange={(value) => onProvinceSelect(value, 0)}
                          // placeholder={t('validationReport:provincePlaceholder')}
                          // disabled={disableFields}
                        >
                          {provinces.map((province: string, index: number) => (
                            <Select.Option value={province} key={province + index}>
                              {province}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:district')}
                        name="district"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:district')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          disabled
                          // placeholder={t('validationReport:districtPlaceholder')}
                          onSelect={(value) => onDistrictSelect(value, 0)}
                          // disabled={disableFields}
                        >
                          {districts[0]?.map((district: string, index: number) => (
                            <Select.Option key={district + index} value={district}>
                              {district}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      {/* <Form.Item
                        label={t('validationReport:dsDivision')}
                        name="dsDivision"
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
                                throw new Error(`${t('validationReport:dsDivision')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('validationReport:dsDivisionPlaceholder')}
                          disabled={disableFields}
                          onSelect={(value) => onDivisionSelect(value, 0)}
                        >
                          {dsDivisions[0]?.map((division: string, index: number) => (
                            <Select.Option value={division} key={division + index}>
                              {division}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item> */}
                      <Form.Item
                        label={t('validationReport:city')}
                        name="city"
                        rules={[
                          {
                            required: false,
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
                                throw new Error(`${t('validationReport:city')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          // placeholder={t('validationReport:cityPlaceholder')}
                          disabled
                        >
                          {cities[0]?.map((city: string, index) => (
                            <Select.Option value={city} key={city + index}>
                              {city}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('validationReport:community')}
                        name="community"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:community')} ${t('isRequired')}`
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
                        label={t('validationReport:setLocation')}
                        name="geographicalLocationCoordinates"
                        rules={[
                          {
                            required: false,
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
                                  `${t('validationReport:location')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <GetLocationMapComponent
                          form={form}
                          formItemName={'geographicalLocationCoordinates'}
                          existingCordinate={form.getFieldValue('geographicalLocationCoordinates')}
                          disabled
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('validationReport:uploadImages')}
                        name="optionalImages"
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
                            disabled={true}
                          >
                            {t('validationReport:upload')}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Form.List name="extraLocations">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <>
                          <div className="form-list-actions">
                            <h4 className="list-item-title">Location {name + 2}</h4>
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
                                disabled
                                icon={<MinusOutlined />}
                              >
                                {/* Remove Entity */}
                              </Button>
                            </Form.Item>
                          </div>
                          <div className="form-section">
                            <h4 className="form-section-title">
                              {`${t('validationReport:locationOfProjectActivity')}`}
                            </h4>
                            <Row
                              justify={'space-between'}
                              gutter={[40, 16]}
                              style={{ borderRadius: '8px' }}
                            >
                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('validationReport:locationOfProjectActivity')}
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
                                            `${t('validationReport:locationOfProjectActivity')} ${t(
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
                                  label={t('validationReport:siteNo')}
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
                                            `${t('validationReport:siteNo')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled />
                                </Form.Item>

                                <Form.Item
                                  label={t('validationReport:province')}
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
                                            `${t('validationReport:province')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={(value) => onProvinceSelect(value, name + 1)}
                                    // placeholder={t('validationReport:provincePlaceholder')}
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
                                  label={t('validationReport:district')}
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
                                            `${t('validationReport:district')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('validationReport:districtPlaceholder')}
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
                                {/* <Form.Item
                                  label={t('validationReport:dsDivision')}
                                  name={[name, 'dsDivision']}
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
                                            `${t('validationReport:dsDivision')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('validationReport:dsDivisionPlaceholder')}
                                    disabled={disableFields}
                                    onSelect={(value) => onDivisionSelect(value, name + 1)}
                                  >
                                    {dsDivisions[name + 1]?.map(
                                      (division: string, index: number) => (
                                        <Select.Option
                                          value={division}
                                          key={name + division + index}
                                        >
                                          {division}
                                        </Select.Option>
                                      )
                                    )}
                                  </Select>
                                </Form.Item> */}
                                <Form.Item
                                  label={t('validationReport:city')}
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
                                            `${t('validationReport:city')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('validationReport:cityPlaceholder')}
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
                                  label={t('validationReport:community')}
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
                                            `${t('validationReport:community')} ${t('isRequired')}`
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
                                  label={t('validationReport:setLocation')}
                                  name={[name, 'geographicalLocationCoordinates']}
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
                                            `${t('validationReport:location')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, 'geographicalLocationCoordinates']}
                                    listName="extraLocations"
                                    disabled
                                    existingCordinate={
                                      form?.getFieldValue('extraLocations')[name]
                                        ?.geographicalLocationCoordinates
                                    }
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t('validationReport:uploadImages')}
                                  name={[name, 'optionalImages']}
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
                                    disabled
                                    // maxCount={1}
                                  >
                                    <Button
                                      className="upload-doc"
                                      size="large"
                                      icon={<UploadOutlined />}
                                      // disabled={disableFields}
                                    >
                                      Upload
                                    </Button>
                                  </Upload>
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        </>
                      ))}

                      {/* <div className="form-list-actions">
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
                            disabled={disableFields}
                          >
                            Add Entity
                          </Button>
                        </Form.Item>
                      </div> */}
                    </>
                  )}
                </Form.List>
              </>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} disabled={false} onClick={prev}>
                  {t('validationReport:cancel')}
                </Button>
                {disableFields ? (
                  <Button type="primary" size={'large'} disabled={false} onClick={next}>
                    {t('validationReport:next')}
                  </Button>
                ) : (
                  <Button type="primary" size={'large'} disabled={false} htmlType="submit">
                    {t('validationReport:next')}
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

export default BasicInformation;
