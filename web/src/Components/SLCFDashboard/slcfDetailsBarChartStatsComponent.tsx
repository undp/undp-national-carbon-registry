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
              {/* Pending Group */}
              {/* <div style={{ color: 'blue', fontWeight: 'bold', marginBottom: '5px' }}>Pending</div> */}
              {/* <div className="details-bar-chart-pending-title">Pending</div> */}
              {/* <ul style={{ listStyleType: 'none', padding: '0', margin: '0 0 10px 0' }}> */}
              <ul className="details-bar-chart-pending-list">
                <li className="list-title">Pending</li>
                <li className="list-item">INF Pending</li>
                <li className="list-item">Proposal Pending</li>
                <li className="list-item">INF Approved</li>
                <li className="list-item">Proposal Accepted</li>
                <li className="list-item">CMA Pending</li>
                <li className="list-item">Validation Pending</li>
              </ul>

              {/* Rejected Group */}
              {/* <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '5px' }}>Rejected</div> */}
              {/* <div className="details-bar-chart-rejected-title">Rejected</div> */}
              {/* <ul style={{ listStyleType: 'none', padding: '0', margin: '0 0 10px 0' }}> */}
              <ul className="details-bar-chart-rejected-list">
                <li className="list-title">Rejected</li>
                <li className="list-item">INF Rejected</li>
                <li className="list-item">Proposal Rejected</li>
                <li className="list-item">Validation Rejected</li>
              </ul>

              {/* Authorized Group */}
              {/* <div className="details-bar-chart-authorised-title">Authorized</div> */}
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
