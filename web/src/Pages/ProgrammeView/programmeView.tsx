import { useState, useEffect, useRef } from 'react';
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
} from 'antd';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './programmeView.scss';
import { isBase64 } from '../../Components/ProfileIcon/profile.icon';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import InfoView from '../../Components/InfoView/info.view';
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
  SafetyOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import {
  addCommSep,
  addSpaces,
  CompanyRole,
  getFinancialFields,
  getGeneralFields,
  getRetirementTypeString,
  getStageEnumVal,
  getStageTagType,
  Programme,
  ProgrammeStage,
  TxType,
  TypeOfMitigation,
  UnitField,
} from '../../Definitions/InterfacesAndType/programme.definitions';
import i18next from 'i18next';
import RoleIcon from '../../Components/RoleIcon/role.icon';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
  RootBGColor,
  RootColor,
  ViewBGColor,
  ViewColor,
} from '../Common/role.color.constants';
import { DateTime } from 'luxon';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding';
import TextArea from 'antd/lib/input/TextArea';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { HandThumbsUp, ShieldCheck } from 'react-bootstrap-icons';
import { creditUnit, dateFormat, dateTimeFormat } from '../Common/configs';
import ProgrammeIssueForm from '../../Components/Models/ProgrammeIssueForm';
import ProgrammeTransferForm from '../../Components/Models/ProgrammeTransferForm';
import ProgrammeRetireForm from '../../Components/Models/ProgrammeRetireForm';
import ProgrammeRevokeForm from '../../Components/Models/ProgrammeRevokeForm';

mapboxgl.accessToken =
  '';

const ProgrammeView = () => {
  const { get, put, post } = useConnection();

  const { userInfoState } = useUserContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<Programme>();
  const [historyData, setHistoryData] = useState<any>([]);
  const { i18n, t } = useTranslation(['view']);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const mapContainerRef = useRef(null);
  const [openModal, setOpenModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [comment, setComment] = useState<any>(undefined);
  const [certs, setCerts] = useState<any>([]);
  const [certTimes, setCertTimes] = useState<any>({});
  const [retireReason, setRetireReason] = useState<any>();

  const showModal = () => {
    setOpenModal(true);
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

  const addCommasToNumber = (value: any) => {
    return Number(value)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const numIsExist = (n: any) => {
    return n ? Number(n) : 0;
  };

  const getPieChartData = (d: Programme) => {
    const frozen = d.creditFrozen
      ? d.creditFrozen.reduce((a, b) => numIsExist(a) + numIsExist(b), 0)
      : 0;
    const dt = [
      numIsExist(d.creditEst) - numIsExist(d.creditIssued),
      numIsExist(d.creditIssued) -
        numIsExist(d.creditTransferred) -
        numIsExist(d.creditRetired) -
        frozen,
      numIsExist(d.creditTransferred),
      numIsExist(d.creditRetired),
      frozen,
    ];
    return dt;
  };
  const genPieData = (d: Programme) => {
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
              <img src={'data:image/jpeg;base64,' + cert.logo} />
            ) : cert.logo ? (
              <img src={cert.logo} />
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

  const getProgrammeHistory = async (programmeId: number) => {
    setLoadingHistory(true);
    try {
      const response: any = await get(`national/programme/getHistory?programmeId=${programmeId}`);

      const certifiedTime: any = {};
      const activityList: any[] = [];
      for (const activity of response.data) {
        let el = undefined;
        if (activity.data.txType === TxType.CREATE) {
          el = {
            status: 'process',
            title: 'Programme Created',
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The programme was created with a valuation of ${addCommasToNumber(
              activity.data.creditEst
            )} ${creditUnit} credits.`,
            icon: (
              <span className="step-icon created-step">
                <Icon.CaretRight />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.AUTH) {
          el = {
            status: 'process',
            title: `Authorised`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The programme was authorised for ${addCommasToNumber(
              activity.data.creditEst
            )} ${creditUnit} credits until ${DateTime.fromMillis(
              activity.data.endTime * 1000
            ).toFormat(dateFormat)} with the Serial Number ${
              activity.data.serialNo
            } by the ${getTxRefValues(activity.data.txRef, 1)} via ${getTxRefValues(
              activity.data.txRef,
              3
            )}`,
            icon: (
              <span className="step-icon auth-step">
                <Icon.ClipboardCheck />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.ISSUE) {
          el = {
            status: 'process',
            title: `Issued`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The programme was issued ${addCommasToNumber(
              activity.data.creditChange
            )} ${creditUnit} credits by the ${getTxRefValues(
              activity.data.txRef,
              1
            )} via ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span className="step-icon issue-step">
                <Icon.Award />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REJECT) {
          el = {
            status: 'process',
            title: `Rejected`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The programme was rejected by the ${getTxRefValues(
              activity.data.txRef,
              1
            )} via ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span className="step-icon reject-step">
                <Icon.XOctagon />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.TRANSFER) {
          el = {
            status: 'process',
            title: `Credit Transferred`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `${addCommasToNumber(
              activity.data.creditChange
            )} ${creditUnit} credits of this programme were transferred to ${getTxRefValues(
              activity.data.txRef,
              5
            )} by ${getTxRefValues(activity.data.txRef, 1)} via ${getTxRefValues(
              activity.data.txRef,
              3
            )}`,
            icon: (
              <span className="step-icon transfer-step">
                <Icon.BoxArrowRight />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REVOKE) {
          el = {
            status: 'process',
            title: `Certification Revoked`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The certification of this programme was revoked by ${getTxRefValues(
              activity.data.txRef,
              1
            )} via ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span className="step-icon revoke-step">
                <Icon.ShieldExclamation />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.CERTIFY) {
          el = {
            status: 'process',
            title: `Certified`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `The programme was certified by ${getTxRefValues(
              activity.data.txRef,
              1
            )} via ${getTxRefValues(activity.data.txRef, 3)}`,
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
          el = {
            status: 'process',
            title: `Retired`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `${addCommasToNumber(
              activity.data.creditChange
            )} ${creditUnit} credits of this programme were retired as ${getRetirementTypeString(
              getTxRefValues(activity.data.txRef, 5)
            )?.toLowerCase()} by ${getTxRefValues(activity.data.txRef, 1)} via ${getTxRefValues(
              activity.data.txRef,
              3
            )}`,
            icon: (
              <span className="step-icon retire-step">
                <Icon.Save />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.FREEZE) {
          el = {
            status: 'process',
            title: `Credits freezed`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: `${addCommasToNumber(
              activity.data.creditFrozen.reduce((a: any, b: any) => a + b, 0)
            )} number of credits frozen by ${getTxRefValues(
              activity.data.txRef,
              1
            )} via ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span className="step-icon freeze-step">
                <CloseCircleOutlined />
              </span>
            ),
          };
        } else {
          el = {
            status: 'process',
            title: activity.data.currentStage,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat(dateTimeFormat),
            description: ``,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: RootBGColor, color: RootColor }}
              >
                <LikeOutlined />
              </span>
            ),
          };
        }
        if (el) {
          activityList.unshift(el);
        }
      }

      setHistoryData(activityList);
      setLoadingHistory(false);
      setCertTimes(certifiedTime);
      genCerts(state.record, certifiedTime);
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
  };

  const updateProgrammeData = (response: any) => {
    setData(response.data);
    state.record = response.data;
    navigate('.', { state: { record: response.data } });
    genCerts(response.data, certTimes);
    genPieData(response.data);
  };

  const getSuccessMsg = (response: any, initMsg: string, successMsg: string) => {
    return response.data instanceof Array ? initMsg : successMsg;
  };

  const updateCreditInfo = (response: any) => {
    if (!(response.data instanceof Array) && response.data && data) {
      response.data.company = data.company;
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
      await getProgrammeHistory(Number(data?.programmeId));
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
    } else {
      body = {
        comment: comment,
        programmeId: data?.programmeId,
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
            data!.currentStage = ProgrammeStage.Rejected;
            setData(data);
          }

          setOpenModal(false);
          setComment(undefined);
          error = undefined;
          message.open({
            type: 'success',
            content:
              'Successfully ' +
              (action === 'Reject'
                ? 'rejected'
                : action === 'Authorise'
                ? 'authorised'
                : action === 'Issue'
                ? 'issued'
                : action === 'Certify'
                ? 'certified'
                : action === 'Revoke'
                ? 'revoked'
                : 'retired'),
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

        await getProgrammeHistory(Number(data?.programmeId));

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
    const info: any = {};
    Object.entries(map).forEach(([k, v]) => {
      const text = t('view:' + k);
      if (v instanceof UnitField) {
        info[text + ` (${v.unit})`] = v.value;
      } else {
        info[text] = v;
      }
    });
    return info;
  };

  useEffect(() => {
    console.log(state);

    if (!state) {
      console.log(state);
      navigate('/programmeManagement', { replace: true });
    } else {
      getProgrammeHistory(state.record.programmeId);
      setData(state.record);

      const address = state.record?.programmeProperties.geographicalLocation.join(', ') || '';
      setTimeout(() => {
        Geocoding({ accessToken: mapboxgl.accessToken })
          .forwardGeocode({
            query: address,
            autocomplete: false,
            limit: 1,
          })
          .send()
          .then((response: any) => {
            if (
              !response ||
              !response.body ||
              !response.body.features ||
              !response.body.features.length
            ) {
              console.error('Invalid response:');
              console.error(response);
              return;
            }
            const feature = response.body.features[0];
            if (mapContainerRef.current) {
              const map = new mapboxgl.Map({
                container: mapContainerRef.current || '',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: feature.center,
                zoom: 5,
              });

              const popup = new mapboxgl.Popup().setText(address).addTo(map);

              new mapboxgl.Marker().setLngLat(feature.center).addTo(map).setPopup(popup);

              // map.on('load', () => {
              //   map.addSource('admin-1', {
              //     type: 'vector',
              //     url: 'mapbox://mapbox.boundaries-adm1-v4',
              //     promoteId: 'mapbox_id',
              //   });

              //   map.addLayer(
              //     {
              //       id: 'admin-1-fill',
              //       type: 'fill',
              //       source: 'admin-1',
              //       'source-layer': 'boundaries_admin_1',
              //       paint: {
              //         'fill-color': '#CCCCCC',
              //         'fill-opacity': 0.5,
              //       },
              //     },
              //     // This final argument indicates that we want to add the Boundaries layer
              //     // before the `waterway-label` layer that is in the map from the Mapbox
              //     // Light style. This ensures the admin polygons are rendered below any labels
              //     'waterway-label'
              //   );
              // });
            }
          });
      }, 1000);
    }
  }, []);

  if (!data) {
    return <div></div>;
  }

  const pieChartData = getPieChartData(data);
  const percentages: any[] = [];
  data.company.forEach((obj: any, index: number) => {
    percentages.push({
      company: obj,
      percentage: data.proponentPercentage ? data.proponentPercentage[index] : 100,
    });
  });
  percentages.sort((a: any, b: any) => b.percentage - a.percentage);

  const elements = percentages.map((ele: any, index: number) => {
    return (
      <div className="">
        <div className="company-info">
          {isBase64(ele.company.logo) ? (
            <img src={'data:image/jpeg;base64,' + ele.company.logo} />
          ) : ele.company.logo ? (
            <img src={ele.company.logo} />
          ) : ele.company.name ? (
            <div className="programme-logo">{ele.company.name.charAt(0).toUpperCase()}</div>
          ) : (
            <div className="programme-logo">{'A'}</div>
          )}
          <div className="text-center programme-name">{ele.company.name}</div>
          <div className="progress-bar">
            <div>
              <div className="float-left">{t('view:ownership')}</div>
              <div className="float-right">{ele.percentage}%</div>
            </div>
            <Progress percent={ele.percentage} strokeWidth={7} status="active" showInfo={false} />
          </div>
        </div>
      </div>
    );
  });
  // genCerts(data);
  const actionBtns = [];

  if (userInfoState?.userRole !== 'ViewOnly') {
    if (data.currentStage.toString() === 'AwaitingAuthorization') {
      if (userInfoState?.companyRole === CompanyRole.GOVERNMENT) {
        actionBtns.push(
          <Button
            danger
            onClick={() => {
              setActionInfo({
                action: 'Reject',
                text: t('view:popupText'),
                type: 'danger',
                title: `${t('view:rejectTitle')} - ${data.title}?`,
                remark: true,
                icon: <Icon.ClipboardX />,
              });
              showModal();
            }}
          >
            {t('view:reject')}
          </Button>
        );
        actionBtns.push(
          <Button
            type="primary"
            onClick={() => {
              setActionInfo({
                action: 'Authorise',
                text: t('view:popupText'),
                title: `${t('view:authTitle')} - ${data.title}?`,
                type: 'primary',
                remark: false,
                icon: <Icon.ClipboardCheck />,
                contentComp: (
                  <ProgrammeIssueForm
                    enableIssue={false}
                    programme={data}
                    subText={t('view:popupText')}
                    onCancel={() => {
                      setOpenModal(false);
                      setComment(undefined);
                    }}
                    actionBtnText={t('view:authorise')}
                    onFinish={(body: any) =>
                      onPopupAction(
                        body,
                        'authorize',
                        t('view:successAuth'),
                        put,
                        updateProgrammeData
                      )
                    }
                  />
                ),
              });
              showModal();
            }}
          >
            {t('view:authorise')}
          </Button>
        );
      }
    } else if (
      data.currentStage.toString() !== ProgrammeStage.Rejected &&
      Number(data.creditEst) > Number(data.creditIssued)
    ) {
      if (userInfoState?.companyRole === CompanyRole.GOVERNMENT) {
        if (Number(data.creditEst) > Number(data.creditIssued)) {
          actionBtns.push(
            <Button
              type="primary"
              onClick={() => {
                setActionInfo({
                  action: 'Issue',
                  text: t('view:popupText'),
                  title: `${t('view:issueTitle')} - ${data.title}?`,
                  type: 'primary',
                  remark: false,
                  icon: <Icon.Award />,
                  contentComp: (
                    <ProgrammeIssueForm
                      enableIssue={true}
                      programme={data}
                      subText={t('view:popupText')}
                      onCancel={() => {
                        setOpenModal(false);
                        setComment(undefined);
                      }}
                      actionBtnText={t('view:issue')}
                      onFinish={(body: any) =>
                        onPopupAction(
                          body,
                          'issue',
                          t('view:successIssue'),
                          put,
                          updateProgrammeData
                        )
                      }
                    />
                  ),
                });
                showModal();
              }}
            >
              {t('view:issue')}
            </Button>
          );
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
    //         {t('view:retire')}
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
    //     {t('view:Transfer')}
    //   </Button>
    // );
    // }

    if (
      userInfoState &&
      data.certifier &&
      userInfoState?.companyRole === CompanyRole.CERTIFIER &&
      !data.certifier.map((e) => e.companyId).includes(userInfoState?.companyId)
    ) {
      actionBtns.push(
        <Button
          type="primary"
          onClick={() => {
            setActionInfo({
              action: 'Certify',
              text: ``,
              title: `${t('view:certifyTitle')} - ${data.title}?`,
              type: 'success',
              remark: false,
              icon: <ShieldCheck />,
            });
            showModal();
          }}
        >
          {t('view:certify')}
        </Button>
      );
    }
    if (
      userInfoState &&
      data.certifier &&
      data.certifier.length > 0 &&
      ((userInfoState?.companyRole === CompanyRole.CERTIFIER &&
        data.certifier.map((e) => e.companyId).includes(userInfoState?.companyId)) ||
        userInfoState?.companyRole === CompanyRole.GOVERNMENT)
    ) {
      actionBtns.push(
        <Button
          danger
          onClick={() => {
            setActionInfo({
              action: 'Revoke',
              title: `${t('view:revokeTitle')} - ${data.title}?`,
              text: ``,
              type: 'danger',
              remark: true,
              icon: <Icon.ShieldExclamation />,
              contentComp: (
                <ProgrammeRevokeForm
                  programme={data}
                  subText={t('view:popupText')}
                  onCancel={() => {
                    setOpenModal(false);
                    setComment(undefined);
                  }}
                  actionBtnText={t('view:revoke')}
                  onFinish={(body: any) =>
                    onPopupAction(body, 'revoke', t('view:successRevoke'), put, updateProgrammeData)
                  }
                  showCertifiers={userInfoState.companyRole === CompanyRole.GOVERNMENT}
                />
              ),
            });
            showModal();
          }}
        >
          {t('view:revoke')}
        </Button>
      );
    }
  }

  // }
  const generalInfo: any = {};
  Object.entries(getGeneralFields(data)).forEach(([k, v]) => {
    const text = t('view:' + k);
    if (k === 'currentStatus') {
      generalInfo[text] = (
        <Tag color={getStageTagType(v as ProgrammeStage)}>{getStageEnumVal(v as string)}</Tag>
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
  });

  let calculations;
  if (data.typeOfMitigation === TypeOfMitigation.AGRICULTURE) {
    calculations = data.agricultureProperties;
    if (calculations.landAreaUnit) {
      calculations.landArea = new UnitField(
        data.agricultureProperties.landAreaUnit,
        addCommSep(data.agricultureProperties.landArea)
      );
      // addCommSep(data.agricultureProperties.landArea) +
      // ' ' +
      // data.agricultureProperties.landAreaUnit;
    }
    delete calculations.landAreaUnit;
  } else if (data.typeOfMitigation === TypeOfMitigation.SOLAR) {
    calculations = data.solarProperties;
    if (calculations.energyGenerationUnit) {
      calculations.energyGeneration = new UnitField(
        data.solarProperties.energyGenerationUnit,
        addCommSep(data.solarProperties.energyGeneration)
      );
      // addCommSep(data.solarProperties.energyGeneration) +
      // ' ' +
      // data.solarProperties.energyGenerationUnit;
    } else if (calculations.consumerGroup && typeof calculations.consumerGroup === 'string') {
      calculations.consumerGroup = (
        <Tag color={'processing'}>{addSpaces(calculations.consumerGroup)}</Tag>
      );
    }
    delete calculations.energyGenerationUnit;
  }

  calculations.constantVersion = data.constantVersion;

  return (
    <div className="content-container programme-view">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('view:details')}</div>
          <div className="body-sub-title">{t('view:desc')}</div>
        </div>
        <div className="flex-display action-btns">
          {userInfoState?.userRole !== 'ViewOnly' && actionBtns}
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
                  <span className="title-text">{t('view:programmeOwner')}</span>
                </div>
                <div className="centered-card">{elements}</div>
              </div>
            </Card>
            {data.currentStage !== ProgrammeStage.AwaitingAuthorization ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<BlockOutlined />}</span>
                    <span className="title-text">{t('view:credits')}</span>
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
                          {data.currentStage.toString() === ProgrammeStage.Authorised &&
                            data.creditBalance -
                              (data.creditFrozen
                                ? data.creditFrozen.reduce(
                                    (a, b) => numIsExist(a) + numIsExist(b),
                                    0
                                  )
                                : 0) >
                              0 && (
                              <div>
                                {(userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
                                  data.companyId
                                    .map((e) => Number(e))
                                    .includes(userInfoState!.companyId)) && (
                                  <span>
                                    <Button
                                      danger
                                      onClick={() => {
                                        setActionInfo({
                                          action: 'Retire',
                                          text: t('view:popupText'),
                                          title: t('view:retireTitle'),
                                          type: 'primary',
                                          remark: true,
                                          icon: <Icon.Save />,
                                          contentComp: (
                                            <ProgrammeRetireForm
                                              hideType={
                                                userInfoState?.companyRole !==
                                                CompanyRole.GOVERNMENT
                                              }
                                              myCompanyId={userInfoState?.companyId}
                                              programme={data}
                                              onCancel={() => {
                                                setOpenModal(false);
                                                setComment(undefined);
                                              }}
                                              actionBtnText={t('view:retire')}
                                              onFinish={(body: any) =>
                                                onPopupAction(
                                                  body,
                                                  'retire',
                                                  (response: any) =>
                                                    getSuccessMsg(
                                                      response,
                                                      t('view:successRetireInit'),
                                                      t('view:successRetire')
                                                    ),
                                                  put,
                                                  updateCreditInfo
                                                )
                                              }
                                            />
                                          ),
                                        });
                                        showModal();
                                      }}
                                    >
                                      {t('view:retire')}
                                    </Button>
                                    <Button
                                      type="primary"
                                      onClick={() => {
                                        setActionInfo({
                                          action: 'Send',
                                          text: '',
                                          title: t('view:sendCreditTitle'),
                                          type: 'primary',
                                          remark: true,
                                          icon: <Icon.BoxArrowRight />,
                                          contentComp: (
                                            <ProgrammeTransferForm
                                              companyRole={userInfoState!.companyRole}
                                              receiverLabelText={t('view:to')}
                                              userCompanyId={userInfoState?.companyId}
                                              programme={data}
                                              subText={t('view:popupText')}
                                              onCancel={() => {
                                                setOpenModal(false);
                                                setComment(undefined);
                                              }}
                                              actionBtnText={t('view:send')}
                                              onFinish={(body: any) =>
                                                onPopupAction(
                                                  body,
                                                  'transferRequest',
                                                  (response: any) =>
                                                    getSuccessMsg(
                                                      response,
                                                      t('view:successSendInit'),
                                                      t('view:successSend')
                                                    ),
                                                  post,
                                                  updateCreditInfo
                                                )
                                              }
                                            />
                                          ),
                                        });
                                        showModal();
                                      }}
                                    >
                                      {t('view:send')}
                                    </Button>
                                  </span>
                                )}
                                {(data.companyId.length !== 1 ||
                                  !data.companyId
                                    .map((e) => Number(e))
                                    .includes(userInfoState!.companyId)) && (
                                  <Button
                                    type="primary"
                                    onClick={() => {
                                      setActionInfo({
                                        action: 'Request',
                                        text: '',
                                        title: t('view:transferTitle'),
                                        type: 'primary',
                                        remark: true,
                                        icon: <Icon.BoxArrowInRight />,
                                        contentComp: (
                                          <ProgrammeTransferForm
                                            companyRole={userInfoState!.companyRole}
                                            userCompanyId={userInfoState?.companyId}
                                            receiverLabelText={t('view:by')}
                                            disableToCompany={true}
                                            toCompanyDefault={{
                                              label: userInfoState?.companyName,
                                              value: userInfoState?.companyId,
                                            }}
                                            programme={data}
                                            subText={t('view:popupText')}
                                            onCancel={() => {
                                              setOpenModal(false);
                                              setComment(undefined);
                                            }}
                                            actionBtnText={t('view:request')}
                                            onFinish={(body: any) =>
                                              onPopupAction(
                                                body,
                                                'transferRequest',
                                                t('view:successRequest'),
                                                post,
                                                updateCreditInfo
                                              )
                                            }
                                          />
                                        ),
                                      });
                                      showModal();
                                    }}
                                  >
                                    {t('view:transfer')}
                                  </Button>
                                )}
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
            {data.programmeProperties.programmeMaterials && (
              <Card className="card-container">
                <div className="info-view only-head">
                  <div className="title">
                    <span className="title-icon">{<Icon.Grid />}</span>
                    <span className="title-text">{t('view:programmeMaterial')}</span>
                    <a
                      target="_blank"
                      href={data.programmeProperties.programmeMaterials}
                      className="pull-right link"
                    >
                      {<Icon.Link45deg />}
                    </a>
                  </div>
                </div>
              </Card>
            )}
            {data.programmeProperties.projectMaterial && (
              <Card className="card-container">
                <div className="info-view only-head">
                  <div className="title">
                    <span className="title-icon">{<Icon.FileEarmarkText />}</span>
                    <span className="title-text">{t('view:projectMaterial')}</span>
                    <a
                      target="_blank"
                      href={data.programmeProperties.projectMaterial}
                      className="pull-right link"
                    >
                      {<Icon.Link45deg />}
                    </a>
                  </div>
                </div>
              </Card>
            )}
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(getFinancialFields(data))}
                  title={t('view:financial')}
                  icon={
                    <span className="b-icon">
                      <Icon.Cash />
                    </span>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col md={24} lg={14}>
            <Card className="card-container">
              <div>
                <InfoView data={generalInfo} title={t('view:general')} icon={<BulbOutlined />} />
              </div>
            </Card>
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">{<PushpinOutlined />}</span>
                  <span className="title-text">{t('view:location')}</span>
                </div>
                <div className="map-content">
                  <div className="map-container" ref={mapContainerRef} />
                </div>
              </div>
            </Card>
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(calculations)}
                  title={t('view:calculation')}
                  icon={<BulbOutlined />}
                />
              </div>
            </Card>
            {certs.length > 0 ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<SafetyOutlined />}</span>
                    <span className="title-text">{t('view:certification')}</span>
                  </div>
                  <div className="cert-content">{certs}</div>
                </div>
              </Card>
            ) : (
              <span></span>
            )}
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">{<ClockCircleOutlined />}</span>
                  <span className="title-text">{t('view:timeline')}</span>
                </div>
                <div className="content">
                  {loadingHistory ? (
                    <Skeleton />
                  ) : (
                    <Steps current={0} direction="vertical" items={historyData} />
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
            <div className="form-label remark">
              {t('view:remarks')}
              {actionInfo.remark && <span className="req-ast">*</span>}
            </div>
            <TextArea
              defaultValue={comment}
              rows={2}
              onChange={(v) => setComment(v.target.value)}
            />
            <div>
              <div className="footer-btn">
                <Button
                  onClick={() => {
                    setOpenModal(false);
                    setComment(undefined);
                  }}
                >
                  {t('view:cancel')}
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

export default ProgrammeView;
