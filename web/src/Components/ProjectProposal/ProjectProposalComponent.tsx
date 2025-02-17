import { Button, Col, DatePicker, Form, Input, message, Row, Typography } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import TextArea from 'antd/lib/input/TextArea';
import { i18n } from 'i18next';
import React, { useEffect, useState } from 'react';
import './ProjectProposalComponent.scss';
import moment from 'moment';
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';
import validator from 'validator';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import ProjectTimeline, { IProjectTimelineData } from './ProjectTimeline';
const { Text } = Typography;
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../Loading/loading';
import { DocumentTypeEnum } from '../../Definitions/Enums/document.type';

const ProjectProposalComponent = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;

  const { state } = useLocation();
  const [isView, setIsView] = useState<boolean>(!!state?.isView);
  const [loading, setLoading] = useState<boolean>(isView);

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const [form] = useForm();

  const { id } = useParams();

  const navigate = useNavigate();

  const navigateToDetailsPage = () => {
    navigate(`/programmeManagementSLCF/view/${id}`);
  };
  const [countries, setCountries] = useState<[]>([]);

  const [timelineData, setTimelineData] = useState<{ x: string; y: [number, number] }[]>();

  const { get, post } = useConnection();

  const [contactNoInput] = useState<any>();

  const setMigratedData = async () => {
    try {
      setLoading(true);
      const { data } = await post('national/programmeSl/getProjectById', {
        programmeId: id,
      });
      const res = await post('national/programmeSl/getDocLastVersion', {
        programmeId: id,
        docType: DocumentTypeEnum.COST_QUOTATION,
      });
      const quotationContent = JSON.parse(res?.data.content);

      form.setFieldsValue({
        projectTitle: data?.title,
        clientName: data?.company?.name,
        clientContactPerson: data?.contactName,
        clientMobile: data?.contactPhoneNo,
        clientEmail: data?.contactEmail,
        serviceProviderName:
          process.env.REACT_APP_COUNTRY_CLIMATE_FUND || 'CountryX Climate Fund (Pvt) Ltd.',
        developProjectConcept: data?.company?.name,
        notificationSLCSS: data?.company?.name,
        prepareCMA: data?.company?.name,
        validationCMA: data?.company?.name,
        preparationOfMonitoringReport: data?.company?.name,
        submissionOfMonitoringReport: data?.company?.name,
        costValidation: quotationContent.costValidation,
        costVerification: quotationContent.costVerification,
        totalCost: quotationContent.totalCost,
        additionalServices: (function () {
          const servicesObjs: any[] = [];
          const tempServices: { cost: number; service: string }[] =
            quotationContent?.additionalServices;
          if (tempServices !== undefined && tempServices.length > 0) {
            tempServices.forEach((service) => {
              const tempServiceObj = {
                cost: String(service.cost),
                service: service.service,
              };

              servicesObjs.push(tempServiceObj);
            });
          }

          return servicesObjs;
        })(),
      });
    } catch (error) {
      console.log('error');
    } finally {
      setLoading(false);
    }
  };

  const projectPlanChange = (value?: any) => {
    const projectPlanActivity01StartDate = form.getFieldValue('projectPlanActivity01StartDate');
    const projectPlanActivity01EndDate = form.getFieldValue('projectPlanActivity01EndDate');
    const projectPlanActivity01 = form.getFieldValue('projectPlanActivity01');

    // console.log(
    //   '-----time Vals------',
    //   projectPlanActivity01StartDate,
    //   projectPlanActivity01EndDate,
    //   projectPlanActivity01
    // );

    const tempTimelineData: { x: string; y: [number, number] }[] = [];

    if (projectPlanActivity01EndDate && projectPlanActivity01StartDate && projectPlanActivity01) {
      // console.log(
      //   '--------time now -------------',
      //   new Date(projectPlanActivity01StartDate).getTime()
      // );
      const firstObj: { x: string; y: [number, number] } = {
        x: '01.' + ' ' + projectPlanActivity01,
        y: [
          new Date(projectPlanActivity01StartDate).getTime(),
          new Date(projectPlanActivity01EndDate).getTime(),
        ],
      };

      tempTimelineData.push(firstObj);
    }
    const extraProjectPlanActivities = form.getFieldValue('extraProjectPlanActivities');

    if (extraProjectPlanActivities !== undefined && extraProjectPlanActivities[0] !== undefined) {
      extraProjectPlanActivities
        .filter((item: any) => item !== undefined)
        .map((activity: any, index: number) => {
          if (
            activity.projectPlanActivity &&
            activity.projectPlanActivityStartDate &&
            activity.projectPlanActivityEndDate
          ) {
            const tempObj: { x: string; y: [number, number] } = {
              x:
                (index <= 7 ? '0' + String(index + 2) : String(index + 2)) +
                `${'. '}` +
                activity.projectPlanActivity,
              y: [
                new Date(activity.projectPlanActivityStartDate).getTime(),
                new Date(activity.projectPlanActivityEndDate).getTime(),
              ],
            };
            tempTimelineData.push(tempObj);
          }
        });
    }

    if (tempTimelineData.length > 0) {
      setTimelineData(tempTimelineData);
    } else {
      setTimelineData([]);
    }
  };

  const getCountryList = async () => {
    try {
      const response = await get('national/organisation/countries');
      if (response.data) {
        const alpha2Names = response.data.map((item: any) => {
          return item.alpha2;
        });
        setCountries(alpha2Names);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCountryList();

    const formInitialValues = {
      projectCapacitySource: 'Proposed capacity',
      plantFactorSource: 'Professional Judgement',
      avgEnergyOutputSource: 'Calculated',
      gridEmissionFactorSource: 'Energy Balance-2019, SLSEA',
      emissionReductionValueSource: 'Calculated',
    };

    form.setFieldsValue(formInitialValues);

    if (!isView) {
      setMigratedData();
    }
  }, []);

  const calculateTotalCost = () => {
    let tempTotal = Number(form.getFieldValue('totalCost') || 0);
    const additionalServices = form.getFieldValue('additionalServices');
    const costValidation = Number(form.getFieldValue('costValidation') || 0);
    const costVerification = Number(form.getFieldValue('costVerification') || 0);
    tempTotal = costValidation + costVerification;
    if (
      additionalServices &&
      additionalServices.length > 0 &&
      additionalServices[0] !== undefined
    ) {
      additionalServices.forEach((item: any) => {
        if (item && item.cost > 0) {
          tempTotal += Number(item.cost);
        }
      });
    }
    form.setFieldValue('totalCost', String(tempTotal));
  };

  const createProjectTimelineOnView = (
    projectTimeline: { activity: string; period: [number, number] }[]
  ) => {
    const timelineObjs: any[] = [];
    if (projectTimeline !== undefined && projectTimeline.length > 0) {
      projectTimeline.forEach((timelineItem: any, index: number) => {
        const startDate = timelineItem.period[0] * 1000; // converting into miliseconds
        const endDate = timelineItem.period[1] * 1000; // converting into miliseconds
        const tempObj = {
          x:
            (index < 9 ? '0' + String(index + 1) : String(index + 1)) +
            '. ' +
            timelineItem.activity,
          y: [startDate, endDate],
        };
        timelineObjs.push(tempObj);
      });
    }

    setTimelineData(timelineObjs);
  };

  const viewDataMaptoFields = (vals: any) => {
    const projectTimeline: { activity: string; period: [number, number] }[] = vals?.projectTimeline;
    createProjectTimelineOnView(projectTimeline);
    const firstTimelineObj = projectTimeline.length > 0 ? projectTimeline.shift() : undefined;

    const teamMembers: { consultant: string; role: string }[] = vals?.teamMembers;
    const firstMember = teamMembers.length > 0 ? teamMembers.shift() : undefined;

    const boardMembers: string[] = vals?.executiveBoardMembers;
    const firstBoardMember = boardMembers.length > 0 ? boardMembers.shift() : undefined;

    const tempInitialVals = {
      introduction: vals?.introduction,
      projectTitle: vals?.title,
      proposalNo: vals?.proposalNo,
      dateOfIssue: vals?.dateOfIssue ? moment.unix(vals?.dateOfIssue) : undefined,
      revNo: vals?.revNo,
      durationOfService: vals?.durationOfService,
      validityPeriod: vals?.validityPeriodOfProposal,
      dateOfRevision: vals?.dateOfRevision ? moment.unix(vals?.dateOfRevision) : undefined,
      clientName: vals?.projectProponentName,
      clientContactPerson: vals?.projectProponentContactPerson,
      clientMobile: vals?.projectProponentMobile,
      clientEmail: vals?.projectProponentEmail,
      serviceProviderName: vals?.serviceProviderName,
      serviceProviderContactPerson: vals?.serviceProviderContactPerson,
      serviceProviderMobile: vals?.serviceProviderMobile,
      serviceProviderTelephone: vals?.serviceProviderTelephone,
      servcieProviderEmail: vals?.serviceProviderEmail,
      overallProjectBackground: vals?.overallProjectBackground,
      scopeForThisProposal: vals?.proposalScope,
      developProjectConcept: vals?.developProjectConceptResponsible,
      notificationSLCSS: vals?.notificationToSLCCSResponsible,
      prepareCMA: vals?.prepareCMAResponsible,
      validationCMA: vals?.submissionOfCMAForValidationResponsible,
      preparationOfMonitoringReport: vals?.preparationOfMonitoringReportResponsible,
      submissionOfMonitoringReport: vals?.submissionOfMonitoringReportForVerificationResponsible,
      projectCapacityValue: String(vals?.projectCapacityValue),
      projectCapacityUnit: vals?.projectCapacityUnit,
      plantFactorValue: String(vals?.plantFactorValue),
      plantFactorUnit: vals?.plantFactorUnit,
      avgEnergyOutputValue: String(vals?.avgEnergyOutputValue),
      avgEnergyOutputUnit: vals?.avgEnergyOutputUnit,
      gridEmissionFactorValue: String(vals?.gridEmissionFactorValue),
      gridEmissionFactorUnit: vals?.gridEmissionFactorUnit,
      emissionReductionValue: String(vals?.emissionReductionValue),
      emissionReductionUnit: vals?.emissionReductionUnit,
      avgCreditGenerationPerAnnum: String(vals?.avgCreditGenerationPerAnnum),
      projectPlanActivity01:
        firstTimelineObj && firstTimelineObj?.activity ? firstTimelineObj.activity : undefined,
      projectPlanActivity01StartDate:
        firstTimelineObj && firstTimelineObj?.period.length === 2
          ? moment.unix(firstTimelineObj.period[0])
          : undefined,
      projectPlanActivity01EndDate:
        firstTimelineObj && firstTimelineObj?.period.length === 2
          ? moment.unix(firstTimelineObj.period[1])
          : undefined,
      extraProjectPlanActivities: (function () {
        const tempPlanActivities: any[] = [];
        if (projectTimeline && projectTimeline.length > 0) {
          projectTimeline.forEach((timelineActivity) => {
            const tempObj = {
              projectPlanActivity: timelineActivity.activity,
              projectPlanActivityStartDate:
                timelineActivity.period.length === 2
                  ? moment.unix(timelineActivity.period[0])
                  : undefined,
              projectPlanActivityEndDate:
                timelineActivity.period.length === 2
                  ? moment.unix(timelineActivity.period[1])
                  : undefined,
            };

            tempPlanActivities.push(tempObj);
          });
        }

        return tempPlanActivities;
      })(),
      scopeOfWork: vals?.scopeOfWork,
      teamComposition: vals?.teamComposition,
      firstMemberConsultant: firstMember?.consultant,
      firstMemberRole: firstMember?.role,
      extraMembers: (function () {
        const extraMembersObjs: any[] = [];
        if (teamMembers && teamMembers.length > 0) {
          teamMembers.forEach((member) => {
            const tempMember = {
              memberConsultant: member?.consultant,
              memberRole: member?.role,
            };

            extraMembersObjs.push(tempMember);
          });
        }

        return extraMembersObjs;
      })(),
      costing: vals?.costing,
      costValidation: String(vals?.costValidation),
      costVerification: String(vals?.costVerification),
      totalCost: String(vals?.totalCost),
      additionalServices: (function () {
        const servicesObjs: any[] = [];
        const tempServices: { cost: number; service: string }[] = vals?.additionalServices;
        if (tempServices !== undefined && tempServices.length > 0) {
          tempServices.forEach((service) => {
            const tempServiceObj = {
              cost: String(service.cost),
              service: service.service,
            };

            servicesObjs.push(tempServiceObj);
          });
        }

        return servicesObjs;
      })(),
      firstExecutiveBoardMember: firstBoardMember,
      extraExecutiveBoardMembers: (function () {
        const tempExtraBoardMembers: any[] = [];
        if (boardMembers !== undefined && boardMembers.length > 0) {
          boardMembers.forEach((member) => {
            const tempMember = {
              name: member,
            };
            tempExtraBoardMembers.push(tempMember);
          });
        }

        return tempExtraBoardMembers;
      })(),
      slcssProjectDetails: vals?.slccsProjectDetails,
    };

    form.setFieldsValue(tempInitialVals);
  };

  useEffect(() => {
    const getViewData = async () => {
      if (isView) {
        try {
          const res = await post('national/programmeSl/getDocLastVersion', {
            programmeId: id,
            docType: 'projectProposal',
          });

          if (res?.statusText === 'SUCCESS') {
            const content = JSON.parse(res?.data.content);
            viewDataMaptoFields(content);
          }
        } catch (error) {
          console.log('error', error);
          message.open({
            type: 'error',
            content: `Something went wrong!`,
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();

    if (isView) {
      setDisableFields(true);
    }

    // projectPlanChange();
  }, []);

  const onFinish = async (values: any) => {
    console.log('-------------values--------------', values);
    const tempValues = {
      programmeId: id || '0001',
      content: {
        introduction: values?.introduction,
        title: values?.projectTitle,
        proposalNo: values?.proposalNo,
        dateOfIssue: moment(values?.dateOfIssue).startOf('day').unix(),
        revNo: Number(values?.revNo),
        durationOfService: values?.durationOfService,
        validityPeriodOfProposal: values?.validityPeriod,
        dateOfRevision: moment(values?.dateOfRevision).startOf('day').unix(),
        projectProponentName: values?.clientName,
        projectProponentContactPerson: values?.clientContactPerson,
        projectProponentMobile: values?.clientMobile,
        projectProponentEmail: values?.clientEmail,
        serviceProviderName: values?.serviceProviderName,
        serviceProviderContactPerson: values?.serviceProviderContactPerson,
        serviceProviderMobile: values?.serviceProviderMobile,
        serviceProviderTelephone: values?.serviceProviderTelephone,
        serviceProviderEmail: values?.servcieProviderEmail,
        overallProjectBackground: values?.overallProjectBackground,
        proposalScope: values?.scopeForThisProposal,
        developProjectConceptResponsible: values?.developProjectConcept,
        notificationToSLCCSResponsible: values?.notificationSLCSS,
        prepareCMAResponsible: values?.prepareCMA,
        submissionOfCMAForValidationResponsible: values?.validationCMA,
        preparationOfMonitoringReportResponsible: values?.preparationOfMonitoringReport,
        submissionOfMonitoringReportForVerificationResponsible:
          values?.submissionOfMonitoringReport,
        projectCapacityValue: Number(values?.projectCapacityValue),
        projectCapacityUnit: values?.projectCapacityUnit,
        plantFactorValue: Number(values?.plantFactorValue),
        plantFactorUnit: values?.plantFactorUnit,
        avgEnergyOutputValue: Number(values?.avgEnergyOutputValue),
        avgEnergyOutputUnit: values?.avgEnergyOutputUnit,
        gridEmissionFactorValue: Number(values?.gridEmissionFactorValue),
        gridEmissionFactorUnit: values?.gridEmissionFactorUnit,
        emissionReductionValue: Number(values?.emissionReductionValue),
        emissionReductionUnit: values?.emissionReductionUnit,
        avgCreditGenerationPerAnnum: Number(values?.avgCreditGenerationPerAnnum),
        projectTimeline: (function () {
          const activityObjs: any[] = [];
          const activity01 = form.getFieldValue('projectPlanActivity01');
          const activityStartDate = moment(
            form.getFieldValue('projectPlanActivity01StartDate')
          ).unix();
          const activityEndDate = moment(form.getFieldValue('projectPlanActivity01EndDate')).unix();
          const firstObj = {
            activity: activity01,
            period: [activityStartDate, activityEndDate],
          };
          activityObjs.push(firstObj);
          const extraProjectPlanActivities = form.getFieldValue('extraProjectPlanActivities');
          if (
            extraProjectPlanActivities !== undefined &&
            extraProjectPlanActivities[0] !== undefined
          ) {
            extraProjectPlanActivities.forEach((activity: any) => {
              const name = activity.projectPlanActivity;
              const startDate = moment(activity.projectPlanActivityStartDate).unix();
              const endDate = moment(activity.projectPlanActivityEndDate).unix();

              const tempObj = {
                activity: name,
                period: [startDate, endDate],
              };

              activityObjs.push(tempObj);
            });
          }
          return activityObjs;
        })(),
        scopeOfWork: values?.scopeOfWork,
        teamComposition: values?.teamComposition,
        teamMembers: (function () {
          const firstConsultant = values?.firstMemberConsultant;
          const firstRole = values?.firstMemberRole;

          const firstMember = {
            consultant: firstConsultant,
            role: firstRole,
          };

          const members = [];
          members.push(firstMember);
          const extraMembers = values?.extraMembers;

          if (extraMembers !== undefined && extraMembers[0] !== undefined) {
            extraMembers.forEach((member: any) => {
              const tempMember = {
                consultant: member?.memberConsultant,
                role: member?.memberRole,
              };

              members.push(tempMember);
            });
          }

          return members;
        })(),
        costing: values?.costing,
        costValidation: Number(values?.costValidation),
        costVerification: Number(values?.costVerification),
        totalCost: Number(values?.totalCost),
        additionalServices: (function () {
          const additionalServices = values?.additionalServices;
          const tempServices: any[] = [];
          if (additionalServices !== undefined && additionalServices[0] !== undefined) {
            additionalServices.forEach((serviceItem: any) => {
              const tempService = {
                cost: Number(serviceItem.cost),
                service: serviceItem.service,
              };
              tempServices.push(tempService);
            });
          }

          return tempServices;
        })(),
        executiveBoardMembers: (function () {
          const firstBoardMember = values?.firstExecutiveBoardMember;

          const tempBoardMembers = [firstBoardMember];

          const extraBoardMembers = values?.extraExecutiveBoardMembers;

          if (
            extraBoardMembers !== undefined &&
            extraBoardMembers.length > 0 &&
            extraBoardMembers[0] !== undefined
          ) {
            extraBoardMembers.forEach((boardMember: any) => {
              tempBoardMembers.push(boardMember.name);
            });
          }
          return tempBoardMembers;
        })(),
        slccsProjectDetails: values?.slcssProjectDetails,
      },
    };

    try {
      setLoading(true);
      const res = await post('national/programmeSl/createProjectProposal', tempValues);
      if (res?.statusText === 'SUCCESS') {
        message.open({
          type: 'success',
          content: 'Project Proposal submitted successfully',
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
      }
    } catch (error) {
      message.open({
        type: 'error',
        content: 'Something went wrong!',
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="proposal-form-container">
      <div className="title-container">
        <div className="main">{t('projectProposal:proposalTitle')}</div>
      </div>

      <div className="forms-container">
        <Form
          labelCol={{ span: 20 }}
          wrapperCol={{ span: 24 }}
          className="proposal-form"
          layout="vertical"
          requiredMark={true}
          form={form}
          onFinish={(values: any) => {
            onFinish(values);
          }}
        >
          {/* Introduction start */}
          <Form.Item
            className="full-width-form-item highlight-label"
            label={`1. ${t('projectProposal:introduction')}`}
            name="introduction"
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
                    throw new Error(`${t('projectProposal:introduction')} ${t('isRequired')}`);
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={'Give a brief introduction about the project.'}
              disabled={disableFields}
            />
          </Form.Item>

          <Row className="row" gutter={[40, 16]}>
            <Col xl={12} md={24}>
              <div className="step-form-right-col">
                <Form.Item
                  label={t('projectProposal:projectTitle')}
                  name="projectTitle"
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
                            `${t('projectProposal:projectTitle')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:proposalNo')}
                  name="proposalNo"
                  initialValue={`CCF/PP/${new Date().getFullYear() % 100}/${id}`}
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
                          throw new Error(`${t('projectProposal:proposalNo')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:dateOfIssue')}
                  name="dateOfIssue"
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
                          throw new Error(`${t('projectProposal:dateOfIssue')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    disabled={disableFields}
                  />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:revNo')}
                  name="revNo"
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
                          throw new Error(`${t('projectProposal:revNo')} ${t('isRequired')}`);
                        }

                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be a number'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" size="large" disabled={disableFields} />
                </Form.Item>
              </div>
            </Col>

            <Col xl={12} md={24}>
              <div className="step-form-left-col">
                <Form.Item
                  label={t('projectProposal:durationOfService')}
                  name="durationOfService"
                  className="duration-of-service"
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
                            `${t('projectProposal:durationOfService')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={5} disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:validityPeriod')}
                  name="validityPeriod"
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
                            `${t('projectProposal:validityPeriod')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:dateOfRevision')}
                  name="dateOfRevision"
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
                            `${t('projectProposal:dateOfRevision')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                    disabled={disableFields}
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
          {/* Introduction end */}

          {/* Details of project Proponent start */}
          <>
            <h4 className="section-sub-title">{t('projectProposal:detailsOfProjectProponent')}</h4>

            <Row gutter={[40, 16]}>
              <Col xl={12} md={24}>
                <Form.Item
                  label={t('projectProposal:name')}
                  name="clientName"
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
                          throw new Error(`${t('projectProposal:name')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:mobile')}
                  name="clientMobile"
                  rules={[
                    {
                      required: true,
                      // message: `${t('projectProposal:mobile')} ${t('isRequired')}`,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                        } else {
                          const phoneNo = formatPhoneNumber(String(value));
                          if (String(value).trim() !== '') {
                            if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                              throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                            } else {
                              if (!isPossiblePhoneNumber(String(value))) {
                                throw new Error(`${t('projectProposal:mobile')} ${t('isInvalid')}`);
                              }
                            }
                          }
                        }
                      },
                    },
                  ]}
                >
                  <PhoneInput
                    // placeholder={t('projectProposal:phoneNo')}
                    international
                    value={formatPhoneNumberIntl(contactNoInput)}
                    defaultCountry="LK"
                    countryCallingCodeEditable={false}
                    onChange={(v) => {}}
                    countries={countries as Country[]}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col xl={12} md={24}>
                <Form.Item
                  label={t('projectProposal:contactPerson')}
                  name="clientContactPerson"
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
                            `${t('projectProposal:contactPerson')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>
                <Form.Item
                  label={t('projectProposal:email')}
                  name="clientEmail"
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
                          throw new Error(`${t('projectProposal:email')} ${t('isRequired')}`);
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error(`${t('projectProposal:email')} ${t('isInvalid')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>
              </Col>
            </Row>
          </>
          {/* Details of project Proponent end */}

          {/* Details of Service Provider start */}
          <>
            <h4 className="section-sub-title">{t('projectProposal:detailsOfServiceProvider')}</h4>

            <Row gutter={[40, 16]}>
              <Col xl={12} md={24}>
                <Form.Item
                  label={t('projectProposal:name')}
                  name="serviceProviderName"
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
                          throw new Error(`${t('projectProposal:name')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:mobile')}
                  name="serviceProviderMobile"
                  rules={[
                    {
                      required: true,
                      // message: `${t('projectProposal:mobile')} ${t('isRequired')}`,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                        } else {
                          const phoneNo = formatPhoneNumber(String(value));
                          if (String(value).trim() !== '') {
                            if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                              throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                            } else {
                              if (!isPossiblePhoneNumber(String(value))) {
                                throw new Error(`${t('projectProposal:mobile')} ${t('isInvalid')}`);
                              }
                            }
                          }
                        }
                      },
                    },
                  ]}
                >
                  <PhoneInput
                    international
                    value={formatPhoneNumberIntl(contactNoInput)}
                    defaultCountry="LK"
                    countryCallingCodeEditable={false}
                    onChange={(v) => {}}
                    countries={countries as Country[]}
                    disabled={disableFields}
                  />
                </Form.Item>
                <Form.Item
                  label={t('projectProposal:email')}
                  name="servcieProviderEmail"
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
                          throw new Error(`${t('projectProposal:email')} ${t('isRequired')}`);
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error(`${t('projectProposal:email')} ${t('isInvalid')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>
              </Col>
              <Col xl={12} md={24}>
                <Form.Item
                  label={t('projectProposal:contactPerson')}
                  name="serviceProviderContactPerson"
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
                            `${t('projectProposal:contactPerson')} ${t('isRequired')}`
                          );
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" disabled={disableFields} />
                </Form.Item>

                <Form.Item
                  label={t('projectProposal:telephone')}
                  name="serviceProviderTelephone"
                  rules={[
                    {
                      required: true,
                      // message: `${t('projectProposal:mobile')} ${t('isRequired')}`,
                      message: ``,
                    },
                    {
                      validator: async (rule: any, value: any) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                        } else {
                          const phoneNo = formatPhoneNumber(String(value));
                          if (String(value).trim() !== '') {
                            if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                              throw new Error(`${t('projectProposal:mobile')} ${t('isRequired')}`);
                            } else {
                              if (!isPossiblePhoneNumber(String(value))) {
                                throw new Error(`${t('projectProposal:mobile')} ${t('isInvalid')}`);
                              }
                            }
                          }
                        }
                      },
                    },
                  ]}
                >
                  <PhoneInput
                    international
                    value={formatPhoneNumberIntl(contactNoInput)}
                    defaultCountry="LK"
                    countryCallingCodeEditable={false}
                    onChange={(v) => {}}
                    countries={countries as Country[]}
                    disabled={disableFields}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
          {/* Details of Service Provider end */}

          {/* Overall background start */}
          <>
            <h4 className="section-title mg-top-2">
              2. {t('projectProposal:overallProjectBackground')}
            </h4>
            <Form.Item
              // label={t('projectProposal:overallProjectBackground')}
              name="overallProjectBackground"
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
                        `${t('projectProposal:overallProjectBackground')} ${t('isRequired')}`
                      );
                    }
                  },
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder={`${t('projectProposal:overallProjectBackgroundPlaceHolder')}`}
                disabled={disableFields}
              />
            </Form.Item>
          </>
          {/* Overall background end */}

          {/* Sri Lanka Carbon Crediting Scheme(SLCCS) start */}
          <>
            <h4 className="section-title mg-top-2">
              3.{' '}
              {t('projectProposal:creditingScheme', {
                countryName: process.env.REACT_APP_COUNTRY_NAME || 'CountryX',
              })}
            </h4>

            <p className="section-description">
              CountryX Carbon Crediting Scheme (SLCCS) is a Greenhouse Gas (GHG) reduction programme
              which needs encouragement of every kind of active carbon reduction or removal projects
              for the benefits of the Environment, Society and the Economy. It brings quality
              assurance for such projects and carbon offsets. It is a voluntary initiative that
              regulates and registers such projects which offsets the GHG emissions from companies,
              project developers, or other entities within a context of quality, credibility and
              transparency.
            </p>

            <h4 className="section-sub-title">{t('projectProposal:slccsObjectives')}</h4>
            <ol className="objectives-list section-description">
              <li>
                To introduce more effective and user friendly programme that brings quality
                assurance to authentic GHG reduction and removal project activities.
              </li>
              <li>
                To provide transparent service to its clients in the process of project Validation,
                Verification, Certification and Registration.
              </li>
              <li>
                To facilitate responsible GHG emitters for voluntary offsets of quality assured
                emission reductions generated by their own GHG reduction projects.
              </li>
              <li>
                To encourage the projects benefited on aspects other than GHG reduction and/or
                removal such as helping communities to improve their livelihood, enhancing
                ecological services.
              </li>
              <li>
                To innovate paths in carbon crediting to businesses, non-profits and government
                entities that engage in on the ground climate action.
              </li>
            </ol>
          </>
          {/* Sri Lanka Carbon Crediting Scheme(SLCCS) end */}

          {/* Scope for this proposal start */}
          <>
            <Form.Item
              className="full-width-form-item highlight-label mg-top-2"
              label={`4. ${t('projectProposal:scopeForThisProposal')}`}
              name="scopeForThisProposal"
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
                        `${t('projectProposal:scopeForThisProposal')} ${t('isRequired')}`
                      );
                    }
                  },
                },
              ]}
            >
              <TextArea rows={4} disabled={disableFields} />
            </Form.Item>
          </>
          {/* Scope for this proposal end */}

          {/* Scope table start */}
          <div className="scope-table">
            <Row className="header">
              <Col md={12} xl={12} className="col-1">
                <p style={{ fontWeight: 500, color: '#000000' }}>Activity</p>
              </Col>
              <Col md={12} xl={12} className="col-2">
                <p style={{ fontWeight: 500, color: '#000000' }}>Responsible</p>
              </Col>
            </Row>
            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:developProjectConcept')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="developProjectConcept"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:notificationSLCSS')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="notificationSLCSS"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:prepareCMA')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="prepareCMA"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:validationCMA')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="validationCMA"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:cmaWebHosting')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:slccsAdministrator')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:validationSiteVisit')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:validationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:draftValidationReport')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:validationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:resolutionCarsAndCLs')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:validationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:submissionFinalValidation')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:slccsAdministrator')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:issuesRaisedByEB')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:validationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:registration')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:slccsAdministrator')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:preparationOfMonitoringReport')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="preparationOfMonitoringReport"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:submissionOfMonitoringReport')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                <Form.Item
                  name="submissionOfMonitoringReport"
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
                          throw new Error(`${t('projectProposal:required')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:verficationSiteVisit')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:verificationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:draftVerficationReport')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:verificationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:resolutionOfCARSandCLs')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:verificationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:submissionFinalReportsToEB')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:slccsAdministrator')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:respondingToIssues')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:verificationTeam')}
              </Col>
            </Row>

            <Row className="data-row">
              <Col md={12} xl={12} className="col-1 data-col">
                {t('projectProposal:issuance')}
              </Col>
              <Col md={12} xl={12} className="col-2 data-col">
                {t('projectProposal:slccsAdministrator')}
              </Col>
            </Row>
          </div>
          {/* Scope table end */}

          <>
            <h4 className="section-description-title" style={{ marginTop: '8px', fontWeight: 500 }}>
              {t('projectProposal:cma')}
            </h4>
            <p className="section-description mg-bottom-1">
              CMA is the document containing description of the project to be submitted for the
              validation and registration. This document can be prepared by Project Proponent (PP)
              or other third-party on behalf of the PP according to the format given by SLCCS.
            </p>
          </>

          <>
            <h4 className="section-description-title" style={{ fontWeight: 500 }}>
              {t('projectProposal:validationoftheCMA')}
            </h4>
            <p className="section-description mg-bottom-1">
              Validation process would be done by Validation/Verification Team of CountryX Climate
              Fund based on the CMA provided by PP or 3rd Party by reviewing required document on
              site and off site.
            </p>
          </>

          <>
            <h4 className="section-description-title" style={{ fontWeight: 500 }}>
              {t('projectProposal:projectRegistration')}
            </h4>
            <p className="section-description mg-bottom-1">
              Project registration would be done by SLCCS registry division of CountryX Climate Fund
              based on the Validation Report provided by Validation Division of CountryX Climate
              Fund.
            </p>
          </>

          <>
            <h4 className="section-description-title" style={{ fontWeight: 500 }}>
              {t('projectProposal:monitoringReport')}
            </h4>
            <p className="section-description mg-bottom-1">
              Monitoring report is the document containing quantification of the emission reduction
              within the selected monitoring period to be submitted for verification. This document
              can be prepared by Project Proponent (PP) or other third-party on behalf of the PP
              according to the format given by SLCCS.
            </p>
          </>

          <>
            <h4 className="section-description-title" style={{ fontWeight: 500 }}>
              {t('projectProposal:verificationOfMR')}
            </h4>
            <p className="section-description mg-bottom-1">
              Verification process would be done by Verification Team of CountryX Climate Fund based
              on the MR provided by PP or 3rd Party by reviewing required document on site and off
              site.
            </p>
          </>

          <>
            <h4 className="section-description-title" style={{ fontWeight: 500 }}>
              {t('projectProposal:issuanceOfSCER')}
            </h4>
            <p className="section-description mg-bottom-1">
              The amount of CountryX Certified Emission Reduction (SCER) would be certified by SLCCS
              registry division and that amount would credited to PP.
            </p>
          </>

          {/* Estimation of GHG Reduction start */}
          <>
            <h4 className="section-title mg-bottom-1">
              5. {t('projectProposal:estimationOfGHGReduction')}
            </h4>
            <p className="section-description">
              Emission reduction resulting from the implementation of this project is as follows
            </p>

            <p className="equation">
              <i>
                BE<sub>y</sub> = EG<sub>y</sub> * EF<sub>y</sub>
              </i>

              <span>
                <i>Equation (1)</i>
              </span>
            </p>

            <div className="equation-description">
              <p className="mg-top-1 mg-bottom-1">Where</p>

              <i>
                BE<sub>y</sub> = Baseline Emissions in year y (tCO<sub>2</sub>)
              </i>
              <br />
              <i>
                EG<sub>y</sub> = Quantity of net electricity displaced as a result of the
                implementation of the project activity in year y (MWh)
              </i>
              <br />

              <i>
                EF<sub>y</sub> = CO<sub>2</sub> Emission factor of the grid in year y (tCO
                <sub>2</sub>/ MWh)
              </i>
              <br />
            </div>

            {/* Reduction table start */}
            <div className="reductions-table mg-top-1">
              <Row justify={'space-between'} gutter={40} className="header">
                <Col md={6} xl={6}>
                  Parameter
                </Col>
                <Col md={3} xl={3}>
                  Value
                </Col>
                <Col md={4} xl={4}>
                  Unit
                </Col>
                <Col md={8} xl={8}>
                  Source
                </Col>
              </Row>

              <Row justify={'space-between'} align={'middle'} gutter={40} className="data-row">
                <Col md={6} xl={6}>
                  Project Capacity
                </Col>
                <Col md={3} xl={3}>
                  <Form.Item
                    name="projectCapacityValue"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          // if (!value) {
                          //   return Promise.resolve();
                          // }

                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('projectProposal:required')}`);
                          }

                          // eslint-disable-next-line no-restricted-globals
                          if (isNaN(value)) {
                            return Promise.reject(new Error('Should be a number!'));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="projectCapacityUnit"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="projectCapacitySource"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size={'large'} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'space-between'} align={'middle'} gutter={40} className="data-row">
                <Col md={6} xl={6}>
                  Plant Factor
                </Col>
                <Col md={3} xl={3}>
                  <Form.Item
                    name="plantFactorValue"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          // if (!value) {
                          //   return Promise.resolve();
                          // }

                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('projectProposal:required')}`);
                          }

                          // eslint-disable-next-line no-restricted-globals
                          if (isNaN(value)) {
                            return Promise.reject(new Error('Should be a number!'));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="plantFactorUnit"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="plantFactorSource"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size={'large'} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'space-between'} align={'middle'} gutter={40} className="data-row">
                <Col md={6} xl={6}>
                  Average Energy Output
                </Col>
                <Col md={3} xl={3}>
                  <Form.Item
                    name="avgEnergyOutputValue"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          // if (!value) {
                          //   return Promise.resolve();
                          // }

                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('projectProposal:required')}`);
                          }

                          // eslint-disable-next-line no-restricted-globals
                          if (isNaN(value)) {
                            return Promise.reject(new Error('Should be a number!'));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="avgEnergyOutputUnit"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="avgEnergyOutputSource"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size={'large'} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'space-between'} align={'middle'} gutter={40} className="data-row">
                <Col md={6} xl={6}>
                  Grid Emission Factor (EFCM,Grid,y)
                </Col>
                <Col md={3} xl={3}>
                  <Form.Item
                    name="gridEmissionFactorValue"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          // if (!value) {
                          //   return Promise.resolve();
                          // }

                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('projectProposal:required')}`);
                          }

                          // eslint-disable-next-line no-restricted-globals
                          if (isNaN(value)) {
                            return Promise.reject(new Error('Should be a number'));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="gridEmissionFactorUnit"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="gridEmissionFactorSource"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size={'large'} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'space-between'} align={'middle'} gutter={40} className="data-row">
                <Col md={6} xl={6}>
                  Emission Reduction (ERy)
                </Col>
                <Col md={3} xl={3}>
                  <Form.Item
                    name="emissionReductionValue"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          // if (!value) {
                          //   return Promise.resolve();
                          // }

                          if (
                            String(value).trim() === '' ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(`${t('projectProposal:required')}`);
                          }

                          // eslint-disable-next-line no-restricted-globals
                          if (isNaN(value)) {
                            return Promise.reject(new Error('Should be a number'));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={4} xl={4}>
                  <Form.Item
                    name="emissionReductionUnit"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8}>
                  <Form.Item
                    name="emissionReductionValueSource"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size={'large'} disabled />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            {/* Reduction table end */}

            <Row align={'middle'} gutter={16} className="avg-credit-gen-row mg-top-1">
              <Col>
                <p>Average Credit Generation per annum:</p>
              </Col>
              <Col>
                <Form.Item
                  name="avgCreditGenerationPerAnnum"
                  rules={[
                    {
                      required: true,
                      message: ``,
                    },
                    {
                      validator: async (rule, value) => {
                        // if (!value) {
                        //   return Promise.resolve();
                        // }

                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('projectProposal:required')}`);
                        }

                        // eslint-disable-next-line no-restricted-globals
                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be a number'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" disabled={disableFields} addonAfter={'tCO2e'} />
                </Form.Item>
              </Col>
            </Row>

            <p className="text-color">
              Note that in the calculation of net emission reduction, in addition to baseline
              emission, project and leakage emissions are required to be considered. In this
              estimation, it is assumed assumed that no project and leakage emissions has occurred
              in the project activity
            </p>
          </>
          {/* Estimation of GHG Reduction end */}

          {/* Project Time Plan start */}
          <>
            <h4 className="section-title">6. {t('projectProposal:projectTimePlan')}</h4>
            <div className="project-timeline-table">
              <Row className="header" justify={'space-between'}>
                <Col md={3} xl={3} className="col-1">
                  NO.
                </Col>
                <Col md={9} xl={9} className="col-2">
                  Activity
                </Col>
                <Col md={8} xl={8} className="col-3">
                  Start Date and End Date
                </Col>
                <Col md={2} xl={2}>
                  {' '}
                </Col>
              </Row>

              <Row justify={'space-between'}>
                <Col md={3} xl={3} className="col-1">
                  01
                </Col>
                <Col md={9} xl={9} className="col-2">
                  <Form.Item
                    name="projectPlanActivity01"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input
                      disabled={disableFields}
                      onChange={(value) => projectPlanChange(value)}
                    />
                  </Form.Item>
                </Col>
                <Col md={8} xl={8} className="col-3">
                  <Form.Item
                    label={``}
                    name="projectPlanActivity01StartDate"
                    className="datepicker"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      placeholder="Start Date"
                      picker="date"
                      disabled={disableFields}
                      onChange={(value) => projectPlanChange(value)}
                    />
                  </Form.Item>
                  <p>to</p>
                  <Form.Item
                    label={``}
                    name="projectPlanActivity01EndDate"
                    className="datepicker"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      placeholder="End Date"
                      picker="date"
                      onChange={(value) => projectPlanChange(value)}
                      disabled={disableFields}
                      disabledDate={(currentDate: any) =>
                        currentDate <
                        moment(form.getFieldValue('projectPlanActivity01StartDate')).endOf('day')
                      }
                    />
                  </Form.Item>
                </Col>
                <Col md={2} xl={2}>
                  {' '}
                </Col>
              </Row>

              <Form.List name="extraProjectPlanActivities">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <>
                        <Row justify={'space-between'}>
                          <Col md={3} xl={3} className="col-1">
                            {name > 7 ? name + 2 : '0' + String(name + 2)}
                          </Col>
                          <Col md={9} xl={9} className="col-2">
                            <Form.Item
                              name={[name, 'projectPlanActivity']}
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
                                      throw new Error(`${t('projectProposal:required')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <Input
                                disabled={disableFields}
                                onChange={(value) => projectPlanChange(value)}
                              />
                            </Form.Item>
                          </Col>
                          <Col md={8} xl={8} className="col-3">
                            <Form.Item
                              label={``}
                              name={[name, 'projectPlanActivityStartDate']}
                              className="datepicker"
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
                                      throw new Error(`${t('projectProposal:required')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="large"
                                placeholder="Start Date"
                                disabled={disableFields}
                                picker="date"
                                onChange={(value) => projectPlanChange(value)}
                                // disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                              />
                            </Form.Item>
                            <p>to</p>
                            <Form.Item
                              label={``}
                              name={[name, 'projectPlanActivityEndDate']}
                              className="datepicker"
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
                                      throw new Error(`${t('projectProposal:required')}`);
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="large"
                                placeholder="End Date"
                                picker="date"
                                onChange={(value) => projectPlanChange(value)}
                                disabled={disableFields}
                                disabledDate={(currentDate: any) =>
                                  currentDate <
                                  moment(
                                    form.getFieldValue('extraProjectPlanActivities')[name]
                                      .projectPlanActivityStartDate
                                  ).startOf('day')
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col md={2} xl={2} className="col-4">
                            <Form.Item>
                              <Button
                                onClick={() => {
                                  remove(name);
                                  projectPlanChange();
                                }}
                                icon={<MinusOutlined />}
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    ))}

                    <Form.Item>
                      <Button
                        onClick={() => {
                          add();
                        }}
                        className="addBtn"
                        icon={<PlusOutlined />}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </div>
            {timelineData && timelineData.length > 0 && <ProjectTimeline data={timelineData} />}
          </>
          {/* Project Time Plan end */}

          <Form.Item
            className="full-width-form-item highlight-label"
            label={`7. ${t('projectProposal:scopeOfWork')}`}
            name="scopeOfWork"
            rules={[
              {
                required: true,
                message: `${t('projectProposal:scopeOfWork')} ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} disabled={disableFields} />
          </Form.Item>

          <Form.Item
            className="full-width-form-item highlight-label"
            label={`8. ${t('projectProposal:teamComposition')}`}
            name="teamComposition"
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
                    throw new Error(`${t('projectProposal:teamComposition')} ${t('isRequired')}`);
                  }
                },
              },
            ]}
          >
            <TextArea rows={4} disabled={disableFields} />
          </Form.Item>

          {/* Team members table start */}
          <>
            <h4 className="section-title">{t('projectProposal:teamMembersGivenBelow')}:</h4>
            <div className="team-members-table">
              <Row className="header">
                <Col md={11} xl={11} className="col-1">
                  Consultant
                </Col>
                <Col md={11} xl={11} className="col-2">
                  Role
                </Col>
                <Col md={2} xl={2}>
                  {' '}
                </Col>
              </Row>

              <Row>
                <Col md={11} xl={11} className="col-1">
                  <Form.Item
                    name="firstMemberConsultant"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Name" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={11} xl={11} className="col-2">
                  <Form.Item
                    name="firstMemberRole"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Role" disabled={disableFields} />
                  </Form.Item>
                </Col>
                <Col md={2} xl={2}>
                  {' '}
                </Col>
              </Row>

              <Form.List name="extraMembers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <>
                        <Row align={'middle'}>
                          <Col md={11} xl={11} className="col-1">
                            <Form.Item
                              name={[name, 'memberConsultant']}
                              rules={[
                                {
                                  required: true,
                                  message: `${t('projectProposal:required')}`,
                                },
                              ]}
                            >
                              <Input placeholder="Name" disabled={disableFields} />
                            </Form.Item>
                          </Col>
                          <Col md={11} xl={11} className="col-2">
                            <Form.Item
                              name={[name, 'memberRole']}
                              rules={[
                                {
                                  required: true,
                                  message: `${t('projectProposal:required')}`,
                                },
                              ]}
                            >
                              <Input placeholder="Role" disabled={disableFields} />
                            </Form.Item>
                          </Col>
                          <Col md={2} xl={2}>
                            <Form.Item>
                              <Button
                                className="minusBtn"
                                onClick={() => {
                                  remove(name);
                                }}
                                icon={<MinusOutlined />}
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    ))}

                    <Form.Item>
                      <Button
                        className="addBtn"
                        disabled={disableFields}
                        onClick={() => {
                          add();
                        }}
                        icon={<PlusOutlined />}
                      />
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </div>
          </>
          {/* Team members table end */}
          <Form.Item
            className="full-width-form-item highlight-label mg-top-1"
            label={`9. ${t('projectProposal:costing')}`}
            name="costing"
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
                    throw new Error(`${t('projectProposal:costing')} ${t('isRequired')}`);
                  }
                },
              },
            ]}
          >
            <TextArea rows={4} disabled={disableFields} />
          </Form.Item>

          {/* Costing table start */}
          <div className="costing-table">
            <Row className="header" justify={'space-between'}>
              <Col md={2} xl={2}>
                <Text strong>No</Text>
              </Col>
              <Col md={10}>
                <Text strong>Service Category</Text>
              </Col>
              <Col md={4} xl={4}>
                <Text strong>Cost (LKR)</Text>
              </Col>
              <Col md={2} xl={2}>
                {' '}
              </Col>
            </Row>
            <Row align={'middle'} justify={'space-between'} className="data-rows">
              <Col md={2} xl={2}>
                1
              </Col>
              <Col md={10}>
                <Form.Item name="serviceValidation">
                  <Input size="large" defaultValue={'Project Validation & Registration'} disabled />
                </Form.Item>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="costValidation"
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
                          throw new Error(`Cost ${t('isRequired')}`);
                        }

                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be a number'));
                        }
                      },
                    },
                  ]}
                >
                  <Input
                    // type="number"
                    size="large"
                    disabled
                    onChange={(val) => {
                      calculateTotalCost();
                    }}
                  />
                </Form.Item>
              </Col>
              <Col md={2} xl={2}>
                {' '}
              </Col>
            </Row>

            <Row align={'middle'} justify={'space-between'} className="data-rows">
              <Col md={2} xl={2}>
                2
              </Col>
              <Col md={10}>
                <Form.Item name="serviceVerification">
                  <Input size="large" defaultValue={'Verification & Credit Issuance'} disabled />
                </Form.Item>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="costVerification"
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
                          throw new Error(`Cost ${t('isRequired')}`);
                        }

                        if (isNaN(value)) {
                          return Promise.reject(new Error('Should be a number'));
                        }
                      },
                    },
                  ]}
                >
                  <Input
                    // type="number"
                    size="large"
                    disabled
                    onChange={(val) => {
                      calculateTotalCost();
                    }}
                  />
                </Form.Item>
              </Col>
              <Col md={2} xl={2}>
                {' '}
              </Col>
            </Row>
            <Form.List name="additionalServices">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <>
                      <Row align={'middle'} justify={'space-between'} className="data-rows">
                        <Col md={2} xl={2}>
                          {name + 3}
                        </Col>
                        <Col md={10}>
                          <Form.Item
                            name={[name, 'service']}
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
                                      `${t('costQuotation:serviceCategory')} ${t(
                                        'costQuotation:isRequired'
                                      )}`
                                    );
                                  }
                                },
                              },
                            ]}
                          >
                            <Input size="large" onChange={(val) => {}} disabled />
                          </Form.Item>
                        </Col>
                        <Col md={4} xl={4}>
                          <Form.Item
                            name={[name, 'cost']}
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
                                    throw new Error(`${t('projectProposal:required')}`);
                                  }

                                  if (isNaN(value)) {
                                    return Promise.reject(new Error('Should be a number'));
                                  }
                                },
                              },
                            ]}
                          >
                            <Input
                              // type="number"
                              size="large"
                              onChange={(val) => {
                                calculateTotalCost();
                              }}
                              disabled
                            />
                          </Form.Item>
                        </Col>

                        <Col md={2} xl={2}>
                          {/* <Form.Item>
                            <Button
                              onClick={() => {
                                calculateTotalCost();
                                remove(name);
                              }}
                              size="large"
                              className="addMinusBtn"
                              // block
                              icon={<MinusOutlined />}
                              disabled
                            >
                            </Button>
                          </Form.Item> */}
                        </Col>
                      </Row>
                    </>
                  ))}
                  {/* <Row align={'middle'} justify={'space-between'} className="data-rows">
                    <Col md={2} xl={2}>
                      <div className="form-list-actions">
                        <Form.Item>
                          <Button
                            onClick={() => {
                              add();
                            }}
                            size="large"
                            className="addMinusBtn"
                            disabled
                            // block
                            icon={<PlusOutlined />}
                          ></Button>
                        </Form.Item>
                      </div>
                    </Col>
                    <Col md={10} xl={10}>
                      {' '}
                    </Col>
                    <Col md={4} xl={4}>
                      {' '}
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row> */}
                </>
              )}
            </Form.List>

            <Row align={'middle'} justify={'space-between'} className="data-rows">
              <Col md={2} xl={2}>
                {' '}
              </Col>
              <Col md={10} xl={10}>
                <p>Total</p>
              </Col>
              <Col md={4} xl={4}>
                <Form.Item
                  name="totalCost"
                  rules={[
                    {
                      required: true,
                      message: `Total ${t('isRequired')}`,
                    },
                  ]}
                >
                  <Input size="large" disabled />
                </Form.Item>
              </Col>
              <Col md={2} xl={2}>
                {' '}
              </Col>
            </Row>
          </div>
          <>
            <h4 style={{ color: '#3A3541CC', fontWeight: '600' }} className="mg-top-1 margin-0">
              Conditions
            </h4>
            <p className="mg-left-1 margin-0">50% Of The Payment On Up Front.</p>
            <p className="mg-left-1 mg-bottom-1">
              50% Of The Payment On Completing The Validation And Verification{' '}
            </p>
          </>
          {/* Costing table end */}

          {/* Executive Board Members start */}
          <>
            <h4 className="section-title">10. Executive Board of SLCCS(SLCCS EB)</h4>
            <p className="capitalize">
              CCF will validate/verify the project independently, and ensure the avoidance of the
              double counting by the establishment of SLCCS Executive Board and responsible for
              monitoring and regularly evaluating the process and performance, seeking to ensure the
              continuity of SLCCS functions
            </p>

            <p className="capitalize">SLCCS Executive Board Members</p>

            <div className="executive-board-members-table">
              <Row>
                <Col md={20} xl={10}>
                  <Form.Item
                    name="firstExecutiveBoardMember"
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
                            throw new Error(`${t('projectProposal:required')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Name" disabled={disableFields} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.List name="extraExecutiveBoardMembers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restFilled }) => (
                      <Row>
                        <Col md={20} xl={10}>
                          <Form.Item
                            name={[name, 'name']}
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
                                    throw new Error(`${t('projectProposal:required')}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input placeholder="Name" disabled={disableFields} />
                          </Form.Item>
                        </Col>
                        <Col md={2} xl={2}>
                          <Form.Item>
                            <Button
                              style={{ marginLeft: '8px' }}
                              onClick={() => {
                                remove(name);
                              }}
                              icon={<MinusOutlined />}
                              disabled={disableFields}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}

                    <Form.Item>
                      <Button
                        onClick={() => {
                          add();
                        }}
                        icon={<PlusOutlined />}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </div>
          </>
          {/* Executive Board Members End */}

          {/*  Introduction to climate fund start */}
          <>
            <h4 className="section-title">11. Introduction to CountryX Climate Fund</h4>
            <p className="capitalize">
              CCF is a public-private partnership company established under the companies’ Act No.7
              of 2007, under the Ministry of Environment and Renewable Energy to promote carbon
              trading projects in CountryX. Company provides technical and finance resources to
              develop projects contribute to the sustainability of the environment in any sector.
              CCF also purchases carbon credits from project owners while providing any service
              relating to CDM project development.
            </p>

            <div className="mg-top-1">Our Vision </div>
            <div className="capitalize">
              Carbon neutral and climate-resilient blue-green economy in CountryX.
            </div>

            <div className="mg-top-1">Mission</div>
            <div className="mg-bottom-1 capitalize">
              To support the nation to achieve a low carbon and climate-resilient blue green
              development
            </div>
          </>
          {/*  Introduction to climate fund End */}

          <></>

          <Form.Item
            className="full-width-form-item highlight-label"
            label={`12. ${t('projectProposal:slcssProjectDetails')}`}
            name="slcssProjectDetails"
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
                      `${t('projectProposal:slcssProjectDetails')} ${t('isRequired')}`
                    );
                  }
                },
              },
            ]}
          >
            <TextArea rows={4} disabled={disableFields} />
          </Form.Item>

          <section className="mg-top-2" style={{ marginBottom: '48px' }}>
            <h4 className="section-title">{t('projectProposal:documentInfo')}</h4>
            <Row className="mg-top-1" justify={'space-between'}>
              <>
                <Col md={4} xl={4} className="section-title">
                  {t('projectProposal:documentTitleLabel')}
                </Col>
                <Col md={18} xl={18} className="section-title">
                  {t('projectProposal:documentTitle')}
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  {t('projectProposal:documentNoLabel')}
                </Col>
                <Col md={18} xl={18} className="mg-top-1">
                  SLCCS-PRO-FRM
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  {t('projectProposal:documentTypeLabel')}
                </Col>
                <Col md={18} xl={18} className="mg-top-1">
                  {t('projectProposal:documentType')}
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  {t('projectProposal:businessFunctionLabel')}
                </Col>
                <Col md={18} xl={18} className="mg-top-1">
                  {t('projectProposal:businessFunction')}
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  {t('projectProposal:versionLabel')}
                </Col>
                <Col md={18} xl={18} className="mg-top-1">
                  02.1
                </Col>
              </>
            </Row>

            <h4 className="section-title mg-top-2"> {t('projectProposal:revisionLabel')}</h4>
            <Row className="mg-top-1" justify={'space-between'}>
              <>
                <Col md={4} xl={4} className="section-title">
                  {t('projectProposal:versionLabel')}
                </Col>
                <Col md={6} xl={6} className="section-title">
                  {t('projectProposal:dateLabel')}
                </Col>
                <Col md={12} xl={12} className="section-title">
                  {t('projectProposal:descriptionLabel')}
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  01.0
                </Col>
                <Col md={6} xl={6} className="mg-top-1">
                  21-08-2019
                </Col>
                <Col md={12} xl={12} className="mg-top-1">
                  Initial Issuance
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  02.0
                </Col>
                <Col md={6} xl={6} className="mg-top-1">
                  26-05-2021
                </Col>
                <Col md={12} xl={12} className="mg-top-1">
                  Editorial changes
                </Col>
              </>
              <>
                <Col md={4} xl={4} className="mg-top-1">
                  02.1
                </Col>
                <Col md={6} xl={6} className="mg-top-1">
                  13-01-2023
                </Col>
                <Col md={12} xl={12} className="mg-top-1">
                  Revisions to:
                  <ul>
                    <li>Change the official address of the company on the front page.</li>
                  </ul>
                </Col>
              </>
            </Row>
          </section>

          <Row justify={'end'} className="step-actions-end">
            {isView ? (
              <>
                <Button danger size={'large'} onClick={navigateToDetailsPage}>
                  Back
                </Button>
              </>
            ) : (
              <>
                <Button danger size={'large'} onClick={navigateToDetailsPage}>
                  Cancel
                </Button>
                <Button type="primary" size={'large'} htmlType="submit">
                  submit
                </Button>
              </>
            )}
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default ProjectProposalComponent;
