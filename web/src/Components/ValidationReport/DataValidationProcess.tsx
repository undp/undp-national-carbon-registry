import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, InputNumber, Row, Select, Table, TableProps } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { ProjectCategory } from '../../enum/slRegistryEnum';
import { requiredValidationRule } from '../../Utils/validationHelper';
import NetEmissionReduction from '../Common/NetEmissonReduction';
import { ValidationStepsProps } from './StepProps';
import { ProcessSteps } from './ValidationStepperComponent';

// enum netEmissionColumnType {
//   TOTAL = 'TOTAL',
//   TOTAL_CREDITING_YEARS = 'TOTAL_CREDITING_YEARS',
//   ANNUAL_AVERAGE = 'ANNUAL_AVERAGE',
// }

const DataValidationProcess = (props: ValidationStepsProps) => {
  const {
    prev,
    next,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    existingFormValues,
    projectCategory,
    formMode,
  } = props;

  const requiredRule = [{ required: true, message: t('common:isRequired') }];

  const calculateCapacity = () => {
    const empTechnology = form.getFieldValue('employedTechnologies') as any[];
    const totalCap = empTechnology?.reduce((total, currentVal) => {
      return total + Number(currentVal.capacity);
    }, 0);
    form.setFieldValue('totalCapacity', `${totalCap} kWp`);
  };

  const applicabilityTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:no'),
      dataIndex: 'criteriaNo',
      key: 'criteriaNo',
      width: '20px',
    },
    {
      title: t('validationReport:applicabilityCriteria'),
      dataIndex: 'applicabilityCriteria',
      key: 'applicabilityCriteria',
      width: '300px',
      render: (_: any, record: any, index: number) => (
        <>
          {record.applicabilityCriteria?.map((sRow: any) => {
            return <p>{sRow}</p>;
          })}
        </>
      ),
    },
    {
      title: t('validationReport:projectActivity'),
      dataIndex: 'projectActivity',
      key: 'projectActivity',
      width: '300px',
      render: (_: any, record: any, index: number) => (
        <>
          <Form.Item name={record.projectActivity} rules={requiredRule}>
            <Input size="large" />
          </Form.Item>
          <Form.Item hidden name={['applicabilityCriteria', index, 'criteriaNo']}></Form.Item>
        </>
      ),
    },
    {
      title: t('validationReport:applicabilityCriteriaMet'),
      dataIndex: 'applicabilityCriteriaMet',
      key: 'applicabilityCriteriaMet',
      width: '100px',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={record.applicabilityCriteriaMet} rules={[requiredValidationRule(t)]}>
          <Select size="large">
            <Select.Option value="YES">{t('validationReport:yes')}</Select.Option>
            <Select.Option value="NO">{t('validationReport:no')}</Select.Option>
            <Select.Option value="NOT_APPLICABLE">
              {t('validationReport:notApplicable')}
            </Select.Option>
          </Select>
        </Form.Item>
      ),
    },
  ];

  const applicabilityTableDataSource = [
    {
      criteriaNo: '01',
      applicabilityCriteria: [
        t('validationReport:criteria1'),
        `(a) ${t('validationReport:criteria1A')}`,
        `(b) ${t('validationReport:criteria1B')}`,
      ],
      projectActivity: 'applicabilityCriteria1ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria1Met',
    },
    {
      criteriaNo: '02',
      applicabilityCriteria: [t('validationReport:criteria2')],
      projectActivity: 'applicabilityCriteria2ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria2Met',
    },
    {
      criteriaNo: '03',
      applicabilityCriteria: [t('validationReport:criteria3')],
      projectActivity: 'applicabilityCriteria3ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria3Met',
    },
    {
      criteriaNo: '04',
      applicabilityCriteria: [
        t('validationReport:criteria4'),
        <ul>
          <li>{t('validationReport:criteria4A')}</li>
          <li>{t('validationReport:criteria4B')}</li>
          <li>{t('validationReport:criteria4C')}</li>
        </ul>,
      ],
      projectActivity: 'applicabilityCriteria4ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria4Met',
    },
    {
      criteriaNo: '05',
      applicabilityCriteria: [t('validationReport:criteria5')],
      projectActivity: 'applicabilityCriteria5ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria5Met',
    },
    {
      criteriaNo: '06',
      applicabilityCriteria: [t('validationReport:criteria6')],
      projectActivity: 'applicabilityCriteria6ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria6Met',
    },
    {
      criteriaNo: '07',
      applicabilityCriteria: [t('validationReport:criteria7')],
      projectActivity: 'applicabilityCriteria7ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria7Met',
    },
    {
      criteriaNo: '08',
      applicabilityCriteria: [t('validationReport:criteria8')],
      projectActivity: 'applicabilityCriteria8ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria8Met',
    },
    {
      criteriaNo: '09',
      applicabilityCriteria: [t('validationReport:criteria9')],
      projectActivity: 'applicabilityCriteria9ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria9Met',
    },
    {
      criteriaNo: '10',
      applicabilityCriteria: [t('validationReport:criteria10')],
      projectActivity: 'applicabilityCriteria10ProjectActivity',
      applicabilityCriteriaMet: 'isApplicabilityCriteria10Met',
    },
  ];

  const baselineEmissionTableColumns: TableProps<any>['columns'] = [
    {
      title: '',
      dataIndex: 'location',
      key: 'location',
      render: (_: any, record: any, index: number) =>
        index === 0 ? (
          <p>{t('units')}</p>
        ) : (
          <Form.Item name={['baselineEmissions', index, 'location']} rules={requiredRule}>
            <Input size="large" disabled />
          </Form.Item>
        ),
    },
    {
      title: t('validationReport:projectCapacity'),
      dataIndex: 'projectCapacity',
      key: 'projectCapacity',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['baselineEmissions', index, 'projectCapacityValue']} rules={requiredRule}>
          <Input size="large" disabled={index === 0 ? true : false} />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:plantFactor'),
      dataIndex: 'plantFactor',
      key: 'plantFactor',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['baselineEmissions', index, 'plantFactorValue']} rules={requiredRule}>
          <Input size="large" disabled={index === 0 ? true : false} />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:averageEnergyOutput'),
      dataIndex: 'averageEnergyOutput',
      key: 'averageEnergyOutput',
      render: (_: any, record: any, index: number) => (
        <Form.Item name={['baselineEmissions', index, 'avgEnergyOutputValue']} rules={requiredRule}>
          <Input size="large" disabled={index === 0 ? true : false} />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:gridEmissionFactor'),
      dataIndex: 'gridEmissionFactor',
      key: 'gridEmissionFactor',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['baselineEmissions', index, 'gridEmissionFactorValue']}
          rules={requiredRule}
        >
          <InputNumber size="large" disabled={index === 0 ? true : false} />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:emissionReduction'),
      dataIndex: 'emissionReduction',
      key: 'emissionReduction',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['baselineEmissions', index, 'emissionReductionValue']}
          rules={requiredRule}
        >
          <Input size="large" disabled={index === 0 ? true : false} />
        </Form.Item>
      ),
    },
  ];

  const estimatedNetEmissionTableColumns: TableProps<any>['columns'] = [
    {
      title: t('validationReport:year'),
      dataIndex: 'year',
      key: 'year',
      render: (_: any, record: any, index: number) => (
        <>
          <span>{record?.year?.start}</span>
          <span>{record?.year?.end}</span>
        </>
      ),
    },
    {
      title: t('validationReport:estimatedBaselineEmissionsOrRemovals'),
      dataIndex: 'estimatedBaselineEmissionsOrRemovals',
      key: 'estimatedBaselineEmissionsOrRemovals',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['dvpEstimatedNetEmission', index, 'estimatedBaselineEmissionsOrRemovals']}
          rules={requiredRule}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:estimatedProjectEmissionsOrRemovals'),
      dataIndex: 'estimatedProjectEmissionsOrRemovals',
      key: 'estimatedProjectEmissionsOrRemovals',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['dvpEstimatedNetEmission', index, 'estimatedProjectEmissionsOrRemovals']}
          rules={requiredRule}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:estimatedLeakageEmissions'),
      dataIndex: 'estimatedLeakageEmissions',
      key: 'estimatedLeakageEmissions',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['dvpEstimatedNetEmission', index, 'estimatedLeakageEmissions']}
          rules={requiredRule}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
    {
      title: t('validationReport:estimatedNetGhgEmissionReductionsOrRemovals'),
      dataIndex: 'estimatedNetGhgEmissionReductionsOrRemovals',
      key: 'estimatedNetGhgEmissionReductionsOrRemovals',
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['dvpEstimatedNetEmission', index, 'estimatedNetGhgEmissionReductionsOrRemovals']}
          rules={requiredRule}
        >
          <Input size="large" />
        </Form.Item>
      ),
    },
  ];

  const addEmployedTechnologyRow = () => {
    form.setFieldsValue({
      employedTechnologies: [
        ...form.getFieldValue('employedTechnologies'),
        { siteNo: '', location: '', capacity: '' },
      ],
    });
  };

  const getEstimatedNetEmissionReduction = (values: any) => {
    const yearlyGHGEmissionReductions = values.estimatedNetEmissionReductions.map(
      (emission: any) => {
        return {
          ...emission,
          baselineEmissionReductions: Number(emission.baselineEmissionReductions),
          projectEmissionReductions: Number(emission.projectEmissionReductions),
          startDate: moment(emission.startDate).valueOf(),
          endDate: moment(emission.endDate).valueOf(),
        };
      }
    );

    const resp: any = {
      totalBaselineEmissionReductions: Number(values.totalBaselineEmissionReductions),
      totalProjectEmissionReductions: Number(values.totalProjectEmissionReductions),
      totalLeakageEmissionReductions: Number(values.totalLeakageEmissionReductions),
      totalNetEmissionReductions: Number(values.totalNetEmissionReductions),
      totalBufferPoolAllocations: Number(values.totalBufferPoolAllocations),
      totalNumberOfCredingYears: Number(values.totalNumberOfCredingYears),
      avgBaselineEmissionReductions: Number(values.avgBaselineEmissionReductions),
      avgProjectEmissionReductions: Number(values.avgProjectEmissionReductions),
      avgLeakageEmissionReductions: Number(values.avgLeakageEmissionReductions),
      avgNetEmissionReductions: Number(values.avgNetEmissionReductions),
      yearlyGHGEmissionReductions: yearlyGHGEmissionReductions,
    };
    if (projectCategory === ProjectCategory.AFOLU) {
      resp.avgBufferPoolAllocations = Number(values.avgBufferPoolAllocations);
    }
    return [resp];
  };

  const onFinish = async (values: any) => {
    const dataValidationProcessFormValues: any = {
      generalDescription: values?.generalDescription,
      employedTechnologies: values?.employedTechnologies,
      totalCapacity: Number(values?.totalCapacity.replace('kWp', '').trim()),
      totalCapacityDescription: values?.totalCapacityDescription,
      approvals: values?.approvals,
      applicationOfMethodologyTitle: values?.applicationOfMethodologyTitle,
      applicationOfMethodologyApplicability: values?.applicationOfMethodologyApplicability,
      methodologyCriteriaApplicability: values?.methodologyCriteriaApplicability,

      projectBoundary: values?.projectBoundary,
      baselineIdentification: values?.baselineIdentification,
      formulasUsedToDetermineEmissionReductions: values?.formulasUsedToDetermineEmissionReductions,
      calculationOfBaselineEmissionFactor: values?.calculationOfBaselineEmissionFactor,
      plantFactor: values?.plantFactor,
      annualEmissionReductionCalculation: values?.annualEmissionReductionCalculation,
      baselineEmissions: values?.baselineEmissions?.map((emissions: any) => {
        return {
          location: emissions.location,
          projectCapacityValue: emissions.projectCapacityValue,
          plantFactorValue: emissions.plantFactorValue,
          avgEnergyOutputValue: emissions.avgEnergyOutputValue,
          gridEmissionFactorValue: emissions.gridEmissionFactorValue,
          emissionReductionValue: emissions.emissionReductionValue,
        };
      }),
      projectEmission: values?.projectEmission,
      leakageEmission: values?.leakageEmission,
      gridEmissionFactorUnit: values?.gridEmissionFactorUnit,
      gridEmissionFactorValue: Number(values?.gridEmissionFactorValueGlobal),
      estimatedNetEmissionReductions: getEstimatedNetEmissionReduction(values),
      applicabilityCriteria1ProjectActivity: values.applicabilityCriteria1ProjectActivity,
      isApplicabilityCriteria1Met: values.isApplicabilityCriteria1Met,
      applicabilityCriteria2ProjectActivity: values.applicabilityCriteria2ProjectActivity,
      isApplicabilityCriteria2Met: values.isApplicabilityCriteria2Met,
      applicabilityCriteria3ProjectActivity: values.applicabilityCriteria3ProjectActivity,
      isApplicabilityCriteria3Met: values.isApplicabilityCriteria3Met,
      applicabilityCriteria4ProjectActivity: values.applicabilityCriteria4ProjectActivity,
      isApplicabilityCriteria4Met: values.isApplicabilityCriteria4Met,
      applicabilityCriteria5ProjectActivity: values.applicabilityCriteria5ProjectActivity,
      isApplicabilityCriteria5Met: values.isApplicabilityCriteria5Met,
      applicabilityCriteria6ProjectActivity: values.applicabilityCriteria6ProjectActivity,
      isApplicabilityCriteria6Met: values.isApplicabilityCriteria6Met,
      applicabilityCriteria7ProjectActivity: values.applicabilityCriteria7ProjectActivity,
      isApplicabilityCriteria7Met: values.isApplicabilityCriteria7Met,
      applicabilityCriteria8ProjectActivity: values.applicabilityCriteria8ProjectActivity,
      isApplicabilityCriteria8Met: values.isApplicabilityCriteria8Met,
      applicabilityCriteria9ProjectActivity: values.applicabilityCriteria9ProjectActivity,
      isApplicabilityCriteria9Met: values.isApplicabilityCriteria9Met,
      applicabilityCriteria10ProjectActivity: values.applicabilityCriteria10ProjectActivity,
      isApplicabilityCriteria10Met: values.isApplicabilityCriteria10Met,

      methodologyDeviations: values?.methodologyDeviations,
      monitoringPlan: values?.monitoringPlan,
      carbonManagementAssessment: values?.carbonManagementAssessment,
      changesOfProjectActivity: values?.changesOfProjectActivity,
      environmentImpact: values?.environmentImpact,
      commentsOfStakeholders: values?.commentsOfStakeholders,
    };
    console.log(ProcessSteps.VR_VALIDATION_PROCESS, dataValidationProcessFormValues);
    handleValuesUpdate({ [ProcessSteps.VR_VALIDATION_PROCESS]: dataValidationProcessFormValues });
  };

  return (
    <>
      {current === 4 && (
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
              <h4>4.1 {t('validationReport:projectDetails')}</h4>

              <Col md={24} xl={24}>
                <Form.Item
                  label={`4.1.1 ${t('validationReport:generalDescription')}`}
                  name="generalDescription"
                  rules={[
                    {
                      required: true,
                      message: `${t('validationReport:generalDescription')} ${t('isRequired')}`,
                    },
                  ]}
                >
                  <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                </Form.Item>
                <h4 className="custom-required">{`4.1.2 ${t(
                  'validationReport:employedTechnology'
                )}`}</h4>
                <Form.Item>
                  <Row>
                    <Col md={22} xl={22}>
                      <Row className="table-header" justify={'space-between'}>
                        <Col md={6} xl={6} style={{ paddingLeft: 10 }}>
                          {t('validationReport:siteNo')}.
                        </Col>
                        <Col md={3} xl={3} className="total-cols">
                          {t('validationReport:location')}
                        </Col>
                        <Col md={3} xl={3}>
                          {t('validationReport:capacity')}
                        </Col>
                      </Row>
                      <Form.List name="employedTechnologies">
                        {(employedTechnology, { add, remove }) => (
                          <>
                            {employedTechnology.map(
                              ({ key, name, fieldKey, ...restField }, index: number) => (
                                <>
                                  <Row justify={'space-between'} align={'middle'}>
                                    <Col md={6} xl={6} className="col1">
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'siteNo']}
                                        fieldKey={[name, 'siteNo']}
                                        rules={requiredRule}
                                        className="full-width-form-item"
                                      >
                                        <InputNumber />
                                      </Form.Item>
                                    </Col>
                                    <Col md={3} xl={3}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'location']}
                                        fieldKey={[name, 'location']}
                                        rules={requiredRule}
                                        className="full-width-form-item"
                                      >
                                        <Input />
                                      </Form.Item>
                                    </Col>
                                    <Col md={3} xl={3}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'capacity']}
                                        fieldKey={[name, 'capacity']}
                                        rules={requiredRule}
                                      >
                                        <InputNumber
                                          className="full-width-form-item"
                                          onChange={calculateCapacity}
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                </>
                              )
                            )}
                          </>
                        )}
                      </Form.List>
                    </Col>
                    <Col
                      md={2}
                      xl={2}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Button
                        onClick={() => {
                          addEmployedTechnologyRow();
                        }}
                        size="large"
                        className="addMinusBtn"
                        style={{ marginBottom: 26 }}
                        icon={<PlusOutlined />}
                      ></Button>
                    </Col>
                  </Row>
                  <Row justify={'space-between'}>
                    <Col md={22} xl={22}>
                      <Row style={{ width: '100%' }} justify={'space-between'}>
                        <Col md={6} xl={6}>
                          {t('validationReport:totalCapacity')}
                        </Col>
                        <Col md={3} xl={3}></Col>
                        <Col md={3} xl={3}>
                          <Form.Item name="totalCapacity">
                            <Input disabled />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Col>

                    <Col md={2} xl={2}></Col>
                  </Row>
                </Form.Item>
              </Col>

              <Row gutter={60}>
                <Col md={24} xl={24}>
                  <Form.Item name="totalCapacityDescription">
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <Form.Item
                    label={`4.2 ${t('validationReport:approvals')}`}
                    name="approvals"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:approvals')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                </Col>
                <Col>
                  <h4>4.3 {t('validationReport:applicationofMethodology')}</h4>
                  <Form.Item
                    label={`4.3.1 ${t('validationReport:titleandreference')}`}
                    name="applicationOfMethodologyTitle"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:titleandreference')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <Form.Item
                    label={`4.3.2 ${t('validationReport:applicability')}`}
                    name="applicationOfMethodologyApplicability"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:applicability')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <Table
                    dataSource={applicabilityTableDataSource}
                    columns={applicabilityTableColumns}
                    pagination={false}
                  ></Table>

                  <Form.Item
                    label={`4.3.3 ${t('validationReport:projectBoundary')}`}
                    name="projectBoundary"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:projectBoundary')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.3.4 ${t('validationReport:baselineIdentification')}`}
                    name="baselineIdentification"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:baselineIdentification')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.3.5 ${t('validationReport:forumulaUserInEmissionReduction')}`}
                    name="formulasUsedToDetermineEmissionReductions"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:forumulaUserInEmissionReduction')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <h4>
                    4.3.6 {t('validationReport:quantificationOfGhgEmissionReductionsAndRemoval')}
                  </h4>
                  <Form.Item
                    label={`${t('validationReport:calculationOfBaselineEmissionFactor')}`}
                    name="calculationOfBaselineEmissionFactor"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:calculationOfBaselineEmissionFactor')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  {/* TODO: sss */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span>{t('validationReport:gridEmissionFactorEfcmGridY')}</span>
                    <div style={{ width: '150px' }}>
                      <Form.Item name="gridEmissionFactorValueGlobal">
                        <InputNumber disabled />
                      </Form.Item>
                    </div>
                    <div style={{ width: '150px' }}>
                      <Form.Item name="gridEmissionFactorUnit">
                        <Input value={'tCO2e/MWh'} disabled />
                      </Form.Item>
                    </div>
                    <div style={{ width: '220px' }}>
                      <Input value={'Published by SLSEA (2020)'} disabled />
                    </div>
                  </div>
                  <Form.Item
                    label={`${t('validationReport:plantFactor')}`}
                    name="plantFactor"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:plantFactor')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`${t('validationReport:annualEmissionReductionCalculation')}`}
                    name="annualEmissionReductionCalculation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:annualEmissionReductionCalculation')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <h4 className="custom-required">{`${t('validationReport:baselineEmission')}`}</h4>

                  {/* <Table
                      dataSource={baselineEmissionDataSource}
                      columns={baselineEmissionTableColumns}
                      pagination={false}
                    ></Table> */}
                  <div className="estimated-emmissions-table-form">
                    <Row className="header" justify={'space-between'} gutter={[4, 8]}>
                      <Col md={6} xl={6}></Col>
                      <Col md={3} xl={3}>
                        {t('validationReport:projectCapacity')}
                      </Col>
                      <Col md={3} xl={3}>
                        {t('validationReport:plantFactor')}
                      </Col>
                      <Col md={3} xl={3}>
                        {t('validationReport:averageEnergyOutput')}
                      </Col>
                      <Col md={3} xl={3}>
                        {t('validationReport:gridEmissionFactor')}
                      </Col>
                      <Col md={3} xl={3}>
                        {t('validationReport:emissionReduction')}
                      </Col>
                      <Col md={3} xl={3}></Col>
                    </Row>

                    <Row justify={'space-between'} style={{ marginBottom: 10 }} gutter={[4, 8]}>
                      <Col md={6} xl={6}>
                        {t('validationReport:units')}
                      </Col>
                      <Col md={3} xl={3}>
                        <Input size="large" value={'kWp'} disabled />
                      </Col>
                      <Col md={3} xl={3}>
                        <Input size="large" value={'%'} disabled />
                      </Col>
                      <Col md={3} xl={3}>
                        <Input size="large" value={'MWh/Year'} disabled />
                      </Col>
                      <Col md={3} xl={3}>
                        <Input size="large" value={'tCO2/MWh'} disabled />
                      </Col>
                      <Col md={3} xl={3}>
                        <Input size="large" value={'tCO2/Year'} disabled />
                      </Col>
                      <Col md={3} xl={3}></Col>
                    </Row>

                    <Form.List name="baselineEmissions">
                      {(baselineEmissions, { add, remove }) => (
                        <>
                          {baselineEmissions.map(
                            ({ key, name, fieldKey, ...restField }, index: number, fieldList) => (
                              <>
                                <Row justify={'space-between'} gutter={[4, 8]}>
                                  <Col md={6} xl={6} className="col1">
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'location']}
                                      fieldKey={[name, 'location']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      {
                                        <Input
                                          size="large"
                                          className="full-width-form-item"
                                          disabled
                                        />
                                      }
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'projectCapacityValue']}
                                      fieldKey={[name, 'projectCapacityValue']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <InputNumber
                                        size="large"
                                        className="full-width-form-item"
                                        disabled={FormMode.VIEW === formMode}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'plantFactorValue']}
                                      fieldKey={[name, 'plantFactorValue']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <InputNumber
                                        size="large"
                                        className="full-width-form-item"
                                        disabled={FormMode.VIEW === formMode}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'avgEnergyOutputValue']}
                                      fieldKey={[name, 'avgEnergyOutputValue']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <InputNumber
                                        size="large"
                                        className="full-width-form-item"
                                        disabled={FormMode.VIEW === formMode}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'gridEmissionFactorValue']}
                                      fieldKey={[name, 'gridEmissionFactorValue']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <InputNumber
                                        className="full-width-form-item"
                                        disabled={FormMode.VIEW === formMode}
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3}>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'emissionReductionValue']}
                                      fieldKey={[name, 'emissionReductionValue']}
                                      rules={[requiredValidationRule(t)]}
                                    >
                                      <InputNumber
                                        className="full-width-form-item"
                                        disabled={FormMode.VIEW === formMode}
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col md={3} xl={3} style={{ marginTop: 0 }}>
                                    {baselineEmissions.length > 1 && (
                                      <Button
                                        onClick={() => {
                                          remove(name);
                                        }}
                                        size="small"
                                        className="addMinusBtn"
                                        style={{ marginRight: 2 }}
                                        icon={<MinusOutlined />}
                                      ></Button>
                                    )}
                                    {index === baselineEmissions.length - 1 && (
                                      <Button
                                        onClick={() => {
                                          add();
                                        }}
                                        size="middle"
                                        className="addMinusBtn"
                                        // block
                                        icon={<PlusOutlined />}
                                      >
                                        {/* Add Entity */}
                                      </Button>
                                    )}
                                  </Col>
                                </Row>
                              </>
                            )
                          )}
                        </>
                      )}
                    </Form.List>
                  </div>

                  <Form.Item
                    label={`${t('validationReport:projectEmission')}`}
                    name="projectEmission"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:projectEmission')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <Form.Item
                    label={`${t('validationReport:leakageEmission')}`}
                    name="leakageEmission"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:leakageEmission')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <h4 className="custom-required">{`${t(
                    'validationReport:estimatedNetEmissionReduction'
                  )}`}</h4>

                  <NetEmissionReduction
                    form={form}
                    t={t}
                    projectCategory={projectCategory}
                  ></NetEmissionReduction>
                  {/* </Form.Item> */}
                  <Form.Item
                    label={`4.3.7 ${t('validationReport:methodologyDeviations')}`}
                    name="methodologyDeviations"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:projectEmission')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>

                  <Form.Item
                    label={`4.3.8 ${t('validationReport:monitoringPlan')}`}
                    name="monitoringPlan"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:monitoringPlan')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.4 ${t('validationReport:carbonManagementAssessment')}`}
                    name="carbonManagementAssessment"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:carbonManagementAssessment')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.5 ${t('validationReport:changesOfTheProjectActivity')}`}
                    name="changesOfProjectActivity"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:changesOfTheProjectActivity')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.6 ${t('validationReport:environmentImpact')}`}
                    name="environmentImpact"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:environmentImpact')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                  <Form.Item
                    label={`4.6 ${t('validationReport:commentsOfStakeholders')}`}
                    name="commentsOfStakeholders"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationReport:commentsOfStakeholders')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
                  </Form.Item>
                </Col>
              </Row>

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

export default DataValidationProcess;
