import { useEffect, useState } from 'react';
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
import { formatBytes } from '../../../Utils/utilityHelper';
import { API_PATHS } from '../../../Config/apiConfig';

const provinces: any = [
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

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
  const { post, put } = useConnection();
  const { setUserInfo, userInfoState } = useUserContext();
  const { state } = useLocation();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [countries] = useState<[]>([]);
  const [loadingList] = useState<boolean>(false);
  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [companyRole, setCompanyRole] = useState<any>(state?.record?.companyRole);
  // const [selectedMinistry, setSelectedMinistry] = useState<string>('');
  // const [existgovDep, setexistGovdep] = useState<string[]>([]);
  // const [ministryDropdown, setMinistryDropdown] = useState<string[]>(ministries);
  // const [intialGovDep, selectInitialGovDep] = useState<any>(
  //   state?.record?.govDep ? state?.record?.govDep : ''
  // );
  // const [initialMinistry, selectInitialministry] = useState<any>(
  //   state?.record?.ministry ? state?.record?.ministry : ''
  // );

  const [faxNumber, setFaxNumber] = useState(state?.record?.faxNo || '');

  // let selectedGovDepatments = ministryOrgs[selectedMinistry];
  // if (existgovDep && existgovDep.length > 0) {
  //   selectedGovDepatments = selectedGovDepatments.filter((x: string) => !existgovDep.includes(x));
  // }
  // const onChangeMinistry = async (val: any) => {
  //   const key = Object.keys(Ministry)[Object.values(Ministry).indexOf(val as Ministry)];
  //   setSelectedMinistry(String(key));
  //   if (isUpdate && val === initialMinistry) {
  //     formOne.setFieldValue(
  //       'govDep',
  //       Object.keys(GovDepartment)[
  //         Object.values(GovDepartment).indexOf(intialGovDep as GovDepartment)
  //       ]
  //     );
  //   } else {
  //     formOne.setFieldValue('govDep', '');
  //   }
  //   // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
  //   getGovDep(val);
  // };

  // const getMinistryList = async () => {
  //   setLoadingList(true);
  //   try {
  //     let leftmins: string[] = [];
  //     const excludingmin: string[] = [];
  //     for (const min of ministries) {
  //       const response: any = await post(API_PATHS.ORGANIZATION_DETAILS, {
  //         page: 1,
  //         size: 100,
  //         filterAnd: [
  //           {
  //             key: 'ministry',
  //             operation: '=',
  //             value: min,
  //           },
  //         ],
  //       });
  //       const minkey = Object.keys(Ministry)[Object.values(Ministry).indexOf(min as Ministry)];
  //       if (response.data.length === ministryOrgs[minkey].length) {
  //         if (!isUpdate && min !== initialMinistry) {
  //           excludingmin.push(min);
  //         }
  //       }
  //     }
  //     leftmins = ministries.filter((x: string) => !excludingmin.includes(x));
  //     setMinistryDropdown(leftmins);
  //   } catch (error: any) {
  //     console.log('Error in getting min list', error);
  //   } finally {
  //     setLoadingList(false);
  //   }
  // };

  // const getCountryList = async () => {
  //   const response = await get('national/organisation/countries');
  //   if (response.data) {
  //     const alpha2Names = response.data.map((item: any) => {
  //       return item.alpha2;
  //     });
  //     setCountries(alpha2Names);
  //   }
  // };

  const getRegionList = async () => {
    // setLoadingList(true);
    try {
      const { data } = await post(API_PATHS.PROVINCES);
      const tempProvinces = data.map((provinceData: any) => provinceData.provinceName);
      setRegionsList(tempProvinces);
    } catch (error) {
      console.log(error);
    }
  };

  // const getGovDep = async (val: any) => {
  //   setLoadingList(true);
  //   try {
  //     const response: any = await post('national/organisation/query', {
  //       page: 1,
  //       size: 200,
  //       filterAnd: [
  //         {
  //           key: 'ministry',
  //           operation: '=',
  //           value: val,
  //         },
  //       ],
  //     });
  //     if (response && response.data) {
  //       const existDep: string[] = [];
  //       for (const i in response.data) {
  //         if (response.data[i].govDep && response.data[i].govDep.length > 0) {
  //           const departName =
  //             Object.keys(GovDepartment)[
  //               Object.values(GovDepartment).indexOf(response.data[i].govDep as GovDepartment)
  //             ];
  //           if (response.data[i].govDep !== intialGovDep) {
  //             existDep.push(departName);
  //           } else {
  //             continue;
  //           }
  //         }
  //       }
  //       setexistGovdep(existDep);
  //     }
  //   } catch (error: any) {
  //     console.log('Error in getting exist Government Department list', error);
  //   } finally {
  //     setLoadingList(false);
  //   }
  // };

  useEffect(() => {
    setIsUpdate(state?.record ? true : false);
    // getCountryList();
    getRegionList();
    // getMinistryList();
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
    // if (state?.record?.ministry) {
    //   const key =
    //     Object.keys(Ministry)[Object.values(Ministry).indexOf(state?.record?.ministry as Ministry)];
    //   setSelectedMinistry(key);
    //   getGovDep(state?.record?.ministry);
    // }
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
      formOne.setFieldValue('provinces', [...newBuyerValues]);
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
      if (requestData.company.faxNo && requestData.company.faxNo.length > 4) {
        requestData.company.faxNo = formatPhoneNumberIntl(requestData.company.faxNo);
      } else {
        requestData.company.faxNo = undefined;
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
      if (companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        requestData.company.name = 'Ministry of ' + requestData.company.ministry;
      }
      console.log('--------------requestData---------------', requestData);
      if (isGuest) {
        const response = await post(API_PATHS.REGISTER_USER, requestData);
        if (response.status === 200 || response.status === 201) {
          message.open({
            type: 'success',
            content: response.message, //t('companyRegisteredSuccess'),
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
          onNavigateToHome();
          setLoading(false);
        }
      } else {
        const response = await post(API_PATHS.ADD_USER, requestData);
        if (response.status === 200 || response.status === 201) {
          if (isUpdate) {
            setUserInfo({
              companyLogo: response.data.logo,
            } as UserProps);
          }
          message.open({
            type: 'success',
            content: response.message, // t('companyAddedSuccess'),
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

    if (formOneValues.faxNo && formOneValues.faxNo.length > 4) {
      formOneValues.faxNo = formatPhoneNumberIntl(formOneValues.faxNo);
    } else {
      formOneValues.faxNo = undefined;
    }

    try {
      let values: any = {};
      if (regionField) {
        values = {
          companyId: state?.record?.companyId,
          name: formOneValues.name,
          email: formOneValues.email,
          phoneNo: formOneValues.phoneNo,
          faxNo: formOneValues.faxNo,
          address: formOneValues.address,
          provinces: formOneValues.provinces,
          // regions: formOneValues.regions,
          companyRole: state?.record?.companyRole,
          logo: state?.record?.logo,
        };
      } else {
        values = {
          companyId: state?.record?.companyId,
          name: formOneValues.name,
          email: formOneValues.email,
          phoneNo: formOneValues.phoneNo,
          faxNo: formOneValues.faxNo,
          address: formOneValues.address,
          companyRole: state?.record?.companyRole,
          logo: state?.record?.logo,
        };
      }

      if (state?.record?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        values.taxId = formOneValues.taxId;
        values.paymentId = formOneValues.paymentId;
      }

      if (state?.record?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        if (formOneValues.govDep in GovDepartment) {
          const key = formOneValues.govDep as keyof typeof GovDepartment;
          values.govDep = GovDepartment[key];
        } else {
          values.govDep = formOneValues.govDep;
        }
        values.ministry = formOneValues.ministry;
      }
      if (state?.record?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        values.sectoralScope = formOneValues.sectoralScope;
        values.nameOfMinister = formOneValues.nameOfMinister;
        // values.name = formOneValues.ministry;
      }
      if (state?.record?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        values.omgePercentage = Math.round(Number(formOneValues.omgePercentage));
      }
      if (state?.record?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
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

      console.log('--------------values---------------', values);
      const response = await put(API_PATHS.UPDATE_ORGANIZATION, values);
      console.log('-------------------ORg update response-------------------', response);
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
      companyRole === CompanyRole.INDEPENDENT_CERTIFIER
        ? 'certifier'
        : companyRole === CompanyRole.PROJECT_DEVELOPER
        ? 'dev'
        : companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
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

                  {companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
                    ? (!isUpdate ||
                        (isUpdate &&
                          companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY)) && (
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
                  {companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
                    ? (!isUpdate ||
                        (isUpdate &&
                          companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY)) && (
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
                  {companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
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
                  {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
                    <div className="space-container" style={{ width: '100%' }}>
                      {/* <Form.Item
                        label={t('addCompany:Ministry')}
                        name="ministry"
                        initialValue={state?.record?.ministry}
                        rules={[
                          {
                            required: true,
                            message: `${t('addCompany:Ministry')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        {companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
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
                      </Form.Item> */}
                      {
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
                      }
                      {/* {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
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
                      )} */}
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

                  {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
                    systemType !== CarbonSystemType.MRV && (
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
                              { required: false, message: '' },
                              // {
                              //   validator: async (rule, value) => {
                              //     if (
                              //       String(value).trim() === '' ||
                              //       String(value).trim() === undefined ||
                              //       value === null ||
                              //       value === undefined
                              //     ) {
                              //       throw new Error(
                              //         `${t('addCompany:omgePercentage')}  ${t('isRequired')}`
                              //       );
                              //     }
                              //   },
                              // },
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
                  {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
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
                            { required: false, message: '' },
                            // {
                            //   validator: async (rule, value) => {
                            //     if (
                            //       String(value).trim() === '' ||
                            //       String(value).trim() === undefined ||
                            //       value === null ||
                            //       value === undefined
                            //     ) {
                            //       throw new Error(
                            //         `${t('addCompany:nationalSopValue')} s${t('isRequired')}`
                            //       );
                            //     }
                            //   },
                            // },
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
                                throw new Error(
                                  `${t('addCompany:maxUploadSize', {
                                    maxUploadSize: formatBytes(maximumImageSize),
                                  })}`
                                );
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
                            {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ? (
                              <SafetyOutlined className="role-icons" />
                            ) : companyRole === CompanyRole.PROJECT_DEVELOPER ? (
                              <ExperimentOutlined className="role-icons" />
                            ) : (
                              <BankOutlined className="role-icons" />
                            )}
                            {t('addCompany:' + companyRole)}
                          </Radio.Button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="certifier-radio-container"
                            style={
                              userInfoState?.companyRole ===
                              CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
                                ? {
                                    width: '45%',
                                  }
                                : {}
                            }
                          >
                            <Tooltip placement="top" title={t('addCompany:doeToolTip')}>
                              <Radio.Button className="certifier" value="IC">
                                <SafetyOutlined className="role-icons" />
                                {t('addCompany:ic')}
                              </Radio.Button>
                            </Tooltip>
                          </div>

                          <div
                            className="dev-radio-container"
                            style={
                              userInfoState?.companyRole ===
                              CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
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
                              <Radio.Button className="dev" value="PD">
                                <ExperimentOutlined className="role-icons" />
                                {t('addCompany:ProgrammeDeveloper')}
                              </Radio.Button>
                            </Tooltip>
                          </div>

                          {/* {userInfoState?.companyRole !==
                            CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
                            !isGuest && (
                              <div className="minister-radio-container">
                                {ministryDropdown.length > 0 ? (
                                  <Tooltip placement="top" title={t('addCompany:ministryToolTip')}>
                                    <Radio.Button className="minister" value="Ministry">
                                      <AuditOutlined className="role-icons" />
                                      {t('addCompany:Ministry')}
                                    </Radio.Button>
                                  </Tooltip>
                                ) : (
                                  <Tooltip placement="top" title={t('addCompany:allmincreated')}>
                                    <Radio.Button className="minister" value="Ministry" disabled>
                                      <AuditOutlined className="role-icons" />
                                      {t('addCompany:Ministry')}
                                    </Radio.Button>
                                  </Tooltip>
                                )}
                              </div>
                            )} */}
                        </>
                      )}
                    </Radio.Group>
                  </Form.Item>

                  {/* {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
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
                      {companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
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
                  )} */}
                  {/* {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY && (
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
                  )} */}
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
                  <Form.Item
                    name="faxNo"
                    label={t('addCompany:faxNo')}
                    initialValue={faxNumber}
                    rules={[
                      {
                        required: false,
                        message: '',
                      },
                      {
                        validator: async (rule: any, value: any) => {
                          // if (
                          //   String(value).trim() === '' ||
                          //   String(value).trim() === undefined ||
                          //   value === null ||
                          //   value === undefined
                          // ) {
                          //   throw new Error(`${t('addCompany:phoneNo')} ${t('isRequired')}`);
                          // } else
                          if (
                            String(value).trim() !== '' &&
                            String(value).trim() !== undefined &&
                            value !== null &&
                            value !== undefined
                          ) {
                            const faxNo = formatPhoneNumber(String(value));
                            if (String(value).trim() !== '') {
                              if (faxNo === null || faxNo === '' || faxNo === undefined) {
                                throw new Error(`${t('addCompany:faxNo')} ${t('isRequired')}`);
                              } else {
                                if (!isPossiblePhoneNumber(String(value))) {
                                  throw new Error(`${t('addCompany:faxNo')} ${t('isInvalid')}`);
                                }
                              }
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <PhoneInput
                      placeholder={t('addCompany:faxNo')}
                      international
                      value={formatPhoneNumberIntl(faxNumber)}
                      defaultCountry="LK"
                      countryCallingCodeEditable={false}
                      onChange={(v) => {
                        if (v === undefined) {
                          setFaxNumber(undefined);
                        }
                      }}
                      countries={countries}
                    />
                  </Form.Item>
                  {regionField && (
                    <Form.Item
                      label={t('addCompany:province')}
                      name="provinces"
                      initialValue={state?.record?.provinces ?? []}
                      rules={[
                        {
                          required: false,
                          message: `${t('addCompany:province')} ${t('isRequired')}`,
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

                  {
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
                  }
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
      <>
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
      </>
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
