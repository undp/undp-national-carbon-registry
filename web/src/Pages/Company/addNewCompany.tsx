import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Radio, Row, Steps, Tooltip, Upload, message } from 'antd';
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import { ExperimentOutlined, EyeOutlined, SafetyOutlined, UploadOutlined } from '@ant-design/icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './addNewCompany.scss';
import { RcFile } from 'antd/lib/upload';

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

  useEffect(() => {
    console.log('record data ---- > ', state);
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
      requestData.phoneNo = formatPhoneNumberIntl(requestData.phoneNo);
      requestData.company.phoneNo = formatPhoneNumberIntl(requestData.company.phoneNo);
      requestData.company.website = 'https://' + requestData.company.website;
      const logoBase64 = await getBase64(requestData?.company?.logo[0]?.originFileObj as RcFile);
      const logoUrls = logoBase64.split(',');
      requestData.company.logo = logoUrls[1];
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

  const onUpdateCompany = async () => {
    setLoading(true);
    // values.id = state.record.id;
    const formOneValues = formOne.getFieldsValue();
    const formTwoValues = formTwo.getFieldsValue();
    formOneValues.phoneNo = formatPhoneNumberIntl(formOneValues.phoneNo);
    try {
      const values = {
        ...formOneValues,
        ...formTwoValues,
      };
      console.log('form one values   -- > ', values, state.record);
      // const response = await put('national/user/update', values);
      // if (response.status === 200 || response.status === 201) {
      //   message.open({
      //     type: 'success',
      //     content: 'User Updated Successfully!',
      //     duration: 3,
      //     style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      //   });
      //   navigate('/userManagement/viewAll', { replace: true });
      //   state.record = {};
      //   setLoading(false);
      // }
    } catch (error: any) {
      console.log('Error in user update', error);
      message.open({
        type: 'error',
        content: `Error in updating user! ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
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

  const getImage = (base64: string) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + base64;
    console.log('image --- > ', image);
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
                    initialValue={state?.record?.website?.split('://')[1]}
                    name="website"
                    rules={[{ required: false }]}
                  >
                    <Input addonBefore="https://" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="logo"
                    label="Organisation Logo (File Type : JPEG , PNG , SVG )"
                    valuePropName="fileList"
                    initialValue={getImage(state?.record?.logo)}
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
                            } else if (file[0]?.size > 1048576) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error('Maximum upload file size is 1MB!');
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
                    initialValue={state?.record?.companyRole}
                    rules={[
                      {
                        required: true,
                        message: 'Role is required!',
                      },
                    ]}
                  >
                    <Radio.Group size="large" disabled={state?.record?.companyRole}>
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
                    initialValue={state?.record?.phoneNo}
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
                    initialValue={state?.record?.address}
                    rules={[
                      { required: true, message: '' },
                      {
                        validator: async (rule, value) => {
                          console.log('val - phone no --- ', value);
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error('Address is required!');
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
        <div className="main">Add New Organisation</div>
        <div className="sub">Add a new organisation to the Carbon Registry</div>
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
