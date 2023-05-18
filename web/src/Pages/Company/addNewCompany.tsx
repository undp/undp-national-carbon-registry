import { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Radio, Row, Steps, Tooltip, Upload, message } from 'antd';
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import {
  BankOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './addNewCompany.scss';
import { RcFile, UploadFile } from 'antd/lib/upload';
import { useTranslation } from 'react-i18next';
import { CompanyRole } from '../../Definitions/InterfacesAndType/programme.definitions';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { UserProps } from '../../Definitions/InterfacesAndType/userInformationContext.definitions';
import validator from 'validator';

const AddNewCompany = () => {
  const { Step } = Steps;
  const { state } = useLocation();
  const { post } = useConnection();
  const navigate = useNavigate();
  const [formOne] = Form.useForm();
  const [formTwo] = Form.useForm();
  const [stepOneData, setStepOneData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [contactNoInput, setContactNoInput] = useState<any>();
  const [current, setCurrent] = useState<number>(0);
  const [isUpdate, setIsUpdate] = useState(false);
  const { i18n, t } = useTranslation(['addCompany']);
  const { put, get } = useConnection();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const maximumImageSize = process.env.MAXIMUM_IMAGE_SIZE
    ? parseInt(process.env.MAXIMUM_IMAGE_SIZE)
    : 3145728;
  const { setUserInfo } = useUserContext();
  const [countries, setCountries] = useState<[]>([]);

  const getCountryList = async () => {
    const response = await get('national/organisation/countries');
    if (response.data) {
      const alpha2Names = response.data.map((item: any) => {
        return item.alpha2;
      });
      setCountries(alpha2Names);
    }
  };

  useEffect(() => {
    setIsUpdate(state?.record ? true : false);
    getCountryList();
    if (state?.record?.logo) {
      setFileList([
        {
          uid: '1',
          name: `${state?.record?.name}.png`,
          status: 'done',
          url: state?.record?.logo,
          type: 'image/png',
        },
      ]);
    }
  }, []);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const nextOne = (val: any) => {
    setCurrent(current + 1);
    setStepOneData(val);
  };

  const prevOne = () => {
    setCurrent(current - 1);
  };

  const onFinishStepOne = (values: any) => {
    nextOne(values);
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onFinishStepTwo = async (values: any) => {
    const requestData = { ...values, role: 'Admin', company: { ...stepOneData } };
    setLoading(true);
    try {
      if (requestData.phoneNo) {
        requestData.phoneNo = formatPhoneNumberIntl(requestData.phoneNo);
      } else {
        requestData.phoneNo = undefined;
      }
      requestData.company.phoneNo = formatPhoneNumberIntl(requestData.company.phoneNo);
      if (requestData.company.website) {
        requestData.company.website = 'https://' + requestData.company.website;
      } else {
        requestData.company.website = undefined;
      }
      const logoBase64 = await getBase64(requestData?.company?.logo[0]?.originFileObj as RcFile);
      const logoUrls = logoBase64.split(',');
      requestData.company.logo = logoUrls[1];
      const response = await post('national/user/add', requestData);
      if (response.status === 200 || response.status === 201) {
        if (isUpdate) {
          setUserInfo({
            companyLogo: response.data.logo,
          } as UserProps);
        }
        message.open({
          type: 'success',
          content: t('companyAddedSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/companyManagement/viewAll', { replace: true });
        setLoading(false);
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${t('errorInAddUser')} ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateCompany = async () => {
    setLoading(true);
    const formOneValues = formOne.getFieldsValue();
    formOneValues.phoneNo = formatPhoneNumberIntl(formOneValues.phoneNo);

    try {
      const values: any = {
        companyId: state?.record?.companyId,
        name: formOneValues.name,
        email: formOneValues.email,
        phoneNo: formOneValues.phoneNo,
        address: formOneValues.address,
        companyRole: state?.record?.companyRole,
      };

      if (state?.record?.companyRole !== CompanyRole.GOVERNMENT) {
        values.taxId = formOneValues.taxId;
      }

      if (formOneValues.website) {
        values.website = 'https://' + formOneValues.website;
      } else {
        values.website = undefined;
      }

      if (formOneValues.logo) {
        if (formOneValues.logo.length !== 0) {
          const logoBase64 = await getBase64(formOneValues.logo[0]?.originFileObj as RcFile);
          const logoUrls = logoBase64.split(',');
          values.logo = logoUrls[1];
        }
      }

      const response = await put('national/organisation/update', values);
      if (response.status === 200 || response.status === 201) {
        setUserInfo({
          companyLogo: response.data.logo,
        } as UserProps);
        message.open({
          type: 'success',
          content: t('companyUpdatedSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/companyManagement/viewAll', { replace: true });
      }
      setLoading(false);
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${t('errorInUpdatingCompany')} ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const onCancel = () => {
    navigate('/companyManagement/viewAll', { replace: true });
  };

  const CompanyDetailsForm = () => {
    const companyRole = state?.record?.companyRole;
    const companyRoleClassName =
      companyRole === CompanyRole.CERTIFIER
        ? 'certifier'
        : companyRole === CompanyRole.PROGRAMME_DEVELOPER
        ? 'dev'
        : 'gov';
    return (
      <div className="company-details-form-container">
        <div className="company-details-form">
          <Form
            name="company-details"
            className="company-details-form"
            layout="vertical"
            requiredMark={true}
            form={formOne}
            onFinish={isUpdate ? onUpdateCompany : onFinishStepOne}
          >
            <Row className="row" gutter={[16, 16]}>
              <Col xl={12} md={24}>
                <div className="details-part-one">
                  <Form.Item
                    label="Name"
                    name="name"
                    initialValue={state?.record?.name}
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
                            throw new Error(`Name ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  {(!isUpdate || (isUpdate && companyRole !== CompanyRole.GOVERNMENT)) && (
                    <Form.Item
                      label="Tax ID"
                      initialValue={state?.record?.taxId}
                      name="taxId"
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
                              throw new Error(`Tax ID ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  )}
                  <Form.Item
                    label="Email"
                    name="email"
                    initialValue={state?.record?.email}
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
                            throw new Error(`Email ${t('isRequired')}`);
                          } else {
                            const val = value.trim();
                            const reg =
                              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            const matches = val.match(reg) ? val.match(reg) : [];
                            if (matches.length === 0) {
                              throw new Error(`Email ${t('isInvalid')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    className="website"
                    label="Website"
                    initialValue={state?.record?.website?.split('://')[1]}
                    name="website"
                    rules={[
                      {
                        required: false,
                        validator: async (rule, value) => {
                          if (value && !validator.isURL('https://' + value))
                            throw new Error(`Website ${t('isInvalid')}`);
                        },
                      },
                    ]}
                  >
                    <Input addonBefore="https://" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="logo"
                    label="Organisation Logo (File Type : JPEG , PNG)"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    required={true}
                    rules={[
                      {
                        validator: async (rule, file) => {
                          if (file === null || file === undefined) {
                            if (!state?.record?.logo)
                              throw new Error(`Organisation Logo ${t('isRequired')}`);
                          } else {
                            if (file.length === 0) {
                              throw new Error(`Organisation Logo ${t('isRequired')}`);
                            } else {
                              let isCorrectFormat = false;
                              if (file[0]?.type === 'image/png') {
                                isCorrectFormat = true;
                              } else if (file[0]?.type === 'image/jpeg') {
                                isCorrectFormat = true;
                              } else if (file[0]?.type === 'image/svg') {
                                isCorrectFormat = true;
                              }
                              if (!isCorrectFormat) {
                                throw new Error(`${t('unsupportedFormat')}`);
                              } else if (file[0]?.size > maximumImageSize) {
                                // default size format of files would be in bytes -> 1MB = 1000000bytes
                                throw new Error(`${t('maxUploadSize')}`);
                              }
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      beforeUpload={(file) => {
                        return false;
                      }}
                      className="logo-upload-section"
                      name="logo"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      defaultFileList={fileList}
                      maxCount={1}
                    >
                      <Button size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>
              </Col>
              <Col xl={12} md={24}>
                <div className="details-part-two">
                  <Form.Item
                    className="role-group"
                    label="Role"
                    name="companyRole"
                    initialValue={companyRole}
                    rules={[
                      {
                        required: true,
                        message: `Role ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Radio.Group size="large" disabled={isUpdate}>
                      {isUpdate ? (
                        <div className={`${companyRoleClassName}-radio-container`}>
                          <Radio.Button className={companyRoleClassName} value={companyRole}>
                            {companyRole === CompanyRole.CERTIFIER ? (
                              <SafetyOutlined className="role-icons" />
                            ) : companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                              <ExperimentOutlined className="role-icons" />
                            ) : (
                              <BankOutlined className="role-icons" />
                            )}
                            {companyRole}
                          </Radio.Button>
                        </div>
                      ) : (
                        <>
                          <div className="certifier-radio-container">
                            <Tooltip
                              placement="top"
                              title="Permitted to certify and revoke certifications of programmes"
                            >
                              <Radio.Button className="certifier" value="Certifier">
                                <SafetyOutlined className="role-icons" />
                                Certifier
                              </Radio.Button>
                            </Tooltip>
                          </div>
                          <div className="dev-radio-container">
                            <Tooltip
                              placement="top"
                              title="Permitted to own programmes and transfer carbon credits"
                            >
                              <Radio.Button className="dev" value="ProgrammeDeveloper">
                                <ExperimentOutlined className="role-icons" />
                                Programme Developer
                              </Radio.Button>
                            </Tooltip>
                          </div>
                        </>
                      )}
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="phoneNo"
                    label="Phone Number"
                    initialValue={state?.record?.phoneNo}
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
                            throw new Error(`Phone Number ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <PhoneInput
                      placeholder="Phone number"
                      international
                      value={formatPhoneNumberIntl(contactNoInput)}
                      defaultCountry="LK"
                      countryCallingCodeEditable={false}
                      onChange={(v) => {}}
                      countries={countries}
                    />
                  </Form.Item>
                  <Form.Item
                    name="address"
                    label="Address"
                    initialValue={state?.record?.address}
                    rules={[
                      { required: true, message: '' },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`Address ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input.TextArea rows={3} maxLength={100} />
                  </Form.Item>
                </div>
              </Col>
            </Row>
            <div className="steps-actions">
              {isUpdate ? (
                <Row>
                  <Button loading={loading} onClick={onCancel}>
                    {t('addCompany:cancel')}
                  </Button>
                  <Button loading={loading} className="mg-left-1" type="primary" htmlType="submit">
                    {t('addCompany:submit')}
                  </Button>
                </Row>
              ) : (
                current === 0 && (
                  <Button type="primary" htmlType="submit">
                    Next
                  </Button>
                )
              )}
            </div>
          </Form>
        </div>
      </div>
    );
  };

  const CompanyAdminDetailsForm = () => {
    return (
      <div className="company-details-form-container">
        <Form
          name="company-admin-details"
          className="company-details-form"
          layout="vertical"
          requiredMark={true}
          form={formTwo}
          onFinish={onFinishStepTwo}
        >
          <Row className="row" gutter={[16, 16]}>
            <Col xl={12} md={24}>
              <div className="details-part-one">
                <Form.Item
                  label="Name"
                  name="name"
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
                          throw new Error(`Name ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  name="phoneNo"
                  label="Phone Number"
                  rules={[
                    {
                      required: false,
                    },
                  ]}
                >
                  <PhoneInput
                    placeholder="Phone number"
                    international
                    value={formatPhoneNumberIntl(contactNoInput)}
                    defaultCountry="LK"
                    countryCallingCodeEditable={false}
                    onChange={(v) => {}}
                  />
                </Form.Item>
              </div>
            </Col>
            <Col xl={12} md={24}>
              <div className="details-part-two">
                <Form.Item
                  label="Email"
                  name="email"
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
                          throw new Error(`Email ${t('isRequired')}`);
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error(`Email ${t('isInvalid')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
              </div>
            </Col>
          </Row>
          <div className="steps-actions">
            {current === 1 && state?.record ? (
              <Button
                className="mg-left-1"
                type="primary"
                onClick={onUpdateCompany}
                loading={loading}
              >
                UPDATE
              </Button>
            ) : (
              <Button className="mg-left-1" type="primary" htmlType="submit" loading={loading}>
                SUBMIT
              </Button>
            )}
            {current === 1 && (
              <Button onClick={() => prevOne()} loading={loading}>
                BACK
              </Button>
            )}
          </div>
        </Form>
      </div>
    );
  };

  return (
    <div className="add-company-main-container">
      <div className="title-container">
        <div className="main">
          {isUpdate ? t('addCompany:editCompany') : t('addCompany:addNewCompany')}
        </div>
        <div className="sub">
          {isUpdate ? t('addCompany:editCompanySub') : t('addCompany:addCompanySub')}
        </div>
      </div>
      <div className="adding-section">
        {isUpdate ? (
          <>
            <div className="step-title-container">
              <div className="title">{t('addCompany:companyDetailsTitle')}</div>
            </div>
            <CompanyDetailsForm />
          </>
        ) : (
          <div className="form-section">
            <Steps
              progressDot
              direction="vertical"
              current={current}
              items={[
                {
                  title: (
                    <div className="step-title-container">
                      <div className="step-count">01</div>
                      <div className="title">{t('addCompany:companyDetailsTitle')}</div>
                    </div>
                  ),
                  description: current === 0 && <CompanyDetailsForm />,
                },
                {
                  title: (
                    <div className="step-title-container">
                      <div className="step-count">02</div>
                      <div className="title">{t('addCompany:companyAdminDetailsTitle')}</div>
                    </div>
                  ),
                  description: current === 1 && <CompanyAdminDetailsForm />,
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddNewCompany;
