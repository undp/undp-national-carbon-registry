import React, { useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input, Checkbox, Table, TableProps } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { ProcessSteps } from './ValidationStepperComponent';
import moment from 'moment';
import { requiredValidationRule } from '../../Utils/validationHelper';

const ValidationMethodology = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;

  const emptyBackgroundInvestigationRow = {
    backgroundInvestigationName: '',
    backgroundInvestigationDesignation: '',
    backgroundInvestigationOganizationEntity: '',
    backgroundInvestigationMethodTelephone: '',
  };

  const emptyAppointmentTeamMembersDataSourceRow = {
    appointmentTeamMembersName: '',
    appointmentTeamMembersCompany: `${t('validationReport:sriLankaClimateFund')}`,
    appointmentTeamMembersFunction: '',
    appointmentTeamMembersTaskPerformed: '',
  };

  const [backgroundInvestigationDataSource, setBackgroundInvestigationDataSource] = useState([
    emptyBackgroundInvestigationRow,
  ]);

  const [appointmentTeamMembersDataSource, setAppointmentTeamMembersDataSource] = useState([
    emptyAppointmentTeamMembersDataSourceRow,
  ]);

  const vmTypeOfFindings = [
    { label: 'CL', value: 'CL' },
    { label: 'CAR', value: 'CAR' },
    { label: 'FAR', value: 'FAR' },
  ];

  const vmConlusion = [
    { label: t('validationReport:conclusion1'), value: t('validationReport:conclusion1') },
    { label: t('validationReport:conclusion2'), value: t('validationReport:conclusion2') },
    { label: t('validationReport:conclusion3'), value: t('validationReport:conclusion3') },
    { label: t('validationReport:conclusion4'), value: t('validationReport:conclusion4') },
  ];

  const removeAppointmentTeamMembers = (index: number) => {
    setAppointmentTeamMembersDataSource((prevATM) => {
      const newList = [...prevATM];
      newList.splice(index, 1);
      return newList;
    });
  };

  const appointmentTeamMembersTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:name'),
      dataIndex: 'appointmentTeamMembersName',
      key: 'appointmentTeamMembersName',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['appointmentTeamMembers', index, 'name']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:company'),
      dataIndex: 'appointmentTeamMembersCompany',
      key: 'appointmentTeamMembersCompany',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['appointmentTeamMembers', index, 'company']}
          initialValue={record?.appointmentTeamMembersCompany}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" disabled />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:function'),
      dataIndex: 'appointmentTeamMembersFunction',
      key: 'appointmentTeamMembersFunction',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['appointmentTeamMembers', index, 'function']}
          rules={[requiredValidationRule(t)]}
        >
          <Checkbox.Group style={{ display: 'flex' }}>
            <Checkbox value={t('validationReport:tl')}>{t('validationReport:tl')}</Checkbox>
            <Checkbox value={t('validationReport:te')}>{t('validationReport:te')}</Checkbox>
            <Checkbox value={t('validationReport:tm')}>{t('validationReport:tm')}</Checkbox>
            <Checkbox value={t('validationReport:itr')}>{t('validationReport:itr')}</Checkbox>
          </Checkbox.Group>
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:taskPerformed'),
      dataIndex: 'appointmentTeamMembersTaskPerformed',
      key: 'appointmentTeamMembersTaskPerformed',
      render: (_: any, record: any, index: number) => (
        <>
          <Form.Item
            name={['appointmentTeamMembers', index, 'taskPerformedDR']}
            rules={[requiredValidationRule(t)]}
          >
            <Checkbox.Group style={{ display: 'flex' }}>
              <Checkbox value={t('validationReport:dr')}>{t('validationReport:dr')}</Checkbox>
              <Checkbox value={t('validationReport:sv')}>{t('validationReport:sv')}</Checkbox>
              <Checkbox value={t('validationReport:ri')}>{t('validationReport:ri')}</Checkbox>
              <Checkbox value={t('validationReport:tr')}>{t('validationReport:tr')}</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </>
      ),
    },
    {
      title: '',
      dataIndex: 'appointmentTeamMembersDelete',
      key: 'appointmentTeamMembersDelete',
      render: (_: any, record: any, index: number) => (
        <>
          {appointmentTeamMembersDataSource.length > 1 ? (
            <Button
              // type="dashed"
              onClick={() => {
                removeAppointmentTeamMembers(index);
              }}
              size="middle"
              className="addMinusBtn"
              // block
              icon={<MinusOutlined />}
            ></Button>
          ) : (
            <span></span>
          )}
        </>
      ),
    },
  ];

  const removeBackgroundInvestigation = (index: number) => {
    setBackgroundInvestigationDataSource((prevATM) => {
      const newList = [...prevATM];
      newList.splice(index, 1);
      return newList;
    });
  };

  const backgroundInvestigationTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:name'),
      dataIndex: 'backgroundInvestigationName',
      key: 'backgroundInvestigationName',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['backgroundInvestigation', index, 'name']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:designation'),
      dataIndex: 'backgroundInvestigationDesignation',
      key: 'backgroundInvestigationDesignation',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['backgroundInvestigation', index, 'designation']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:OganizationEntity'),
      dataIndex: 'backgroundInvestigationOganizationEntity',
      key: 'backgroundInvestigationOganizationEntity',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['backgroundInvestigation', index, 'organizationEntity']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:methodTelephone'),
      dataIndex: 'backgroundInvestigationMethodTelephone',
      key: 'backgroundInvestigationMethodTelephone',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['backgroundInvestigation', index, 'method']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:mainTopicCovered'),
      dataIndex: 'backgroundInvestigationMainTopicCovered',
      key: 'backgroundInvestigationMainTopicCovered',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['backgroundInvestigation', index, 'mainTopicCovered']}
          rules={[requiredValidationRule(t)]}
        >
          <TextArea rows={4} />
        </Form.Item>
      ),
    },
    {
      title: '',
      dataIndex: 'backgroundInvestigationRemove',
      key: 'backgroundInvestigationRemove',
      render: (_: any, record: any, index: number) => {
        return backgroundInvestigationDataSource.length > 1 ? (
          <Button
            // type="dashed"
            onClick={() => {
              removeBackgroundInvestigation(index);
            }}
            size="middle"
            className="addMinusBtn"
            // block
            icon={<MinusOutlined />}
          ></Button>
        ) : (
          <span></span>
        );
      },
    },
  ];

  const deskReviewValidationTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:validationCategory'),
      dataIndex: 'validationCategory',
      key: 'validationCategory',
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
          <Form.Item
            name={['validationCategory', index, 'specificSection']}
            rules={[requiredValidationRule(t)]}
          >
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
          <Form.Item hidden name={['validationCategory', index, 'categoryId']}>
            <Input value={record.categoryId} size="large" />
          </Form.Item>
          <Form.Item hidden name={['validationCategory', index, 'sectionId']}>
            <Input value={record.sectionId} size="large" />
          </Form.Item>
          <Form.Item
            name={['validationCategory', index, 'noOfCars']}
            rules={[requiredValidationRule(t)]}
          >
            <Input size="large" />
          </Form.Item>
        </>
      ),
    },
    {
      title: t('validationReport:noOfCL'),
      dataIndex: 'noOfCL',
      key: 'noOfCL',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['validationCategory', index, 'noOfCL']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:noOfFAR'),
      dataIndex: 'noOfFAR',
      key: 'noOfFAR',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['validationCategory', index, 'noOfFAR']}
          rules={[requiredValidationRule(t)]}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
  ];

  const deskReviewValidationDataSource = [
    {
      categoryId: 'General description of project activity',
      sectionId: 'General Description',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [
        t('validationReport:generalDescription'),
        t('validationReport:projectLocation'),
        t('validationReport:projectBoundary'),
      ],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Involved Parties and Project Participants',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:involveParties')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Project specification',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:projectSpecification')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Start date /Commissioning date',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:startDateCommisionDate')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Technical project description',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technicalProjectDescription')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Contribution to sustainable development',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:contributiontoSustainableDevelopment')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'General description of project activity',
      sectionId: 'Technology employed',
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technologyEmployed')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Application of the Methodology',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:applicationoftheMethodology')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Baseline identification',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:baselineIdentification')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
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
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Additionality determination',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:additionalityDetermination')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Monitoring Methodology',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringMethodology')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Monitoring Plan',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringPlan')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Project Baseline, Additionality and Monitoring Plan',
      sectionId: 'Project management planning',
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:projectmanagementplanning')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      categoryId: 'Duration of the Project / Crediting Period',
      sectionId: 'S1',
      validationCategory: t('validationReport:durationOfProject'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
      sectionInput: true,
    },
    {
      categoryId: 'Environmental impacts',
      sectionId: 'S1',
      validationCategory: t('validationReport:environmentalimpacts'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
      sectionInput: true,
    },
    {
      categoryId: 'Stakeholder Comments',
      sectionId: 'S1',
      validationCategory: t('validationReport:stakeholderComments'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
      sectionInput: true,
    },
    {
      categoryId: 'SUM',
      sectionId: 'S1',
      validationCategory: t('validationReport:SUM'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
  ];

  const onFinish = async (values: any) => {
    const validationMethodologyFormValues: any = {
      appointmentTeamMembers: values?.vmAppointmentTeamMembers,
      publicReview: values?.publicReview,
      onSiteInspection: values?.onSiteInspection,
      backgroundInvestigation: values?.backgroundInvestigation,
      resolutionsOfFindings: values?.resolutionsOfFindings,
    };

    console.log(ProcessSteps.VR_VALIDATION_METHODOLOGY, validationMethodologyFormValues);
    handleValuesUpdate({
      [ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]: validationMethodologyFormValues,
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
                // onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <h4>3.1 {t('validationReport:methodandCriteria')}</h4>
              <p>{t('validationReport:methodValidationSteps')}</p>
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

              <h4>3.1.1 {t('validationReport:appointmentOfTeamMembers')}</h4>
              <Row>
                <Col span={24}>
                  <Table
                    pagination={false}
                    dataSource={appointmentTeamMembersDataSource}
                    columns={appointmentTeamMembersTableColumns}
                  ></Table>
                </Col>
                <Col
                  span={24}
                  style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}
                >
                  <Button
                    onClick={() => {
                      setAppointmentTeamMembersDataSource((prevATM) => {
                        return [...prevATM, emptyAppointmentTeamMembersDataSourceRow];
                      });
                    }}
                    size="large"
                    className="addMinusBtn"
                    icon={<PlusOutlined />}
                  ></Button>
                </Col>
              </Row>

              <p style={{ marginTop: 15 }}>{t('validationReport:memberDescription')}</p>

              <Row gutter={60}>
                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.1.2 ${t('validationReport:publicReview')}`}
                    name="publicReview"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:publicReview')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea rows={4} />
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.1.2 ${t('validationReport:deskReviewCMA')}`}
                    name="deskReviewCMA"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:deskReviewCMA')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <p>{t('validationReport:deskReviewDesc')}</p>
                    <ul>
                      <li>{t('validationReport:deskReviewP1')}</li>
                      <li>{t('validationReport:deskReviewP2')}</li>
                      <li>{t('validationReport:deskReviewP3')}</li>
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
                    label={`3.1.2 ${t('validationReport:onSiteInspection')}`}
                    name="onSiteInspection"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:onSiteInspection')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea rows={4} />
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    label={`2.3 ${t('validationReport:backgroundInvestigationAndFollowups')}`}
                    rules={[requiredValidationRule(t)]}
                  >
                    <Row>
                      <Col span={24}>
                        <Table
                          dataSource={backgroundInvestigationDataSource}
                          columns={backgroundInvestigationTableColumns}
                          pagination={false}
                        ></Table>
                      </Col>
                      <Col
                        span={24}
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: 10,
                        }}
                      >
                        <Button
                          onClick={() => {
                            setBackgroundInvestigationDataSource((prevBI) => {
                              return [...prevBI, emptyBackgroundInvestigationRow];
                            });
                          }}
                          icon={<PlusOutlined />}
                        >
                          {/* {t('addRow')} */}
                        </Button>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>

                <Col md={24} xl={24}>
                  <Form.Item
                    label={`3.2 ${t('validationReport:definitionOfClarificationRequest')}`}
                    name="environmentImpact"
                  >
                    <p>{t('validationReport:definitionOfClarificationRequest1')}</p>
                    <p>{t('validationReport:definitionOfClarificationRequest2')}</p>
                    <ul>
                      <li>{t('validationReport:definitionOfClarificationRequest21')}</li>
                      <li>{t('validationReport:definitionOfClarificationRequest22')}</li>
                    </ul>
                    <p>{t('validationReport:definitionOfClarificationRequest3')}</p>
                  </Form.Item>
                </Col>
                <Col md={24} xl={24}>
                  <Form.Item label={`3.3 ${t('validationReport:draftValidation')}`}>
                    <p>{t('validationReport:draftValidationDesc')}</p>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <h4>3.4 {t('validationReport:resolutionsOfFindings')}</h4>

                  <Form.List name="resolutionsOfFindings">
                    {(resolutionOfFindingsList, { add, remove }) => (
                      <>
                        <Col span={24} className="full-width-form-item">
                          {resolutionOfFindingsList.map(
                            ({
                              key: resolutionkey,
                              name: resolutionName,
                              fieldKey: resolutionFieldKey,
                              ...resolutionRestField
                            }) => (
                              <div className="form-section">
                                <Col md={24} xl={24}>
                                  <Row>
                                    <Col md={3}>{t('validationReport:typeOfFindings')}</Col>
                                    <Col md={12}>
                                      <Form.Item
                                        {...resolutionRestField}
                                        name={[resolutionName, 'type']}
                                      >
                                        <Checkbox.Group options={vmTypeOfFindings} />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Form.Item
                                    {...resolutionRestField}
                                    name={[resolutionName, 'findingNo']}
                                  >
                                    <Row>
                                      <Col md={3}>{t('validationReport:findingNo')}</Col>
                                      <Col md={12}>
                                        <Input size="large" />
                                      </Col>
                                    </Row>
                                  </Form.Item>
                                  <Form.Item
                                    {...resolutionRestField}
                                    name={[resolutionName, 'refToCMA']}
                                  >
                                    <Row>
                                      <Col md={3}>{t('validationReport:refToCMA')}</Col>
                                      <Col md={12}>
                                        <Input size="large" />
                                      </Col>
                                    </Row>
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:actionRequestByValidationTeam')}`}
                                    name={[resolutionName, 'actionRequestByTeam']}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:summaryOfProjectOwnerResponse')}`}
                                    name={[resolutionName, 'summaryOfProjectOwnerResponse']}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:validationTeamAssessment')}`}
                                    name={[resolutionName, 'validationTeamAssessment']}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:conclusion')}`}
                                    rules={[requiredValidationRule(t)]}
                                    name={[resolutionName, 'conclusion']}
                                  >
                                    <Checkbox.Group style={{ width: '100%' }}>
                                      {vmConlusion.map((value) => {
                                        return (
                                          <Row>
                                            <Col span={24}>
                                              <Checkbox
                                                style={{ width: '100%' }}
                                                value={value.value}
                                              >
                                                {value.label}
                                              </Checkbox>
                                            </Col>
                                          </Row>
                                        );
                                      })}
                                    </Checkbox.Group>
                                  </Form.Item>
                                </Col>
                              </div>
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
                              {t('addFindings')}
                            </Button>
                          </Form.Item>
                        </Col>
                      </>
                    )}
                  </Form.List>
                </Col>
              </Row>

              <p>{t('validationReport:validationMethodologyTableTitle')}</p>
              <p>{t('validationReport:tableNote')}</p>

              <Table
                columns={deskReviewValidationTableColumns}
                pagination={false}
                dataSource={deskReviewValidationDataSource}
              ></Table>

              <Form.Item
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
                <TextArea rows={6} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.5 ${t('validationReport:internalTechnicalReview')}`}
                name="internalTechnicalReview"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:internalTechnicalReview')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={6} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`3.5 ${t('validationReport:finalApproval')}`}
                name="finalApproval"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:finalApproval')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={6} />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={() => {
                  //   console.log(form.getFieldsValue());
                  // }}
                  onClick={next}

                  // htmlType="submit"
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
