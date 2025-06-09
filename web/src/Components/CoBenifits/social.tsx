import React, { useEffect, useState } from 'react';
import { Col, Empty, Form, Input, InputNumber, Radio, Row } from 'antd';
import { FormElementType, RadioButtonStatus } from '../../Definitions/Enums/commonEnums';

const Social = (props: any) => {
  const { onFormSubmit, socialViewData, viewOnly, translator } = props;
  const t = translator.t;
  const [form] = Form.useForm();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [socialDetails, setSocialDetails] = useState();
  const [isFormValid, setIsFormValid] = useState(true);

  const SocialElementDetails: any[] = [
    {
      title: t('unfcccSdTool:jobs'),
      label: t('unfcccSdTool:jobRelatedMainQ'),
      name: 'jobRelatedMainQ',
      subItems: [
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:jobRelatedSubQ1'),
          name: 'jobRelatedSubQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:jobRelatedSubQ2'),
          name: 'jobRelatedSubQ2',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:jobRelatedSubQ3'),
          name: 'jobRelatedSubQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:jobRelatedSubQ4'),
          name: 'jobRelatedSubQ4',
        },
        {
          type: FormElementType.Input,
          label: t('unfcccSdTool:jobRelatedSubQ5'),
          name: 'jobRelatedSubQ5',
        },
        {
          type: FormElementType.Input,
          label: t('unfcccSdTool:jobRelatedSubQ6'),
          name: 'jobRelatedSubQ6',
        },
        {
          type: FormElementType.Input,
          label: t('unfcccSdTool:jobRelatedSubQ7'),
          name: 'jobRelatedSubQ7',
        },
      ],
    },
    {
      title: t('unfcccSdTool:health'),
      label: t('unfcccSdTool:healthRelatedMainQ'),
      name: 'healthRelatedMainQ',
      subItems: [
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ1'),
          name: 'healthRelatedSubQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ2'),
          name: 'healthRelatedSubQ2',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ3'),
          name: 'healthRelatedSubQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ4'),
          name: 'healthRelatedSubQ4',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ5'),
          name: 'healthRelatedSubQ5',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ6'),
          name: 'healthRelatedSubQ6',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ7'),
          name: 'healthRelatedSubQ7',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:healthRelatedSubQ8'),
          name: 'healthRelatedSubQ8',
        },
      ],
    },
    {
      title: t('unfcccSdTool:educational'),
      label: t('unfcccSdTool:educationRelatedMainQ'),
      name: 'educationRelatedMainQ',
      subItems: [
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:educationRelatedSubQ1'),
          name: 'educationRelatedSubQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:educationRelatedSubQ2'),
          name: 'educationRelatedSubQ2',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:educationRelatedSubQ3'),
          name: 'educationRelatedSubQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:educationRelatedSubQ4'),
          name: 'educationRelatedSubQ4',
        },
      ],
    },
    {
      title: t('unfcccSdTool:welfare'),
      label: t('unfcccSdTool:welfareRelatedMainQ'),
      name: 'welfareRelatedMainQ',
      subItems: [
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ1'),
          name: 'welfareRelatedSubQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ2'),
          name: 'welfareRelatedSubQ2',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ3'),
          name: 'welfareRelatedSubQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ4'),
          name: 'welfareRelatedSubQ4',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ5'),
          name: 'welfareRelatedSubQ5',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ6'),
          name: 'welfareRelatedSubQ6',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ7'),
          name: 'welfareRelatedSubQ7',
        },
        {
          type: FormElementType.Radio,
          label: t('unfcccSdTool:welfareRelatedSubQ8'),
          name: 'welfareRelatedSubQ8',
        },
      ],
    },
  ];

  useEffect(() => {
    if (socialViewData && !viewOnly) {
      setSocialDetails(socialViewData);
      form.setFieldsValue(socialViewData);
    }
  }, [socialViewData]);

  const validateForm = async () => {
    try {
      form.submit();
      await form.validateFields();
    } catch (exception: any) {
      if (exception.errorFields.length > 0) {
        setIsFormValid(false);
      } else {
        setIsFormValid(true);
      }
    }
  };

  const onRadioStatusChanged = () => {
    setRefreshCounter((pre) => pre + 1);
    validateForm();
  };

  useEffect(() => {
    onFormSubmit(socialDetails, isFormValid);
  }, [socialDetails, isFormValid]);

  const onSocialValuesChanged = async (changedValues: any) => {
    setSocialDetails((pre: any) => ({ ...pre, ...changedValues }));
    validateForm();
  };

  useEffect(() => {
    validateForm();
  });

  return (
    <div className="social-tab-item">
      <div className="unfccSdTool-section-wrapper">
        <Row justify="center" align="middle" style={{ width: '100%' }}>
          <Col span={24}>
            <div className="unfccSdTool-section-divider" />
          </Col>
          <Col span={24} className="unfcccSdTool-section-title">
            <span>{t('unfcccSdTool:social')}</span>
          </Col>
        </Row>
      </div>
      {viewOnly && !socialViewData && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {((viewOnly && socialViewData) || !viewOnly) && (
        <Form
          name="socialDetails"
          labelWrap={true}
          form={form}
          labelAlign="left"
          labelCol={{ md: 16, lg: 18, xl: 18 }}
          wrapperCol={{ md: 8, lg: 6, xl: 6 }}
          layout="horizontal"
          onValuesChange={onSocialValuesChanged}
        >
          {SocialElementDetails.map((element: any) => {
            return (
              <>
                {((viewOnly && socialViewData.hasOwnProperty(element?.name)) || !viewOnly) && (
                  <div style={{ marginBottom: '15px' }}>
                    <label className="co-sub-title-text">{element.title}</label>
                  </div>
                )}
                {!viewOnly && (
                  <>
                    <Form.Item className="mg-left-2" label={element.label} name={element.name}>
                      <Radio.Group size="middle" onChange={onRadioStatusChanged}>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.YES}>
                            {t('unfcccSdTool:yes')}
                          </Radio.Button>
                        </div>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.NO}>
                            {t('unfcccSdTool:no')}
                          </Radio.Button>
                        </div>
                        <div className="radio-container">
                          <Radio.Button className="radio" value={RadioButtonStatus.NA}>
                            {t('unfcccSdTool:na')}
                          </Radio.Button>
                        </div>
                      </Radio.Group>
                    </Form.Item>
                    {form.getFieldValue(element.name) === RadioButtonStatus.YES &&
                      element.subItems.map((elementItem: any) => {
                        if (elementItem.type === FormElementType.Radio) {
                          return (
                            <Form.Item
                              label={elementItem.label}
                              name={elementItem.name}
                              className="mg-left-4"
                              rules={[
                                {
                                  required: true,
                                  message: '',
                                },
                              ]}
                            >
                              <Radio.Group size="middle">
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus.YES}>
                                    {t('unfcccSdTool:yes')}
                                  </Radio.Button>
                                </div>
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus.NO}>
                                    {t('unfcccSdTool:no')}
                                  </Radio.Button>
                                </div>
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus.NA}>
                                    {t('unfcccSdTool:na')}
                                  </Radio.Button>
                                </div>
                              </Radio.Group>
                            </Form.Item>
                          );
                        } else if (elementItem.type === FormElementType.Input) {
                          return (
                            <Form.Item
                              className="mg-left-4"
                              labelCol={{ span: 24 }}
                              wrapperCol={{ span: 24 }}
                              label={elementItem.label}
                              name={elementItem.name}
                            >
                              <InputNumber style={{ width: 303 }} />
                            </Form.Item>
                          );
                        }
                      })}
                  </>
                )}
                {viewOnly && socialViewData && (
                  <>
                    {socialViewData.hasOwnProperty(element?.name) && (
                      <div className="view-section">
                        <Form.Item className="mg-left-2" label={element.label} name={element.name}>
                          <Radio.Group size="middle" disabled>
                            <div className="radio-container-view">
                              <Radio.Button className="radio">
                                {socialViewData[element.name]}
                              </Radio.Button>
                            </div>
                          </Radio.Group>
                        </Form.Item>
                      </div>
                    )}
                    {socialViewData[element.name] === RadioButtonStatus.YES &&
                      element.subItems.map((elementItem: any) => {
                        if (elementItem.type === FormElementType.Radio) {
                          return (
                            <>
                              {socialViewData.hasOwnProperty(elementItem?.name) && (
                                <div className="view-section">
                                  <Form.Item
                                    label={elementItem.label}
                                    name={elementItem.name}
                                    className="mg-left-4"
                                  >
                                    <Radio.Group size="middle" disabled>
                                      <div className="radio-container-view-child">
                                        <Radio.Button className="radio">
                                          {socialViewData[elementItem.name]}
                                        </Radio.Button>
                                      </div>
                                    </Radio.Group>
                                  </Form.Item>
                                </div>
                              )}
                            </>
                          );
                        } else if (elementItem.type === FormElementType.Input) {
                          return (
                            <div className="view-section">
                              <Form.Item
                                className="mg-left-4"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                label={elementItem.label}
                                name={elementItem.name}
                              >
                                <Input
                                  disabled
                                  style={{ width: 303 }}
                                  defaultValue={
                                    socialViewData.hasOwnProperty(elementItem?.name)
                                      ? socialViewData[elementItem.name]
                                      : '-'
                                  }
                                />
                              </Form.Item>
                            </div>
                          );
                        }
                      })}{' '}
                  </>
                )}
              </>
            );
          })}
        </Form>
      )}
    </div>
  );
};

export default Social;
