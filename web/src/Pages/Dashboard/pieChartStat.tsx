import React, { FC } from 'react';
import { DatePicker, Skeleton } from 'antd';
import Chart from 'react-apexcharts';
import moment from 'moment';
import { InfoCircle } from 'react-bootstrap-icons';

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
          <div className="pie-charts-top">
            <div className="pie-charts-title">{title}</div>
            <div className="info-container">
              <InfoCircle color="#000000" size={20} />
            </div>
          </div>
          <div className="pie-charts-section">
            <Chart options={options} series={series} type="donut" height="320px" />
          </div>
          <div className="updated-on margin-top-2">
            <div className="updated-moment-container">{moment(lastUpdate).fromNow()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default PieChartsStat;
