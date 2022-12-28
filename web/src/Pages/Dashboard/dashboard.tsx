import React from 'react';
import { Col, Row } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapCard from '../../Components/MapCards.tsx/MapCard';
import StasticCard from '../../Components/StasticCard/StasticCard';
import './dashboard.scss';
import {
  DUmData,
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
  seriesP,
  seriesQ,
  seriesR,
  seriesX,
  seriesY,
  seriesZ,
} from './DUMMY_DATAS';
import HtmlCluster from './SampleMap';

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZmFicmljOCIsImEiOiJjaWc5aTV1ZzUwMDJwdzJrb2w0dXRmc2d0In0.p6GGlfyV-WksaDV_KdN27A',
});

const Dashboard = () => {
  return (
    <div className="dashboard-main-container">
      {/* <div className="header-and-title">Overall</div>
      <div className="stastics-cards-container">
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
