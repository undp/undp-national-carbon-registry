import { Button, Form, Row, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';

const QuantificationOfEmissions = (props: CustomStepsProps) => {
  const { next, prev, form, current } = props;
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
                console.log('-----values---------', values);
              }}
            >
              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:baselineEmissions')}`}
                name="baselineEmissions"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:baselineEmissions')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:baselineEmissionsPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:projectEmissions')}`}
                name="projectEmissions"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:projectEmissions')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:projectEmissionPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:leakage')}`}
                name="leakage"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:leakage')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:leakagePlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:netGHGEmissionReductionsAndRemovals')}`}
                name="netGHGEmissionReductionsAndRemovals"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:netGHGEmissionReductionsAndRemovals')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  onClick={next}
                  // htmlType="submit"
                >
                  {t('CMAForm:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuantificationOfEmissions;
