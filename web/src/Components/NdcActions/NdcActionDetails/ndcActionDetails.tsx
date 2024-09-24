/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Tooltip,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import './ndcActionDetails.scss';
import '../../../Styles/common.table.scss';
import { RcFile } from 'rc-upload/lib/interface';
import {
  AgricultureCreationRequest,
  SolarCreationRequest,
  calculateCredit,
  SoilEnrichmentCreationRequest,
  StovesHousesNamibiaCreationRequest,
  SolarWaterPumpingOffGridCreationRequest,
  SolarWaterPumpingOnGridCreationRequest,
} from '@undp/carbon-credit-calculator';
// import {
//   MitigationTypes,
//   NdcActionTypes,
//   Sector,
//   addCommSepRound,
//   consumerGroupList,
//   energyGenerationUnitList,
//   getBase64,
//   landAreaUnitList,
//   mitigationTypeList,
//   ndcActionTypeList,
//   sectorMitigationTypesListMapped,
//   mitigationSubTypesListMapped,
//   MitigationSubTypes,
//   methodologyOptions,
// } from '../Definitions';
import { InfoCircle } from 'react-bootstrap-icons';
import { ndcActionTypeList, NdcActionTypes } from '../../../Definitions/Enums/ndcActionTypes.enum';
import {
  methodologyOptions,
  MitigationSubTypes,
  mitigationSubTypesListMapped,
  mitigationTypeList,
  MitigationTypes,
  sectorMitigationTypesListMapped,
} from '../../../Definitions/Enums/mitigation.types.enum';
import { addCommSepRound, getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { Sector } from '../../../Definitions/Enums/sector.enum';
import { energyGenerationUnitList } from '../../../Definitions/Enums/energyGenerationUnits.enum';
import { consumerGroupList } from '../../../Definitions/Enums/consumerGroups.enum';
import { landAreaUnitList } from '../../../Definitions/Enums/landAreaUnits.enum';
import { enablementTypesAndValues } from '../../../Definitions/Enums/enablementTypes.enum';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
// import { enablementTypesAndValues } from '../../../Definitions/Enums/enablementTypes.enum';
// import { isValidateFileType } from '../../../Utils/DocumentValidator';

export interface NdcActionDetailsProps {
  isBackBtnVisible: boolean;
  onFormSubmit: any;
  ndcActionDetails: any;
  translator: any;
  programmeDetails?: any;
  onClickedBackBtn?: any;
}

const NdcActionDetails = (props: NdcActionDetailsProps) => {
  const {
    isBackBtnVisible,
    onFormSubmit,
    ndcActionDetails,
    translator,
    programmeDetails,
    onClickedBackBtn,
  } = props;
  translator.setDefaultNamespace('ndcAction');
  const t = translator.t;
  const [ndcActionType, setNdcActionType] = useState();
  const [methodology, setMethodology] = useState();
  const [mitigationType, setmitigationType] = useState();
  const [mitigationSubType, setMitigationSubType] = useState('');
  const [sector, setSector] = useState<any>('');
  const [ndcActionTypeListFiltered, setNdcActionTypeListFiltered] =
    useState<any[]>(ndcActionTypeList);
  const [checkedOptionsGhgReduced, setCheckedOptionsGhgReduced] = useState<any[]>([]);
  const [checkedOptionsGhgAvoided, setCheckedOptionsGhgAvoided] = useState<any[]>([]);
  const [inputNumberValueGhgAvoidedGas, setInputNumberValueGhgAvoidedGas] = useState<any>();
  const [inputNumberValueGhgReducedGas, setInputNumberValueGhgReducedGas] = useState<any>();
  const [includedInNAP, setIncludedInNAP] = useState<any>();
  const [form] = Form.useForm();

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  //changing value to N2O. Previously it was N20(N-Two-Zero)
  const ghgEmissionsGas = ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6'];

  useEffect(() => {
    if (programmeDetails) {
      setSector(programmeDetails?.sector);
    }
  }, [programmeDetails]);

  useEffect(() => {
    if (ndcActionDetails) {
      if (ndcActionDetails?.action) {
        setNdcActionType(ndcActionDetails?.action);
      }
      if (ndcActionDetails?.typeOfMitigation) {
        setmitigationType(ndcActionDetails?.typeOfMitigation);
      }

      if (ndcActionDetails?.subTypeOfMitigation) {
        setMitigationSubType(ndcActionDetails?.subTypeOfMitigation);
      }

      if (ndcActionDetails?.includedInNAP) {
        setIncludedInNAP(ndcActionDetails?.includedInNAP);
      }
      if (ndcActionDetails?.inputNumberValueGhgAvoidedGas) {
        setInputNumberValueGhgAvoidedGas(ndcActionDetails?.inputNumberValueGhgAvoidedGas);
      }
      if (ndcActionDetails?.inputNumberValueGhgReducedGas) {
        setInputNumberValueGhgReducedGas(ndcActionDetails?.inputNumberValueGhgReducedGas);
      }
      form.setFieldsValue({
        ndcActionType: ndcActionDetails?.action,
        mitigationType: ndcActionDetails?.typeOfMitigation,
        mitigationSubType: ndcActionDetails?.subTypeOfMitigation,
        energyGeneration: ndcActionDetails?.solarProperties?.energyGeneration,
        energyGenerationUnit: ndcActionDetails?.solarProperties?.energyGenerationUnit,
        consumerGroup: ndcActionDetails?.solarProperties?.consumerGroup,
        eligibleLandArea: ndcActionDetails?.agricultureProperties?.landArea,
        landAreaUnit: ndcActionDetails?.agricultureProperties?.landAreaUnit,
        implementingAgency: ndcActionDetails?.adaptationProperties?.implementingAgency,
        nationalPlanObjectives: ndcActionDetails?.adaptationProperties?.nationalPlanObjectives,
        nationalPlanCoverage: ndcActionDetails?.adaptationProperties?.nationalPlanCoverage,
        EnablementTitle: ndcActionDetails?.enablementProperties?.title,
        EnablementType: ndcActionDetails?.enablementProperties?.type,
        EnablementReport: ndcActionDetails?.enablementReportData,
        userEstimatedCredits: ndcActionDetails?.ndcFinancing?.userEstimatedCredits,
        methodologyEstimatedCredits: 0,
      });
    } else {
      form.setFieldsValue({
        methodologyEstimatedCredits: 0,
      });
      handleNdcActionChange(NdcActionTypes.Mitigation.valueOf());
      form.setFieldsValue({
        ndcActionType: NdcActionTypes.Mitigation,
      });
    }
  }, []);

  const implementingAgencyList = [
    'Ministry of Agriculture, Water and Forestry (MAWF)',
    'Ministry of Defence (MoD)',
    'Ministry of Education, Arts and Culture (MoE)',
    'Ministry of Environment, Forestry and Tourism (MEFT)',
    'Ministry of Finance (MoF)',
    'Ministry of Fisheries and Marine Resources (MFMR)',
    'Ministry of Health and Social Services (MHSS)',
    'Ministry of Higher Education, Training and Innovation (MHETI)',
    'Ministry of Home Affairs, Immigration, Safety and Security (MHAISS)',
    'Ministry of Industrialisation and Trade (MIT)',
    'Ministry of International Relations and Cooperation (MIRCo)',
    'Ministry of Information and Communication Technology (MICT)',
    'Ministry of Justice (MoJ)',
    'Ministry of Labour, Industrial Relations and Employment Creation (MOL)',
    'Ministry of Mines and Energy (MME)',
    'Ministry of Public Enterprises (MPE)',
    'Ministry of Sport, Youth and National Service (MSYNS)',
    'Ministry of Works and Transport (MoW)',
    'Ministry of Urban and Rural Development (MURD)',
  ];

  const nationalPlanObjectives = [
    ' Enhance value addition in key growth opportunities',
    'Strengthen the private sector to create jobs',
    'Consolidate and increase the stock and quality of productive infrastructure',
    'Enhance the productivity and social wellbeing of the population',
    'Strengthen the role of the state in guiding and facilitating development',
  ];

  const nationalPlanCoverageList = [
    'Agro-Industrialization',
    'Mineral-based Industrialization',
    'Petroleum Development',
    'Tourism Development',
    'Water, Climate Change and ENR Management',
    'Private Sector Development',
    'Manufacturing',
    'Digital Transformation ',
    'Integrated Transport Infrastructure and Services',
    'Sustainable Energy Development',
    'Sustainable Urban and Housing Development',
    'Human Capital Development',
    'Community Mobilization and Mindset Change',
    'Innovation, Technology Development and Transfer',
    'Regional Development',
    'Governance and Security',
    'Public Sector Transformation',
    'Development Plan Implementation',
    'Climate Hazard ',
  ];

  const calculateMethodologyEstimatedCredits = () => {
    try {
      let creditRequest: any = {};
      const formValues = form.getFieldsValue();
      if (
        formValues.ndcActionType === NdcActionTypes.Mitigation ||
        formValues.ndcActionType === NdcActionTypes.CrossCutting
      ) {
        if (formValues.mitigationType === MitigationTypes.AGRICULTURE) {
          if (formValues.mitigationSubType === MitigationSubTypes.RICE_CROPS) {
            creditRequest = new AgricultureCreationRequest();
            creditRequest.landArea = formValues.eligibleLandArea;
            creditRequest.landAreaUnit = formValues.landAreaUnit;
            creditRequest.duration = programmeDetails.endTime - programmeDetails.startTime;
            creditRequest.durationUnit = 's';
          } else if (formValues.mitigationSubType === MitigationSubTypes.SOIL_ENRICHMENT_BIOCHAR) {
            creditRequest = new SoilEnrichmentCreationRequest();
            creditRequest.weight = formValues.tonnesOnDryBasis;
          }
        } else if (formValues.mitigationType === MitigationTypes.SOLAR) {
          if (formValues.mitigationSubType === MitigationSubTypes.SOLAR_PHOTOVOLTAICS_PV) {
            creditRequest = new SolarCreationRequest();
            creditRequest.buildingType = formValues.consumerGroup;
            creditRequest.energyGeneration = formValues.energyGeneration;
            creditRequest.energyGenerationUnit = formValues.energyGenerationUnit;
          } else if (
            formValues.mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_OFF_GRID
          ) {
            creditRequest = new SolarWaterPumpingOffGridCreationRequest();
            creditRequest.energyGeneration = formValues.energyGeneration;
            creditRequest.energyGenerationUnit = formValues.energyGenerationUnit;
          } else if (
            formValues.mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_ON_GRID
          ) {
            creditRequest = new SolarWaterPumpingOnGridCreationRequest();
            creditRequest.energyGeneration = formValues.energyGeneration;
            creditRequest.energyGenerationUnit = formValues.energyGenerationUnit;
          }
        } else if (
          formValues.mitigationType === MitigationTypes.EE_HOUSEHOLDS &&
          formValues.mitigationSubType === MitigationSubTypes.STOVES_HOUSES_IN_NAMIBIA
        ) {
          creditRequest = new StovesHousesNamibiaCreationRequest();
          creditRequest.numberOfDays = formValues.numberOfDays;
          creditRequest.numberOfPeopleInHousehold = formValues.numberOfPeople;
        }
      }
      const creditResponse = calculateCredit(creditRequest);
      if (!isNaN(creditResponse)) {
        form.setFieldsValue({
          methodologyEstimatedCredits: addCommSepRound(creditResponse),
        });
      } else {
        form.setFieldsValue({
          methodologyEstimatedCredits: 0,
        });
      }
    } catch (exception) {
      form.setFieldsValue({
        methodologyEstimatedCredits: 0,
      });
    }
  };

  const handleNdcActionChange = (selectedNdcType: any) => {
    setNdcActionType(selectedNdcType);
    calculateMethodologyEstimatedCredits();
  };

  const handleMitigationTypeChange = (selectedMitigationType: any) => {
    setmitigationType(selectedMitigationType);
    form.setFieldsValue({
      mitigationSubType: '',
      tonnesOnDryBasis: '',
      numberOfPeople: '',
      numberOfDays: '',
      landAreaUnit: '',
      eligibleLandArea: '',
      consumerGroup: '',
      energyGenerationUnit: '',
      energyGeneration: '',
      methodologyEstimatedCredits: 0,
    });
    calculateMethodologyEstimatedCredits();
  };

  const handleMitigationSubTypeChange = (selectedSubMitigationType: any) => {
    setMitigationSubType(selectedSubMitigationType);
    form.setFieldsValue({
      tonnesOnDryBasis: '',
      numberOfPeople: '',
      numberOfDays: '',
      landAreaUnit: '',
      eligibleLandArea: '',
      consumerGroup: '',
      energyGenerationUnit: '',
      energyGeneration: '',
      methodologyEstimatedCredits: 0,
    });
  };

  const handleMethodologyChange = (selectedMethodology: any) => {
    setMethodology(selectedMethodology);
  };

  const onNdcActionDetailsFormSubmit = async (ndcActionFormvalues: any) => {
    const ndcActionDetailObj: any = {};
    ndcActionDetailObj.action = ndcActionFormvalues.ndcActionType;
    if (
      ndcActionFormvalues.ndcActionType === NdcActionTypes.Mitigation ||
      ndcActionFormvalues.ndcActionType === NdcActionTypes.CrossCutting
    ) {
      ndcActionDetailObj.methodology = ndcActionFormvalues.methodology;
      ndcActionDetailObj.typeOfMitigation = ndcActionFormvalues.mitigationType;
      ndcActionDetailObj.subTypeOfMitigation = ndcActionFormvalues.mitigationSubType;
      if (
        ndcActionFormvalues.mitigationType === MitigationTypes.AGRICULTURE &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.RICE_CROPS
      ) {
        ndcActionDetailObj.agricultureProperties = {
          landArea: ndcActionFormvalues.eligibleLandArea ? ndcActionFormvalues.eligibleLandArea : 0,
          landAreaUnit: ndcActionFormvalues.landAreaUnit,
        };
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          landArea: ndcActionFormvalues.eligibleLandArea ? ndcActionFormvalues.eligibleLandArea : 0,
          landAreaUnit: ndcActionFormvalues.landAreaUnit,
        };
      } else if (
        ndcActionFormvalues.mitigationType === MitigationTypes.SOLAR &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.SOLAR_PHOTOVOLTAICS_PV
      ) {
        ndcActionDetailObj.solarProperties = {
          energyGeneration: ndcActionFormvalues.energyGeneration
            ? ndcActionFormvalues.energyGeneration
            : 0,
          energyGenerationUnit: ndcActionFormvalues.energyGenerationUnit,
          consumerGroup: ndcActionFormvalues.consumerGroup,
        };
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          energyGeneration: ndcActionFormvalues.energyGeneration
            ? ndcActionFormvalues.energyGeneration
            : 0,
          energyGenerationUnit: ndcActionFormvalues.energyGenerationUnit,
          consumerGroup: ndcActionFormvalues.consumerGroup,
        };
      } else if (
        ndcActionFormvalues.mitigationType === MitigationTypes.SOLAR &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_OFF_GRID
      ) {
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          energyGeneration: ndcActionFormvalues.energyGeneration
            ? ndcActionFormvalues.energyGeneration
            : 0,
          energyGenerationUnit: ndcActionFormvalues.energyGenerationUnit,
        };
      } else if (
        ndcActionFormvalues.mitigationType === MitigationTypes.SOLAR &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_ON_GRID
      ) {
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          energyGeneration: ndcActionFormvalues.energyGeneration
            ? ndcActionFormvalues.energyGeneration
            : 0,
          energyGenerationUnit: ndcActionFormvalues.energyGenerationUnit,
        };
      } else if (
        ndcActionFormvalues.mitigationType === MitigationTypes.EE_HOUSEHOLDS &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.STOVES_HOUSES_IN_NAMIBIA
      ) {
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          numberOfDays: ndcActionFormvalues.numberOfDays,
          numberOfPeopleInHousehold: ndcActionFormvalues.numberOfPeople,
        };
      } else if (
        ndcActionFormvalues.mitigationType === MitigationTypes.AGRICULTURE &&
        ndcActionFormvalues.mitigationSubType === MitigationSubTypes.SOIL_ENRICHMENT_BIOCHAR
      ) {
        ndcActionDetailObj.creditCalculationProperties = {
          typeOfMitigation: ndcActionFormvalues.mitigationType,
          subTypeOfMitigation: ndcActionFormvalues.mitigationSubType,
          weight: ndcActionFormvalues.tonnesOnDryBasis,
        };
      }

      if (ndcActionFormvalues.userEstimatedCredits > programmeDetails.creditEst) {
        message.open({
          type: 'error',
          content: t('userEstimatedCreditsInvalid'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        return;
      }
    }

    if (
      ndcActionFormvalues.ndcActionType === NdcActionTypes.Adaptation ||
      ndcActionFormvalues.ndcActionType === NdcActionTypes.CrossCutting
    ) {
      ndcActionDetailObj.adaptationProperties = {
        implementingAgency: ndcActionFormvalues.implementingAgency,
        nationalPlanObjectives: ndcActionFormvalues.nationalPlanObjectives,
        nationalPlanCoverage: ndcActionFormvalues.nationalPlanCoverage,
      };
      if (includedInNAP === true || includedInNAP === false) {
        ndcActionDetailObj.adaptationProperties.includedInNAP = includedInNAP;
      }
      if (inputNumberValueGhgAvoidedGas !== null || inputNumberValueGhgAvoidedGas !== undefined) {
        ndcActionDetailObj.adaptationProperties.ghgEmissionsAvoided = inputNumberValueGhgAvoidedGas;
      }
      if (inputNumberValueGhgReducedGas !== null || inputNumberValueGhgReducedGas !== undefined) {
        ndcActionDetailObj.adaptationProperties.ghgEmissionsReduced = inputNumberValueGhgReducedGas;
      }
    }

    if (ndcActionFormvalues.ndcActionType === NdcActionTypes.Enablement) {
      ndcActionDetailObj.enablementProperties = {
        title: ndcActionFormvalues.EnablementTitle,
      };

      if (ndcActionFormvalues.EnablementType && ndcActionFormvalues.EnablementType.length > 0) {
        ndcActionDetailObj.enablementProperties.type = ndcActionFormvalues.EnablementType;
      }
      if (ndcActionFormvalues.EnablementReport && ndcActionFormvalues.EnablementReport.length > 0) {
        const enablementReport = await getBase64(
          ndcActionFormvalues.EnablementReport[0]?.originFileObj as RcFile
        );
        ndcActionDetailObj.enablementProperties.report = enablementReport;
      }
      ndcActionDetailObj.enablementReportData = ndcActionFormvalues.EnablementReport;
    }

    ndcActionDetailObj.ndcFinancing = {
      userEstimatedCredits: ndcActionFormvalues.userEstimatedCredits
        ? ndcActionFormvalues.userEstimatedCredits
        : 0,
      systemEstimatedCredits: Number(ndcActionFormvalues.methodologyEstimatedCredits),
    };
    onFormSubmit(ndcActionDetailObj);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onClickIncludedInNAPScope = (value: any) => {
    if (value === includedInNAP) {
      setIncludedInNAP(undefined);
    } else {
      setIncludedInNAP(value);
    }
  };

  const onInCludedNAPChange = (event: any) => {
    if (event?.target?.value === 'inNAP') {
      setIncludedInNAP(true);
    } else if (event?.target?.value === 'notInNAP') {
      setIncludedInNAP(false);
    }
  };

  return (
    <div className="ndc-action-details-container">
      <Form
        name="ndcActionDetails"
        layout="vertical"
        requiredMark={true}
        onFinish={onNdcActionDetailsFormSubmit}
        form={form}
      >
        <Row justify="start" align="middle">
          <Col>
            <Form.Item
              label={t('ndcAction:ndcAction')}
              name="ndcActionType"
              rules={[
                {
                  required: true,
                  message: `${t('ndcAction:ndcAction')} ${t('ndcAction:isRequired')}`,
                },
              ]}
            >
              <Select
                size="large"
                onChange={handleNdcActionChange}
                style={{
                  width: '249px',
                  borderRadius: '4px',
                }}
                dropdownStyle={{ color: 'red' }}
                options={ndcActionTypeListFiltered}
                disabled
                defaultValue={NdcActionTypes.Mitigation.valueOf()}
              />
            </Form.Item>
          </Col>
        </Row>

        {ndcActionType === NdcActionTypes.CrossCutting && (
          <Row>
            <label className="label-heading">{t('ndcAction:mitigation')}</label>
          </Row>
        )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) && (
          <>
            <Row justify="start" align="middle">
              <Col>
                <Form.Item
                  label={t('ndcAction:mitigationType')}
                  name="mitigationType"
                  rules={[
                    {
                      required: true,
                      message: `${t('ndcAction:mitigationType')} ${t('ndcAction:isRequired')}`,
                    },
                  ]}
                >
                  <Select
                    size="large"
                    onChange={handleMitigationTypeChange}
                    style={{
                      width: '249px',
                      borderRadius: '4px',
                    }}
                    options={
                      programmeDetails?.sector === Sector.Health ||
                      programmeDetails?.sector === Sector.Education ||
                      programmeDetails?.sector === Sector.Hospitality
                        ? mitigationTypeList
                        : sectorMitigationTypesListMapped[sector]
                    }
                  ></Select>
                </Form.Item>
              </Col>
              {(ndcActionType === NdcActionTypes.Mitigation ||
                ndcActionType === NdcActionTypes.CrossCutting) &&
                mitigationType &&
                mitigationSubTypesListMapped[mitigationType] && (
                  <Col style={{ marginLeft: '38px' }}>
                    <Form.Item
                      label={t('ndcAction:mitigationSubType')}
                      name="mitigationSubType"
                      rules={[
                        {
                          required: true,
                          message: `${t('ndcAction:mitigationSubType')} ${t(
                            'ndcAction:isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        onChange={handleMitigationSubTypeChange}
                        style={{
                          width: '249px',
                          borderRadius: '4px',
                        }}
                        options={mitigationSubTypesListMapped[mitigationType]}
                        value={mitigationSubType}
                      ></Select>
                    </Form.Item>
                  </Col>
                )}
            </Row>
            <Row justify="start" align="middle">
              <Col span={20}>
                <Form.Item
                  label={t('ndcAction:methodology')}
                  name="methodology"
                  rules={[
                    {
                      required: true,
                      message: `${t('ndcAction:methodology')} ${t('ndcAction:isRequired')}`,
                    },
                  ]}
                >
                  <Select
                    size="large"
                    onChange={handleMethodologyChange}
                    style={{
                      borderRadius: '4px',
                    }}
                    value={methodology}
                  >
                    {methodologyOptions.map((option) => (
                      <Select.Option key={option} value={option}>
                        {option}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) &&
          mitigationType === MitigationTypes.SOLAR &&
          (mitigationSubType === MitigationSubTypes.SOLAR_PHOTOVOLTAICS_PV ||
            mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_OFF_GRID ||
            mitigationSubType === MitigationSubTypes.SOLAR_WATER_PUMPING_ON_GRID) && (
            <>
              <Row justify="start" align="middle">
                <Col>
                  <Form.Item
                    label={t('ndcAction:energyGeneration')}
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(
                              `${t('ndcAction:energyGeneration')} ${t('ndcAction:isRequired')}`
                            );
                          }
                          if (value < 0) {
                            throw new Error(`${t('ndcAction:allowOnlyNumericValueAndDecimal')}`);
                          }
                        },
                      },
                    ]}
                    name="energyGeneration"
                  >
                    <InputNumber
                      style={{ width: 442, paddingRight: 12 }}
                      onChange={(value) => {
                        const numericValue = Number(value); // Convert value to a number
                        if (!isNaN(numericValue) && numericValue >= 0) {
                          calculateMethodologyEstimatedCredits();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col style={{ marginLeft: '38px' }}>
                  <Form.Item
                    label={t('ndcAction:energyGenerationUnit')}
                    name="energyGenerationUnit"
                    rules={[
                      {
                        required: true,
                        message: `${t('ndcAction:energyGenerationUnit')} ${t(
                          'ndcAction:isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      style={{ width: 442 }}
                      options={energyGenerationUnitList}
                      onChange={calculateMethodologyEstimatedCredits}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {mitigationSubType === MitigationSubTypes.SOLAR_PHOTOVOLTAICS_PV && (
                <Form.Item
                  label={t('ndcAction:consumerGroup')}
                  name="consumerGroup"
                  rules={[
                    {
                      required: true,
                      message: `${t('ndcAction:consumerGroup')} ${t('ndcAction:isRequired')}`,
                    },
                  ]}
                >
                  <Select
                    size="large"
                    style={{ width: 442 }}
                    onChange={calculateMethodologyEstimatedCredits}
                    options={consumerGroupList}
                  />
                </Form.Item>
              )}
            </>
          )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) &&
          mitigationType === MitigationTypes.AGRICULTURE &&
          mitigationSubType === MitigationSubTypes.RICE_CROPS && (
            <Row justify="start" align="middle">
              <Col>
                <Form.Item
                  label={t('ndcAction:eligibleLandArea')}
                  name="eligibleLandArea"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule, value) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(
                            `${t('ndcAction:eligibleLandArea')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        if (value < 0) {
                          throw new Error(`${t('ndcAction:allowOnlyNumericValueAndDecimal')}`);
                        }
                      },
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: 442, paddingRight: 12 }}
                    onChange={(value) => {
                      const numericValue = Number(value); // Convert value to a number
                      if (!isNaN(numericValue) && numericValue >= 0) {
                        calculateMethodologyEstimatedCredits();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col style={{ marginLeft: '38px' }}>
                <Form.Item
                  label={t('ndcAction:landAreaUnit')}
                  name="landAreaUnit"
                  rules={[
                    {
                      required: true,
                      message: `${t('ndcAction:landAreaUnit')} ${t('ndcAction:isRequired')}`,
                    },
                  ]}
                >
                  <Select
                    onChange={calculateMethodologyEstimatedCredits}
                    size="large"
                    style={{ width: 442 }}
                    options={landAreaUnitList}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) &&
          mitigationType === MitigationTypes.AGRICULTURE &&
          mitigationSubType === MitigationSubTypes.SOIL_ENRICHMENT_BIOCHAR && (
            <Row justify="start" align="middle">
              <Col>
                <Form.Item
                  label={t('ndcAction:tonnesOnDryBasis')}
                  name="tonnesOnDryBasis"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule, value) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(
                            `${t('ndcAction:tonnesOnDryBasis')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        if (value < 1) {
                          throw new Error(`${t('ndcAction:allowOnlyNumericValueAndDecimal')}`);
                        }
                      },
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: 442, paddingRight: 12 }}
                    onChange={(value) => {
                      const numericValue = Number(value); // Convert value to a number
                      if (!isNaN(numericValue) && numericValue >= 0) {
                        calculateMethodologyEstimatedCredits();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) &&
          mitigationType === MitigationTypes.EE_HOUSEHOLDS &&
          mitigationSubType === MitigationSubTypes.STOVES_HOUSES_IN_NAMIBIA && (
            <>
              <Row justify="start" align="middle">
                <Col>
                  <Form.Item
                    label={t('ndcAction:numberOfDays')}
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(
                              `${t('ndcAction:numberOfDays')} ${t('ndcAction:isRequired')}`
                            );
                          }
                          if (value < 0) {
                            throw new Error(`${t('ndcAction:allowOnlyNumericValue')}`);
                          }
                          if (!Number.isInteger(value)) {
                            throw new Error(`${t('ndcAction:allowOnlyIntegerValue')}`);
                          }
                        },
                      },
                    ]}
                    name="numberOfDays"
                  >
                    <InputNumber
                      style={{ width: 442, paddingRight: 12 }}
                      onChange={(value) => {
                        const numericValue = Number(value); // Convert value to a number
                        if (!isNaN(numericValue) && numericValue >= 0) {
                          calculateMethodologyEstimatedCredits();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col style={{ marginLeft: '38px' }}>
                  <Form.Item
                    label={t('ndcAction:numberOfPeople')}
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(
                              `${t('ndcAction:numberOfPeople')} ${t('ndcAction:isRequired')}`
                            );
                          }
                          if (value < 0) {
                            throw new Error(`${t('ndcAction:allowOnlyNumericValue')}`);
                          }
                          if (!Number.isInteger(value)) {
                            throw new Error(`${t('ndcAction:allowOnlyIntegerValue')}`);
                          }
                        },
                      },
                    ]}
                    name="numberOfPeople"
                  >
                    <InputNumber
                      style={{ width: 442, paddingRight: 12 }}
                      onChange={(value) => {
                        const numericValue = Number(value); // Convert value to a number
                        if (!isNaN(numericValue) && numericValue >= 0) {
                          calculateMethodologyEstimatedCredits();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

        {(ndcActionType === NdcActionTypes.Mitigation ||
          ndcActionType === NdcActionTypes.CrossCutting) && (
          <Row justify="start" align="middle">
            <Col>
              <Form.Item
                name="userEstimatedCredits"
                label={t('ndcAction:userEstimatedCredits')}
                style={{ display: 'inline-block', width: 'calc(100% - 15px)' }}
              >
                <InputNumber style={{ width: 442, paddingRight: 12 }} />
              </Form.Item>
            </Col>
            <Col style={{ marginLeft: '38px' }}>
              <Form.Item
                name="methodologyEstimatedCredits"
                label={t('ndcAction:methodologyEstimatedCredits')}
                style={{ display: 'inline-block', width: '100%' }}
              >
                <InputNumber disabled style={{ width: 442, paddingRight: 12 }} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {ndcActionType === NdcActionTypes.CrossCutting && (
          <Row>
            <label className="label-heading">{t('ndcAction:adaptation')}</label>
          </Row>
        )}

        {(ndcActionType === NdcActionTypes.Adaptation ||
          ndcActionType === NdcActionTypes.CrossCutting) && (
          <>
            <Row justify="start" align="middle">
              <Col>
                <Form.Item label={t('ndcAction:implementingAgency')} name="implementingAgency">
                  <Select
                    style={{ width: 442 }}
                    size="large"
                    options={implementingAgencyList.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col style={{ marginLeft: '38px' }} className="included-nap-col">
                <Row className="in-nap-row">
                  <Col span={9}>
                    <div className="included-label">
                      <div>{t('ndcAction:inNAP')}</div>
                      <div className="info-container">
                        <Tooltip
                          arrowPointAtCenter
                          placement="topLeft"
                          trigger="hover"
                          title={t('ndcAction:inNAPToolTip')}
                          overlayClassName="custom-tooltip"
                        >
                          <InfoCircle color="#000000" size={17} />
                        </Tooltip>
                      </div>
                    </div>
                  </Col>
                  <Col span={8} className="included-val">
                    <Radio.Group size="middle" onChange={onInCludedNAPChange} value={includedInNAP}>
                      <div className="yes-no-radio-container">
                        <Radio.Button
                          className="yes-no-radio"
                          value={true}
                          onClick={() => onClickIncludedInNAPScope(true)}
                        >
                          {t('ndcAction:yes')}
                        </Radio.Button>
                      </div>
                      <div className="yes-no-radio-container">
                        <Radio.Button
                          className="yes-no-radio"
                          value={false}
                          onClick={() => onClickIncludedInNAPScope(false)}
                        >
                          {t('ndcAction:no')}
                        </Radio.Button>
                      </div>
                    </Radio.Group>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row justify="start" align="middle">
              <Col>
                <Form.Item
                  label={t('ndcAction:nationalPlanObjectives')}
                  name="nationalPlanObjectives"
                >
                  <Select
                    size="large"
                    style={{ width: 442 }}
                    options={nationalPlanObjectives.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col style={{ marginLeft: '38px' }}>
                <Form.Item label={t('ndcAction:nationalPlanCoverage')} name="nationalPlanCoverage">
                  <Select
                    style={{ width: 442 }}
                    size="large"
                    options={nationalPlanCoverageList.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="start" align="middle">
              <Col>
                <Form.Item
                  label={t('ndcAction:ghgEmiReduced')}
                  name="ghgEmissionsReduced"
                  style={{ width: 442 }}
                  rules={[
                    {
                      required: true,
                      validateTrigger: 'onBlur',
                      validator: (rule, value) => {
                        if (!value || value.length === 0) {
                          return Promise.reject(
                            `${t('ndcAction:ghgEmiReduced')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        let isMissingValue = false;
                        value?.map((item: any) => {
                          if (
                            inputNumberValueGhgReducedGas === undefined ||
                            !inputNumberValueGhgReducedGas[item]
                          ) {
                            isMissingValue = true;
                          }
                        });
                        if (isMissingValue) {
                          return Promise.reject(
                            `${t('ndcAction:value')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Checkbox.Group>
                    {ghgEmissionsGas.map((option: any, i: any) => (
                      <div key={option} className="row-custom">
                        <Checkbox
                          value={option}
                          checked={checkedOptionsGhgReduced.includes(option)}
                          onChange={(e: any) => {
                            if (e?.target?.checked) {
                              setCheckedOptionsGhgReduced([...checkedOptionsGhgReduced, option]);
                            } else if (!e?.target?.checked) {
                              const reducedGasAndVal: any = inputNumberValueGhgReducedGas;
                              if (reducedGasAndVal && reducedGasAndVal[option]) {
                                delete reducedGasAndVal[option];
                              }
                              setInputNumberValueGhgReducedGas(reducedGasAndVal);
                              setCheckedOptionsGhgReduced([
                                ...checkedOptionsGhgReduced.filter((value) => value !== option),
                              ]);
                            }
                          }}
                        >
                          {option}
                        </Checkbox>
                        <InputNumber
                          value={
                            inputNumberValueGhgReducedGas && inputNumberValueGhgReducedGas[option]
                              ? inputNumberValueGhgReducedGas[option]
                              : null
                          }
                          size="small"
                          min={0}
                          disabled={!checkedOptionsGhgReduced.includes(option)}
                          onChange={(e: any) => {
                            setInputNumberValueGhgReducedGas({
                              ...inputNumberValueGhgReducedGas,
                              [option]: e,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </Checkbox.Group>
                </Form.Item>
              </Col>
              <Col style={{ marginLeft: '38px' }}>
                <Form.Item
                  label={t('ndcAction:ghgEmiAvoided')}
                  name="ghgEmissionsAvoided"
                  style={{ width: 442 }}
                  rules={[
                    {
                      required: true,
                      validateTrigger: 'onBlur',
                      validator: (rule, value) => {
                        if (!value || value.length === 0) {
                          return Promise.reject(
                            `${t('ndcAction:ghgEmiAvoided')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        let isMissingValue = false;
                        value?.map((item: any) => {
                          if (
                            inputNumberValueGhgAvoidedGas === undefined ||
                            !inputNumberValueGhgAvoidedGas[item]
                          ) {
                            isMissingValue = true;
                          }
                        });
                        if (isMissingValue) {
                          return Promise.reject(
                            `${t('ndcAction:value')} ${t('ndcAction:isRequired')}`
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Checkbox.Group>
                    {ghgEmissionsGas.map((option, i) => (
                      <div key={option} className="row-custom">
                        <Checkbox
                          value={option}
                          checked={checkedOptionsGhgAvoided.includes(option)}
                          onChange={(e: any) => {
                            if (e?.target?.checked) {
                              setCheckedOptionsGhgAvoided([...checkedOptionsGhgAvoided, option]);
                            } else if (!e?.target?.checked) {
                              const avaoidedGasAndVal: any = inputNumberValueGhgAvoidedGas;
                              if (avaoidedGasAndVal && avaoidedGasAndVal[option]) {
                                delete avaoidedGasAndVal[option];
                              }
                              setInputNumberValueGhgAvoidedGas(avaoidedGasAndVal);
                              setCheckedOptionsGhgAvoided([
                                ...checkedOptionsGhgAvoided.filter((value) => value !== option),
                              ]);
                            }
                          }}
                        >
                          {option}
                        </Checkbox>
                        <InputNumber
                          value={
                            inputNumberValueGhgAvoidedGas && inputNumberValueGhgAvoidedGas[option]
                              ? inputNumberValueGhgAvoidedGas[option]
                              : null
                          }
                          size="small"
                          min={0}
                          disabled={!checkedOptionsGhgAvoided.includes(option)}
                          onChange={(e: any) => {
                            setInputNumberValueGhgAvoidedGas({
                              ...inputNumberValueGhgAvoidedGas,
                              [option]: e,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </Checkbox.Group>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {ndcActionType === NdcActionTypes.Enablement && (
          <>
            <Form.Item label={t('ndcAction:title')} name="EnablementTitle">
              <Input style={{ width: 442 }} />
            </Form.Item>
            <Form.Item
              label={t('ndcAction:type')}
              name="EnablementType"
              className="enablement-type-item"
            >
              <Checkbox.Group className="type-checkbox-grp">
                <Row className="grp-row">
                  {enablementTypesAndValues?.map((type: any) => (
                    <Col lg={type.col} md={type.col + 1}>
                      <Checkbox value={type.type} style={{ lineHeight: '32px' }}>
                        {type.type}
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
            <Row justify="space-between" align="middle">
              <Form.Item
                label={t('ndcAction:report')}
                name="EnablementReport"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                required={false}
                rules={[
                  {
                    validator: async (rule, file) => {
                      if (file && file.length > 0) {
                        if (!isValidateFileType(file[0]?.type)) {
                          throw new Error(`${t('ndcAction:invalidFileFormat')}`);
                        } else if (file[0]?.size > maximumImageSize) {
                          throw new Error(`${t('common:maxSizeVal')}`);
                        }
                      }
                    },
                  },
                ]}
              >
                <Upload
                  accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
                  beforeUpload={(file: any) => {
                    return false;
                  }}
                  className="design-upload-section"
                  name="design"
                  listType="picture"
                  multiple={false}
                  maxCount={1}
                >
                  <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                    Upload
                  </Button>
                </Upload>
              </Form.Item>
            </Row>
          </>
        )}

        <div className="steps-actions">
          <Row>
            {isBackBtnVisible && <Button onClick={onClickedBackBtn}>{t('ndcAction:back')}</Button>}
            <Button className="mg-left-1" type="primary" htmlType="submit">
              {t('ndcAction:next')}
            </Button>
          </Row>
        </div>
      </Form>
    </div>
  );
};

export default NdcActionDetails;
