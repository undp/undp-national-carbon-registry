import { UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Row,
  Select,
  Skeleton,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import { RcFile } from 'antd/lib/upload';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RadioButtonStatus, titleList } from '../../Definitions/Enums/commonEnums';
import { isValidateFileType } from '../../Utils/DocumentValidator';

const Assessment = (props: any) => {
  const { onFormSubmit, assessmentViewData, viewOnly, translator } = props;
  const t = translator.t;
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [form4] = Form.useForm();
  const [cobenefitsAssessmentDetails, setCobenefitsAssessmentDetails] = useState();
  const [isVerifyingOrgVisible, setIsVerifyingOrgVisible] = useState(false);
  const [isVerifyingDetailsVisible, setIsVerifyingDetailsVisible] = useState(false);
  const [isPersonListedDetailsVisible, setIsPersonListedDetailsVisible] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [countries, setCountries] = useState<[]>([]);
  const { get } = useConnection();
  const [isCountryListLoading, setIsCountryListLoading] = useState(false);

  const maximumFileSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const getCountryList = async () => {
    setIsCountryListLoading(true);
    try {
      const response = await get('national/organisation/countries');
      if (response.data) {
        const alpha2Names = response.data.map((item: any) => {
          return item.alpha2;
        });
        setCountries(alpha2Names);
      }
    } catch (error: any) {
      console.log('Error in getCountryList', error);
      message.open({
        type: 'error',
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setIsCountryListLoading(false);
    }
  };

  useEffect(() => {
    onFormSubmit(cobenefitsAssessmentDetails, isFormValid);
  }, [cobenefitsAssessmentDetails, isFormValid]);

  useEffect(() => {
    if (assessmentViewData) {
      setCobenefitsAssessmentDetails(assessmentViewData);
      form1.setFieldsValue(assessmentViewData);
      form2.setFieldsValue(assessmentViewData);
      form3.setFieldsValue(assessmentViewData);
    }
  }, [assessmentViewData]);

  useEffect(() => {
    getCountryList();
  }, []);

  const validateForms = async () => {
    setIsFormValid(true);
    if (isVerifyingOrgVisible) {
      const verifyingOrgName = form1.getFieldValue('verifyingOrgName');
      if (verifyingOrgName === undefined || verifyingOrgName === '') {
        setIsFormValid(false);
      }
    }

    if (isPersonListedDetailsVisible) {
      const personListedDetails = form3.getFieldValue('personListedDetails');
      if (personListedDetails === undefined || personListedDetails === '') {
        setIsFormValid(false);
      }
    }
  };

  useEffect(() => {
    validateForms();
  });

  const onFormChanged = async (formName: string, info: any) => {
    const changedValues: any = {};
    if (info.changedFields && info.changedFields.length > 0) {
      info.changedFields.map(async (changedField: any) => {
        if (changedField.name[0] === 'document') {
          const base64Value = await getBase64(changedField.value[0].originFileObj as RcFile);
          const values = base64Value;

          setCobenefitsAssessmentDetails((pre: any) => ({
            ...pre,
            document: values,
          }));
        } else {
          if (changedField.value && changedField.value?.length > 0) {
            changedValues[changedField.name[0]] = changedField.value;
          } else {
            changedValues[changedField.name[0]] = undefined;
          }
        }
      });

      setCobenefitsAssessmentDetails((pre: any) => ({
        ...pre,
        ...changedValues,
      }));
    }
  };

  const onIsThirdPartyVerifiedChanged = (e: any) => {
    if (e?.target?.value === RadioButtonStatus.YES) {
      setIsVerifyingOrgVisible(true);
    } else {
      setIsVerifyingOrgVisible(false);
    }
  };

  const onIsWillingToVerifiedChanged = (e: any) => {
    if (e?.target?.value === RadioButtonStatus.YES) {
      setIsVerifyingDetailsVisible(true);
    } else {
      setIsVerifyingDetailsVisible(false);
    }
  };

  const onIsThePersonListedChanged = (e: any) => {
    if (e?.target?.value !== RadioButtonStatus.YES) {
      setIsPersonListedDetailsVisible(true);
    } else {
      setIsPersonListedDetailsVisible(false);
    }
  };

  const onAssesmentDocument = async (e: any) => {
    if (e?.fileList.length > 0 && e?.fileList[0]?.name) {
      const base64Value = await getBase64(e.fileList[0].originFileObj as RcFile);
      const values = base64Value;

      setCobenefitsAssessmentDetails((pre: any) => ({
        ...pre,
        document: values,
      }));
    } else {
      setCobenefitsAssessmentDetails((pre: any) => {
        const { document, ...rest } = pre;
        if (Object.keys(rest).length === 0) {
          return undefined;
        } else {
          return { ...rest };
        }
      });
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <div className="assesment-tab-item">
      {viewOnly && !assessmentViewData && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {((viewOnly && assessmentViewData) || !viewOnly) && (
        <Form.Provider onFormChange={onFormChanged}>
          <Row>
            <Form
              name="from1"
              labelCol={{ span: 18 }}
              labelWrap={true}
              labelAlign="left"
              wrapperCol={{ span: 6 }}
              layout="horizontal"
              requiredMark={true}
              form={form1}
              onValuesChange={() => validateForms()}
            >
              {!viewOnly && (
                <div className="radio-content">
                  <Form.Item
                    label={t('coBenifits:assessmentIsThirdPartyVerified', {
                      ns: 'coBenifits',
                    })}
                    className="form-item"
                    name="IsThirdPartyVerified"
                  >
                    <Radio.Group size="middle" onChange={onIsThirdPartyVerifiedChanged}>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.YES}>
                          {t('coBenifits:yes')}
                        </Radio.Button>
                      </div>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.NO}>
                          {t('coBenifits:no')}
                        </Radio.Button>
                      </div>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.NA}>
                          {t('coBenifits:n/a')}
                        </Radio.Button>
                      </div>
                    </Radio.Group>
                  </Form.Item>
                  {isVerifyingOrgVisible === true && (
                    <Form.Item
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                      label={t('coBenifits:verifyingOrgNamelbl')}
                      name="verifyingOrgName"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                      ]}
                    >
                      <Input style={{ width: 303 }} />
                    </Form.Item>
                  )}
                  <Form.Item
                    label={t('coBenifits:assesmentIsWillingToVerified')}
                    className="form-item"
                    name="IsWillingToVerified"
                  >
                    <Radio.Group size="middle" onChange={onIsWillingToVerifiedChanged}>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.YES}>
                          {t('coBenifits:yes')}
                        </Radio.Button>
                      </div>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.NO}>
                          {t('coBenifits:no')}
                        </Radio.Button>
                      </div>
                      <div className="radio-container">
                        <Radio.Button className="radio" value={RadioButtonStatus.NA}>
                          {t('coBenifits:n/a')}
                        </Radio.Button>
                      </div>
                    </Radio.Group>
                  </Form.Item>
                  {isVerifyingDetailsVisible === true && (
                    <Form.Item
                      label={t('coBenifits:verifyingDetailslbl')}
                      name="verifyingDetails"
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                    >
                      <Input style={{ width: 303 }} />
                    </Form.Item>
                  )}
                </div>
              )}
              {viewOnly && (
                <div className="radio-content view-section">
                  {assessmentViewData.hasOwnProperty('IsThirdPartyVerified') && (
                    <Form.Item
                      label={t('coBenifits:assessmentIsThirdPartyVerified')}
                      className="form-item"
                      name="IsThirdPartyVerified"
                    >
                      <Radio.Group size="middle" disabled>
                        <div className="radio-container">
                          <Radio.Button className="radio">
                            {assessmentViewData.IsThirdPartyVerified}
                          </Radio.Button>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {assessmentViewData.IsThirdPartyVerified === RadioButtonStatus.YES && (
                    <Form.Item
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                      label={t('coBenifits:verifyingOrgNamelbl')}
                      name="verifyingOrgName"
                    >
                      <Input
                        disabled
                        style={{ width: 303 }}
                        defaultValue={
                          assessmentViewData.verifyingOrgName
                            ? assessmentViewData.verifyingOrgName
                            : '-'
                        }
                      />
                    </Form.Item>
                  )}
                  {assessmentViewData.hasOwnProperty('IsWillingToVerified') && (
                    <Form.Item
                      label={t('coBenifits:assesmentIsWillingToVerified')}
                      className="form-item"
                      name="IsWillingToVerified"
                    >
                      <Radio.Group size="middle" disabled>
                        <div className="radio-container">
                          <Radio.Button className="radio">
                            {assessmentViewData.IsWillingToVerified}
                          </Radio.Button>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                  )}
                  {assessmentViewData.IsWillingToVerified === RadioButtonStatus.YES && (
                    <Form.Item
                      label={t('coBenifits:verifyingDetailslbl')}
                      name="verifyingDetails"
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                    >
                      <Input
                        disabled
                        defaultValue={
                          assessmentViewData.verifyingDetails
                            ? assessmentViewData.verifyingDetails
                            : '-'
                        }
                        style={{ width: 303 }}
                      />
                    </Form.Item>
                  )}
                </div>
              )}
            </Form>
          </Row>

          <Row>
            <Form
              name="form2"
              labelCol={{ span: 14 }}
              labelWrap={true}
              labelAlign="left"
              wrapperCol={{ span: 8 }}
              layout="vertical"
              requiredMark={true}
              form={form2}
              className="view-section"
            >
              <Row className="mg-bottom-1">
                <label className="co-sub-title-text">{t('coBenifits:contactInformation')}</label>
              </Row>
              <Row justify="start" gutter={16}>
                <Col flex="139px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentTitle')} name="title">
                        <Select
                          size="large"
                          style={{
                            width: '139px',
                            borderRadius: '4px',
                          }}
                          options={titleList}
                        ></Select>
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentTitle')} name="title">
                        <Input
                          disabled
                          defaultValue={assessmentViewData.title ? assessmentViewData.title : '-'}
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
                <Col flex="303px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentFirstName')} name="firstName">
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentFirstName')} name="firstName">
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.firstName ? assessmentViewData.firstName : '-'
                          }
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
                <Col flex="303px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentLastName')} name="lastName">
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentLastName')} name="lastName">
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.lastName ? assessmentViewData.lastName : '-'
                          }
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
              </Row>
              <Row justify="start" gutter={16}>
                <Col flex="462px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentOrganisation')} name="organisation">
                        <Input style={{ width: 462 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentOrganisation')} name="organisation">
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.organisation ? assessmentViewData.organisation : '-'
                          }
                          style={{ width: 462 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
                <Col flex="303px">
                  <>
                    <Skeleton loading={isCountryListLoading} active>
                      {!viewOnly && countries.length > 0 && (
                        <Form.Item label={t('coBenifits:assessmentTelephone')} name="telephone">
                          <PhoneInput
                            style={{ width: 303 }}
                            international
                            defaultCountry="LK"
                            countryCallingCodeEditable={false}
                            onChange={(v) => {}}
                            countries={countries}
                          />
                        </Form.Item>
                      )}
                    </Skeleton>
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentTelephone')} name="telephone">
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.telephone ? assessmentViewData.telephone : '-'
                          }
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
              </Row>
              <Row justify="start" gutter={16}>
                <Col flex="303px">
                  <>
                    {!viewOnly && (
                      <Form.Item
                        label={t('coBenifits:assessmentEmail')}
                        name="email"
                        rules={[
                          {
                            validator: async (rule, value) => {
                              if (value) {
                                const val = value.trim();
                                const reg =
                                  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                const matches = val.match(reg) ? val.match(reg) : [];
                                if (matches.length === 0) {
                                  throw new Error(
                                    `${t('addUser:email')} ${t('addUser:isInvalid')}`
                                  );
                                }
                              }
                            },
                          },
                        ]}
                      >
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentEmail')} name="email">
                        <Input
                          disabled
                          defaultValue={assessmentViewData.email ? assessmentViewData.email : '-'}
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
                <Col flex="462px">
                  <>
                    {!viewOnly && (
                      <Form.Item
                        label={t('coBenifits:assessmentAffiliationCDM')}
                        name="affiliationCDM"
                      >
                        <Input style={{ width: 462 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item
                        label={t('coBenifits:assessmentAffiliationCDM')}
                        name="affiliationCDM"
                      >
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.affiliationCDM
                              ? assessmentViewData.affiliationCDM
                              : '-'
                          }
                          style={{ width: 462 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
              </Row>
            </Form>
          </Row>

          <Row>
            <Col span={24}>
              <Form
                name="form3"
                labelCol={{ span: 18 }}
                labelWrap={true}
                labelAlign="left"
                wrapperCol={{ span: 6 }}
                layout="horizontal"
                requiredMark={true}
                form={form3}
                onValuesChange={() => validateForms()}
              >
                {!viewOnly && (
                  <div className="radio-content">
                    <Form.Item
                      label={t('coBenifits:assesmentIsThePersonListed')}
                      className="form-item"
                      name="isThePersonListed"
                    >
                      <Radio.Group size="middle" onChange={onIsThePersonListedChanged}>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.YES}>
                            {t('coBenifits:yes')}
                          </Radio.Button>
                        </div>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.NO}>
                            {t('coBenifits:no')}
                          </Radio.Button>
                        </div>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.NA}>
                            {t('coBenifits:n/a')}
                          </Radio.Button>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                    {isPersonListedDetailsVisible === true && (
                      <Form.Item
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        label={t('coBenifits:specify')}
                        name="personListedDetails"
                        rules={[
                          {
                            required: true,
                            message: '',
                          },
                        ]}
                      >
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                  </div>
                )}
                {viewOnly && (
                  <div className="radio-content view-section">
                    {assessmentViewData.hasOwnProperty('isThePersonListed') && (
                      <Form.Item
                        label={t('coBenifits:assesmentIsThePersonListed')}
                        className="form-item"
                        name="isThePersonListed"
                      >
                        <Radio.Group size="middle" disabled>
                          <div className="radio-container">
                            <Radio.Button className="radio">
                              {assessmentViewData.isThePersonListed}
                            </Radio.Button>
                          </div>
                        </Radio.Group>
                      </Form.Item>
                    )}
                    {assessmentViewData.isThePersonListed === RadioButtonStatus.NO && (
                      <Form.Item
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        label={t('coBenifits:specify')}
                        name="personListedDetails"
                      >
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.personListedDetails
                              ? assessmentViewData.personListedDetails
                              : '-'
                          }
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </div>
                )}
              </Form>
            </Col>
          </Row>

          <Row>
            <Form layout="vertical" name="form4" form={form4} className="view-section">
              <Row className="mg-bottom-1">
                <label className="co-sub-title-text">{t('coBenifits:feasibilityReport')}</label>
              </Row>
              <Row justify="start" gutter={16}>
                <Col flex="303px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentStudyName')} name="studyName">
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentStudyName')} name="studyName">
                        <Input
                          disabled
                          defaultValue={
                            assessmentViewData.studyName ? assessmentViewData.studyName : '-'
                          }
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
                <Col flex="303px">
                  <>
                    {!viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentFunder')} name="funder">
                        <Input style={{ width: 303 }} />
                      </Form.Item>
                    )}
                    {viewOnly && (
                      <Form.Item label={t('coBenifits:assessmentFunder')} name="funder">
                        <Input
                          disabled
                          defaultValue={assessmentViewData.funder ? assessmentViewData.funder : '-'}
                          style={{ width: 303 }}
                        />
                      </Form.Item>
                    )}
                  </>
                </Col>
              </Row>
              <Row>
                {!viewOnly && (
                  <Form.Item
                    label={t('coBenifits:assessmentDocuments')}
                    name="document"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    required={false}
                    rules={[
                      {
                        validator: async (rule, file) => {
                          if (file?.length > 0) {
                            if (!isValidateFileType(file[0]?.type)) {
                              throw new Error(`${t('coBenifits:invalidFileFormat')}`);
                            } else if (file[0]?.size > maximumFileSize) {
                              throw new Error(`${t('common:maxSizeVal')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
                      beforeUpload={(file: any) => {
                        return false;
                      }}
                      className="design-upload-section"
                      name="document"
                      listType="picture"
                      multiple={false}
                      maxCount={1}
                      onChange={onAssesmentDocument}
                    >
                      <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>
                )}
                {viewOnly && assessmentViewData.document && (
                  <Form.Item label={t('coBenifits:assessmentDocuments')} name="assessmentDocuments">
                    <a
                      href={assessmentViewData.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      {assessmentViewData.document}
                    </a>
                  </Form.Item>
                )}
              </Row>
            </Form>
          </Row>
        </Form.Provider>
      )}
    </div>
  );
};

export default Assessment;
