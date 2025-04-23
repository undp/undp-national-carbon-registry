import { useEffect, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Steps,
  Upload,
  message,
} from "antd";
import {
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import "./ProgrammeCreationComponent.scss";
import moment from "moment";
import TextArea from "antd/lib/input/TextArea";
import { isValidateFileType } from "../../Utils/DocumentValidator";
import { DocType } from "../../Definitions/Enums/document.type";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { getBase64 } from "../../Definitions/Definitions/programme.definitions";
import { RcFile } from "antd/lib/upload";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import GetMultipleLocationsMapComponent from "../Maps/GetMultipleLocationsMapComponent";
import { Loading } from "../Loading/loading";
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from "react-phone-number-input";
import InfDocumentInformation from "./infDocumentInfo";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { SectoralScope } from "../../Definitions/Enums/sectoralScope.enum";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import ConfirmSubmitSVG from "../../Assets/DialogIcons/ConfirmSubmit.svg";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { mapBase64ToFields } from "../../Utils/mapBase64ToFields";
import validator from "validator";
import { toMoment } from "../../Utils/convertTime";

type SizeType = Parameters<typeof Form>[0]["size"];

const maximumImageSize = import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE
  ? parseInt(import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE)
  : 5000000;

export const PROJECT_GEOGRAPHY: { [key: string]: string } = {
  SINGLE: "Single Location",
  MULTIPLE: "Scattered in multiple locations",
};

const PROJECT_CATEGORIES: { [key: string]: string } = {
  RENEWABLE_ENERGY: "Renewable Energy",
  AFFORESTATION: "Afforestation",
  REFORESTATION: "Reforestation",
  OTHER: "Other",
};

const PROJECT_STATUS: { [key: string]: string } = {
  PROPOSAL_STAGE: "Proposal Stage",
  PROCUREMENT_STAGE: "Procurement",
  CONSTRUCTION_STAGE: "Construction",
  INSTALLATION_STAGE: "Installation",
};

export const PURPOSE_CREDIT_DEVELOPMENT: { [key: string]: string } = {
  TRACK_1: "Track 1",
  TRACK_2: "Track 2",
};

export const INF_SECTOR: { [key: string]: string } = {
  ENERGY: 'Energy',
  AGRICULTURE: 'Agriculture',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  TRANSPORT: 'Transport',
  MANUFACTURING: 'Manufacturing',
  HOSPITALITY: 'Hospitality',
  FORESTRY: 'Forestry',
  WASTE: 'Waste',
  OTHER: 'Other',
};

export const INF_SECTORAL_SCOPE: { [key: string]: string } = {
  ENERGY_INDUSTRIES: 'Energy Industries (Renewable – / Non-Renewable Sources) ',
  ENERGY_DISTRIBUTION: 'Energy Distribution',
  ENERGY_DEMAND: 'Energy Demand',
  AGRICULTURE: 'Agriculture',
  AFFORESTATION_AND_REFORESTATION: 'Afforestation and Reforestation',
  MANUFACTURING_INDUSTRIES: 'Manufacturing Industries',
  CHEMICAL_INDUSTRIES: 'Chemical Industries',
  METAL_PRODUCTION: 'Metal Production',
  TRANSPORT: 'Transport',
  WASTE_FROM_FUELS: 'Fugitive Emissions from Fuels (Solid, Oil and Gas) ',
  WASTE_HANDLING_AND_DISPOSAL: 'Waste Handling and Disposal',
  CONSTRUCTION: 'Construction',
  MINING_MINERAL_PRODUCTION: 'Mining/Mineral Production',
  FUGITIVE_EMISSIONS_PRODUCTION:
    'Fugitive Emissions from Production and Consumption of Halocarbons and Sulphur Hexafluoride',
  SOLVENT_USE: 'Solvent Use',
};

const SECTOR_TO_SCOPES_MAP: { [key: string]: string[] } = {
  ENERGY: ['ENERGY_INDUSTRIES', 'ENERGY_DISTRIBUTION', 'ENERGY_DEMAND'],
  AGRICULTURE: ['AGRICULTURE'],
  FORESTRY: ['AFFORESTATION_AND_REFORESTATION'],
  MANUFACTURING: ['MANUFACTURING_INDUSTRIES', 'CHEMICAL_INDUSTRIES', 'METAL_PRODUCTION'],
  TRANSPORT: ['TRANSPORT'],
  WASTE: ['WASTE_HANDLING_AND_DISPOSAL', 'WASTE_FROM_FUELS'],
  OTHER: [
    'CONSTRUCTION',
    'MINING_MINERAL_PRODUCTION',
    'FUGITIVE_EMISSIONS_PRODUCTION',
    'SOLVENT_USE',
  ],
};

export const ProgrammeCreationComponent = (props: any) => {
  const { translator } = props;
  const [current, setCurrent] = useState<number>(0);
  const navigate = useNavigate();

  const { id } = useParams();
  const { state } = useLocation();

  const { post, get } = useConnection();
  const [form] = Form.useForm();
  // const [values, setValues] = useState<any>(undefined);

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [isMultipleLocations, setIsMultipleLocations] =
    useState<boolean>(false);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [independentCertifiers, setIndependentCertifiers] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [countries, setCountries] = useState<[]>([]);
  const [isCountryListLoading, setIsCountryListLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>();
  const [formValues, setFormValues] = useState<any>(undefined);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const closeDialog = () => {
    setShowDialog(false);
  };

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

  const getDistricts = async (provinceName: string) => {
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
      setDistricts(tempDistricts);
    } catch (error) {
      console.log(error);
    }
  };

  const getCities = async (division?: string) => {
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
      setCities(tempCities);
    } catch (error) {
      console.log(error);
    }
  };

  const getPostalCodes = async (city?: string) => {
    try {
      const { data } = await post(API_PATHS.POSTALCODE, {
        filterAnd: [
          {
            key: "cityName",
            operation: "=",
            value: city,
          },
        ],
      });

      const tempPcs = data.map((pcData: any) => pcData.postalCode);
      setPostalCodes(tempPcs);
    } catch (error) {
      console.log(error);
    }
  };

  const getCountryList = async () => {
    setIsCountryListLoading(true);
    try {
      const response = await get(API_PATHS.COUNTRIES);
      if (response.data) {
        const alpha2Names = response.data.map((item: any) => {
          return item.alpha2;
        });
        setCountries(alpha2Names);
      }
    } catch (error: any) {
      console.log("Error in getCountryList", error);
      message.open({
        type: "error",
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setIsCountryListLoading(false);
    }
  };

  const getIndependentCertifiers = async () => {
    setOrganizationsLoading(true);
    try {
      const response = await post(API_PATHS.ORGANIZATION_BY_TYPE, {
        companyRole: CompanyRole.INDEPENDENT_CERTIFIER,
      });
      if (response.data) {
        setIndependentCertifiers(response.data);
      }
    } catch (error: any) {
      console.log("Error in getCountryList", error);
      message.open({
        type: "error",
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const getOrganizationDetails = async () => {
    try {
      setLoading(true);
      const { data } = await get(API_PATHS.USER_PROFILE_DETAILS);
      if (data && data?.Organisation) {
        form.setFieldsValue({
          projectParticipant: data?.Organisation?.name,
          contactAddress: data?.Organisation?.address,
          contactEmail: data?.Organisation?.email,
          contactWebsite: data?.Organisation?.website,
          contactPhoneNo: data?.Organisation?.phoneNo,
          contactFax: data?.Organisation?.faxNo,
          contactName: data?.user?.name,
        });
      }
    } catch (error) {
      console.log("Error in getOrganizationDetails", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToProjectDetailsPageOnView = () => {
    if (id) {
      navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
    }
  };

  useEffect(() => {
    if (state?.mode === null || state?.mode === undefined) {
      getProvinces();
      getCountryList();
      getIndependentCertifiers();
      getOrganizationDetails();
    }
  }, []);

  const onProvinceSelect = async (value: any) => {
    getDistricts(value);
    try {
    } catch (error) {}
  };

  const onDistrictSelect = (value: string) => {
    getCities(value);
  };
  const onCitySelect = (value: string) => {
    getPostalCodes(value);
  };

  const onGeographyOfProjectSelect = (value: string) => {
    if (value === "MULTIPLE") {
      setIsMultipleLocations(true);
    } else {
      setIsMultipleLocations(false);
    }
  };

  // const onProjectCategorySelect = (value: string) => {
  //   setProjectCategory(value);
  // };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const hasValidScopes =
    selectedSector &&
    Array.isArray(SECTOR_TO_SCOPES_MAP[selectedSector]) &&
    SECTOR_TO_SCOPES_MAP[selectedSector].length > 0;

  const t = translator.t;

  useEffect(() => {
    const getViewData = async () => {
      setLoading(true);
      let documentData: any;
      let projectData: any;
      try {
        const res = await post(API_PATHS.QUERY_DOCUMENT, {
          refId: state?.documentId,
          documentType: DocumentEnum.INF,
        });

        if (res?.statusText === "SUCCESS") {
          documentData = res?.data?.data;
        }
      } catch (error) {
        console.log("----------error-----------");
      } finally {
        setLoading(false);
      }

      try {
        const res = await post(API_PATHS.PROGRAMME_BY_ID, {
          programmeId: id,
        });

        if (res?.statusText === "SUCCESS") {
          projectData = res?.data;
          console.log("----------projectData----------", projectData.independentCertifiers, projectData.independentCertifiers.join(","));
        }
      } catch (error) {}

      if (documentData && projectData) {
        const viewData = {
          ...documentData,
          briefProjectDescription: documentData.projectDescription,
          optionalDocuments: mapBase64ToFields(
            documentData?.additionalDocuments
          ),
          projectLocation: documentData.geographicalLocationCoordinates,
          startTime: toMoment(documentData?.startDate),
          independentCertifiers: projectData?.independentCertifiers?.join(","),
        };
        form.setFieldsValue(viewData);
      }
    };

    if (state?.mode === FormMode.VIEW && state?.documentId) {
      setDisableFields(true);
      getViewData();
    }
  }, []);

  const submitForm = async (values: any) => {
    const base64Docs: string[] = [];
    console.log("---------optional docs----------", values?.optionalDocuments);

    if (values?.optionalDocuments && values?.optionalDocuments.length > 0) {
      const docs = values.optionalDocuments;
      for (let i = 0; i < docs.length; i++) {
        const temp = await getBase64(docs[i]?.originFileObj as RcFile);
        base64Docs.push(temp); // No need for Promise.resolve
      }
    }

    const body: any = {
      title: values?.title,
      sector: values?.sector,
      sectoralScope: values?.sectoralScope,
      province: values?.province || "test",
      district: values?.district || "test",
      city: values?.city || "test",
      postalCode: values?.postalCode,
      street: values?.street,
      geographicalLocationCoordinates: values?.projectLocation,
      projectGeography: values?.projectGeography,
      estimatedProjectCost: values?.estimatedProjectCost,
      proposedProjectCapacity: values?.projectCapacity,
      projectStatusDescription: values?.projectStatusDescription,
      speciesPlanted: values?.speciesPlanted,
      projectDescription: values?.briefProjectDescription,
      projectStatus: values?.projectStatus,
      startDate: moment(values?.startTime).startOf("day").unix(),
      additionalDocuments: base64Docs,
      contactName: values?.contactName,
      projectParticipant: values?.projectParticipant,
      contactFax: formatPhoneNumberIntl(values?.contactFax),
      contactAddress: values?.contactAddress,
      contactWebsite: values?.contactWebsite,
      contactEmail: values?.contactEmail,
      contactPhoneNo: formatPhoneNumberIntl(values?.contactPhoneNo),
      independentCertifiers: values?.independentCertifiers,
    };

    setLoading(true);
    try {
      const tempValues = {
        ...{
          name: "INF",
          documentType: DocumentEnum.INF,
        },
        data: {
          ...body,
        },
      };
      console.log('-------------temp vals INF-----------', tempValues);
      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      if (res?.statusText === "SUCCESS") {
        message.open({
          type: "success",
          content: t("addProgramme:programmeCreationSuccess"),
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
        navigate(ROUTES.VIEW_PROGRAMMES);
      }
    } catch (error: any) {
      if (error && error.errors && error.errors.length > 0) {
        error.errors.forEach((err: any) => {
          Object.keys(err).forEach((field) => {
            console.log(`Error in ${field}: ${err[field].join(", ")}`);
            message.open({
              type: "error",
              content: err[field].join(", "),
              duration: 4,
              style: { textAlign: "right", marginRight: 15, marginTop: 10 },
            });
          });
        });
      } else {
        message.open({
          type: "error",
          content: error?.message,
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
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
        <div className="main">
          {t("addProgramme:initalNotificationFormTitle")}
        </div>
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
                    <div className="title">
                      {t("addProgramme:projectDetails")}
                    </div>
                  </div>
                ),
                description: current === 0 && (
                  <div className="programme-details-form-container">
                    <div className="programme-details-form">
                      <ConfirmDialog
                        showDialog={showDialog}
                        Icon={ConfirmSubmitSVG}
                        message={t("addProgramme:confirmModalMessage")}
                        subMessage={t("addProgramme:confirmModalSubMessage")}
                        okText={t("common:yes")}
                        cancelText={t("common:no")}
                        okAction={() => {
                          closeDialog();
                          submitForm(formValues);
                        }}
                        closeDialog={closeDialog}
                        isReject={false}
                      />
                      <Form
                        labelCol={{ span: 20 }}
                        wrapperCol={{ span: 24 }}
                        name="programme-details"
                        className="programme-details-form"
                        layout="vertical"
                        requiredMark={true}
                        form={form}
                        onFinish={(values) => {
                          setShowDialog(true);
                          setFormValues(values);
                        }}
                      >
                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={12} md={24}>
                            <div className="details-part-one">
                              <Form.Item
                                label={t("addProgramme:title")}
                                name="title"
                                rules={[
                                  {
                                    required: true,
                                    message: "",
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
                                          `${t("addProgramme:title")} ${t(
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
                                label={t('addProgramme:sector')}
                                name="sector"
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
                                          `${t('addProgramme:sector')} ${t('isRequired')}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:sectorPlaceholder')}
                                  disabled={disableFields}
                                  onChange={(value) => {
                                    setSelectedSector(value);
                                    const hasScopes = SECTOR_TO_SCOPES_MAP[value]?.length > 0;
                                    form.setFieldsValue({
                                      sectoralScope: hasScopes ? undefined : 'N/A',
                                    });
                                  }}
                                >
                                  {Object.keys(INF_SECTOR).map((key) => (
                                    <Select.Option key={key} value={key}>
                                      {INF_SECTOR[key]}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:sectoralScope")}
                                name="sectoralScope"
                                rules={[
                                  {
                                    required: true,
                                    message: "",
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
                                            "addProgramme:sectoralScope"
                                          )} ${t("isRequired")}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t('addProgramme:sectoralScopePlaceholder')}
                                  disabled={disableFields || !hasValidScopes}
                                >
                                  {(hasValidScopes ? SECTOR_TO_SCOPES_MAP[selectedSector] : []).map(
                                    (key) => (
                                      <Select.Option key={key} value={key}>
                                        {INF_SECTORAL_SCOPE[key]}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>

                              {/* <Row justify="space-between">
                                <Col span={24}>
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
                              </Row> */}

                              {/* {(projectCategory === 'AFFORESTATION' ||
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
                              )} */}

                              {/* {(projectCategory === 'AFFORESTATION' ||
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
                              )} */}

                              <Form.Item
                                label={t("addProgramme:province")}
                                name="province"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t("addProgramme:province")} ${t(
                                      "isRequired"
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  onChange={onProvinceSelect}
                                  placeholder={t(
                                    "addProgramme:provincePlaceholder"
                                  )}
                                  disabled={disableFields}
                                >
                                  {provinces.map(
                                    (province: string, index: number) => (
                                      <Select.Option value={province}>
                                        {province}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:district")}
                                name="district"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t("addProgramme:district")} ${t(
                                      "isRequired"
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    "addProgramme:districtPlaceholder"
                                  )}
                                  onSelect={onDistrictSelect}
                                  disabled={disableFields}
                                >
                                  {districts?.map(
                                    (district: string, index: number) => (
                                      <Select.Option key={district}>
                                        {district}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>
                              {/* <Form.Item
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
                              </Form.Item> */}
                              <Form.Item
                                label={t("addProgramme:city")}
                                name="city"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t("addProgramme:city")} ${t(
                                      "isRequired"
                                    )}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    "addProgramme:cityPlaceholder"
                                  )}
                                  onSelect={onCitySelect}
                                  disabled={disableFields}
                                >
                                  {cities.map((city: string) => (
                                    <Select.Option value={city}>
                                      {city}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t("addProgramme:postalCode")}
                                name="postalCode"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:postalCode"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    "addProgramme:postalCodePlaceholder"
                                  )}
                                  disabled={disableFields}
                                >
                                  {postalCodes.map((postalCode: string) => (
                                    <Select.Option value={postalCode}>
                                      {postalCode}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                              <Form.Item
                                label={t("addProgramme:street")}
                                name="street"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t("addProgramme:street")} ${t(
                                      "isRequired"
                                    )}`,
                                  },
                                  {
                                    whitespace: true,
                                    message: `${t("addProgramme:street")} ${t(
                                      "isRequired"
                                    )}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>
                              <Form.Item
                                label={t("addProgramme:projectGeography")}
                                name="projectGeography"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:projectGeography"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    "addProgramme:projectGeographyPlaceholder"
                                  )}
                                  onChange={onGeographyOfProjectSelect}
                                  disabled={disableFields}
                                >
                                  {Object.keys(PROJECT_GEOGRAPHY).map(
                                    (geography: string) => (
                                      <Select.Option value={geography}>
                                        {PROJECT_GEOGRAPHY[geography]}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:projectStatus")}
                                name="projectStatus"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:projectStatus"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <Select
                                  size="large"
                                  placeholder={t(
                                    "addProgramme:projectStatusPlaceholder"
                                  )}
                                  disabled={disableFields}
                                >
                                  {Object.keys(PROJECT_STATUS).map(
                                    (status: string) => (
                                      <Select.Option value={status}>
                                        {PROJECT_STATUS[status]}
                                      </Select.Option>
                                    )
                                  )}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t(
                                  "addProgramme:projectStatusDescription"
                                )}
                                name={"projectStatusDescription"}
                              >
                                <TextArea rows={4} disabled={disableFields} />
                              </Form.Item>
                            </div>
                          </Col>

                          <Col xl={12} md={24}>
                            <div className="details-part-two">
                              <Form.Item
                                label={t("addProgramme:projectLocation")}
                                name="projectLocation"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:projectLocation"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <GetMultipleLocationsMapComponent
                                  form={form}
                                  formItemName={"projectLocation"}
                                  disableMultipleLocations={
                                    !isMultipleLocations
                                  }
                                  disabled={disableFields}
                                  existingCoordinate={
                                    form.getFieldValue("projectLocation") ||
                                    undefined
                                  }
                                />
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:startTime")}
                                name="startTime"
                                rules={[
                                  {
                                    required: true,
                                    message: "",
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
                                          `${t("addProgramme:startTime")} ${t(
                                            "isRequired"
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
                                    currentDate < moment().startOf("day")
                                  }
                                />
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:independentCertifiers")}
                                name="independentCertifiers"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:independentCertifiers"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <Select
                                  mode="multiple"
                                  disabled={disableFields}
                                  size="large"
                                  maxTagCount={2}
                                  loading={organizationsLoading}
                                  allowClear
                                >
                                  {independentCertifiers.map((ic: any) => (
                                    <Select.Option value={ic.refId}>
                                      {ic.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                label={t("addProgramme:estimatedProjectCost")}
                                name="estimatedProjectCost"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:independentCertifiers"
                                    )} ${t("isRequired")}`,
                                  },
                                  {
                                    whitespace: true,
                                    message: `${t(
                                      "addProgramme:independentCertifiers"
                                    )} ${t("isRequired")}`,
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
                                            t("addProgramme:shouldBeAnNumber")
                                          )
                                        );
                                      }

                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                              >
                                <Input
                                  size={"large"}
                                  disabled={disableFields}
                                />
                              </Form.Item>
                              {/* {projectCategory === 'RENEWABLE_ENERGY' && (
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
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              )} */}

                              <Form.Item
                                label={t(
                                  "addProgramme:briefProjectDescription"
                                )}
                                name="briefProjectDescription"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t(
                                      "addProgramme:briefProjectDescription"
                                    )} ${t("isRequired")}`,
                                  },
                                  {
                                    whitespace: true,
                                    message: `${t(
                                      "addProgramme:briefProjectDescription"
                                    )} ${t("isRequired")}`,
                                  },
                                ]}
                              >
                                <TextArea
                                  rows={4}
                                  placeholder={`${t(
                                    "addProgramme:briefProjectDescriptionPlaceholder"
                                  )}`}
                                  disabled={disableFields}
                                />
                              </Form.Item>

                              <div className="custom-label">{t('addProgramme:documentUpload')}</div>
                              <Form.Item
                                // label={t('addProgramme:documentUpload')}
                                name="optionalDocuments"
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                                required={false}
                                rules={[
                                  {
                                    validator: async (rule, file) => {
                                      for (let i = 0; i < file?.length; i++) {
                                        if (
                                          !isValidateFileType(
                                            file[i]?.type,
                                            DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                          )
                                        ) {
                                          throw new Error(`${t('addProgramme:invalidFileFormat')}`);
                                        } else if (file[i]?.size > maximumImageSize) {
                                          // default size format of files would be in bytes -> 1MB = 1000000bytes
                                          throw new Error(
                                            `${t("common:maxSizeVal")}`
                                          );
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
                                  className="design-upload-section-inf"
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
                                    {t("addProgramme:upload")}
                                  </Button>
                                </Upload>
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>
                        <div className="title contact-person-title mg-bottom-2 mg-top-2">
                          {t("addProgramme:contactPersonTitle")}
                        </div>
                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={12} md={24}>
                            <Form.Item
                              label={t("addProgramme:projectParticipant")}
                              name={"projectParticipant"}
                              rules={[
                                {
                                  required: true,
                                  message: `${t(
                                    "addProgramme:projectParticipant"
                                  )} ${t("isRequired")}`,
                                },
                                {
                                  whitespace: true,
                                  message: `${t(
                                    "addProgramme:projectParticipant"
                                  )} ${t("isRequired")}`,
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>
                            <Form.Item
                              label={t("addProgramme:email")}
                              name="contactEmail"
                              rules={[
                                {
                                  required: true,
                                  message: `${t("addProgramme:email")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                                {
                                  whitespace: true,
                                  message: `${t("addProgramme:email")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                                {
                                  validator: async (rule, value) => {
                                    const val = value.trim();
                                    const reg =
                                      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                    const matches = val.match(reg)
                                      ? val.match(reg)
                                      : [];
                                    if (
                                      val.length > 0 &&
                                      matches.length === 0
                                    ) {
                                      throw new Error(
                                        `${t("addProgramme:email")} ${t(
                                          "isInvalid"
                                        )}`
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
                              label={t("addProgramme:address")}
                              name={"contactAddress"}
                              rules={[
                                {
                                  required: true,
                                  message: `${t("addProgramme:address")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                                {
                                  whitespace: true,
                                  message: `${t("addProgramme:address")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                              ]}
                            >
                              <TextArea rows={6} disabled={disableFields} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={12} md={24}>
                            <Skeleton loading={isCountryListLoading} active>
                              {countries.length > 0 && (
                                <Form.Item
                                  name="contactPhoneNo"
                                  label={t("addProgramme:phoneNo")}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t(
                                        "addProgramme:phoneNo"
                                      )} ${t("isRequired")}`,
                                    },
                                    {
                                      validator: async (
                                        rule: any,
                                        value: any
                                      ) => {
                                        const phoneNo = formatPhoneNumber(
                                          String(value)
                                        );
                                        if (String(value).trim() !== "") {
                                          if (
                                            (String(value).trim() !== "" &&
                                              String(value).trim() !==
                                                undefined &&
                                              value !== null &&
                                              value !== undefined &&
                                              phoneNo !== null &&
                                              phoneNo !== "" &&
                                              phoneNo !== undefined &&
                                              !isPossiblePhoneNumber(
                                                String(value)
                                              )) ||
                                            value?.length > 17
                                          ) {
                                            throw new Error(
                                              `${t("addProgramme:phoneNo")} ${t(
                                                "isInvalid"
                                              )}`
                                            );
                                          }
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <PhoneInput
                                    placeholder={t("addProgramme:phoneNo")}
                                    international
                                    defaultCountry="LK"
                                    countryCallingCodeEditable={false}
                                    onChange={(v) => {}}
                                    countries={countries}
                                    disabled={disableFields}
                                  />
                                </Form.Item>
                              )}
                            </Skeleton>
                          </Col>
                          <Col xl={12} md={24}>
                            <Skeleton loading={isCountryListLoading} active>
                              {countries.length > 0 && (
                                <Form.Item
                                  name="contactFax"
                                  label={t("addProgramme:fax")}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t("addProgramme:fax")} ${t(
                                        "isRequired"
                                      )}`,
                                    },
                                    {
                                      validator: async (
                                        rule: any,
                                        value: any
                                      ) => {
                                        const phoneNo = formatPhoneNumber(
                                          String(value)
                                        );
                                        if (String(value).trim() !== "") {
                                          if (
                                            (String(value).trim() !== "" &&
                                              String(value).trim() !==
                                                undefined &&
                                              value !== null &&
                                              value !== undefined &&
                                              phoneNo !== null &&
                                              phoneNo !== "" &&
                                              phoneNo !== undefined &&
                                              !isPossiblePhoneNumber(
                                                String(value)
                                              )) ||
                                            value?.length > 17
                                          ) {
                                            throw new Error(
                                              `${t("addProgramme:fax")} ${t(
                                                "isInvalid"
                                              )}`
                                            );
                                          }
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <PhoneInput
                                    placeholder={t("addProgramme:phoneNo")}
                                    international
                                    defaultCountry="LK"
                                    countryCallingCodeEditable={false}
                                    onChange={(v) => {}}
                                    countries={countries}
                                    disabled={disableFields}
                                  />
                                </Form.Item>
                              )}
                            </Skeleton>
                          </Col>
                        </Row>

                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={12} md={24}>
                            <Form.Item
                              label={t("addProgramme:website")}
                              name={"contactWebsite"}
                              rules={[
                                {
                                  required: true,
                                  message: `${t("addProgramme:website")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                                {
                                  whitespace: true,
                                  message: `${t("addProgramme:website")} ${t(
                                    "isRequired"
                                  )}`,
                                },
                                {
                                  validator: async (rule, value) => {
                                    if (
                                      value.trim().length > 0 &&
                                      !validator.isURL(value)
                                    )
                                      throw new Error(
                                        `${t("addProgramme:website")} ${t(
                                          "isInvalid"
                                        )}`
                                      );
                                  },
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>
                          </Col>
                          <Col xl={12} md={24}>
                            <Form.Item
                              label={t("addProgramme:contactPersonName")}
                              name={"contactName"}
                              rules={[
                                {
                                  required: true,
                                  message: `${t(
                                    "addProgramme:contactPersonName"
                                  )} ${t("isRequired")}`,
                                },
                                {
                                  whitespace: true,
                                  message: `${t(
                                    "addProgramme:contactPersonName"
                                  )} ${t("isRequired")}`,
                                },
                              ]}
                            >
                              <Input size="large" disabled={disableFields} />
                            </Form.Item>
                          </Col>
                        </Row>
                        {/* <InfDocumentInformation t={t}></InfDocumentInformation> */}

                        {state?.mode === FormMode.VIEW ? (
                          <div className="steps-actions">
                            <Button
                              danger
                              onClick={navigateToProjectDetailsPageOnView}
                            >
                              {t("addProgramme:back")}
                            </Button>
                          </div>
                        ) : (
                          <div className="steps-actions">
                            <Button type="primary" htmlType="submit">
                              {t("addProgramme:submit")}
                            </Button>
                          </div>
                        )}
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
