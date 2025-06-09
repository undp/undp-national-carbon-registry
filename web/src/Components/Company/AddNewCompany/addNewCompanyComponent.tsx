import React, { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  Upload,
  message,
} from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';
import {
  AuditOutlined,
  BankOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './addNewCompanyComponent.scss';
import '../../../Styles/app.scss';
import { RcFile, UploadFile } from 'antd/lib/upload';
import { UserProps } from '../../../Definitions/Definitions/userInformationContext.definitions';
import validator from 'validator';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { getBase64 } from '../../../Definitions/Definitions/programme.definitions';
import { CarbonSystemType } from '../../../Definitions/Enums/carbonSystemType.enum';
import { GovDepartment } from '../../../Definitions/Enums/govDep.enum';
import { Ministry } from '../../../Definitions/Enums/ministry.enum';
import { SectoralScope } from '../../../Definitions/Enums/sectoralScope.enum';

const ministries: any = [
  'Agriculture',
  'Aviation',
  'Communications',
  'Economy',
  'Education',
  'Energy',
  'Environment',
  'Health',
  'Intelligence',
  'Judiciary',
  'Maritime',
  'Media',
  'Science And Technology',
  'Water Resources',
  'Other',
];

const ministryOrgs: any = {
  Agriculture: [
    'Cocoa Research Institute',
    'National Agricultural Extension, Research and Liaison Services',
    'National Veterinary Research Institute',
    'Agricultural Insurance Corporation',
    'National Root Crops Research Institute',
    'Agricultural Research Council',
    'Institute for Oceanography and Marine Research',
    'Institute for Oil Palm Research',
    'Agricultural Quarantine Service',
    'National Horticultural Research Institute',
  ],
  Aviation: [
    'Federal Airports Authority',
    'Airspace Management Agency',
    'Civil Aviation Authority',
    'Safety Investigation Bureau',
    'Meteorological Agency',
    'College of Aviation Technology',
  ],
  Communications: [
    'National Information Technology Development Agency',
    'Satellite Limited',
    'Broadcasting Commission',
    'Commission',
    'Postal Service',
    'National Frequency Management Council',
    'Television Authority',
    'Galaxy Backbone',
  ],
  Economy: [
    'Asset Management Corporation',
    'Social Security Administration',
    'Budget Office of the Federation',
    'Bureau of Public Enterprises',
    'Bureau of Public Procurement',
    'Central Bank',
    'Corporate Affairs Commission',
    'Debt Management Office',
    'Inland Revenue Service',
    'Mortgage Bank',
    'Fiscal Responsibility Commission',
    'Infrastructure Concession Regulatory Commission',
    'National Bureau of Statistics',
    'National Council on Privatisation',
    'National Insurance Commission',
    'National Pension Commission',
    'National Planning Commission',
    'National Sugar Development Council',
    'Niger Delta Development Commission',
    'Customs Service',
    'Deposit Insurance Corporation',
    'Investment Promotion Commission',
    'Export - Import Bank',
    'Export Promotion Council',
    'Oil and Gas Free Zones Authority',
    'Export Processing Zones Authority',
    'Revenue Mobilisation Allocation and Fiscal Commission',
    'Securities and Exchange Commission',
    'Standards Organisation',
    'Small and Medium Enterprise Development Agency',
  ],
  Education: [
    'National Board for Arabic And Islamic Studies',
    'Joint Admissions and Matriculation Board',
    'National Examination Council',
    'National Open University',
    'National Teachers Institute',
    'National Universities Commission',
    'Tertiary Education Trust Fund',
    'Teachers Registration Council',
    'National Business and Technical Examinations Board',
    'Universal Basic Education Commission',
    'West African Examination Council',
    'National Commission for Colleges of Education',
    'National Library',
  ],
  Energy: [
    'Midstream and Downstream Petroleum Regulatory Authority',
    'Upstream Petroleum Regulatory Commission',
    'Electricity Management Services Limited',
    'Energy Commission',
    'National Power Training Institute',
    'Electricity Regulatory Commission',
    'Content Monitoring and Development Board',
    'National Petroleum Corporation',
    'Nuclear Regulatory Authority',
    'Petroleum Product Pricing Regulatory Agency',
    'Power Holding Company (defunct)',
    'Rural Electrification Agency',
    'Transmission Company',
  ],
  Environment: [
    'Environmental Protection Agency (defunct)',
    'Forestry Research Institute',
    'National Biosafety Management Agency',
    'National Environmental Standards and Regulations Enforcement Agency',
    'National Oil Spill Detection and Response Agency',
    'Environmental Health Officers Registration Council',
  ],
  Health: [
    'National Health Insurance Scheme',
    'Institute for Pharmaceutical Research and Development',
    'Agency for the Control of AIDS',
    'Agency for Food and Drug Administration and Control',
    'Primary Health Care Development Agency',
    'Institute of Medical Research',
    'Centre for Disease Control',
    'Drug Law Enforcement Agency',
  ],
  Intelligence: [
    'Defence Intelligence Agency',
    'State Security Service',
    'National Intelligence Agency',
    'Financial Intelligence Unit',
  ],
  Judiciary: [
    'National Judicial Council',
    'Federal Judicial Service Commission',
    'National Judicial Institute',
  ],
  Maritime: ['Maritime Administration and Safety Agency', 'Ports Authority', "Shippers' Council"],
  Media: ['Broadcasting Organisation', 'News Agency', 'Press Council', 'Television Authority'],
  ScienceAndTechnology: [
    'Agency For Science and Engineering Infrastructure',
    'Biotechnology Development Agency',
    'Centre for Remote Sensing',
    'Science and Technology Complex',
    'Office for Technology Acquisition and Promotion',
    'Space Research and Development Agency',
    'Nuclear Regulatory Authority',
    'Raw Materials Research and Development Council',
    'Communications Satellite Ltd',
    'Centre for Technology Management',
  ],
  WaterResources: [
    'Hydrological Services Agency',
    'Integrated Water Resources Commission',
    'Water Resources Institute',
    'River Basin Development Authorities',
  ],
  Other: [
    'Centre for Black and African Arts and Civilization',
    'Automotive Design and Development Council',
    'Code of Conduct Bureau',
    'Computer Professionals Registration Council',
    'Consumer Protection Council',
    'Economic and Financial Crimes Commission',
    'Federal Character Commission',
    'Federal Housing Authority',
    'Corrupt Practices and Other Related Offences Commission',
    'Independent National Electoral Commission',
    'Industrial Training Fund',
    'Legal Aid Council',
    'Agency for the Prohibition of Trafficking in Persons',
    'National Boundary Commission',
    'National Council of Arts and Culture',
    'Economic Reconstruction Fund',
    'Emergency Management Agency',
    'Hajj Commission',
    'Human Rights Commission',
    'Identity Management Commission',
    'Institute for Hospitality Tourism',
    'Lottery Regulatory Commission',
    'Orientation Agency',
    'Population Commission',
    'Poverty Eradication Programme (defunct)',
    'Salaries, Incomes and Wages Commission',
    'Sports Commission',
    'Extractive Industries Transparency Initiative',
    'Immigration Service',
    'Building and Road Research Institute',
    'Institute of Building',
    'Christian Pilgrim Commission',
    'Copyright Commission',
    'Tourism Development Corporation',
    'Public Complaints Commission',
    'Surveyors Council',
    'National Lottery Trust Fund',
  ],
};

export const AddNewCompanyComponent = (props: any) => {
  const {
    t,
    onNavigateToCompanyManagement,
    maximumImageSize,
    useLocation,
    regionField,
    isGuest,
    onNavigateToHome,
    systemType,
  } = props;
  const [formOne] = Form.useForm();
  const [formTwo] = Form.useForm();
  const [stepOneData, setStepOneData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [contactNoInput] = useState<any>();
  const [current, setCurrent] = useState<number>(0);
  const [isUpdate, setIsUpdate] = useState(false);
  const { put, get, post } = useConnection();
  const { setUserInfo, userInfoState } = useUserContext();
  const { state } = useLocation();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [countries, setCountries] = useState<[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [companyRole, setCompanyRole] = useState<any>(state?.record?.companyRole);
  const [selectedMinistry, setSelectedMinistry] = useState<string>('');
  const [existgovDep, setexistGovdep] = useState<string[]>([]);
  const [ministryDropdown, setMinistryDropdown] = useState<string[]>(ministries);
  const [intialGovDep, selectInitialGovDep] = useState<any>(
    state?.record?.govDep ? state?.record?.govDep : ''
  );
  const [initialMinistry, selectInitialministry] = useState<any>(
    state?.record?.ministry ? state?.record?.ministry : ''
  );

  let selectedGovDepatments = ministryOrgs[selectedMinistry];
  if (existgovDep && existgovDep.length > 0) {
    selectedGovDepatments = selectedGovDepatments.filter((x: string) => !existgovDep.includes(x));
  }
  const onChangeMinistry = async (val: any) => {
    const key = Object.keys(Ministry)[Object.values(Ministry).indexOf(val as Ministry)];
    setSelectedMinistry(String(key));
    if (isUpdate && val === initialMinistry) {
      formOne.setFieldValue(
        'govDep',
        Object.keys(GovDepartment)[
          Object.values(GovDepartment).indexOf(intialGovDep as GovDepartment)
        ]
      );
    } else {
      formOne.setFieldValue('govDep', '');
    }
    // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
    getGovDep(val);
  };

  const getMinistryList = async () => {
    setLoadingList(true);
    try {
      let leftmins: string[] = [];
      const excludingmin: string[] = [];
      for (const min of ministries) {
        const response: any = await post('national/organisation/query', {
          page: 1,
          size: 100,
          filterAnd: [
            {
              key: 'ministry',
              operation: '=',
              value: min,
            },
          ],
        });
        const minkey = Object.keys(Ministry)[Object.values(Ministry).indexOf(min as Ministry)];
        if (response.data.length === ministryOrgs[minkey].length) {
          if (!isUpdate && min !== initialMinistry) {
            excludingmin.push(min);
          }
        }
      }
      leftmins = ministries.filter((x: string) => !excludingmin.includes(x));
      setMinistryDropdown(leftmins);
    } catch (error: any) {
      console.log('Error in getting min list', error);
    } finally {
      setLoadingList(false);
    }
  };

  const getCountryList = async () => {
    const response = await get('national/organisation/countries');
    if (response.data) {
      const alpha2Names = response.data.map((item: any) => {
        return item.alpha2;
      });
      setCountries(alpha2Names);
    }
  };

  const getRegionList = async () => {
    setLoadingList(true);
    try {
      const response = await post('national/organisation/regions', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'lang',
            operation: '=',
            value: 'en',
          },
        ],
      });
      if (response.data) {
        const regionNames = response.data.map((item: any) => item.regionName);
        const uniqueRegionNames: any = Array.from(new Set(regionNames));
        setRegionsList([t('national'), ...uniqueRegionNames]);
      }
    } catch (error: any) {
      console.log('Error in getting regions list', error);
    } finally {
      setLoadingList(false);
    }
  };

  const getGovDep = async (val: any) => {
    setLoadingList(true);
    try {
      const response: any = await post('national/organisation/query', {
        page: 1,
        size: 200,
        filterAnd: [
          {
            key: 'ministry',
            operation: '=',
            value: val,
          },
        ],
      });
      if (response && response.data) {
        const existDep: string[] = [];
        for (const i in response.data) {
          if (response.data[i].govDep && response.data[i].govDep.length > 0) {
            const departName =
              Object.keys(GovDepartment)[
                Object.values(GovDepartment).indexOf(response.data[i].govDep as GovDepartment)
              ];
            if (response.data[i].govDep !== intialGovDep) {
              existDep.push(departName);
            } else {
              continue;
            }
          }
        }
        setexistGovdep(existDep);
      }
    } catch (error: any) {
      console.log('Error in getting exist Government Department list', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    setIsUpdate(state?.record ? true : false);
    getCountryList();
    getRegionList();
    getMinistryList();
    if (state?.record?.logo) {
      setFileList([
        {
          uid: '1',
          name: `${state?.record?.name}.png`,
          status: 'done',
          url: state?.record?.logo,
          type: 'image/png',
        },
      ]);
    }
    if (state?.record?.ministry) {
      const key =
        Object.keys(Ministry)[Object.values(Ministry).indexOf(state?.record?.ministry as Ministry)];
      setSelectedMinistry(key);
      getGovDep(state?.record?.ministry);
    }
  }, []);

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const nextOne = (val: any) => {
    setCurrent(current + 1);
    setStepOneData(val);
  };

  const prevOne = () => {
    setCurrent(current - 1);
  };

  const onFinishStepOne = (values: any) => {
    nextOne(values);
  };

  const onChangeRegion = (values: any[]) => {
    if (values.includes(t('national'))) {
      const buyerCountryValues = regionsList;
      const newBuyerValues = buyerCountryValues?.filter((item: any) => item !== t('national'));
      formOne.setFieldValue('regions', [...newBuyerValues]);
    }
  };

  const onFinishStepTwo = async (values: any) => {
    const requestData = {
      ...values,
      role: 'Admin',
      company: { ...stepOneData },
    };
    setLoading(true);
    try {
      if (requestData.phoneNo && requestData.phoneNo.length > 4) {
        requestData.phoneNo = formatPhoneNumberIntl(requestData.phoneNo);
      } else {
        requestData.phoneNo = undefined;
      }
      requestData.company.phoneNo = formatPhoneNumberIntl(requestData.company.phoneNo);
      if (requestData.company.website) {
        requestData.company.website = 'https://' + requestData.company.website;
      } else {
        requestData.company.website = undefined;
      }
      const logoBase64 = await getBase64(requestData?.company?.logo[0]?.originFileObj as RcFile);
      const logoUrls = logoBase64.split(',');
      requestData.company.logo = logoUrls[1];
      if (companyRole === CompanyRole.MINISTRY) {
        requestData.company.name = 'Ministry of ' + requestData.company.ministry;
      }
      if (isGuest) {
        const response = await post('national/user/register', requestData);
        if (response.status === 200 || response.status === 201) {
          message.open({
            type: 'success',
            content: t('companyRegisteredSuccess'),
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
          onNavigateToHome();
          setLoading(false);
        }
      } else {
        const response = await post('national/user/add', requestData);
        if (response.status === 200 || response.status === 201) {
          if (isUpdate) {
            setUserInfo({
              companyLogo: response.data.logo,
            } as UserProps);
          }
          message.open({
            type: 'success',
            content: t('companyAddedSuccess'),
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
          onNavigateToCompanyManagement();
          setLoading(false);
        }
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateCompany = async () => {
    setLoading(true);
    const formOneValues = formOne.getFieldsValue();
    formOneValues.phoneNo = formatPhoneNumberIntl(formOneValues.phoneNo);

    try {
      let values: any = {};
      if (regionField) {
        values = {
          companyId: state?.record?.companyId,
          name: formOneValues.name,
          email: formOneValues.email,
          phoneNo: formOneValues.phoneNo,
          address: formOneValues.address,
          regions: formOneValues.regions,
          companyRole: state?.record?.companyRole,
        };
      } else {
        values = {
          companyId: state?.record?.companyId,
          name: formOneValues.name,
          email: formOneValues.email,
          phoneNo: formOneValues.phoneNo,
          address: formOneValues.address,
          companyRole: state?.record?.companyRole,
        };
      }

      if (
        state?.record?.companyRole !== CompanyRole.GOVERNMENT &&
        state?.record?.companyRole !== CompanyRole.MINISTRY
      ) {
        values.taxId = formOneValues.taxId;
        values.paymentId = formOneValues.paymentId;
      }

      if (
        state?.record?.companyRole === CompanyRole.MINISTRY ||
        state?.record?.companyRole === CompanyRole.GOVERNMENT
      ) {
        if (formOneValues.govDep in GovDepartment) {
          const key = formOneValues.govDep as keyof typeof GovDepartment;
          values.govDep = GovDepartment[key];
        } else {
          values.govDep = formOneValues.govDep;
        }
        values.ministry = formOneValues.ministry;
      }
      if (state?.record?.companyRole === CompanyRole.MINISTRY) {
        values.sectoralScope = formOneValues.sectoralScope;
        values.nameOfMinister = formOneValues.nameOfMinister;
        values.name = 'Ministry of ' + formOneValues.ministry;
      }
      if (state?.record?.companyRole === CompanyRole.GOVERNMENT) {
        values.omgePercentage = Math.round(Number(formOneValues.omgePercentage));
      }
      if (state?.record?.companyRole === CompanyRole.GOVERNMENT) {
        values.nationalSopValue = Math.floor(Number(formOneValues.nationalSopValue));
      }

      if (formOneValues.website) {
        values.website = 'https://' + formOneValues.website;
      } else {
        values.website = undefined;
      }

      if (formOneValues.logo) {
        if (formOneValues.logo.length !== 0) {
          const logoBase64 = await getBase64(formOneValues.logo[0]?.originFileObj as RcFile);
          const logoUrls = logoBase64.split(',');
          values.logo = logoUrls[1];
        }
      }

      const response = await put('national/organisation/update', values);
      if (response.status === 200 || response.status === 201) {
        setUserInfo({
          companyLogo: response.data.logo,
        } as UserProps);
        message.open({
          type: 'success',
          content: t('companyUpdatedSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        onNavigateToCompanyManagement();
      }
      setLoading(false);
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${t('errorInUpdatingCompany')} ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const onCancel = () => {
    onNavigateToCompanyManagement();
  };

  const onChangeCompanyRole = (event: any) => {
    const value = event.target.value;
    setCompanyRole(value);
  };

  const CompanyDetailsForm = () => {
    const companyRoleClassName =
      companyRole === CompanyRole.CERTIFIER
        ? 'certifier'
        : companyRole === CompanyRole.PROGRAMME_DEVELOPER
        ? 'dev'
        : companyRole === CompanyRole.MINISTRY
        ? 'minister'
        : 'gov';
    return (
      <div className="company-details-form-container">
        <div className="company-details-form">
          <Form
            name="company-details"
            className="company-details-form"
            layout="vertical"
            requiredMark={true}
            form={formOne}
            onFinish={isUpdate ? onUpdateCompany : onFinishStepOne}
          >
            <Row className="row" gutter={[16, 16]}>
              <Col xl={12} md={24}>
                <div className="details-part-one">
                  {companyRole !== CompanyRole.MINISTRY && (
                    <Form.Item
                      label={t('addCompany:name')}
                      name="name"
                      initialValue={state?.record?.name}
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
                              throw new Error(`${t('addCompany:name')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  )}
                  {companyRole !== CompanyRole.MINISTRY
                    ? (!isUpdate || (isUpdate && companyRole !== CompanyRole.GOVERNMENT)) && (
                        <Form.Item
                          label={t('addCompany:taxId')}
                          initialValue={state?.record?.taxId}
                          name="taxId"
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
                                  throw new Error(`${t('addCompany:taxId')} ${t('isRequired')}`);
                                }
                              },
                            },
                          ]}
                        >
                          <Input disabled={isUpdate} size="large" />
                        </Form.Item>
                      )
                    : null}
                  {companyRole !== CompanyRole.MINISTRY
                    ? (!isUpdate || (isUpdate && companyRole !== CompanyRole.GOVERNMENT)) && (
                        <Form.Item
                          label={t('addCompany:paymentId')}
                          initialValue={state?.record?.paymentId}
                          name="paymentId"
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
                                    `${t('addCompany:paymentId')} ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      )
                    : null}
                  {companyRole !== CompanyRole.GOVERNMENT && (
                    <Form.Item
                      label={t('addCompany:email')}
                      name="email"
                      initialValue={state?.record?.email}
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
                              throw new Error(`${t('addCompany:email')} ${t('isRequired')}`);
                            } else {
                              const val = value.trim();
                              const reg =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                              const matches = val.match(reg) ? val.match(reg) : [];
                              if (matches.length === 0) {
                                throw new Error(`${t('addCompany:email')} ${t('isInvalid')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  )}
                  {(companyRole === CompanyRole.MINISTRY ||
                    companyRole === CompanyRole.GOVERNMENT) && (
                    <div className="space-container" style={{ width: '100%' }}>
                      <Form.Item
                        label={t('addCompany:ministry')}
                        name="ministry"
                        initialValue={state?.record?.ministry}
                        rules={[
                          {
                            required: true,
                            message: `${t('addCompany:ministry')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        {companyRole !== CompanyRole.GOVERNMENT &&
                        ministryDropdown &&
                        ministryDropdown.length > 0 ? (
                          <Select size="large" onChange={onChangeMinistry}>
                            {ministryDropdown.map((ministry: any) => (
                              <Select.Option value={ministry}>{ministry}</Select.Option>
                            ))}
                          </Select>
                        ) : (
                          <Select size="large" disabled={true}></Select>
                        )}
                      </Form.Item>
                      {companyRole === CompanyRole.GOVERNMENT && (
                        <Form.Item
                          label={t('addCompany:email')}
                          name="email"
                          initialValue={state?.record?.email}
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
                                  throw new Error(`${t('addCompany:email')} ${t('isRequired')}`);
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(`${t('addCompany:email')} ${t('isInvalid')}`);
                                  }
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      )}
                      {companyRole === CompanyRole.MINISTRY && (
                        <Form.Item
                          label={t('addCompany:ministerName')}
                          name="nameOfMinister"
                          initialValue={state?.record?.nameOfMinister}
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
                                    `${t('addCompany:ministerName')} ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>
                      )}
                    </div>
                  )}
                  <Form.Item
                    className="website"
                    label={t('addCompany:website')}
                    initialValue={state?.record?.website?.split('://')[1]}
                    name="website"
                    rules={[
                      {
                        required: false,
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() !== '' ||
                            String(value).trim() !== undefined ||
                            value !== null ||
                            value !== undefined
                          ) {
                            if (value && !validator.isURL('https://' + value))
                              throw new Error(`${t('addCompany:website')} ${t('isInvalid')}`);
                          }
                        },
                      },
                    ]}
                    getValueFromEvent={(event: any) => event?.target?.value.trim()}
                  >
                    <Input addonBefore="https://" size="large" />
                  </Form.Item>
                  {companyRole === CompanyRole.MINISTRY && (
                    <Form.Item
                      name="address"
                      label={t('addCompany:addresss')}
                      initialValue={state?.record?.address}
                      rules={[
                        { required: true, message: '' },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('addCompany:addresss')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input.TextArea rows={3} maxLength={100} />
                    </Form.Item>
                  )}
                  <Form.Item
                    name="logo"
                    label={t('addCompany:companyLogoWithType')}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    required={true}
                    rules={[
                      {
                        validator: async (rule, file) => {
                          if (file === null || file === undefined) {
                            if (!state?.record?.logo)
                              throw new Error(`${t('addCompany:companyLogo')} ${t('isRequired')}`);
                          } else {
                            if (file.length === 0) {
                              throw new Error(`${t('addCompany:companyLogo')} ${t('isRequired')}`);
                            } else {
                              let isCorrectFormat = false;
                              if (file[0]?.type === 'image/png') {
                                isCorrectFormat = true;
                              } else if (file[0]?.type === 'image/jpeg') {
                                isCorrectFormat = true;
                              } else if (file[0]?.type === 'image/svg') {
                                isCorrectFormat = true;
                              }
                              if (!isCorrectFormat) {
                                throw new Error(`${t('unsupportedFormat')}`);
                              } else if (file[0]?.size > maximumImageSize) {
                                // default size format of files would be in bytes -> 1MB = 1000000bytes
                                throw new Error(`${t('maxUploadSize')}`);
                              }
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      beforeUpload={(file) => {
                        return false;
                      }}
                      className="logo-upload-section"
                      name="logo"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      defaultFileList={fileList}
                      maxCount={1}
                    >
                      <Button size="large" icon={<UploadOutlined />}>
                        {t('addCompany:upload')}
                      </Button>
                    </Upload>
                  </Form.Item>
                  {companyRole === CompanyRole.GOVERNMENT && (
                    <div className="space-container" style={{ width: '100%' }}>
                      <Space
                        wrap={true}
                        style={{
                          display: 'flex',
                          marginBottom: 8,
                        }}
                        align="center"
                        size={'large'}
                      >
                        <Form.Item
                          style={{ width: '100%' }}
                          name="nationalSopValue"
                          label={t('addCompany:nationalSopValue')}
                          initialValue={state?.record?.nationalSopValue}
                          rules={[
                            { required: true, message: '' },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t('addCompany:nationalSopValue')} s${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            size="large"
                            min={0}
                            max={99}
                            formatter={(value) => `${value}%`}
                            parser={(value: any) => value.replace('%', '')}
                            // eslint-disable-next-line eqeqeq
                            disabled={systemType == CarbonSystemType.REGISTRY}
                          />
                        </Form.Item>
                      </Space>
                    </div>
                  )}
                </div>
              </Col>
              <Col xl={12} md={24}>
                <div className="details-part-two">
                  <Form.Item
                    className="role-group"
                    label={t('addCompany:role')}
                    name="companyRole"
                    initialValue={companyRole}
                    rules={[
                      {
                        required: true,
                        message: `${t('addCompany:role')} ${t('isRequired')}`,
                      },
                    ]}
                  >
                    <Radio.Group
                      size="large"
                      disabled={isUpdate}
                      onChange={onChangeCompanyRole}
                      style={isGuest && { justifyContent: 'start' }}
                    >
                      {isUpdate ? (
                        <div className={`${companyRoleClassName}-radio-container`}>
                          <Radio.Button className={companyRoleClassName} value={companyRole}>
                            {companyRole === CompanyRole.CERTIFIER ? (
                              <SafetyOutlined className="role-icons" />
                            ) : companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                              <ExperimentOutlined className="role-icons" />
                            ) : companyRole === CompanyRole.MINISTRY ? (
                              <AuditOutlined className="role-icons" />
                            ) : (
                              <BankOutlined className="role-icons" />
                            )}
                            {companyRole === CompanyRole.PROGRAMME_DEVELOPER
                              ? 'Developer'
                              : companyRole}
                          </Radio.Button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="certifier-radio-container"
                            style={
                              userInfoState?.companyRole === CompanyRole.MINISTRY
                                ? {
                                    width: '45%',
                                  }
                                : {}
                            }
                          >
                            <Tooltip placement="top" title={t('addCompany:viewerToolTip')}>
                              <Radio.Button className="certifier" value="Certifier">
                                <SafetyOutlined className="role-icons" />
                                {t('addCompany:certifier')}
                              </Radio.Button>
                            </Tooltip>
                          </div>
                          <div
                            className="dev-radio-container"
                            style={
                              userInfoState?.companyRole === CompanyRole.MINISTRY
                                ? {
                                    width: '45%',
                                    marginLeft: isGuest ? '30px' : 0,
                                  }
                                : { marginLeft: isGuest ? '30px' : 0 }
                            }
                          >
                            <Tooltip
                              placement="top"
                              title={t('addCompany:programmeDeveleperToolTip')}
                            >
                              <Radio.Button className="dev" value="ProgrammeDeveloper">
                                <ExperimentOutlined className="role-icons" />
                                {t('addCompany:programmeDeveleper')}
                              </Radio.Button>
                            </Tooltip>
                          </div>
                          {userInfoState?.companyRole !== CompanyRole.MINISTRY && !isGuest && (
                            <div className="minister-radio-container">
                              {ministryDropdown.length > 0 ? (
                                <Tooltip placement="top" title={t('addCompany:ministryToolTip')}>
                                  <Radio.Button className="minister" value="Ministry">
                                    <AuditOutlined className="role-icons" />
                                    {t('addCompany:min')}
                                  </Radio.Button>
                                </Tooltip>
                              ) : (
                                <Tooltip placement="top" title={t('addCompany:allmincreated')}>
                                  <Radio.Button className="minister" value="Ministry" disabled>
                                    <AuditOutlined className="role-icons" />
                                    {t('addCompany:min')}
                                  </Radio.Button>
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </Radio.Group>
                  </Form.Item>
                  {(companyRole === CompanyRole.MINISTRY ||
                    companyRole === CompanyRole.GOVERNMENT) && (
                    <Form.Item
                      label={t('addCompany:govdep')}
                      name="govDep"
                      initialValue={
                        Object.keys(GovDepartment)[
                          Object.values(GovDepartment).indexOf(intialGovDep as GovDepartment)
                        ]
                      }
                      rules={[
                        {
                          required: true,
                          message: `${t('addCompany:govdep')} ${t('isRequired')}`,
                        },
                        {
                          validator: async (rule, value) => {
                            const val =
                              Object.keys(GovDepartment)[
                                Object.values(GovDepartment).indexOf(value as GovDepartment)
                              ];
                            if (
                              val &&
                              val.length > 0 &&
                              selectedGovDepatments &&
                              !selectedGovDepatments.includes(val)
                            ) {
                              throw new Error(`${t('addCompany:govdepnotexist')}`);
                            }
                          },
                        },
                      ]}
                    >
                      {companyRole !== CompanyRole.GOVERNMENT &&
                      selectedGovDepatments &&
                      selectedGovDepatments.length > 0 ? (
                        <Select size="large">
                          {selectedGovDepatments?.map((val: any) => {
                            if (val in GovDepartment) {
                              const key = val as keyof typeof GovDepartment;
                              return (
                                <Select.Option key={GovDepartment[key]} value={GovDepartment[key]}>
                                  {val}
                                </Select.Option>
                              );
                            }
                            return null;
                          })}
                        </Select>
                      ) : (
                        <Select size="large" disabled={true}></Select>
                      )}
                    </Form.Item>
                  )}
                  {companyRole === CompanyRole.MINISTRY && (
                    <Form.Item
                      label={t('addCompany:sectoralScope')}
                      name="sectoralScope"
                      rules={[
                        {
                          required: true,
                          message: `${t('addCompany:sectoralScope')} ${t('isRequired')}`,
                        },
                      ]}
                      initialValue={state?.record?.sectoralScope}
                    >
                      <Select mode="multiple" size="large" maxTagCount={2} allowClear>
                        {Object.entries(SectoralScope).map(([key, value]) => (
                          <Select.Option key={value} value={value}>
                            {key}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                  <Form.Item
                    name="phoneNo"
                    label={t('addCompany:phoneNo')}
                    initialValue={state?.record?.phoneNo}
                    rules={[
                      {
                        required: true,
                        message: '',
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('addCompany:phoneNo')} ${t('isRequired')}`);
                          } else {
                            const phoneNo = formatPhoneNumber(String(value));
                            if (String(value).trim() !== '') {
                              if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                throw new Error(`${t('addCompany:phoneNo')} ${t('isRequired')}`);
                              } else {
                                if (!isPossiblePhoneNumber(String(value))) {
                                  throw new Error(`${t('addCompany:phoneNo')} ${t('isInvalid')}`);
                                }
                              }
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <PhoneInput
                      placeholder={t('addCompany:phoneNo')}
                      international
                      value={formatPhoneNumberIntl(contactNoInput)}
                      defaultCountry="LK"
                      countryCallingCodeEditable={false}
                      onChange={(v) => {}}
                      countries={countries}
                    />
                  </Form.Item>
                  {regionField && (
                    <Form.Item
                      label={t('addCompany:region')}
                      name="regions"
                      initialValue={state?.record?.regions}
                      rules={[
                        {
                          required: true,
                          message: `${t('addCompany:region')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Select
                        mode="multiple"
                        size="large"
                        maxTagCount={2}
                        onChange={onChangeRegion}
                        loading={loadingList}
                        allowClear
                      >
                        {regionsList.map((region: any) => (
                          <Select.Option value={region}>{region}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                  {companyRole !== CompanyRole.MINISTRY && (
                    <Form.Item
                      name="address"
                      label={t('addCompany:addresss')}
                      initialValue={state?.record?.address}
                      rules={[
                        { required: true, message: '' },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('addCompany:addresss')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input.TextArea rows={3} maxLength={100} />
                    </Form.Item>
                  )}
                  {companyRole === CompanyRole.GOVERNMENT && systemType !== CarbonSystemType.MRV && (
                    <div className="space-container" style={{ width: '100%' }}>
                      <Space
                        wrap={true}
                        style={{
                          display: 'flex',
                          marginBottom: 8,
                        }}
                        align="center"
                        size={'large'}
                      >
                        <Form.Item
                          style={{ width: '100%' }}
                          name="omgePercentage"
                          label={t('addCompany:omgePercentage')}
                          initialValue={state?.record?.omgePercentage}
                          rules={[
                            { required: true, message: '' },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t('addCompany:omgePercentage')}  ${t('isRequired')}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            size="large"
                            min={0}
                            max={99}
                            formatter={(value) => `${value ? Math.round(value) : ''}%`}
                            parser={(value: any) => value.replace('%', '')}
                          />
                        </Form.Item>
                      </Space>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            <div className="steps-actions">
              {isUpdate ? (
                <Row>
                  <Button loading={loading} onClick={onCancel}>
                    {t('addCompany:cancel')}
                  </Button>
                  <Button loading={loading} className="mg-left-1" type="primary" htmlType="submit">
                    {t('addCompany:submit')}
                  </Button>
                </Row>
              ) : (
                current === 0 && (
                  <Button type="primary" htmlType="submit">
                    {t('addCompany:next')}
                  </Button>
                )
              )}
            </div>
          </Form>
        </div>
      </div>
    );
  };

  const CompanyAdminDetailsForm = () => {
    return (
      <div className="company-details-form-container">
        <Form
          name="company-admin-details"
          className="company-details-form"
          layout="vertical"
          requiredMark={true}
          form={formTwo}
          onFinish={onFinishStepTwo}
        >
          <Row className="row" gutter={[16, 16]}>
            <Col xl={12} md={24}>
              <div className="details-part-one">
                <Form.Item
                  label={t('addCompany:name')}
                  name="name"
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
                          throw new Error(`${t('addCompany:name')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  name="phoneNo"
                  label={t('addCompany:phoneNo')}
                  rules={[
                    {
                      required: false,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        const phoneNo = formatPhoneNumber(String(value));
                        if (String(value).trim() !== '') {
                          if (
                            (String(value).trim() !== '' &&
                              String(value).trim() !== undefined &&
                              value !== null &&
                              value !== undefined &&
                              phoneNo !== null &&
                              phoneNo !== '' &&
                              phoneNo !== undefined &&
                              !isPossiblePhoneNumber(String(value))) ||
                            value?.length > 17
                          ) {
                            throw new Error(`${t('addCompany:phoneNo')} ${t('isInvalid')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <PhoneInput
                    placeholder={t('addCompany:phoneNo')}
                    international
                    value={formatPhoneNumberIntl(contactNoInput)}
                    defaultCountry="LK"
                    countryCallingCodeEditable={false}
                    onChange={(v) => {}}
                  />
                </Form.Item>
              </div>
            </Col>
            <Col xl={12} md={24}>
              <div className="details-part-two">
                <Form.Item
                  label={t('addCompany:email')}
                  name="email"
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
                          throw new Error(`${t('addCompany:email')} ${t('isRequired')}`);
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error(`${t('addCompany:email')} ${t('isInvalid')}`);
                          }
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
          <div className="steps-actions">
            {current === 1 && state?.record ? (
              <Button
                className="mg-left-1"
                type="primary"
                onClick={onUpdateCompany}
                loading={loading}
              >
                UPDATE
              </Button>
            ) : (
              <Button className="mg-left-1" type="primary" htmlType="submit" loading={loading}>
                {t('addCompany:submit')}
              </Button>
            )}
            {current === 1 && (
              <Button onClick={() => prevOne()} loading={loading}>
                {t('addCompany:back')}
              </Button>
            )}
          </div>
        </Form>
      </div>
    );
  };

  return (
    <div className="add-company-main-container">
      <div className="title-container">
        <div className="main">
          {isUpdate ? t('addCompany:editCompany') : t('addCompany:addNewCompany')}
        </div>
        <div className="sub">
          {isUpdate ? t('addCompany:editCompanySub') : t('addCompany:addCompanySub')}
        </div>
      </div>
      <div className="adding-section">
        {isUpdate ? (
          <>
            <div className="step-title-container">
              <div className="title">{t('addCompany:companyDetailsTitle')}</div>
            </div>
            <CompanyDetailsForm />
          </>
        ) : (
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
                      <div className="title">{t('addCompany:companyDetailsTitle')}</div>
                    </div>
                  ),
                  description: current === 0 && <CompanyDetailsForm />,
                },
                {
                  title: (
                    <div className="step-title-container">
                      <div className="step-count">02</div>
                      <div className="title">{t('addCompany:companyAdminDetailsTitle')}</div>
                    </div>
                  ),
                  description: current === 1 && <CompanyAdminDetailsForm />,
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
