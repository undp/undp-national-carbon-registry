import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Radio, Row, Steps, Tooltip, Upload, message } from 'antd';
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import { ExperimentOutlined, EyeOutlined, SafetyOutlined, UploadOutlined } from '@ant-design/icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useNavigate } from 'react-router-dom';
import './addNewCompany.scss';

const AddNewCompany = () => {
  const { Step } = Steps;
  const { post } = useConnection();
  const navigate = useNavigate();
  const [formOne] = Form.useForm();
  const [formTwo] = Form.useForm();
  const [stepOneData, setStepOneData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [contactNoInput, setContactNoInput] = useState<any>();
  const [current, setCurrent] = useState<number>(0);

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

  const onFinishStepTwo = async (values: any) => {
    const requestData = { ...values, role: 'Admin', company: { ...stepOneData } };
    setLoading(true);
    try {
      requestData.phoneNo = formatPhoneNumberIntl(requestData.phoneNo);
      requestData.company.phoneNo = formatPhoneNumberIntl(requestData.company.phoneNo);
      requestData.company.website = 'https://' + requestData.company.website;
      requestData.company.logo = requestData?.company?.logo[0]?.thumbUrl;
      console.log(requestData);
      const response = await post('national/user/add', requestData);
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: 'Company added Successfully!',
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/companyManagement', { replace: true });
        setLoading(false);
      }
    } catch (error: any) {
      console.log('Error in user creation', error);
      message.open({
        type: 'error',
        content: `Error in adding user! ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
      navigate('/companyManagement/viewAll', { replace: true });
    }
  };

  const convertBase64 = (file: any) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const CompanyDetailsForm = () => {
    return (
      <div className="company-details-form-container">
        <div className="company-details-form">
          <Form
            name="company-details"
            className="company-details-form"
            layout="vertical"
            requiredMark={true}
            form={formOne}
            onFinish={onFinishStepOne}
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
                            throw new Error('Name is required!');
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    label="Tax ID"
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
                            throw new Error('Tax ID is required!');
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
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
                            throw new Error('Email is required!');
                          } else {
                            const val = value.trim();
                            const reg =
                              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            const matches = val.match(reg) ? val.match(reg) : [];
                            if (matches.length === 0) {
                              throw new Error('Email is invalid!');
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
                    name="website"
                    rules={[{ required: false }]}
                  >
                    <Input addonBefore="https://" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="logo"
                    label="Organisation Logo (File Type : JPEG , PNG , SVG )"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[
                      { required: true, message: '' },
                      {
                        validator: async (rule, file) => {
                          if (
                            String(file).trim() === '' ||
                            String(file).trim() === undefined ||
                            file === null ||
                            file === undefined
                          ) {
                            throw new Error('Organisation Logo is required!');
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
                              throw new Error('Unsupported file format!');
                            } else if (file[0]?.size > 1000000) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error('Maximum upload file size is 5MB!');
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      className="logo-upload-section"
                      name="logo"
                      action="/upload.do"
                      listType="picture"
                      maxCount={1}
                      onChange={(file: any) => {
                        console.log('ogo upload -------- ', file);
                      }}
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
                    rules={[
                      {
                        required: true,
                        message: 'Role is required!',
                      },
                    ]}
                  >
                    <Radio.Group size="large">
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
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="phoneNo"
                    label="Phone Number"
                    rules={[
                      {
                        required: true,
                        message: '',
                      },
                      {
                        validator: async (rule, value) => {
                          console.log('val - phone no --- ', value);
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error('Phone Number is required!');
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
                    />
                  </Form.Item>
                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: 'Address is required!' }]}
                  >
                    <Input.TextArea rows={3} maxLength={100} />
                  </Form.Item>
                </div>
              </Col>
            </Row>
            <div className="steps-actions">
              {current === 0 && (
                <Button type="primary" htmlType="submit">
                  Next
                </Button>
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
          requiredMark={false}
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
                          throw new Error('Name is required!');
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
                          throw new Error('Email is required!');
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error('Email is invalid!');
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
            {current === 1 && (
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
        <div className="main">Add New Organisation</div>
        <div className="sub">Add new organisation to the Carbon Registry</div>
      </div>
      <div className="adding-section">
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
                    <div className="title">Organisation Details</div>
                  </div>
                ),
                description: current === 0 && <CompanyDetailsForm />,
              },
              {
                title: (
                  <div className="step-title-container">
                    <div className="step-count">02</div>
                    <div className="title">Organisation Admin Details</div>
                  </div>
                ),
                description: current === 1 && <CompanyAdminDetailsForm />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AddNewCompany;
