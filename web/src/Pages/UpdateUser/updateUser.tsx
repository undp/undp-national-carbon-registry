import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Form, Input, Select, message, Spin, Upload, Modal } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import 'react-phone-number-input/style.css';
import './updateUser.scss';
import '../Common/common.form.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/lib/upload';

const UpdateUser = () => {
  const { put } = useConnection();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [contactNoInput, setContactNoInput] = useState<any>();
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onSubmitData = async (values: any) => {
    setLoading(true);
    values.id = state.record.id;
    if (values.role === 'ProgrammeDeveloper') {
      const logoBase64 = await getBase64(fileList[0].originFileObj as RcFile);
      values.companyLogo = logoBase64;
    }
    try {
      values.contactNo = formatPhoneNumberIntl(values.contactNo);
      console.log(values);
      const response = await put('national/user/update', values);
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: 'User Updated Successfully!',
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/userManagement', { replace: true });
        state.record = {};
        setLoading(false);
      }
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

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    if (!isJpgOrPng || !isLt2M) {
      return Upload.LIST_IGNORE;
    } else {
      return false;
    }
  };

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    console.log(file, '2');
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
      console.log(file, '3');
    }
    console.log(file, '4');
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  useEffect(() => {
    console.log(state);
    if (!state) {
      console.log(state);
      navigate('/userManagement', { replace: true });
    }
    {
      setImageLoading(true);
      setUserRole(state.record.role);
      if (state.record.companyLogo !== null)
        setFileList([
          {
            uid: '-1',
            name: `${state.record.companyName}`,
            status: 'done',
            url: `${state.record.companyLogo}`,
          },
        ]);
      setImageLoading(false);
    }
  }, []);

  return (
    <div className="create-user-container">
      <Spin spinning={loading}>
        <Form
          layout="vertical"
          name="userCreation"
          onFinish={onSubmitData}
          className="common-form-class"
        >
          <Row>
            <Col span={22} offset={1}>
              <Form.Item
                name="name"
                label="User Name"
                initialValue={state.record.name}
                rules={[
                  {
                    required: true,
                    message: "User Name can't be empty!",
                  },
                  ({ getFieldValue }) => ({
                    validator() {
                      if (
                        getFieldValue('name') !== undefined &&
                        !getFieldValue('name').match(/^[a-zA-Z ]*$/gm)
                      ) {
                        return Promise.reject("User name can't have numbers!");
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="User Name" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={22} offset={1}>
              <Form.Item
                name="email"
                label="Email"
                initialValue={state.record.email}
                rules={[
                  ({ getFieldValue }) => ({
                    validator() {
                      if (
                        getFieldValue('email') &&
                        !getFieldValue('email')
                          ?.trim()
                          .match(
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                          )
                      ) {
                        return Promise.reject('Please enter a valid E-mail!');
                      }
                      return Promise.resolve();
                    },
                  }),
                  {
                    required: true,
                    message: "Email can't be empty!",
                  },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={11} offset={1}>
              <Form.Item
                name="role"
                label="Role"
                initialValue={state.record.role}
                rules={[
                  {
                    required: true,
                    message: 'User should have a role!',
                  },
                ]}
              >
                <Select
                  placeholder="Select user role"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option: any) =>
                    option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={setUserRole}
                  placement="bottomLeft"
                  getPopupContainer={(triggerNode) => triggerNode.parentElement}
                  options={[
                    {
                      value: 'Root',
                      label: 'Root',
                    },
                    {
                      value: 'Admin',
                      label: 'Admin',
                    },
                    {
                      value: 'Certifier',
                      label: 'Certifier',
                    },
                    {
                      value: 'ProgrammeDeveloper',
                      label: 'Programme Developer',
                    },
                    {
                      value: 'General',
                      label: 'General',
                    },
                    {
                      value: 'Visitor',
                      label: 'Visitor',
                    },
                    {
                      value: 'ViewOnly',
                      label: 'View Only',
                    },
                  ]}
                />
              </Form.Item>
            </Col>
            {userRole === 'ProgrammeDeveloper' && (
              <Col span={10} offset={1}>
                <Form.Item
                  name="industry"
                  label="Industry"
                  initialValue={state.record.industry}
                  rules={[
                    {
                      required: true,
                      message: "Industry can't be empty!",
                    },
                    ({ getFieldValue }) => ({
                      validator() {
                        if (
                          getFieldValue('industry') !== undefined &&
                          !getFieldValue('industry').match(/^[a-zA-Z ]*$/gm)
                        ) {
                          return Promise.reject("Industry name can't have numbers.");
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input placeholder="Industry" />
                </Form.Item>
              </Col>
            )}
          </Row>
          {userRole === 'ProgrammeDeveloper' && (
            <Row>
              <Col span={22} offset={1}>
                <Form.Item
                  name="companyName"
                  label="Company Name"
                  initialValue={state.record.companyName}
                  rules={[
                    {
                      required: true,
                      message: "Company Name can't be empty!",
                    },
                  ]}
                >
                  <Input placeholder="Company Name" />
                </Form.Item>
              </Col>
            </Row>
          )}
          {userRole === 'ProgrammeDeveloper' && (
            <Row>
              <Col span={22} offset={1}>
                <Form.Item
                  name="companyLocation"
                  initialValue={state.record.companyLocation}
                  label="Company Location"
                  rules={[
                    {
                      required: true,
                      message: "Company Location can't be empty!",
                    },
                  ]}
                >
                  <Input placeholder="Company Location" />
                </Form.Item>
              </Col>
            </Row>
          )}
          {userRole === 'ProgrammeDeveloper' && (
            <Row>
              <Col span={22} offset={1}>
                <Form.Item
                  name="registrationNo"
                  label="Registration Number"
                  initialValue={state.record.registrationNo}
                  rules={[
                    {
                      required: true,
                      message: "Registration Number can't be empty!",
                    },
                  ]}
                >
                  <Input placeholder="Registration Number" />
                </Form.Item>
              </Col>
            </Row>
          )}
          {userRole === 'ProgrammeDeveloper' && !imageLoading && (
            <Row>
              <Col span={22} offset={1}>
                <Form.Item
                  name="companyLogo"
                  label="Company Logo"
                  required
                  rules={[
                    () => ({
                      validator() {
                        if (fileList.length === 0) {
                          return Promise.reject('Upload the logo of the company!');
                        } else if (fileList.length > 1) {
                          return Promise.reject("Can't upload more than one Image!");
                        } else if (fileList.length === 1) {
                          return Promise.resolve();
                        } else {
                          return Promise.resolve();
                        }
                      },
                    }),
                  ]}
                >
                  <Upload
                    name="companyLogo"
                    listType="picture-card"
                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    onPreview={handlePreview}
                    multiple={false}
                  >
                    {fileList.length > 0 ? null : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                  <Modal
                    open={previewOpen}
                    title={previewTitle}
                    footer={null}
                    onCancel={handleCancel}
                  >
                    <img alt="example" style={{ width: '100%' }} src={previewImage} />
                  </Modal>
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row>
            <Col span={11} offset={1}>
              <Form.Item
                name="city"
                initialValue={state.record.city}
                label="City"
                rules={[
                  {
                    required: true,
                    message: "City can't be empty!",
                  },
                  ({ getFieldValue }) => ({
                    validator() {
                      if (
                        getFieldValue('city') !== undefined &&
                        !getFieldValue('city').match(/^[a-zA-Z ]*$/gm)
                      ) {
                        return Promise.reject("City name can't have numbers.");
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={10} offset={1}>
              <Form.Item
                name="zipCode"
                label="Zip Code"
                initialValue={state.record.zipCode}
                rules={[
                  {
                    required: true,
                    message: "Zip Code can't be empty!",
                  },
                  () => ({
                    validator(_, value) {
                      if (!value) {
                        return Promise.reject();
                      }
                      if (isNaN(value)) {
                        return Promise.reject('Zip code has to be a number.');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="Zip Code" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={11} offset={1}>
              <Form.Item
                name="state"
                label="State/Province"
                initialValue={state.record.state}
                rules={[
                  {
                    required: true,
                    message: "State/Province can't be empty!",
                  },
                ]}
              >
                <Input placeholder="State/Province" />
              </Form.Item>
            </Col>
            <Col span={10} offset={1}>
              <Form.Item
                name="country"
                label="Country"
                initialValue={state.record.country}
                rules={[
                  {
                    required: true,
                    message: "Country can't be empty!",
                  },
                  ({ getFieldValue }) => ({
                    validator() {
                      if (
                        getFieldValue('country') !== undefined &&
                        !getFieldValue('country').match(/^[a-zA-Z ]*$/gm)
                      ) {
                        return Promise.reject('Country name cant have numbers.');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="Country" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={11} offset={1}>
              <Form.Item
                name="contactNo"
                label="Contact Number"
                initialValue={state.record.contactNo}
                rules={[
                  {
                    required: true,
                    message: "Contact Number can't be empty!",
                  },
                ]}
              >
                <PhoneInput
                  placeholder="Contact number"
                  international
                  value={formatPhoneNumberIntl(contactNoInput)}
                  defaultCountry="LK"
                  countryCallingCodeEditable={false}
                  onChange={(v) => setContactNoInput(v)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={10} offset={7}>
              <Form.Item>
                <div className="create-user-btn-container">
                  <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                    Update
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
};

export default UpdateUser;
