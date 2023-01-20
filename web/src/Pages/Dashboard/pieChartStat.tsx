import React, { FC } from 'react';
import { DatePicker, Progress, Skeleton } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import fileText from '../../Assets/Images/fileText.svg';
import { CarOutlined, CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { ClockHistory, HandThumbsUp, XCircle, Clipboard2Pulse } from 'react-bootstrap-icons';

const { RangePicker } = DatePicker;

export interface PieChartStatsProps {
  title: string;
  options: any;
  series: any;
  lastUpdate: number;
  loading: boolean;
}

const PieChartsStat: FC<PieChartStatsProps> = (props: PieChartStatsProps) => {
  const { title, options, series, lastUpdate, loading } = props;
  return (
    <div className="stastics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="pie-charts-title">{title}</div>
          <div className="pie-charts-section">
            <Chart options={options} series={series} type="donut" width="350px" />
          </div>
          <div className="updated-on margin-top-2">
            <div className="updated-moment-container">{moment(lastUpdate * 1000).fromNow()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default PieChartsStat;
