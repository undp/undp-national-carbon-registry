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
    formMode,
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
    const approverSignature = (await fileUploadValueExtract(values, 'approveSignature'))[0];
    const projectDetailsFormValues = {
      titleOfTheProjectActivity: values?.titleOfTheProjectActivity,
      versionNumberValidationReport: values?.versionNumberValidationReport,
      versionNumberPDD: values?.versionNumberPDD,
      projectParticipants: values?.projectParticipants,
      projectScale: values?.projectScale,
      appliedMethodologies: values?.appliedMethodologies,
      titleOfSpecificCase: values?.titleOfSpecificCase,
      completionDate: values?.completionDate,
      pddUploadedGlobalStakeholderConsultation: values?.pddUploadedGlobalStakeholderConsultation,
      hostParty: values?.hostParty,
      mandatarySectoralScopes: values?.mandatarySectoralScopes,
      annualAverageGHGReduction: values?.annualAverageGHGReduction,
      approverSignature: approverSignature,
      locationsOfProjectActivity: await (async function () {
        const tempList: any[] = [];
        const firstObj = {
          locationOfProjectActivity: values?.locationOfProjectActivity,
          siteNo: values?.siteNo,
          province: values?.province,
          district: values?.district,
          // dsDivision: values?.dsDivision,
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
              siteNo: item?.siteNo,
              province: item?.province,
              district: item?.district,
              // dsDivision: item?.dsDivision,
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
      // client: values?.client,
      // dateOfIssue: moment(values?.dateOfIssue).valueOf(),
      // versionNo: values?.versionNo,
      // versionDate: moment(values?.versionDate).valueOf(),
      // address: values?.address,
      // telephone: values?.telephone,
      // email: values?.email,
      // website: values?.website,
      // summary: values?.summary,
      // projectTitle: values?.projectTitle,
      // workCarriedOutBy: values?.workCarriedOutBy,
      // workApprovedBy: values?.workApprovedBy,
      // reportNo: values?.reportNo,
    };

    console.log(ProcessSteps.VR_PROJECT_DETAILS, projectDetailsFormValues);

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
                              required: true,
                              message: `${t('validationReport:titleOfTheProjectActivity')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:versionNumberValidationReport')}
                          name="versionNumberValidationReport"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:versionNumberValidationReport')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:versionNumberPDD')}
                          name="versionNumberPDD"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:versionNumberPDD')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:projectParticipants2')}
                          name="projectParticipants"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:projectParticipants2')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
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
                          <Radio.Group className="project-scale-radio-btns">
                            <Radio value="smallScale">{t('validationReport:smallScale')}</Radio>
                            <Radio value="largeScale">{t('validationReport:largeScale')}</Radio>
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
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:conditionalSectoralScopes')}
                          name="conditionalSectoralScopes"
                        >
                          <Input size="large" />
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
                        <Input size="large" />
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
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:hostParty')}
                        name="hostParty"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:hostParty')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:mandatarySectoralScopes')}
                        name="mandatarySectoralScopes"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:mandatarySectoralScopes')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:annualAverageGHGReduction')}
                        name="annualAverageGHGReduction"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:annualAverageGHGReduction')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              {/* Approver and Independent Certifier start */}
              <>
                <Row justify={'space-between'} gutter={[40, 16]}>
                  {/* Approver start */}
                  <Col md={24} xl={12}>
                    <h4 className="form-section-heading">
                      {t('validationReport:validationReportApproverSectionTitle')}
                    </h4>
                    <Form.Item
                      label={t('validationReport:approverName')}
                      name="approverName"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:approverName')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('validationReport:approverPosition')}
                      name="approverPosition"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:approverPosition')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      name="approverSignature"
                      label={t('validationReport:signature')}
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      // required={true}
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:signature')}  ${t('isRequired')}`,
                        },
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
                        maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          {t('validationReport:upload')}
                        </Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  {/* Approver end */}

                  {/* Independent Certifier start */}
                  <Col md={24} xl={12}>
                    <h4 className="form-section-heading">
                      {t('validationReport:independentCertifierSectionTitle')}
                    </h4>
                    <Form.Item
                      label={t('validationReport:certifierName')}
                      name="certifierName"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:certifierName')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('validationReport:UNFCCReferenceNo')}
                      name="UNFCCReferenceNo"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:UNFCCReferenceNo')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  {/* Independent Certifier end */}
                </Row>
              </>
              {/* Approver and Independent Certifier end */}

              {/* Crediting Period  start */}
              <>
                <Row gutter={[40, 16]} justify={'space-between'}>
                  <Col md={24} xl={12}>
                    <Form.Item
                      label={t('validationReport:creditingPeriod')}
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
                  </Col>

                  <Col md={24} xl={12}>
                    <LabelWithTooltip
                      label={t('validationReport:startDateofCreditingPeriod')}
                      required={true}
                    />
                    <div className="crediting-period-duration">
                      <Form.Item
                        // label={t('validationReport:creditingPeriod')}
                        name="creditingPeriodStart"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker size="large" />
                      </Form.Item>
                      <p className="crediting-period-duration-to">to</p>
                      <Form.Item
                        // label={t('validationReport:creditingPeriod')}
                        name="creditingPeriodStart"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:creditingPeriod')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker size="large" />
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
                        <Input
                          size="large"
                          // disabled={disableFields}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:siteNo')}
                        name="siteNo"
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
                        <Input
                          size="large"
                          // disabled={disableFields}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:province')}
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
                                throw new Error(`${t('validationReport:city')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          // placeholder={t('validationReport:cityPlaceholder')}
                          // disabled={disableFields}
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
                        <Input
                          size="large"
                          // disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('validationReport:setLocation')}
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
                          formItemName={'location'}
                          existingCordinate={form.getFieldValue('location')}
                          // disabled={disableFields}
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
                          // disabled={disableFields}
                          // maxCount={1}
                        >
                          <Button
                            className="upload-doc"
                            size="large"
                            icon={<UploadOutlined />}
                            // disabled={disableFields}
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
                                // disabled={disableFields}
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
                                  <Input
                                    size="large"
                                    // disabled={disableFields}
                                  />
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
                                  <Input
                                    size="large"
                                    // disabled={disableFields}
                                  />
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
                                    // disabled={disableFields}
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
                                    // disabled={disableFields}
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
                                    // disabled={disableFields}
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
                                  <Input
                                    size="large"
                                    // disabled={disableFields}
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t('validationReport:setLocation')}
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
                                            `${t('validationReport:location')} ${t('isRequired')}`
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
                                    // disabled={disableFields}
                                    existingCordinate={
                                      form?.getFieldValue('extraLocations')[name]?.location
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
                                    // disabled={disableFields}
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
                            // disabled={disableFields}
                          >
                            {/* Add Entity */}
                          </Button>
                        </Form.Item>
                      </div>
                    </>
                  )}
                </Form.List>
              </>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} disabled={false} onClick={prev}>
                  {t('validationReport:cancel')}
                </Button>
                <Button type="primary" size={'large'} disabled={false} htmlType="submit">
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

export default BasicInformation;
