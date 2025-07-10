import React, { useEffect, useState } from 'react';
import { Col, Empty, Form, Radio, Row } from 'antd';
import { FormElementType, RadioButtonStatus2 } from '../../Definitions/Enums/commonEnums';

const Safeguards = (props: any) => {
  const { onFormSubmit, safeGuardViewData, viewOnly, translator } = props;
  const t = translator.t;
  const [safeguardDetails, setSafeguardDetails] = useState();
  const [form] = Form.useForm();
  const initialFormElementList = [
    {
      type: FormElementType.Label,
      label: t('safeguards:humanRights'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:isRespectHumanRights'),
          name: 'isRespectHumanRights',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:isProjectdiscriminate'),
          name: 'isProjectdiscriminate',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:genderEquality'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:genderEqualityQ1'),
          name: 'genderEqualityQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:genderEqualityQ2'),
          name: 'genderEqualityQ2',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:genderEqualityQ3'),
          name: 'genderEqualityQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:genderEqualityQ4'),
          name: 'genderEqualityQ4',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:communityHealth'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:communityHealthQ1'),
          name: 'communityHealthQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:historicHeritage'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:historicHeritageQ1'),
          name: 'historicHeritageQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:forcedEviction'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:forcedEvictionQ1'),
          name: 'forcedEvictionQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:landTenure'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:landTenureQ1'),
          name: 'landTenureQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:landTenureQ2'),
          name: 'landTenureQ2',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:indegenousPeople'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:indegenousPeopleQ1'),
          name: 'indegenousPeopleQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:corruption'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:corruptionQ1'),
          name: 'corruptionQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:labourRights'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:labourRightsQ1'),
          name: 'labourRightsQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:labourRightsQ2'),
          name: 'labourRightsQ2',
        },
        {
          type: FormElementType.Label,
          label: t('safeguards:labourRightsSubLabel'),
          className: 'mg-left-2',
          items: [
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ1'),
              name: 'labourRightsSubQ1',
              className: 'mg-left-4',
            },
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ2'),
              name: 'labourRightsSubQ2',
              className: 'mg-left-4',
            },
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ3'),
              name: 'labourRightsSubQ3',
              className: 'mg-left-4',
            },
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ4'),
              name: 'labourRightsSubQ4',
              className: 'mg-left-4',
            },
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ5'),
              name: 'labourRightsSubQ5',
              className: 'mg-left-4',
            },
            {
              type: FormElementType.Radio,
              label: t('safeguards:labourRightsSubQ6'),
              name: 'labourRightsSubQ6',
              className: 'mg-left-4',
            },
          ],
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:labourRightsQ3'),
          name: 'labourRightsQ3',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:labourRightsQ4'),
          name: 'labourRightsQ4',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:economicConsequences'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:economicConsequencesQ1'),
          name: 'economicConsequencesQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:emissions'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:emissionsQ1'),
          name: 'emissionsQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:energySupply'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:energySupplyQ1'),
          name: 'energySupplyQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:waterPattern'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:waterPatternQ1'),
          name: 'waterPatternQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:erosoin'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:erosoinQ1'),
          name: 'erosoinQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:erosoinQ2'),
          name: 'erosoinQ2',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:landscape'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:landscapeQ1'),
          name: 'landscapeQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:naturalDisaster'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:naturalDisasterQ1'),
          name: 'naturalDisasterQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:genetic'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:geneticQ1'),
          name: 'geneticQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:pollutants'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:pollutantsQ1'),
          name: 'pollutantsQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:hazardousWaste'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:hazardousWasteQ1'),
          name: 'hazardousWasteQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:pesticides'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:pesticidesQ1'),
          name: 'pesticidesQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:harvestForests'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:harvestForestsQ1'),
          name: 'harvestForestsQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:food'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:foodQ1'),
          name: 'foodQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:animalHusbandry'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:animalHusbandryQ1'),
          name: 'animalHusbandryQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:criticalHabitats'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:criticalHabitatsQ1'),
          name: 'criticalHabitatsQ1',
        },
      ],
    },
    {
      type: FormElementType.Label,
      label: t('safeguards:endangeredSpecies'),
      items: [
        {
          type: FormElementType.Radio,
          label: t('safeguards:endangeredSpeciesQ1'),
          name: 'endangeredSpeciesQ1',
        },
        {
          type: FormElementType.Radio,
          label: t('safeguards:endangeredSpeciesQ2'),
          name: 'endangeredSpeciesQ2',
        },
      ],
    },
  ];
  const [updatedFormElementList, setUpdatedFormElementList] =
    useState<any[]>(initialFormElementList);

  useEffect(() => {
    onFormSubmit(safeguardDetails);
  }, [safeguardDetails]);

  const checkFormItemValueAvailable = (valueitem: any) => {
    if (valueitem && safeGuardViewData) {
      if (safeGuardViewData.hasOwnProperty(valueitem.name)) {
        return true;
      }
    }
    return false;
  };

  const checkFormSubHeaderVisible = (labelItem: any) => {
    let updatedLabelItem: any = labelItem;
    let isItemVisible = false;
    if (labelItem && labelItem.items) {
      labelItem.items.forEach((item: any) => {
        if (item.type === FormElementType.Radio) {
          if (checkFormItemValueAvailable(item)) {
            updatedLabelItem = { ...labelItem, isVisible: true };
            isItemVisible = true;
          }
        } else {
          const updated = checkFormSubHeaderVisible(item);
          if (updated.isVisible) isItemVisible = true;
          const objIndex = labelItem.items.findIndex(
            (obj: any) => obj.type === FormElementType.Label
          );
          labelItem.items[objIndex] = updated;
          updatedLabelItem = { ...labelItem };
        }
      });
    }
    return { ...updatedLabelItem, isVisible: isItemVisible };
  };

  useEffect(() => {
    if (viewOnly && safeGuardViewData) {
      const updatedList = initialFormElementList.map((headerItem: any) => {
        return checkFormSubHeaderVisible(headerItem);
      });
      setUpdatedFormElementList(updatedList);
    } else {
      if (safeGuardViewData) {
        setSafeguardDetails(safeGuardViewData);
        form.setFieldsValue(safeGuardViewData);
      }
    }
  }, [safeGuardViewData]);

  const onSafeguardValuesChanged = (changedValues: any) => {
    setSafeguardDetails((pre: any) => ({ ...pre, ...changedValues }));
  };

  return (
    <>
      {viewOnly && !safeGuardViewData && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      {((viewOnly && safeGuardViewData) || !viewOnly) && (
        <div className="safeguard-tab-item">
          <div className="undpSesp-section-wrapper">
            <Row justify="center" align="middle" style={{ width: '100%' }}>
              <Col span={24} className="unfcccSdTool-section-title">
                <span>
                  <a
                    target="_blank"
                    href="https://www4.unfccc.int/sites/sdcmicrosite/Pages/Create-a-report.aspx"
                  >
                    {t('safeguards:undpSespTitle')}
                  </a>
                </span>
              </Col>
              <Col span={24}>
                <div className="undpSesp-section-divider" />
              </Col>
            </Row>
          </div>
          <Form
            onValuesChange={onSafeguardValuesChanged}
            name="safeguardDetails"
            labelWrap={true}
            labelAlign="left"
            labelCol={{ md: 16, lg: 18, xl: 18 }}
            wrapperCol={{ md: 8, lg: 6, xl: 6 }}
            layout="horizontal"
            form={form}
          >
            {updatedFormElementList.map((sectionItem: any) => {
              return (
                <>
                  {(sectionItem.isVisible || !viewOnly) && (
                    <div style={{ marginBottom: '15px' }}>
                      <label className="co-sub-title-text">{sectionItem.label}</label>
                    </div>
                  )}
                  {sectionItem.items.map((item: any) => {
                    if (item.type === FormElementType.Radio) {
                      return (
                        <>
                          {!viewOnly && (
                            <Form.Item
                              label={item?.label}
                              className={item.className ? item.className : 'form-item mg-left-2'}
                              name={item?.name}
                              rules={[
                                {
                                  required: false,
                                },
                              ]}
                            >
                              <Radio.Group size="middle">
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus2.YES}>
                                    {t('safeguards:yes')}
                                  </Radio.Button>
                                </div>
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus2.MAYBE}>
                                    {t('safeguards:maybe')}
                                  </Radio.Button>
                                </div>
                                <div className="radio-container">
                                  <Radio.Button className="radio" value={RadioButtonStatus2.NO}>
                                    {t('safeguards:no')}
                                  </Radio.Button>
                                </div>
                              </Radio.Group>
                            </Form.Item>
                          )}
                          {viewOnly && safeGuardViewData.hasOwnProperty(item?.name) && (
                            <div className="view-section">
                              <Form.Item
                                label={item?.label}
                                className={item.className ? item.className : 'form-item mg-left-2'}
                                name={item?.name}
                              >
                                <Radio.Group size="middle" disabled>
                                  <div className="radio-container">
                                    <Radio.Button className="radio">
                                      {safeGuardViewData[item?.name]}
                                    </Radio.Button>
                                  </div>
                                </Radio.Group>
                              </Form.Item>
                            </div>
                          )}
                        </>
                      );
                    } else if (item.type === FormElementType.Label) {
                      return (
                        <>
                          {(item.isVisible || !viewOnly) && (
                            <div style={{ marginBottom: '15px' }}>
                              <label className="co-sub-title-text mg-left-2">{item.label}</label>
                            </div>
                          )}
                          {item.items.map((subItem: any) => {
                            return (
                              <>
                                {!viewOnly && (
                                  <Form.Item
                                    label={subItem?.label}
                                    className={
                                      subItem.className ? subItem.className : 'form-item mg-left-2'
                                    }
                                    name={subItem?.name}
                                    rules={[
                                      {
                                        required: false,
                                      },
                                    ]}
                                  >
                                    <Radio.Group size="middle">
                                      <div className="radio-container">
                                        <Radio.Button
                                          className="radio"
                                          value={RadioButtonStatus2.YES}
                                        >
                                          {t('safeguards:yes')}
                                        </Radio.Button>
                                      </div>
                                      <div className="radio-container">
                                        <Radio.Button
                                          className="radio"
                                          value={RadioButtonStatus2.MAYBE}
                                        >
                                          {t('safeguards:maybe')}
                                        </Radio.Button>
                                      </div>
                                      <div className="radio-container">
                                        <Radio.Button
                                          className="radio"
                                          value={RadioButtonStatus2.NO}
                                        >
                                          {t('safeguards:no')}
                                        </Radio.Button>
                                      </div>
                                    </Radio.Group>
                                  </Form.Item>
                                )}
                                {viewOnly && safeGuardViewData.hasOwnProperty(subItem?.name) && (
                                  <div className="view-section">
                                    <Form.Item
                                      label={subItem?.label}
                                      className={
                                        subItem.className
                                          ? subItem.className
                                          : 'form-item mg-left-2'
                                      }
                                      name={subItem?.name}
                                    >
                                      <Radio.Group size="middle" disabled>
                                        <div className="radio-container">
                                          <Radio.Button className="radio">
                                            {safeGuardViewData[subItem?.name]}
                                          </Radio.Button>
                                        </div>
                                      </Radio.Group>
                                    </Form.Item>
                                  </div>
                                )}
                              </>
                            );
                          })}
                        </>
                      );
                    }
                  })}
                </>
              );
            })}
          </Form>
        </div>
      )}
    </>
  );
};

export default Safeguards;
