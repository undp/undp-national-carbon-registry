import { Button, Col, Form, Input, Row, Upload, DatePicker, message } from 'antd';
import moment from 'moment';
import TextArea from 'antd/lib/input/TextArea';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { DocumentStatus } from '../../Definitions/Enums/document.status';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import { VerificationStepProps } from './StepProps';
import { useEffect, useState } from 'react';
import { API_PATHS } from '../../Config/apiConfig';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { DocumentEnum } from '../../Definitions/Enums/document.enum';
import { DocumentStateEnum } from '../../Definitions/Definitions/documentState.enum';
import { SlcfFormActionModel } from '../Models/SlcfFormActionModel';
import { useLocation } from 'react-router-dom';
import { ReactComponent as ConfirmSubmitSVG } from '../../Assets/DialogIcons/ConfirmSubmit.svg';

export const AppendixStep = (props: VerificationStepProps) => {
  const {
    t,
    current,
    form,
    formMode,
    prev,
    handleValuesUpdate,
    next,
    disableFields,
    documentId,
    handleLoading,
  } = props;
  const { userInfoState } = useUserContext();
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const { post } = useConnection();

  const { state } = useLocation();

  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      form.setFieldValue('documents-reviewed', [{ author: '' }]);
    }
  }, []);

  // const onFinish = (values: any) => {
  //   // console.log('--------values-----------', values);
  //   const body = { ...values };
  //   handleValuesUpdate({
  //     certificationStatement: body,
  //   });
  // };

  const [showDialog, setShowDialog] = useState<boolean>(false);

  const closeDialog = () => {
    setShowDialog(false);
  };

  const [formValues, setFormValues] = useState<any>();

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState<boolean>(false);

  const closeVerifyDialogBox = () => {
    setShowVerifyDialog(false);
  };

  const closeDeclineDialogBox = () => setShowDeclineDialog(false);

  const onFinish = async (values: any) => {
    const appendixFormValues: any = {
      ...values,
      appendix1Documents: (await fileUploadValueExtract(values, 'appendix1Documents'))[0],
      farIdDate: moment(values?.farIdDate).startOf('day').unix(),
      responseDate: moment(values?.responseDate).startOf('day').unix(),
      doeDate: moment(values?.doeDate).startOf('day').unix(),
    };

    handleValuesUpdate({ ...appendixFormValues });
  };

  const approve = async () => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.VERIFICATION,
          remarks: 'approved',
          action: DocumentStateEnum.DNA_APPROVED,
        });

        if (res?.statusText === 'SUCCESS') {
          message.open({
            type: 'success',
            content: 'Verification report was approved successfully',
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });

          if (next) {
            next();
          }
        }
      } catch (error: any) {
        console.log('--------------error----------------', error);
        if (error?.status === 401) {
          message.open({
            type: 'error',
            content: error.message,
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        } else {
          message.open({
            type: 'error',
            content: t('common:somethingWentWrong'),
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      } finally {
        if (handleLoading) {
          handleLoading(false);
        }
      }
    }
  };

  const reject = async (remarks?: string) => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.VERIFICATION,
          remarks: remarks,
          action: DocumentStateEnum.DNA_REJECTED,
        });

        if (res?.statusText === 'SUCCESS') {
          message.open({
            type: 'success',
            content: 'Verification report rejected',
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });

          if (next) {
            next();
          }
        }
      } catch (error) {
        message.open({
          type: 'error',
          content: t('common:somethingWentWrong'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      } finally {
        if (handleLoading) {
          handleLoading(false);
        }
      }
    }
  };

  return (
    <>
      {current === 10 && (
        <div>
          <div className="step-form-container">
            {(state?.mode === FormMode.CREATE || state?.mode === FormMode.EDIT) && (
              <>
                <SlcfFormActionModel
                  icon={<ConfirmSubmitSVG />}
                  title={t('verificationReport:confirmModalMessage')}
                  onCancel={closeDialog}
                  actionBtnText={t('common:yes')}
                  onFinish={() => {
                    onFinish(formValues);
                    closeDialog();
                  }}
                  openModal={showDialog}
                  type={'primary'}
                  remarkRequired={false}
                  t={t}
                />
              </>
            )}

            {state?.mode === FormMode.VERIFY && (
              <>
                <SlcfFormActionModel
                  actionBtnText={t('verificationReport:reject')}
                  onCancel={closeDeclineDialogBox}
                  icon={<CloseCircleOutlined />}
                  title={t('verificationReport:declineMessage')}
                  onFinish={(remarks: string) => {
                    console.log('-----remarks-------', remarks);
                    reject(remarks);
                  }}
                  remarkRequired
                  type="danger"
                  subText=""
                  openModal={showDeclineDialog}
                  t={t}
                />

                <SlcfFormActionModel
                  actionBtnText={t('verificationReport:approve')}
                  onCancel={closeVerifyDialogBox}
                  icon={<CheckCircleOutlined />}
                  title={t('verificationReport:approveMessage')}
                  onFinish={() => {
                    approve();
                  }}
                  remarkRequired={false}
                  type="primary"
                  subText=""
                  openModal={showVerifyDialog}
                  t={t}
                />
              </>
            )}
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                setShowDialog(true);
                setFormValues(values);
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    {/* appendix 1 start */}
                    <>
                      <h4 className="appendix-title">
                        <i>{t('verificationReport:appendix')} 1 </i>:{' '}
                        {t('verificationReport:appendixTitle1')}
                      </h4>
                      <Form.Item
                        // label={`${t('PDD:additionalComments')}`}
                        name="appendix1Comments"
                        rules={[
                          {
                            required: true,
                            message: ``,
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
                                  `${t('verificationReport:additionalComments')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={6} disabled={disableFields} />
                      </Form.Item>

                      <Form.Item
                        label={t('verificationReport:appendix1Documents')}
                        name="appendix1Documents"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        required={false}
                        rules={[
                          {
                            validator: async (rule, file) => {
                              // if (disableFields) return;
                              if (file?.length > 0) {
                                if (file[0]?.size > maximumImageSize) {
                                  // default size format of files would be in bytes -> 1MB = 1000000bytes
                                  throw new Error(`${t('common:maxSizeVal')}`);
                                }
                              }
                            },
                          },
                        ]}
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
                          multiple={true}
                          disabled={disableFields}
                          // maxCount={1}
                        >
                          <Button
                            className="upload-doc"
                            size="large"
                            icon={<UploadOutlined />}
                            disabled={disableFields}
                          >
                            {t('verificationReport:upload')}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </>
                    {/* appendix 1 end */}

                    {/* appendix 2 starts */}
                    <h4 className="appendix-title">
                      <i>{t('verificationReport:appendix')} 2 </i>:{' '}
                      {t('verificationReport:appendixTitle2')}
                    </h4>
                    {/* document reviewd table */}
                    <div className="appendix-documents-reviewed-table">
                      <Row className="header">
                        <Col xl={1} className="col col-1">
                          No
                        </Col>
                        <Col xl={5} className="col other-cols">
                          Author
                        </Col>
                        <Col xl={5} className="col other-cols">
                          Title
                        </Col>
                        <Col xl={5} className="col other-cols">
                          Reference to the document
                        </Col>
                        <Col xl={5} className="col other-cols">
                          Provider
                        </Col>
                        <Col xl={2}></Col>
                      </Row>

                      <Row className="body">
                        <Form.List name="documents-reviewed">
                          {(fields, { add, remove }) => (
                            <>
                              {fields.map(({ key, name, ...restFields }) => (
                                <>
                                  <Col xl={1} className="col-1 col">
                                    {name + 1 < 10 && '0'}
                                    {name + 1}
                                  </Col>

                                  <Col xl={5} className="col other-cols ">
                                    <Form.Item
                                      name={[name, 'author']}
                                      rules={[
                                        {
                                          required: true,
                                          message: ``,
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
                                                `${t('verificationReport:required')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input className="ant-input" disabled={disableFields} />
                                    </Form.Item>
                                  </Col>

                                  <Col xl={5} className="col other-cols">
                                    <Form.Item
                                      name={[name, 'title']}
                                      rules={[
                                        {
                                          required: true,
                                          message: ``,
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
                                                `${t('verificationReport:required')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input className="ant-input" disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={5} className=" col other-cols">
                                    <Form.Item
                                      name={[name, 'referenceToTheDoc']}
                                      rules={[
                                        {
                                          required: true,
                                          message: ``,
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
                                                `${t('verificationReport:required')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input className="ant-input" disabled={disableFields} />
                                    </Form.Item>
                                  </Col>

                                  <Col xl={5} className="col other-cols ">
                                    <Form.Item
                                      name={[name, 'provider']}
                                      rules={[
                                        {
                                          required: true,
                                          message: ``,
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
                                                `${t('verificationReport:required')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input className="ant-input" disabled={disableFields} />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={3} className="action-col">
                                    <Form.Item>
                                      <Button
                                        onClick={add}
                                        size="small"
                                        className="addMinusBtn"
                                        icon={<PlusOutlined />}
                                        disabled={disableFields}
                                      ></Button>
                                    </Form.Item>
                                    {name > 0 && (
                                      <Form.Item>
                                        <Button
                                          // type="dashed"
                                          onClick={() => {
                                            // removeParticipants(name2);
                                            remove(name);
                                          }}
                                          size="small"
                                          className="addMinusBtn"
                                          // block
                                          icon={<MinusOutlined />}
                                          // disabled={disableFields}
                                        >
                                          {/* Minus Participant */}
                                        </Button>
                                      </Form.Item>
                                    )}
                                  </Col>
                                </>
                              ))}
                            </>
                          )}
                        </Form.List>
                      </Row>
                    </div>
                    {/* appendix 2 ends */}
                  </div>
                </Col>
              </Row>

              {/* appendix 3 starts */}
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <h4 className="appendix-title">
                      <i>{t('verificationReport:appendix')} 3 </i>:{' '}
                      {t('verificationReport:appendixTitle3')}
                    </h4>

                    <h3 className="appendix-title">{t('verificationReport:appendixTitle3.1')}</h3>

                    <div className="form-section">
                      <Row className="row" gutter={[40, 16]}>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:farId')}`}
                            name="farId"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:farId')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <Input size="large" disabled={disableFields} />
                          </Form.Item>

                          <Form.Item
                            label={`${t('verificationReport:farIdDate')}`}
                            name="farIdDate"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:farIdDate')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <DatePicker
                              size="large"
                              disabled={disableFields}
                              disabledDate={(currentDate: any) =>
                                currentDate < moment().startOf('day')
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:sectionNo')}`}
                            name="sectionNo"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:sectionNo')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <Input size="large" disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col xl={24} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:descriptionOfFAR')}`}
                            name="descriptionOfFAR"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:descriptionOfFAR')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <TextArea rows={4} disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:projectParticipantResponse')}`}
                            name="projectParticipantResponse"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:projectParticipantResponse')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <TextArea rows={4} disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:responseDate')}`}
                            name="responseDate"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:responseDate')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <DatePicker
                              disabled={disableFields}
                              size="large"
                              disabledDate={(currentDate: any) =>
                                currentDate < moment().startOf('day')
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col xl={24} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:documentationProvided')}`}
                            name="documentationProvided"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:documentationProvided')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <TextArea rows={4} disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:doeAssesment')}`}
                            name="doeAssesment"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:doeAssesment')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <TextArea rows={4} disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col xl={12} md={24}>
                          <Form.Item
                            label={`${t('verificationReport:doeDate')}`}
                            name="doeDate"
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: `${t('verificationReport:doeDate')} ${t('isRequired')}`,
                            //   },
                            // ]}
                          >
                            <DatePicker
                              disabled={disableFields}
                              size="large"
                              disabledDate={(currentDate: any) =>
                                currentDate < moment().startOf('day')
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                {(state?.mode === FormMode.CREATE || state?.mode === FormMode.EDIT) && (
                  <>
                    <Button danger size={'large'} onClick={prev}>
                      {t('verificationReport:prev')}
                    </Button>
                    <Button type="primary" htmlType="submit">
                      {t('verificationReport:submit')}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VIEW && (
                  <>
                    <Button danger size={'large'} onClick={prev}>
                      {t('verificationReport:prev')}
                    </Button>
                    <Button type="primary" onClick={next}>
                      {t('verificationReport:goBackProjectDetails')}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VERIFY && (
                  <>
                    <Button size={'large'} onClick={prev} type={'default'}>
                      {t('verificationReport:prev')}
                    </Button>
                    <Button danger size={'large'} onClick={() => setShowDeclineDialog(true)}>
                      {t('verificationReport:reject')}
                    </Button>
                    <Button size={'large'} onClick={() => setShowVerifyDialog(true)} type="primary">
                      {t('verificationReport:approve')}
                    </Button>
                  </>
                )}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
