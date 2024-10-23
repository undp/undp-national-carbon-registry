import React, { useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input, Checkbox, Table, TableProps } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined } from '@ant-design/icons';

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

  const requiredRule = [{ required: true, message: t('common:isRequired') }];

  const appointmentTeamMembersTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:name'),
      dataIndex: 'appointmentTeamMembersName',
      key: 'appointmentTeamMembersName',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['vmAppointmentTeamMembers', index, 'name']} rules={requiredRule}>
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
          name={['vmAppointmentTeamMembers', index, 'company']}
          initialValue={record?.appointmentTeamMembersCompany}
          rules={requiredRule}
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
        <Form.Item name={['vmAppointmentTeamMembers', index, 'function']} rules={requiredRule}>
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:taskPerformed'),
      dataIndex: 'appointmentTeamMembersTaskPerformed',
      key: 'appointmentTeamMembersTaskPerformed',
      render: (_: any, record: any, index: number) => (
        <>
          <Checkbox.Group style={{ display: 'flex' }}>
            <Form.Item
              name={['vmAppointmentTeamMembers', index, 'taskPerformedDR']}
              rules={requiredRule}
            >
              <Checkbox value={t('validationReport:dr')}>{t('validationReport:dr')}</Checkbox>
            </Form.Item>
            <Form.Item
              name={['vmAppointmentTeamMembers', index, 'taskPerformedSV']}
              rules={requiredRule}
            >
              <Checkbox value={t('validationReport:sv')}>{t('validationReport:sv')}</Checkbox>
            </Form.Item>
            <Form.Item
              name={['vmAppointmentTeamMembers', index, 'taskPerformedRI']}
              rules={requiredRule}
            >
              <Checkbox value={t('validationReport:ri')}>{t('validationReport:ri')}</Checkbox>
            </Form.Item>
            <Form.Item
              name={['vmAppointmentTeamMembers', index, 'taskPerformedTR']}
              rules={requiredRule}
            >
              <Checkbox value={t('validationReport:tr')}>{t('validationReport:tr')}</Checkbox>
            </Form.Item>
          </Checkbox.Group>
        </>
      ),
    },
  ];

  const backgroundInvestigationTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:name'),
      dataIndex: 'backgroundInvestigationName',
      key: 'backgroundInvestigationName',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['vmdrBackgroundInvestigation', index, 'name']} rules={requiredRule}>
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
          name={['vmdrBackgroundInvestigation', index, 'designation']}
          rules={requiredRule}
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
          name={['vmdrBackgroundInvestigation', index, 'OrganizationEntity']}
          rules={requiredRule}
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
          name={['vmdrBackgroundInvestigation', index, 'methodTelephone']}
          rules={requiredRule}
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
          name={['vmdrBackgroundInvestigation', index, 'mainTopicCovered']}
          rules={requiredRule}
        >
          <TextArea rows={4} />
        </Form.Item>
      ),
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
        record?.specificSection.map((val: any) => {
          return <p>{val}</p>;
        }),
    },
    {
      title: t('validationReport:noOfCars'),
      dataIndex: 'noOfCars',
      key: 'noOfCars',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['vmdrValidationCategory', index, 'noOfCars']} rules={requiredRule}>
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:noOfCL'),
      dataIndex: 'noOfCL',
      key: 'noOfCL',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['vmdrValidationCategory', index, 'noOfCL']} rules={requiredRule}>
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:noOfFAR'),
      dataIndex: 'noOfFAR',
      key: 'noOfFAR',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['vmdrValidationCategory', index, 'noOfFAR']} rules={requiredRule}>
          <Input size="large" />
        </Form.Item>
      ),
    },
  ];

  const deskReviewValidationDataSource = [
    {
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
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:involveParties')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:projectSpecification')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:startDateCommisionDate')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technicalProjectDescription')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:contributiontoSustainableDevelopment')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:generalDescriptionOfProjectActivity'),
      specificSection: [t('validationReport:technologyEmployed')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:applicationoftheMethodology')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:baselineIdentification')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
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
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:additionalityDetermination')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringMethodology')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:monitoringPlan')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:projectBaselinePlan'),
      specificSection: [t('validationReport:projectmanagementplanning')],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:durationOfProject'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:environmentalimpacts'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:stakeholderComments'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
    {
      validationCategory: t('validationReport:SUM'),
      specificSection: [],
      noOfCars: '',
      noOfCL: '',
      noOfFAR: '',
    },
  ];

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

              <Table
                pagination={false}
                dataSource={appointmentTeamMembersDataSource}
                columns={appointmentTeamMembersTableColumns}
              ></Table>
              <Button
                size={'large'}
                onClick={() => {
                  setAppointmentTeamMembersDataSource((prevATM) => {
                    return [...prevATM, emptyAppointmentTeamMembersDataSourceRow];
                  });
                }}
              >
                {t('validationReport:addRow')}
              </Button>
              <p>{t('validationReport:memberDescription')}</p>

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
                    name="vmOnSiteInspection"
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
                    name="environmentImpact"
                    rules={requiredRule}
                  >
                    <Table
                      dataSource={backgroundInvestigationDataSource}
                      columns={backgroundInvestigationTableColumns}
                      pagination={false}
                    ></Table>
                  </Form.Item>
                  <Button
                    onClick={() => {
                      setBackgroundInvestigationDataSource((prevBI) => {
                        return [...prevBI, emptyBackgroundInvestigationRow];
                      });
                    }}
                  >
                    {t('addRow')}
                  </Button>
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
                  <Form.Item
                    label={`3.3 ${t('validationReport:draftValidation')}`}
                    name="environmentImpact"
                  >
                    <p>{t('validationReport:draftValidationDesc')}</p>
                  </Form.Item>
                </Col>

                <Col>
                  <h4>3.4 {t('validationReport:resolutionsOfFindings')}</h4>

                  <Form.List name="users">
                    {(resolutionOfFindingsList, { add, remove }) => (
                      <>
                        <Col span={24}>
                          {resolutionOfFindingsList.map(
                            ({
                              key: resolutionkey,
                              name: resolutionName,
                              fieldKey: resolutionFieldKey,
                              ...resolutionRestField
                            }) => (
                              <div className="form-section">
                                <Col md={24} xl={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    name={[resolutionName, 'vmResolutionsOfFindingsType']}
                                  >
                                    <Row>
                                      <Col md={3}>{t('validationReport:typeOfFindings')}</Col>
                                      <Col md={12}>
                                        <Checkbox.Group options={vmTypeOfFindings} />
                                      </Col>
                                    </Row>
                                  </Form.Item>
                                  <Form.Item
                                    {...resolutionRestField}
                                    name={[resolutionName, 'vmResolutionsOfFindingsNo']}
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
                                    name={[resolutionName, 'vmResolutionsOfFindingsRefCMA']}
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
                                    name={[
                                      resolutionName,
                                      'vmResolutionsOfFindingsActionRequestByTeam',
                                    ]}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:summaryOfProjectOwnerResponse')}`}
                                    name={[
                                      resolutionName,
                                      'vmResolutionsOfFindingsSummaryOfProjectOwnerResponse',
                                    ]}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:validationTeamAssessment')}`}
                                    name={[
                                      resolutionName,
                                      'vmResolutionsOfFindingsValidationTeamAssessment',
                                    ]}
                                  >
                                    <TextArea rows={4} />
                                  </Form.Item>
                                </Col>

                                <Col span={24}>
                                  <Form.Item
                                    {...resolutionRestField}
                                    label={`${t('validationReport:conclusion')}`}
                                    name={[resolutionName, 'vmResolutionsOfFindingsConclusion']}
                                  >
                                    <Checkbox.Group options={vmConlusion} style={{ width: '100%' }}>
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
                            <Button type="dashed" onClick={() => add()} block>
                              Add
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
                name="vmFinalValidation"
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
                name="vmInternalTechnicalReview"
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
                name="vmFinalApproval"
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
                <Button type="primary" size={'large'} onClick={next} htmlType="submit">
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
