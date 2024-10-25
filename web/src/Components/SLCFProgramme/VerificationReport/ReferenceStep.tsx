import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';

import TextArea from 'antd/lib/input/TextArea';
import { DocType } from '../../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import moment from 'moment';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
export const ReferenceStep = (props: any) => {
  const { useLocation, translator, current, form, next, prev, onValueChange } = props;
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
      {current === 5 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={async (values: any) => {
                onValueChange({ reference: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:references')}`}
                      name="references"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:references')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={8} maxLength={6} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit">
                  Next
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
