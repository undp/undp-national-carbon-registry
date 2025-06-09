import React, { useEffect, useState } from 'react';
import { Col, Row, Card, message, Skeleton, Tag, Tooltip } from 'antd';
import './ndcActionViewComponent.scss';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  BookOutlined,
} from '@ant-design/icons';
import * as Icon from 'react-bootstrap-icons';
import { NdcAction } from '../../../Definitions/Definitions/ndcAction.definitions';
// import {
//   DocType,
//   DocumentStatus,
//   MitigationSubTypes,
//   MitigationTypes,
//   NdcActionStatus,
//   NdcActionTypes,
//   ProgrammeStageR,
//   Role,
//   addCommSep,
//   addCommSepRound,
//   addSpaces,
//   getNdcStatusTagType,
//   mitigationTypeList,
//   mitigationSubTypeList,
// } from '../../../Definitions';
import { InfoView } from '../../InfoView/info.view';
import { CoBenifitsComponent } from '../../CoBenifits/coBenifits';
import { linkDocVisible, uploadDocUserPermission } from '../../../Utils/documentsPermission';
import moment from 'moment';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { ProgrammeStageR } from '../../../Definitions/Enums/programmeStage.enum';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import { Role } from '../../../Definitions/Enums/role.enum';
import { DocType } from '../../../Definitions/Enums/document.type';
import { NdcActionTypes } from '../../../Definitions/Enums/ndcActionTypes.enum';
import {
  mitigationSubTypeList,
  MitigationSubTypes,
  mitigationTypeList,
  MitigationTypes,
} from '../../../Definitions/Enums/mitigation.types.enum';
import {
  addCommSep,
  addCommSepRound,
  addSpaces,
} from '../../../Definitions/Definitions/programme.definitions';
import {
  getNdcStatusTagType,
  NdcActionStatus,
} from '../../../Definitions/Enums/ndcAction.status.enum';
// import { useConnection, useUserContext } from '../../../Context';

export const NdcActionViewComponent = (props: any) => {
  const { useLocation, onNavigateToNdcManagementView, translator, sdgGoalImages, Chart } = props;
  translator.setDefaultNamespace('ndcAction');
  const t = translator.t;
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const { state } = useLocation();
  const [ndcActionReportDetails, setNdcActionReportDetails] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [monitoringReportData, setMonitoringReportData] = useState<any>();
  const [monitoringReportversion, setMonitoringReportversion] = useState<any>('');
  const [verificationReportData, setVerificationReportData] = useState<any>();
  const [verificationReportVersion, setVerificationReportversion] = useState<any>('');
  const [ndcActionDetails, setNdcActionDetails] = useState<NdcAction>();
  const [coBenifitsComponentDetails, setCoBenifitsComponentnDetails] = useState<any>();
  const [emissionsReductionExpected, setEmissionsReductionExpected] = useState(0);
  const [emissionsReductionAchieved, setEmissionsReductionAchieved] = useState(0);
  const [programmeOwnerId, setProgrammeOwnerId] = useState<any[]>([]);
  const [canUploadMonitorReport, setCanUploadMonitorReport] = useState<boolean>(false);
  const [monitoringReportAccepted, setMonitoringReportAccepted] = useState<boolean>(false);

  const getProgrammeById = async (programmeId: string) => {
    setIsLoading(true);
    try {
      const response: any = await post('national/programme/query', {
        page: 1,
        size: 10,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      if (response?.data?.length > 0) {
        setProgrammeOwnerId(response?.data[0]?.companyId);
        if (response?.data[0]?.currentStage === ProgrammeStageR.Authorised) {
          setCanUploadMonitorReport(true);
        }
      }
    } catch (error: any) {
      console.log('Error in getting programme by id', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectReportActions = (reportData: any, reportVersion: any) => {
    return (
      <Row>
        <div className="icon">
          {reportData?.status === DocumentStatus.ACCEPTED && (
            <CheckCircleOutlined className="common-progress-icon" style={{ color: '#5DC380' }} />
          )}
          {reportData?.status === DocumentStatus.REJECTED && (
            <ExclamationCircleOutlined
              className="common-progress-icon"
              style={{ color: '#FD6F70' }}
            />
          )}
        </div>
        <div className="link mg-left-1">
          {reportData?.url && linkDocVisible(reportData?.status) && (
            <a href={reportData?.url} target="_blank" rel="noopener noreferrer" download>
              <BookOutlined className="common-progress-icon" style={{ color: '#3F3A47' }} />
            </a>
          )}
        </div>
        {reportData?.txTime && (
          <div className="time">
            {moment(parseInt(reportData?.txTime)).format('DD MMMM YYYY @ HH:mm')}
            {' ~ ' + reportVersion}
          </div>
        )}
      </Row>
    );
  };

  const getProjectReports = async () => {
    setIsLoading(true);
    const reportDetails: any = {
      [t('ndcAction:viewMoniteringReport')]: (
        <Tooltip
          arrowPointAtCenter
          placement="top"
          trigger="hover"
          title={
            userInfoState?.userRole === Role.ViewOnly
              ? t('programme:notAuthToUploadDoc')
              : uploadDocUserPermission(userInfoState, DocType.MONITORING_REPORT, programmeOwnerId)
              ? !canUploadMonitorReport && t('programme:programmeNotAuth')
              : t('programme:orgNotAuth')
          }
          overlayClassName="custom-tooltip"
        >
          <FileAddOutlined />
        </Tooltip>
      ),
      [t('ndcAction:viewVerificationReport')]: (
        <Tooltip
          arrowPointAtCenter
          placement="top"
          trigger="hover"
          title={
            userInfoState?.userRole === Role.ViewOnly
              ? t('programme:notAuthToUploadDoc')
              : uploadDocUserPermission(
                  userInfoState,
                  DocType.VERIFICATION_REPORT,
                  programmeOwnerId
                )
              ? !monitoringReportAccepted && t('programme:monitoringRepNotApproved')
              : t('programme:notAuthToUploadDoc')
          }
          overlayClassName="custom-tooltip"
        >
          <FileAddOutlined />
        </Tooltip>
      ),
    };
    try {
      const response: any = await post('national/programme/queryDocs', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'actionId',
            operation: '=',
            value: ndcActionDetails?.id,
          },
        ],
      });
      if (response?.data?.length > 0) {
        response.data.map((item: any) => {
          if (item?.url?.includes('MONITORING_REPORT')) {
            if (item?.status === DocumentStatus.ACCEPTED) {
              setMonitoringReportAccepted(true);
            }
            const versionfull = (item?.url).split('_')[(item?.url).split('_').length - 1];
            const version = versionfull ? versionfull.split('.')[0] : '1';
            const moniteringVersion = version.startsWith('V') ? version : 'V1';
            reportDetails[t('ndcAction:viewMoniteringReport')] = getProjectReportActions(
              item,
              moniteringVersion
            );
            setMonitoringReportData(item);
            setMonitoringReportversion(moniteringVersion);
          } else if (item?.url?.includes('VERIFICATION_REPORT')) {
            const versionfull = (item?.url).split('_')[(item?.url).split('_').length - 1];
            const version = versionfull ? versionfull.split('.')[0] : '1';
            const verificationVersion = version.startsWith('V') ? version : 'V1';
            reportDetails[t('ndcAction:viewVerificationReport')] = getProjectReportActions(
              item,
              verificationVersion
            );
            setVerificationReportData(item);
            setVerificationReportversion(verificationVersion);
          }
        });
      }
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setNdcActionReportDetails(reportDetails);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ndcActionDetails?.id) {
      getProjectReports();
    }
  }, [ndcActionDetails?.id, programmeOwnerId]);

  useEffect(() => {
    if (!state) {
      onNavigateToNdcManagementView();
    } else {
      if (!state.record && state.id) {
        //Get Ndc action details using sction id
      } else if (state.record) {
        getProgrammeById(state?.record?.programmeId);
        setNdcActionDetails(state.record);
        setCoBenifitsComponentnDetails(state?.record?.coBenefitsProperties);
        setEmissionsReductionExpected(
          state.record?.emissionReductionExpected !== null ||
            state.record?.emissionReductionExpected !== undefined
            ? Number(state.record?.emissionReductionExpected)
            : 0
        );
        setEmissionsReductionAchieved(
          state.record?.emissionReductionAchieved !== null ||
            state.record?.emissionReductionAchieved !== undefined
            ? Number(state.record?.emissionReductionAchieved)
            : 0
        );
      }
    }
  }, []);

  const getNdcActionNames = (action: NdcActionTypes) => {
    switch (action) {
      case NdcActionTypes.Adaptation:
        return t('ndcAction:adaptation');
      case NdcActionTypes.Mitigation:
        return t('ndcAction:mitigation');
      case NdcActionTypes.CrossCutting:
        return t('ndcAction:crossCutting');
      case NdcActionTypes.Enablement:
        return t('ndcAction:enablement');
      default:
        return '';
    }
  };

  const ndcActionBasicDetails = {
    [t('ndcAction:viewProgramme')]: ndcActionDetails?.programmeName,
    [t('ndcAction:viewNdcAction')]: getNdcActionNames(ndcActionDetails?.action as NdcActionTypes),
    [t('ndcAction:viewCurrentStatus')]: (
      <Tag
        className="clickable"
        color={getNdcStatusTagType(ndcActionDetails?.status as NdcActionStatus)}
      >
        {addSpaces(ndcActionDetails?.status as string)}
      </Tag>
    ),
  };

  const getNdcActionMitigationDetails = () => {
    const mitigationDetails: any = {};
    mitigationTypeList?.map((type: any) => {
      if (ndcActionDetails?.typeOfMitigation === type.value) {
        mitigationDetails[t('ndcAction:viewMitigationType')] = type.label;
      }
    });
    mitigationSubTypeList?.map((type: any) => {
      if (ndcActionDetails?.subTypeOfMitigation === type.value) {
        mitigationDetails[t('ndcAction:viewMitigationSubType')] = type.label;
      }
    });
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.AGRICULTURE &&
      ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.RICE_CROPS &&
      ndcActionDetails?.agricultureProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationLandArea')] =
        addCommSep(ndcActionDetails?.agricultureProperties?.landArea) +
        ndcActionDetails?.agricultureProperties?.landAreaUnit;
    }
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.AGRICULTURE &&
      ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.SOIL_ENRICHMENT_BIOCHAR &&
      ndcActionDetails?.creditCalculationProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationWeight')] =
        addCommSep(ndcActionDetails?.creditCalculationProperties?.weight) + 't';
    }
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.SOLAR &&
      ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.SOLAR_PHOTOVOLTAICS_PV &&
      ndcActionDetails?.solarProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationEnergyGeneration')] =
        addCommSep(ndcActionDetails?.solarProperties?.energyGeneration) +
        ndcActionDetails?.solarProperties?.energyGenerationUnit;
      mitigationDetails[t('ndcAction:viewMitigationConsumerGroup')] =
        ndcActionDetails?.solarProperties?.consumerGroup;
    }
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.SOLAR &&
      (ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.SOLAR_WATER_PUMPING_OFF_GRID ||
        ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.SOLAR_WATER_PUMPING_ON_GRID) &&
      ndcActionDetails?.creditCalculationProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationEnergyGeneration')] =
        addCommSep(ndcActionDetails?.creditCalculationProperties?.energyGeneration) +
        ndcActionDetails?.creditCalculationProperties?.energyGenerationUnit;
    }

    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.EE_HOUSEHOLDS &&
      ndcActionDetails?.subTypeOfMitigation === MitigationSubTypes.STOVES_HOUSES_IN_NAMIBIA &&
      ndcActionDetails?.creditCalculationProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationNoOfDays')] =
        ndcActionDetails?.creditCalculationProperties?.numberOfDays;
      mitigationDetails[t('ndcAction:viewMitigationNoOfPeople')] =
        ndcActionDetails?.creditCalculationProperties?.numberOfPeopleInHousehold;
    }

    if (ndcActionDetails?.ndcFinancing) {
      mitigationDetails[t('ndcAction:viewMitigationUserEstimatedCredits')] = addCommSep(
        ndcActionDetails.ndcFinancing.userEstimatedCredits
      );
      mitigationDetails[t('ndcAction:viewMitigationSysEstimatedCredits')] = addCommSep(
        ndcActionDetails.ndcFinancing.systemEstimatedCredits
      );
    }
    mitigationDetails[t('ndcAction:viewMethodology')] = ndcActionDetails?.methodology;
    return mitigationDetails;
  };

  const getNdcActionAdaptationDetails = () => {
    const adaptationDetails: any = {};

    if (ndcActionDetails?.adaptationProperties) {
      adaptationDetails[t('ndcAction:viewAdaptationImplementingAgency')] =
        ndcActionDetails.adaptationProperties.implementingAgency;
      adaptationDetails[t('ndcAction:viewAdaptationNationalPlanObjectives')] =
        ndcActionDetails.adaptationProperties.nationalPlanObjectives;
      adaptationDetails[t('ndcAction:viewAdaptationNationalPlanCoverage')] =
        ndcActionDetails.adaptationProperties.nationalPlanCoverage;
      adaptationDetails[t('ndcAction:viewIncludedInNAP')] = ndcActionDetails?.adaptationProperties
        ?.includedInNAP
        ? 'Yes'
        : ndcActionDetails?.adaptationProperties?.includedInNAP === false
        ? 'No'
        : '-';
      adaptationDetails[t('ndcAction:viewGhgEmissionsAvoided')] = ndcActionDetails
        ?.adaptationProperties?.ghgEmissionsAvoided
        ? ndcActionDetails.adaptationProperties.ghgEmissionsAvoided
        : {};
      adaptationDetails[t('ndcAction:viewGhgEmissionsReduced')] = ndcActionDetails
        ?.adaptationProperties?.ghgEmissionsReduced
        ? ndcActionDetails.adaptationProperties.ghgEmissionsReduced
        : {};
    }
    return adaptationDetails;
  };

  const getEnablementProperties = () => {
    const details: any = {};

    if (ndcActionDetails?.enablementProperties) {
      details[t('ndcAction:title')] = ndcActionDetails.enablementProperties?.title;
      details[t('ndcAction:type')] = ndcActionDetails.enablementProperties?.type
        ? ndcActionDetails.enablementProperties?.type.join(', ')
        : '-';
      if (ndcActionDetails.enablementProperties?.report) {
        details[t('ndcAction:report')] = ndcActionDetails.enablementProperties?.report && (
          <a
            href={ndcActionDetails.enablementProperties?.report}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            {ndcActionDetails.enablementProperties?.report}
          </a>
        );
      }
    }
    return details;
  };

  const formatString = (langTag: string, vargs: any[]) => {
    const str = t(langTag);
    const parts = str.split('{}');
    let insertAt = 1;
    for (const arg of vargs) {
      parts.splice(insertAt, 0, arg);
      insertAt += 2;
    }
    return parts.join('');
  };

  return (
    <div className="ndc-details-view content-container">
      <div className="title-bar">
        <div>
          <div className="body-title">
            {t('ndcAction:NdcDetailsViewTitle')}{' '}
            {getNdcActionNames(ndcActionDetails?.action as NdcActionTypes)}
          </div>
        </div>
      </div>
      <div className="content-body">
        <Row gutter={16}>
          {(emissionsReductionAchieved !== 0 || emissionsReductionExpected !== 0) && (
            <Col lg={8} md={24}>
              <Card className="card-container fix-height">
                <div className="info-view">
                  <div className="title">
                    <span className="title-text">
                      {formatString('ndcAction:NdcCreditChartTitle', [])}
                    </span>
                  </div>
                  <div className="map-content">
                    <Chart
                      id={'creditChart'}
                      options={{
                        labels: ['Achieved', 'Pending'],
                        legend: {
                          position: 'bottom',
                        },
                        colors: ['#b3b3ff', '#e0e0eb'],
                        tooltip: {
                          fillSeriesColor: false,
                          enabled: true,
                          y: {
                            formatter: function (value: any) {
                              return addCommSepRound(value);
                            },
                          },
                        },
                        states: {
                          normal: {
                            filter: {
                              type: 'none',
                              value: 0,
                            },
                          },
                          hover: {
                            filter: {
                              type: 'none',
                              value: 0,
                            },
                          },
                          active: {
                            allowMultipleDataPointsSelection: true,
                            filter: {
                              type: 'darken',
                              value: 0.7,
                            },
                          },
                        },
                        stroke: {
                          colors: ['#00'],
                        },
                        plotOptions: {
                          pie: {
                            expandOnClick: false,
                            donut: {
                              size: '75%',
                              labels: {
                                show: true,
                                total: {
                                  showAlways: true,
                                  show: true,
                                  label: 'Expected',
                                  formatter: () => '' + addCommSep(emissionsReductionExpected),
                                },
                              },
                            },
                          },
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        responsive: [
                          {
                            breakpoint: 480,
                            options: {
                              chart: {
                                width: '15vw',
                              },
                              legend: {
                                position: 'bottom',
                              },
                            },
                          },
                        ],
                      }}
                      series={[
                        emissionsReductionAchieved,
                        emissionsReductionExpected - emissionsReductionAchieved,
                      ]}
                      type="donut"
                      fontFamily="inter"
                      height="290px"
                    />
                  </div>
                </div>
              </Card>
            </Col>
          )}
          <Col lg={8} md={24}>
            <Card className="card-container fix-height">
              <div>
                <InfoView
                  data={ndcActionBasicDetails}
                  title={t('ndcAction:viewGeneralTitle')}
                  icon={<Icon.Lightbulb />}
                />
              </div>
            </Card>
          </Col>
          <Col lg={8} md={24}>
            <Skeleton loading={isLoading} active>
              <Card className="card-container fix-height">
                <div className="title">
                  <span className="title-icon">{<Icon.FileEarmarkText />}</span>
                  <span className="title-text">{t('ndcAction:viewReportsTitle')}</span>
                </div>
                <div className="ndc-action-report-body">
                  <div className="report-details">
                    <div className="report-type">
                      <div className="name-time-container">
                        <div
                          className={
                            canUploadMonitorReport && monitoringReportAccepted ? 'name' : 'empty'
                          }
                        >
                          {t('programme:monitoringReport')}
                        </div>
                        {monitoringReportData?.txTime && (
                          <div className="time">
                            {moment(parseInt(monitoringReportData?.txTime)).format(
                              'DD MMMM YYYY @ HH:mm'
                            )}
                            {' ~ ' + monitoringReportversion}
                          </div>
                        )}
                      </div>
                    </div>
                    <Row>
                      <div className="icon">
                        {!monitoringReportData?.url && (
                          <Tooltip
                            arrowPointAtCenter
                            placement="top"
                            trigger="hover"
                            title={
                              userInfoState?.userRole === Role.ViewOnly
                                ? t('programme:notAuthToUploadDoc')
                                : uploadDocUserPermission(
                                    userInfoState,
                                    DocType.MONITORING_REPORT,
                                    programmeOwnerId
                                  )
                                ? !canUploadMonitorReport && t('programme:programmeNotAuth')
                                : t('programme:orgNotAuth')
                            }
                            overlayClassName="custom-tooltip"
                          >
                            <FileAddOutlined />
                          </Tooltip>
                        )}
                      </div>
                      {monitoringReportData?.url && (
                        <>
                          <div className="icon">
                            {monitoringReportData?.status === DocumentStatus.ACCEPTED && (
                              <CheckCircleOutlined
                                className="common-progress-icon"
                                style={{ color: '#5DC380' }}
                              />
                            )}
                            {monitoringReportData?.status === DocumentStatus.REJECTED && (
                              <ExclamationCircleOutlined
                                className="common-progress-icon"
                                style={{ color: '#FD6F70' }}
                              />
                            )}
                          </div>
                          <div className="link mg-left-1">
                            {monitoringReportData?.url &&
                              linkDocVisible(monitoringReportData?.status) && (
                                <a
                                  href={monitoringReportData?.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  <BookOutlined
                                    className="common-progress-icon"
                                    style={{ color: '#3F3A47' }}
                                  />
                                </a>
                              )}
                          </div>
                        </>
                      )}
                    </Row>
                  </div>
                  <div className="report-details">
                    <div className="report-type">
                      <div className="name-time-container">
                        <div
                          className={
                            canUploadMonitorReport && monitoringReportAccepted ? 'name' : 'empty'
                          }
                        >
                          {t('programme:verificationReport')}
                        </div>
                        {verificationReportData?.txTime && (
                          <div className="time">
                            {moment(parseInt(verificationReportData?.txTime)).format(
                              'DD MMMM YYYY @ HH:mm'
                            )}
                            {' ~ ' + verificationReportVersion}
                          </div>
                        )}
                      </div>
                    </div>
                    <Row>
                      <div className="icon">
                        {!verificationReportData?.url && (
                          <Tooltip
                            arrowPointAtCenter
                            placement="top"
                            trigger="hover"
                            title={
                              userInfoState?.userRole === Role.ViewOnly
                                ? t('programme:notAuthToUploadDoc')
                                : uploadDocUserPermission(
                                    userInfoState,
                                    DocType.VERIFICATION_REPORT,
                                    programmeOwnerId
                                  )
                                ? !monitoringReportAccepted &&
                                  t('programme:monitoringRepNotApproved')
                                : t('programme:notAuthToUploadDoc')
                            }
                            overlayClassName="custom-tooltip"
                          >
                            <FileAddOutlined />
                          </Tooltip>
                        )}
                      </div>
                      {verificationReportData?.url && (
                        <>
                          <div className="icon">
                            {verificationReportData?.status === DocumentStatus.ACCEPTED && (
                              <CheckCircleOutlined
                                className="common-progress-icon"
                                style={{ color: '#5DC380' }}
                              />
                            )}
                            {verificationReportData?.status === DocumentStatus.REJECTED && (
                              <ExclamationCircleOutlined
                                className="common-progress-icon"
                                style={{ color: '#FD6F70' }}
                              />
                            )}
                          </div>
                          <div className="link mg-left-1">
                            {verificationReportData?.url &&
                              linkDocVisible(verificationReportData?.status) && (
                                <a
                                  href={verificationReportData?.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  <BookOutlined
                                    className="common-progress-icon"
                                    style={{ color: '#3F3A47' }}
                                  />
                                </a>
                              )}
                          </div>
                        </>
                      )}
                    </Row>
                  </div>
                  {/* <InfoView
                    data={ndcActionReportDetails}
                    title={t("ndcAction:viewReportsTitle")}
                    icon={<Icon.FileEarmarkText />}
                  /> */}
                </div>
              </Card>
            </Skeleton>
          </Col>
        </Row>
        {(ndcActionDetails?.action === NdcActionTypes.Mitigation ||
          ndcActionDetails?.action === NdcActionTypes.CrossCutting) && (
          <Row>
            <Col lg={24} className="gutter-row">
              <Card className="card-container">
                <div>
                  <InfoView
                    data={getNdcActionMitigationDetails()}
                    title={t('ndcAction:viewMitigationTitle')}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}
        {(ndcActionDetails?.action === NdcActionTypes.Adaptation ||
          ndcActionDetails?.action === NdcActionTypes.CrossCutting) && (
          <Row>
            <Col lg={24}>
              <Card className="card-container">
                <div>
                  <InfoView
                    data={getNdcActionAdaptationDetails()}
                    title={t('ndcAction:viewAdaptationTitle')}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}
        {ndcActionDetails?.action === NdcActionTypes.Enablement && (
          <Row>
            <Col lg={24}>
              <Card className="card-container">
                <div>
                  <InfoView data={getEnablementProperties()} title={t('ndcAction:enablement')} />
                </div>
              </Card>
            </Col>
          </Row>
        )}
        {state?.record?.coBenefitsProperties && (
          <Row>
            <Col lg={24}>
              <Card className="card-container">
                <div className="co-benifits-view">
                  <div className="title">{t('ndcAction:coBenefitsSubTitle')}</div>
                  <CoBenifitsComponent
                    viewOnly={true}
                    coBenifitsViewDetails={state?.record?.coBenefitsProperties}
                    sdgGoalImages={sdgGoalImages}
                    translator={translator}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};
