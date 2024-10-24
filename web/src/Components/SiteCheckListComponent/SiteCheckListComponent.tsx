import { Col, DatePicker, Form, Row, Select, TimePicker } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import Input from 'antd/lib/input/Input';
import { i18n } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SiteCheckListComponent.scss';
import moment from 'moment';
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';

import TextArea from 'antd/lib/input/TextArea';

const SiteCheckListComponent = (props: { translator: i18n }) => {
  const [form] = useForm();
  const { translator } = props;

  const { t } = translator;

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const onFinish = (values: any) => {
    console.log('-------values--------', values);
  };

  return (
    <div className="site-check-list-container">
      <div className="title-container">
        <div className="main">Site Visit Checklist</div>
      </div>

      <div className="forms-container">
        <Form
          className="site-check-list-form"
          layout="vertical"
          requiredMark={true}
          form={form}
          onFinish={(values: any) => {
            onFinish(values);
          }}
        >
          <Row>
            <Col md={14} xl={14}>
              <Form.Item
                label="Project Name"
                name="projectName"
                rules={[
                  {
                    required: true,
                    message: `Project Name ${t('isRequired')}`,
                  },
                ]}
              >
                <Input disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Organization Name"
                name="organizationName"
                rules={[
                  {
                    required: true,
                    message: `Organization Name ${t('isRequired')}`,
                  },
                ]}
              >
                <Input disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Location"
                name="location"
                rules={[
                  {
                    required: true,
                    message: `Location ${t('isRequired')}`,
                  },
                ]}
              >
                <Input disabled={disableFields} />
              </Form.Item>

              <Form.Item
                label="Date"
                name="date"
                rules={[
                  {
                    required: true,
                    message: `Date ${t('isRequired')}`,
                  },
                ]}
              >
                <DatePicker
                  size="large"
                  disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                label="Time"
                name="time"
                rules={[
                  {
                    required: true,
                    message: `Time ${t('isRequired')}`,
                  },
                ]}
              >
                <TimePicker placeholder="Select Time" disabled={disableFields} />
              </Form.Item>
            </Col>
          </Row>

          {/* Project Details Start */}
          <>
            <h4 className="section-title">Project Details</h4>

            <Row gutter={40}>
              <Col md={12} xl={12}>
                <Form.Item
                  label="Project Start Date"
                  name="projectStartDate"
                  rules={[
                    {
                      required: true,
                      message: `Project Start Date ${t('isRequired')}`,
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    disabled={disableFields}
                  />
                </Form.Item>

                <div className="projectTrack">
                  <Form.Item
                    label="Project Track"
                    name="projectTrack"
                    rules={[
                      {
                        required: true,
                        message: `Project Track ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Project Factor"
                  name="projectFactor"
                  rules={[
                    {
                      required: true,
                      message: `Project Factor ${t('isRequired')}`,
                    },
                  ]}
                >
                  <Input disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label="Leakage Emission"
                  name="leakageEmission"
                  rules={[
                    {
                      required: true,
                      message: `Leakage Emission ${t('isRequired')}`,
                    },
                  ]}
                >
                  <Input disabled={disableFields} />
                </Form.Item>
              </Col>

              <Col md={12} xl={12}>
                <Form.Item
                  label="Project Commission Date"
                  name="projectCommissionDate"
                  rules={[
                    {
                      required: true,
                      message: `Project Commision Date ${t('isRequired')}`,
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  label="Project Capacity"
                  name="projectCapacity"
                  rules={[
                    {
                      required: true,
                      message: `Project Capacity ${t('isRequired')}`,
                    },
                    {
                      validator(rule, value) {
                        if (!value) {
                          return Promise.resolve();
                        }

                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be an integer!'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label="Project Emission"
                  name="projectEmission"
                  rules={[
                    {
                      required: true,
                      message: `Project Emission ${t('isRequired')}`,
                    },
                    {
                      validator(rule, value) {
                        if (!value) {
                          return Promise.resolve();
                        }

                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be an integer!'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>
          </>
          {/* Project Details End */}

          {/* Eligibility Criteria Start */}
          <>
            <h4 className="section-title">Eligibility</h4>
            <div className="checklist-table-form">
              <Row className="header" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10}>
                  Eligibility Criteria
                </Col>
                <Col md={4} xl={4}>
                  Yes/No
                </Col>
                <Col md={8} xl={8}>
                  Comments
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>1.</div>
                    <div>
                      The project activity shall be a new project, which will reduce/absorb GHG
                      emissions or the project activity shall be a project, which was implemented on
                      or after 2010 in order to offset GHG emission within the organization.
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility1YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility1Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>2.</div>
                    <div>The project activity shall be located in Sri Lanka.</div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility2YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility2Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>3.</div>
                    <div>
                      The project activity shall not happen in the absence of benefits received from
                      trading Sri Lanka Certified Emission Reduction units (SCERs). (This is not
                      applicable Track II)
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility3YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility3Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>4.</div>
                    <div>
                      The project shall be implemented voluntarily by the project owner but not
                      implemented based on legislation or regulations in the country
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility4YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility4Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>5.</div>
                    <div>
                      The project activity satisfies environmental standard and regulations of the
                      country
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility5YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('siteVisitCheckList:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility5Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('CMAForm:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
                <Col md={10} xl={10} className="col-1">
                  <div className="text-row">
                    <div>6.</div>
                    <div>
                      The project shall not have been registered under any other national or
                      international scheme. However, if a registered project under other scheme is
                      willing to register with SLCCS, then, such project shall be deregistered from
                      the other scheme in order to be eligible
                    </div>
                  </div>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="eligibility6YesNo"
                    rules={[
                      {
                        required: true,
                        message: `${t('CMAForm:required')}`,
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select" disabled={disableFields}>
                      <Select.Option value={true}>Yes</Select.Option>
                      <Select.Option value={false}>No</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="eligibility6Comment"
                    rules={[
                      {
                        required: true,
                        message: `${t('CMAForm:required')}`,
                      },
                    ]}
                  >
                    <TextArea rows={3} disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </>
          {/* Eligibility Criteria End */}

          {/* Document Review Start */}
          <h4 className="section-title">Document Review</h4>
          <div className="checklist-table-form">
            <Row className="header" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10}>
                Document Name
              </Col>
              <Col md={4} xl={4}>
                Availability
              </Col>
              <Col md={8} xl={8}>
                Comments
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>1.</div>
                  <div>
                    Feasibility studies or preliminary assessments undertaken for the project
                    activities.
                  </div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc1FeasibilityStudiesAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc1FeasibilityStudiesComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>2.</div>
                  <div>Power purchasing agreement.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc2PowerPurchasingAgreementAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc2PowerPurchasingAgreementComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>3.</div>
                  <div>Testing and commissioning certificates.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc3TestingCertificateAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc3TestingCertificateComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>4.</div>
                  <div>Calibration Reports of Energy meters.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc4CalibrationReportsAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc4CalibrationReportsComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>5.</div>
                  <div>Data management systems.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc5DataManagementAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('siteVisitCheckList:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc5DataManagementComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>6.</div>
                  <div>Monthly electricity generation records (Spreadsheets).</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc6MonthlyElectricityRecordsAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc6MonthlyElectricityRecordsComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>7.</div>
                  <div>Monthly electricity invoices.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc7MonthlyElectricityInvoicesAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc7MonthlyElectricityInvoicesComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>8.</div>
                  <div>Training records of personnel engaging in the monitoring activities.</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc8TrainingRecordsAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc8TrainingRecordsComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row" gutter={24} justify={'space-between'} align={'top'}>
              <Col md={10} xl={10} className="col-1">
                <div className="text-row">
                  <div>9.</div>
                  <div>Internal audit reports (If available)</div>
                </div>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="doc9InternalAuditReportsAvailability"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <Select size="large" placeholder="Select" disabled={disableFields}>
                    <Select.Option value={true}>Yes</Select.Option>
                    <Select.Option value={false}>No</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col md={8} xl={8}>
                <Form.Item
                  name="doc9InternalAuditReportsComment"
                  rules={[
                    {
                      required: true,
                      message: `${t('CMAForm:required')}`,
                    },
                  ]}
                >
                  <TextArea rows={3} disabled={disableFields} />
                </Form.Item>
              </Col>
            </Row>
          </div>
          {/* Document Review End */}

          {/* Interview of the StakeHolders start*/}
          <>
            <h4 className="section-title">Interview of the Stakeholders</h4>

            <div className="stakeholders-section">
              <Row gutter={40}>
                <Col md={12} xl={12}>
                  <Form.Item
                    label="Stakeholder Name"
                    name="stakeholderName"
                    rules={[
                      {
                        required: true,
                        message: `Stakeholder Name ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    label="Contact Details"
                    name="contactDetails"
                    rules={[
                      {
                        required: true,
                        message: `Contact Details ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </>
          {/* Interview of the StakeHolders end*/}
        </Form>
      </div>
    </div>
  );
};

export default SiteCheckListComponent;
