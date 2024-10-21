import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Input, Row, message, Typography, DatePicker, Upload } from 'antd';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import './AddCostQuotationForm.scss';
import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useNavigate } from 'react-router-dom';
import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocType } from '../../../Definitions/Enums/document.type';
const { Text, Paragraph } = Typography;

export const AddCostQuotationForm = (props: any) => {
  const { translator, programmeId } = props;
  const navigate = useNavigate();
  const { post } = useConnection();

  const [form] = Form.useForm();

  const t = translator.t;

  const calculateTotalCost = () => {
    let tempTotal = Number(form.getFieldValue('totalCost') || 0);
    const additionalServices = form.getFieldValue('additionalServices');
    const costValidation = Number(form.getFieldValue('costValidation') || 0);
    const costVerification = Number(form.getFieldValue('costVerification') || 0);
    tempTotal = costValidation + costVerification;
    if (additionalServices && additionalServices.length > 0) {
      additionalServices.forEach((item: any) => {
        if (item && item.cost > 0) {
          tempTotal += Number(item.cost);
        }
      });
    }
    form.setFieldValue('totalCost', String(tempTotal));
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const submitForm = async (values: any) => {
    const base64Docs: string[] = [];

    if (values?.signature.length > 0) {
      const docs = values.signature;
      for (let i = 0; i < docs.length; i++) {
        const temp = await getBase64(docs[i]?.originFileObj as RcFile);
        base64Docs.push(temp);
      }
    }

    if (values?.additionalServices && values?.additionalServices.length > 0) {
      const services = values.additionalServices;
      for (const service of services) {
        service.cost = Number(service.cost);
      }
      values.additionalServices = services;
    }

    const body: any = {
      programmeId: programmeId,
      content: {
        quotationNo: values?.quotationNo,
        address: values?.address,
        dateOfIssue: moment(values?.startTime).startOf('day').unix(),
        costValidation: Number(values?.costValidation),
        costVerification: Number(values?.costVerification),
        additionalServices: values?.additionalServices,
        totalCost: Number(values?.totalCost),
        signature: base64Docs,
      },
    };

    try {
      const res = await post('national/programmeSl/createCostQuotation', body);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: `${t('costQuotation:costQuotationFormSubmittedSuccessfully')}`,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/programmeManagementSLCF/viewAll');
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${t('costQuotation:somethingWentWrong')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
  };

  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <div className="main">{t('costQuotation:costQuotation')}</div>
      </div>
      <div className="adding-section">
        <div className="form-section">
          <div className="programme-details-form-container">
            <div className="programme-details-form">
              <Form
                labelCol={{ span: 20 }}
                wrapperCol={{ span: 24 }}
                name="programme-details"
                className="programme-details-form"
                layout="vertical"
                requiredMark={true}
                form={form}
                onFinish={submitForm}
              >
                <Row className="row" gutter={[40, 16]}>
                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('costQuotation:dateOfIssue')}
                      name="dateOfIssue"
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
                                `${t('costQuotation:dateOfIssue')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('costQuotation:address')}
                      name="address"
                      rules={[
                        {
                          required: true,
                          message: `${t('costQuotation:address')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} placeholder={`${t('costQuotation:address')}`} />
                    </Form.Item>
                  </Col>
                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('costQuotation:quotationNo')}
                      name="quotationNo"
                      // initialValue={state?.record?.name}
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
                                `${t('costQuotation:quotationNo')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  ;
                </Row>
                {/* Cost Quotation table start */}
                <div className="costQuotationTable">
                  <Row className="header" justify={'space-between'}>
                    <Col md={2} xl={2}>
                      <Text strong>{t('costQuotation:serviceNo')}</Text>
                    </Col>
                    <Col md={10}>
                      <Text strong>{t('costQuotation:serviceCategory')}</Text>
                    </Col>
                    <Col md={4} xl={4}>
                      <Text strong>{t('costQuotation:serviceCost')}</Text>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>
                  <Row align={'middle'} justify={'space-between'} className="data-rows">
                    <Col md={2} xl={2}>
                      {t('costQuotation:one')}
                    </Col>
                    <Col md={10}>
                      <Form.Item name="serviceValidation">
                        <Input
                          size="large"
                          defaultValue={t('costQuotation:serviceValidation')}
                          placeholder={t('costQuotation:serviceValidation')}
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="costValidation"
                        rules={[
                          {
                            required: true,
                            message: `${t('costQuotation:cost')} ${t('costQuotation:isRequired')}`,
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          size="large"
                          onChange={(val) => {
                            calculateTotalCost();
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>

                  <Row align={'middle'} justify={'space-between'} className="data-rows">
                    <Col md={2} xl={2}>
                      {t('costQuotation:two')}
                    </Col>
                    <Col md={10}>
                      <Form.Item name="serviceVerification">
                        <Input
                          size="large"
                          defaultValue={t('costQuotation:serviceVerification')}
                          placeholder={t('costQuotation:serviceVerification')}
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="costVerification"
                        rules={[
                          {
                            required: true,
                            message: `${t('costQuotation:cost')} ${t('costQuotation:isRequired')}`,
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          size="large"
                          onChange={(val) => {
                            calculateTotalCost();
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>
                  <Form.List name="additionalServices">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row align={'middle'} justify={'space-between'} className="data-rows">
                              <Col md={2} xl={2}>
                                {name + 3}
                              </Col>
                              <Col md={10}>
                                <Form.Item
                                  name={[name, 'service']}
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
                                            `${t('costQuotation:serviceCategory')} ${t(
                                              'costQuotation:isRequired'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input size="large" onChange={(val) => {}} />
                                </Form.Item>
                              </Col>
                              <Col md={4} xl={4}>
                                <Form.Item
                                  name={[name, 'cost']}
                                  rules={[
                                    {
                                      required: true,
                                      message: `${t('costQuotation:cost')} ${t(
                                        'costQuotation:isRequired'
                                      )}`,
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    size="large"
                                    onChange={(val) => {
                                      calculateTotalCost();
                                    }}
                                  />
                                </Form.Item>
                              </Col>

                              <Col md={2} xl={2}>
                                <Form.Item>
                                  <Button
                                    onClick={() => {
                                      calculateTotalCost();
                                      remove(name);
                                    }}
                                    size="large"
                                    className="addMinusBtn"
                                    // block
                                    icon={<MinusOutlined />}
                                  >
                                    {/* Add Entity */}
                                  </Button>
                                </Form.Item>
                              </Col>
                            </Row>
                          </>
                        ))}
                        <Row align={'middle'} justify={'space-between'} className="data-rows">
                          <Col md={2} xl={2}>
                            <div className="form-list-actions">
                              <Form.Item>
                                <Button
                                  onClick={() => {
                                    add();
                                  }}
                                  size="large"
                                  className="addMinusBtn"
                                  // block
                                  icon={<PlusOutlined />}
                                ></Button>
                              </Form.Item>
                            </div>
                          </Col>
                          <Col md={10} xl={10}>
                            {' '}
                          </Col>
                          <Col md={4} xl={4}>
                            {' '}
                          </Col>
                          <Col md={2} xl={2}>
                            {' '}
                          </Col>
                        </Row>
                      </>
                    )}
                  </Form.List>

                  <Row align={'middle'} justify={'space-between'} className="data-rows">
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                    <Col md={10} xl={10}>
                      <p>{t('costQuotation:total')}</p>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name={'totalCost'}
                        rules={[
                          {
                            required: true,
                            message: `${t('costQuotation:total')} ${t('costQuotation:isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" disabled />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>
                  <Paragraph>
                    <Text strong>{t('costQuotation:vatIsNotApplicable')}</Text>
                    <br />
                    <Text>{t('costQuotation:conditions')}</Text>
                    <br />
                    <Text>{t('costQuotation:paymentUpfront')}</Text>
                    <br />
                    <Text>{t('costQuotation:transport')}</Text>
                    <br />
                    <Text>{t('costQuotation:quotationValidation')}</Text>
                  </Paragraph>
                </div>
                {/* Cost Quotation table end */}
                <Row className="data-rows">
                  <Col md={24} xl={12}>
                    <Form.Item
                      label={t('costQuotation:signature')}
                      name="signature"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={true}
                      rules={[
                        {
                          validator: async (rule, file) => {
                            if (file?.length > 0) {
                              if (
                                !isValidateFileType(
                                  file[0]?.type,
                                  DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                                )
                              ) {
                                throw new Error(`${t('common:invalidFileFormat')}`);
                              } else if (file[0]?.size > maximumImageSize) {
                                // default size format of files would be in bytes -> 1MB = 1000000bytes
                                throw new Error(`${t('common:maxSizeVal')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Upload
                        accept={'.doc, .docx, .pdf, .png, .jpg'}
                        beforeUpload={(file: any) => {
                          return false;
                        }}
                        className="design-upload-section"
                        name="design"
                        action="/upload.do"
                        listType="picture"
                        multiple={false}
                      >
                        <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                          {t('common:upload')}
                        </Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <div className="steps-actions">
                  <Button type="primary" htmlType="submit">
                    {t('common:submit')}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
