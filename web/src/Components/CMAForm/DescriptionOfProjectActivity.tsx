import { Button, Col, DatePicker, Form, Input, Radio, Row, Select, StepProps, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import { CustomStepsProps } from './StepProps';
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

const DescriptionOfProjectActivity = (props: CustomStepsProps) => {
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
          // role: values?.entityRoleInTheProject,
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
          startDate: moment(values?.projectStartDate),
          commissioningDate: moment(values?.projectCommisionDate),
        };

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
          return tempList;
        }
      })(),
      projectOwnership: values?.projectOwnership,
      projectTrack: values?.projectTrack,
      creditingPeriodStartDate: moment(values?.creditingPeriodStartDate).startOf('day').unix(),
      credititingPeriodEndDate: moment(values?.creditingPeriodEndDate).startOf('day').unix(),
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

        if (values?.optionalProjectActivityDocuments.length > 0) {
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

    const tempObj = {};
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
              <Form.Item
                className="full-width-form-item"
                label={`1.1 ${t('CMAForm:projectActivity')}`}
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
                    message: `${t('CMAForm:projectActiviy')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:projectActivityPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.2 ${t('CMAForm:sectoralScopeProjectType')}`}
                name="sectoralScopeAndProjectType"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:sectoralScopeProjectType')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project to enable an understanding of the nature  of the project and its implementation"
                />
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
                              message: `${t('CMAForm:organizationName')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:contactPerson')}
                          name="contactPerson"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:telephone')}
                          name="telephone"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
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
                          />
                        </Form.Item>

                        <Form.Item
                          label={t('CMAForm:fax')}
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
                                  throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                } else {
                                  const phoneNo = formatPhoneNumber(String(value));
                                  if (String(value).trim() !== '') {
                                    if (
                                      phoneNo === null ||
                                      phoneNo === '' ||
                                      phoneNo === undefined
                                    ) {
                                      throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                    } else {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(`${t('CMAForm:fax')} ${t('isInvalid')}`);
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
                            message: `${t('CMAForm:email')} ${t('isRequired')}`,
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
                        label={t('CMAForm:title')}
                        name="title"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:title')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:address')}
                        name="address"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:address')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea rows={4} />
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
                            message: `${t('CMAForm:organizationName')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:contactPerson')}
                        name="entityContactPerson"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:roleInTheProject')}
                        name={'entityRoleInTheProject'}
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:roleInTheProject')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea rows={4} />
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
                          message: `${t('CMAForm:email')} ${t('isRequired')}`,
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
                      label={t('CMAForm:title')}
                      name="entityTitle"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:title')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:address')}
                      name="entityAddress"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:address')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:fax')}
                      name="entityFax"
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
                              throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(`${t('CMAForm:fax')} ${t('isInvalid')}`);
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
                                      message: `${t('CMAForm:organizationName')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:contactPerson')}
                                  name={[name, 'contactPerson']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:contactPerson')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:roleInTheProject')}
                                  name={[name, 'roleInTheProject']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:roleInTheProject')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <TextArea rows={4} />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:telephone')}
                                  name={[name, 'telephone']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
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
                                    message: `${t('CMAForm:email')} ${t('isRequired')}`,
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
                                label={t('CMAForm:title')}
                                name={[name, 'title']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('CMAForm:title')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" />
                              </Form.Item>

                              <Form.Item
                                label={t('CMAForm:address')}
                                name={[name, 'address']}
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('CMAForm:address')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <TextArea rows={4} />
                              </Form.Item>

                              <Form.Item
                                label={t('CMAForm:fax')}
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
                                        throw new Error(`${t('CMAForm:fax')} ${t('isRequired')}`);
                                      } else {
                                        const phoneNo = formatPhoneNumber(String(value));
                                        if (String(value).trim() !== '') {
                                          if (
                                            phoneNo === null ||
                                            phoneNo === '' ||
                                            phoneNo === undefined
                                          ) {
                                            throw new Error(
                                              `${t('CMAForm:fax')} ${t('isRequired')}`
                                            );
                                          } else {
                                            if (!isPossiblePhoneNumber(String(value))) {
                                              throw new Error(
                                                `${t('CMAForm:fax')} ${t('isInvalid')}`
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
                            message: `${t('CMAForm:locationOfProjectActivity')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:province')}
                        name="province"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:province')} ${t('isRequired')}}`,
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          onChange={onProvinceSelect}
                          placeholder={t('CMAForm:provincePlaceholder')}
                        >
                          {provinces.map((province: string, index: number) => (
                            <Select.Option value={province}>{province}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label={t('CMAForm:district')}
                        name="district"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:district')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('CMAForm:districtPlaceholder')}
                          onSelect={onDistrictSelect}
                        >
                          {districts?.map((district: string, index: number) => (
                            <Select.Option key={district}>{district}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:dsDivision')}
                        name="dsDivision"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:dsDivision')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Select size="large" placeholder={t('CMAForm:dsDivisionPlaceholder')}>
                          {dsDivisions.map((division: string) => (
                            <Select.Option value={division}>{division}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:city')}
                        name="city"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:city')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Select size="large" placeholder={t('CMAForm:cityPlaceholder')}>
                          {cities.map((city: string) => (
                            <Select.Option value={city}>{city}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={t('CMAForm:community')}
                        name="community"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:community')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:setLocation')}
                        name="location"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:location')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <GetLocationMapComponent form={form} formItemName={'location'} />
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
                                if (
                                  !isValidateFileType(
                                    file[0]?.type,
                                    DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                  )
                                ) {
                                  throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={`1.6 ${t('CMAForm:projectFundings')}`}
                        name="projectFundings"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:projectFundings')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size={'large'} />
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
                            <h4 className="list-item-title">location {name + 2}</h4>
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
                                      message: `${t('CMAForm:locationOfProjectActivity')} ${t(
                                        'isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:province')}
                                  name={[name, 'province']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:province')} ${t('isRequired')}}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={onProvinceSelect}
                                    placeholder={t('CMAForm:provincePlaceholder')}
                                  >
                                    {provinces.map((province: string, index: number) => (
                                      <Select.Option value={province}>{province}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t('CMAForm:district')}
                                  name={[name, 'district']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:district')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('CMAForm:districtPlaceholder')}
                                    onSelect={onDistrictSelect}
                                  >
                                    {districts?.map((district: string, index: number) => (
                                      <Select.Option key={district}>{district}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:dsDivision')}
                                  name={[name, 'dsDivision']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:dsDivision')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('CMAForm:dsDivisionPlaceholder')}
                                  >
                                    {dsDivisions.map((division: string) => (
                                      <Select.Option value={division}>{division}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:city')}
                                  name={[name, 'city']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:city')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Select size="large" placeholder={t('CMAForm:cityPlaceholder')}>
                                    {cities.map((city: string) => (
                                      <Select.Option value={city}>{city}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t('CMAForm:community')}
                                  name={[name, 'community']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:community')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('CMAForm:setLocation')}
                                  name={[name, 'location']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:location')} ${t('isRequired')}`,
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
                                  label={t('CMAForm:uploadImages')}
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
                                            throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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
                                  label={`1.6 ${t('CMAForm:projectFundings')}`}
                                  name={[name, 'projectFundings']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('CMAForm:projectFundings')} ${t('isRequired')}`,
                                    },
                                  ]}
                                >
                                  <Input size={'large'} />
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

              <Row gutter={[60, 16]}>
                <Col xl={12} md={24}>
                  <Form.Item
                    label={`1.9 ${t('CMAForm:projectOwnership')}`}
                    name="projectOwnership"
                    rules={[
                      {
                        required: true,
                        message: `${t('CMAForm:projectOwnership')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <div className="form-item-flex-row">
                    <div className="half-width-form-item">
                      <Form.Item
                        label={`1.10 ${t('CMAForm:projectTrack')}`}
                        name="projectTrack"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:projectOwnership')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </div>

                    <div></div>
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
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
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
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
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
                      <Radio.Group className="radio-btn-flex-row">
                        <Radio value="SMALL">Small</Radio>
                        <Radio value="LARGE">Large</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Estimated Annual GHG Emissions Years Start */}
                <div className="annualGHGEmissions">
                  <Row gutter={15} align={'middle'}>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="estimatedAnnualGHGEmissionsYear"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          picker="year"
                          onChange={(value) => onEmissionsYearChange(value, 1)}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={10}>
                      <p className="list-item-title">
                        {t('CMAForm:estimatedGHGEmissionsReductions')}
                      </p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="estimatedAnnualGHGEmissionsValue"
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
                                return Promise.reject(new Error('Should be an integer'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input size="large" onChange={(val) => onEmissionsValueChange(val)} />
                      </Form.Item>
                    </Col>
                  </Row>

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
                                  <DatePicker
                                    size="large"
                                    picker="year"
                                    onChange={(value) =>
                                      onEmissionsYearChange(value, fields.length + 1)
                                    }
                                  />
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
                                          return Promise.reject(new Error('Should be an integer'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    onChange={(val) => onEmissionsValueChange(val)}
                                  />
                                </Form.Item>
                              </Col>

                              <Col md={2} xl={2}>
                                <Form.Item>
                                  <Button
                                    // type="dashed"
                                    onClick={() => {
                                      // reduceTotalCreditingYears()
                                      remove(name);
                                      onEmissionsValueChange();
                                      onEmissionsYearChange(null, fields.length + 1);
                                    }}
                                    size="large"
                                    className="addMinusBtn"
                                    // block
                                    icon={<MinusOutlined />}
                                  >
                                    {/* Add Entity */}
                                  </Button>
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
                                // addTotalCreditingYears()
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
                                return Promise.reject(new Error('Should be an integer'));
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
                                return Promise.reject(new Error('Should be an integer'));
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
                                return Promise.reject(new Error('Should be an integer'));
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

              <Form.Item
                className="full-width-form-item"
                label={`1.13 ${t('CMAForm:descriptionOfTheProjectActivity')}`}
                tooltip={{
                  title: (
                    <div className="tooltip">
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
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                name="projectActivityDescription"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:descriptionOfTheProjectActivity')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:descriptionOfTheProjectActivityPlaceholder')}`}
                />
              </Form.Item>
              <Form.Item
                label={t('CMAForm:additionalDocuments')}
                name="optionalProjectActivityDocuments"
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
                          throw new Error(`${t('CMAForm:invalidFileFormat')}`);
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

              <Form.Item
                label={`1.14 ${t('CMAForm:conditionsPriorToProjectInitiation')}`}
                tooltip={{
                  title: (
                    <div className="tooltip">
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
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                className="full-width-form-item"
                name="conditionsPriorToProjectInitiation"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:conditionsPriorToProjectInitiation')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project to enable an understanding of the nature  of the project and its implementation"
                />
              </Form.Item>

              <Form.Item
                label={`1.15 ${t('CMAForm:complianceWithLawsRegulatory')}`}
                // tooltip={{
                //   title: (
                //     <div className="tooltip">
                //       <p>
                //         Describe the conditions existing prior to project initiation and demonstrate
                //         that the project has not been implemented to generate GHG emissions for the
                //         purpose of their subsequent reduction, removal or destruction.
                //       </p>
                //       <p>
                //         Where the baseline scenario is the same as the conditions existing prior to
                //         the project initiation, there is no need to repeat the description of the
                //         scenarios (rather, just state that this is the case and refer the reader to
                //         Section 3.4 (Baseline Scenario)).
                //       </p>
                //       <p>
                //         For AFOLU projects, include the present and prior environmental conditions
                //         of the project area, including as appropriate information on the climate,
                //         hydrology, topography, relevant historic conditions, soils, vegetation and
                //         ecosystems
                //       </p>
                //     </div>
                //   ),
                //   icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                //   placement: 'topLeft',
                // }}
                className="full-width-form-item"
                name="complianceWithLaws"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:complianceWithLawsRegulatory')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
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
                        message: `${t('CMAForm:participationPrograms')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={5}
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
                        message: `${t('CMAForm:otherFormsOfCredit')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea
                      rows={5}
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
                    message: `${t('CMAForm:sustainableDevelopment')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:sustainableDevelopmentPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`1.19 ${t('CMAForm:leakageManagement')}`}
                name="leakageManagement"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:leakageManagement')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:leakageManagementPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                label={`1.20 ${t('CMAForm:commerciallySensitiveInformation')}`}
                name="commerciallySensitiveInformation"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:commerciallySensitiveInformation')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:commerciallySensitiveInformationPlaceholder')}`}
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={next}
                  htmlType="submit"
                >
                  {t('CMAForm:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default DescriptionOfProjectActivity;
