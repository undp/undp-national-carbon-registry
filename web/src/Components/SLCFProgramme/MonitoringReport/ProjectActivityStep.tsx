import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';

export const ProjectActivityStep = (props: any) => {
  const { useLocation, translator, current, form, next, countries, prev } = props;

  const { post } = useConnection();
  const [contactNoInput] = useState<any>();
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const t = translator.t;
  return (
    <>
      {current === 1 && (
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
              onFinish={(values: any) => console.log('-----form values-------', values)}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="details-part-one">
                    <Form.Item
                      label={t('monitoringReport:pa_monitoringObjective')}
                      name="pa_monitoringObjective"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_monitoringObjective')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_monitoringObjective')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pa_implementation')}
                      name="pa_implementation"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_implementation')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_implementation')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pa_scopeAndType')}
                      name="pa_scopeAndType"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:pa_scopeAndType')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder={`${t('monitoringReport:pa_scopeAndType')}`}
                        maxLength={6}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Form.Item>
                <div className="steps-actions">
                  <Button type="primary" onClick={next}>
                    Next
                  </Button>
                  <Button style={{ margin: '0 8px' }} onClick={prev}>
                    Back
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
