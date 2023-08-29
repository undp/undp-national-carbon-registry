import React, { useEffect, useState } from 'react';
import { Col, Row, Card, message, Skeleton, Tag, Tooltip } from 'antd';
import './ndcActionViewComponent.scss';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import * as Icon from 'react-bootstrap-icons';
import Chart from 'react-apexcharts';
import {
  NdcAction,
  DocType,
  DocumentStatus,
  MitigationTypes,
  NdcActionStatus,
  NdcActionTypes,
  ProgrammeStageUnified,
  Role,
  addCommSep,
  addCommSepRound,
  addSpaces,
  getNdcStatusTagType,
  mitigationTypeList,
  InfoView,
  CoBenifitsComponent,
} from '@undp/carbon-library';

export const NdcActionViewComponent = (props: any) => {
  const {
    useUserContext,
    linkDocVisible,
    uploadDocUserPermission,
    useConnection,
    useLocation,
    onNavigateToNdcManagementView,
    translator,
    sdgGoalImages,
  } = props;
  translator.setDefaultNamespace('ndcAction');
  const t = translator.t;
  const { userInfoState } = useUserContext();
  const { post } = useConnection();
  const { state } = useLocation();
  const [ndcActionReportDetails, setNdcActionReportDetails] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
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
        if (response?.data[0]?.currentStage === ProgrammeStageUnified.Authorised) {
          setCanUploadMonitorReport(true);
        }
      }
    } catch (error: any) {
      console.log('Error in getting programme by id', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectReportActions = (reportData: any) => {
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
              <LinkOutlined
                className="common-progress-icon margin-right-1"
                style={{ color: '#3F3A47' }}
              />
            </a>
          )}
        </div>
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
            reportDetails[t('ndcAction:viewMoniteringReport')] = getProjectReportActions(item);
          } else if (item?.url?.includes('VERIFICATION_REPORT')) {
            reportDetails[t('ndcAction:viewVerificationReport')] = getProjectReportActions(item);
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
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.AGRICULTURE &&
      ndcActionDetails?.agricultureProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationLandArea')] =
        addCommSep(ndcActionDetails?.agricultureProperties?.landArea) +
        ndcActionDetails?.agricultureProperties?.landAreaUnit;
    }
    if (
      ndcActionDetails?.typeOfMitigation === MitigationTypes.SOLAR &&
      ndcActionDetails?.solarProperties
    ) {
      mitigationDetails[t('ndcAction:viewMitigationEnergyGeneration')] =
        addCommSep(ndcActionDetails?.solarProperties?.energyGeneration) +
        ndcActionDetails?.solarProperties?.energyGenerationUnit;
      mitigationDetails[t('ndcAction:viewMitigationConsumerGroup')] =
        ndcActionDetails?.solarProperties?.consumerGroup;
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
          <div className="body-sub-title">{t('ndcAction:NdcDetailsViewSubTitle')}</div>
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
                <div>
                  <InfoView
                    data={ndcActionReportDetails}
                    title={t('ndcAction:viewReportsTitle')}
                    icon={<Icon.FileEarmarkText />}
                  />
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
                    useConnection={useConnection}
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
