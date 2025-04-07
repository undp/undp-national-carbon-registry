import { useEffect, useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Upload,
} from "antd";
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from "react-phone-number-input";

import moment from "moment";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useLocation } from "react-router-dom";
import TextArea from "antd/lib/input/TextArea";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { API_PATHS } from "../../Config/apiConfig";
import i18n from "../Internationalization/i18n";
import { VerificationStepProps } from "./StepProps";
import { UploadOutlined } from "@ant-design/icons";
import { fileUploadValueExtract } from "../../Utils/utilityHelper";

export const BasicInformationStep = (props: VerificationStepProps) => {
  const {
    current,
    form,
    formMode,
    next,
    prev,
    countries,
    disableFields,
    handleValuesUpdate,
    // verifiedScer,
    // onValueChange,
  } = props;
  const t = i18n.t;
  const { get, post } = useConnection();
  const [contactNoInput] = useState<any>();
  const [countryList, setCountryList] = useState<[]>([]);
  const accessToken = import.meta.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? import.meta.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : "";

  const maximumImageSize = import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  //get validation report details
  // const fetchValidationData = async () => {
  //   const response = await get (API_PATHS.VERIFICATION_DOC_LAST_VERSION);
  //   if (response.data){

  //   }
  // };

  // useEffect (()=>{
  //   fetchValidationData();
  // },[])

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    const signature = (await fileUploadValueExtract(values, "b_signature"))[0];
    const body = {
      ...values,
      b_completionDate: moment(values?.b_completionDate).startOf("day").unix(),
      b_signature: signature,
    };

    handleValuesUpdate({
      basicInformation: body,
    });
  };

  return (
    <>
      {current === 0 && (
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
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t("verificationReport:b_projectTitle")}
                      name="b_projectTitle"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_scaleOfProject")}
                      name="b_scaleOfProject"
                    >
                      <Select
                        showSearch
                        size="large"
                        disabled
                        placeholder="Select"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLocaleString()
                            .includes(input.toLowerCase())
                        }
                        options={[
                          { value: "1", label: "Large Scale" },
                          { value: "2", label: "Small Scale" },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_monitoringPeriodDuration")}
                      name="b_monitoringPeriodDuration"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    {/* <Form.Item
                      name="telephone"
                      label={t('verificationReport:telephone')}
                      initialValue={useLocation?.record?.phoneNo}
                      rules={[
                        {
                          required: true,
                          message: '',
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
                                `${t('verificationReport:telephone')} ${t('isRequired')}`
                              );
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(
                                    `${t('verificationReport:telephone')} ${t('isRequired')}`
                                  );
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(
                                      `${t('verificationReport:telephone')} ${t('isInvalid')}`
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
                        placeholder={t('verificationReport:telephone')}
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        disabled
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries}
                      />
                    </Form.Item> */}
                    <Form.Item
                      label={t("verificationReport:b_completionDate")}
                      name="b_completionDate"
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
                                  "verificationReport:b_completionDate"
                                )} ${t("isRequired")}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) =>
                          currentDate < moment().startOf("day")
                        }
                        disabled={disableFields}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t(
                        "verificationReport:b_versionNoOfMonitoringReport"
                      )}
                      name={"b_versionNoOfMonitoringReport"}
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
                                  "verificationReport:b_versionNoOfMonitoringReport"
                                )} ${t("isRequired")}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={t("verificationReport:b_projectDeveloper")}
                      name={"b_projectDeveloper"}
                    >
                      <Input
                        size="large"
                        //placeholder="Add Project Participants"
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_appliedMethodologies")}
                      name={"b_appliedMethodologies"}
                    >
                      <Input
                        size="large"
                        // placeholder="Add Project Participants"
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t(
                        "verificationReport:b_conditionalSectoralScopes"
                      )}
                      name={"b_conditionalSectoralScopes"}
                      // rules={[
                      //   {
                      //     required: true,
                      //     message: '',
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
                      //           `${t('verificationReport:b_conditionalSectoralScopes')} ${t(
                      //             'isRequired'
                      //           )}`
                      //         );
                      //       }
                      //     },
                      //   },
                      // ]}
                    >
                      <Input
                        size="large"
                        // placeholder="Add Project Participants"
                        disabled
                      />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t("verificationReport:b_unfccRefNo")}
                      name="b_unfccRefNo"
                      // rules={[
                      //   {
                      //     required: false,
                      //     message: '',
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
                      //           `${t('verificationReport:b_unfccRefNo')} ${t('isRequired')}`
                      //         );
                      //       }
                      //     },
                      //   },
                      // ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t(
                        "verificationReport:b_versionNoOfVerificationReport"
                      )}
                      name="b_versionNoOfVerificationReport"
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
                                  "verificationReport:b_versionNoOfVerificationReport"
                                )} ${t("isRequired")}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={true} />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_monitoringPeriodNo")}
                      name="b_monitoringPeriodNo"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_creditingPeriod")}
                      name="b_creditingPeriod"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_hostParty")}
                      name="b_hostParty"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_mandatorySectoralScopes")}
                      name="b_mandatorySectoralScopes"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t(
                        "verificationReport:b_estimatedGHGEmissionReduction"
                      )}
                      name="b_estimatedGHGEmissionReduction"
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t("verificationReport:b_certfiedGHGReductions")}
                      name="b_certfiedGHGReductions"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            "verificationReport:b_certfiedGHGReductions"
                          )} ${t("isRequired")}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={"end"} className="step-actions-end">
                <Button danger size={"large"} onClick={prev} disabled={false}>
                  {t("verificationReport:cancel")}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t("verificationReport:next")}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={"large"}
                    htmlType={"submit"}
                    // onClick={next}
                  >
                    {t("verificationReport:next")}
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
