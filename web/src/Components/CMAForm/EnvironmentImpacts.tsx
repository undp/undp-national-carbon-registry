import { Button, Form, Row } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';

const EnvironmentImpacts = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    console.log('-----values---------', values);
    const tempValues = {
      analysis: values?.analysisEnvironmentalImpacts,
      assessment: values?.environmentalImpactAssessment,
    };

    handleValuesUpdate({ environmentImpacts: tempValues });
  };
  return (
    <>
      {current === 2 && (
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
                label={`${t('CMAForm:analysisEnvironmentalImpacts')}`}
                name="analysisEnvironmentalImpacts"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:analysisEnvironmentalImpacts')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:analysisEnvironmentalImapactsPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:environmentalImpactAssessment')}`}
                name="environmentalImpactAssessment"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:environmentalImpactAssessment')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:environmentalImpactAssessmentPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>
              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={next}
                  htmlType="submit"
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

export default EnvironmentImpacts;
