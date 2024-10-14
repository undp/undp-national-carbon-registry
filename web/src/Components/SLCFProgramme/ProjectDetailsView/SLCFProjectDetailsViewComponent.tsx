import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Progress,
  Tag,
  Steps,
  message,
  Skeleton,
  Button,
  Modal,
  Select,
  Radio,
  Space,
  Form,
  Tooltip,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './projectDetailsView.scss';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import * as Icon from 'react-bootstrap-icons';
import {
  BlockOutlined,
  BuildOutlined,
  BulbOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DislikeOutlined,
  ExperimentOutlined,
  IssuesCloseOutlined,
  LikeOutlined,
  PlusOutlined,
  PoweroffOutlined,
  PushpinOutlined,
  QrcodeOutlined,
  SafetyOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import { DateTime } from 'luxon';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding';
import TextArea from 'antd/lib/input/TextArea';
import { ShieldCheck } from 'react-bootstrap-icons';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import {
  addCommSep,
  addCommSepRound,
  getFinancialFields,
  getGeneralFields,
  getGeneralFieldsSl,
  getProgrammeStatus,
  getRetirementTypeString,
  getStageEnumVal,
  getStageTagType,
  getStatusEnumVal,
  ProgrammeSlU,
  ProgrammeU,
  sumArray,
  UnitField,
} from '../../../Definitions/Definitions/programme.definitions';
import {
  MapSourceData,
  MapTypes,
  MarkerData,
} from '../../../Definitions/Definitions/mapComponent.definitions';
import { useSettingsContext } from '../../../Context/SettingsContext/settingsContext';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { Role } from '../../../Definitions/Enums/role.enum';
import { InvestmentBody } from '../../Investment/investmentBody';
import { isBase64 } from '../../IconComponents/ProfileIcon/profile.icon';
import { ProgrammeTransfer } from '../../../Definitions/Entities/programmeTransfer';
import {
  creditUnit,
  dateFormat,
  dateTimeFormat,
} from '../../../Definitions/Definitions/common.definitions';
import { addNdcDesc, TimelineBody } from '../../TimelineBody/timelineBody';
import { RetireType } from '../../../Definitions/Enums/retireType.enum';
import { CreditTransferStage } from '../../../Definitions/Enums/creditTransferStage.enum';
import {
  ProgrammeStageUnified,
  ProgrammeStatus,
} from '../../../Definitions/Enums/programmeStage.enum';
import { TxType } from '../../../Definitions/Enums/TxType.enum';
import { DocType } from '../../../Definitions/Enums/document.type';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import { CompanyState } from '../../../Definitions/Enums/company.state.enum';
import { NdcActionBody } from '../../NdcActions/NdcActionBody/ndcActionBody';
import { Loading } from '../../Loading/loading';
import { OrganisationStatus } from '../../OrganisationStatus/organisationStatus';
import { DevBGColor, DevColor, TooltipColor } from '../../../Styles/role.color.constants';
import { getValidNdcActions, ProgrammeIssueForm } from '../../Models/programmeIssueForm';
import { ProgrammeRevokeForm } from '../../Models/programmeRevokeForm';
import { CarbonSystemType } from '../../../Definitions/Enums/carbonSystemType.enum';
import { RoleIcon } from '../../IconComponents/RoleIcon/role.icon';
import { ProgrammeRetireForm } from '../../Models/programmeRetireForm';
import { ProgrammeTransferForm } from '../../Models/programmeTransferForm';
import { InfoView } from '../../InfoView/info.view';
import { ProgrammeDocuments } from '../../ProgrammeDocuments/programmeDocuments';
import { MapComponent } from '../../Maps/mapComponent';

const SLCFProjectDetailsViewComponent = (props: any) => {
  const { onNavigateToProgrammeView, translator } = props;
  const { get, put, post } = useConnection();

  const { userInfoState } = useUserContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<ProgrammeSlU>();
  const [historyData, setHistoryData] = useState<any>([]);
  const [investmentHistory, setInvestmentHistory] = useState<any>([]);
  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true);
  const { t, i18n } = useTranslation(['projectDetailsView']);
  const { t: companyProfileTranslations } = useTranslation(['companyProfile']);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [programmeHistoryLoaded, setProgrammeHistoryLoaded] = useState<boolean>(false);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [comment, setComment] = useState<any>(undefined);
  const [certs, setCerts] = useState<any>([]);
  const [certTimes, setCertTimes] = useState<any>({});
  const [retireReason, setRetireReason] = useState<any>();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [centerPoint, setCenterPoint] = useState<number[]>([]);
  const [loadingNDC, setLoadingNDC] = useState<boolean>(true);
  const [ndcActionDocumentData, setNdcActionDocumentData] = useState<any>([]);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [uploadMonitoringReport, setUploadMonitoringReport] = useState<boolean>(false);
  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : 'None';
  const [isAllOwnersDeactivated, setIsAllOwnersDeactivated] = useState(true);
  const { isTransferFrozen, setTransferFrozen } = useSettingsContext();
  const [programmeOwnerId, setProgrammeOwnerId] = useState<any>([]);
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);
  const [curentProgrammeStatus, setCurrentProgrammeStatus] = useState<any>('');
  const [ndcActionHistoryData, setNdcActionHistoryData] = useState<any>([]);
  const [emissionsReductionExpected, setEmissionsReductionExpected] = useState(0);
  const [emissionsReductionAchieved, setEmissionsReductionAchieved] = useState(0);
  const { id } = useParams();
  const [ndcActionDocumentDataLoaded, setNdcActionDocumentDataLoaded] = useState(false);
  const [upcomingTimeLineMonitoringVisible, setUpcomingTimeLineMonitoringVisible] = useState(false);
  const [upcomingTimeLineVerificationVisible, setUpcomingTimeLineVerificationVisible] =
    useState(false);
  const [activityTimelineKey, setActivityTimelineKey] = useState(0);
  const [projectLocationMapSource, setProjectLocationMapSource] = useState<any>();
  const [projectLocationMapLayer, setProjectLocationMapLayer] = useState<any>();
  const [projectLocationMapOutlineLayer, setProjectLocationMapOutlineLayer] = useState<any>();
  const [projectLocationMapCenter, setProjectLocationMapCenter] = useState<number[]>([]);

  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const showModal = () => {
    setOpenModal(true);
  };

  const locationColors = ['#6ACDFF', '#FF923D', '#CDCDCD', '#FF8183', '#B7A4FE'];

  const ministryLevelPermission =
    data &&
    userInfoState?.companyRole === CompanyRole.MINISTRY &&
    ministrySectoralScope.includes(data.sectoralScope) &&
    userInfoState?.userRole !== Role.ViewOnly;

  const getFileName = (filepath: string) => {
    const index = filepath.indexOf('?');
    if (index > 0) {
      filepath = filepath.substring(0, index);
    }
    const lastCharcter = filepath.charAt(filepath.length - 1);
    if (lastCharcter === '/') {
      filepath = filepath.slice(0, -1);
    }
    return filepath.substring(filepath.lastIndexOf('/') + 1);
  };

  const fileItemContent = (filePath: any) => {
    return (
      <Row className="field" key={filePath}>
        <Col span={12} className="field-key">
          <a target="_blank" href={filePath} rel="noopener noreferrer" className="file-name">
            {getFileName(filePath)}
          </a>
        </Col>
        <Col span={12} className="field-value">
          <a target="_blank" href={filePath} rel="noopener noreferrer" className="file-name">
            <Icon.Link45deg style={{ verticalAlign: 'middle' }} />
          </a>
        </Col>
      </Row>
    );
  };

  const getFileContent = (files: any) => {
    if (Array.isArray(files)) {
      return files.map((filePath: any) => {
        return fileItemContent(filePath);
      });
    } else {
      return fileItemContent(files);
    }
  };

  const getTxRefValues = (value: string, position: number, sep?: string) => {
    if (sep === undefined) {
      sep = '#';
    }
    const parts = value.split(sep);
    if (parts.length - 1 < position) {
      return null;
    }
    return parts[position];
  };

  const numIsExist = (n: any) => {
    return n ? Number(n) : 0;
  };

  const getPieChartData = (d: ProgrammeSlU) => {
    const frozen = d.creditFrozen ? Number(d.creditFrozen) : 0;
    const dt = [
      Number((numIsExist(d.creditEst) - numIsExist(d.creditIssued)).toFixed(2)),
      Number(
        (numIsExist(d.creditIssued) - d.creditTransferred - d.creditRetired - frozen).toFixed(2)
      ),
      Number(d.creditTransferred),
      Number(d.creditRetired),
      frozen,
    ];
    return dt;
  };

  const getCenter = (list: any[]) => {
    let count = 0;
    let lat = 0;
    let long = 0;
    for (const l of list) {
      if (l === null || l === 'null') {
        continue;
      }
      count += 1;
      lat += l[0];
      long += l[1];
    }
    return [lat / count, long / count];
  };

  const getInvestmentHistory = async (programmeId: string) => {
    setLoadingHistory(true);
    setLoadingInvestment(true);
    try {
      const response: any = await post('national/programme/investmentQuery', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
        extendedProperties: {
          isGetInvestmentHistory: true,
        },
      });
      const investmentHisData = response?.data?.map((item: any) => {
        const investmentData: any = {
          invester: item?.receiver[0]?.name,
          amount: item?.amount,
          createdAt: item?.createdTime,
          type: item?.type,
          level: item?.level,
          stream: item?.stream,
          status: item?.status,
          requestId: item?.requestId,
          sender: item?.sender,
        };
        return investmentData;
      });
      const elArr = investmentHisData?.map((investmentData: any, index: any) => {
        const element = {
          status: 'process',
          title: t('projectDetailsView:investment') + ' - ' + String(investmentData?.requestId), // Extracting the last 3 characters from actionNo
          subTitle: '',
          description: <InvestmentBody data={investmentData} translator={i18n} />,
          icon: (
            <span className="step-icon freeze-step">
              <Icon.Circle />
            </span>
          ),
        };
        return element;
      });
      setInvestmentHistory(elArr);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingHistory(false);
      setLoadingInvestment(false);
    }
  };

  const drawMap = () => {
    setTimeout(async () => {
      if (
        data?.geographicalLocationCoordinates &&
        data.geographicalLocationCoordinates.length > 0
      ) {
        setProjectLocationMapCenter([80.7718, 7.8731]);
        const tempMapSource: any = [];
        const tempLocationLayer: any = [];
        const tempOutlineLayer: any = [];
        data?.geographicalLocationCoordinates?.forEach((location: any, index: number) => {
          const mapSource: MapSourceData = {
            key: `projectLocation-${index}`,
            data: {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: location,
                },
                properties: null,
              },
            },
          };

          tempMapSource.push(mapSource);
          tempLocationLayer.push({
            id: `projectLocationLayer-${index}`,
            type: 'fill',
            source: `projectLocation-${index}`,
            layout: {},
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.5,
            },
          });
          tempOutlineLayer.push({
            id: `projectLocationOutline-${index}`,
            type: 'line',
            source: `projectLocation-${index}`,
            layout: {},
            paint: {
              'line-color': '#000',
              'line-width': 1,
            },
          });
        });

        setProjectLocationMapSource(tempMapSource);
        setProjectLocationMapLayer(tempLocationLayer);
        setProjectLocationMapOutlineLayer(tempOutlineLayer);
      }
    }, 1000);
  };

  const genPieData = (d: ProgrammeSlU) => {
    // ['Authorised', 'Issued', 'Transferred', 'Retired', 'Frozen']

    const dt = getPieChartData(d);
    ApexCharts.exec('creditChart', 'updateSeries', {
      series: dt,
    });
  };
  const genCerts = (d: any, certifiedTime: any) => {
    if (d === undefined) {
      return;
    }
    const c = d.certifier.map((cert: any) => {
      return (
        <div className="">
          <div className="cert-info">
            {isBase64(cert.logo) ? (
              <img alt="certifier logo" src={'data:image/jpeg;base64,' + cert.logo} />
            ) : cert.logo ? (
              <img alt="certifier logo" src={cert.logo} />
            ) : cert.name ? (
              <div className="cert-logo">{cert.name.charAt(0).toUpperCase()}</div>
            ) : (
              <div className="cert-logo">{'A'}</div>
            )}
            <div className="text-center cert-name">{cert.name}</div>
            {certifiedTime[cert.companyId] && (
              <div className="text-center cert-date">{certifiedTime[cert.companyId]}</div>
            )}
          </div>
        </div>
      );
    });
    setCerts(c);
  };

  const getProgrammeById = async (programmeId: string) => {
    try {
      const response: any = await post('national/programmeSl/getProjectById', {
        programmeId: id,
      });
      if (response) {
        setData(response.data);
        navigate('.', { state: { record: response.data } });
      }
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
    setLoadingAll(false);
  };

  const addElement = (e: any, time: number, hist: any) => {
    time = Number(time);
    if (!hist[time]) {
      hist[time] = [];
    }
    hist[time].push(e);
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

  const getTxActivityLog = (transfers: ProgrammeTransfer[], txDetails: any) => {
    const hist: any = {};
    for (const transfer of transfers) {
      txDetails[transfer.requestId!] = transfer;
      const createdTime = Number(transfer.createdTime ? transfer.createdTime : transfer.txTime!);
      let d: any;
      if (!transfer.isRetirement) {
        d = {
          status: 'process',
          title: t('projectDetailsView:tlInitTitle'),
          subTitle: DateTime.fromMillis(createdTime).toFormat(dateTimeFormat),
          description: (
            <TimelineBody
              text={formatString('projectDetailsView:tlInitDesc', [
                addCommSep(transfer.creditAmount),
                creditUnit,
                transfer.sender[0]?.name,
                transfer.receiver[0]?.name,
                transfer.requester[0]?.name,
              ])}
              remark={transfer.comment}
              via={transfer.userName}
              t={t}
            />
          ),
          icon: (
            <span className="step-icon transfer-step">
              <Icon.ClockHistory />
            </span>
          ),
        };
      } else {
        d = {
          status: 'process',
          title: t('projectDetailsView:tlRetInit'),
          subTitle: DateTime.fromMillis(createdTime).toFormat(dateTimeFormat),
          description: (
            <TimelineBody
              text={formatString('projectDetailsView:tlRetInitDesc', [
                addCommSep(
                  transfer.creditAmount
                    ? transfer.retirementType === RetireType.CROSS_BORDER
                      ? transfer.creditAmount -
                        Number(((transfer.omgePercentage * transfer.creditAmount) / 100).toFixed(2))
                      : transfer.creditAmount
                    : transfer.creditAmount
                ),
                creditUnit,
                transfer.sender[0]?.name,
                `${
                  transfer.toCompanyMeta?.countryName
                    ? `to ${transfer.toCompanyMeta?.countryName} `
                    : ''
                }`,
                transfer.retirementType === RetireType.CROSS_BORDER
                  ? 'cross border transfer'
                  : transfer.retirementType === RetireType.LEGAL_ACTION
                  ? 'legal action'
                  : 'other',
                transfer.retirementType === RetireType.CROSS_BORDER && transfer.omgePercentage
                  ? formatString('projectDetailsView:t1RetInitOmgeDesc', [
                      addCommSep(
                        transfer.creditAmount
                          ? ((transfer.omgePercentage * transfer.creditAmount) / 100).toFixed(2)
                          : undefined
                      ),
                    ])
                  : '',
                transfer.requester[0]?.name,
              ])}
              remark={transfer.comment}
              via={transfer.userName}
              t={t}
            />
          ),
          icon: (
            <span className="step-icon retire-step">
              <Icon.ClockHistory />
            </span>
          ),
        };
      }

      addElement(d, createdTime, hist);

      if (
        transfer.status === CreditTransferStage.Rejected ||
        transfer.status === CreditTransferStage.NotRecognised
      ) {
        const dx: any = {
          status: 'process',
          title: t(
            transfer.isRetirement
              ? 'projectDetailsView:tlRetRejectTitle'
              : 'projectDetailsView:tlRejectTitle'
          ),
          subTitle: DateTime.fromMillis(Number(transfer.txTime!)).toFormat(dateTimeFormat),
          description: (
            <TimelineBody
              text={formatString(
                transfer.isRetirement
                  ? 'projectDetailsView:tlTxRetRejectDesc'
                  : 'projectDetailsView:tlTxRejectDesc',
                [
                  addCommSep(transfer.creditAmount),
                  creditUnit,
                  transfer.sender[0]?.name,
                  transfer.isRetirement && transfer.toCompanyMeta?.countryName
                    ? transfer.toCompanyMeta?.countryName
                    : transfer.receiver[0]?.name,
                  transfer.isRetirement ? transfer.receiver[0]?.name : transfer.sender[0]?.name,
                ]
              )}
              remark={transfer.txRef?.split('#')[0]}
              via={transfer.userName}
              t={t}
            />
          ),
          icon: (
            <span
              className={`step-icon ${transfer.isRetirement ? 'retire-step' : 'transfer-step'}`}
            >
              <Icon.XOctagon />
            </span>
          ),
        };
        addElement(dx, Number(transfer.txTime!), hist);
      } else if (transfer.status === CreditTransferStage.Cancelled) {
        const systemCancel = transfer.txRef && transfer.txRef.indexOf('#SUSPEND_AUTO_CANCEL#') >= 0;
        const lowCreditSystemCancel =
          transfer.txRef && transfer.txRef.indexOf('#LOW_CREDIT_AUTO_CANCEL#') >= 0;

        const dx: any = {
          status: 'process',
          title: t(
            transfer.isRetirement
              ? 'projectDetailsView:tlRetCancelTitle'
              : 'projectDetailsView:tlTxCancelTitle'
          ),
          subTitle: DateTime.fromMillis(Number(transfer.txTime!)).toFormat(dateTimeFormat),
          description: (
            <TimelineBody
              text={formatString(
                systemCancel
                  ? 'projectDetailsView:tlTxCancelSystemDesc'
                  : lowCreditSystemCancel
                  ? 'projectDetailsView:tlTxLowCreditCancelSystemDesc'
                  : 'projectDetailsView:tlTxCancelDesc',
                [
                  addCommSep(transfer.creditAmount),
                  creditUnit,
                  transfer.sender[0]?.name,
                  transfer.isRetirement && transfer.toCompanyMeta?.countryName
                    ? transfer.toCompanyMeta.countryName
                    : transfer.receiver[0]?.name,
                  systemCancel
                    ? transfer.txRef?.split('#')[4]
                    : lowCreditSystemCancel
                    ? ''
                    : transfer.requester[0]?.name,
                  transfer.txRef?.split('#')[5],
                ]
              )}
              remark={transfer.txRef?.split('#')[0]}
              via={transfer.userName}
              t={t}
            />
          ),
          icon: (
            <span
              className={`step-icon ${transfer.isRetirement ? 'retire-step' : 'transfer-step'}`}
            >
              <Icon.ExclamationOctagon />
            </span>
          ),
        };
        addElement(dx, Number(transfer.txTime!), hist);
      }
    }
    return hist;
  };

  function updatePendingTimeLineForNdc(currentHistory: any) {
    const monitoringElIndex = currentHistory.findIndex(
      (item: any) => item.title === t('projectDetailsView:monitoringEl')
    );
    const verificationElIndex = currentHistory.findIndex(
      (item: any) => item.title === t('projectDetailsView:verificationEl')
    );

    if (
      upcomingTimeLineMonitoringVisible &&
      data?.currentStage !== ProgrammeStageUnified.Rejected
    ) {
      if (monitoringElIndex === -1) {
        const monitoringEl = {
          status: 'process',
          title: t('projectDetailsView:monitoringEl'),
          subTitle: t('projectDetailsView:tlPending'),
          icon: (
            <span className="step-icon upcom-issue-step">
              <Icon.Binoculars />
            </span>
          ),
        };

        if (
          currentHistory.length > 0 &&
          currentHistory[0].title === t('projectDetailsView:tlIssue') &&
          currentHistory[0].subTitle === t('projectDetailsView:tlPending')
        ) {
          currentHistory.splice(1, 0, monitoringEl);
        } else {
          currentHistory.unshift(monitoringEl);
        }
      }
    } else {
      if (monitoringElIndex !== -1) {
        currentHistory.splice(monitoringElIndex, 1);
      }
    }

    if (
      upcomingTimeLineVerificationVisible &&
      data?.currentStage !== ProgrammeStageUnified.Rejected
    ) {
      if (verificationElIndex === -1) {
        const verificationEl = {
          status: 'process',
          title: t('projectDetailsView:verificationEl'),
          subTitle: t('projectDetailsView:tlPending'),
          icon: (
            <span className="step-icon upcom-issue-step">
              <Icon.Flag />
            </span>
          ),
        };

        if (
          currentHistory.length > 0 &&
          currentHistory[0].title === t('projectDetailsView:tlIssue') &&
          currentHistory[0].subTitle === t('projectDetailsView:tlPending')
        ) {
          currentHistory.splice(1, 0, verificationEl);
        } else {
          currentHistory.unshift(verificationEl);
        }
      }
    } else {
      if (verificationElIndex !== -1) {
        currentHistory.splice(verificationElIndex, 1);
      }
    }

    return currentHistory;
  }

  useEffect(() => {
    setActivityTimelineKey((key) => key + 1);
  }, [historyData.length]);

  useEffect(() => {
    if (programmeHistoryLoaded) {
      const updatedHistory = updatePendingTimeLineForNdc(historyData);
      setHistoryData(updatedHistory);
    }
  }, [
    upcomingTimeLineMonitoringVisible,
    upcomingTimeLineVerificationVisible,
    programmeHistoryLoaded,
  ]);

  const getProgrammeHistory = async (programmeId: string) => {
    setLoadingHistory(true);
    try {
      const historyPromise = get(`national/programme/getHistory?programmeId=${programmeId}`);
      const transferPromise = get(
        `national/programme/transfersByProgrammeId?programmeId=${programmeId}`
      );

      const [response, transfers] = await Promise.all([historyPromise, transferPromise]);
      const txDetails: any = {};
      const txList = await getTxActivityLog(transfers.data, txDetails);
      let txListKeys = Object.keys(txList).sort();
      const certifiedTime: any = {};
      const activityList: any[] = [];
      for (const activity of response.data) {
        let programmecreateindex: any;
        const createIndex = activityList.findIndex(
          (item) => item.title === t('projectDetailsView:tlCreate')
        );
        const upcomCreditIndex = activityList.findIndex(
          (item) => item.subTitle === t('projectDetailsView:tlPending')
        );
        const upcomAuthorisationIndex = activityList.findIndex(
          (item) => item.title === 'Authorisation'
        );
        if (createIndex !== -1) {
          programmecreateindex = createIndex;
        }
        let el = undefined;
        let newEl = undefined;
        let creditEl = undefined;
        let upcomingAuthorisation: any;
        const day = Math.floor(
          DateTime.now().diff(DateTime.fromMillis(activity.data.txTime), 'days').days
        );
        if (activity.data.txType === TxType.CREATE) {
          if (day === 1) {
            upcomingAuthorisation = `Awaiting Action : ${day} Day`;
          } else {
            upcomingAuthorisation = `Awaiting Action : ${day} Days`;
          }
          el = {
            status: 'process',
            title: t('projectDetailsView:tlCreate'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody text={formatString('projectDetailsView:tlCreateDesc', [])} t={t} />
            ),
            icon: (
              <span className="step-icon created-step">
                <Icon.CaretRight />
              </span>
            ),
          };
          newEl = {
            status: 'process',
            title: t('projectDetailsView:tlAuthorisation'),
            subTitle: upcomingAuthorisation,
            icon: (
              <span className="step-icon upcom-auth-step">
                <Icon.ClipboardCheck />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.AUTH) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlAuth'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlAuthDesc', [
                  addCommSep(activity.data.creditEst),
                  creditUnit,
                  DateTime.fromMillis(activity.data.endTime * 1000).toFormat(dateFormat),
                  activity.data.serialNo,
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon auth-step">
                <Icon.ClipboardCheck />
              </span>
            ),
          };
          if (upcomAuthorisationIndex !== -1) {
            activityList.splice(upcomAuthorisationIndex, 1);
          }
        } else if (activity.data.txType === TxType.ISSUE) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlIssue'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString(
                  'projectDetailsView:tlIssueDesc',
                  getTxRefValues(activity.data.txRef, 4)
                    ? [
                        addNdcDesc({
                          ndcActions: getTxRefValues(activity.data.txRef, 4),
                          t: t,
                          creditUnit: creditUnit,
                        }),
                        getTxRefValues(activity.data.txRef, 1),
                      ]
                    : [
                        `${addCommSep(activity.data.creditChange)} ${creditUnit} credits`,
                        getTxRefValues(activity.data.txRef, 1),
                      ]
                )}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon issue-step">
                <Icon.Award />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REJECT) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlReject'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlRejectDesc', [
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon reject-step">
                <Icon.XOctagon />
              </span>
            ),
          };
          if (upcomAuthorisationIndex !== -1) {
            activityList.splice(upcomAuthorisationIndex, 1);
          }
          if (upcomCreditIndex !== -1) {
            activityList.splice(upcomCreditIndex, 1);
          }
        } else if (activity.data.txType === TxType.TRANSFER) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlTransfer'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlTransferDesc', [
                  addCommSep(activity.data.creditChange),
                  creditUnit,
                  getTxRefValues(activity.data.txRef, 6),
                  getTxRefValues(activity.data.txRef, 4),
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 9)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon transfer-step">
                <Icon.BoxArrowRight />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REVOKE) {
          const type = getTxRefValues(activity.data.txRef, 4);
          let revokeComp = undefined;
          if (type === 'SUSPEND_REVOKE') {
            revokeComp = getTxRefValues(activity.data.txRef, 5);
          }
          el = {
            status: 'process',
            title: t('projectDetailsView:tlRevoke'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlRevokeDesc', [
                  revokeComp !== undefined ? `due to the deactivation of ${revokeComp}` : '',
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon revoke-step">
                <Icon.ShieldExclamation />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.CERTIFY) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlCertify'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlCertifyDesc', [
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon cert-step">
                <Icon.ShieldCheck />
              </span>
            ),
          };
          const cid = getTxRefValues(activity.data.txRef, 2);
          if (cid) {
            certifiedTime[cid] = DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy');
          }
        } else if (activity.data.txType === TxType.RETIRE) {
          const reqID = getTxRefValues(activity.data.txRef, 7);
          const tx = reqID ? txDetails[reqID!] : undefined;
          const crossCountry = tx ? tx.toCompanyMeta?.countryName : undefined;
          el = {
            status: 'process',
            title: t('projectDetailsView:tlRetire'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlRetireDesc', [
                  addCommSep(
                    tx?.retirementType === RetireType.CROSS_BORDER
                      ? activity.data.creditChange -
                          Number(
                            (
                              (Number(
                                getTxRefValues(activity.data.txRef, 10)
                                  ? getTxRefValues(activity.data.txRef, 10)
                                  : 0
                              ) *
                                activity.data.creditChange) /
                              100
                            ).toFixed(2)
                          )
                      : activity.data.creditChange
                  ),
                  creditUnit,
                  getTxRefValues(activity.data.txRef, 6),
                  `${crossCountry ? 'to ' + crossCountry : ''} `,
                  getRetirementTypeString(tx?.retirementType)?.toLowerCase(),
                  tx?.retirementType === RetireType.CROSS_BORDER &&
                  getTxRefValues(activity.data.txRef, 10)
                    ? formatString('projectDetailsView:t1RetInitOmgeDesc', [
                        addCommSep(
                          (
                            (Number(getTxRefValues(activity.data.txRef, 10)) *
                              activity.data.creditChange) /
                            100
                          ).toFixed(2)
                        ),
                      ])
                    : '',
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 9)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon retire-step">
                <Icon.Save />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.FREEZE) {
          let text;
          if (getTxRefValues(activity.data.txRef, 1)) {
            text = formatString('projectDetailsView:tlFrozenDesc', [
              addCommSep(activity.data.creditChange),
              creditUnit,
              getTxRefValues(activity.data.txRef, 4),
              getTxRefValues(activity.data.txRef, 1),
            ]);
          } else {
            text = formatString('projectDetailsView:tlFrozenDescWithoutUser', [
              addCommSep(activity.data.creditChange),
              creditUnit,
              getTxRefValues(activity.data.txRef, 4),
            ]);
          }
          el = {
            status: 'process',
            title: t('projectDetailsView:tlFrozen'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={text}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon freeze-step">
                <Icon.Stopwatch />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.UNFREEZE) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlUnFrozen'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlUnFrozenDesc', [
                  addCommSep(activity.data.creditChange),
                  creditUnit,
                  getTxRefValues(activity.data.txRef, 4),
                  getTxRefValues(activity.data.txRef, 1),
                ])}
                remark={getTxRefValues(activity.data.txRef, 3)}
                via={activity.data.userName}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon freeze-step">
                <Icon.ArrowCounterclockwise />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.OWNERSHIP_UPDATE) {
          el = {
            status: 'process',
            title: t('projectDetailsView:tlOwnership'),
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: (
              <TimelineBody
                text={formatString('projectDetailsView:tlOwnershipDesc', [
                  getTxRefValues(activity.data.txRef, 1),
                  getTxRefValues(activity.data.txRef, 4) + '%',
                ])}
                t={t}
              />
            ),
            icon: (
              <span className="step-icon issue-step">
                <Icon.PersonAdd />
              </span>
            ),
          };
        }
        if (
          activity.data.creditEst !== activity.data.creditIssued &&
          activity.data.txType !== TxType.REJECT
        ) {
          creditEl = {
            status: 'process',
            title: t('projectDetailsView:tlIssue'),
            subTitle: t('projectDetailsView:tlPending'),
            icon: (
              <span className="step-icon upcom-issue-step">
                <Icon.Award />
              </span>
            ),
          };
          activityList.splice(upcomCreditIndex, 1);
        }
        if (activity.data.creditEst === activity.data.creditIssued) {
          if (upcomCreditIndex !== -1) {
            activityList.splice(upcomCreditIndex, 1);
          }
        }
        if (el) {
          const toDelete = [];
          for (const txT of txListKeys) {
            if (Number(activity.data.txTime) > Number(txT)) {
              activityList.unshift(...txList[txT]);
              toDelete.push(txT);
            } else {
              break;
            }
          }
          toDelete.forEach((e) => delete txList[e]);
          txListKeys = Object.keys(txList).sort();
          activityList.unshift(el);
        }
        if (newEl) {
          const insertIndexauth = Number(programmecreateindex) + 1;
          activityList.splice(insertIndexauth, 0, newEl);
        }
        if (creditEl) {
          activityList.splice(0, 0, creditEl);
        }
      }

      for (const txT of txListKeys) {
        activityList.unshift(...txList[txT]);
      }

      setHistoryData(activityList);
      setProgrammeHistoryLoaded(true);
      setLoadingHistory(false);
      setCertTimes(certifiedTime);
      // genCerts(state.record, certifiedTime);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoadingHistory(false);
    }
    return null;
  };

  const updateProgrammeData = (response: any) => {
    setData(response.data);
    state.record = response.data;
    navigate('.', { state: { record: response.data } });
    genCerts(response.data, certTimes);
    genPieData(response.data);
  };

  const getDocuments = async (programmeId: string) => {
    setNdcActionDocumentDataLoaded(false);
    setLoadingHistory(true);
    setLoadingNDC(true);
    try {
      const response: any = await post('national/programme/queryDocs', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      if (response?.data?.length > 0) {
        const objectsWithoutNullActionId = response?.data.filter(
          (obj: any) => obj.actionId !== null
        );
        const objectsWithNullActionId = response?.data.filter((obj: any) => obj.actionId === null);
        const hasAcceptedMethReport = objectsWithNullActionId?.some(
          (item: any) =>
            item?.type === DocType.METHODOLOGY_DOCUMENT && item?.status === DocumentStatus.ACCEPTED
        );
        if (hasAcceptedMethReport && data?.currentStage === ProgrammeStageUnified.Authorised) {
          setUploadMonitoringReport(true);
        }
        setNdcActionDocumentData(objectsWithoutNullActionId);
        setDocumentsData(response?.data);
        setNdcActionDocumentDataLoaded(true);
      }
    } catch (err: any) {
      console.log('Error in getting documents - ', err);
    } finally {
      setLoadingHistory(false);
      setLoadingNDC(false);
    }
  };

  const getSuccessMsg = (response: any, initMsg: string, successMsg: string) => {
    return response.data instanceof Array ? initMsg : successMsg;
  };

  const updateCreditInfo = (response: any) => {
    if (!(response.data instanceof Array) && response.data && data) {
      // response.data.company = data.company;
      response.data.certifier = data.certifier;
      setData(response.data);
      state.record = response.data;
      navigate('.', { state: { record: response.data } });
      genCerts(response.data, certTimes);
      genPieData(response.data);
    }
  };

  const onPopupAction = async (
    body: any,
    endpoint: any,
    successMsg: any,
    httpMode: any,
    successCB: any
  ) => {
    body.programmeId = data?.programmeId;
    let error;
    try {
      const response: any = await httpMode(`national/programme/${endpoint}`, body);
      if (response.statusCode < 300 || response.status < 300) {
        if (!response.data.certifier) {
          response.data.certifier = [];
        }
        setOpenModal(false);
        setComment(undefined);
        error = undefined;
        successCB(response);
        message.open({
          type: 'success',
          content: typeof successMsg !== 'function' ? successMsg : successMsg(response),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      } else {
        error = response.message;
      }
      await getProgrammeHistory(data?.programmeId as string);
      return error;
    } catch (e: any) {
      error = e.message;
      return error;
    }
  };

  const onAction = async (action: string, body: any = undefined) => {
    let error = undefined;
    if (body) {
      body.programmeId = data?.programmeId;
      body.externalId = data?.externalId;
    } else {
      body = {
        comment: comment,
        programmeId: data?.programmeId,
        externalId: data?.externalId,
      };
    }
    try {
      if (action !== 'Transfer') {
        setConfirmLoading(true);
        const response: any = await put(
          `national/programme/${
            action === 'Reject'
              ? 'reject'
              : action === 'Authorise'
              ? 'authorize'
              : action === 'Certify'
              ? 'certify'
              : action === 'Issue'
              ? 'issue'
              : action === 'Revoke'
              ? 'revoke'
              : 'retire'
          }`,
          body
        );
        if (response.statusCode === 200 || response.status === 200) {
          if (!response.data.certifier) {
            response.data.certifier = [];
          }

          if (
            action === 'Authorise' ||
            action === 'Certify' ||
            action === 'Revoke' ||
            action === 'Issue'
          ) {
            setData(response.data);
            state.record = response.data;
            navigate('.', { state: { record: response.data } });
            genCerts(response.data, certTimes);
            genPieData(response.data);
          } else if (action === 'Reject') {
            data!.currentStage = ProgrammeStageUnified.Rejected;
            setData(data);
          }

          setOpenModal(false);
          setComment(undefined);
          error = undefined;
          message.open({
            type: 'success',
            content:
              action === 'Reject'
                ? t('projectDetailsView:successReject')
                : action === 'Authorise'
                ? t('projectDetailsView:successAuth')
                : action === 'Issue'
                ? 'Successfully issued'
                : action === 'Certify'
                ? 'The programme has been certified successfully '
                : action === 'Revoke'
                ? t('projectDetailsView:successRevokeCertifcate')
                : t('projectDetailsView:successRetire'),
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        } else {
          message.open({
            type: 'error',
            content: response.message,
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
          error = response.message;
        }

        await getProgrammeHistory(data?.programmeId as string);

        setConfirmLoading(false);
        return error;
      }
    } catch (e: any) {
      message.open({
        type: 'error',
        content: e.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setConfirmLoading(false);
      error = e.message;
      return error;
    }
  };

  const mapArrayToi18n = (map: any) => {
    if (!map) {
      return {};
    }
    const info: any = {};
    Object.entries(map).forEach(([k, v]) => {
      if (
        data?.article6trade === true ||
        data?.article6trade === undefined ||
        (data?.article6trade === false && k !== 'carbonPriceUSDPerTon')
      ) {
        const text = t('projectDetailsView:' + k);
        if (v instanceof UnitField) {
          info[text + ` (${v.unit})`] = v.value;
        } else {
          info[text] = v;
        }
      }
    });
    return info;
  };

  const getUserDetails = async () => {
    setLoadingAll(true);
    try {
      const userId = userInfoState?.id ? parseInt(userInfoState.id) : userInfoState?.id;
      const response: any = await post('national/user/query', {
        page: 1,
        size: 10,
        filterAnd: [
          {
            key: 'id',
            operation: '=',
            value: userId,
          },
        ],
      });
      if (response && response.data) {
        if (
          response?.data[0]?.companyRole === CompanyRole.MINISTRY &&
          response?.data[0]?.company &&
          response?.data[0]?.company?.sectoralScope
        ) {
          setMinistrySectoralScope(response?.data[0]?.company?.sectoralScope);
        }
      }
      setLoadingAll(false);
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    // if (state && state.record) {
    //   setLoadingAll(false);
    //   setData(state.record);
    // } else {
    if (id) {
      getProgrammeById(id);
    } else {
      navigate('/programmeManagement/viewAll', { replace: true });
    }
    // }

    if (userInfoState?.companyRole === CompanyRole.MINISTRY) {
      getUserDetails();
    }
  }, []);

  useEffect(() => {
    if (data) {
      getInvestmentHistory(data?.programmeId);
      getProgrammeHistory(data.programmeId);
      getDocuments(data?.programmeId);
      setEmissionsReductionExpected(
        data?.emissionReductionExpected !== null &&
          data?.emissionReductionExpected !== undefined &&
          !isNaN(data?.emissionReductionExpected)
          ? Number(data?.emissionReductionExpected)
          : 0
      );
      setEmissionsReductionAchieved(
        data?.emissionReductionAchieved !== null &&
          data?.emissionReductionAchieved !== undefined &&
          !isNaN(data?.emissionReductionAchieved)
          ? Number(data?.emissionReductionAchieved)
          : 0
      );
      drawMap();
      // for (const company of data.company) {
      //   if (
      //     parseInt(company.state) === CompanyState.ACTIVE.valueOf() &&
      //     company.companyId !== userInfoState?.companyId
      //   ) {
      //     setIsAllOwnersDeactivated(false);
      //     break;
      //   }
      // }
    }
  }, [data]);

  const onClickedAddAction = () => {
    navigate('/programmeManagement/addNdcAction', { state: { record: data } });
  };

  const methodologyDocumentApproved = () => {
    if (data) {
      getProgrammeById(data?.programmeId);
    }
  };

  const getNdcActionHistory = async (programmeId: string, ndcActionDocs: any) => {
    setLoadingHistory(true);
    setLoadingNDC(true);
    try {
      const response: any = await post('national/programme/queryNdcActions', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      const groupedByActionId = response.data.reduce((result: any, obj: any) => {
        const actionId = obj.id;
        if (!result[actionId]) {
          result[actionId] = [];
        }
        result[actionId].push(obj);
        return result;
      }, {});

      ndcActionDocumentData?.map((ndcData: any) => {
        if (Object.keys(groupedByActionId)?.includes(ndcData?.actionId)) {
          if (ndcData?.type === DocType.MONITORING_REPORT) {
            groupedByActionId[ndcData?.actionId][0].monitoringReport = ndcData;
          } else if (ndcData?.type === DocType.VERIFICATION_REPORT) {
            groupedByActionId[ndcData?.actionId][0].verificationReport = ndcData;
          }
        }
      });

      let monitoringVisible = false;
      let verificationVisible = false;
      if (groupedByActionId && ndcActionDocumentDataLoaded) {
        Object.values(groupedByActionId).forEach((element: any) => {
          element.forEach((item: any) => {
            if (!item.monitoringReport) {
              monitoringVisible = true;
            }
            if (!item.verificationReport) {
              verificationVisible = true;
            }
          });
        });

        setUpcomingTimeLineMonitoringVisible(monitoringVisible);
        setUpcomingTimeLineVerificationVisible(verificationVisible);
      }

      const mappedElements = Object.keys(groupedByActionId).map((actionId) => ({
        status: 'process',
        title: actionId,
        subTitle: '',
        description: (
          <NdcActionBody
            data={groupedByActionId[actionId]}
            programmeId={data?.programmeId}
            programmeOwnerId={programmeOwnerId}
            canUploadMonitorReport={uploadMonitoringReport}
            getProgrammeDocs={() => getDocuments(String(data?.programmeId))}
            ministryLevelPermission={ministryLevelPermission}
            translator={translator}
            onFinish={(d: any) => {
              setData(d);
            }}
            programme={data}
          />
        ),
        icon: (
          <span className="step-icon freeze-step">
            <Icon.Circle />
          </span>
        ),
      }));
      setNdcActionHistoryData(mappedElements);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingHistory(false);
      setLoadingNDC(false);
    }
  };

  useEffect(() => {
    if (data) {
      setProgrammeOwnerId(data?.companyId);
      setCurrentProgrammeStatus(data?.currentStage);
      getNdcActionHistory(data?.programmeId, ndcActionDocumentData);
    }
  }, [data, ndcActionDocumentData]);

  if (!data) {
    return <Loading />;
  }

  const pieChartData = getPieChartData(data);
  const percentages: any[] = [];

  percentages.push({
    company: data.company,
    percentage: 100,
  });

  percentages.sort((a: any, b: any) => b.percentage - a.percentage);

  const elements = percentages.map((ele: any, index: number) => {
    return (
      <div className="">
        <div className="company-info">
          {isBase64(ele.company.logo) ? (
            <img alt="company logo" src={'data:image/jpeg;base64,' + ele.company.logo} />
          ) : ele.company.logo ? (
            <img alt="company logo" src={ele.company.logo} />
          ) : ele.company.name ? (
            <div className="programme-logo">{ele.company.name.charAt(0).toUpperCase()}</div>
          ) : (
            <div className="programme-logo">{'A'}</div>
          )}
          <div className="text-center programme-name">{ele.company.name}</div>
          <div className="progress-bar">
            <div>
              <div className="float-left">{t('projectDetailsView:ownership')}</div>
              <div className="float-right">{ele.percentage}%</div>
            </div>
            <Progress percent={ele.percentage} strokeWidth={7} status="active" showInfo={false} />
          </div>
          <OrganisationStatus
            organisationStatus={parseInt(ele.company.state)}
            t={companyProfileTranslations}
          ></OrganisationStatus>
        </div>
      </div>
    );
  });
  // genCerts(data);
  const actionBtns = [];

  if (userInfoState?.userRole !== 'ViewOnly') {
    if (userInfoState && data.currentStage !== ProgrammeStageUnified.Rejected) {
      if (
        userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
        (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
          data?.companyId === userInfoState?.companyId) ||
        ministryLevelPermission
      ) {
        actionBtns.push(
          <Button
            type="primary"
            onClick={() => {
              navigate('/investmentManagement/addInvestment', { state: { record: data } });
            }}
          >
            {t('projectDetailsView:addInvestment')}
          </Button>
        );
        actionBtns.push(
          <Tooltip
            title={'Cannot submit until methodology document is approved.'}
            color={TooltipColor}
            key={TooltipColor}
          >
            <Button disabled>{t('projectDetailsView:addAction')}</Button>
          </Tooltip>
        );
        if (
          (data.currentStage as any) === ProgrammeStageUnified.Authorised ||
          (data.currentStage as any) === ProgrammeStageUnified.Approved
        ) {
          actionBtns.pop();
          actionBtns.push(
            <Button type="primary" onClick={onClickedAddAction}>
              {t('projectDetailsView:addAction')}
            </Button>
          );
        }
      }
    }

    if (
      data.currentStage?.toString() === 'Approved' &&
      (data?.article6trade === true || data?.article6trade === undefined)
    ) {
      if (userInfoState?.companyRole === CompanyRole.GOVERNMENT || ministryLevelPermission) {
        actionBtns.push(
          <Button
            danger
            onClick={() => {
              setActionInfo({
                action: 'Reject',
                text: t('projectDetailsView:popupText'),
                type: 'danger',
                title: `${t('projectDetailsView:rejectTitle')} - ${data.title}?`,
                remark: true,
                icon: <Icon.ClipboardX />,
              });
              showModal();
            }}
          >
            {t('projectDetailsView:reject')}
          </Button>
        );
        actionBtns
          .push
          // <Button
          //   type="primary"
          //   onClick={() => {
          //     setActionInfo({
          //       action: 'Authorise',
          //       text: t('projectDetailsView:popupText'),
          //       title: `${t('projectDetailsView:authTitle')} - ${data.title}?`,
          //       type: 'primary',
          //       remark: false,
          //       icon: <Icon.ClipboardCheck />,
          //       contentComp: (
          //         <ProgrammeIssueForm
          //           enableIssue={false}
          //           programme={data}
          //           subText={t('projectDetailsView:popupText')}
          //           onCancel={() => {
          //             setOpenModal(false);
          //             setComment(undefined);
          //           }}
          //           actionBtnText={t('projectDetailsView:authorise')}
          //           onFinish={(body: any) =>
          //             onPopupAction(
          //               body,
          //               'authorize',
          //               t('projectDetailsView:successAuth'),
          //               put,
          //               updateProgrammeData
          //             )
          //           }
          //           translator={i18n}
          //         />
          //       ),
          //     });
          //     showModal();
          //   }}
          // >
          //   {t('projectDetailsView:authorise')}
          // </Button>
          ();
      }
    } else if (
      data.currentStage?.toString() === ProgrammeStageUnified.Authorised &&
      Number(data.creditEst) > Number(data.creditIssued)
    ) {
      if (userInfoState?.companyRole === CompanyRole.GOVERNMENT || ministryLevelPermission) {
        if (
          Number(data.creditEst) > Number(data.creditIssued) &&
          getValidNdcActions(data).length > 0
        ) {
          actionBtns
            .push
            // <Button
            //   type="primary"
            //   onClick={() => {
            //     setActionInfo({
            //       action: 'Issue',
            //       text: t('projectDetailsView:popupText'),
            //       title: `${t('projectDetailsView:issueTitle')} - ${data.title}?`,
            //       type: 'primary',
            //       remark: false,
            //       icon: <Icon.Award />,
            //       contentComp: (
            //         <ProgrammeIssueForm
            //           enableIssue={true}
            //           programme={data}
            //           subText={t('projectDetailsView:popupText')}
            //           onCancel={() => {
            //             setOpenModal(false);
            //             setComment(undefined);
            //           }}
            //           actionBtnText={t('projectDetailsView:issue')}
            //           onFinish={(body: any) =>
            //             onPopupAction(
            //               body,
            //               'issue',
            //               t('projectDetailsView:successIssue'),
            //               put,
            //               updateProgrammeData
            //             )
            //           }
            //           translator={i18n}
            //           ndcActions={getValidNdcActions(data)}
            //         />
            //       ),
            //     });
            //     showModal();
            //   }}
            // >
            //   {t('projectDetailsView:issue')}
            // </Button>
            ();
        }
      }
    }
    //   if (userInfoState && data.companyId.includes(userInfoState?.companyId)) {
    //     actionBtns.push(
    //       <Button
    //         danger
    //         onClick={() => {
    //           setActionInfo({
    //             action: 'Retire',
    //             text: `You can’t undo this action`,
    //             type: 'danger',
    //             remark: true,
    //             icon: <PoweroffOutlined />,
    //           });
    //           showModal();
    //         }}
    //       >
    //         {t('projectDetailsView:retire')}
    //       </Button>
    //     );
    //   } else {
    // actionBtns.push(
    //   <Button
    //     danger
    //     onClick={() => {
    //       setActionInfo({
    //         action: 'Retire',
    //         text: `You are going to transfer programme ${data.title}`,
    //         type: 'danger',
    //       });
    //       showModal();
    //     }}
    //   >
    //     {t('projectDetailsView:Transfer')}
    //   </Button>
    // );
    // }

    if (
      userInfoState &&
      userInfoState.companyState !== CompanyState.SUSPENDED.valueOf() &&
      data.certifier &&
      userInfoState?.companyRole === CompanyRole.CERTIFIER &&
      !data.certifier.map((e) => e.companyId).includes(userInfoState?.companyId) &&
      data.currentStage.toString() !== ProgrammeStageUnified.Rejected
    ) {
      actionBtns.push(
        <Button
          type="primary"
          onClick={() => {
            setActionInfo({
              action: 'Certify',
              text: ``,
              title: `${t('projectDetailsView:certifyTitle')} - ${data.title}?`,
              type: 'success',
              remark: false,
              icon: <ShieldCheck />,
            });
            showModal();
          }}
        >
          {t('projectDetailsView:certify')}
        </Button>
      );
    }
    if (
      userInfoState &&
      userInfoState.companyState !== CompanyState.SUSPENDED.valueOf() &&
      data.certifier &&
      data.certifier.length > 0 &&
      ((userInfoState?.companyRole === CompanyRole.CERTIFIER &&
        data.certifier.map((e) => e.companyId).includes(userInfoState?.companyId)) ||
        userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
        ministryLevelPermission)
    ) {
      actionBtns
        .push
        // <Button
        //   danger
        //   onClick={() => {
        //     setActionInfo({
        //       action: 'Revoke',
        //       title: `${t('projectDetailsView:revokeTitle')} - ${data.title}?`,
        //       text: ``,
        //       type: 'danger',
        //       remark: true,
        //       icon: <Icon.ShieldExclamation />,
        //       contentComp: (
        //         <ProgrammeRevokeForm
        //           programme={data}
        //           subText={t('projectDetailsView:popupText')}
        //           onCancel={() => {
        //             setOpenModal(false);
        //             setComment(undefined);
        //           }}
        //           actionBtnText={t('projectDetailsView:revoke')}
        //           onFinish={(body: any) =>
        //             onPopupAction(
        //               body,
        //               'revoke',
        //               t('projectDetailsView:successRevokeCertifcate'),
        //               put,
        //               updateProgrammeData
        //             )
        //           }
        //           showCertifiers={
        //             userInfoState.companyRole === CompanyRole.GOVERNMENT ||
        //             userInfoState.companyRole === CompanyRole.MINISTRY
        //           }
        //           translator={i18n}
        //         />
        //       ),
        //     });
        //     showModal();
        //   }}
        // >
        //   {t('projectDetailsView:revoke')}
        // </Button>
        ();
    }
  }

  // }
  const generalInfo: any = {};
  Object.entries(getGeneralFieldsSl(data, CarbonSystemType.UNIFIED)).forEach(([k, v]) => {
    if (
      data?.article6trade === true ||
      data?.article6trade === undefined ||
      (data?.article6trade === false && k !== 'serialNo')
    ) {
      const text = t('projectDetailsView:' + k);
      if (k === 'projectStatus') {
        generalInfo[text] = (
          <Tag color={getProgrammeStatus(v as ProgrammeStatus)}>
            {getStatusEnumVal(v as string)}
          </Tag>
        );
      } else if (k === 'sector') {
        generalInfo[text] = (
          <Tag color={v === 'Agriculture' ? 'success' : 'processing'}>{v as string}</Tag>
        );
      } else if (k === 'applicationType') {
        generalInfo[text] = (
          <span>
            <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
            <span>{v as string}</span>
          </span>
        );
      } else {
        generalInfo[text] = v;
      }
    }
  });

  return loadingAll ? (
    <Loading />
  ) : (
    <div className="content-container programme-view">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('projectDetailsView:details')}</div>
          <div className="body-sub-title">{t('projectDetailsView:desc')}</div>
        </div>
        <div className="flex-display action-btns">
          {userInfoState?.userRole !== 'ViewOnly' &&
            userInfoState?.companyState !== 0 &&
            actionBtns}
        </div>
      </div>
      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={10}>
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">
                    {
                      <span className="b-icon">
                        <Icon.Building />
                      </span>
                    }
                  </span>
                  <span className="title-text">{t('projectDetailsView:programmeOwner')}</span>
                </div>
                <div className="centered-card">{elements}</div>
              </div>
            </Card>
            {getStageEnumVal(data.currentStage) === ProgrammeStageUnified.Authorised ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<BlockOutlined />}</span>
                    <span className="title-text">{t('projectDetailsView:credits')}</span>
                  </div>
                  <div className="map-content">
                    <Chart
                      id={'creditChart'}
                      options={{
                        labels: ['Authorised', 'Issued', 'Transferred', 'Retired', 'Frozen'],
                        legend: {
                          position: 'bottom',
                        },
                        colors: ['#6ACDFF', '#D2FDBB', '#CDCDCD', '#FF8183', '#B7A4FE'],
                        tooltip: {
                          fillSeriesColor: false,
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
                              labels: {
                                show: true,
                                total: {
                                  showAlways: true,
                                  show: true,
                                  label: 'Total',
                                  formatter: () => '' + data.creditEst,
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
                      series={pieChartData}
                      type="donut"
                      width="100%"
                      fontFamily="inter"
                    />
                    {userInfoState?.userRole !== 'ViewOnly' &&
                      userInfoState?.companyRole !== 'Certifier' && (
                        <div className="flex-display action-btns">
                          {data.currentStage.toString() === ProgrammeStageUnified.Authorised &&
                            data.creditBalance - (data.creditFrozen ? data.creditFrozen : 0) > 0 &&
                            !isTransferFrozen && (
                              <div>
                                {/* {(((userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
                                  ministryLevelPermission) &&
                                  !isAllOwnersDeactivated) ||
                                  (data.companyId
                                    .map((e) => Number(e))
                                    .includes(userInfoState!.companyId) &&
                                    userInfoState!.companyState !==
                                      CompanyState.SUSPENDED.valueOf())) && (
                                  <span>
                                    <Button
                                      danger
                                      onClick={() => {
                                        setActionInfo({
                                          action: 'Retire',
                                          text: t('projectDetailsView:popupText'),
                                          title: t('projectDetailsView:retireTitle'),
                                          type: 'primary',
                                          remark: true,
                                          icon: <Icon.Save />,
                                          contentComp: (
                                            <ProgrammeRetireForm
                                              hideType={
                                                userInfoState?.companyRole !==
                                                  CompanyRole.GOVERNMENT &&
                                                userInfoState?.companyRole !== CompanyRole.MINISTRY
                                              }
                                              myCompanyId={userInfoState?.companyId}
                                              programme={data}
                                              onCancel={() => {
                                                setOpenModal(false);
                                                setComment(undefined);
                                              }}
                                              actionBtnText={t('projectDetailsView:retire')}
                                              onFinish={(body: any) =>
                                                onPopupAction(
                                                  body,
                                                  'retire',
                                                  (response: any) =>
                                                    getSuccessMsg(
                                                      response,
                                                      t('projectDetailsView:successRetireInit'),
                                                      t('projectDetailsView:successRetire')
                                                    ),
                                                  put,
                                                  updateCreditInfo
                                                )
                                              }
                                              translator={i18n}
                                            />
                                          ),
                                        });
                                        showModal();
                                      }}
                                    >
                                      {t('projectDetailsView:retire')}
                                    </Button>
                                    <Button
                                      type="primary"
                                      onClick={() => {
                                        setActionInfo({
                                          action: 'Send',
                                          text: '',
                                          title: t('projectDetailsView:sendCreditTitle'),
                                          type: 'primary',
                                          remark: true,
                                          icon: <Icon.BoxArrowRight />,
                                          contentComp: (
                                            <ProgrammeTransferForm
                                              companyRole={userInfoState!.companyRole}
                                              receiverLabelText={t('projectDetailsView:to')}
                                              userCompanyId={userInfoState?.companyId}
                                              programme={data}
                                              subText={t('projectDetailsView:popupText')}
                                              onCancel={() => {
                                                setOpenModal(false);
                                                setComment(undefined);
                                              }}
                                              actionBtnText={t('projectDetailsView:send')}
                                              onFinish={(body: any) =>
                                                onPopupAction(
                                                  body,
                                                  'transferRequest',
                                                  (response: any) =>
                                                    getSuccessMsg(
                                                      response,
                                                      t('projectDetailsView:successSendInit'),
                                                      t('projectDetailsView:successSend')
                                                    ),
                                                  post,
                                                  updateCreditInfo
                                                )
                                              }
                                              translator={i18n}
                                              ministryLevelPermission={ministryLevelPermission}
                                            />
                                          ),
                                        });
                                        showModal();
                                      }}
                                    >
                                      {t('projectDetailsView:send')}
                                    </Button>
                                  </span>
                                )}
                                {((!isAllOwnersDeactivated &&
                                  userInfoState!.companyState !==
                                    CompanyState.SUSPENDED.valueOf() &&
                                  !isTransferFrozen &&
                                  userInfoState?.companyRole !== CompanyRole.MINISTRY) ||
                                  (userInfoState?.companyRole === CompanyRole.MINISTRY &&
                                    ministryLevelPermission)) && (
                                  <Button
                                    type="primary"
                                    onClick={() => {
                                      setActionInfo({
                                        action: 'Request',
                                        text: '',
                                        title: t('projectDetailsView:transferTitle'),
                                        type: 'primary',
                                        remark: true,
                                        icon: <Icon.BoxArrowInRight />,
                                        contentComp: (
                                          <ProgrammeTransferForm
                                            companyRole={userInfoState!.companyRole}
                                            userCompanyId={userInfoState?.companyId}
                                            receiverLabelText={t('projectDetailsView:by')}
                                            disableToCompany={true}
                                            toCompanyDefault={{
                                              label: userInfoState?.companyName,
                                              value: userInfoState?.companyId,
                                            }}
                                            programme={data}
                                            subText={t('projectDetailsView:popupText')}
                                            onCancel={() => {
                                              setOpenModal(false);
                                              setComment(undefined);
                                            }}
                                            actionBtnText={t('projectDetailsView:request')}
                                            onFinish={(body: any) =>
                                              onPopupAction(
                                                body,
                                                'transferRequest',
                                                t('projectDetailsView:successRequest'),
                                                post,
                                                updateCreditInfo
                                              )
                                            }
                                            translator={i18n}
                                          />
                                        ),
                                      });
                                      showModal();
                                    }}
                                  >
                                    {t('projectDetailsView:transfer')}
                                  </Button>
                                )} */}
                              </div>
                            )}
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            ) : (
              <div></div>
            )}
            {(emissionsReductionExpected !== 0 || emissionsReductionAchieved !== 0) && (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<BlockOutlined />}</span>
                    <span className="title-text">
                      {formatString('projectDetailsView:emissionsReductions', [])}
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
                              labels: {
                                show: true,
                                total: {
                                  showAlways: true,
                                  show: true,
                                  label: 'Expected',
                                  formatter: () => '' + addCommSep(data?.emissionReductionExpected),
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
                        Number(
                          (emissionsReductionExpected - emissionsReductionAchieved).toFixed(2)
                        ),
                      ]}
                      type="donut"
                      width="100%"
                      fontFamily="inter"
                    />
                  </div>
                </div>
              </Card>
            )}
            {data?.programmeProperties?.programmeMaterials &&
              data?.programmeProperties?.programmeMaterials.length > 0 && (
                <Card className="card-container">
                  <div className="info-view only-head">
                    <div className="title">
                      <span className="title-icon">{<Icon.Grid />}</span>
                      <span className="title-text">
                        {t('projectDetailsView:programmeMaterial')}
                      </span>
                      <div>{getFileContent(data?.programmeProperties?.programmeMaterials)}</div>
                    </div>
                  </div>
                </Card>
              )}
            {/* {data.programmeProperties.projectMaterial &&
              data.programmeProperties.projectMaterial.length > 0 && (
                <Card className="card-container">
                  <div className="info-view">
                    <div className="title">
                      <span className="title-icon">{<Icon.FileEarmarkText />}</span>
                      <span className="title-text">{t('projectDetailsView:projectMaterial')}</span>
                      <div>{getFileContent(data.programmeProperties.projectMaterial)}</div>
                    </div>
                  </div>
                </Card>
              )} */}
            <Card className="card-container">
              <div>
                {/* <InfoView
                  data={mapArrayToi18n(getFinancialFields(data))}
                  title={t('projectDetailsView:financial')}
                  icon={
                    <span className="b-icon">
                      <Icon.Cash />
                    </span>
                  }
                /> */}
              </div>
            </Card>
            <Card className="card-container">
              <div>
                {/* <ProgrammeDocuments
                  data={documentsData}
                  title={t('projectDetailsView:programmeDocs')}
                  icon={<QrcodeOutlined />}
                  programmeId={data?.programmeId}
                  programmeOwnerId={programmeOwnerId}
                  getDocumentDetails={() => {
                    getDocuments(data?.programmeId);
                  }}
                  getProgrammeById={() => {
                    getProgrammeById(data?.programmeId);
                  }}
                  ministryLevelPermission={ministryLevelPermission}
                  translator={i18n}
                  methodologyDocumentUpdated={methodologyDocumentApproved}
                  programmeStatus={data?.currentStage}
                /> */}
              </div>
            </Card>
          </Col>
          <Col md={24} lg={14}>
            <Card className="card-container">
              <div>
                <InfoView
                  data={generalInfo}
                  title={t('projectDetailsView:general')}
                  icon={<BulbOutlined />}
                />
              </div>
            </Card>
            {data.geographicalLocationCoordinates &&
            data.geographicalLocationCoordinates.length > 0 &&
            mapType !== MapTypes.None ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<Icon.PinMap />}</span>
                    <span className="title-text">{t('projectDetailsView:projectLocation')}</span>
                  </div>
                  <div className="map-content">
                    <MapComponent
                      mapType={mapType}
                      center={projectLocationMapCenter}
                      zoom={6}
                      height={300}
                      style="mapbox://styles/mapbox/light-v11"
                      accessToken={accessToken}
                      mapSource={projectLocationMapSource}
                      layer={projectLocationMapLayer}
                      outlineLayer={projectLocationMapOutlineLayer}
                    ></MapComponent>
                  </div>
                </div>
              </Card>
            ) : (
              ''
            )}
            {certs.length > 0 ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<SafetyOutlined />}</span>
                    <span className="title-text">{t('projectDetailsView:certification')}</span>
                  </div>
                  <div className="cert-content">{certs}</div>
                </div>
              </Card>
            ) : (
              <span></span>
            )}
            {investmentHistory?.length > 0 && (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<ClockCircleOutlined />}</span>
                    <span className="title-text">{t('projectDetailsView:investment')}</span>
                  </div>
                  <div className="content">
                    {loadingInvestment ? (
                      <Skeleton />
                    ) : (
                      <Steps current={0} direction="vertical" items={investmentHistory} />
                    )}
                  </div>
                </div>
              </Card>
            )}
            {ndcActionHistoryData?.length > 0 && (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<ExperimentOutlined />}</span>
                    <span className="title-text">{t('projectDetailsView:ndcActions')}</span>
                  </div>
                  <div className="content">
                    {loadingNDC ? (
                      <Skeleton />
                    ) : (
                      <Steps current={0} direction="vertical" items={ndcActionHistoryData} />
                    )}
                  </div>
                </div>
              </Card>
            )}
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">{<ClockCircleOutlined />}</span>
                  <span className="title-text">{t('projectDetailsView:timeline')}</span>
                </div>
                <div className="content">
                  {loadingHistory ? (
                    <Skeleton />
                  ) : (
                    <Steps
                      key={activityTimelineKey}
                      current={0}
                      direction="vertical"
                      items={historyData}
                    />
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      <Modal
        title={
          <div className="popup-header">
            <div className="icon">{actionInfo.icon}</div>
            <div>{actionInfo.title}</div>
          </div>
        }
        className={'popup-' + actionInfo.type}
        open={openModal}
        width={Math.min(430, window.innerWidth)}
        centered={true}
        footer={null}
        onCancel={() => {
          setOpenModal(false);
          setComment(undefined);
        }}
        destroyOnClose={true}
      >
        {actionInfo.contentComp ? (
          actionInfo.contentComp
        ) : (
          <div>
            <p className="sub-text">{actionInfo.text}</p>
            <Form layout="vertical">
              <Form.Item
                className="mg-bottom-0"
                label={t('projectDetailsView:remarks')}
                name="remarks"
                required={actionInfo.remark}
              >
                <TextArea
                  defaultValue={comment}
                  rows={2}
                  onChange={(v) => setComment(v.target.value)}
                />
              </Form.Item>
            </Form>
            <div>
              <div className="footer-btn">
                <Button
                  onClick={() => {
                    setOpenModal(false);
                    setComment(undefined);
                  }}
                >
                  {t('projectDetailsView:cancel')}
                </Button>
                <Button
                  disabled={actionInfo.remark && (!comment || comment.trim() === '')}
                  type="primary"
                  loading={confirmLoading}
                  onClick={() => onAction(actionInfo.action)}
                >
                  {actionInfo.action}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SLCFProjectDetailsViewComponent;
