import React, { FC } from 'react';
import { Skeleton, Tooltip } from 'antd';
import { InfoCircle } from 'react-bootstrap-icons';

export interface BarChartStatsProps {
  id: string;
  title: string;
  options: any;
  series: any;
  lastUpdate: any;
  loading: boolean;
  toolTipText: string;
  Chart: any;
  height: string;
  width: string;
}

export const SLCFBarChartsStatComponent: FC<BarChartStatsProps> = (props: BarChartStatsProps) => {
  const { id, title, options, series, lastUpdate, loading, toolTipText, Chart, height, width } =
    props;
  return (
    <div className="statistics-and-pie-card height-bar-rem">
      <div className="pie-charts-top">
        <div className="pie-charts-title">{title}</div>
        <div className="info-container">
          <Tooltip arrowPointAtCenter placement="bottomRight" trigger="hover" title={toolTipText}>
            <InfoCircle color="#000000" size={17} />
          </Tooltip>
        </div>
      </div>
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="pie-charts-section">
            <Chart
              id={id}
              options={options}
              series={series}
              type="bar"
              height={height}
              width={width}
            />
          </div>
          <div className="updated-on">
            {lastUpdate !== '0' && <div className="updated-moment-container">{lastUpdate}</div>}
          </div>
        </>
      )}
    </div>
  );
};
