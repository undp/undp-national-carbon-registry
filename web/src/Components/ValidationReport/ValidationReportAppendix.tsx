import { Row, Button, Form, Upload } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { CustomStepsProps } from '../PDD/StepProps';
import { RcFile } from 'antd/lib/upload';
import { UploadOutlined } from '@ant-design/icons';
import { ProcessSteps } from './ValidationStepperComponent';
import { fileUploadValueExtract } from '../../Utils/utilityHelper';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

const ValidationReportAppendix = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, submitForm, t, formMode } = props;

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    const appendixFormValues: any = {
      comments: values?.comments,
      additionalDocuments: await fileUploadValueExtract(values, 'additionalDocuments'),
    };

    console.log(ProcessSteps.VR_APPENDIX, appendixFormValues);
    handleValuesUpdate({ [ProcessSteps.VR_APPENDIX]: appendixFormValues });
  };

  return (
    <>
      {current === 7 && (
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
                onFinish(values);
              }}
              disabled={FormMode.VIEW === formMode}
            >
              <Form.Item
                className='className="full-width-form-item'
                label={`${t('validationReport:additionalComments')}`}
                name="comments"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:additionalComments')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
              </Form.Item>
              <Form.Item
                label={t('validationReport:uploadDocs')}
                name="additionalDocuments"
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
                    {t('validationReport:upload')}
                  </Button>
                </Upload>
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                {FormMode.VIEW !== formMode && (
                  <Button type="primary" size={'large'} htmlType="submit" disabled={false}>
                    {t('validationReport:submit')}
                  </Button>
                )}
                {FormMode.VIEW === formMode && (
                  <Button type="primary" size={'large'} disabled={false} onClick={next}>
                    {t('validationReport:backtoProjectDetails')}
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

export default ValidationReportAppendix;
