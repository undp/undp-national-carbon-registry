import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  StepProps,
  Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  InfoCircleFilled,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import TextArea from 'antd/lib/input/TextArea';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
  Country,
} from 'react-phone-number-input';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import GetLocationMapComponent from '../Maps/GetLocationMapComponent';
import moment from 'moment';
import { DocType } from '../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { Telephone } from 'react-bootstrap-icons';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { PURPOSE_CREDIT_DEVELOPMENT } from '../SLCFProgramme/AddNewProgramme/SLCFProgrammeCreationComponent';
import { CustomStepsProps } from '../CMAForm/StepProps';
import { ProcessSteps } from './ValidationStepperComponent';
import { requiredValidationRule } from '../../Utils/validationHelper';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

const ValicationReportGHGDescriptionOfProjectActivity = (props: CustomStepsProps) => {
  const { next, prev, form, current, t, countries, handleValuesUpdate, formMode } = props;

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const [contactNoInput] = useState<any>();

  const { post } = useConnection();

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
      // const { data } = await post('national/location/city', {
      //   filterAnd: [
      //     {
      //       key: 'divisionName',
      //       operation: '=',
      //       value: division,
      //     },
      //   ],
      // });
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
    // form.setFieldValue('totalCreditingYears', 1)
    form.setFieldValue('totalEstimatedGHGERs', 0);
  }, []);

  const onProvinceSelect = async (value: any) => {
    getDistricts(value);
    try {
    } catch (error) {}
  };

  const onDistrictSelect = (value: string) => {
    getDivisions(value);
  };

  const projectScopeList = [
    {
      id: 'isProjectScopeEnergyIndustries',
      label: t('validationReport:energyIndustry'),
    },
    {
      id: 'isProjectScopeEnergyDistribution',
      label: t('validationReport:entergyDistribution'),
    },
    {
      id: 'isProjectScopeEnergyDemand',
      label: t('validationReport:energyDemand'),
    },
    {
      id: 'isProjectScopeManufacturingIndustries',
      label: t('validationReport:manufacturingIndustry'),
    },
    {
      id: 'isProjectScopeChemicalIndustries',
      label: t('validationReport:chemicalIndustries'),
    },
    {
      id: 'isProjectScopeChemicalIndustry',
      label: t('validationReport:chemicalIndustry'),
    },
    {
      id: 'isProjectScopeConstruction',
      label: t('validationReport:construction'),
    },
    {
      id: 'isProjectScopeTransport',
      label: t('validationReport:transport'),
    },
    {
      id: 'isProjectScopeMining',
      label: t('validationReport:miningMineralProduction'),
    },
    {
      id: 'isProjectScopeFugitiveEmissionsFromFuel',
      label: t('validationReport:fugitiveEmissionsFromProduction'),
    },
    {
      id: 'isProjectScopeFugitiveEmissionsFromHalocarbons',
      label: t('validationReport:fugitiveEmissionsHexafluoride'),
    },
    {
      id: 'isProjectScopeSolventsUse',
      label: t('validationReport:solventsUse'),
    },
    {
      id: 'isProjectScopeWasteHandling',
      label: t('validationReport:wasteHandlingDisposal'),
    },
    {
      id: 'isProjectScopeAfforestation',
      label: t('validationReport:afforestationandReforestation'),
    },
    {
      id: 'isProjectScopeAgriculture',
      label: t('validationReport:agriculture'),
    },
  ];

  const calculateAvgAnnualERs = () => {
    const totalEstimatedGHGERs = form.getFieldValue('totalEstimatedGHGERs') || 0;
    const totalCreditingYears = form.getFieldValue('totalCreditingYears') || 0;
    if (Number(totalCreditingYears) === 0 || Number(totalEstimatedGHGERs) === 0) {
      return;
    } else {
      const avg = Number(totalEstimatedGHGERs) / Number(totalCreditingYears);
      form.setFieldValue('avgAnnualERs', avg);
    }
  };

  const onEmissionsYearChange = (value: any, fieldCounts: number) => {
    let totalCreditingYears = form.getFieldValue('totalCreditingYears') || 0;
    if (value && totalCreditingYears < fieldCounts) {
      totalCreditingYears += 1;
    } else if (value === null && totalCreditingYears !== 0) {
      totalCreditingYears -= 1;
    }
    form.setFieldValue('totalCreditingYears', totalCreditingYears);
    calculateAvgAnnualERs();
  };

  const onEmissionsValueChange = (value?: any) => {
    const val1 = form.getFieldValue('estimatedAnnualGHGEmissionsValue') || 0;
    const listVals = form.getFieldValue('extraGHGEmmissions');
    let tempTotal = Number(val1);
    console.log('-------em vals change------', val1, listVals);
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        tempTotal += Number(item?.estimatedAnnualGHGEmissionsValue);
      });
    }
    form.setFieldValue('totalEstimatedGHGERs', String(tempTotal));
    calculateAvgAnnualERs();
  };

  const getExistingCordinate = (locationIndex: number) => {
    const locationList = form.getFieldValue('locationsOfProjectActivity');
    if (locationList[locationIndex] && locationList[locationIndex].geographicalLocationCoordinates)
      return locationList[locationIndex].geographicalLocationCoordinates;

    return null;
  };

  const getLocationDetails = async (values: any) => {
    const locationList = [];

    for (let c = 0; c < values.locationsOfProjectActivity.length; c++) {
      const activity = values.locationsOfProjectActivity[c];

      const technicalProjDesc = activity.technicalProjectDescriptionItems.map(
        (tecProjDesc: any) => {
          return {
            item: tecProjDesc.item,
            parameterValue: tecProjDesc.parameterValue,
          };
        }
      );
      let files: any[] = [];

      if (activity?.additionalDocuments.length > 0) {
        files = await fileUploadValueExtract(activity, 'additionalDocuments');
      }

      locationList.push({
        locationOfProjectActivity: activity.locationOfProjectActivity,
        province: activity.province,
        district: activity.district,
        dsDivision: activity.dsDivision,
        city: activity.city,
        community: activity.community,
        geographicalLocationCoordinates: [[activity.geographicalLocationCoordinates]],
        additionalDocuments: files,
        technicalProjectDescription: technicalProjDesc,
      });
    }

    return locationList;
  };

  const onFinish = async (values: any) => {
    const projectScopeUNFCC: any = {};
    const formProjectScopeValues = form.getFieldValue('projectScopeUNFCC');

    projectScopeList.forEach((scopeList) => {
      projectScopeUNFCC[scopeList.id] = formProjectScopeValues?.some(
        (val: any) => val === scopeList.id
      );
    });

    const ghgDescriptionFormValues: any = {
      projectTitle: values?.projectTitle,
      projectSize: values?.projectSize,
      ...projectScopeUNFCC,
      appliedMethodology: values?.appliedMethodology,
      technicalAreas: values?.technicalAreas,
      creditingPeriod: values?.creditingPeriod,
      locationsOfProjectActivity: await getLocationDetails(values),
      startDateCreditingPeriod: moment(values?.startDateofCreditingPeriod).valueOf(),
    };
    console.log(ProcessSteps.VR_GHG_PROJECT_DESCRIPTION, ghgDescriptionFormValues);
    handleValuesUpdate({ [ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]: ghgDescriptionFormValues });
  };
  return (
    <>
      {current === 2 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              validateTrigger={false}
              initialValues={{
                locationsOfProjectActivity: [],
                technicalProjectDescriptions: [{}],
              }}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
              disabled={FormMode.VIEW === formMode}
            >
              <h4 className="form-section-title">{`2.1 ${t(
                'validationReport:projectCharacteristics'
              )}`}</h4>
              <div className="form-section">
                <Row gutter={[96, 8]}>
                  <Col md={12} lg={12}>
                    <Form.Item
                      className="full-width-form-item"
                      label={`${t('validationReport:projectTitle')}`}
                      name="projectTitle"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:projectTitle')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  <Col md={12} lg={12}>
                    <Form.Item
                      className="full-width-form-item"
                      label={`${t('validationReport:projectSize')}`}
                      name="projectSize"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:projectSize')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Radio.Group style={{ justifyContent: 'flex-start' }}>
                        <Radio value={'SMALL'}>
                          {t('validationReport:smallScaleBundleProject')}
                        </Radio>
                        <Radio value={'LARGE'}>{t('validationReport:largeScale')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[8, 16]}>
                  <Col span={6}>
                    <div>{t('validationReport:projectScopeUNFCC')}</div>
                    <div>{t('validationReport:projectScopeUNFCCt2')}</div>
                  </Col>
                  <Col span={18}>
                    <Form.Item name="projectScopeUNFCC">
                      <Checkbox.Group className="full-width-form-item">
                        {projectScopeList.map((scopeListItem: any, index: number) => {
                          return (
                            <Col span={24}>
                              <div className="side-by-side-form-item full-width-form-item">
                                <span>{`${index + 1} ${scopeListItem.label}`}</span>
                                <Checkbox
                                  key={scopeListItem.id}
                                  value={scopeListItem.id}
                                ></Checkbox>
                              </div>

                              <Divider style={{ margin: 10 }} />
                            </Col>
                          );
                        })}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <div className="form-grid">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:appliedMethodology')}`}
                    name="appliedMethodology"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:appliedMethodology')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:technicalAreas')}`}
                    name="technicalAreas"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:technicalAreas')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:creditingPeriod')}`}
                    name="creditingPeriod"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <InputNumber size="large" />
                  </Form.Item>
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:startDateofCreditingPeriod')}`}
                    name="startDateCreditingPeriod"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:startDateofCreditingPeriod')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    />
                  </Form.Item>
                </div>
              </div>

              <>
                <h4 className="form-section-title">{`2.2 ${t(
                  'validationReport:projectLocation'
                )} / 2.3 ${t('validationReport:technicalProjectDescription')}`}</h4>

                <Form.List name="locationsOfProjectActivity">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }, locationIndex: number) => (
                        <>
                          <div className="form-list-actions">
                            {/* <h4 className="list-item-title">Location {name + 1}</h4> */}
                            {fields.length > 1 && (
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
                            )}
                          </div>
                          <div className="form-section">
                            {/* <h4 className="form-section-title">
                              {`1.5 ${t('validationReport:locationOfProjectActivity')}`}
                            </h4> */}
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
                                      message: `${t(
                                        'validationReport:locationOfProjectActivity'
                                      )} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('validationReport:province')}
                                  name={[name, 'province']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:province')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={onProvinceSelect}
                                    placeholder={t('validationReport:provincePlaceholder')}
                                  >
                                    {provinces.map((province: string, index: number) => (
                                      <Select.Option value={province}>{province}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t('validationReport:district')}
                                  name={[name, 'district']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:district')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('validationReport:districtPlaceholder')}
                                    onSelect={onDistrictSelect}
                                  >
                                    {districts?.map((district: string, index: number) => (
                                      <Select.Option key={district}>{district}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('validationReport:dsDivision')}
                                  name={[name, 'dsDivision']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:dsDivision')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('validationReport:dsDivisionPlaceholder')}
                                  >
                                    {dsDivisions.map((division: string) => (
                                      <Select.Option value={division}>{division}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('validationReport:city')}
                                  name={[name, 'city']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:city')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('validationReport:cityPlaceholder')}
                                  >
                                    {cities.map((city: string) => (
                                      <Select.Option value={city}>{city}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('validationReport:community')}
                                  name={[name, 'community']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:community')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('validationReport:setLocation')}
                                  name={[name, 'geographicalLocationCoordinates']}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, 'geographicalLocationCoordinates']}
                                    existingCordinate={getExistingCordinate(locationIndex)}
                                    disabled={formMode === FormMode.VIEW}
                                    isShowCordinate
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t('validationReport:uploadImages')}
                                  name={[name, 'additionalDocuments']}
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
                              </Col>
                            </Row>

                            <h4
                              className="form-section-title custom-required"
                              style={{ marginBottom: 4 }}
                            >{`${t('validationReport:technicalProjectDescription')}`}</h4>
                            <Form.List name={[name, 'technicalProjectDescriptionItems']}>
                              {(
                                technicalProjectDescriptionItemList,
                                { add: addItem, remove: removeItem }
                              ) => (
                                <Row gutter={[8, 16]}>
                                  <Col span={24}>
                                    {technicalProjectDescriptionItemList.map(
                                      ({
                                        key: itemKey,
                                        name: itemName,
                                        fieldKey,
                                        ...projectItemRest
                                      }) => (
                                        <Row className="technical-project-description">
                                          <Col span={6}>
                                            <Row>
                                              <Col span={23}>
                                                <p style={{ marginBottom: 2 }}>
                                                  {t('validationReport:item')}
                                                </p>
                                                <Form.Item
                                                  {...projectItemRest}
                                                  name={[itemName, 'item']}
                                                  key={itemKey}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: `${t('validationReport:required')}`,
                                                    },
                                                  ]}
                                                >
                                                  <Input
                                                    className="full-width-form-item"
                                                    size="large"
                                                  />
                                                </Form.Item>
                                              </Col>
                                            </Row>
                                          </Col>
                                          <Col span={18}>
                                            <Row gutter={[16, 8]}>
                                              <Col span={10}>
                                                <p style={{ height: 10 }}>
                                                  {t('validationReport:parameter')}
                                                </p>
                                              </Col>
                                              <Col span={10}>
                                                <p style={{ height: 10 }}>
                                                  {t('validationReport:value')}
                                                </p>
                                              </Col>
                                              <Col span={4}></Col>
                                            </Row>
                                            {/* <div className="technical-project-grid-title">
                                              <p style={{ height: 10 }}>
                                                {t('validationReport:parameter')}
                                              </p>
                                              <p style={{ height: 10 }}>
                                                {t('validationReport:value')}
                                              </p>
                                              <span></span>
                                            </div> */}
                                            <Form.List name={[itemName, 'parameterValue']}>
                                              {(
                                                parameterValueList,
                                                {
                                                  add: addItemParameterValue,
                                                  remove: removeItemParameterValue,
                                                }
                                              ) => (
                                                <>
                                                  {parameterValueList.map(
                                                    (
                                                      {
                                                        key: parameterValueListKey,
                                                        name: parameterValueName,
                                                        fieldKey: parameterFieldKey,
                                                        ...parameterValueListRestField
                                                      },
                                                      projectValueIndex: number
                                                    ) => (
                                                      <>
                                                        <Row gutter={[16, 8]}>
                                                          <Col span={10}>
                                                            <Form.Item
                                                              {...parameterValueListRestField}
                                                              name={[
                                                                parameterValueName,
                                                                'parameter',
                                                              ]}
                                                              key={parameterValueListKey}
                                                              rules={[requiredValidationRule(t)]}
                                                            >
                                                              <Input
                                                                className="full-width-form-item"
                                                                size="large"
                                                              />
                                                            </Form.Item>
                                                          </Col>
                                                          <Col span={10}>
                                                            <Form.Item
                                                              {...parameterValueListRestField}
                                                              name={[parameterValueName, 'value']}
                                                              key={parameterValueListKey}
                                                              rules={[requiredValidationRule(t)]}
                                                            >
                                                              <Input
                                                                className="full-width-form-item"
                                                                size="large"
                                                              />
                                                            </Form.Item>
                                                          </Col>
                                                          <Col span={4}>
                                                            <div>
                                                              {parameterValueList.length > 1 && (
                                                                <Button
                                                                  onClick={() => {
                                                                    // reduceTotalCreditingYears()
                                                                    removeItemParameterValue(
                                                                      parameterValueName
                                                                    );
                                                                  }}
                                                                  style={{ marginRight: 4 }}
                                                                  size="middle"
                                                                  className="addMinusBtn"
                                                                  // block
                                                                  icon={<MinusOutlined />}
                                                                ></Button>
                                                              )}
                                                              {projectValueIndex ===
                                                                parameterValueList.length - 1 && (
                                                                <Button
                                                                  onClick={() => {
                                                                    addItemParameterValue();
                                                                  }}
                                                                  size="middle"
                                                                  className="addMinusBtn"
                                                                  icon={<PlusOutlined />}
                                                                ></Button>
                                                              )}
                                                            </div>
                                                          </Col>
                                                        </Row>
                                                      </>
                                                    )
                                                  )}
                                                </>
                                              )}
                                            </Form.List>
                                          </Col>

                                          <Col
                                            span={24}
                                            style={{
                                              display: 'flex',
                                              justifyContent: 'flex-start',
                                            }}
                                          >
                                            {technicalProjectDescriptionItemList.length > 1 && (
                                              <Button
                                                // type="dashed"
                                                onClick={() => {
                                                  // reduceTotalCreditingYears()
                                                  removeItem(itemName);
                                                }}
                                                size="middle"
                                                className="addMinusBtn"
                                                // block
                                                icon={<MinusOutlined />}
                                              ></Button>
                                            )}
                                          </Col>
                                        </Row>
                                      )
                                    )}
                                    <Form.Item style={{ marginTop: 10 }}>
                                      <Button
                                        onClick={() => {
                                          addItem({
                                            item: '',
                                            parameterValue: [
                                              {
                                                parameter: '',
                                                value: '',
                                              },
                                            ],
                                          });
                                        }}
                                        size="middle"
                                        className="addMinusBtn"
                                        icon={<PlusOutlined />}
                                      >
                                        {t('validationReport:addItem')}
                                      </Button>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              )}
                            </Form.List>
                          </div>
                        </>
                      ))}
                      <div className="form-list-actions">
                        <Form.Item>
                          <Button
                            // type="dashed"
                            onClick={() => {
                              add({
                                technicalProjectDescriptionItems: [
                                  {
                                    item: '',
                                    parameterValue: [
                                      {
                                        parameter: '',
                                        value: '',
                                      },
                                    ],
                                  },
                                ],
                              });
                            }}
                            size="large"
                            className="addMinusBtn"
                            // block
                            icon={<PlusOutlined />}
                          >
                            {t('validationReport:addLocation')}
                          </Button>
                        </Form.Item>
                      </div>
                    </>
                  )}
                </Form.List>
              </>

              {/* Section 2.3 Technical project description */}
              {/* <>
                <h4 className="form-section-title custom-required">{`2.3 ${t(
                  'validationReport:technicalProjectDescription'
                )}`}</h4>

                <div></div>
              </> */}

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  disabled={false}
                  // onClick={() => {
                  //   console.log(form.getFieldsValue());

                  //   // next()
                  // }}
                  // onClick={next}

                  htmlType="submit"
                >
                  {t('validationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ValicationReportGHGDescriptionOfProjectActivity;
