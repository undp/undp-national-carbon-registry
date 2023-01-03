import React from 'react';
import { Col, DatePicker, Progress, Radio, Row } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapCard from '../../Components/MapCards.tsx/MapCard';
import StasticCard from '../../Components/StasticCard/StasticCard';
import './dashboard.scss';
import {
  DUmData,
  optionDonutPieA,
  options,
  optionsA,
  optionsP,
  optionsQ,
  optionsR,
  optionsX,
  optionsY,
  optionsZ,
  series,
  seriesA,
  seriesDonutPieA,
  seriesP,
  seriesQ,
  seriesR,
  seriesX,
  seriesY,
  seriesZ,
} from './DUMMY_DATAS';
import HtmlCluster from './SampleMap';
import fileText from '../../Assets/Images/fileText.svg';
import { CarOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ProgrammeRejectAndTransfer from './ProgrammeRejectAndTransfer';
import moment from 'moment';

const { RangePicker } = DatePicker;

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZmFicmljOCIsImEiOiJjaWc5aTV1ZzUwMDJwdzJrb2w0dXRmc2d0In0.p6GGlfyV-WksaDV_KdN27A',
});

const Dashboard = () => {
  return (
    <div className="dashboard-main-container">
      <div className="stastics-cards-container">
        <Row gutter={[20, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={220}
              title={'Programmes Pending'}
              updatedDate={'1669781334'}
              icon="clockHistory"
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={300}
              title={'Transfer Requests Sent'}
              updatedDate={'1669781334'}
              icon="envelopeCheck"
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={42000}
              title={'Credit Balance'}
              updatedDate={'1669781334'}
              icon="coin"
            />
          </Col>
        </Row>
      </div>
      <div className="filter-container">
        <div className="date-filter">
          <RangePicker />
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
      <div className="stastics-and-pie-container">
        <Row gutter={[20, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <ProgrammeRejectAndTransfer />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card">
              <div className="pie-charts-title">Credits</div>
              <div className="pie-charts-section">
                <Chart options={optionDonutPieA} series={seriesDonutPieA} type="donut" />
              </div>
              <div className="updated-on">
                <div className="updated-moment-container">
                  {moment(parseInt('1672648015') * 1000).fromNow()}
                </div>
              </div>
            </div>
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card">
              <div className="pie-charts-title">Certified</div>
              <div className="pie-charts-section">
                <Chart options={optionDonutPieA} series={seriesDonutPieA} type="donut" />
              </div>
              <div className="updated-on">
                <div className="updated-moment-container">
                  {moment(parseInt('1672648015') * 1000).fromNow()}
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
