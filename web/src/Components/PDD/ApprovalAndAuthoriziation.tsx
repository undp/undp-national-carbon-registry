import React from 'react';
import { CustomStepsProps } from './StepProps';
import { Button, Form, Row } from 'antd';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';

const ApprovalAndAuthoriziation = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    handleValuesUpdate({ approvalAndAuthorization: values });
  };
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
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Form.Item
                className="full-width-form-item"
                label={`${t('PDD:approvalAndAuthorization')}`}
                name="approvalAndAuthorization"
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
                        throw new Error(`${t('PDD:approvalAndAuthorization')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  // placeholder={`${t('PDD:analysisEnvironmentalImapactsPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('PDD:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('PDD:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('PDD:next')}
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

export default ApprovalAndAuthoriziation;
