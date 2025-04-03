import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import { MinusOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import TextArea from "antd/lib/input/TextArea";

import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import GetLocationMapComponent from "../Maps/GetLocationMapComponent";
import moment from "moment";
import { getBase64 } from "../../Definitions/Definitions/programme.definitions";
import { RcFile } from "antd/lib/upload";
import { PURPOSE_CREDIT_DEVELOPMENT } from "../AddNewProgramme/ProgrammeCreationComponent";
import LabelWithTooltip, {
  TooltipPostion,
} from "../LabelWithTooltip/LabelWithTooltip";
import { CMASectoralScope } from "../../Definitions/Enums/programmeStage.enum";
import { API_PATHS } from "../../Config/apiConfig";
import { CustomStepsProps } from "./StepProps";

const DescriptionOfProjectActivity = (props: CustomStepsProps) => {
  const {
    next,
    prev,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    disableFields,
  } = props;

  const maximumImageSize = import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE)
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
  // const [dsDivisions, setDsDivisions] = useState<{ [key: number]: string[] }>({});
  const [cities, setCities] = useState<{ [key: number]: string[] }>({});

  const getProvinces = async () => {
    try {
      const { data } = await post(API_PATHS.PROVINCES);
      const tempProvinces = data.map(
        (provinceData: any) => provinceData.provinceName
      );
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
            key: "provinceName",
            operation: "=",
            value: provinceName,
          },
        ],
      });
      const tempDistricts = data.map(
        (districtData: any) => districtData.districtName
      );
      setDistricts((prev1) => ({ ...prev1, [index]: tempDistricts }));
    } catch (error) {
      console.log(error);
    }
  };

  // const getDivisions = async (districtName: string, index: number) => {
  //   try {
  //     const { data } = await post(API_PATHS.DIVISION, {
  //       filterAnd: [
  //         {
  //           key: 'districtName',
  //           operation: '=',
  //           value: districtName,
  //         },
  //       ],
  //     });

  //     const tempDivisions = data.map((divisionData: any) => divisionData.divisionName);
  //     setDsDivisions((prev2) => ({ ...prev2, [index]: tempDivisions }));
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const getCities = async (division: string, index: number) => {
    try {
      const { data } = await post(API_PATHS.CITIES, {
        filterAnd: [
          {
            key: "districtName",
            operation: "=",
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

  // const onDivisionSelect = (value: string, index: number) => {
  //   getCities(value, index);
  // };

  // useEffect(() => {
  //   form.setFieldValue('projectParticipants', [
  //     { partiesInvolved: '', projectParticipant: '' },
  //     { partiesInvolved: '', projectParticipant: '' },
  //   ]);
  // }, []);

  const calculateAvgAnnualERs = () => {
    const totalEstimatedGHGERs =
      form.getFieldValue("totalEstimatedGHGERs") || 0;
    const totalCreditingYears = form.getFieldValue("totalCreditingYears") || 0;
    if (
      Number(totalCreditingYears) === 0 ||
      Number(totalEstimatedGHGERs) === 0
    ) {
      return;
    } else {
      const avg = Number(totalEstimatedGHGERs) / Number(totalCreditingYears);
      form.setFieldValue("avgAnnualERs", avg);
    }
  };

  const onEmissionsValueChange = (value?: any) => {
    const val1 = form.getFieldValue("estimatedAnnualGHGEmissionsValue") || 0;
    const listVals = form.getFieldValue("extraGHGEmmissions");
    let tempTotal = Number(val1);
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        tempTotal += Number(item?.estimatedAnnualGHGEmissionsValue);
      });
    }
    form.setFieldValue("totalEstimatedGHGERs", String(tempTotal));
    calculateAvgAnnualERs();
  };

  const handleCreditingPeriodDateChange = () => {
    const startDate = form.getFieldValue("creditingPeriodStartDate");
    const endDate = form.getFieldValue("creditingPeriodEndDate");

    if (startDate && endDate) {
      const startYear = moment(startDate).year();
      const endYear = moment(endDate).year();
      const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      );

      form.setFieldsValue({
        extraGHGEmmissions: years.map((year) => ({
          estimatedAnnualGHGEmissionsYear: moment().year(year),
          estimatedAnnualGHGEmissionsValue: "",
        })),
        totalCreditingYears: years.length,
        totalEstimatedGHGERs: 0,
        avgAnnualERs: 0,
      });
      calculateAvgAnnualERs();
    }
  };

  const onFinish = async (values: any) => {
    console.log('--------------projectParticipants-----------', values?.projectParticipants);
    const tempValues: any = {
      introduction: values?.introduction,
      // sectoralScope: values?.sectoralScope,
      // projectProponent: {
      //   organizationName: values?.organizationName,
      //   email: values?.email,
      //   contactPerson: values?.contactPerson,
      //   title: values?.title,
      //   telephone: values?.telephone,
      //   address: values?.address,
      // },
      // otherEntities: (function () {
      //   const tempList: any[] = [];
      //   const firstObj = {
      //     orgainzationName: values?.entityOrganizationName,
      //     email: values?.entityEmail,
      //     title: values?.entityTitle,
      //     contactPerson: values?.entityContactPerson,
      //     role: values?.entityRoleInTheProject,
      //     telephone: values?.entityTelephone,
      //     address: values?.entityAddress,
      //   };

      //   tempList.push(firstObj);
      //   if (values?.extraOtherEntities) {
      //     values.extraOtherEntities.forEach((item: any) => {
      //       const tempObj = {
      //         organizationName: item?.organizationName,
      //         email: item?.email,
      //         contactPerson: item?.contactPerson,
      //         title: item?.title,
      //         role: item?.roleInTheProject,
      //         telephone: item?.telephone,
      //         address: item?.address,
      //       };

      //       tempList.push(tempObj);
      //     });
      //   }

      //   return tempList;
      // })(),
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
                  const temp = await getBase64(
                    docs[i]?.originFileObj as RcFile
                  );
                  base64Docs.push(temp); // No need for Promise.resolve
                }
              }
            }

            return base64Docs;
          })(),
          projectFundings: values?.projectFundings,
          startDate: moment(values?.projectStartDate).startOf("day").unix(),
          commissioningDate: moment(values?.projectCommisionDate)
            .startOf("day")
            .unix(),
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
                      const temp = await getBase64(
                        docs[i]?.originFileObj as RcFile
                      );
                      base64Docs.push(temp); // No need for Promise.resolve
                    }
                  }
                }

                return base64Docs;
              })(),
              projectFundings: item?.projectFundings,
              startDate: moment(item?.projectStartDate).startOf("day").unix(),
              commissioningDate: moment(item?.projectCommisionDate)
                .startOf("day")
                .unix(),
            };

            tempList.push(tempObj);
          });
        }
        return tempList;
      })(),
      projectParticipants: values?.projectParticipants,
      technologies: values?.technologies,
      publicFundingOfProjectActivity: values?.publicFundingOfProjectActivity,
      histroyOfProjectActivity: values?.histroyOfProjectActivity,
      unbundling: values?.unbundling,
      // projectOwnership: values?.projectOwnership,
      // projectTrack: form.getFieldValue('projectTrack'),
      // creditingPeriodStartDate: moment(values?.creditingPeriodStartDate).startOf('day').unix(),
      // creditingPeriodEndDate: moment(values?.creditingPeriodEndDate).startOf('day').unix(),
      // creditingPeriodDescription: values?.creditingPeriodDescription,
      // projectScaleType: values?.projectScale,
      // estimatedAnnualGHGEmissions: (function () {
      //   const tempList: any = [];

      //   if (values?.extraGHGEmmissions) {
      //     values?.extraGHGEmmissions.forEach((item: any) => {
      //       const tempObj = {
      //         year: moment(item?.estimatedAnnualGHGEmissionsYear).startOf('year').unix(),
      //         ghgEmissionReduction: Number(item?.estimatedAnnualGHGEmissionsValue),
      //       };

      //       tempList.push(tempObj);
      //     });
      //   }

      //   return tempList;
      // })(),
      // totalEstimatedGHGERs: Number(values?.totalEstimatedGHGERs),
      // totalCreditingYears: Number(values?.totalCreditingYears),
      // avgAnnualERs: Number(values?.avgAnnualERs),
      // description: values?.projectActivityDescription,
      // additionalDocuments: await (async function () {
      //   const base64Docs: string[] = [];

      //   if (
      //     values?.optionalProjectActivityDocuments &&
      //     values?.optionalProjectActivityDocuments.length > 0
      //   ) {
      //     const docs = values.optionalProjectActivityDocuments;
      //     for (let i = 0; i < docs.length; i++) {
      //       if (docs[i]?.originFileObj === undefined) {
      //         base64Docs.push(docs[i]?.url);
      //       } else {
      //         const temp = await getBase64(docs[i]?.originFileObj as RcFile);
      //         base64Docs.push(temp); // No need for Promise.resolve
      //       }
      //     }
      //   }

      //   return base64Docs;
      // })(),
      // conditionsPriorToProjectInitiation: values?.conditionsPriorToProjectInitiation,
      // complianceWithLaws: values?.complianceWithLaws,
      // participationUnderOtherGHGPrograms: values?.participationPrograms,
      // otherFormsOfCredit: values?.otherFormsOfCredit,
      // sustainableDevelopment: values?.sustainableDevelopment,
      // leakageManagement: values?.leakageManagement,
      // commerciallySensitiveInfo: values?.commerciallySensitiveInformation,
    };

    handleValuesUpdate({ projectActivity: tempValues });
  };

  console.log("---------form values------------", form.getFieldsValue());

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
                  label={`${t("PDD:projectActivity")}`}
                  required={true}
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
                          String(value).trim() === "" ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(
                            `${t("PDD:projectActivity")} ${t("isRequired")}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    // placeholder={`${t('PDD:projectActivityPlaceholder')}`}
                    disabled={disableFields}
                  />
                </Form.Item>
              </>

              <>
                <h4
                  className="form-section-title"
                  style={{ color: "#3A3541CC", fontWeight: "500" }}
                >{`${t("PDD:projectActivityLocations")}`}</h4>

                <div className="form-section">
                  <Row
                    // justify={'space-between'}
                    gutter={[40, 16]}
                    style={{ borderRadius: "8px" }}
                  >
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t("PDD:locationOfProjectActivity")}
                        name="locationOfProjectActivity"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:locationOfProjectActivity")} ${t(
                                    "isRequired"
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
                        label={t("PDD:siteNo")}
                        name="siteNo"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:siteNo")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t("PDD:province")}
                        name="province"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:province")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          onChange={(value) => onProvinceSelect(value, 0)}
                          // placeholder={t('PDD:provincePlaceholder')}
                          disabled={disableFields}
                        >
                          {provinces.map((province: string, index: number) => (
                            <Select.Option
                              value={province}
                              key={province + index}
                            >
                              {province}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label={t("PDD:district")}
                        name="district"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:district")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          // placeholder={t('PDD:districtPlaceholder')}
                          onSelect={(value) => onDistrictSelect(value, 0)}
                          disabled={disableFields}
                        >
                          {districts[0]?.map(
                            (district: string, index: number) => (
                              <Select.Option
                                key={district + index}
                                value={district}
                              >
                                {district}
                              </Select.Option>
                            )
                          )}
                        </Select>
                      </Form.Item>
                      {/* <Form.Item
                        label={t('PDD:dsDivision')}
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
                                throw new Error(`${t('PDD:dsDivision')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={t('PDD:dsDivisionPlaceholder')}
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
                        label={t("PDD:city")}
                        name="city"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:city")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Select
                          size="large"
                          // placeholder={t('PDD:cityPlaceholder')}
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
                        label={t("PDD:community")}
                        name="community"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:community")} ${t("isRequired")}`
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
                        label={t("PDD:setLocation")}
                        name="location"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:location")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <GetLocationMapComponent
                          form={form}
                          formItemName={"location"}
                          existingCordinate={form.getFieldValue("location")}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:uploadImages")}
                        name="optionalImages"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        required={false}
                        rules={[
                          {
                            validator: (_, value) => {
                              if (
                                value &&
                                value.some(
                                  (file: any) => file?.size / 1024 / 1024 >= 2
                                )
                              ) {
                                return Promise.reject(
                                  "Maximum upload file size is 2MB"
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Upload
                          accept=".png, .jpg, .svg"
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
                            {t("PDD:upload")}
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
                                disabled={disableFields}
                                icon={<MinusOutlined />}
                              >
                                {/* Remove Entity */}
                              </Button>
                            </Form.Item>
                          </div>
                          <div className="form-section">
                            <Row
                              justify={"space-between"}
                              gutter={[40, 16]}
                              style={{ borderRadius: "8px" }}
                            >
                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t("PDD:locationOfProjectActivity")}
                                  name={[name, "locationOfProjectActivity"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t(
                                              "PDD:locationOfProjectActivity"
                                            )} ${t("isRequired")}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    disabled={disableFields}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label={t("PDD:siteNo")}
                                  name={[name, "siteNo"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:siteNo")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    disabled={disableFields}
                                  />
                                </Form.Item>

                                <Form.Item
                                  label={t("PDD:province")}
                                  name={[name, "province"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:province")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    onChange={(value) =>
                                      onProvinceSelect(value, name + 1)
                                    }
                                    // placeholder={t('PDD:provincePlaceholder')}
                                    disabled={disableFields}
                                  >
                                    {provinces.map(
                                      (province: string, index: number) => (
                                        <Select.Option
                                          value={province}
                                          key={name + province + index}
                                        >
                                          {province}
                                        </Select.Option>
                                      )
                                    )}
                                  </Select>
                                </Form.Item>

                                <Form.Item
                                  label={t("PDD:district")}
                                  name={[name, "district"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:district")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('PDD:districtPlaceholder')}
                                    onSelect={(value) =>
                                      onDistrictSelect(value, name + 1)
                                    }
                                    disabled={disableFields}
                                  >
                                    {districts[name + 1]?.map(
                                      (district: string, index: number) => (
                                        <Select.Option
                                          key={name + district + index}
                                          value={district}
                                        >
                                          {district}
                                        </Select.Option>
                                      )
                                    )}
                                  </Select>
                                </Form.Item>
                                {/* <Form.Item
                                  label={t('PDD:dsDivision')}
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
                                            `${t('PDD:dsDivision')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    placeholder={t('PDD:dsDivisionPlaceholder')}
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
                                  label={t("PDD:city")}
                                  name={[name, "city"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:city")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    size="large"
                                    // placeholder={t('PDD:cityPlaceholder')}
                                    disabled={disableFields}
                                  >
                                    {cities[name + 1]?.map(
                                      (city: string, index: number) => (
                                        <Select.Option
                                          value={city}
                                          key={name + city + index}
                                        >
                                          {city}
                                        </Select.Option>
                                      )
                                    )}
                                  </Select>
                                </Form.Item>
                                <Form.Item
                                  label={t("PDD:community")}
                                  name={[name, "community"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:community")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    size="large"
                                    disabled={disableFields}
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={12} md={24}>
                                <Form.Item
                                  label={t("PDD:setLocation")}
                                  name={[name, "location"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: ``,
                                    },
                                    {
                                      validator: async (rule, value) => {
                                        if (
                                          String(value).trim() === "" ||
                                          String(value).trim() === undefined ||
                                          value === null ||
                                          value === undefined
                                        ) {
                                          throw new Error(
                                            `${t("PDD:location")} ${t(
                                              "isRequired"
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <GetLocationMapComponent
                                    form={form}
                                    formItemName={[name, "location"]}
                                    listName="extraLocations"
                                    disabled={disableFields}
                                    existingCordinate={
                                      form?.getFieldValue("extraLocations")[
                                        name
                                      ]?.location
                                    }
                                  />
                                </Form.Item>
                              </Col>

                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t("PDD:uploadImages")}
                                  name={[name, "optionalImages"]}
                                  valuePropName="fileList"
                                  getValueFromEvent={normFile}
                                  required={false}
                                  rules={[
                                    {
                                      validator: (_, value) => {
                                        if (
                                          value &&
                                          value.some(
                                            (file: any) =>
                                              file?.size / 1024 / 1024 >= 2
                                          )
                                        ) {
                                          return Promise.reject(
                                            "Maximum upload file size is 2MB"
                                          );
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Upload
                                    accept=".png, .jpg, .svg"
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

              <>
                {/* <h4 className="form-section-title custom-required">{`1.12 ${t(
                  'PDD:scaleOfProjectAndEstimatedEmission'
                )}`}</h4>

                <Row>
                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('PDD:selectyourProjectScale')}
                      name="projectScale"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:required')}`,
                        },
                      ]}
                    >
                      <Radio.Group className="radio-btn-flex-row" disabled={disableFields}>
                        <Radio value="MICRO">{t('PDD:micro')}</Radio>
                        <Radio value="SMALL">{t('PDD:small')}</Radio>
                        <Radio value="LARGE">{t('PDD:large')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row> */}

                {/* Estimated Annual GHG Emissions Years Start */}
                {/* <div className="annualGHGEmissions"> */}
                {/* <Form.List name="extraGHGEmmissions">
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
                                      message: `${t('PDD:required')}`,
                                    },
                                  ]}
                                >
                                  <DatePicker size="large" picker="year" disabled />
                                </Form.Item>
                              </Col>
                              <Col md={10}>
                                <p className="list-item-title">
                                  {t('PDD:estimatedGHGEmissionsReductions')}
                                </p>
                              </Col>
                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'estimatedAnnualGHGEmissionsValue']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('PDD:required')}`,
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
                  </Form.List> */}

                {/* <Row gutter={15}>
                    <Col xl={16}>
                      <p>{t('PDD:totalEstimatedERs')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'totalEstimatedGHGERs'}
                        rules={[
                          {
                            required: true,
                            message: `${t('PDD:required')}`,
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
                      <p>{t('PDD:totalNumberOfCreditingYears')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'totalCreditingYears'}
                        rules={[
                          {
                            required: true,
                            message: `${t('PDD:required')}`,
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
                      <p>{t('PDD:averageAnnualERs')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'avgAnnualERs'}
                        rules={[
                          {
                            required: true,
                            message: `${t('PDD:required')}`,
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
                  </Row> */}
                {/* </div> */}
                {/* Estimated Annual GHG Emissions Years End */}
              </>

              {/* <>
                <LabelWithTooltip
                  label={` ${t('PDD:descriptionOfTheProjectActivity')}`}
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
                            `${t('PDD:descriptionOfTheProjectActivity')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={`${t('PDD:descriptionOfTheProjectActivityPlaceholder')}`}
                    disabled={disableFields}
                  />
                </Form.Item>
              </> */}

              {/* <Form.Item
                label={t('PDD:additionalDocuments')}
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
                    {t('PDD:upload')}
                  </Button>
                </Upload>
              </Form.Item> */}

              <Form.Item
                label={`${t("PDD:technologies")}`}
                name="technologies"
                className="half-width-form-item"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:technologies")} ${t("isRequired")}`
                        );
                      }
                    },
                  },
                ]}
              >
                <Input size="large" disabled={disableFields} />
              </Form.Item>

              {/* project participant table start */}
              {/* need to check again */}
              <h4 className="form-section-title">
                {t("PDD:projectParticipantTable")}
              </h4>
              <div className="projectParticipantsTable">
                <div className="header">
                  <div className="col-1">{t('PDD:partiesInvolved')}</div>
                  <div className="col-2">{t('PDD:projectParticipant')}</div>
                  <div className="col-3"></div>
                </div>

                <div className="data-body">
                  <Form.List name="projectParticipants">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restFields }) => (
                          <div className="row" key={key}>
                            <div className="col-1">
                              <Form.Item
                                name={[name, "partiesInvolved"]}
                                rules={[
                                  {
                                    required: true,
                                    message: ``,
                                  },
                                  {
                                    validator: async (rule, value) => {
                                      if (
                                        String(value).trim() === "" ||
                                        String(value).trim() === undefined ||
                                        value === null ||
                                        value === undefined
                                      ) {
                                        throw new Error(
                                          `${t("PDD:partiesInvolved")} ${t(
                                            "isRequired"
                                          )}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input disabled={disableFields} />
                              </Form.Item>
                            </div>
                            <div className="col-2">
                              <Form.List name={[name, "projectParticipants"]}>
                                {(
                                  fields2,
                                  {
                                    add: addParticipants,
                                    remove: removeParticipants,
                                  }
                                ) => (
                                  <div
                                    key={key + name}
                                    className="participant-row"
                                  >
                                    {fields2.map(
                                      ({ key: key2, name: name2 }) => (
                                        <div className="participant-col">
                                          <Form.Item
                                            name={[name2, "participant"]}
                                            className="participant-form-item"
                                            rules={[
                                              {
                                                required: true,
                                                message: ``,
                                              },
                                              {
                                                validator: async (
                                                  rule,
                                                  value
                                                ) => {
                                                  if (
                                                    String(value).trim() ===
                                                      "" ||
                                                    String(value).trim() ===
                                                      undefined ||
                                                    value === null ||
                                                    value === undefined
                                                  ) {
                                                    throw new Error(
                                                      `${t(
                                                        "PDD:projectParticipant"
                                                      )} ${t("isRequired")}`
                                                    );
                                                  }
                                                },
                                              },
                                            ]}
                                          >
                                            <Input disabled={disableFields} />
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
                                              disabled={disableFields}
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
                                      )
                                    )}
                                  </div>
                                )}
                              </Form.List>
                            </div>
                            <div className="col-3">
                              {key !== 0 && (
                                <Form.Item>
                                  <Button
                                    onClick={() => {
                                      console.log('------remove key---------', key);
                                      remove(name);
                                    }}
                                    icon={<MinusOutlined />}
                                    size="large"
                                    className="addMinusBtn"
                                    disabled={disableFields}
                                  />
                                </Form.Item>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="mg-top-1" style={{ marginTop: "15px" }}>
                          <Form.Item>
                            <Button
                              onClick={() => {
                                // add();
                                const temp = form.getFieldValue(
                                  "projectParticipants"
                                );
                                console.log("---------temp--------", temp);
                                temp[fields.length] = {
                                  partiesInvolved: "",
                                  projectParticipants: [{ participant: "" }],
                                };
                                console.log(
                                  "---------temp after--------",
                                  temp
                                );
                                form.setFieldValue("projectParticipants", temp);
                              }}
                              disabled={disableFields}
                            >
                              {t("PDD:addProjectParticipant")}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
              {/* project participant table end */}

              <Form.Item
                label={`${t("PDD:publicFundingOfProjectActivity")}`}
                name="publicFundingOfProjectActivity"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:publicFundingOfProjectActivity")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  disabled={disableFields}
                  // placeholder={`${t('PDD:commerciallySensitiveInformationPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`${t("PDD:histroyOfProjectActivity")}`}
                name="histroyOfProjectActivity"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:histroyOfProjectActivity")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label={`${t("PDD:unbundling")}`}
                name="unbundling"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:unbundling")} ${t("isRequired")}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              <Row justify={"end"} className="step-actions-end">
                <Button danger size={"large"} onClick={prev}>
                  {t("PDD:prev")}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t("PDD:next")}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={"large"}
                    htmlType={"submit"}
                    // onClick={next}
                  >
                    {t("PDD:next")}
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
