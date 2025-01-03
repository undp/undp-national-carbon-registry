import React, { FC } from 'react';
import { Skeleton, Tooltip } from 'antd';
import { InfoCircle } from 'react-bootstrap-icons';

export interface DetailsBarChartStatsProps {
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

export const SLCFDetailsBarChartsStatComponent: FC<DetailsBarChartStatsProps> = (
  props: DetailsBarChartStatsProps
) => {
  const { id, title, options, series, lastUpdate, loading, toolTipText, Chart, height, width } =
    props;
  return (
    <div className="statistics-and-pie-card height-bar-rem project-details-bar-chart">
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
            <div className="details-bar-chart-legends">
              <ul className="details-bar-chart-pending-list">
                <li className="list-title">Pending</li>
                <li className="list-item">INF Pending</li>
                <li className="list-item">INF Approved</li>
                <li className="list-item">Proposal Pending</li>
                <li className="list-item">Proposal Accepted</li>
                <li className="list-item">CMA Pending</li>
                <li className="list-item">CMA Rejected</li>
                <li className="list-item">CMA Approved</li>
                <li className="list-item">Validation Pending</li>
                <li className="list-item">Validation Rejected</li>
              </ul>
              <ul className="details-bar-chart-rejected-list">
                <li className="list-title">Rejected</li>
                <li className="list-item">INF Rejected</li>
                <li className="list-item">Proposal Rejected</li>
              </ul>
              <ul className="details-bar-chart-authorised-list">
                <li className="list-title">Authorised</li>
                <li className="list-item">Project Authorised</li>
              </ul>
            </div>
          </div>
          <div className="updated-on">
            {lastUpdate !== '0' && <div className="updated-moment-container">{lastUpdate}</div>}
          </div>
        </>
      )}
    </div>
  );
};
