import { InfoCircleOutlined, MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, DatePicker, Form, Input, Row, Select, Upload } from 'antd';
import FormItemLabel from 'antd/es/form/FormItemLabel';

import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocType } from '../../../Definitions/Enums/document.type';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { fileUploadValueExtract } from '../../../Utils/utilityHelper';

export const VerificationFindingStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, prev, onValueChange } = props;
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const t = translator.t;
  return (
    <>
      {current === 3 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              disabled={FormMode.VIEW === formMode}
              onFinish={async (values: any) => {
                if (FormMode.VIEW !== formMode) {
                  values.optionalDocuments = await fileUploadValueExtract(
                    values,
                    'optionalDocuments'
                  );

                  values?.siteLocations?.forEach(async (val: any) => {
                    val.commissioningDate = moment(val?.commissioningDate).startOf('day').valueOf();
                  });
                }
                onValueChange({ verificationFinding: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:verificationFinding')}`}
                      name="verificationFinding"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:verificationFinding')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.1 ${t('verificationReport:remainingIssues')}`}
                      name="remainingIssues"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:remainingIssues')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.2 ${t('verificationReport:monitoringReport')}`}
                      name="monitoringReport"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:monitoringReport')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                    <Form.Item
                      label={`3.3 ${t('verificationReport:projectImplementation')}`}
                      name="projectImplementation"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:projectImplementation')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <Row gutter={[40, 16]} className="form-section">
                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:siteLocation')}</h4>
                      </div>
                    </Col>

                    <Col xl={10} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:commissioningDate')}</h4>
                      </div>
                    </Col>
                  </Row>

                  <Form.List name="siteLocations">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row
                              justify={'space-between'}
                              gutter={[16, 16]}
                              className="form-section"
                            >
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'siteLocation']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:siteLocation')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={10} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'commissioningDate']}
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
                                              `${t('verificationReport:commissioningDate')} ${t(
                                                'isRequired'
                                              )}`
                                            );
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <DatePicker
                                      size="large"
                                      disabledDate={(currentDate: any) =>
                                        currentDate < moment().startOf('day')
                                      }
                                    />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={2} md={24}>
                                <div className="form-list-actions">
                                  {/* <h4>Entity {name + 2}</h4> */}
                                  <Form.Item>
                                    {name !== 0 && (
                                      <Button
                                        // type="dashed"
                                        onClick={() => {
                                          remove(name);
                                        }}
                                        size="large"
                                        className="addMinusBtn"
                                        // block
                                        icon={<MinusOutlined />}
                                      >
                                        {/* Remove Entity */}
                                      </Button>
                                    )}
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
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
                            >
                              {/* Add Entity */}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Col>
                <Col xl={12} md={24}></Col>
              </Row>
              <h4 className="form-section-title">{`3.4  ${t(
                'verificationReport:emissionReductionDeterminingMethodology'
              )}`}</h4>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`3.4.1 ${t('verificationReport:applicability')}`}
                      name="applicability"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:applicability')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.4.2 ${t('verificationReport:complianceWithMethodologyAndTools')}`}
                      name="complianceWithMethodologyAndTools"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            'verificationReport:complianceWithMethodologyAndTools'
                          )} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.4.3 ${t('verificationReport:complianceWithMonitoringPlan')}`}
                      name="complianceWithMonitoringPlan"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:complianceWithMonitoringPlan')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                    <Col xl={8} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:dataParameter')}</h4>
                      </div>
                    </Col>

                    <Col xl={8} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:sourceOfData')}</h4>
                      </div>
                    </Col>
                    <Col xl={8} md={24}>
                      <div className="step-form-right-col">
                        <h4>{t('verificationReport:reportedValue')}</h4>
                      </div>
                    </Col>
                  </Row>

                  <Form.List name="complianceList">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row
                              justify={'space-between'}
                              gutter={[16, 16]}
                              className="form-section"
                            >
                              <Col xl={8} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'dataParameter']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:dataParameter')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>

                              <Col xl={8} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'sourceOfData']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:sourceOfData')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={7} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'reportedValue']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:reportedValue')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={1} md={24}>
                                <div className="form-list-actions">
                                  {/* <h4>Entity {name + 2}</h4> */}
                                  <Form.Item>
                                    {name !== 0 && (
                                      <Button
                                        // type="dashed"
                                        onClick={() => {
                                          remove(name);
                                        }}
                                        size="large"
                                        className="addMinusBtn"
                                        // block
                                        icon={<MinusOutlined />}
                                      >
                                        {/* Remove Entity */}
                                      </Button>
                                    )}
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
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
                            >
                              {/* Add Entity */}
                            </Button>
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Col>
              </Row>

              <h4 className="form-section-title">{`3.4.4  ${t(
                'verificationReport:monitoredExPost'
              )}`}</h4>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:exPostDataParameter')}
                      name="exPostDataParameter"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:exPostDataParameter')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:exPostFrequency')}
                      name="exPostFrequency"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:exPostFrequency')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:exPostIsMeasuring')}
                      name="exPostIsMeasuring"
                      rules={[
                        {
                          required: false,
                          message: `${t('verificationReport:exPostIsMeasuring')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Select size="large" placeholder={t('verificationReport:selectYourAnswer')}>
                        <Select.Option value="yes">Yes</Select.Option>
                        <Select.Option value="no">No</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:exPostCalibration')}
                      name="exPostCalibration"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:exPostCalibration')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:exPostMonitoringEquipment')}
                      name="exPostMonitoringEquipment"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:exPostMonitoringEquipment')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Row>
                      <Col xl={12} md={24} style={{ paddingTop: '8px' }}>
                        <label> The approach mentioned above is</label>
                      </Col>
                      <Col xl={12} md={24}>
                        <Form.Item
                          name="aboveApproach"
                          rules={[
                            {
                              required: false,
                              message: `${t('verificationReport:aboveApproach')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col xl={12} md={24}></Col>
                <Col xl={24} md={24}>
                  <h4 className="form-section-title">
                    <b>Project Emissions</b>
                  </h4>
                  Project emission may include the emissions associated with the project
                  installation, operation and maintenance. As per the methodology applied, these
                  emissions are not significant and attributable to the project activity, hence
                  project emissions are reported as zero.
                  <h4 className="form-section-title">
                    <b>Leakage Emissions</b>
                  </h4>
                  There are no leakages associated with movement of old equipment that need to be
                  assessed as per the methodology AMS-I.D, Version18. Thus, there is no leakage
                  emission form the project activity for this monitoring period.
                  <h4 className="form-section-title">
                    <b>Emission Reductions</b>
                  </h4>
                  Therefore, the emission reductions in this monitoring period are: ERy = BEy - PEy
                  - LEy
                </Col>
                <Col xl={8} md={24}>
                  <div className="step-form-left-col">
                    <Row>
                      <Col xl={10} md={24} style={{ paddingTop: '8px' }}>
                        <label> ERy = 775– 0 – 0 =</label>
                      </Col>
                      <Col xl={14} md={24}>
                        <Form.Item
                          name="emissionReductions"
                          rules={[
                            {
                              required: false,
                              message: `${t('verificationReport:emissionReductions')} ${t(
                                'isRequired'
                              )}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col xl={16} md={24}></Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`3.1.1 ${t('verificationReport:accuracyOReductionCalculations')}`}
                      name="accuracy"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:accuracyOReductionCalculations')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>

                    <Form.Item
                      label={`3.1.2 ${t('verificationReport:managementSystemAndQualityControl')}`}
                      name="qualityControl"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            'verificationReport:managementSystemAndQualityControl'
                          )} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:documentUpload')}
                      name="optionalDocuments"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={FormMode.VIEW !== formMode}
                      rules={
                        FormMode.VIEW === formMode
                          ? []
                          : [
                              {
                                validator: async (rule, file) => {
                                  if (file?.length > 0) {
                                    if (file[0]?.size > maximumImageSize) {
                                      // default size format of files would be in bytes -> 1MB = 1000000bytes
                                      throw new Error(`${t('common:maxSizeVal')}`);
                                    }
                                  }
                                },
                              },
                            ]
                      }
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
                        // maxCount={1}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          Upload
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <h4 className="form-section-title">{`3.1.3  ${t(
                'verificationReport:resolutionOfFindings'
              )}`}</h4>
              <Form.List name="resolutionOfFindings">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <>
                        <Row justify={'space-between'} gutter={[16, 16]} className="form-section">
                          <Col xl={22} md={24}>
                            <Row>
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <label style={{ display: 'flex', marginTop: '5px' }}>
                                    {t('verificationReport:typeOfTheFinding')}
                                  </label>
                                </div>
                              </Col>
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'type']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:typeOfTheFinding')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Checkbox.Group style={{ display: 'flex' }}>
                                      <Checkbox value={t('verificationReport:cl')}>
                                        {t('verificationReport:cl')}
                                      </Checkbox>
                                      <Checkbox value={t('verificationReport:car')}>
                                        {t('verificationReport:car')}
                                      </Checkbox>
                                      <Checkbox value={t('verificationReport:far')}>
                                        {t('verificationReport:far')}
                                      </Checkbox>
                                    </Checkbox.Group>
                                  </Form.Item>
                                </div>
                              </Col>

                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <label style={{ display: 'flex', marginTop: '5px' }}>
                                    {t('verificationReport:findingNo')}
                                  </label>
                                </div>
                              </Col>
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'findingNo']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:findingNo')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>

                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <label style={{ display: 'flex', marginTop: '5px' }}>
                                    {t('verificationReport:refToMr')}
                                  </label>
                                </div>
                              </Col>
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    name={[name, 'refToMr']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:refToMr')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <Row>
                              <Col xl={24} md={24}>
                                <div className="step-form-left-col">
                                  <Form.Item
                                    label={`${t('verificationReport:descriptionOfFinding')}`}
                                    name={[name, 'description']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t(
                                          'verificationReport:descriptionOfFinding'
                                        )} ${t('isRequired')}`,
                                      },
                                    ]}
                                  >
                                    <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <Row>
                              <Col xl={24} md={24}>
                                <div className="step-form-left-col">
                                  <Form.Item
                                    label={`${t('verificationReport:summaryOfOwnerResponse')}`}
                                    name={[name, 'summary']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t(
                                          'verificationReport:summaryOfOwnerResponse'
                                        )} ${t('isRequired')}`,
                                      },
                                    ]}
                                  >
                                    <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <Row>
                              <Col xl={24} md={24}>
                                <div className="step-form-left-col">
                                  <Form.Item
                                    label={`${t('verificationReport:verificationTeamAssessment')}`}
                                    name={[name, 'assesment']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t(
                                          'verificationReport:verificationTeamAssessment'
                                        )} ${t('isRequired')}`,
                                      },
                                    ]}
                                  >
                                    <TextArea rows={4} disabled={FormMode.VIEW === formMode} />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>

                            <Row>
                              <Col xl={12} md={24}>
                                <div className="step-form-right-col">
                                  <Form.Item
                                    label={t('verificationReport:conclusion')}
                                    name={[name, 'conclusion']}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('verificationReport:conclusion')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Checkbox.Group>
                                      <Checkbox value="toBeChecked">
                                        {t('verificationReport:toBeChecked')}
                                      </Checkbox>
                                      <br />
                                      <Checkbox value="additionalActions">
                                        {t('verificationReport:additionalActions')}
                                      </Checkbox>
                                      <br />
                                      <Checkbox value="documentationCorrected">
                                        {t('verificationReport:documentationCorrected')}
                                      </Checkbox>
                                      <br />
                                      <Checkbox value="actionsTaken">
                                        {t('verificationReport:actionsTaken')}
                                      </Checkbox>
                                    </Checkbox.Group>
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                          </Col>

                          <Col xl={2} md={24}>
                            <div className="form-list-actions">
                              {/* <h4>Entity {name + 2}</h4> */}
                              <Form.Item>
                                {name !== 0 && (
                                  <Button
                                    onClick={() => {
                                      remove(name);
                                    }}
                                    size="large"
                                    className="addMinusBtn"
                                    icon={<MinusOutlined />}
                                  >
                                    {/* Remove Entity */}
                                  </Button>
                                )}
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>
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
                        >
                          Add Finding
                        </Button>
                      </Form.Item>
                    </div>
                  </>
                )}
              </Form.List>

              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
                  Next
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
