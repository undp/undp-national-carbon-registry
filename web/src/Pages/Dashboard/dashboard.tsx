import React, { useEffect, useState } from 'react';
import { Col, DatePicker, Progress, Radio, Row, Skeleton, message } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapCard from '../../Components/MapCards.tsx/MapCard';
import StasticCard from '../../Components/StasticCard/StasticCard';
import './dashboard.scss';
import {
  optionDonutPieA,
  optionDonutPieB,
  seriesY,
  totalProgrammesOptions,
  totalProgrammesOptionsSub,
} from './DUMMY_DATAS';
import ProgrammeRejectAndTransfer from './ProgrammeRejectAndTransfer';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

const { RangePicker } = DatePicker;

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZmFicmljOCIsImEiOiJjaWc5aTV1ZzUwMDJwdzJrb2w0dXRmc2d0In0.p6GGlfyV-WksaDV_KdN27A',
});

const Dashboard = () => {
  const { get, post, delete: del } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingWithoutTimeRange, setLoadingWithoutTimeRange] = useState<boolean>(false);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [pendingProjects, setPendingProjects] = useState<number>(0);
  const [pendingProjectsWithoutTimeRange, setPendingProjectsWithoutTimeRange] = useState<number>(0);
  const [issuedProjects, setIssuedProjects] = useState<number>(0);
  const [rejectedProjects, setRejectedProjects] = useState<number>(0);
  const [transferedProjects, setTransferedProjects] = useState<number>(0);
  const [transfererequestsSent, setTransfererequestsSent] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditBalanceWithoutTimeRange, setCreditBalanceWithoutTimeRange] = useState<number>(0);
  const [creditsPieSeries, setCreditPieSeries] = useState<number[]>([1, 1, 0, 0]);
  const [creditsCertifiedPieSeries, setCreditCertifiedPieSeries] = useState<number[]>([1, 1, 0, 0]);
  const [lastUpdate, setLastUpdate] = useState<any>();

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const [issuedProgrammes, setIssuedProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [rejectedProgrammes, setRejectedProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [pendingProgrammes, setPendingProgrammes] = useState<number[]>([0, 0, 0, 0]);

  // states for totalProgrammes sub sector chart
  const [energyProgrammes, setEnergyProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [healthProgrammes, setHealthProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [educationProgrammes, setEducationProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [transportProgrammes, setTransportProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [manufacturingProgrammes, setManufacturingProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [hospitalityProgrammes, setHospitalityProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [forestryProgrammes, setForestryProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [wasteProgrammes, setWasteProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [agricultureProgrammes, setAgricultureProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [otherProgrammes, setOtherProgrammes] = useState<number[]>([0, 0, 0, 0]);

  const currentYear = new Date();
  const startOfTheYear = Date.parse(String(moment(currentYear).startOf('year')));
  const endOfTheYear = Date.parse(String(moment(currentYear).endOf('year')));
  console.log({ currentYear, startOfTheYear, endOfTheYear });

  const getAllProgrammeAnalyticsStatsParamsWithoutTimeRange = () => {
    return {
      stats: [
        {
          type: 'CREDIT_STATS_BALANCE',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'AWAITING_AUTHORIZATION',
        },
      ],
    };
  };

  const getAllProgrammeAnalyticsStatsParams = () => {
    return {
      stats: [
        {
          type: 'TOTAL_PROGRAMS',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'AWAITING_AUTHORIZATION',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'ISSUED',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'REJECTED',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'TRANSFERRED',
        },
        {
          type: 'TRANSFER_REQUEST',
        },
        {
          type: 'CREDIT_STATS_BALANCE',
        },
        {
          type: 'CREDIT_STATS_TRANSFERRED',
        },
        {
          type: 'CREDIT_STATS_RETIRED',
        },
        {
          type: 'CREDIT_STATS_ISSUED',
        },
        {
          type: 'CREDIT_CERTIFIED_BALANCE',
        },
        {
          type: 'CREDIT_CERTIFIED_TRANSFERRED',
        },
        {
          type: 'CREDIT_CERTIFIED_RETIRED',
        },
        {
          type: 'CREDIT_CERTIFIED_ISSUED',
        },
      ],
      startTime: startTime !== 0 ? startTime : startOfTheYear,
      endTime: endTime !== 0 ? endTime : endOfTheYear,
    };
  };

  const getAllProgrammeAnalyticsStatsChartsParams = () => {
    return {
      stats: [
        {
          type: 'TOTAL_PROGRAMS',
        },
        {
          type: 'TOTAL_PROGRAMS_SECTOR',
        },
      ],
      startTime: startTime !== 0 ? startTime : startOfTheYear,
      endTime: endTime !== 0 ? endTime : endOfTheYear,
    };
  };

  const onChangeRange = (dateMoment: any, dateString: any) => {
    console.log(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))));
    console.log('****', dateString);
    if (!dateMoment) {
      setStartTime(0);
      setEndTime(0);
    }
    if (dateMoment !== null && dateMoment[1] !== null) {
      setStartTime(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))));
      setEndTime(Date.parse(String(moment(dateMoment[1]?._d).endOf('day'))));
    } else {
      setStartTime(0);
      setEndTime(0);
    }
  };

  const onCalendarChange = (dateMoment: any, dateString: any) => {
    console.log(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))));
    console.log('****', dateString);
  };

  const getAllProgrammeAnalyticsStatsCharts = async () => {
    setLoading(true);
    try {
      const pendingProgrames: any = [];
      const issuedProgrames: any = [];
      const rejectedProgrames: any = [];
      const timeLabelsProgrames: any = [];

      const energyProgrames: any = [];
      const healthProgrames: any = [];
      const educationProgrames: any = [];
      const transportProgrames: any = [];
      const manufacturingProgrames: any = [];
      const hospitalityProgrames: any = [];
      const forestryProgrames: any = [];
      const wasteProgrames: any = [];
      const agricultureProgrames: any = [];
      const otherProgrames: any = [];

      const response: any = await post(
        'analytics/programme/chartStats',
        getAllProgrammeAnalyticsStatsChartsParams()
      );
      console.log(response?.data?.stats);
      if (response?.data?.stats?.TOTAL_PROGRAMS) {
        const totalProgrammes = response?.data?.stats?.TOTAL_PROGRAMS;
        if (totalProgrammes?.awaitingAuthorization) {
          const pendings = totalProgrammes?.awaitingAuthorization;
          pendings?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            const label = Object.getOwnPropertyNames(item);
            const date = new Date(parseInt(label[0]));
            const formattedDate = moment(date).format('DD-MM-YYYY');
            pendingProgrames.push(programesCount[0]);
            timeLabelsProgrames.push(formattedDate);
          });
        }
        if (totalProgrammes?.issued) {
          const issued = totalProgrammes?.issued;
          issued?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            issuedProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammes?.rejected) {
          const rejected = totalProgrammes?.rejected;
          rejected?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            rejectedProgrames.push(programesCount[0]);
          });
        }
      }
      if (response?.data?.stats?.TOTAL_PROGRAMS_SECTOR) {
        const totalProgrammesSector = response?.data?.stats?.TOTAL_PROGRAMS_SECTOR;
        if (totalProgrammesSector?.agriculture) {
          const agriculture = totalProgrammesSector?.agriculture;
          agriculture?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            agricultureProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.education) {
          const education = totalProgrammesSector?.education;
          education?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            educationProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.energy) {
          const energy = totalProgrammesSector?.energy;
          energy?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            energyProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.forestry) {
          const forestry = totalProgrammesSector?.forestry;
          forestry?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            forestryProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.health) {
          const health = totalProgrammesSector?.health;
          health?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            healthProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.hospitality) {
          const hospitality = totalProgrammesSector?.hospitality;
          hospitality?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            hospitalityProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.manufacturing) {
          const manufacturing = totalProgrammesSector?.manufacturing;
          manufacturing?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            manufacturingProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.other) {
          const other = totalProgrammesSector?.other;
          other?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            otherProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.transport) {
          const transport = totalProgrammesSector?.transport;
          transport?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            transportProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.waste) {
          const waste = totalProgrammesSector?.waste;
          waste?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            wasteProgrames.push(programesCount[0]);
          });
        }
      }
      console.log({ pendingProgrames, issuedProgrames, rejectedProgrames, timeLabelsProgrames });
      setPendingProgrammes(pendingProgrames);
      setIssuedProgrammes(issuedProgrames);
      setRejectedProgrammes(rejectedProgrames);

      setEnergyProgrammes(energyProgrames);
      setHealthProgrammes(healthProgrames);
      setEducationProgrammes(educationProgrames);
      setTransportProgrammes(transportProgrames);
      setManufacturingProgrammes(manufacturingProgrames);
      setHospitalityProgrammes(hospitalityProgrames);
      setForestryProgrammes(forestryProgrames);
      setWasteProgrammes(wasteProgrames);
      setAgricultureProgrammes(agricultureProgrames);
      setOtherProgrammes(otherProgrames);
      totalProgrammesOptions.xaxis.categories = timeLabelsProgrames;
      totalProgrammesOptionsSub.xaxis.categories = timeLabelsProgrames;
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllProgrammeAnalyticsStatsWithoutTimeRange = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'analytics/programme/stats',
        getAllProgrammeAnalyticsStatsParamsWithoutTimeRange()
      );
      console.log('stats data  -- > ', response?.data);
      setPendingProjectsWithoutTimeRange(response?.data?.stats?.AWAITING_AUTHORIZATION);
      setCreditBalanceWithoutTimeRange(
        parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum)
      );
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingWithoutTimeRange(false);
    }
  };

  const getAllProgrammeAnalyticsStats = async () => {
    setLoading(true);
    const pieSeriesCreditsData: any[] = [];
    const pieSeriesCreditsCerifiedData: any[] = [];
    try {
      const response: any = await post(
        'analytics/programme/stats',
        getAllProgrammeAnalyticsStatsParams()
      );
      console.log('stats data  -- > ', response?.data);
      setPendingProjects(response?.data?.stats?.AWAITING_AUTHORIZATION);
      setIssuedProjects(response?.data?.stats?.ISSUED);
      setRejectedProjects(response?.data?.stats?.REJECTED);
      setTransferedProjects(response?.data?.stats?.TRANSFERRED);
      setTotalProjects(response?.data?.stats?.TOTAL_PROGRAMS);
      setTransfererequestsSent(response?.data?.stats?.TRANSFER_REQUEST);
      setCreditBalance(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_TRANSFERRED?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_RETIRED?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_ISSUED?.sum));

      pieSeriesCreditsCerifiedData.push(
        parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_BALANCE?.sum)
      );
      pieSeriesCreditsCerifiedData.push(
        parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_TRANSFERRED?.sum)
      );
      pieSeriesCreditsCerifiedData.push(
        parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_RETIRED?.sum)
      );
      pieSeriesCreditsCerifiedData.push(
        parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_ISSUED?.sum)
      );
      let totalCredits = 0;
      let totalCreditsCertified = 0;
      for (let i = 0; i < pieSeriesCreditsData.length; i++) {
        if (String(pieSeriesCreditsData[i]) === 'NaN') {
          if (i !== -1) {
            pieSeriesCreditsData[i] = 0;
          }
          totalCredits = totalCredits + 0;
        } else {
          totalCredits = totalCredits + pieSeriesCreditsData[i];
        }
      }
      for (let j = 0; j < pieSeriesCreditsCerifiedData.length; j++) {
        if (String(pieSeriesCreditsCerifiedData[j]) === 'NaN') {
          if (j !== -1) {
            pieSeriesCreditsCerifiedData[j] = 0;
          }
          totalCreditsCertified = totalCreditsCertified + 0;
        } else {
          totalCreditsCertified = totalCreditsCertified + pieSeriesCreditsCerifiedData[j];
        }
      }
      optionDonutPieA.plotOptions.pie.donut.labels.total.formatter = () => '' + totalCredits;
      optionDonutPieB.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + totalCreditsCertified;

      console.log({ pieSeriesCreditsData, pieSeriesCreditsCerifiedData });
      setCreditPieSeries(pieSeriesCreditsData);
      setCreditCertifiedPieSeries(pieSeriesCreditsCerifiedData);
      setLastUpdate(response?.data?.lastUpdate);
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProgrammeAnalyticsStatsWithoutTimeRange();
  }, []);

  useEffect(() => {
    getAllProgrammeAnalyticsStats();
    getAllProgrammeAnalyticsStatsCharts();
  }, [startTime, endTime]);

  const seriesTotalProgrammesY = [
    {
      name: 'Authorised',
      data: issuedProgrammes,
    },
    {
      name: 'Rejected',
      data: rejectedProgrammes,
    },
    {
      name: 'Pending',
      data: pendingProgrammes,
    },
  ];

  const seriesTotalProgrammesSubY = [
    {
      name: 'Enery',
      data: energyProgrammes,
    },
    {
      name: 'Health',
      data: healthProgrammes,
    },
    {
      name: 'Education',
      data: educationProgrammes,
    },
    {
      name: 'Transport',
      data: transportProgrammes,
    },
    {
      name: 'Manufacturing',
      data: manufacturingProgrammes,
    },
    {
      name: 'Hospitality',
      data: hospitalityProgrammes,
    },
    {
      name: 'Forestry',
      data: forestryProgrammes,
    },
    {
      name: 'Waste',
      data: wasteProgrammes,
    },
    {
      name: 'Agriculture',
      data: agricultureProgrammes,
    },
    {
      name: 'Other',
      data: otherProgrammes,
    },
  ];

  return (
    <div className="dashboard-main-container">
      <div className="stastics-cards-container">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={pendingProjectsWithoutTimeRange}
              title={'Programmes Pending'}
              updatedDate={lastUpdate}
              icon="clockHistory"
              loading={loadingWithoutTimeRange}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={transfererequestsSent}
              title={'Transfer Requests Sent'}
              updatedDate={lastUpdate}
              icon="envelopeCheck"
              loading={loadingWithoutTimeRange}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={creditBalanceWithoutTimeRange}
              title={'Credit Balance'}
              updatedDate={lastUpdate}
              icon="coin"
              loading={loadingWithoutTimeRange}
            />
          </Col>
        </Row>
      </div>
      <div className="filter-container">
        <div className="date-filter">
          <RangePicker
            ranges={{
              Today: [moment(), moment()],
              'Last 15 days': [
                moment().startOf('month'),
                moment().startOf('month').add('15', 'days'),
              ],
              'This Month': [moment().startOf('month'), moment().endOf('month')],
            }}
            showTime
            allowClear={true}
            format="DD:MM:YYYY"
            onChange={onChangeRange}
          />
        </div>
        <div className="radio-selection">
          <Radio.Group defaultValue="overall">
            <Radio.Button className="overall" value="overall">
              OVERALL
            </Radio.Button>
            <Radio.Button className="mine" value="mine">
              MINE
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <ProgrammeRejectAndTransfer
              totalPrgrammes={totalProjects}
              pending={pendingProjects}
              rejected={rejectedProjects}
              authorized={issuedProjects}
              updatedDate={lastUpdate}
              loading={loading}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-pie-rem">
              {loading ? (
                <div className="margin-top-2">
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <>
                  <div className="pie-charts-title">Credits</div>
                  <div className="pie-charts-section">
                    <Chart
                      options={optionDonutPieA}
                      series={creditsPieSeries}
                      type="donut"
                      width="350px"
                    />
                  </div>
                  <div className="updated-on margin-top-2">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-pie-rem">
              {loading ? (
                <div className="margin-top-2">
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <>
                  <div className="pie-charts-title">Certified Credits</div>
                  <div className="pie-charts-section">
                    <Chart
                      options={optionDonutPieB}
                      series={creditsCertifiedPieSeries}
                      type="donut"
                      width="350px"
                    />
                  </div>
                  <div className="updated-on margin-top-2">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-bar-rem">
              <div className="pie-charts-title">Total Programmes</div>
              {loading ? (
                <div className="margin-top-2">
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <>
                  <div className="pie-charts-section">
                    <Chart
                      options={totalProgrammesOptions}
                      series={seriesTotalProgrammesY}
                      type="bar"
                      height="350px"
                      width="490px"
                    />
                  </div>
                  <div className="updated-on">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-bar-rem">
              <div className="pie-charts-title">Total Programmes:Sector</div>
              {loading ? (
                <div className="margin-top-2">
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <>
                  <div className="pie-charts-section">
                    <Chart
                      options={totalProgrammesOptionsSub}
                      series={seriesTotalProgrammesSubY}
                      type="bar"
                      height="350px"
                      width="490px"
                    />
                  </div>
                  <div className="updated-on">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-bar-rem">
              <div className="pie-charts-title">Total Credits</div>
              <div className="pie-charts-section">
                <Chart
                  options={totalProgrammesOptions}
                  series={seriesY}
                  type="bar"
                  height="350px"
                  width="450px"
                />
              </div>
              <div className="updated-on">
                <div className="updated-moment-container">
                  {moment(lastUpdate * 1000).fromNow()}
                </div>
              </div>
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-bar-rem">
              <div className="pie-charts-title">Total Credit Issued</div>
              <div className="pie-charts-section">
                <Chart
                  options={totalProgrammesOptions}
                  series={seriesY}
                  type="bar"
                  height="350px"
                  width="450px"
                />
              </div>
              <div className="updated-on">
                <div className="updated-moment-container">
                  {moment(lastUpdate * 1000).fromNow()}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
      {/* <div className="header-and-title">Overall</div>
        <Row gutter={[16, 40]} className="stastic-card-row">
          {DUmData?.map((cardItem: any, index: number) => {
            return (
              <Col xxl={6} xl={6} md={12} className="stastic-card-col">
                <StasticCard
                  value={cardItem?.value}
                  title={cardItem?.title}
                  updatedDate={cardItem?.updatedDate}
                  level={cardItem?.level}
                />
              </Col>
            );
          })}
        </Row>
      </div>
      <div className="stastics-charts-container-total-programmes">
        <Row gutter={[16, 30]} justify="start" className="stastic-charts-row">
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={options} series={series} type="bar" height="350px" width="450px" />
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsX} series={seriesX} type="bar" height="350px" width="450px" />
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} pull={6} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsA} series={seriesA} type="bar" height="350px" width="450px" />
            </div>
          </Col>
        </Row>
      </div>
      <div className="stastics-charts-container-certified-programmes">
        <Row gutter={[16, 30]} justify="start" className="stastic-charts-row">
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsY} series={seriesY} type="bar" height="350px" width="450px" />
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsZ} series={seriesZ} type="bar" height="350px" width="450px" />
            </div>
          </Col>
        </Row>
      </div>

      <div className="stastics-pie-charts-container">
        <Row gutter={[16, 30]} justify="start" className="stastic-charts-row">
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsP} series={seriesP} type="pie" height="350px" width="450px" />
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsQ} series={seriesQ} type="pie" height="350px" width="450px" />
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} pull={6} className="stastic-charts-col">
            <div className="chart-card">
              <Chart options={optionsR} series={seriesR} type="pie" height="350px" width="450px" />
            </div>
          </Col>
        </Row>
      </div>
      <div className="maps-container">
        <Row gutter={[16, 30]} justify="start" className="maps-container-row">
          <Col xxl={12} xl={12} md={12} className="maps-container-col">
            <MapCard title="Programmes Locations">&nbsp;</MapCard>
          </Col>
          <Col xxl={12} xl={12} md={12} className="maps-container-col">
            <MapCard title="Transfer Locations">&nbsp;</MapCard>
          </Col>
          <Col xxl={12} xl={12} md={12} pull={6} className="maps-container-col">
            <MapCard title="Transfer by Entity">&nbsp;</MapCard>
          </Col>
        </Row>
      </div> */}
    </div>
  );
};

export default Dashboard;
