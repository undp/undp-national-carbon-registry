import { useEffect, useState } from 'react';
import { Button, Col, Form, Input, Row, message, Typography, DatePicker, Upload } from 'antd';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import './AddCostQuotationForm.scss';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { DocType } from '../../Definitions/Enums/document.type';
import { API_PATHS } from '../../Config/apiConfig';
import { ROUTES } from '../../Config/uiRoutingConfig';
const { Text } = Typography;

export const AddCostQuotationForm = (props: any) => {
  const countryName = process.env.REACT_APP_COUNTRY_NAME || 'CountryX';

  const { translator, programmeId } = props;
  const navigate = useNavigate();
  const { post } = useConnection();

  const { state } = useLocation();
  const isView = !!state?.isView;
  const [loading, setLoading] = useState<boolean>(isView);

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const { id } = useParams();
  const [form] = Form.useForm();

  const navigateToDetailsPage = () => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
  };

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
    form.setFieldValue('totalCost', String(tempTotal.toFixed(2)));
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

  const viewDataMapToFields = (vals: any) => {
    const fileUrlParts = vals?.signature[0].split('/');
    const fileName = fileUrlParts[fileUrlParts.length - 1];
    const tempInialVals = {
      quotationNo: vals?.quotationNo,
      address: vals?.address,
      dateOfIssue: vals?.dateOfIssue ? moment.unix(vals?.dateOfIssue) : undefined,
      costValidation: Number(vals?.costValidation),
      costVerification: Number(vals?.costVerification),
      totalCost: Number(vals?.totalCost),
      signature: [
        {
          uid: 'cost_quotation',
          name: fileName,
          status: 'done',
          url: vals?.signature[0],
        },
      ],
      additionalServices: (function () {
        const servicesObjs: any[] = [];
        const tempServices: { cost: number; service: string }[] = vals?.additionalServices;
        if (tempServices !== undefined && tempServices.length > 0) {
          tempServices.forEach((service) => {
            const tempServiceObj = {
              cost: String(service.cost),
              service: service.service,
            };

            servicesObjs.push(tempServiceObj);
          });
        }

        return servicesObjs;
      })(),
    };

    form.setFieldsValue(tempInialVals);
  };

  useEffect(() => {
    const getViewData = async () => {
      if (isView) {
        try {
          const res = await post('national/programmeSl/getDocLastVersion', {
            programmeId: id,
            docType: 'costQuotation',
          });

          if (res?.statusText === 'SUCCESS') {
            const content = JSON.parse(res?.data.content);
            viewDataMapToFields(content);
          }
        } catch (error) {
          console.log('error', error);
          message.open({
            type: 'error',
            content: `${t('costQuotation:somethingWentWrong')}`,
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      }
    };

    getViewData();

    if (isView) {
      setDisableFields(true);
    }
  }, []);

  const handleInputNumberKeyDown = (event: any) => {
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  };
  const submitForm = async (values: any) => {
    const base64Docs: string[] = [];

    if (values?.signature && values?.signature.length > 0) {
      const docs = values?.signature;
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
      const res = await post(API_PATHS.CREATE_COST_COTATION, body);
      if (res?.response?.data?.statusCode === 200) {
        message.open({
          type: 'success',
          content: `${t('costQuotation:costQuotationFormSubmittedSuccessfully')}`,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
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
                <Row className="row" gutter={40} justify={'space-between'}>
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
                        disabled={disableFields}
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
                      <TextArea
                        rows={4}
                        placeholder={`${t('costQuotation:address')}`}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </Col>
                  <Col xl={12} md={24}>
                    <Form.Item
                      label={t('costQuotation:quotationNo')}
                      name="quotationNo"
                      initialValue={`SLCF/PD/${new Date().getFullYear() % 100}/${id}`}
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
                      <Input size="large" disabled />
                    </Form.Item>
                  </Col>
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
                          {
                            validator: async (rule, value) => {
                              if (value < 0) {
                                throw new Error(
                                  `${t('costQuotation:cost')} ${t(
                                    'costQuotation:cannotHaveNegativeNumbers'
                                  )}`
                                );
                              } else if (value > 999999999999999) {
                                throw new Error(
                                  `${t('costQuotation:cost')} ${t(
                                    'costQuotation:shouldBeLessThanMaxValue'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          size="large"
                          disabled={disableFields}
                          onChange={(val) => {
                            calculateTotalCost();
                          }}
                          onKeyDown={handleInputNumberKeyDown}
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
                          {
                            validator: async (rule, value) => {
                              if (value < 0) {
                                throw new Error(
                                  `${t('costQuotation:cost')} ${t(
                                    'costQuotation:cannotHaveNegativeNumbers'
                                  )}`
                                );
                              } else if (value > 999999999999999) {
                                throw new Error(
                                  `${t('costQuotation:cost')} ${t(
                                    'costQuotation:shouldBeLessThanMaxValue'
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          size="large"
                          disabled={disableFields}
                          onChange={(val) => {
                            calculateTotalCost();
                          }}
                          onKeyDown={handleInputNumberKeyDown}
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
                                  <Input
                                    size="large"
                                    onChange={(val) => {}}
                                    disabled={disableFields}
                                  />
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
                                    {
                                      validator: async (rule, value) => {
                                        if (value < 0) {
                                          throw new Error(
                                            `${t('costQuotation:cost')} ${t(
                                              'costQuotation:cannotHaveNegativeNumbers'
                                            )}`
                                          );
                                        } else if (value > 999999999999999) {
                                          throw new Error(
                                            `${t('costQuotation:cost')} ${t(
                                              'costQuotation:shouldBeLessThanMaxValue'
                                            )}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    size="large"
                                    disabled={disableFields}
                                    onChange={(val) => {
                                      calculateTotalCost();
                                    }}
                                    onKeyDown={handleInputNumberKeyDown}
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
                                    disabled={disableFields}
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
                                  disabled={disableFields}
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
                  <br />
                  <div>
                    <p>{t('costQuotation:vatIsNotApplicable')}</p>

                    <p>
                      <strong>{t('costQuotation:conditions')}</strong>
                    </p>
                    <ol type="a">
                      <li>
                        {t('costQuotation:paymentUpfront')}
                        <br />
                        {t('costQuotation:downPayment')}
                      </li>
                      <li>{t('costQuotation:transport')}</li>
                      <li>{t('costQuotation:quotationValidation')}</li>
                    </ol>
                  </div>
                </div>
                {/* Cost Quotation table end */}

                <div className="cost-quotation-signature">
                  <Text>{t('costQuotation:approvedBy')}</Text>
                  <Row className="sign-row">
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={t('costQuotation:signature')}
                        name="signature"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[
                          {
                            required: true,
                            message: `${t('costQuotation:signature')} ${t(
                              'costQuotation:isRequired'
                            )}`,
                          },
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
                          accept={'.png, .jpg'}
                          beforeUpload={(file: any) => {
                            return false;
                          }}
                          className="design-upload-section"
                          name="design"
                          action="/upload.do"
                          listType="picture"
                          multiple={false}
                          disabled={disableFields}
                          fileList={form.getFieldValue('signature') || []}
                          maxCount={1}
                        >
                          <Button
                            className="upload-doc"
                            size="large"
                            icon={<UploadOutlined />}
                            disabled={disableFields}
                          >
                            {t('common:upload')}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Text>{t('costQuotation:ceo')}</Text>
                  <br />
                  <Text>{t('costQuotation:ClimateFund', { countryName: countryName })}</Text>
                </div>
                <br />
                <br />
                <Row justify={'end'} className="step-actions-end">
                  {isView ? (
                    <>
                      <Button danger size={'large'} onClick={navigateToDetailsPage}>
                        {t('costQuotation:back')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button danger size={'large'} onClick={navigateToDetailsPage}>
                        {t('costQuotation:cancel')}
                      </Button>
                      <Button type="primary" size={'large'} htmlType="submit">
                        {t('costQuotation:submit')}
                      </Button>
                    </>
                  )}
                </Row>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
