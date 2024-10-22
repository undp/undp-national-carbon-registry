import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
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

const ValicationReportGHGDescriptionOfProjectActivity = (props: CustomStepsProps) => {
  const { next, prev, form, current, t, countries, handleValuesUpdate } = props;

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
      id: 'eneryIndustry',
      label: t('validationReport:energyIndustry'),
    },
    {
      id: 'entergyDistribution',
      label: t('validationReport:entergyDistribution'),
    },
    {
      id: 'energyDemand',
      label: t('validationReport:energyDemand'),
    },
    {
      id: 'manufacturingIndustry',
      label: t('validationReport:manufacturingIndustry'),
    },
    {
      id: 'chemicalIndustry',
      label: t('validationReport:chemicalIndustry'),
    },
    {
      id: 'construction',
      label: t('validationReport:construction'),
    },
    {
      id: 'miningMineralProduction',
      label: t('validationReport:miningMineralProduction'),
    },
    {
      id: 'fugitiveEmissionsFromProduction',
      label: t('validationReport:fugitiveEmissionsFromProduction'),
    },
    {
      id: 'solventsUse',
      label: t('validationReport:solventsUse'),
    },
    {
      id: 'wasteHandlingDisposal',
      label: t('validationReport:wasteHandlingDisposal'),
    },
    {
      id: 'afforestationandReforestation',
      label: t('validationReport:afforestationandReforestation'),
    },
    {
      id: 'agriculture',
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

  const onFinish = async (values: any) => {
    console.log('-----values---------', values);
    const tempValues: any = {
      introduction: values?.introduction,
      sectoralScopeAndProjectType: values?.sectoralScopeAndProjectType,
      projectProponent: {
        organizationName: values?.organizationName,
        email: values?.email,
        contactPerson: values?.contactPerson,
        title: values?.title,
        telephone: values?.telephone,
        fax: values?.fax,
        address: values?.address,
      },
      otherEntities: (function () {
        const tempList: any[] = [];
        const firstObj = {
          orgainzationName: values?.entityOrganizationName,
          email: values?.entityEmail,
          title: values?.entityTitle,
          contactPerson: values?.entityContactPerson,
          role: values?.entityRoleInTheProject,
          telephone: values?.entityTelephone,
          fax: values?.entityFax,
          address: values?.entityAddress,
        };

        tempList.push(firstObj);
        if (values?.extraOtherEntities) {
          values.extraOtherEntities.forEach((item: any) => {
            const tempObj = {
              organizationName: item?.organizationName,
              email: item?.email,
              contactPerson: item?.contactPerson,
              title: item?.title,
              // role: item?.roleInTheProject,
              telephone: item?.telephone,
              fax: item?.fax,
              address: item?.address,
            };

            tempList.push(tempObj);
          });
        }

        return tempList;
      })(),
      locationsOfProjectActivity: await (async function () {
        const tempList: any[] = [];
        const firstObj = {
          locationOfProjectActivity: values?.locationOfProjectActivity,
          province: values?.province,
          district: values?.district,
          dsDivision: values?.dsDivision,
          city: values?.city,
          community: values?.community,
          geographicalLocationCoordinates: values?.location,
          additionalDocuments: await (async function () {
            const base64Docs: string[] = [];

            if (values?.optionalImages && values?.optionalImages.length > 0) {
              const docs = values.optionalImages;
              for (let i = 0; i < docs.length; i++) {
                const temp = await getBase64(docs[i]?.originFileObj as RcFile);
                base64Docs.push(temp); // No need for Promise.resolve
              }
            }

            return base64Docs;
          })(),
          projectFundings: values?.projectFundings,
          startDate: moment(values?.projectStartDate).startOf('day').unix(),
          commissioningDate: moment(values?.projectCommisionDate).startOf('day').unix(),
        };
        tempList.push(firstObj);
        if (values?.extraLocations) {
          values?.extraLocations.forEach(async (item: any) => {
            const tempObj = {
              locationOfProjectActivity: item?.locationOfProjectActivity,
              province: item?.province,
              district: item?.district,
              dsDivision: item?.dsDivision,
              city: item?.city,
              community: item?.community,
              geographicalLocationCoordinates: item?.location,
              additionalDocuments: await (async function () {
                const base64Docs: string[] = [];

                if (item?.optionalImages && item?.optionalImages.length > 0) {
                  const docs = item.optionalImages;
                  for (let i = 0; i < docs.length; i++) {
                    const temp = await getBase64(docs[i]?.originFileObj as RcFile);
                    base64Docs.push(temp);
                  }
                }

                return base64Docs;
              })(),
              projectFundings: item?.projectFundings,
              startDate: moment(item?.projectStartDate).startOf('day').unix(),
              commissioningDate: moment(item?.projectCommisionDate).startOf('day').unix(),
            };

            tempList.push(tempObj);
          });
        }
        return tempList;
      })(),
      projectOwnership: values?.projectOwnership,
      projectTrack: form.getFieldValue('projectTrack'),
      creditingPeriodStartDate: moment(values?.creditingPeriodStartDate).startOf('day').unix(),
      creditingPeriodEndDate: moment(values?.creditingPeriodEndDate).startOf('day').unix(),
      creditingPeriodDescription: values?.creditingPeriodDescription,
      projectScaleType: values?.projectScale,
      estimatedAnnualGHGEmissions: (function () {
        const tempList: any = [];
        const firstObj = {
          year: moment(values?.estimatedAnnualGHGEmissionsYear).startOf('year').unix(),
          ghgEmissionReduction: Number(values?.estimatedAnnualGHGEmissionsValue),
        };

        tempList.push(firstObj);

        if (values?.extraGHGEmmissions) {
          values?.extraGHGEmmissions.forEach((item: any) => {
            const tempObj = {
              year: moment(item?.estimatedAnnualGHGEmissionsYear).startOf('year').unix(),
              ghgEmissionReduction: Number(item?.estimatedAnnualGHGEmissionsValue),
            };

            tempList.push(tempObj);
          });
        }

        return tempList;
      })(),
      totalEstimatedGHGERs: Number(values?.totalEstimatedGHGERs),
      totalCreditingYears: Number(values?.totalCreditingYears),
      avgAnnualERs: Number(values?.avgAnnualERs),
      description: values?.projectActivityDescription,
      additionalDocuments: await (async function () {
        const base64Docs: string[] = [];

        if (
          values?.optionalProjectActivityDocuments &&
          values?.optionalProjectActivityDocuments.length > 0
        ) {
          const docs = values.optionalProjectActivityDocuments;
          for (let i = 0; i < docs.length; i++) {
            const temp = await getBase64(docs[i]?.originFileObj as RcFile);
            base64Docs.push(temp);
          }
        }

        return base64Docs;
      })(),
      conditionsPriorToProjectInitiation: values?.conditionsPriorToProjectInitiation,
      complianceWithLaws: values?.complianceWithLaws,
      participationUnderOtherGHGPrograms: values?.participationPrograms,
      otherFormsOfCredit: values?.otherFormsOfCredit,
      sustainableDevelopment: values?.sustainableDevelopment,
      leakageManagement: values?.leakageManagement,
      commerciallySensitiveInfo: values?.commerciallySensitiveInformation,
    };

    console.log('---------tempVals-----------', tempValues);
    handleValuesUpdate({ projectActivity: tempValues });
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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row gutter={[8, 16]}>
                <Col md={12} lg={12}>
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:projectTitle')}`}
                    name="projectTitle"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:sectoralScopeProjectType')} ${t(
                          'isRequired'
                        )}`,
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
                      <Radio value={'smallScale'}>
                        {t('validationReport:smallScaleBundleProject')}
                      </Radio>
                      <Radio value={'largeScale'}>{t('validationReport:largeScale')}</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                className="full-width-form-item"
                label={`2.1 ${t('validationReport:projectCharacteristics')}`}
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
                name="introduction"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:projectActiviy')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('validationReport:projectActivityPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('projectScopeUNFCC')}`}
                name="projectScopeUNFCC"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:sectoralScopeProjectType')} ${t('isRequired')}`,
                  },
                ]}
              ></Form.Item>

              <Form.Item
                className="full-width-form-item"
                // label={`${t('projectScopeUNFCC')}`}
                name="projectScopeUNFCC"
                // rules={[
                //   {
                //     required: true,
                //     message: `${t('validationReport:sectoralScopeProjectType')} ${t('isRequired')}`,
                //   },
                // ]}
              >
                <Row gutter={[8, 16]}>
                  <Col span={6}>{t('validationReport:projectScopeUNFCC')}</Col>
                  <Col span={18}>
                    <Checkbox.Group className="full-width-form-item">
                      {projectScopeList.map((scopeListItem: any, index: number) => {
                        return (
                          <Col span={24}>
                            <div className="side-by-side-form-item">
                              <span>{`${index + 1} ${scopeListItem.label}`}</span>
                              <Checkbox value={scopeListItem.id}></Checkbox>
                            </div>

                            <Divider style={{ margin: 10 }} />
                          </Col>
                        );
                      })}
                    </Checkbox.Group>
                  </Col>
                </Row>
              </Form.Item>

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
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  className="full-width-form-item"
                  label={`${t('validationReport:startDateofCreditingPeriod')}`}
                  name="startDateofCreditingPeriod"
                  rules={[
                    {
                      required: true,
                      message: `${t('validationReport:startDateofCreditingPeriod')} ${t(
                        'isRequired'
                      )}`,
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
              </div>
              <>
                <h4 className="form-section-title">{`2.2 ${t(
                  'validationReport:projectLocation'
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
                            required: true,
                            message: `${t('validationReport:locationOfProjectActivity')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:province')}
                        name="province"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:province')} ${t('isRequired')}}`,
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
                        name="district"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:district')} ${t('isRequired')}`,
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
                        name="dsDivision"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:dsDivision')} ${t('isRequired')}`,
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
                        name="city"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:city')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Select size="large" placeholder={t('validationReport:cityPlaceholder')}>
                          {cities.map((city: string) => (
                            <Select.Option value={city}>{city}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('validationReport:community')}
                        name="community"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:community')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('validationReport:setLocation')}
                        name="location"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:location')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <GetLocationMapComponent form={form} formItemName={'location'} />
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
                                if (
                                  !isValidateFileType(
                                    file[0]?.type,
                                    DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                  )
                                ) {
                                  throw new Error(`${t('validationReport:invalidFileFormat')}`);
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
                    </Col>

                    {/* <Col xl={12} md={24}>
                      <Form.Item
                        label={`1.6 ${t('validationReport:projectFundings')}`}
                        name="projectFundings"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:projectFundings')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size={'large'} />
                      </Form.Item>

                      <Form.Item
                        label={`1.8 ${t('validationReport:projectCommisionDate')}`}
                        name="projectCommisionDate"
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
                                  `${t('validationReport:projectCommisionDate')} ${t('isRequired')}`
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
                    </Col> */}

                    {/* <Col xl={12} md={24}>
                      <Form.Item
                        label={`1.7 ${t('validationReport:projectStartDate')}`}
                        name="projectStartDate"
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
                                  `${t('validationReport:projectStartDate')} ${t('isRequired')}`
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
                    </Col> */}
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
                          <div className="form-section">
                            <h4 className="form-section-title">
                              {`1.5 ${t('validationReport:locationOfProjectActivity')}`}
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
                                      )}}`,
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
                                  name={[name, 'location']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:location')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, 'location']}
                                    listName="extraLocations"
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
                                          if (
                                            !isValidateFileType(
                                              file[0]?.type,
                                              DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                            )
                                          ) {
                                            throw new Error(
                                              `${t('validationReport:invalidFileFormat')}`
                                            );
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
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={`1.6 ${t('validationReport:projectFundings')}`}
                                  name={[name, 'projectFundings']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('validationReport:projectFundings')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Input size={'large'} />
                                </Form.Item>

                                <Form.Item
                                  label={`1.8 ${t('validationReport:projectCommisionDate')}`}
                                  name={[name, 'projectCommisionDate']}
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
                                            `${t('validationReport:projectCommisionDate')} ${t(
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

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={`1.7 ${t('validationReport:projectStartDate')}`}
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
                                            `${t('validationReport:projectStartDate')} ${t(
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

              {/* Section 2.3 Technical project description */}
              <>
                <h4 className="form-section-title custom-required">{`2.3 ${t(
                  'validationReport:technicalProjectDescription'
                )}`}</h4>

                <div>
                  <Form.List name="technicalProjectDescriptionLocation">
                    {(
                      technicalProjectDescriptionLocationList,
                      { add: addProjectLocation, remove: removeProjectLocation }
                    ) => (
                      <>
                        {technicalProjectDescriptionLocationList.map(
                          ({
                            key: projectItemKey,
                            name: projectItemName,
                            fieldKey: projectItemFieldKey,
                            ...otherFields
                          }) => (
                            <div className="form-section">
                              <Row>
                                <Col xl={12} md={24}>
                                  <Form.Item
                                    {...otherFields}
                                    label={t('validationReport:locationOfProjectActivity')}
                                    name={[projectItemName, 'technicalProjectDescriptionLocation']}
                                    key={projectItemKey}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('validationReport:required')}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </Col>
                              </Row>
                              <Row gutter={[8, 16]}>
                                <Col span={4}>
                                  <div className="technical-project-grid">
                                    <label>{t('validationReport:item')}</label>
                                  </div>
                                </Col>
                                <Col span={20}>
                                  <div className="technical-project-grid">
                                    <label>{t('validationReport:parameter')}</label>
                                    <label>{t('validationReport:value')}</label>
                                  </div>
                                </Col>
                                <Form.List
                                  name={[projectItemName, 'technicalProjectDescriptionItems']}
                                >
                                  {(
                                    technicalProjectDescriptionItemList,
                                    { add: addItem, remove: removeItem }
                                  ) => (
                                    <>
                                      {technicalProjectDescriptionItemList.map(
                                        ({
                                          key: itemKey,
                                          name: itemName,
                                          fieldKey,
                                          ...projectItemRest
                                        }) => (
                                          <>
                                            <Col span={4}>
                                              <Form.Item
                                                {...projectItemRest}
                                                name={[itemName, 'technicalProjectDescriptionItem']}
                                                key={projectItemKey}
                                                rules={[
                                                  {
                                                    required: true,
                                                    message: `${t('validationReport:required')}`,
                                                  },
                                                ]}
                                              >
                                                <Input size="large" />
                                              </Form.Item>
                                            </Col>
                                            <Col span={20}>
                                              <div className="technical-project-grid">
                                                <Form.List
                                                  name={[
                                                    itemName,
                                                    'technicalProjectDescriptionLocationParameterValues',
                                                  ]}
                                                >
                                                  {(parameterValueList, { add, remove }) => (
                                                    <>
                                                      {parameterValueList.map(
                                                        ({
                                                          key: parameterValueListKey,
                                                          name: parameterValueName,
                                                          fieldKey: parameterFieldKey,
                                                          ...restField
                                                        }) => (
                                                          <>
                                                            <Form.Item
                                                              {...restField}
                                                              name={[
                                                                parameterValueName,
                                                                'technicalProjectDescriptionParameter',
                                                              ]}
                                                              key={parameterValueListKey}
                                                              rules={[
                                                                {
                                                                  required: true,
                                                                  message: `${t(
                                                                    'validationReport:required'
                                                                  )}`,
                                                                },
                                                              ]}
                                                            >
                                                              <Input size="large" />
                                                            </Form.Item>
                                                            <Form.Item
                                                              {...restField}
                                                              name={[
                                                                parameterValueName,
                                                                'technicalProjectDescriptionValue',
                                                              ]}
                                                              key={parameterValueListKey}
                                                              rules={[
                                                                {
                                                                  required: true,
                                                                  message: `${t(
                                                                    'validationReport:required'
                                                                  )}`,
                                                                },
                                                              ]}
                                                            >
                                                              <Input size="large" />
                                                            </Form.Item>
                                                          </>
                                                        )
                                                      )}
                                                      <Form.Item>
                                                        <Button
                                                          onClick={() => {
                                                            add();
                                                          }}
                                                          size="large"
                                                          className="addMinusBtn"
                                                          icon={<PlusOutlined />}
                                                        ></Button>
                                                      </Form.Item>
                                                    </>
                                                  )}
                                                </Form.List>
                                              </div>
                                            </Col>
                                          </>
                                        )
                                      )}
                                      <Form.Item>
                                        <Button
                                          onClick={() => {
                                            addItem();
                                          }}
                                          size="large"
                                          className="addMinusBtn"
                                          icon={<PlusOutlined />}
                                        >
                                          {t('validationReport:addItem')}
                                        </Button>
                                      </Form.Item>
                                    </>
                                  )}
                                </Form.List>
                              </Row>
                            </div>
                          )
                        )}
                        <Form.Item>
                          <Button
                            onClick={() => {
                              addProjectLocation();
                            }}
                            size="large"
                            className="addMinusBtn"
                            icon={<PlusOutlined />}
                          >
                            {t('validationReport:addLocation')}
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </div>
              </>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button type="primary" size={'large'} onClick={next} htmlType="submit">
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
