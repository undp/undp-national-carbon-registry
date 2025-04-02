import React, { useEffect, useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Input } from 'antd';
import { useLocation } from 'react-router-dom';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

const ValidationFindings = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate, disableFields } = props;

  const onFinish = async (values: any) => {
    const body: any = {
      ...values,
    };

    handleValuesUpdate({ validationFindings: body });
  };

  return (
    <>
      {current === 5 && (
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
            >
              {/* Demonstration of prior consideration of the CDM start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:demonstrationPriorCDM')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="cdm_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:findings')}`}
                    name="cdm_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="cdm_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Demonstration of prior consideration of the CDM end */}

              {/* Identification of project type start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:identificationOfProjectType')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="projectType_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="projectType_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="projectType_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Identification of project type end */}

              {/* Description of project activity start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:descriptionOfProjectActivity')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="projectActivity_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="projectActivity_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="projectActivity_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Description of project activity end */}

              {/* Application Methodologies main section */}
              <h3 className="validation-findings-heading">
                {t('validationReport:applicationMethodologiesSectionHeading')}
              </h3>
              {/* Application and selection of methodologies and standardized baselines start */}
              <>
                {/* <h4 className="validation-findings-subHeading">
                  {t('validationReport:applicationMethodologiesBaselines')}
                </h4> */}
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="applicationMethodologies_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="applicationMethodologies_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="applicationMethodologies_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Application and selection of methodologies and standardized baselines end */}

              {/* Deviation from methodology and/or methodological tool start */}

              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:deviationMethodology')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="deviationMethodology_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="deviationMethodology_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="deviationMethodology_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Deviation from methodology and/or methodological tool end */}

              {/* Clarification on applicability of methodology, tool and/or standardized baseline start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:clarificationOnMethodology')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="clarificationOnMethodology_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="clarificationOnMethodology_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="clarificationOnMethodology_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Clarification on applicability of methodology, tool and/or standardized baseline end */}

              {/* Project boundary, sources and GHGs start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:projectBoundarySources')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="projectBoundarySources_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="projectBoundarySources_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="projectBoundarySources_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Project boundary, sources and GHGs end */}

              {/* Baseline scenario start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:baselineScenario')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="baselineScenario_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="baselineScenario_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="baselineScenario_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Baseline scenario end */}

              {/* Demonstration Of Additionality start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:demonstrationOfAdditionality')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="demonstrationOfAdditionality_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="demonstrationOfAdditionality_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="demonstrationOfAdditionality_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Demonstration Of Additionality end */}

              {/* Estimation of emission reductions or net anthropogenic removals start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:estimationOfEmissionReduction')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="estimationOfEmissionReduction_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="estimationOfEmissionReduction_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="estimationOfEmissionReduction_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Estimation of emission reductions or net anthropogenic removals end */}

              {/* Monitoring Plan start */}
              <>
                <h4 className="validation-findings-subHeading">
                  {t('validationReport:monitoringPlan')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="monitoringPlan_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="monitoringPlan_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="monitoringPlan_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Monitoring Plan end */}

              {/* Start date, crediting period type and duration start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:startDateCreditingPeriod')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="startDateCreditingPeriod_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="startDateCreditingPeriod_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="startDateCreditingPeriod_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Start date, crediting period type and duration end */}

              {/* Environmental impacts start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:environmentImpacts')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="environmentImpacts_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="environmentImpacts_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="environmentImpacts_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Environmental impacts end */}

              {/* Local Stakeholder Consultation start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:localStakeholderConsultation')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="localStakeholderConsultation_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="localStakeholderConsultation_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="localStakeholderConsultation_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Local Stakeholder Consultation end */}

              {/* Sustainable development co-benefits start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:sustainableDevelopment')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="sustainableDevelopment_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="sustainableDevelopment_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="sustainableDevelopment_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Sustainable development co-benefits end */}

              {/* Approval start */}
              <>
                <h4 className="validation-findings-heading">{t('validationReport:approval')}</h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="approval_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="approval_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="approval_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Approval end */}

              {/* Authorization start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:authorization')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="authorization_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="authorization_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="authorization_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Authorization end */}

              {/* Modalities of communication start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:modalitiesOfCommunication')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="modalitiesOfCommunication_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:findings')}`}
                    name="modalitiesOfCommunication_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
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
                    label={`${t('validationReport:conclusions')}`}
                    name="modalitiesOfCommunication_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
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
              {/* Modalities of communication end */}

              {/* Global stakeholder consultation start */}
              <>
                <h4 className="validation-findings-heading">
                  {t('validationReport:globalStakeholderConsultation')}
                </h4>
                <section className="validation-findings-section">
                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:meansOfValidation')}`}
                    name="globalStakeholderConsultation_meansOfValidation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:meansOfValidation')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      // disabled={FormMode.VIEW === formMode}
                      disabled={disableFields}
                    />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:findings')}`}
                    name="globalStakeholderConsultation_findings"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:findings')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      // disabled={FormMode.VIEW === formMode}
                      disabled={disableFields}
                    />
                  </Form.Item>

                  <Form.Item
                    className="full-width-form-item"
                    label={`${t('validationReport:conclusions')}`}
                    name="globalStakeholderConsultation_conclusions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:conclusions')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      // disabled={FormMode.VIEW === formMode}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </section>
              </>
              {/* Global stakeholder consultation end */}

              <Row justify={'end'} className="step-actions-end mg-top-2">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
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

export default ValidationFindings;
