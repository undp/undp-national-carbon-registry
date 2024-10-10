import { Button, Form, Row, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';

const ApplicationOfMethodology = (props: CustomStepsProps) => {
  const { next, prev, form, current } = props;
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
              onFinish={(values: any) => {
                console.log('-----values---------', values);
              }}
            >
              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:titleAndReferenceOfMethodology')}`}
                name="titleAndReferenceOfMethodology"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:titleAndReferenceOfMethodology')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:titleAndReferenceOfMethodologyPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:applicabilityOfMethodology')}`}
                name="applicabilityOfMethodology"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:applicabilityOfMethodology')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:applicabilityOfMethodologyPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:baselineScenario')}`}
                name="baselineScenario"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:baselineScenario')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:baselineScenarioPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:additionality')}`}
                name="additionality"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:additionality')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:methodologyDeviations')}`}
                name="methodologyDeviations"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:methodologyDeviations')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:methodologyDeviationsPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`${t('CMAForm:projectBoundary')}`}
                name="projectBoundary"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:projectBoundary')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:methodologyDeviationsPlaceholder')}`}
                />
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

export default ApplicationOfMethodology;
