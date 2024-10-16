import React from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form } from 'antd';
import TextArea from 'antd/lib/input/TextArea';

const ProjectActivity = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;
  return (
    <>
      {current === 1 && (
        <div>
          <div className="val-report-step-form-container">
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
                label={`1.1 ${t('validationReport:objective')}`}
                name="objective"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:objective')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder="Explain the purpose of the validation." />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.2 ${t('validationReport:scopeAndCriteria')}`}
                name="scopeAndCriteria"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:scopeAndCriteria')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the scope and criteria of the validation."
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.3 ${t('validationReport:involvedPartiesAndParticipeant')}`}
                name="involvedPartiesAndParticipeant"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:involvedPartiesAndParticipeant')}  ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Indicate the level of assurance of the validation."
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`1.4 ${t('validationReport:summaryDescriptionProject')}`}
                name="summaryDescriptionProject"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:summaryDescriptionProject')} `,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a summary description of the project (no more than one page)."
                />
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

export default ProjectActivity;
