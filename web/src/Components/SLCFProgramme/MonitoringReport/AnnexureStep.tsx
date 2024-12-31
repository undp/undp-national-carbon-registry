import { Button, Col, Form, Row, Upload } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { UploadOutlined } from '@ant-design/icons';
import { DocType } from '../../../Definitions/Enums/document.type';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { fileUploadValueExtract } from '../../../Utils/utilityHelper';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
export const AnnexureStep = (props: any) => {
  const {
    useLocation,
    translator,
    current,
    form,
    formMode,
    prev,
    cancel,
    approve,
    reject,
    onFinish,
    status,
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
              disabled={FormMode.VIEW === formMode}
              onFinish={async (values: any) => {
                onFinish({ annexures: values });
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:additionalComments')}
                      name="additionalComments"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:additionalComments')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
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
                <Button onClick={prev} disabled={false}>
                  Back
                </Button>
                <Button onClick={cancel} disabled={false}>
                  Cancel
                </Button>
                {userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
                  FormMode.VIEW !== formMode && (
                    <Button type="primary" htmlType="submit" disabled={false}>
                      <span>Submit</span>
                    </Button>
                  )}

                {userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
                  status === DocumentStatus.PENDING && (
                    <Button danger onClick={reject} disabled={false}>
                      <span>Reject</span>
                    </Button>
                  )}
                {userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
                  status === DocumentStatus.PENDING && (
                    <Button type="primary" onClick={approve} disabled={false}>
                      <span>Approve</span>
                    </Button>
                  )}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
