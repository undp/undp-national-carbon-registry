import React from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { ProcessSteps } from './ValidationStepperComponent';

const Reference = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;

  const onFinish = async (values: any) => {
    const referencesFormValues: any = {
      references: values?.references,
    };

    console.log(ProcessSteps.VR_REFERENCE, referencesFormValues);
    handleValuesUpdate({ [ProcessSteps.VR_REFERENCE]: referencesFormValues });
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
                // onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:references')}`}
                name="references"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:references')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={10} />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  onClick={next}
                  // htmlType="submit"
                >
                  {t('validationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default Reference;
