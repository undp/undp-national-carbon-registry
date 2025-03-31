import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';
import { useLocation } from 'react-router-dom';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import i18n from '../Internationalization/i18n';
import { VerificationStepProps } from './StepProps';

export const VerificationOpinionStep = (props: VerificationStepProps) => {
  const { t, current, form, formMode, next, countries, prev, handleValuesUpdate, disableFields } =
    props;
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = (values: any) => {
    // console.log('--------values-----------', values);
    const body = { ...values };
    handleValuesUpdate({
      verificationOpinion: body,
    });
  };

  return (
    <>
      {current === 8 && (
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
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:verificationOpinion')}`}
                      name="verificationOpinion"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:verificationOpinion')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
                  {t('verificationReport:back')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('verificationReport:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('verificationReport:next')}
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
