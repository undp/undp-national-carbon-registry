import { Col, Empty, Form, Radio, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { RadioButtonStatus } from '../../Definitions/Enums/commonEnums';

const Environmental = (props: any) => {
  const { onFormSubmit, environmentalViewData, viewOnly, translator } = props;
  const t = translator.t;
  const environmentalDetailsInitial: any[] = [
    {
      section: t('unfcccSdTool:air'),
      fields: [
        {
          name: 'airQ1',
          label: t('unfcccSdTool:airQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'airQ2',
          label: t('unfcccSdTool:airQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ3',
          label: t('unfcccSdTool:airQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ4',
          label: t('unfcccSdTool:airQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ5',
          label: t('unfcccSdTool:airQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ6',
          label: t('unfcccSdTool:airQ6'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ7',
          label: t('unfcccSdTool:airQ7'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ8',
          label: t('unfcccSdTool:airQ8'),
          hide: true,
          required: true,
        },
        {
          name: 'airQ9',
          label: t('unfcccSdTool:airQ9'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:land'),
      fields: [
        {
          name: 'landQ1',
          label: t('unfcccSdTool:landQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'landQ2',
          label: t('unfcccSdTool:landQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ3',
          label: t('unfcccSdTool:landQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ4',
          label: t('unfcccSdTool:landQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ5',
          label: t('unfcccSdTool:landQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ6',
          label: t('unfcccSdTool:landQ6'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ7',
          label: t('unfcccSdTool:landQ7'),
          hide: true,
          required: true,
        },
        {
          name: 'landQ8',
          label: t('unfcccSdTool:landQ8'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:water'),
      fields: [
        {
          name: 'waterQ1',
          label: t('unfcccSdTool:waterQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'waterQ2',
          label: t('unfcccSdTool:waterQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'waterQ3',
          label: t('unfcccSdTool:waterQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'waterQ4',
          label: t('unfcccSdTool:waterQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'waterQ5',
          label: t('unfcccSdTool:waterQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'waterQ6',
          label: t('unfcccSdTool:waterQ6'),
          hide: true,
          required: true,
        },
        {
          name: 'waterQ7',
          label: t('unfcccSdTool:waterQ7'),
          hide: true,
          required: true,
        },
      ],
    },
    {
      section: t('unfcccSdTool:naturalResource'),
      fields: [
        {
          name: 'naturalResourceQ1',
          label: t('unfcccSdTool:naturalResourceQ1'),
          hide: false,
          required: false,
        },
        {
          name: 'naturalResourceQ2',
          label: t('unfcccSdTool:naturalResourceQ2'),
          hide: true,
          required: true,
        },
        {
          name: 'naturalResourceQ3',
          label: t('unfcccSdTool:naturalResourceQ3'),
          hide: true,
          required: true,
        },
        {
          name: 'naturalResourceQ4',
          label: t('unfcccSdTool:naturalResourceQ4'),
          hide: true,
          required: true,
        },
        {
          name: 'naturalResourceQ5',
          label: t('unfcccSdTool:naturalResourceQ5'),
          hide: true,
          required: true,
        },
        {
          name: 'naturalResourceQ6',
          label: t('unfcccSdTool:naturalResourceQ6'),
          hide: true,
          required: true,
        },
      ],
    },
  ];
  const [formOne] = Form.useForm();
  const [environmentalDetails, setEnvironmentalDetails] = useState<any[]>(
    environmentalDetailsInitial
  );
  const [environmentalUpdatedDetails, setEnvironmentalUpdatedDetails] = useState<any[]>();
  const [environmentalFormDetails, setEnvironmentalFormDetails] = useState<any>();
  const onFieldsChange = (changedFields: any) => {
    const changedFieldName = changedFields[0]?.name[0];
    const changedFieldValue = changedFields[0]?.value;
    if (changedFieldName.includes('1')) {
      const sectionName = changedFieldName.replace(/\d/g, '').replace('Q', '');
      const updatedEnvironmentalDetails = [...environmentalDetails];
      const sectionIndex = updatedEnvironmentalDetails.findIndex(
        (section) => section.section === t('unfcccSdTool:' + sectionName)
      );

      updatedEnvironmentalDetails[sectionIndex].fields.forEach((field: any) => {
        if (field.name !== changedFieldName) {
          field.hide = changedFieldValue !== RadioButtonStatus.YES;
        }
      });

      setEnvironmentalDetails(updatedEnvironmentalDetails);
    }
  };

  useEffect(() => {
    onFormSubmit(environmentalFormDetails);
  }, [environmentalFormDetails]);

  const onEnvironmentalValuesChanged = (changedValues: any) => {
    setEnvironmentalFormDetails((pre: any) => ({ ...pre, ...changedValues }));
  };

  useEffect(() => {
    if (environmentalViewData && viewOnly === true) {
      const updatedEnvironmentalData: any[] = [
        {
          section: t('unfcccSdTool:air'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:land'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:water'),
          fields: [],
        },
        {
          section: t('unfcccSdTool:naturalResource'),
          fields: [],
        },
      ];
      for (const key in environmentalViewData) {
        let section = '';
        if (String(key).includes('air')) {
          section = t('unfcccSdTool:air');
        } else if (String(key).includes('land')) {
          section = t('unfcccSdTool:land');
        } else if (String(key).includes('water')) {
          section = t('unfcccSdTool:water');
        } else if (String(key).includes('naturalResource')) {
          section = t('unfcccSdTool:naturalResource');
        }

        const environmentalItem = updatedEnvironmentalData.find((item) => item.section === section);

        if (environmentalItem) {
          environmentalItem.fields.push({
            name: key,
            label: t('unfcccSdTool:' + key),
            hide: false,
            value: environmentalViewData[key],
          });
        }
      }
      const filteredEconomicData = updatedEnvironmentalData.filter(
        (item) => item.fields.length > 0
      );
      setEnvironmentalUpdatedDetails(filteredEconomicData);
      setEnvironmentalDetails(filteredEconomicData);
    }
  }, []);

  return (
    <div className="co-benifits-tab-item">
      <Form
        name="environmental-details"
        className="benifits-details-environmental"
        labelCol={{ md: 16, lg: 19, xl: 17 }}
        wrapperCol={{ md: 8, lg: 5, xl: 7 }}
        layout="horizontal"
        requiredMark={true}
        form={formOne}
        onFieldsChange={onFieldsChange}
        onValuesChange={onEnvironmentalValuesChanged}
      >
        <div className={environmentalViewData ? 'section view-section' : 'section'}>
          <div className="unfccSdTool-section-wrapper">
            <Row justify="center" align="middle" style={{ width: '100%' }}>
              <Col span={24} className="unfcccSdTool-section-title">
                <span>
                  <a
                    target="_blank"
                    href="https://www4.unfccc.int/sites/sdcmicrosite/Pages/Create-a-report.aspx"
                  >
                    {t('unfcccSdTool:unfcccSdToolTitle')}
                  </a>
                </span>
              </Col>
              <Col span={24}>
                <div className="unfccSdTool-section-divider" />
              </Col>
              <Col span={24} className="unfcccSdTool-section-title">
                <span>{t('unfcccSdTool:environmental')}</span>
              </Col>
              <Col span={24}>
                <div className="unfccSdTool-section-divider" style={{ marginBottom: '20px' }} />
              </Col>
            </Row>
          </div>
          {environmentalDetails?.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          {environmentalDetails?.map((environmentalDetail: any) => (
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
                            field?.required && `${t(field?.name)} ${t('unfcccSdTool:isRequired')}`,
                        },
                      ]}
                    >
                      <Radio.Group
                        size="middle"
                        onChange={() => {}}
                        disabled={environmentalViewData && true}
                      >
                        {environmentalViewData ? (
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

export default Environmental;
