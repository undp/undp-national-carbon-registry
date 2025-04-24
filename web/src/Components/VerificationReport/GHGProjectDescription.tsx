import { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select, Upload } from 'antd';
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { VerificationStepProps } from '../VerificationReport/StepProps';
import { formatNumberWithDecimalPlaces } from '../../Utils/utilityHelper';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';
import NetEmissionReduction from '../Common/NetEmissonReduction';

export const GHGProjectDescriptionStep = (props: VerificationStepProps) => {
  const { t, current, form, formMode, next, countries, prev, handleValuesUpdate, disableFields, maxNetGHGReduction } =
    props;

  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      //form.setFieldValue('estimatedNetEmissionReductions', [{ baselineEmissionReductions: 0 }]);
    }
  }, []);

  const onFinish = (values: any) => {
    console.log('-----------vals ---------', values);
    const tempValues = {
      ghgProjectDescription: {
        ...values,
        g_projectEmissions: values?.g_projectEmissions,
        g_leakageEmission: values?.g_leakageEmission,
        estimatedNetEmissionReductions: values?.estimatedNetEmissionReductions.map((item: any) => {
          const temp = {
            ...item,
            vintage: item?.vintage ? moment(item?.vintage).startOf('day').valueOf() : undefined,
          };
          return temp;
        }),
      },
    };
    console.log('------------temp vals ------------', tempValues);
    handleValuesUpdate(tempValues);
  };
  return (
    <>
      {current === 1 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              initialValues={{}}
              disabled={disableFields}
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
                      label={`${t('verificationReport:g_projectEmissions')}`}
                      name="g_projectEmissions"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:g_projectEmissions')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('verificationReport:g_leakageEmission')}`}
                      name="g_leakageEmission"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:g_leakageEmission')} ${t(
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

              <>
                <LabelWithTooltip
                  label={t('verificationReport:g_netEmmissionsTitle')}
                  required={true}
                  labelStyles={{
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                />
                <NetEmissionReduction
                  form={form}
                  t={t}
                  projectCategory={null}
                  disabled={disableFields}
                  maxNetGHGReduction={maxNetGHGReduction}
                ></NetEmissionReduction>
              </>

              <Row justify={'end'} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
                  {t('verificationReport:back')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next} disabled={false}>
                    {t('monitoringReport:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    disabled={false}
                    // onClick={next}
                  >
                    {t('monitoringReport:next')}
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
