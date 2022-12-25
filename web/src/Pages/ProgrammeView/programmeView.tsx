import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Progress, Tag, Steps, message, Skeleton } from 'antd';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './programmeView.scss';
import { isBase64 } from '../../Components/ProfileIcon/profile.icon';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import InfoView from '../../Components/InfoView/info.view';
import {
  BlockOutlined,
  BuildOutlined,
  BulbOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  LikeOutlined,
  PlusOutlined,
  PushpinOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import {
  getFinancialFields,
  getGeneralFields,
  getStageEnumVal,
  getStageTagType,
  Programme,
  ProgrammeStage,
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

mapboxgl.accessToken =
  '';

const ProgrammeView = () => {
  const { get } = useConnection();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<Programme>();
  const [historyData, setHistoryData] = useState<any>([]);
  const { i18n, t } = useTranslation(['view']);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const mapContainerRef = useRef(null);

  const getProgrammeHistory = async (programmeId: number) => {
    setLoadingHistory(true);
    try {
      const response: any = await get(`programme/getHistory?programmeId=${programmeId}`);

      const activityList: any[] = [];
      for (const activity of response.data) {
        let el = undefined;
        if (activity.data.currentStage === 'AwaitingAuthorization') {
          el = {
            title: 'Programme Created',
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was estimated ${activity.data.creditEst} Credits`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: ViewBGColor, color: ViewColor }}
              >
                <PlusOutlined />
              </span>
            ),
          };
        } else if (activity.data.currentStage === 'Issued') {
          el = {
            title: `Programme Authorised by ${activity.data.txRef.substring(
              activity.data.txRef.indexOf('#') + 1
            )}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was issued ${Number(activity.data.creditIssued)
              .toFixed(0)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} Credits with the Serial Number ${
              activity.data.serialNo
            }`,
            icon: (
              <span className="step-icon" style={{ backgroundColor: GovBGColor, color: GovColor }}>
                <LikeOutlined />
              </span>
            ),
          };
          // Issued = 'Issued',
          // Rejected = 'Rejected',
          // Retired = 'Retired',
          // Transferred = 'Transferred',
        } else if (activity.data.currentStage === 'Rejected') {
          el = {
            title: `Programme Rejected by ${activity.data.txRef.substring(
              activity.data.txRef.indexOf('#') + 1
            )}`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `The programme was rejected`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: RootBGColor, color: RootColor }}
              >
                <LikeOutlined />
              </span>
            ),
          };
        } else if (activity.data.currentStage === 'Transferred') {
          el = {
            title: `Credit Transferred`,
            subTitle: DateTime.fromMillis(activity.data.txTime).toFormat('dd LLLL yyyy @ HH:mm'),
            description: `${Number(activity.data.creditChange)
              .toFixed(0)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} Credits were transferred`,
            icon: (
              <span
                className="step-icon"
                style={{ backgroundColor: CertBGColor, color: CertColor }}
              >
                <TransactionOutlined />
              </span>
            ),
          };
        } else {
          el = {
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
    }
    {
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
        <div className="body-title">{t('view:details')}</div>
        <div className="body-sub-title">{t('view:desc')}</div>
      </div>
      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={10}>
            <Card className="card-container centered-card">{elements}</Card>
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">{<BlockOutlined />}</span>
                  <span className="title-text">{t('view:credits')}</span>
                </div>
                <div className="map-content">
                  <Chart
                    options={{
                      labels: ['Issued', 'Transferred', 'Balance', 'Frozen', 'Retired'],
                      legend: {
                        position: 'bottom',
                      },
                      colors: ['#FFB480', '#D2FDBB', '#CDCDCD', '#FF8183', '#6ACDFF'],
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
                    series={[
                      Number(data.creditIssued),
                      Number(data.creditTransferred),
                      Number(data.creditBalance),
                      0,
                      0,
                    ]}
                    type="donut"
                    width="100%"
                    fontFamily="inter"
                  />
                </div>
              </div>
            </Card>
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
    </div>
  );
};

export default ProgrammeView;
