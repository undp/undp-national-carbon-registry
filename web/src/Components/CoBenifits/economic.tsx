import { Col, Empty, Form, Radio, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { RadioButtonStatus } from '../../Definitions/Enums/commonEnums';

const Economic = (props: any) => {
  const { onFormSubmit, economicViewData, viewOnly, translator } = props;
  const t = translator.t;
  const economicDetailsInitial: any[] = [
    {
      section: t('unfcccSdTool:growth'),
      fields: [
        {
          name: 'growthQ1',
          label: t('unfcccSdTool:growthQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'growthQ2',
          label: t('unfcccSdTool:growthQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ3',
          label: t('unfcccSdTool:growthQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ4',
          label: t('unfcccSdTool:growthQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ5',
          label: t('unfcccSdTool:growthQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ6',
          label: t('unfcccSdTool:growthQ6'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ7',
          label: t('unfcccSdTool:growthQ7'),
          hide: true,
          required: true,
        },
        {
          name: 'growthQ8',
          label: t('unfcccSdTool:growthQ8'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:energy'),
      fields: [
        {
          name: 'energyQ1',
          label: t('unfcccSdTool:energyQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'energyQ2',
          label: t('unfcccSdTool:energyQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'energyQ3',
          label: t('unfcccSdTool:energyQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'energyQ4',
          label: t('unfcccSdTool:energyQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'energyQ5',
          label: t('unfcccSdTool:energyQ5'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:techTransfer'),
      fields: [
        {
          name: 'techTransferQ1',
          label: t('unfcccSdTool:techTransferQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'techTransferQ2',
          label: t('unfcccSdTool:techTransferQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'techTransferQ3',
          label: t('unfcccSdTool:techTransferQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'techTransferQ4',
          label: t('unfcccSdTool:techTransferQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'techTransferQ5',
          label: t('unfcccSdTool:techTransferQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'techTransferQ6',
          label: t('unfcccSdTool:techTransferQ6'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:balanceOfPayments'),
      fields: [
        {
          name: 'balanceOfPaymentsQ1',
          label: t('unfcccSdTool:balanceOfPaymentsQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'balanceOfPaymentsQ2',
          label: t('unfcccSdTool:balanceOfPaymentsQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'balanceOfPaymentsQ3',
          label: t('unfcccSdTool:balanceOfPaymentsQ3'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:furtherInfo'),
      fields: [
        {
          name: 'furtherInfoQ1',
          label: t('unfcccSdTool:furtherInfoQ1'),
          hide: false,
          required: false,
        },
      ],
    },
  ];
  const [formOne] = Form.useForm();
  const [economicDetails, setEconomicDetails] = useState<any[]>(economicDetailsInitial);
  const [economicFormDetails, setEconomicFormDetails] = useState<any>();
  const onFieldsChange = (changedFields: any) => {
    const changedFieldName = changedFields[0]?.name[0];
    const changedFieldValue = changedFields[0]?.value;
    if (changedFieldName.includes('1')) {
      const sectionName = changedFieldName.replace(/\d/g, '').replace('Q', '');
      const updatedEconomicDetails = [...economicDetails];
      const sectionIndex = updatedEconomicDetails.findIndex(
        (section) => section.section === t('unfcccSdTool:' + sectionName)
      );

      updatedEconomicDetails[sectionIndex].fields.forEach((field: any) => {
        if (field.name !== changedFieldName) {
          field.hide = changedFieldValue !== RadioButtonStatus.YES;
        }
      });

      setEconomicDetails(updatedEconomicDetails);
    }
  };

  useEffect(() => {
    onFormSubmit(economicFormDetails);
  }, [economicFormDetails]);

  const onEconomicValuesChanged = (changedValues: any) => {
    setEconomicFormDetails((pre: any) => ({ ...pre, ...changedValues }));
  };

  useEffect(() => {
    if (economicViewData && viewOnly === true) {
      const updatedEconomicData: any[] = [
        {
          section: t('unfcccSdTool:growth'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:energy'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:techTransfer'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:balanceOfPayments'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:furtherInfo'),
          fields: [],
        },
      ];
      for (const key in economicViewData) {
        let section = '';
        if (String(key).includes('growth')) {
          section = t('unfcccSdTool:growth');
        } else if (String(key).includes('energy')) {
          section = t('unfcccSdTool:energy');
        } else if (String(key).includes('techTransfer')) {
          section = t('unfcccSdTool:techTransfer');
        } else if (String(key).includes('balanceOfPayments')) {
          section = t('unfcccSdTool:balanceOfPayments');
        } else if (String(key).includes('furtherInfo')) {
          section = t('unfcccSdTool:furtherInfo');
        }

        const economicItem = updatedEconomicData.find((item) => item.section === section);

        if (economicItem) {
          economicItem.fields.push({
            name: key,
            label: t('unfcccSdTool:' + key),
            hide: false,
            value: economicViewData[key],
          });
        }
      }
      const filteredEconomicData = updatedEconomicData.filter((item) => item.fields.length > 0);
      setEconomicDetails(filteredEconomicData);
    }
  }, []);

  return (
    <div className="co-benifits-tab-item">
      <Form
        name="economic-details"
        className="benifits-details-economic"
        labelCol={{ md: 16, lg: 19, xl: 17 }}
        wrapperCol={{ md: 8, lg: 5, xl: 7 }}
        layout="horizontal"
        requiredMark={true}
        form={formOne}
        onFieldsChange={onFieldsChange}
        onValuesChange={onEconomicValuesChanged}
      >
        <div className={economicViewData ? 'section view-section' : 'section'}>
          <div className="unfccSdTool-section-wrapper">
            <Row justify="center" align="middle" style={{ width: '100%' }}>
              <Col span={24}>
                <div className="unfccSdTool-section-divider" />
              </Col>
              <Col span={24} className="unfcccSdTool-section-title">
                <span>{t('unfcccSdTool:economic')}</span>
              </Col>
            </Row>
          </div>
          {economicDetails?.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          {economicDetails?.map((environmentalDetail: any) => (
            <>
              <div className="title">{environmentalDetail?.section}</div>
              {environmentalDetail?.fields?.map(
                (field: any, index: any) =>
                  !field?.hide && (
                    <Form.Item
                      label={field?.label}
                      className={`form-item ${index !== 0 ? 'field-margin' : ''}`}
                      name={field?.name}
                      rules={[
                        {
                          required: field?.required,
                          message:
                            field?.required && `${t(field?.name)} ${t('coBenifits:isRequired')}`,
                        },
                      ]}
                    >
                      <Radio.Group
                        size="middle"
                        onChange={() => {}}
                        disabled={economicViewData && true}
                      >
                        {economicViewData ? (
                          <>
                            {field?.value === RadioButtonStatus.YES && (
                              <div className="yes-no-radio-container">
                                <Radio.Button
                                  className="yes-no-radio"
                                  value={RadioButtonStatus.YES}
                                >
                                  {t('unfcccSdTool:yes')}
                                </Radio.Button>
                              </div>
                            )}
                            {field?.value === RadioButtonStatus.NO && (
                              <div className="yes-no-radio-container">
                                <Radio.Button className="yes-no-radio" value={RadioButtonStatus.NO}>
                                  {t('unfcccSdTool:no')}
                                </Radio.Button>
                              </div>
                            )}
                            {field?.value === RadioButtonStatus.NA && (
                              <div className="yes-no-radio-container">
                                <Radio.Button className="yes-no-radio" value={RadioButtonStatus.NA}>
                                  {t('unfcccSdTool:na')}
                                </Radio.Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="yes-no-radio-container">
                              <Radio.Button className="yes-no-radio" value={RadioButtonStatus.YES}>
                                {t('unfcccSdTool:yes')}
                              </Radio.Button>
                            </div>
                            <div className="yes-no-radio-container">
                              <Radio.Button className="yes-no-radio" value={RadioButtonStatus.NO}>
                                {t('unfcccSdTool:no')}
                              </Radio.Button>
                            </div>
                            <div className="yes-no-radio-container">
                              <Radio.Button className="yes-no-radio" value={RadioButtonStatus.NA}>
                                {t('unfcccSdTool:na')}
                              </Radio.Button>
                            </div>
                          </>
                        )}
                      </Radio.Group>
                    </Form.Item>
                  )
              )}
            </>
          ))}
        </div>
      </Form>
    </div>
  );
};

export default Economic;
