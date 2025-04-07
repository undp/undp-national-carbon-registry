import { Button, Form, Input, Row } from "antd";

import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { VerificationStepProps } from "./StepProps";
import TextArea from "antd/lib/input/TextArea";

export const VerificationFindingStep = (props: VerificationStepProps) => {
  const {
    t,
    current,
    form,
    formMode,
    next,
    prev,
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

  const onFinish = (values: any) => {
    //console.log('--------values-----------', values);
    const body = { ...values };
    handleValuesUpdate({
      verificationFindings: body,
    });
  };

  return (
    <>
      {current === 6 && (
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
              <h4 className="verificationReport-findings-subHeading">
                {t("verificationReport:remainingFARsFromValidation")}
              </h4>
              <Form.Item
                className="full-width-form-item"
                name="remainingFARsFromValidation"
                rules={[
                  {
                    required: true,
                    message: `${t(
                      "verificationReport:remainingFARsFromValidation"
                    )} ${t("isRequired")}`,
                  },
                ]}
              >
                <TextArea rows={6} disabled={disableFields} />
              </Form.Item>
              {/* Demonstration of prior consideration of the CDM start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:complianceMonitoringReportForm")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="complianceMonitoringReportForm_MeansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="complianceMonitoringReportForm_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="complianceMonitoringReportForm_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Demonstration of prior consideration of the CDM end */}

              {/* Identification of project type start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:complianceProjectImplementation")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="complianceProjectImplementation_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="complianceProjectImplementation_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="complianceProjectImplementation_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Identification of project type end */}

              {/* Description of project activity start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:postRegistrationChanges")}
                </h4>
                <h6 className="verificationReport-findings-subHeading">
                  {t("verificationReport:temporaryDeviations")}
                </h6>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="temporaryDeviations_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="temporaryDeviations_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="temporaryDeviations_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Description of project activity end */}

              {/* Application Methodologies main section */}
              <h4 className="verificationReport-findings-subHeading">
                {t("verificationReport:corrections")}
              </h4>
              {/* Application and selection of methodologies and standardized baselines start */}
              <>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="corrections_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="corrections_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="corrections_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Application and selection of methodologies and standardized baselines end */}

              {/* Deviation from methodology and/or methodological tool start */}

              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:changesCreditingPeriodStartDate")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="changesCreditingPeriodStartDate_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="changesCreditingPeriodStartDate_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="changesCreditingPeriodStartDate_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Deviation from methodology and/or methodological tool end */}

              {/* Clarification on applicability of methodology, tool and/or standardized baseline start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:inclusionMonitoringPlan")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="inclusionMonitoringPlan_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="inclusionMonitoringPlan_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="inclusionMonitoringPlan_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Clarification on applicability of methodology, tool and/or standardized baseline end */}

              {/* Project boundary, sources and GHGs start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:permanentChangesMonitoringPlan")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="permanentChangesMonitoringPlan_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="permanentChangesMonitoringPlan_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="permanentChangesMonitoringPlan_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Project boundary, sources and GHGs end */}

              {/* Baseline scenario start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:changesProjectDesign")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="changesProjectDesign_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="changesProjectDesign_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="changesProjectDesign_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Baseline scenario end */}

              {/* Demonstration Of Additionality start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:changesAfforestationReforestation")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="changesAfforestationReforestation_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="changesAfforestationReforestation_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="changesAfforestationReforestation_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Demonstration Of Additionality end */}

              {/* Estimation of emission reductions or net anthropogenic removals start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:complianceRegisteredMonitoringPlan")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="complianceRegisteredMonitoringPlan_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="complianceRegisteredMonitoringPlan_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="complianceRegisteredMonitoringPlan_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Estimation of emission reductions or net anthropogenic removals end */}

              {/* Monitoring Plan start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:complianceMonitoringActivities")}
                </h4>
                <h6 className="verificationReport-findings-subHeading">
                  {t("verificationReport:dataParametersFixedExAnte")}
                </h6>

                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="dataParametersFixedExAnte_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="dataParametersFixedExAnte_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="dataParametersFixedExAnte_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Monitoring Plan end */}

              {/* Start date, crediting period type and duration start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:dataParametersMonitored")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="dataParametersMonitored_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="dataParametersMonitored_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="dataParametersMonitored_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Start date, crediting period type and duration end */}

              {/* Environmental impacts start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:implementationSamplingPlan")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="implementationSamplingPlan_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="implementationSamplingPlan_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="implementationSamplingPlan_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Environmental impacts end */}

              {/* Local Stakeholder Consultation start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:complianceCalibrationFrequency")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="complianceCalibrationFrequency_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="complianceCalibrationFrequency_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="complianceCalibrationFrequency_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Local Stakeholder Consultation end */}

              {/* Approval start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:assessmentDataEmissionReductions")}
                </h4>
                <h6 className="verificationReport-findings-subHeading">
                  {t("verificationReport:calculationBaselineEmissions")}
                </h6>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="calculationBaselineEmissions_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="calculationBaselineEmissions_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="calculationBaselineEmissions_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Approval end */}

              {/* Authorization start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:calculationProjectEmissions")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="calculationProjectEmissions_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="calculationProjectEmissions_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="calculationProjectEmissions_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Authorization end */}

              {/* Modalities of communication start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:calculationLeakageEmissions")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="calculationLeakageEmissions_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="calculationLeakageEmissions_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="calculationLeakageEmissions_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Modalities of communication end */}

              {/* Summary Calculation start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:summaryGHGEmissionReductions")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="summaryGHGEmissionReductions_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      disabled={disableFields}
                      // disabled={FormMode.VIEW === formMode}
                    />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="summaryGHGEmissionReductions_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      disabled={disableFields}
                      // disabled={FormMode.VIEW === formMode}
                    />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="summaryGHGEmissionReductions_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      disabled={disableFields}
                      // disabled={FormMode.VIEW === formMode}
                    />
                  </Form.Item>
                </section>
              </>
              {/* Global stakeholder consultation end */}

              {/* comparison ghg start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:comparisonActualEmissionReductions")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="comparisonGHG_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="comparisonGHG_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="comparisonGHG_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* comparison ghg end */}

              {/* remark dif start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:remarksDifferenceEstimatedValue")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="remarkDif_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="remarkDif_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="remarkDif_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* remark dif end */}

              {/* actual ghg start */}
              <>
                <h4 className="verificationReport-findings-subHeading">
                  {t("verificationReport:actualEmissionReductions")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="actualGHG_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="actualGHG_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="actualGHG_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* actual ghg end */}

              {/* assesmentOfReport start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:assessmentSustainableDevelopment")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="assesmentOfReport_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="assesmentOfReport_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="assesmentOfReport_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/*assesmentOfReport end */}

              {/* Global stakeholder consultation start */}
              <>
                <h4 className="verificationReport-findings-heading">
                  {t("verificationReport:globalStakeholderConsultation")}
                </h4>
                <section className="verificationReport-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:meansOfVerification")}`}
                    name="globalStakeholderConsultation_meansOfVerification"
                    rules={[
                      {
                        required: true,
                        message: `${t(
                          "verificationReport:meansOfVerification"
                        )} ${t("isRequired")}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:findings")}`}
                    name="globalStakeholderConsultation_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:findings")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t("verificationReport:conclusions")}`}
                    name="globalStakeholderConsultation_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t("verificationReport:conclusions")} ${t(
                          "isRequired"
                        )}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>
                </section>
              </>
              {/* Global stakeholder consultation end */}

              <Row justify={"end"} className="step-actions-end mg-top-2">
                <Button danger onClick={prev} disabled={false}>
                  {t("verificationReport:back")}
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
