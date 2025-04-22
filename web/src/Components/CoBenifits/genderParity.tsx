import { Col, Empty, Form, Input, InputNumber, Radio, Row } from 'antd';
import React, { useEffect, useState } from 'react';

const GenderParity = (props: any) => {
  const { onFormSubmit, genderParityViewData, viewOnly, translator } = props;
  const [formOne] = Form.useForm();
  const [formTwo] = Form.useForm();
  const t = translator.t;
  const [genderParityDetails, setGenderParityDetails] = useState();
  const genderParityDetailsOne = [
    {
      label: t('genderParity:benifit1'),
      name: 'descriminationAgainstGirls',
      value: true,
    },
    {
      label: t('genderParity:benifit2'),
      name: 'violationAgainstGirls',
      value: true,
    },
    {
      label: t('genderParity:benifit3'),
      name: 'harmfulPracticesAgainstGirls',
      value: true,
    },
    {
      label: t('genderParity:benifit4'),
      name: 'equealRightsToGirls',
      value: true,
    },
    {
      label: t('genderParity:benifit5'),
      name: 'equealRightsToHealthToGirls',
      value: true,
    },
  ];

  const genderParityDetailsTwo = [
    {
      label: t('genderParity:benifit6'),
      name: 'numberOfWomenEmpoyed',
      col: { md: 18, lg: 10 },
      labelCol: 24,
      wrapperCol: 18,
    },
    {
      label: t('genderParity:benifit7'),
      name: 'numberOfWomenTrained',
      col: { md: 18, lg: 10 },
      labelCol: 24,
      wrapperCol: 18,
    },
    {
      label: t('genderParity:benifit8'),
      name: 'numberOfWomenSelectedForDecisionMaking',
      col: { md: 18, lg: 16 },
      labelCol: 24,
      wrapperCol: 11,
    },
    {
      label: t('genderParity:benifit9'),
      name: 'numberOfWomenProvidedAccessForTech',
      col: { md: 18, lg: 16 },
      labelCol: 24,
      wrapperCol: 11,
    },
  ];
  const [genderParityFormOneFields, setGenderParityFormOneFields] =
    useState<any[]>(genderParityDetailsOne);
  const [genderParityFormTwoFields, setGenderParityFormTwoFields] =
    useState<any[]>(genderParityDetailsTwo);

  useEffect(() => {
    onFormSubmit(genderParityDetails);
  }, [genderParityDetails]);

  const onGenderParityValuesChanged = (changedValues: any) => {
    setGenderParityDetails((pre: any) => ({ ...pre, ...changedValues }));
  };

  const onGenderParityValuesChangedSub = (changedValues: any) => {
    setGenderParityDetails((pre: any) => ({ ...pre, ...changedValues }));
  };

  useEffect(() => {
    if (viewOnly === true && !genderParityViewData) {
      setGenderParityFormOneFields([]);
      setGenderParityFormTwoFields([]);
    }
    if (genderParityViewData) {
      const updatedGenderParityFormOneFields = genderParityFormOneFields
        .filter((field) => genderParityViewData.hasOwnProperty(field.name))
        .map((field) => ({
          ...field,
          value: genderParityViewData[field.name],
        }));

      const updatedGenderParityFormTwoFields = genderParityFormTwoFields.map((field) => ({
        ...field,
        value:
          genderParityViewData[field.name]?.length > 0 ? genderParityViewData[field.name] : '-',
      }));
      setGenderParityFormOneFields(updatedGenderParityFormOneFields);
      setGenderParityFormTwoFields(updatedGenderParityFormTwoFields);
      if (updatedGenderParityFormTwoFields?.length > 0) {
        updatedGenderParityFormTwoFields?.map((fieldData: any) => {
          formTwo.setFieldValue(fieldData?.name, fieldData?.value);
        });
      }
    }
  }, []);

  return (
    <div className="co-benifits-tab-item">
      <Form
        name="gender-parity-details"
        className="benifits-details-gender-parity"
        labelCol={{ md: 16, lg: 19, xl: 19 }}
        wrapperCol={{ md: 8, lg: 5, xl: 5 }}
        layout="horizontal"
        requiredMark={true}
        form={formOne}
        onValuesChange={onGenderParityValuesChanged}
      >
        {genderParityFormOneFields?.length === 0 && genderParityFormTwoFields?.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        <div className="part-one view-section">
          {genderParityFormOneFields?.map((genderParityItem: any) => {
            return (
              <Form.Item
                label={genderParityItem?.label}
                className="form-item"
                name={genderParityItem?.name}
                rules={[
                  {
                    required: false,
                  },
                ]}
              >
                {genderParityViewData ? (
                  <>
                    <Radio.Group size="middle" onChange={() => {}} disabled>
                      <div className="yes-no-radio-container">
                        <Radio.Button className="yes-no-radio" value={genderParityItem?.value}>
                          {genderParityItem?.value === true
                            ? t('genderParity:yes')
                            : t('genderParity:no')}
                        </Radio.Button>
                      </div>
                    </Radio.Group>
                  </>
                ) : (
                  <Radio.Group size="middle" onChange={() => {}}>
                    <div className="yes-no-radio-container">
                      <Radio.Button className="yes-no-radio" value={genderParityItem?.value}>
                        {t('genderParity:yes')}
                      </Radio.Button>
                    </div>
                    <div className="yes-no-radio-container">
                      <Radio.Button className="yes-no-radio" value={!genderParityItem?.value}>
                        {t('genderParity:no')}
                      </Radio.Button>
                    </div>
                  </Radio.Group>
                )}
              </Form.Item>
            );
          })}
        </div>
        <div className="part-two">
          <Form
            name="additional-details"
            layout="vertical"
            form={formTwo}
            onValuesChange={onGenderParityValuesChangedSub}
          >
            <Row gutter={[16, 16]}>
              {genderParityFormTwoFields?.map((genderDetail: any) => (
                <Col md={genderDetail?.col?.md} lg={genderDetail?.col?.lg}>
                  <Form.Item
                    labelCol={{ span: genderDetail?.labelCol }}
                    wrapperCol={{ span: genderDetail?.wrapperCol }}
                    label={genderDetail?.label}
                    className="form-item"
                    name={genderDetail?.name}
                    rules={[
                      {
                        required: false,
                      },
                    ]}
                  >
                    {genderParityViewData ? (
                      <Input
                        disabled={genderParityViewData && true}
                        size="large"
                        defaultValue={
                          genderDetail?.value
                            ? genderDetail?.value
                            : !genderParityViewData
                            ? undefined
                            : undefined
                        }
                      />
                    ) : (
                      <Input
                        disabled={genderParityViewData && true}
                        size="large"
                        defaultValue={
                          genderDetail?.value
                            ? genderDetail?.value
                            : !genderParityViewData
                            ? undefined
                            : undefined
                        }
                      />
                    )}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Form>
        </div>
      </Form>
    </div>
  );
};

export default GenderParity;
