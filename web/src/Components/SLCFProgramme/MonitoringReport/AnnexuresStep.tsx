import { Button, Col, Form, Row, Upload } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { UploadOutlined } from '@ant-design/icons';
import { DocType } from '../../../Definitions/Enums/document.type';
export const AnnexuresStep = (props: any) => {
  const { useLocation, translator, current, form, prev, onFinish } = props;
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
      {current === 6 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                onFinish({ annexures: values });
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:annexures')}
                      name="annexures"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:annexures')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:annexuresPlaceholder')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:q_documentUpload')}
                      name="optionalDocuments"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={false}
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
                                throw new Error(`${t('monitoringReport:invalidFileFormat')}`);
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
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
                  Done
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
