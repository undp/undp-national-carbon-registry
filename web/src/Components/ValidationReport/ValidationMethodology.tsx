import React, { useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import {
  Row,
  Button,
  Form,
  Col,
  Input,
  Checkbox,
  Table,
  TableProps,
  InputNumber,
  Radio,
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { ProcessSteps } from './ValidationStepperComponent';
import moment from 'moment';
import { requiredValidationRule } from '../../Utils/validationHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

const ValidationMethodology = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate, formMode } = props;

  const emptyBackgroundInvestigationRow = {
    backgroundInvestigationName: '',
    backgroundInvestigationDesignation: '',
    backgroundInvestigationOganizationEntity: '',
    backgroundInvestigationMethodTelephone: '',
  };

  const emptyAppointmentTeamMembersDataSourceRow = {
    name: '',
    company: `${t('validationReport:sriLankaClimateFund')}`,
    function: '',
    taskPerformed: '',
  };

  const vmTypeOfFindings = [
    { label: 'CL', value: 'CL' },
    { label: 'CAR', value: 'CAR' },
    { label: 'FAR', value: 'FAR' },
  ];

  const vmConlusion = [
    { label: t('validationReport:conclusion1'), value: 'CONCLUSION_1' },
    { label: t('validationReport:conclusion2'), value: 'CONCLUSION_2' },
    { label: t('validationReport:conclusion3'), value: 'CONCLUSION_3' },
    { label: t('validationReport:conclusion4'), value: 'CONCLUSION_4' },
  ];

  const deskReviewValidationDataSource = [
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [
        t('validationReport:generalDescription'),
        t('validationReport:projectLocation'),
        t('validationReport:projectBoundary'),
      ],
      noOfCars: 'generalDescriptionNoOfCAR',
      noOfCL: 'generalDescriptionNoOfCL',
      noOfFAR: 'generalDescriptionNoOfFAR',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:involveParties')],
      noOfCars: 'involvedPartiesNoOfCAR',
      noOfCL: 'involvedPartiesNoOfCL',
      noOfFAR: 'involvedPartiesNoOfFAR',
    },
    {
      id: 'generalDescriptionNoOfFAR',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:projectSpecification')],
      noOfCars: 'projectSpecificationNoOfCAR',
      noOfCL: 'projectSpecificationNoOfCL',
      noOfFAR: 'projectSpecificationNoOfFAR',
    },
    {
      id: 'involvedPartiesNoOfCAR',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:startDateCommisionDate')],
      noOfCars: 'startDateNoOfCAR',
      noOfCL: 'startDateNoOfCL',
      noOfFAR: 'startDateNoOfFAR',
    },
    {
      id: 'involvedPartiesNoOfCL',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technicalProjectDescription')],
      noOfCars: 'technicalProjectDescriptionNoOfCAR',
      noOfCL: 'technicalProjectDescriptionNoOfCL',
      noOfFAR: 'technicalProjectDescriptionNoOfFAR',
    },
    {
      id: 'involvedPartiesNoOfFAR',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:contributiontoSustainableDevelopment')],
      noOfCars: 'contributionToSustainableDevelopmentNoOfCAR',
      noOfCL: 'contributionToSustainableDevelopmentNoOfCL',
      noOfFAR: 'contributionToSustainableDevelopmentNoOfFAR',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Technology employed',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technologyEmployed')],
      noOfCars: 'technologyEmployedNoOfCAR',
      noOfCL: 'technologyEmployedNoOfCL',
      noOfFAR: 'technologyEmployedNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Application of the Methodology',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:applicationoftheMethodology')],
      noOfCars: 'applicationOfMethodologyNoOfCAR',
      noOfCL: 'applicationOfMethodologyNoOfCL',
      noOfFAR: 'applicationOfMethodologyNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Baseline identification',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:baselineIdentification')],
      noOfCars: 'baselineIdentificationNoOfCAR',
      noOfCL: 'baselineIdentificationNoOfCL',
      noOfFAR: 'baselineIdentificationNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Calculation of GHG emission reductions',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [
        t('validationReport:calculationofGHGemissionreductions'),
        t('validationReport:reductions'),
        t('validationReport:projectemissions'),
        t('validationReport:baselineemissions'),
        t('validationReport:leakage'),
      ],
      noOfCars: 'calculationOfGHGEmissionNoOfCAR',
      noOfCL: 'calculationOfGHGEmissionNoOfCL',
      noOfFAR: 'calculationOfGHGEmissionNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Additionality determination',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:additionalityDetermination')],
      noOfCars: 'additionalityDeterminationNoOfCAR',
      noOfCL: 'additionalityDeterminationNoOfCL',
      noOfFAR: 'additionalityDeterminationNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Monitoring Methodology',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringMethodology')],
      noOfCars: 'monitoringMethodologyNoOfCAR',
      noOfCL: 'monitoringMethodologyNoOfCL',
      noOfFAR: 'monitoringMethodologyNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Monitoring Plan',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringPlan')],
      noOfCars: 'monitoringPlanNoOfCAR',
      noOfCL: 'monitoringPlanNoOfCL',
      noOfFAR: 'monitoringPlanNoOfFAR',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Project management planning',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:projectmanagementplanning')],
      noOfCars: 'projectManagementPlanningNoOfCAR',
      noOfCL: 'projectManagementPlanningNoOfCL',
      noOfFAR: 'projectManagementPlanningNoOfFAR',
    },
    {
      categoryId: 'Duration of the Project / Crediting Period',
      sectionId: 'S1',
      validationCategory: t('validationReport:durationOfProject'),
      specificSection: 'durationOfProjectSpecificSection',
      noOfCars: 'durationOfProjectNoOfCAR',
      noOfCL: 'durationOfProjectNoOfCL',
      noOfFAR: 'durationOfProjectNoOfFAR',
      sectionInput: true,
    },
    {
      categoryId: 'Environmental impacts',
      sectionId: 'S1',
      validationCategory: t('validationReport:environmentalimpacts'),
      specificSection: 'environmentalImpactsSpecificSection',
      noOfCars: 'environmentalImpactsNoOfCAR',
      noOfCL: 'environmentalImpactsNoOfCL',
      noOfFAR: 'environmentalImpactsNoOfFAR',
      sectionInput: true,
    },
    {
      categoryId: 'Stakeholder Comments',
      sectionId: 'S1',
      validationCategory: t('validationReport:stakeholderComments'),
      specificSection: 'stakeholderCommentsSpecificSection',
      noOfCars: 'stakeholderCommentsNoOfCAR',
      noOfCL: 'stakeholderCommentsNoOfCL',
      noOfFAR: 'stakeholderCommentsNoOfFAR',
      sectionInput: true,
    },
    {
      categoryId: 'SUM',
      sectionId: 'S1',
      validationCategory: t('validationReport:SUM'),
      specificSection: [],
      noOfCars: 'sumNoOfCAR',
      noOfCL: 'sumNoOfCL',
      noOfFAR: 'sumNoOfFAR',
    },
  ];

  const calculateSum = (type: string, value: any) => {
    if (value && !isNaN(value)) {
      const total = deskReviewValidationDataSource
        .slice(0, -1)
        .reduce((currentVal: number, source: any) => {
          const formValue = form.getFieldValue(source[type]);
          if (!isNaN(formValue)) {
            return currentVal + formValue;
          }
          return currentVal;
        }, 0);

      if (type === 'noOfCars') {
        form.setFieldValue('sumNoOfCAR', total);
      } else if (type === 'noOfCL') {
        form.setFieldValue('sumNoOfCL', total);
      } else if (type === 'noOfFAR') {
        form.setFieldValue('sumNoOfFAR', total);
      }
    }
  };

  const deskReviewValidationTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:validationCategory'),
      dataIndex: 'validationCategory',
      key: 'validationCategory',
      className: 'deskReviewCategory',
      onCell: (_, index) => {
        if (index === 0) {
          return { rowSpan: 7 };
        }
        if (index && index > 0 && index < 7) {
          return { rowSpan: 0 };
        }

        if (index === 7) {
          return { rowSpan: 7 };
        }
        if (index && index > 7 && index < 14) {
          return { rowSpan: 0 };
        }

        return {};
      },
    },
    {
      title: t('validationReport:specificSection'),
      dataIndex: 'specificSection',
      key: 'specificSection',
      render: (_: any, record: any, index: number) =>
        record.sectionInput ? (
          <Form.Item name={record.specificSection} rules={[requiredValidationRule(t)]}>
            <Input size="large" />
          </Form.Item>
        ) : (
          record?.specificSection.map((val: any) => {
            return <p>{val}</p>;
          })
        ),
    },
    {
      title: t('validationReport:noOfCars'),
      dataIndex: 'noOfCars',
      key: 'noOfCars',
      render: (_: any, record: any, index: number) => (
        <>
          <Form.Item name={record.noOfCars} rules={[requiredValidationRule(t)]}>
            <InputNumber
              disabled={
                index === deskReviewValidationDataSource.length - 1 || formMode === FormMode.VIEW
              }
              onChange={(value: any) => {
                calculateSum('noOfCars', value);
              }}
              size="large"
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: t('validationReport:noOfCL'),
      dataIndex: 'noOfCL',
      key: 'noOfCL',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={record.noOfCL} rules={[requiredValidationRule(t)]}>
          <InputNumber
            onChange={(value: any) => {
              calculateSum('noOfCL', value);
            }}
            disabled={
              index === deskReviewValidationDataSource.length - 1 || formMode === FormMode.VIEW
            }
            size="large"
          />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:noOfFAR'),
      dataIndex: 'noOfFAR',
      key: 'noOfFAR',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          // name={['validationCategory', index, 'noOfFAR']}
          name={record.noOfFAR}
          rules={[requiredValidationRule(t)]}
        >
          <InputNumber
            disabled={
              index === deskReviewValidationDataSource.length - 1 || formMode === FormMode.VIEW
            }
            onChange={(value: any) => {
              calculateSum('noOfFAR', value);
            }}
            size="large"
          />
        </Form.Item>
      ),
    },
  ];

  const onFinish = async (values: any) => {
    // const validationMethodologyFormValues: any = {
    //   appointmentTeamMembers: values?.vmAppointmentTeamMembers,
    //   publicReview: values?.publicReview,
    //   onSiteInspection: values?.onSiteInspection,
    //   backgroundInvestigation: values?.backgroundInvestigation,
    //   resolutionsOfFindings: values?.resolutionsOfFindings,
    // };

    const validationMethodologyFormValues = {
      teamMembers: values?.teamMembers,
      cmaPublicReview: values?.cmaPublicReview,
      onsiteInspection: values?.onsiteInspection,
      followupInterviews: values?.followupInterviews,
      validationReportFinding: values?.validationReportFinding,

      generalDescriptionNoOfCAR: values?.generalDescriptionNoOfCAR,
      generalDescriptionNoOfCL: values?.generalDescriptionNoOfCL,
      generalDescriptionNoOfFAR: values?.generalDescriptionNoOfFAR,
      involvedPartiesNoOfCAR: values?.involvedPartiesNoOfCAR,
      involvedPartiesNoOfCL: values?.involvedPartiesNoOfCL,
      involvedPartiesNoOfFAR: values?.involvedPartiesNoOfFAR,
      projectSpecificationNoOfCAR: values?.projectSpecificationNoOfCAR,
      projectSpecificationNoOfCL: values?.projectSpecificationNoOfCL,
      projectSpecificationNoOfFAR: values?.projectSpecificationNoOfFAR,
      startDateNoOfCAR: values?.startDateNoOfCAR,
      startDateNoOfCL: values?.startDateNoOfCL,
      startDateNoOfFAR: values?.startDateNoOfFAR,
      technicalProjectDescriptionNoOfCAR: values?.technicalProjectDescriptionNoOfCAR,
      technicalProjectDescriptionNoOfCL: values?.technicalProjectDescriptionNoOfCL,
      technicalProjectDescriptionNoOfFAR: values?.technicalProjectDescriptionNoOfFAR,
      contributionToSustainableDevelopmentNoOfCAR:
        values?.contributionToSustainableDevelopmentNoOfCAR,
      contributionToSustainableDevelopmentNoOfCL:
        values?.contributionToSustainableDevelopmentNoOfCL,
      contributionToSustainableDevelopmentNoOfFAR:
        values?.contributionToSustainableDevelopmentNoOfFAR,
      technologyEmployedNoOfCAR: values?.technologyEmployedNoOfCAR,
      technologyEmployedNoOfCL: values?.technologyEmployedNoOfCL,
      technologyEmployedNoOfFAR: values?.technologyEmployedNoOfFAR,
      applicationOfMethodologyNoOfCAR: values?.applicationOfMethodologyNoOfCAR,
      applicationOfMethodologyNoOfCL: values?.applicationOfMethodologyNoOfCL,
      applicationOfMethodologyNoOfFAR: values?.applicationOfMethodologyNoOfFAR,
      baselineIdentificationNoOfCAR: values?.baselineIdentificationNoOfCAR,
      baselineIdentificationNoOfCL: values?.baselineIdentificationNoOfCL,
      baselineIdentificationNoOfFAR: values?.baselineIdentificationNoOfFAR,
      calculationOfGHGEmissionNoOfCAR: values?.calculationOfGHGEmissionNoOfCAR,
      calculationOfGHGEmissionNoOfCL: values?.calculationOfGHGEmissionNoOfCL,
      calculationOfGHGEmissionNoOfFAR: values?.calculationOfGHGEmissionNoOfFAR,
      additionalityDeterminationNoOfCAR: values?.additionalityDeterminationNoOfCAR,
      additionalityDeterminationNoOfCL: values?.additionalityDeterminationNoOfCL,
      additionalityDeterminationNoOfFAR: values?.additionalityDeterminationNoOfFAR,
      monitoringMethodologyNoOfCAR: values?.monitoringMethodologyNoOfCAR,
      monitoringMethodologyNoOfCL: values?.monitoringMethodologyNoOfCL,
      monitoringMethodologyNoOfFAR: values?.monitoringMethodologyNoOfFAR,
      monitoringPlanNoOfCAR: values?.monitoringPlanNoOfCAR,
      monitoringPlanNoOfCL: values?.monitoringPlanNoOfCL,
      monitoringPlanNoOfFAR: values?.monitoringPlanNoOfFAR,
      projectManagementPlanningNoOfCAR: values?.projectManagementPlanningNoOfCAR,
      projectManagementPlanningNoOfCL: values?.projectManagementPlanningNoOfCL,
      projectManagementPlanningNoOfFAR: values?.projectManagementPlanningNoOfFAR,
      durationOfProjectSpecificSection: values?.durationOfProjectSpecificSection,
      durationOfProjectNoOfCAR: values?.durationOfProjectNoOfCAR,
      durationOfProjectNoOfCL: values?.durationOfProjectNoOfCL,
      durationOfProjectNoOfFAR: values?.durationOfProjectNoOfFAR,
      environmentalImpactsSpecificSection: values?.environmentalImpactsSpecificSection,
      environmentalImpactsNoOfCAR: values?.environmentalImpactsNoOfCAR,
      environmentalImpactsNoOfCL: values?.environmentalImpactsNoOfCL,
      environmentalImpactsNoOfFAR: values?.environmentalImpactsNoOfFAR,
      stakeholderCommentsSpecificSection: values?.stakeholderCommentsSpecificSection,
      stakeholderCommentsNoOfCAR: values?.stakeholderCommentsNoOfCAR,
      stakeholderCommentsNoOfCL: values?.stakeholderCommentsNoOfCL,
      stakeholderCommentsNoOfFAR: values?.stakeholderCommentsNoOfFAR,
      sumNoOfCAR: values?.sumNoOfCAR,
      sumNoOfCL: values?.sumNoOfCL,
      sumNoOfFAR: values?.sumNoOfFAR,

      finalValidation: values?.finalValidation,
      internalTechnicalReview: values?.internalTechnicalReview,
      finalApproval: values?.finalApproval,
    };

    console.log(ProcessSteps.VR_VALIDATION_METHODOLOGY, validationMethodologyFormValues);
    handleValuesUpdate({
      [ProcessSteps.VR_VALIDATION_METHODOLOGY]: validationMethodologyFormValues,
    });
  };

  return (
    <>
      {current === 3 && (
        <div>
          <div className="val-report-step-form-container">
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
              disabled={FormMode.VIEW === formMode}
            >
              <h4 className="custom-required">3.1 {t('validationReport:methodandCriteria')}</h4>
              <p>{t('validationReport:methodValidationSteps')}:</p>
              <ul>
                <li>{t('validationReport:methodValidationSteps1')}</li>
                <li>{t('validationReport:methodValidationSteps2')}</li>
                <li>{t('validationReport:methodValidationSteps3')}</li>
                <li>{t('validationReport:methodValidationSteps4')}</li>
                <li>{t('validationReport:methodValidationSteps5')}</li>
                <li>{t('validationReport:methodValidationSteps6')}</li>
                <li>{t('validationReport:methodValidationSteps7')}</li>
                <li>{t('validationReport:methodValidationSteps8')}</li>
                <li>{t('validationReport:methodValidationSteps9')}</li>
                <li>{t('validationReport:methodValidationSteps10')}</li>
                <li>{t('validationReport:methodValidationSteps11')}</li>
              </ul>

              <h4 className="custom-required">
                3.1.1 {t('validationReport:appointmentOfTeamMembers')}
              </h4>
              {/* <Table
                    pagination={false}
                    dataSource={appointmentTeamMembersDataSource}
                    columns={appointmentTeamMembersTableColumns}
                  ></Table> */}

              <Row className="table-header" justify={'space-between'} gutter={[16, 4]}>
                <Col md={4} xl={4}>
                  {t('validationReport:name')}
                </Col>
                <Col md={5} xl={5}>
                  {t('validationReport:company')}
                </Col>
                <Col md={6} xl={6}>
                  {t('validationReport:function')}
                </Col>
                <Col md={6} xl={6}>
                  {t('validationReport:taskPerformed')}
                </Col>
                <Col md={3} xl={3}></Col>
              </Row>

              <Form.List name="teamMembers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index: number) => (
                      <>
                        <Row justify={'space-between'} gutter={[16, 4]}>
                          <Col md={4} xl={4} className="col1">
                            <Form.Item name={[name, 'name']} rules={[requiredValidationRule(t)]}>
                              <Input size="large" />
                            </Form.Item>
                          </Col>
                          <Col md={5} xl={5}>
                            <Form.Item name={[name, 'company']} rules={[requiredValidationRule(t)]}>
                              <Input
                                size="large"
                                value={t('validationReport:sriLankaClimateFund')}
                                disabled
                              />
                            </Form.Item>
                          </Col>
                          <Col md={6} xl={6}>
                            <Form.Item
                              name={[name, 'function']}
                              rules={[requiredValidationRule(t)]}
                            >
                              <Checkbox.Group style={{ display: 'flex' }}>
                                <Checkbox value={t('validationReport:tl')}>
                                  {t('validationReport:tl')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:te')}>
                                  {t('validationReport:te')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:tm')}>
                                  {t('validationReport:tm')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:itr')}>
                                  {t('validationReport:itr')}
                                </Checkbox>
                              </Checkbox.Group>
                            </Form.Item>
                          </Col>

                          <Col md={6} xl={6}>
                            <Form.Item
                              name={[name, 'taskPerformed']}
                              rules={[requiredValidationRule(t)]}
                            >
                              <Checkbox.Group style={{ display: 'flex' }}>
                                <Checkbox value={t('validationReport:dr')}>
                                  {t('validationReport:dr')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:sv')}>
                                  {t('validationReport:sv')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:ri')}>
                                  {t('validationReport:ri')}
                                </Checkbox>
                                <Checkbox value={t('validationReport:tr')}>
                                  {t('validationReport:tr')}
                                </Checkbox>
                              </Checkbox.Group>
                            </Form.Item>
                          </Col>

                          <Col md={3} xl={3} style={{ verticalAlign: 'top' }}>
                            <Form.Item>
                              {fields.length > 1 && (
                                <Button
                                  style={{ marginRight: 5 }}
                                  onClick={() => {
                                    remove(name);
                                  }}
                                  size="small"
                                  className="addMinusBtn"
                                  icon={<MinusOutlined />}
                                ></Button>
                              )}
                              {index === fields.length - 1 && (
                                <Button
                                  onClick={() => {
                                    add(emptyAppointmentTeamMembersDataSourceRow);
                                  }}
                                  size="middle"
                                  className="addMinusBtn"
                                  icon={<PlusOutlined />}
                                ></Button>
                              )}
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    ))}
                  </>
                )}
              </Form.List>

              <p style={{ marginTop: 5, marginBottom: 0 }}>
                {t('validationReport:memberDescription1')}
              </p>
              <p style={{ marginTop: 0 }}>{t('validationReport:memberDescription2')}</p>

              <Row gutter={60}>
                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.1.2 ${t('validationReport:publicReview')}`}
                    name="cmaPublicReview"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:publicReview')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item label={`3.1.3 ${t('validationReport:deskReviewCMA')}`}>
                    <p>{t('validationReport:deskReviewDesc')}</p>
                    <ul>
                      <li>{t('validationReport:deskReviewP1')}</li>
                      <li>{t('validationReport:deskReviewP2')}</li>
                      <li>{t('validationReport:deskReviewP4')}</li>
                      <li>{t('validationReport:deskReviewP5')}</li>
                      <li>{t('validationReport:deskReviewP6')}</li>
                      <li>{t('validationReport:deskReviewP7')}</li>
                      <li>{t('validationReport:deskReviewP8')}</li>
                    </ul>
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.1.4 ${t('validationReport:onSiteInspection')}`}
                    name="onsiteInspection"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:onSiteInspection')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                </Col>

                <Col>
                  <h4 className="custom-required">{`3.1.5 ${t(
                    'validationReport:backgroundInvestigationAndFollowups'
                  )}`}</h4>
                </Col>

                <Col>
                  <Row className="table-header" justify={'space-between'} gutter={[16, 4]}>
                    <Col md={4} xl={4}>
                      <div style={{ marginLeft: 5 }}></div>
                      {t('validationReport:name')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('validationReport:designation')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('validationReport:oganizationEntity')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('validationReport:methodTelephone')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('validationReport:mainTopicCovered')}
                    </Col>
                    <Col md={3} xl={3}></Col>
                  </Row>

                  <Form.List name="followupInterviews">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, index: number) => (
                          <>
                            <Row justify={'space-between'} gutter={[16, 4]}>
                              <Col md={4} xl={4} className="col1">
                                <Form.Item
                                  name={[name, 'name']}
                                  rules={[requiredValidationRule(t)]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>
                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'designation']}
                                  rules={[requiredValidationRule(t)]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>
                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'organization']}
                                  rules={[requiredValidationRule(t)]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>

                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'method']}
                                  rules={[requiredValidationRule(t)]}
                                >
                                  <Input size="large" />
                                </Form.Item>
                              </Col>

                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'mainTopicsCovered']}
                                  rules={[requiredValidationRule(t)]}
                                >
                                  <TextArea disabled={FormMode.VIEW === formMode} rows={3} />
                                </Form.Item>
                              </Col>
                              <Col md={3} xl={3}>
                                <Form.Item>
                                  {fields.length > 1 && (
                                    <Button
                                      style={{ marginRight: 5 }}
                                      onClick={() => {
                                        remove(name);
                                      }}
                                      size="small"
                                      className="addMinusBtn"
                                      icon={<MinusOutlined />}
                                    ></Button>
                                  )}
                                  {index === fields.length - 1 && (
                                    <Button
                                      onClick={() => {
                                        add();
                                      }}
                                      size="middle"
                                      className="addMinusBtn"
                                      icon={<PlusOutlined />}
                                    ></Button>
                                  )}
                                </Form.Item>
                              </Col>
                            </Row>
                          </>
                        ))}
                      </>
                    )}
                  </Form.List>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.2 ${t('validationReport:definitionOfClarificationRequest')}`}
                    name="environmentImpact"
                  >
                    {/* <p>{t('validationReport:definitionOfClarificationRequest1')}</p> */}
                    <p style={{ marginBottom: 0 }}>
                      <b>A Clarification Request (CL)</b> will be issued where information is
                      insufficient, unclear or not transparent enough to establish whether a
                      requirement is met.{' '}
                    </p>
                    <p style={{ marginBottom: 0 }}>
                      <b>A Corrective Action Request (CAR)</b> will be issued where:{' '}
                    </p>
                    <ul style={{ marginBottom: 0 }}>
                      <li>
                        mistakes have been made in assumptions, application of the methodology or
                        the project documentation which will have a direct influence on the project
                        results,
                      </li>
                      <li>
                        the requirements deemed relevant for validation of the project with certain
                        characteristics have not been met or{' '}
                      </li>
                    </ul>
                    <p>
                      <b>A Forward Action Request (FAR)</b> will be issued when certain issues
                      related to project implementation should be reviewed during the first
                      verification.
                    </p>
                    {/* <p>{t('validationReport:definitionOfClarificationRequest2')}</p> */}
                    {/* <ul>
                      <li>{t('validationReport:definitionOfClarificationRequest21')}</li>
                      <li>{t('validationReport:definitionOfClarificationRequest22')}</li>
                    </ul>
                    <p>{t('validationReport:definitionOfClarificationRequest3')}</p> */}
                  </Form.Item>
                </Col>
                <Col md={24} xl={24}>
                  <Form.Item label={`3.3 ${t('validationReport:draftValidation')}`}>
                    <p>{t('validationReport:draftValidationDesc')}</p>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <h4 className="custom-required">
                    3.4 {t('validationReport:resolutionsOfFindings')}
                  </h4>

                  <Form.List name="validationReportFinding">
                    {(resolutionOfFindingsList, { add, remove }) => (
                      <>
                        <Col span={24} className="full-width-form-item">
                          {resolutionOfFindingsList.map(
                            (
                              {
                                key: resolutionkey,
                                name: resolutionName,
                                fieldKey: resolutionFieldKey,
                                ...resolutionRestField
                              },
                              index: number
                            ) => (
                              <>
                                {resolutionOfFindingsList.length > 1 && (
                                  <Row style={{ marginBottom: 5 }}>
                                    <Col>
                                      <Button
                                        style={{ marginRight: 5 }}
                                        onClick={() => {
                                          remove(index);
                                        }}
                                        size="small"
                                        className="addMinusBtn"
                                        icon={<MinusOutlined />}
                                      ></Button>
                                    </Col>
                                  </Row>
                                )}

                                <div className="form-section">
                                  <Col md={24} xl={24}>
                                    <Row>
                                      <Col
                                        md={4}
                                        style={{ marginTop: 3 }}
                                        className="custom-required-only"
                                      >
                                        {t('validationReport:typeOfFindings')}
                                      </Col>
                                      <Col md={12}>
                                        <Form.Item
                                          {...resolutionRestField}
                                          name={[resolutionName, 'typeOfFinding']}
                                          rules={[requiredValidationRule(t)]}
                                        >
                                          <Radio.Group
                                            style={{ display: 'flex', justifyContent: 'start' }}
                                            options={vmTypeOfFindings}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>

                                    <Row>
                                      <Col md={4} className="custom-required-only">
                                        {t('validationReport:findingNo')}
                                      </Col>
                                      <Col md={12}>
                                        <Form.Item
                                          {...resolutionRestField}
                                          name={[resolutionName, 'findingNo']}
                                          rules={[requiredValidationRule(t)]}
                                        >
                                          <Input size="large" />
                                        </Form.Item>
                                      </Col>
                                    </Row>

                                    <Row>
                                      <Col md={4} className="custom-required-only">
                                        {t('validationReport:refToCMA')}
                                      </Col>
                                      <Col md={12}>
                                        <Form.Item
                                          {...resolutionRestField}
                                          name={[resolutionName, 'rfToCMA']}
                                          rules={[requiredValidationRule(t)]}
                                        >
                                          <Input size="large" />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  </Col>

                                  <Col span={24}>
                                    <Form.Item
                                      {...resolutionRestField}
                                      label={`${t(
                                        'validationReport:actionRequestByValidationTeam'
                                      )}`}
                                      name={[resolutionName, 'actionRequestsByValidationTeam']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                                    </Form.Item>
                                  </Col>

                                  <Col span={24}>
                                    <Form.Item
                                      {...resolutionRestField}
                                      label={`${t(
                                        'validationReport:summaryOfProjectOwnerResponse'
                                      )}`}
                                      name={[resolutionName, 'summaryOfProjectOwnerResponse']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                                    </Form.Item>
                                  </Col>

                                  <Col span={24}>
                                    <Form.Item
                                      {...resolutionRestField}
                                      label={`${t('validationReport:validationTeamAssessment')}`}
                                      name={[resolutionName, 'validationTeamAssessment']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                                    </Form.Item>
                                  </Col>

                                  <Col span={24}>
                                    <Form.Item
                                      {...resolutionRestField}
                                      label={`${t('validationReport:conclusion')}`}
                                      rules={[
                                        {
                                          required: true,
                                          message: `${t('validationReport:conclusion')} ${t(
                                            'isRequired'
                                          )}`,
                                        },
                                      ]}
                                      name={[resolutionName, 'conclusion']}
                                    >
                                      <Radio.Group
                                        style={{ width: '100%' }}
                                        className="validation-conclusion"
                                      >
                                        {vmConlusion.map((value) => {
                                          return (
                                            <Row style={{ width: '100%' }}>
                                              <Col span={24}>
                                                <Radio
                                                  style={{ width: '100%' }}
                                                  value={value.value}
                                                >
                                                  {value.label}
                                                </Radio>
                                              </Col>
                                            </Row>
                                          );
                                        })}
                                      </Radio.Group>
                                    </Form.Item>
                                  </Col>
                                </div>
                              </>
                            )
                          )}
                        </Col>

                        <Col span={3}>
                          <Form.Item>
                            <Button
                              onClick={() => {
                                add();
                              }}
                              size="large"
                              className="addMinusBtn"
                              icon={<PlusOutlined />}
                            >
                              {t('validationReport:addFindings')}
                            </Button>
                          </Form.Item>
                        </Col>
                      </>
                    )}
                  </Form.List>
                </Col>
              </Row>

              <p>{t('validationReport:validationMethodologyTableTitle')}:</p>
              <p>{t('validationReport:tableNote')}</p>

              <Table
                columns={deskReviewValidationTableColumns}
                pagination={false}
                dataSource={deskReviewValidationDataSource}
              ></Table>

              <Form.Item
                style={{ marginTop: 10 }}
                className="full-width-form-item"
                label={`3.5 ${t('validationReport:finalValidation')}`}
                name="finalValidation"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:finalValidation')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={6} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.6 ${t('validationReport:internalTechnicalReview')}`}
                name="internalTechnicalReview"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:internalTechnicalReview')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={6} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.7 ${t('validationReport:finalApproval')}`}
                name="finalApproval"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:finalApproval')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={6} />
              </Form.Item>

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

export default ValidationMethodology;
