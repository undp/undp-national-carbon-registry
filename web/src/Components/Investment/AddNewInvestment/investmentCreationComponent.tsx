/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  RadioChangeEvent,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  message,
} from 'antd';
import '../investmentComponent.scss';
import {
  ProgrammeT,
  addCommSep,
  addSpaces,
} from '../../../Definitions/Definitions/programme.definitions';
import { Instrument } from '../../../Definitions/Enums/instrument.enum';
import { Loading } from '../../Loading/loading';
import {
  InvestmentCreationType,
  InvestmentLevel,
  InvestmentOwnershipType,
  InvestmentStream,
  InvestmentType,
} from '../../../Definitions/Enums/investment.enum';
import { ESGType } from '../../../Definitions/Enums/eSGType.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import moment from 'moment';
import { GuaranteePayback, InsurancePayback } from '../../../Definitions/Enums/payback.enum';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { ProgrammeStageUnified } from '../../../Definitions/Enums/programmeStage.enum';
import { TooltipColor } from '../../../Styles/role.color.constants';
const { RangePicker } = DatePicker;

export const InvestmentCreationComponent = (props: any) => {
  const {
    t,
    useLocation,
    onNavigateToProgrammeManagementView,
    onNavigateToProgrammeView,
    onNavigateToInvestmentManagementView,
  } = props;

  const { state } = useLocation();
  const [data, setData] = useState<any>();
  const [companyNames, setCompanyNames] = useState<any>({});

  const [userOrganization, setUserOrganization] = useState<any>({});
  const [investmentNames, setInvestmentNames] = useState<any>({});
  const [projectData, setProjectData] = useState<ProgrammeT>();
  const [investmentData, setInvestmentData] = useState<any>();
  const [allProjectData, setAllProjectData] = useState<ProgrammeT[]>([]);
  const [formOne] = Form.useForm();
  const [formTwo] = Form.useForm();
  const { post } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  const [typeCreation, setTypeCreation] = useState<any>('New');
  const [investmentOwnershipType, setInvestmentOwnershipType] = useState<InvestmentOwnershipType>(
    InvestmentOwnershipType.PROJECT
  );
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(false);
  const [loadingProgData, setLoadingProgData] = useState<boolean>(false);
  const [current, setCurrent] = useState<number>(0);
  const [currentPercTotal, setCurrentPercTotal] = useState<number>(0);
  const [organisationsList, setOrganisationList] = useState<any[]>([]);
  const [nationalInvestmentList, setNationalInvestmentList] = useState<any[]>([]);
  const [instrument, setInstrument] = useState<string[]>([]);
  const [stepOneData, setStepOneData] = useState<any>();
  const [govData, setGovData] = useState<any>();
  const { userInfoState } = useUserContext();
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);

  const [prevInvestor, setPrevInvestor] = useState<any>({});

  const instrumentOptions = Object.keys(Instrument).map((k, index) => ({
    label: addSpaces(Object.values(Instrument)[index]),
    value: Object.values(Instrument)[index],
  }));

  const onInstrumentChange = (e: RadioChangeEvent) => {
    setInstrument([e.target.value]);
  };

  const onPercentageChange = (value: any) => {
    setCurrentPercTotal(formTwo.getFieldValue('percentage').reduce((a: any, b: any) => a + b, 0));
  };

  const getGovernmentDetails = async () => {
    setLoading(true);
    try {
      const response = await post('national/organisation/query', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'companyRole',
            operation: '=',
            value: CompanyRole.GOVERNMENT,
          },
        ],
      });
      if (response.data) {
        setGovData(response?.data[0]);
        return response?.data[0];
      }
    } catch (error: any) {
      console.log('Error in getting government data', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllProjectData = async () => {
    setLoadingProgData(true);
    try {
      if (data) {
        if (!data?.programmeId) {
          const response = await post('national/programme/query', {
            page: 1,
            size: 250,
            filterAnd: [
              {
                key: 'currentStage',
                operation: '!=',
                value: ProgrammeStageUnified.Rejected,
              },
            ],
          });
          if (response.data) {
            setAllProjectData(response?.data);
          }
        } else {
          setAllProjectData([data]);
        }
      }
    } catch (error: any) {
      console.log('Error in getting all programme data', error);
    } finally {
      setLoadingProgData(false);
    }
  };

  const setSelectedProgramme = async (value: any) => {
    for (const obj of allProjectData) {
      if (obj.programmeId == value) {
        setProjectData(obj);
        break;
      }
    }
  };

  const setSelectedInvestment = async (value: any) => {
    setInvestmentData(investmentNames[value]);
  };

  const getNationalInvestmentDetails = async () => {
    setLoadingInvestment(true);
    try {
      let optionalFilters: any = {};
      let filterAnd: any[] = [];
      filterAnd = [
        {
          key: 'category',
          operation: '=',
          value: InvestmentOwnershipType.NATIONAL.toString(),
        },
        {
          key: 'amount',
          operation: '>',
          value: 0,
        },
      ];

      if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
        filterAnd.push({
          key: 'toCompanyId',
          operation: '=',
          value: userInfoState?.companyId,
        });
      } else if (
        (userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
          userInfoState?.companyRole === CompanyRole.MINISTRY) &&
        data?.programmeId
      ) {
        let filterOr: any[] = [];
        data.companyId.map((id: any) =>
          filterOr.push({
            key: 'toCompanyId',
            operation: '=',
            value: id,
          })
        );
        optionalFilters.filterOr = filterOr;
      }
      const response = await post('national/programme/investmentQuery', {
        page: 1,
        size: 100,
        filterAnd: filterAnd,
        ...optionalFilters,
      });
      if (response.data) {
        setNationalInvestmentList(response?.data);
        let investmentData: any = {};
        for (const investment of response?.data) {
          investmentData[investment.requestId] = investment;
        }
        setInvestmentNames(investmentData);
      }
    } catch (error: any) {
      console.log('Error in getting national Investments list', error);
    } finally {
      setLoadingInvestment(false);
    }
  };

  const getUserOrganization = async () => {
    try {
      const response = await post('national/organisation/query', {
        page: 1,
        size: 100,
        filterAnd: [{ key: 'companyId', operation: '=', value: userInfoState?.companyId }],
      });
      setUserOrganization(response.data[0]);
      setMinistrySectoralScope(response.data[0].sectoralScope);
    } catch (error) {
      console.log('Error in getting user organization', error);
    }
  };

  const getOrganisationsDetails = async () => {
    setLoadingList(true);
    try {
      let filterAnd: any[] = [];
      let filterOr: any[] = [];
      filterAnd = [
        {
          key: 'companyRole',
          operation: '=',
          value: CompanyRole.PROGRAMME_DEVELOPER.toString(),
        },
      ];

      // if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      //   filterAnd.push({
      //     key: "companyId",
      //     operation: "!=",
      //     value: userInfoState?.companyId,
      //   });
      // }
      if (data?.companyId) {
        for (const c of data?.companyId) {
          filterOr.push({
            key: 'companyId',
            operation: '=',
            value: c,
          });
        }
      }
      let filters: any;
      if (filterOr.length) {
        filters.filterOr = filterOr;
      }

      const response = await post('national/organisation/queryNames', {
        page: 1,
        size: 100,
        filterAnd: filterAnd,
        ...filters,
      });
      if (response.data) {
        setOrganisationList(response?.data);
        let companyName: any = {};
        for (const company of response?.data) {
          companyName[Number(company.companyId)] = company.name;
        }
        setCompanyNames(companyName);
      }
    } catch (error: any) {
      console.log('Error in getting organization list', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!state) {
      onNavigateToProgrammeManagementView();
      return;
    }
    if (state?.record) {
      setData(state?.record);
    } else {
      setData({ ownership: true });
    }
  }, []);

  useEffect(() => {
    // if (data) {
    //   const keys = Object.keys(data);
    //   if (keys[0] !== "ownership") {
    //     getOrganisationsDetails();
    //   }
    // }
    getNationalInvestmentDetails();
    getOrganisationsDetails();
    getGovernmentDetails();
    getAllProjectData();
    getUserOrganization();
  }, [data]);

  if (!data && allProjectData.length == 0) {
    return <Loading />;
  }

  if (data && Object.keys(data)[0] !== 'ownership') {
    // for (const company of data!?.company) {
    //   companyName[company?.companyId] = company;
    // }
    if (!data!.proponentPercentage) {
      data.proponentPercentage = [100];
    }
  }

  const nextOne = (val: any) => {
    if (val.typeCreation == InvestmentCreationType.EXISTING) {
      val.toCompanyId = investmentData.toCompanyId;
    }
    setCurrent(current + 1);
    setStepOneData(val);
    if (data?.programmeId) setSelectedProgramme(data.programmeId);
    if (prevInvestor && prevInvestor != val.toCompanyId && !data?.programmeId) {
      formTwo.resetFields();
      setCurrentPercTotal(0);
      setProjectData(undefined);
    }
  };

  const prevOne = () => {
    setCurrent(current - 1);
    if (stepOneData.period && Number.isInteger(stepOneData.period[0])) {
      stepOneData.period[0] = moment.unix(stepOneData.period[0]);
    }
    if (stepOneData.period && Number.isInteger(stepOneData.period[1])) {
      stepOneData.period[1] = moment.unix(stepOneData.period[1]);
    }
    setPrevInvestor(stepOneData.toCompanyId);
    // formTwo.resetFields();
    // setCurrentPercTotal(0);
    // setProjectData(undefined);
  };

  const submitInvestment = async (val: any) => {
    setLoading(true);

    const payload = stepOneData;
    payload.amount = parseFloat(payload.amount);
    if (payload.interestRate) {
      payload.interestRate = parseFloat(payload.interestRate);
    }
    if (payload.paymentPerMetric) {
      payload.paymentPerMetric = parseFloat(payload.paymentPerMetric);
    }
    if (payload.period) {
      payload.period[0] = moment(payload.period[0]).startOf('day').unix();
      payload.period[1] = moment(payload.period[1]).endOf('day').unix();
    }
    if (payload.startOfPayback) {
      payload.startOfPayback = moment(payload.startOfPayback).startOf('day').unix();
    }
    payload.instrument = Array.isArray(payload.instrument)
      ? payload.instrument
      : [payload.instrument];
    // payload.fromCompanyIds = data.companyId.map((e) => Number(e));
    payload.percentage = val.percentage;
    payload.toCompanyId = Number(payload.toCompanyId);
    try {
      let response: any;
      if (investmentOwnershipType == InvestmentOwnershipType.PROJECT) {
        if (typeCreation == InvestmentCreationType.EXISTING) {
          payload.nationalInvestmentId = investmentData.requestId;
        } else {
          payload.instrument = payload.instrument;
        }
        payload.programmeId = projectData?.programmeId;
        payload.fromCompanyIds = projectData?.companyId.map((e) => Number(e));
        payload.percentage = val.percentage;
        response = await post('national/programme/addInvestment', payload);
      } else {
        payload.instrument = payload.instrument;
        response = await post('national/organisation/addInvestment', payload);
      }
      if (response?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: t('programme:investmentCreationSuccess'),
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
      data?.programmeId
        ? onNavigateToProgrammeView(data?.programmeId)
        : onNavigateToInvestmentManagementView();
    } catch (error: any) {
      console.log('Error in investment creation - ', error);
      message.open({
        type: 'error',
        content: error?.message,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const deselectOnClick = (e: any, fieldName: string) => {
    const { value } = e.target;
    if (value === formOne.getFieldValue(fieldName)) {
      formOne.setFieldValue(fieldName, null);
    }
  };

  const onChangeTypeCreation = (e: RadioChangeEvent) => {
    setTypeCreation(e.target.value);
    formOne.resetFields();
    formTwo.resetFields();
    setCurrentPercTotal(0);
    setProjectData(undefined);
  };

  const onChangeInvestmentOwnershipType = (e: RadioChangeEvent) => {
    setInvestmentOwnershipType(e.target.value);
  };

  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <div className="main">{t('programme:addInvestment')}</div>
        <div className="sub">{t('programme:addInvestmentSub')}</div>
      </div>
      <div className="adding-section">
        <div className="form-section">
          <Steps
            progressDot
            direction="vertical"
            current={current}
            items={[
              {
                title: (
                  <div className="step-title-container">
                    <div className="step-count">01</div>
                    <div className="title">{t('programme:programmeFinancingInvested')}</div>
                  </div>
                ),
                description: current === 0 && (
                  <div className="investment-sought-form-container">
                    <div className="investment-sought-form">
                      <Form
                        labelCol={{ span: 20 }}
                        wrapperCol={{ span: 24 }}
                        name="investment-sought"
                        className="investment-sought-form"
                        layout="vertical"
                        requiredMark={true}
                        form={formOne}
                        onFinish={nextOne}
                      >
                        <Row className="row" gutter={[4, 4]}>
                          <Col xl={8} md={12}>
                            <Form.Item
                              label={t('programme:typeCreation')}
                              wrapperCol={{ span: 13 }}
                              className="role-group"
                              name="typeCreation"
                              rules={[
                                {
                                  required: false,
                                },
                              ]}
                            >
                              <Radio.Group size="large" defaultValue={typeCreation}>
                                {Object.values(InvestmentCreationType).map((k, index) => (
                                  <div className="condition-radio-container">
                                    <Radio.Button
                                      className="condition-radio"
                                      value={k}
                                      onChange={onChangeTypeCreation}
                                    >
                                      {t('programme:' + k)}
                                    </Radio.Button>
                                  </div>
                                ))}
                              </Radio.Group>
                            </Form.Item>
                          </Col>
                        </Row>
                        {typeCreation == InvestmentCreationType.NEW && (
                          <div>
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={12} md={24}>
                                <div className="details-part-one">
                                  <Form.Item
                                    label={t('programme:investorName')}
                                    name="toCompanyId"
                                    wrapperCol={{ span: 24 }}
                                    className="organisation"
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('programme:investorName')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Select size="large" loading={loadingList}>
                                      {organisationsList.map((organisation) => {
                                        if (data?.programmeId) {
                                          if (
                                            data.companyId
                                              .map((id: any) => Number(id))
                                              .includes(Number(organisation.companyId))
                                          ) {
                                            return (
                                              <Select.Option
                                                key={organisation.companyId}
                                                value={organisation.companyId}
                                              >
                                                {organisation.name}
                                              </Select.Option>
                                            );
                                          }
                                        } else {
                                          return (
                                            <Select.Option
                                              key={organisation.companyId}
                                              value={organisation.companyId}
                                            >
                                              {organisation.name}
                                            </Select.Option>
                                          );
                                        }
                                      })}
                                    </Select>
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={12} md={24}>
                                <div className="details-part-two">
                                  <Form.Item
                                    label={t('programme:amountInvested')}
                                    name="amount"
                                    rules={[
                                      {
                                        required: true,
                                        message: '',
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
                                              `${t('programme:amountInvested')} ${t('isRequired')}`
                                            );
                                          } else if (!isNaN(value) && Number(value) > 0) {
                                            return Promise.resolve();
                                          } else {
                                            throw new Error(
                                              `${t('programme:amountInvested')} ${t('isInvalid')}`
                                            );
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={24} md={24}>
                                <Form.Item
                                  label={t('programme:instrument')}
                                  name="instrument"
                                  required={true}
                                  className="investment-radio-button"
                                  rules={[
                                    {
                                      required: true,
                                      message: '',
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
                                            `${t('programme:instrument')} ${t('isRequired')}`
                                          );
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <Radio.Group onChange={onInstrumentChange} value={instrument[0]}>
                                    {instrumentOptions.map((e) => {
                                      return <Radio value={e.value}>{e.label}</Radio>;
                                    })}
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                            </Row>
                            {instrument && instrument.indexOf(Instrument.LOAN) >= 0 && (
                              <Row className="row" gutter={[16, 16]}>
                                <Col xl={8} md={12}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:interestRate')}
                                      name="interestRate"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:interestRate')} ${t('isRequired')}`
                                              );
                                            } else if (!isNaN(value)) {
                                              return Promise.resolve();
                                            } else {
                                              throw new Error(
                                                `${t('programme:interestRate')} ${t('isInvalid')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </div>
                                </Col>
                              </Row>
                            )}
                            {instrument &&
                              (instrument.indexOf(Instrument.CONLOAN) >= 0 ||
                                instrument.indexOf(Instrument.NONCONLOAN) >= 0) && (
                                <div className="details-part-two">
                                  <Row className="row" gutter={[16, 16]}>
                                    <Col xl={8} md={12}>
                                      <Form.Item
                                        label={t('programme:interestRate')}
                                        name="interestRate"
                                        rules={[
                                          {
                                            required: true,
                                            message: '',
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
                                                  `${t('programme:interestRate')} ${t(
                                                    'isRequired'
                                                  )}`
                                                );
                                              } else if (!isNaN(value)) {
                                                return Promise.resolve();
                                              } else {
                                                throw new Error(
                                                  `${t('programme:interestRate')} ${t('isInvalid')}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input size="large" />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Row className="row" gutter={[16, 16]}>
                                    <Col xl={8} md={12}>
                                      <Form.Item
                                        label={t('programme:loanPeriod')}
                                        name="period"
                                        required={true}
                                        rules={[
                                          {
                                            required: true,
                                            message: '',
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
                                                  `${t('programme:loanPeriod')} ${t('isRequired')}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <RangePicker
                                          showTime
                                          allowClear={true}
                                          format="DD:MM:YYYY"
                                          size="large"
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={8} md={12}>
                                      <Form.Item
                                        label={t('programme:startOfPayback')}
                                        name="startOfPayback"
                                        rules={[
                                          {
                                            required: true,
                                            message: '',
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
                                                  `${t('programme:startOfPayback')} ${t(
                                                    'isRequired'
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <DatePicker
                                          size="large"
                                          disabledDate={(currentDate: any) =>
                                            currentDate < moment().startOf('day')
                                          }
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                </div>
                              )}
                            {instrument && instrument.indexOf(Instrument.GUARANTEE) >= 0 && (
                              <div className="details-part-two">
                                <Row className="row" gutter={[16, 16]}>
                                  <Col xl={8} md={12}>
                                    <Form.Item
                                      label={t('programme:interestRate')}
                                      name="interestRate"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:interestRate')} ${t('isRequired')}`
                                              );
                                            } else if (!isNaN(value)) {
                                              return Promise.resolve();
                                            } else {
                                              throw new Error(
                                                `${t('programme:interestRate')} ${t('isInvalid')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </Col>
                                </Row>
                                <Row className="row" gutter={[16, 16]}>
                                  <Col xl={8} md={12}>
                                    <Form.Item
                                      label={t('programme:period')}
                                      name="period"
                                      required={true}
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:period')} ${t('isRequired')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <RangePicker
                                        showTime
                                        allowClear={true}
                                        format="DD:MM:YYYY"
                                        size="large"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col xl={8} md={12}>
                                    <Form.Item
                                      label={t('programme:payback')}
                                      wrapperCol={{ span: 13 }}
                                      className="role-group"
                                      name="guaranteePayback"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:payback')} ${t('isRequired')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Radio.Group size="large">
                                        {Object.values(GuaranteePayback).map((k, index) => (
                                          <div className="condition-radio-container">
                                            <Radio.Button className="condition-radio" value={k}>
                                              {t('programme:' + k)}
                                            </Radio.Button>
                                          </div>
                                        ))}
                                      </Radio.Group>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </div>
                            )}
                            {instrument && instrument.indexOf(Instrument.RESULT_BASED) >= 0 && (
                              <Row className="row" gutter={[16, 16]}>
                                <Col xl={12} md={24}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:resultMetric')}
                                      name="resultMetric"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:resultMetric')} ${t('isRequired')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </div>
                                </Col>
                                <Col xl={12} md={24}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:paymentPerMetric')}
                                      name="paymentPerMetric"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:paymentPerMetric')} ${t(
                                                  'isRequired'
                                                )}`
                                              );
                                            } else if (!isNaN(value)) {
                                              return Promise.resolve();
                                            } else {
                                              throw new Error(
                                                `${t('programme:paymentPerMetric')} ${t(
                                                  'isInvalid'
                                                )}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </div>
                                </Col>
                              </Row>
                            )}
                            {instrument && instrument.indexOf(Instrument.INKIND) >= 0 && (
                              <Row className="row" gutter={[16, 16]}>
                                <Col xl={12} md={24}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:description')}
                                      name="description"
                                      rules={[
                                        {
                                          required: false,
                                          message: '',
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </div>
                                </Col>
                              </Row>
                            )}
                            {instrument && instrument.indexOf(Instrument.INSURANCE) >= 0 && (
                              <Row className="row" gutter={[16, 16]}>
                                <Col xl={8} md={12}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:payback')}
                                      wrapperCol={{ span: 13 }}
                                      className="role-group"
                                      name="insurancePayback"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:payback')} ${t('isRequired')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Radio.Group size="large">
                                        {Object.values(InsurancePayback).map((k, index) => (
                                          <div className="condition-radio-container">
                                            <Radio.Button className="condition-radio" value={k}>
                                              {t('programme:' + k)}
                                            </Radio.Button>
                                          </div>
                                        ))}
                                      </Radio.Group>
                                    </Form.Item>
                                  </div>
                                </Col>
                              </Row>
                            )}
                            {instrument && instrument.indexOf(Instrument.OTHER) >= 0 && (
                              <Row className="row" gutter={[16, 16]}>
                                <Col xl={12} md={24}>
                                  <div className="details-part-two">
                                    <Form.Item
                                      label={t('programme:comments')}
                                      name="comments"
                                      rules={[
                                        {
                                          required: true,
                                          message: '',
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
                                                `${t('programme:comments')} ${t('isRequired')}`
                                              );
                                            }
                                          },
                                        },
                                      ]}
                                    >
                                      <Input size="large" />
                                    </Form.Item>
                                  </div>
                                </Col>
                              </Row>
                            )}
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={8} md={12}>
                                <Form.Item
                                  label={t('programme:type')}
                                  wrapperCol={{ span: 13 }}
                                  className="role-group"
                                  name="type"
                                  rules={[
                                    {
                                      required: false,
                                    },
                                  ]}
                                >
                                  <Radio.Group size="large">
                                    {Object.values(InvestmentType).map((k, index) => (
                                      <div className="condition-radio-container">
                                        <Radio.Button
                                          className="condition-radio"
                                          value={k}
                                          onClick={(e: any) => deselectOnClick(e, 'type')}
                                        >
                                          {t('programme:' + k)}
                                        </Radio.Button>
                                      </div>
                                    ))}
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                              <Col xl={8} md={12}>
                                <Form.Item
                                  label={t('programme:level')}
                                  wrapperCol={{ span: 13 }}
                                  className="role-group"
                                  name="level"
                                  rules={[
                                    {
                                      required: false,
                                    },
                                  ]}
                                >
                                  <Radio.Group size="large">
                                    {Object.values(InvestmentLevel).map((k, index) => (
                                      <div className="condition-radio-container">
                                        <Radio.Button
                                          className="condition-radio"
                                          value={k}
                                          onClick={(e: any) => deselectOnClick(e, 'level')}
                                        >
                                          {t('programme:' + k)}
                                        </Radio.Button>
                                      </div>
                                    ))}
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                              <Col xl={8} md={12}>
                                <Form.Item
                                  label={t('programme:stream')}
                                  wrapperCol={{ span: 13 }}
                                  className="role-group"
                                  name="stream"
                                  rules={[
                                    {
                                      required: false,
                                    },
                                  ]}
                                >
                                  <Radio.Group size="large">
                                    {Object.values(InvestmentStream).map((k, index) => (
                                      <div className="condition-radio-container">
                                        <Radio.Button
                                          className="condition-radio"
                                          value={k}
                                          onClick={(e: any) => deselectOnClick(e, 'stream')}
                                        >
                                          {t('programme:' + k)}
                                        </Radio.Button>
                                      </div>
                                    ))}
                                  </Radio.Group>
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={12} md={24}>
                                <Form.Item label={t('programme:esgType')} name="esgClassification">
                                  <Select size="large">
                                    {Object.values(ESGType).map((esg: any) => (
                                      <Select.Option value={esg}>{esg}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        )}
                        {typeCreation == InvestmentCreationType.EXISTING && (
                          <div>
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={12} md={24}>
                                <div className="details-part-one">
                                  <Form.Item
                                    label={t('programme:existingInvestmentSource')}
                                    name="existinngInvestmentId"
                                    wrapperCol={{ span: 24 }}
                                    rules={[
                                      {
                                        required: true,
                                        message: `${t('programme:existingInvestmentSource')} ${t(
                                          'isRequired'
                                        )}`,
                                      },
                                    ]}
                                  >
                                    <Select
                                      size="large"
                                      loading={loadingInvestment}
                                      onChange={setSelectedInvestment}
                                    >
                                      {nationalInvestmentList.map((investment) => (
                                        <Select.Option
                                          key={investment.requestId}
                                          value={investment.requestId}
                                        >
                                          {investment.investmentName}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                            <Row className="row" gutter={[16, 16]}>
                              <Col xl={12} md={24}>
                                <div className="details-part-two">
                                  <Form.Item
                                    label={t('programme:amountInvested')}
                                    name="amount"
                                    rules={[
                                      {
                                        required: true,
                                        message: '',
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
                                              `${t('programme:amountInvested')} ${t('isRequired')}`
                                            );
                                          } else if (!isNaN(value) && Number(value) > 0) {
                                            return Promise.resolve();
                                          } else {
                                            throw new Error(
                                              `${t('programme:amountInvested')} ${t('isInvalid')}`
                                            );
                                          }
                                        },
                                      },
                                      ({ getFieldValue }) => ({
                                        validator(rule, v) {
                                          if (
                                            getFieldValue('amount') &&
                                            investmentData &&
                                            investmentData.amount <
                                              parseFloat(getFieldValue('amount'))
                                          ) {
                                            // eslint-disable-next-line prefer-promise-reject-errors
                                            return Promise.reject('Amount > Available');
                                          }
                                          return Promise.resolve();
                                        },
                                      }),
                                    ]}
                                  >
                                    <Input size="large" />
                                  </Form.Item>
                                </div>
                              </Col>
                              <Col xl={12} md={24}>
                                <div className="details-part-two">
                                  <Form.Item label=" " name="sourceAmount">
                                    <div>
                                      {'/'}
                                      <InputNumber
                                        size="large"
                                        width={'100%'}
                                        formatter={(value) => `$${addCommSep(value)}`}
                                        disabled
                                        value={investmentData ? investmentData.amount : 0}
                                      />
                                    </div>
                                  </Form.Item>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        )}
                        <Form.Item>
                          <div className="steps-actions">
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={loading}
                              onSubmit={nextOne}
                            >
                              {t('programme:next')}
                            </Button>
                          </div>
                        </Form.Item>
                      </Form>
                    </div>
                  </div>
                ),
              },
              {
                title: (
                  <div className="step-title-container">
                    <div className="step-count">02</div>
                    <div className="title">{t('programme:ownership')}</div>
                  </div>
                ),
                description: current === 1 && (
                  <div>
                    <div className="investment-sought-form-container">
                      <div className="investment-sought-form">
                        <Form
                          labelCol={{ span: 20 }}
                          wrapperCol={{ span: 24 }}
                          name="investment-sought"
                          className="investment-sought-form"
                          layout="vertical"
                          requiredMark={true}
                        >
                          <Row className="row" gutter={[4, 4]}>
                            <Col xl={8} md={12}>
                              <Form.Item
                                label={t('programme:typeCreation')}
                                wrapperCol={{ span: 13 }}
                                className="role-group"
                                name="investmentOwnershipType"
                                rules={[
                                  {
                                    required: false,
                                  },
                                ]}
                              >
                                <Radio.Group
                                  size="large"
                                  defaultValue={
                                    typeCreation == InvestmentCreationType.EXISTING
                                      ? InvestmentOwnershipType.PROJECT
                                      : investmentOwnershipType
                                  }
                                >
                                  {Object.values(InvestmentOwnershipType).map((k, index) => {
                                    if (
                                      !(
                                        typeCreation == InvestmentCreationType.EXISTING &&
                                        k == InvestmentOwnershipType.NATIONAL
                                      ) &&
                                      !(k == InvestmentOwnershipType.NATIONAL && data?.programmeId)
                                    ) {
                                      return (
                                        <div className="condition-radio-container">
                                          <Tooltip
                                            title={
                                              userInfoState?.companyRole ==
                                                CompanyRole.PROGRAMME_DEVELOPER &&
                                              stepOneData.toCompanyId != userInfoState.companyId &&
                                              k == InvestmentOwnershipType.NATIONAL
                                                ? 'This action is unauthorized due to the selected investor name.'
                                                : ''
                                            }
                                            color={TooltipColor}
                                            key={TooltipColor}
                                          >
                                            <Radio.Button
                                              className="condition-radio"
                                              value={k}
                                              onChange={onChangeInvestmentOwnershipType}
                                              disabled={
                                                userInfoState?.companyRole ==
                                                  CompanyRole.PROGRAMME_DEVELOPER &&
                                                stepOneData.toCompanyId !=
                                                  userInfoState.companyId &&
                                                k == InvestmentOwnershipType.NATIONAL
                                              }
                                            >
                                              {t('programme:' + k)}
                                            </Radio.Button>
                                          </Tooltip>
                                        </div>
                                      );
                                    }
                                  })}
                                </Radio.Group>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>
                      </div>
                    </div>

                    <div className="programme-sought-form-container ownership-container">
                      <div className="programme-sought-form">
                        <Form
                          labelCol={{ span: 20 }}
                          wrapperCol={{ span: 24 }}
                          form={formTwo}
                          name="investment-sought"
                          className="investment-sought-form"
                          layout="vertical"
                          requiredMark={true}
                          onChange={onPercentageChange}
                          onFinish={submitInvestment}
                        >
                          {allProjectData.length > 0 &&
                            investmentOwnershipType == InvestmentOwnershipType.PROJECT && (
                              <div>
                                <Row className="row" gutter={[16, 16]}>
                                  <Col xl={12} md={24}>
                                    <div className="details-part-one">
                                      <Form.Item
                                        label={t('programme:title')}
                                        name="projectId"
                                        wrapperCol={{ span: 24 }}
                                        initialValue={
                                          data?.programmeId != undefined
                                            ? allProjectData[0].programmeId
                                            : null
                                        }
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('programme:title')} ${t('isRequired')}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          size="large"
                                          loading={loadingProgData}
                                          // defaultValue={
                                          //   allProjectData.length == 1
                                          //     ? allProjectData[0].programmeId
                                          //     : null
                                          // }
                                          disabled={
                                            allProjectData.length == 1 &&
                                            data?.programmeId != undefined
                                          }
                                          onChange={setSelectedProgramme}
                                        >
                                          {allProjectData.map((project) => {
                                            if (
                                              userInfoState?.companyRole ==
                                                CompanyRole.PROGRAMME_DEVELOPER &&
                                              Number(stepOneData.toCompanyId) !=
                                                userInfoState.companyId
                                            ) {
                                              if (
                                                project.companyId
                                                  .map((id) => Number(id))
                                                  .includes(userInfoState.companyId)
                                              ) {
                                                return (
                                                  <Select.Option
                                                    key={project.programmeId}
                                                    value={project.programmeId}
                                                  >
                                                    {project.title}
                                                  </Select.Option>
                                                );
                                              }
                                            } else if (
                                              userInfoState?.companyRole === CompanyRole.MINISTRY
                                            ) {
                                              if (
                                                ministrySectoralScope.includes(
                                                  project.sectoralScope
                                                )
                                              ) {
                                                return (
                                                  <Select.Option
                                                    key={project.programmeId}
                                                    value={project.programmeId}
                                                  >
                                                    {project.title}
                                                  </Select.Option>
                                                );
                                              }
                                            } else {
                                              return (
                                                <Select.Option
                                                  key={project.programmeId}
                                                  value={project.programmeId}
                                                >
                                                  {project.title}
                                                </Select.Option>
                                              );
                                            }
                                          })}
                                        </Select>
                                      </Form.Item>
                                    </div>
                                  </Col>
                                </Row>
                                {projectData?.companyId.map((companyId, index) => {
                                  if (
                                    formTwo.getFieldValue('percentage') &&
                                    formTwo.getFieldValue('percentage')[index] &&
                                    companyId == stepOneData.toCompanyId
                                  ) {
                                    formTwo.getFieldValue('percentage')[index] = 0;
                                  }
                                  return (
                                    <Row className="row" gutter={[16, 16]}>
                                      <Col xl={8} md={15}>
                                        <div className="label">
                                          {govData.companyId == companyId
                                            ? govData.name
                                            : companyNames[Number(companyId)]}
                                          <span className="required-mark">*</span>
                                        </div>
                                      </Col>
                                      <Col xl={8} md={9}>
                                        <Form.Item
                                          className="inline"
                                          name={['percentage', index]}
                                          initialValue={0}
                                          rules={[
                                            {
                                              pattern: new RegExp(/^[+]?([.]\d+|\d+[.]?\d*)$/g),
                                              message: 'Percentage Should be a positive number',
                                            },
                                            {
                                              required: true,
                                              message: 'Required field',
                                            },
                                            ({ getFieldValue }) => ({
                                              validator(rule, v) {
                                                if (
                                                  getFieldValue(['percentage', index]) &&
                                                  parseFloat(getFieldValue(['percentage', index])) >
                                                    projectData!.proponentPercentage[index]
                                                ) {
                                                  // eslint-disable-next-line prefer-promise-reject-errors
                                                  return Promise.reject('Amount > Available');
                                                }
                                                return Promise.resolve();
                                              },
                                            }),
                                          ]}
                                        >
                                          <InputNumber
                                            placeholder=""
                                            controls={false}
                                            disabled={
                                              govData.companyId == companyId ||
                                              companyId == stepOneData.toCompanyId
                                            }
                                            value={0}
                                            // disabled={userInfoState?.companyId === Number(companyId)}
                                            onKeyPress={(event) => {
                                              if (!/[0-9\.]/.test(event.key)) {
                                                event.preventDefault();
                                              }
                                            }}
                                          />
                                        </Form.Item>
                                        <div className="inline separator">{'/'}</div>

                                        <Form.Item className="inline">
                                          <InputNumber
                                            placeholder={String(
                                              projectData?.proponentPercentage[index]
                                            )}
                                            disabled
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  );
                                })}
                                <Row className="row" gutter={[16, 16]}>
                                  <Col xl={8} md={15}>
                                    <div className="label">{t('programme:total')}</div>
                                  </Col>
                                  <Col xl={8} md={9}>
                                    <Form.Item className="inline" name={['total']}>
                                      <InputNumber
                                        placeholder={currentPercTotal + ''}
                                        controls={false}
                                        disabled={true}
                                        onKeyPress={(event) => {
                                          if (!/[0-9\.]/.test(event.key)) {
                                            event.preventDefault();
                                          }
                                        }}
                                      />
                                    </Form.Item>
                                    <div className="inline separator">{'/'}</div>

                                    <Form.Item className="inline">
                                      <InputNumber disabled={true} placeholder={'100'} />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </div>
                            )}
                          <Form.Item>
                            <div className="steps-actions">
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                onSubmit={submitInvestment}
                              >
                                {t('programme:submit')}
                              </Button>
                              <Button
                                className="back-btn"
                                onClick={() => prevOne()}
                                loading={loading}
                              >
                                {t('programme:back')}
                              </Button>
                            </div>
                          </Form.Item>
                        </Form>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
