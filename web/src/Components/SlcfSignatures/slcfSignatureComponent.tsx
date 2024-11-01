/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Empty, Form, Row, Upload, UploadFile, message } from 'antd';
import { useEffect, useState } from 'react';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { RcFile } from 'antd/lib/upload';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { ConfigurationSettingsType } from '../../Definitions/Definitions/settings.definitions';
import './slcfSignatureComponent.scss';
import '../../Styles/app.scss';
import { SLCFCertificateType } from '../../Definitions/Definitions/certificate.type.enum';
const { Meta } = Card;

const SLCFSignatureComponent = (props: any) => {
  const { t, maximumImageSize } = props;
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [ceoSign, setCeoSign] = useState<string>();
  const [chairmanSign, setChairmanSign] = useState<string>();
  const { get, post } = useConnection();
  const [validChairmanSign, setValidChairmanSign] = useState<boolean>(false);
  const [validCeoSign, setValidCeoSign] = useState<boolean>(false);

  const uploadSignatures = async (values: any) => {
    setLoading(true);
    try {
      let chairmanSignString = null;
      let ceoSignString = null;

      if (values?.chairmanSign && values?.chairmanSign.length > 0) {
        const chairmanBase64 = await getBase64(values?.chairmanSign[0]?.originFileObj as RcFile);
        const chairmanSignUrls = chairmanBase64.split(',');
        chairmanSignString = chairmanSignUrls[1];
      }
      if (values?.ceoSign && values?.ceoSign.length > 0) {
        const ceoBase64 = await getBase64(values?.ceoSign[0]?.originFileObj as RcFile);
        const ceoSignUrls = ceoBase64.split(',');
        ceoSignString = ceoSignUrls[1];
      }

      const response = await post('national/Settings/signs/update', {
        chairmanSign: chairmanSignString,
        ceoSign: ceoSignString,
      });
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: t('signUploadSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });

        if (response?.data?.ceoSign) {
          setCeoSign(response?.data?.ceoSign);
        }
        if (response?.data?.chairmanSign) {
          setChairmanSign(response?.data?.chairmanSign);
        }
        setLoading(false);
        setFileList([]);
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const getSigns = async () => {
    const ceoSignResponse = await get(
      `national/Settings/query?id=${ConfigurationSettingsType.ceoSign}`
    );
    const chairmanSignResponse = await get(
      `national/Settings/query?id=${ConfigurationSettingsType.chairmanSign}`
    );
    if (ceoSignResponse && ceoSignResponse.data) {
      setCeoSign(ceoSignResponse.data);
    }
    if (chairmanSignResponse && chairmanSignResponse.data) {
      setChairmanSign(chairmanSignResponse.data);
    }
  };

  useEffect(() => {
    getSigns();
  }, []);

  const normFile = (e: any, type: 'ceo' | 'chairman') => {
    const currentFileList = e.fileList;
    const valid =
      currentFileList.length > 0 &&
      currentFileList[0].size <= maximumImageSize &&
      currentFileList[0].type === 'image/jpeg';
    if (type === 'ceo') {
      setValidCeoSign(valid);
    } else {
      setValidChairmanSign(valid);
    }
    return currentFileList;
  };

  const downloadPreviewCertificate = async (url: string) => {
    setLoading(true);
    try {
      if (url !== undefined && url !== '') {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = url.split('/').pop() || 'Preview_Certificate.pdf'; // Extract filename or provide default
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl); // Clean up the created object URL
        } else {
          message.open({
            type: 'error',
            content: response.statusText,
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.log('Error downloading certificate', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const getPreviewCertificate = async (type: SLCFCertificateType) => {
    const certUrl = await get(`national/Settings/certificates?type=${type}`);
    if (certUrl.status === 200 && certUrl.data) {
      await downloadPreviewCertificate(certUrl.data?.certURL);
    }
  };

  return (
    <div className="slcf-signs-container">
      <div className="slcf-signs-title">
        <h1 className="add-sign-title">{t('certificateSignatures')}</h1>
        <p>{t('settings:certificateSignaturesSub')}</p>
      </div>
      <div className="slcf-upload-signs-main">
        <div className="slcf-upload-signs-form">
          <Form
            name="slcf-signatures"
            className="slcf-signatures-form"
            layout="vertical"
            requiredMark={true}
            form={form}
            onFinish={uploadSignatures}
          >
            <Row className="row" gutter={[20, 20]}>
              <Col xl={12} md={24}>
                <Form.Item
                  name="chairmanSign"
                  label={t('settings:chairmanSign')}
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  required={false}
                  rules={[
                    {
                      validator: async (rule, file) => {
                        if (file && file.length !== 0) {
                          let isCorrectFormat = false;
                          if (file[0]?.type === 'image/jpeg') {
                            isCorrectFormat = true;
                          }
                          if (!isCorrectFormat) {
                            throw new Error(`${t('unsupportedFormat')}`);
                          } else if (file[0]?.size > maximumImageSize) {
                            // default size format of files would be in bytes -> 1MB = 1000000bytes
                            throw new Error(`${t('maxUploadSize')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Upload
                    beforeUpload={() => {
                      return false;
                    }}
                    className="chairmanSign-upload-section"
                    name="chairmanSign"
                    action="/upload.do"
                    listType="picture"
                    multiple={false}
                    defaultFileList={fileList}
                    maxCount={1}
                  >
                    <Button size="large" icon={<UploadOutlined />}>
                      {t('settings:upload')}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col xl={12} md={24}>
                <Form.Item
                  name="ceoSign"
                  label={t('settings:ceoSign')}
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  required={false}
                  rules={[
                    {
                      validator: async (rule, file) => {
                        if (file && file.length !== 0) {
                          let isCorrectFormat = false;
                          if (file[0]?.type === 'image/jpeg') {
                            isCorrectFormat = true;
                          }
                          if (!isCorrectFormat) {
                            throw new Error(`${t('unsupportedFormat')}`);
                          } else if (file[0]?.size > maximumImageSize) {
                            // default size format of files would be in bytes -> 1MB = 1000000bytes
                            throw new Error(`${t('maxUploadSize')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Upload
                    beforeUpload={() => {
                      return false;
                    }}
                    className="ceoSign-upload-section"
                    name="ceoSign"
                    action="/upload.do"
                    listType="picture"
                    multiple={false}
                    defaultFileList={fileList}
                    maxCount={1}
                  >
                    <Button size="large" icon={<UploadOutlined />}>
                      {t('settings:upload')}
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
            <Row className="sign-upload-btn-row">
              <Button
                loading={loading}
                className="mg-left-1"
                type="primary"
                htmlType="submit"
                disabled={!validChairmanSign && !validCeoSign}
              >
                {t('settings:save')}
              </Button>
            </Row>
          </Form>
        </div>
        <Divider />
        <div className="current-signs-main">
          <h2 className="current-signs-title">{t('currentSignatures')}</h2>
          <p>{t('settings:currentSignaturesSub')}</p>
          <Row className="row" gutter={[16, 16]}>
            <Card
              className="signature-card"
              cover={
                chairmanSign ? (
                  <img
                    alt="chairman's signature"
                    className="signature-image"
                    src={`${chairmanSign}?${new Date().getTime()}`}
                  />
                ) : (
                  <Empty></Empty>
                )
              }
            >
              <Meta title={t('settings:chairmanSign')} />
            </Card>
            <Card
              className="signature-card"
              cover={
                ceoSign ? (
                  <img
                    alt="ceo's signature"
                    className="signature-image"
                    src={`${ceoSign}?${new Date().getTime()}`}
                  />
                ) : (
                  <Empty></Empty>
                )
              }
            >
              <Meta title={t('settings:ceoSign')} />
            </Card>
          </Row>
        </div>
        <Divider />
        <div className="test-cert-main">
          <h2 className="test-cert-title">{t('settings:previewCertificates')}</h2>
          <p>{t('settings:previewCertificatesSub')}</p>
          <div className="cert-button-container">
            <Button
              className="cert-button"
              onClick={() => getPreviewCertificate(SLCFCertificateType.REGISTRATION)}
            >
              {t('settings:previewRegCert')}
            </Button>
            <Button
              className="cert-button"
              onClick={() => getPreviewCertificate(SLCFCertificateType.CREDIT_ISSUANCE)}
            >
              {t('settings:previewCreditIssueCert')}
            </Button>
            <Button
              className="cert-button"
              onClick={() => getPreviewCertificate(SLCFCertificateType.CREDIT_RETIREMENT)}
            >
              {t('settings:previewCreditRetirementCert')}
            </Button>
            <Button
              className="cert-button"
              onClick={() => getPreviewCertificate(SLCFCertificateType.CARBON_NEUTRAL)}
            >
              {t('settings:previewCarbonNeutralCert')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SLCFSignatureComponent;
