import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Progress, Tag, Steps, message, Skeleton, Button, Modal } from 'antd';
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
  CompanyRole,
  getFinancialFields,
  getGeneralFields,
  getStageEnumVal,
  getStageTagType,
  Programme,
  ProgrammeStage,
  TxType,
  TypeOfMitigation,
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

mapboxgl.accessToken =
  '';

const ProgrammeView = () => {
  const { get, put } = useConnection();

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
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const genCerts = (d: any, certifiedTime: any) => {
    if (d === undefined) {
      return;
    }
    const c = d.certifierId.map((cert: any) => {
      return (
        <div className="">
          <div className="cert-info">
            {isBase64(cert.logo) ? (
              <img src={'data:image/jpeg;base64,' + cert.logo} />
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
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was created with a valuation of ${addCommasToNumber(
              activity.data.creditEst
            )} credits.`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: ViewBGColor, color: ViewColor }}
              >
                <PlusOutlined />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.ISSUE) {
          el = {
            status: 'process',
            title: `Authorised by ${getTxRefValues(activity.data.txRef, 1)}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was issued ${addCommasToNumber(
              activity.data.creditIssued
            )} Credits with the Serial Number ${activity.data.serialNo}`,
            icon: (
              <span className="step-icon" style={{ backgroundColor: GovBGColor, color: GovColor }}>
                <LikeOutlined />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REJECT) {
          el = {
            status: 'process',
            title: `Rejected by ${getTxRefValues(activity.data.txRef, 1)}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was rejected`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: RootBGColor, color: RootColor }}
              >
                <DislikeOutlined />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.TRANSFER) {
          el = {
            status: 'process',
            title: `Credit Transferred`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `${addCommasToNumber(
              activity.data.creditChange
            )} Credits were transferred to ${getTxRefValues(activity.data.txRef, 1)}`,
            icon: (
              <span className="step-icon" style={{ backgroundColor: DevBGColor, color: DevColor }}>
                <TransactionOutlined />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.REVOKE) {
          el = {
            status: 'process',
            title: `Certification revoked by ${getTxRefValues(activity.data.txRef, 3)}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme certification revoked by ${getTxRefValues(
              activity.data.txRef,
              1
            )} of ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: ViewBGColor, color: ViewColor }}
              >
                <CloseCircleOutlined />
              </span>
            ),
          };
        } else if (activity.data.txType === TxType.CERTIFY) {
          el = {
            status: 'process',
            title: `Certified by ${getTxRefValues(activity.data.txRef, 3)}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was certified by ${getTxRefValues(
              activity.data.txRef,
              1
            )} of ${getTxRefValues(activity.data.txRef, 3)}`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: CertBGColor, color: CertColor }}
              >
                <SafetyOutlined />
              </span>
            ),
          };
          const cid = getTxRefValues(activity.data.txRef, 2);
          if (cid) {
            certifiedTime[cid] = DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy');
          }
        } else {
          el = {
            status: 'process',
            title: activity.data.currentStage,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
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

  const onAction = async (action: string) => {
    try {
      if (actionInfo.action !== 'Transfer') {
        setConfirmLoading(true);
        const response: any = await put(
          `national/programme/${
            actionInfo.action === 'Reject'
              ? 'reject'
              : actionInfo.action === 'Authorise'
              ? 'authorize'
              : actionInfo.action === 'Certify'
              ? 'certify'
              : actionInfo.action === 'Revoke'
              ? 'revoke'
              : 'retire'
          }`,
          {
            comment: comment,
            programmeId: data?.programmeId,
          }
        );
        if (response.statusCode === 200 || response.status === 200) {
          if (!response.data.certifierId) {
            response.data.certifierId = [];
          }

          if (
            actionInfo.action === 'Authorise' ||
            actionInfo.action === 'Certify' ||
            actionInfo.action === 'Revoke'
          ) {
            setData(response.data);
            state.record = response.data;
            navigate('.', { state: { record: response.data } });
            genCerts(response.data, certTimes);
          } else if (actionInfo.action === 'Reject') {
            data!.currentStage = ProgrammeStage.Rejected;
            setData(data);
          }

          setOpenModal(false);
          setComment(undefined);
          message.open({
            type: 'success',
            content:
              'Successfully ' +
              (actionInfo.action === 'Reject'
                ? 'rejected'
                : actionInfo.action === 'Authorise'
                ? 'authorised'
                : actionInfo.action === 'Certify'
                ? 'certified'
                : actionInfo.action === 'Revoke'
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
        }

        await getProgrammeHistory(Number(data?.programmeId));

        setConfirmLoading(false);
      }
    } catch (e: any) {
      message.open({
        type: 'error',
        content: e.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setConfirmLoading(false);
    }
  };

  const mapArrayToi18n = (map: any) => {
    const info: any = {};
    Object.entries(map).forEach(([k, v]) => {
      const text = t('view:' + k);
      info[text] = v;
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

      setTimeout(() => {
        Geocoding({ accessToken: mapboxgl.accessToken })
          .forwardGeocode({
            query: state.record?.programmeProperties.geographicalLocation.join(', ') || '',
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

              new mapboxgl.Marker().setLngLat(feature.center).addTo(map);

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
  const percentages: any[] = [];
  data.companyId.forEach((obj: any, index: number) => {
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
  if (data.currentStage.toString() === 'AwaitingAuthorization') {
    if (userInfoState?.companyRole === CompanyRole.GOVERNMENT) {
      actionBtns.push(
        <Button
          danger
          onClick={() => {
            setActionInfo({
              action: 'Reject',
              text: `You can’t undo this action`,
              type: 'danger',
              remark: true,
              icon: <CloseCircleOutlined />,
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
              text: ``,
              type: 'primary',
              remark: false,
              icon: <LikeOutlined />,
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
    data.currentStage.toString() !== ProgrammeStage.Retired
  ) {
    if (userInfoState && data.companyId.includes(userInfoState?.companyId)) {
      actionBtns.push(
        <Button
          danger
          onClick={() => {
            setActionInfo({
              action: 'Retire',
              text: `You can’t undo this action`,
              type: 'danger',
              remark: true,
              icon: <PoweroffOutlined />,
            });
            showModal();
          }}
        >
          {t('view:retire')}
        </Button>
      );
    } else {
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
    }

    if (userInfoState && userInfoState?.companyRole === CompanyRole.CERTIFIER) {
      if (!data.certifierId.map((e) => e.companyId).includes(userInfoState?.companyId)) {
        actionBtns.push(
          <Button
            type="primary"
            onClick={() => {
              setActionInfo({
                action: 'Certify',
                text: ``,
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
      } else {
        actionBtns.push(
          <Button
            danger
            onClick={() => {
              setActionInfo({
                action: 'Revoke',
                text: ``,
                type: 'danger',
                remark: true,
                icon: <Icon.ShieldExclamation />,
              });
              showModal();
            }}
          >
            {t('view:revoke')}
          </Button>
        );
      }
    }
  }

  const generalInfo: any = {};
  Object.entries(getGeneralFields(data)).forEach(([k, v]) => {
    const text = t('view:' + k);
    if (k === 'currentStatus') {
      generalInfo[text] = (
        <Tag color={getStageTagType(v as ProgrammeStage)}>{getStageEnumVal(v as string)}</Tag>
      );
    } else if (k === 'sector') {
      generalInfo[text] = <Tag color="processing">{v as string}</Tag>;
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
      calculations.landArea =
        data.agricultureProperties.landArea + ' ' + data.agricultureProperties.landAreaUnit;
    }
    delete calculations.landAreaUnit;
  } else if (data.typeOfMitigation === TypeOfMitigation.SOLAR) {
    calculations = data.solarProperties;
    if (calculations.energyGenerationUnit) {
      calculations.energyGeneration =
        data.solarProperties.energyGeneration + ' ' + data.solarProperties.energyGenerationUnit;
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
        <div className="flex-display action-btns">{actionBtns}</div>
      </div>
      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={10}>
            <Card className="card-container centered-card">{elements}</Card>
            {data.creditIssued ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<BlockOutlined />}</span>
                    <span className="title-text">{t('view:credits')}</span>
                  </div>
                  <div className="map-content">
                    <Chart
                      options={{
                        labels: ['Transferred', 'Balance', 'Frozen', 'Retired'],
                        legend: {
                          position: 'bottom',
                        },
                        colors: ['#D2FDBB', '#CDCDCD', '#FF8183', '#6ACDFF'],
                        states: {
                          normal: {
                            filter: {
                              type: 'none',
                              value: 0,
                            },
                          },
                          hover: {
                            filter: {
                              type: 'darken',
                              value: 0.9,
                            },
                          },
                          active: {
                            allowMultipleDataPointsSelection: false,
                            filter: {
                              type: 'darken',
                              value: 0.7,
                            },
                          },
                        },
                        plotOptions: {
                          pie: {
                            donut: {
                              labels: {
                                show: true,
                                total: {
                                  showAlways: true,
                                  show: true,
                                  label: 'Total',
                                  formatter: () => '' + data.creditIssued,
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
                      series={[Number(data.creditTransferred), Number(data.creditBalance), 0, 0]}
                      type="donut"
                      width="100%"
                      fontFamily="inter"
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <div></div>
            )}
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(getFinancialFields(data))}
                  title={t('view:financial')}
                  icon={<BuildOutlined />}
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
            <div>{`Are you sure you want to ${actionInfo.action} the programme - ${data.title}?`}</div>
          </div>
        }
        className={'popup-' + actionInfo.type}
        open={openModal}
        onOk={() => onAction(actionInfo.action)}
        onCancel={() => {
          setOpenModal(false);
          setComment(undefined);
        }}
        okText={actionInfo.action}
        okButtonProps={{ disabled: actionInfo.remark && (!comment || comment.trim() === '') }}
        confirmLoading={confirmLoading}
        cancelText="Cancel"
        width={Math.min(400, window.innerWidth)}
        centered={true}
        destroyOnClose={true}
      >
        <p>{actionInfo.text}</p>
        <div className="form-label remark">
          {'Remarks'}
          {actionInfo.remark && <span className="req-ast">*</span>}
        </div>
        <TextArea defaultValue={comment} rows={2} onChange={(v) => setComment(v.target.value)} />
      </Modal>
    </div>
  );
};

export default ProgrammeView;
