import { Button, Col, DatePicker, Form, Input, Radio, Row, Select, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { CustomStepsProps } from './StepProps';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
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
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { PURPOSE_CREDIT_DEVELOPMENT } from '../SLCFProgramme/AddNewProgramme/SLCFProgrammeCreationComponent';
import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';
import { CMASectoralScope } from '../../Definitions/Enums/programmeStage.enum';

const DescriptionOfProjectActivity = (props: CustomStepsProps) => {
  const { next, prev, form, current, t, countries, handleValuesUpdate, disableFields } = props;

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
  const [districts, setDistricts] = useState<{ [key: number]: string[] }>({});
  const [dsDivisions, setDsDivisions] = useState<{ [key: number]: string[] }>({});
  const [cities, setCities] = useState<{ [key: number]: string[] }>({});

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
    getDivisions(value, index);
  };

  const onDivisionSelect = (value: string, index: number) => {
    getCities(value, index);
  };

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

  const onEmissionsValueChange = (value?: any) => {
    const val1 = form.getFieldValue('estimatedAnnualGHGEmissionsValue') || 0;
    const listVals = form.getFieldValue('extraGHGEmmissions');
    let tempTotal = Number(val1);
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        tempTotal += Number(item?.estimatedAnnualGHGEmissionsValue);
      });
    }
    form.setFieldValue('totalEstimatedGHGERs', String(tempTotal));
    calculateAvgAnnualERs();
  };

  const handleCreditingPeriodDateChange = () => {
    const startDate = form.getFieldValue('creditingPeriodStartDate');
    const endDate = form.getFieldValue('creditingPeriodEndDate');

    if (startDate && endDate) {
      const startYear = moment(startDate).year();
      const endYear = moment(endDate).year();
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

      form.setFieldsValue({
        extraGHGEmmissions: years.map((year) => ({
          estimatedAnnualGHGEmissionsYear: moment().year(year),
          estimatedAnnualGHGEmissionsValue: '',
        })),
        totalCreditingYears: years.length,
        totalEstimatedGHGERs: 0,
        avgAnnualERs: 0,
      });
      calculateAvgAnnualERs();
    }
  };

  const onFinish = async (values: any) => {
    const tempValues: any = {
      introduction: values?.introduction,
      sectoralScope: values?.sectoralScope,
      projectProponent: {
        organizationName: values?.organizationName,
        email: values?.email,
        contactPerson: values?.contactPerson,
        title: values?.title,
        telephone: values?.telephone,
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
              role: item?.roleInTheProject,
              telephone: item?.telephone,
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
      conditionsPriorToProjectInitiation: values?.conditionsPriorToProjectInitiation,
      complianceWithLaws: values?.complianceWithLaws,
      participationUnderOtherGHGPrograms: values?.participationPrograms,
      otherFormsOfCredit: values?.otherFormsOfCredit,
      sustainableDevelopment: values?.sustainableDevelopment,
      leakageManagement: values?.leakageManagement,
      commerciallySensitiveInfo: values?.commerciallySensitiveInformation,
    };

    handleValuesUpdate({ projectActivity: tempValues });
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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <>
                <LabelWithTooltip
                  label={`1.1 ${t('CMAForm:projectActivity')}`}
                  required={true}
                  tooltipPosition={TooltipPostion.bottom}
                  tooltipContent={
                    <div>
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
                  }
                  tooltipWidth={600}
                />
                <Form.Item
                  className="full-width-form-item"
                  name="introduction"
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
                          throw new Error(`${t('CMAForm:projectActivity')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={`${t('CMAForm:projectActivityPlaceholder')}`}
                    disabled={disableFields}
                  />
                </Form.Item>
              </>

              <Form.Item
                className="half-width-form-item"
                label={`1.2 ${t('CMAForm:sectoralScope')}`}
                name="sectoralScope"
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
                        throw new Error(`${t('CMAForm:sectoralScope')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <Select size="large" disabled={disableFields}>
                  {Object.values(CMASectoralScope).map((sectoralScope: string, index: number) => (
                    <Select.Option value={sectoralScope} key={sectoralScope + index}>
                      {sectoralScope}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <>
                <h4 className="form-section-title">{`1.3 ${t('CMAForm:projectProponent')}`}</h4>
                <div className="form-section">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('CMAForm:organizationName')}
                          name="organizationName"
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
                                    `${t('CMAForm:organizationName')} ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:contactPerson')}
                          name="contactPerson"
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
                                    `${t('CMAForm:contactPerson')} ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" disabled />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:telephone')}
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
                                  throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
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
                            disabled
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
                                throw new Error(`${t('CMAForm:email')} ${t('isRequired')}`);
                              } else {
                                const val = value.trim();
                                const reg =
                                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                const matches = val.match(reg) ? val.match(reg) : [];
                                if (matches.length === 0) {
                                  throw new Error(`${t('CMAForm:email')} ${t('isInvalid')}`);
                                }
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:designation')}
                        name="title"
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
                                throw new Error(`${t('CMAForm:title')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:address')}
                        name="address"
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
                                throw new Error(`${t('CMAForm:address')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <>
                <h4 className="form-section-title">{`1.4 ${t(
                  'CMAForm:otherEntitiesInProject'
                )}`}</h4>

                <h4 className="list-item-title">Entity 1</h4>
                <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                  <Col xl={12} md={24}>
                    <div className="step-form-right-col">
                      <Form.Item
                        label={t('CMAForm:organizationName')}
                        name="entityOrganizationName"
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
                                  `${t('CMAForm:organizationName')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:contactPerson')}
                        name="entityContactPerson"
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
                                throw new Error(`${t('CMAForm:contactPerson')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:roleInTheProject')}
                        name={'entityRoleInTheProject'}
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
                                  `${t('CMAForm:roleInTheProject')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:telephone')}
                        name="entityTelephone"
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
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </div>
                  </Col>

                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('CMAForm:email')}
                      name="entityEmail"
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
                              throw new Error(`${t('CMAForm:email')} ${t('isRequired')}`);
                            } else {
                              const val = value.trim();
                              const reg =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                              const matches = val.match(reg) ? val.match(reg) : [];
                              if (matches.length === 0) {
                                throw new Error(`${t('CMAForm:email')} ${t('isInvalid')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:designation')}
                      name="entityTitle"
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
                              throw new Error(`${t('CMAForm:designation')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:address')}
                      name="entityAddress"
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
                              throw new Error(`${t('CMAForm:address')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={disableFields} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name="extraOtherEntities">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <>
                          <div className="form-list-actions">
                            <h4 className="list-item-title">Entity {name + 2}</h4>
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
                                disabled={disableFields}
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
                                            `${t('CMAForm:organizationName')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled={disableFields} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:contactPerson')}
                                  name={[name, 'contactPerson']}
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
                                            `${t('CMAForm:contactPerson')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled={disableFields} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:roleInTheProject')}
                                  name={[name, 'roleInTheProject']}
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
                                            `${t('CMAForm:roleInTheProject')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <TextArea rows={4} disabled={disableFields} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:telephone')}
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
                                    disabled={disableFields}
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
                                        throw new Error(`${t('CMAForm:email')} ${t('isRequired')}`);
                                      } else {
                                        const val = value.trim();
                                        const reg =
                                          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                        const matches = val.match(reg) ? val.match(reg) : [];
                                        if (matches.length === 0) {
                                          throw new Error(
                                            `${t('CMAForm:email')} ${t('isInvalid')}`
                                          );
                                        }
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>

                              <Form.Item
                                label={t('CMAForm:designation')}
                                name={[name, 'title']}
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
                                          `${t('CMAForm:designation')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>

                              <Form.Item
                                label={t('CMAForm:address')}
                                name={[name, 'address']}
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
                                          `${t('CMAForm:address')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <TextArea rows={4} disabled={disableFields} />
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
                            disabled={disableFields}
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
                <h4 className="form-section-title">{`${t('CMAForm:projectActivityLocations')}`}</h4>

                <h4 className="list-item-title">Location 1</h4>
                <div className="form-section">
                  <h4 className="form-section-title">{`1.5 ${t(
                    'CMAForm:locationOfProjectActivity'
                  )}`}</h4>

                  <Row
                    // justify={'space-between'}
                    gutter={[40, 16]}
                    style={{ borderRadius: '8px' }}
                  >
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:locationOfProjectActivity')}
                        name="locationOfProjectActivity"
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
                                  `${t('CMAForm:locationOfProjectActivity')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:province')}
                        name="province"
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
                                throw new Error(`${t('CMAForm:province')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          onChange={(value) => onProvinceSelect(value, 0)}
                          placeholder={t('CMAForm:provincePlaceholder')}
                          disabled={disableFields}
                        >
                          {provinces.map((province: string, index: number) => (
                            <Select.Option value={province} key={province + index}>
                              {province}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:district')}
                        name="district"
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
                                throw new Error(`${t('CMAForm:district')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('CMAForm:districtPlaceholder')}
                          onSelect={(value) => onDistrictSelect(value, 0)}
                          disabled={disableFields}
                        >
                          {districts[0]?.map((district: string, index: number) => (
                            <Select.Option key={district + index} value={district}>
                              {district}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:dsDivision')}
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
                                throw new Error(`${t('CMAForm:dsDivision')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('CMAForm:dsDivisionPlaceholder')}
                          disabled={disableFields}
                          onSelect={(value) => onDivisionSelect(value, 0)}
                        >
                          {dsDivisions[0]?.map((division: string, index: number) => (
                            <Select.Option value={division} key={division + index}>
                              {division}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:city')}
                        name="city"
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
                                throw new Error(`${t('CMAForm:city')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('CMAForm:cityPlaceholder')}
                          disabled={disableFields}
                        >
                          {cities[0]?.map((city: string, index) => (
                            <Select.Option value={city} key={city + index}>
                              {city}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:community')}
                        name="community"
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
                                throw new Error(`${t('CMAForm:community')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:setLocation')}
                        name="location"
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
                                throw new Error(`${t('CMAForm:location')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <GetLocationMapComponent
                          form={form}
                          formItemName={'location'}
                          existingCordinate={form.getFieldValue('location')}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:uploadImages')}
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
                          disabled={disableFields}
                          // maxCount={1}
                        >
                          <Button
                            className="upload-doc"
                            size="large"
                            icon={<UploadOutlined />}
                            disabled={disableFields}
                          >
                            {t('CMAForm:upload')}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={`1.6 ${t('CMAForm:projectFundings')}`}
                        name="projectFundings"
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
                                  `${t('CMAForm:projectFundings')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size={'large'} disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={`1.8 ${t('CMAForm:projectCommisionDate')}`}
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
                                  `${t('CMAForm:projectCommisionDate')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          disabled={disableFields}
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={`1.7 ${t('CMAForm:projectStartDate')}`}
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
                                  `${t('CMAForm:projectStartDate')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          disabled={disableFields}
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
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
                                  if (dsDivisions[name + 1]) {
                                    delete dsDivisions[name + 1];
                                  }
                                  if (cities[name + 1]) {
                                    delete cities[name + 1];
                                  }
                                }}
                                size="large"
                                className="addMinusBtn"
                                // block
                                disabled={disableFields}
                                icon={<MinusOutlined />}
                              >
                                {/* Remove Entity */}
                              </Button>
                            </Form.Item>
                          </div>
                          <div className="form-section">
                            <h4 className="form-section-title">
                              {`1.5 ${t('CMAForm:locationOfProjectActivity')}`}
                            </h4>
                            <Row
                              justify={'space-between'}
                              gutter={[40, 16]}
                              style={{ borderRadius: '8px' }}
                            >
                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('CMAForm:locationOfProjectActivity')}
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
                                            `${t('CMAForm:locationOfProjectActivity')} ${t(
                                              'isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled={disableFields} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:province')}
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
                                            `${t('CMAForm:province')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={(value) => onProvinceSelect(value, name + 1)}
                                    placeholder={t('CMAForm:provincePlaceholder')}
                                    disabled={disableFields}
                                  >
                                    {provinces.map((province: string, index: number) => (
                                      <Select.Option value={province} key={name + province + index}>
                                        {province}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:district')}
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
                                            `${t('CMAForm:district')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('CMAForm:districtPlaceholder')}
                                    onSelect={(value) => onDistrictSelect(value, name + 1)}
                                    disabled={disableFields}
                                  >
                                    {districts[name + 1]?.map((district: string, index: number) => (
                                      <Select.Option key={name + district + index} value={district}>
                                        {district}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:dsDivision')}
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
                                            `${t('CMAForm:dsDivision')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('CMAForm:dsDivisionPlaceholder')}
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
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:city')}
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
                                            `${t('CMAForm:city')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('CMAForm:cityPlaceholder')}
                                    disabled={disableFields}
                                  >
                                    {cities[name + 1]?.map((city: string, index: number) => (
                                      <Select.Option value={city} key={name + city + index}>
                                        {city}
                                      </Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:community')}
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
                                            `${t('CMAForm:community')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" disabled={disableFields} />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('CMAForm:setLocation')}
                                  name={[name, 'location']}
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
                                            `${t('CMAForm:location')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, 'location']}
                                    listName="extraLocations"
                                    disabled={disableFields}
                                    existingCordinate={
                                      form?.getFieldValue('extraLocations')[name]?.location
                                    }
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t('CMAForm:uploadImages')}
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
                                    disabled={disableFields}
                                    // maxCount={1}
                                  >
                                    <Button
                                      className="upload-doc"
                                      size="large"
                                      icon={<UploadOutlined />}
                                      disabled={disableFields}
                                    >
                                      Upload
                                    </Button>
                                  </Upload>
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={`1.6 ${t('CMAForm:projectFundings')}`}
                                  name={[name, 'projectFundings']}
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
                                            `${t('CMAForm:projectFundings')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size={'large'} disabled={disableFields} />
                                </Form.Item>

                                <Form.Item
                                  label={`1.8 ${t('CMAForm:projectCommisionDate')}`}
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
                                            `${t('CMAForm:projectCommisionDate')} ${t(
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
                                    disabled={disableFields}
                                    disabledDate={(currentDate: any) =>
                                      currentDate < moment().startOf('day')
                                    }
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={`1.7 ${t('CMAForm:projectStartDate')}`}
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
                                            `${t('CMAForm:projectStartDate')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabled={disableFields}
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
                            disabled={disableFields}
                          >
                            {/* Add Entity */}
                          </Button>
                        </Form.Item>
                      </div>
                    </>
                  )}
                </Form.List>
              </>

              <Row gutter={[60, 16]}>
                <Col xl={12} md={24}>
                  <Form.Item
                    label={`1.9 ${t('CMAForm:projectOwnership')}`}
                    name="projectOwnership"
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
                            throw new Error(`${t('CMAForm:projectOwnership')} ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <div className="form-item-flex-row">
                    <div className="half-width-form-item">
                      <p className="custom-required project-track">{t('CMAForm:projectTrack')}</p>
                      <Input
                        size="large"
                        disabled
                        value={PURPOSE_CREDIT_DEVELOPMENT[form.getFieldValue('projectTrack')]}
                      />
                    </div>

                    <div style={{ fontSize: '12px', marginLeft: '8px', marginTop: '36px' }}>
                      {form.getFieldValue('projectTrack') === 'TRACK_2' && (
                        <>
                          *Issued carbon credits from project will only be used for internal
                          offsetting of emissions.
                        </>
                      )}
                    </div>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <h4 className="crediting-period-title custom-required">
                    1.11 {t('CMAForm:projectCreditingPeriod')}
                  </h4>

                  <div className="crediting-period-flex-row">
                    <Form.Item
                      label={``}
                      name="creditingPeriodStartDate"
                      className="crediting-datepicker"
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
                                `${t('CMAForm:projectStartDate')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        placeholder="Start Date"
                        disabled={disableFields}
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        onChange={handleCreditingPeriodDateChange}
                      />
                    </Form.Item>
                    <p>to</p>
                    <Form.Item
                      label={``}
                      name="creditingPeriodEndDate"
                      className="crediting-datepicker"
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
                                `${t('CMAForm:projectStartDate')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        placeholder="End Date"
                        disabled={disableFields}
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        onChange={handleCreditingPeriodDateChange}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="creditingPeriodDescription"
                    rules={[
                      {
                        required: true,
                        message: `${t('CMAForm:required')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder={`${t('CMAForm:projectCreditingDescriptionPlaceholder')}`}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <>
                <h4 className="form-section-title custom-required">{`1.12 ${t(
                  'CMAForm:scaleOfProjectAndEstimatedEmission'
                )}`}</h4>

                <Row>
                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('CMAForm:selectyourProjectScale')}
                      name="projectScale"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:required')}`,
                        },
                      ]}
                    >
                      <Radio.Group className="radio-btn-flex-row" disabled={disableFields}>
                        <Radio value="MICRO">{t('CMAForm:micro')}</Radio>
                        <Radio value="SMALL">{t('CMAForm:small')}</Radio>
                        <Radio value="LARGE">{t('CMAForm:large')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Estimated Annual GHG Emissions Years Start */}
                <div className="annualGHGEmissions">
                  <Form.List name="extraGHGEmmissions">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row gutter={15} align={'middle'}>
                              <Col md={6} xl={6}>
                                <Form.Item
                                  name={[name, 'estimatedAnnualGHGEmissionsYear']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:required')}`,
                                    },
                                  ]}
                                >
                                  <DatePicker size="large" picker="year" disabled />
                                </Form.Item>
                              </Col>
                              <Col md={10}>
                                <p className="list-item-title">
                                  {t('CMAForm:estimatedGHGEmissionsReductions')}
                                </p>
                              </Col>
                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'estimatedAnnualGHGEmissionsValue']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:required')}`,
                                    },
                                    {
                                      validator(rule, value) {
                                        if (!value) {
                                          return Promise.resolve();
                                        }

                                        // eslint-disable-next-line no-restricted-globals
                                        if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    onChange={(val) => onEmissionsValueChange(val)}
                                    disabled={disableFields}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </>
                        ))}
                      </>
                    )}
                  </Form.List>

                  <Row gutter={15}>
                    <Col xl={16}>
                      <p>{t('CMAForm:totalEstimatedERs')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'totalEstimatedGHGERs'}
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
                              }

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>
                    </Col>

                    <Col xl={16}>
                      <p>{t('CMAForm:totalNumberOfCreditingYears')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'totalCreditingYears'}
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
                              }

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>
                    </Col>

                    <Col xl={16}>
                      <p>{t('CMAForm:averageAnnualERs')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'avgAnnualERs'}
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
                              }

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                {/* Estimated Annual GHG Emissions Years End */}
              </>

              <>
                <LabelWithTooltip
                  label={`1.13 ${t('CMAForm:descriptionOfTheProjectActivity')}`}
                  tooltipPosition={TooltipPostion.top}
                  tooltipWidth={800}
                  required={true}
                  tooltipContent={
                    <div>
                      <p>
                        Describe the project activity or activities (including the technologies or
                        measures employed) and how it/they will achieve net GHG emission reductions
                        or removals.
                      </p>
                      <p>For non-AFOLU projects:</p>
                      <ul>
                        <li>
                          Include a list and the arrangement of the main manufacturing/production
                          technologies, systems and equipment involved. Include in the description
                          information about the age and average lifetime of the equipment based on
                          manufacturer’s specifications and industry standards, and existing and
                          forecast installed capacities, load factors and efficiencies.{' '}
                        </li>
                        <li>
                          Include the types and levels of services (normally in terms of mass or
                          energy flows) provided by the systems and equipment that are being
                          modified and/or installed and their relation, if any, to other
                          manufacturing/production equipment and systems outside the project
                          boundary. Clearly explain how the same types and levels of services
                          provided by the project would have been provided in the baseline scenario.
                        </li>
                        <li>
                          Where appropriate, provide a list of facilities, systems and equipment in
                          operation under the existing scenario prior to the implementation of the
                          project.{' '}
                        </li>
                      </ul>

                      <p>For AFOLU projects</p>
                      <ul>
                        <li>
                          For all measures listed, include information on any conservation,
                          management or planting activities, including a description of how the
                          various organizations, communities and other entities are involved.
                        </li>
                        <li>
                          In the description of the project activity, state if the project is
                          located within a jurisdiction covered by a jurisdictional REDD+ program.
                        </li>
                      </ul>
                    </div>
                  }
                />
                <Form.Item
                  className="full-width-form-item"
                  name="projectActivityDescription"
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
                            `${t('CMAForm:descriptionOfTheProjectActivity')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={`${t('CMAForm:descriptionOfTheProjectActivityPlaceholder')}`}
                    disabled={disableFields}
                  />
                </Form.Item>
              </>

              <Form.Item
                label={t('CMAForm:additionalDocuments')}
                name="optionalProjectActivityDocuments"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (disableFields) return;

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
                  disabled={disableFields}
                  // maxCount={1}
                >
                  <Button
                    className="upload-doc"
                    size="large"
                    icon={<UploadOutlined />}
                    disabled={disableFields}
                  >
                    {t('CMAForm:upload')}
                  </Button>
                </Upload>
              </Form.Item>

              <>
                <LabelWithTooltip
                  label={`1.14 ${t('CMAForm:conditionsPriorToProjectInitiation')}`}
                  required={true}
                  tooltipContent={
                    <div>
                      <p>
                        Describe the conditions existing prior to project initiation and demonstrate
                        that the project has not been implemented to generate GHG emissions for the
                        purpose of their subsequent reduction, removal or destruction.
                      </p>
                      <p>
                        Where the baseline scenario is the same as the conditions existing prior to
                        the project initiation, there is no need to repeat the description of the
                        scenarios (rather, just state that this is the case and refer the reader to
                        Section 3.4 (Baseline Scenario)).
                      </p>
                      <p>
                        For AFOLU projects, include the present and prior environmental conditions
                        of the project area, including as appropriate information on the climate,
                        hydrology, topography, relevant historic conditions, soils, vegetation and
                        ecosystems
                      </p>
                    </div>
                  }
                  tooltipWidth={600}
                />
              </>
              <Form.Item
                className="full-width-form-item"
                name="conditionsPriorToProjectInitiation"
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
                          `${t('CMAForm:conditionsPriorToProjectInitiation')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  disabled={disableFields}
                  placeholder="Provide a summary description of the project to enable an understanding of the nature  of the project and its implementation"
                />
              </Form.Item>

              <Form.Item
                label={`1.15 ${t('CMAForm:complianceWithLawsRegulatory')}`}
                className="full-width-form-item"
                name="complianceWithLaws"
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
                          `${t('CMAForm:complianceWithLawsRegulatory')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  disabled={disableFields}
                  placeholder={`${t('CMAForm:complianceWithLawsRegulatoryPlaceholder')}`}
                />
              </Form.Item>

              <Row gutter={[60, 16]}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`1.1.6 ${t('CMAForm:participationPrograms')}`}
                    name="participationPrograms"
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
                              `${t('CMAForm:participationPrograms')} ${t('isRequired')}`
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea
                      rows={5}
                      disabled={disableFields}
                      placeholder={`${t('CMAForm:participationProgramsPlaceholder')}`}
                    />
                  </Form.Item>
                </Col>

                <Col md={24} xl={12}>
                  <Form.Item
                    label={`1.17 ${t('CMAForm:otherFormsOfCredit')}`}
                    name="otherFormsOfCredit"
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
                              `${t('CMAForm:otherFormsOfCredit')} ${t('isRequired')}`
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <TextArea
                      rows={5}
                      disabled={disableFields}
                      placeholder={`${t('CMAForm:otherFormsOfCreditPlaceholder')}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={`1.18 ${t('CMAForm:sustainableDevelopment')}`}
                name="sustainableDevelopment"
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
                          `${t('CMAForm:sustainableDevelopment')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  disabled={disableFields}
                  placeholder={`${t('CMAForm:sustainableDevelopmentPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`1.19 ${t('CMAForm:leakageManagement')}`}
                name="leakageManagement"
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
                        throw new Error(`${t('CMAForm:leakageManagement')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  disabled={disableFields}
                  rows={4}
                  placeholder={`${t('CMAForm:leakageManagementPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`1.20 ${t('CMAForm:commerciallySensitiveInformation')}`}
                name="commerciallySensitiveInformation"
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
                          `${t('CMAForm:commerciallySensitiveInformation')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  disabled={disableFields}
                  placeholder={`${t('CMAForm:commerciallySensitiveInformationPlaceholder')}`}
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('CMAForm:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('CMAForm:next')}
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

export default DescriptionOfProjectActivity;
