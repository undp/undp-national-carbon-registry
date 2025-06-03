import React, { FC } from "react";
import { Skeleton, Tooltip } from "antd";
import { InfoCircle } from "react-bootstrap-icons";

export interface DetailsBarChartStatsProps {
  id: string;
  title: string;
  options: any;
  series: any;
  loading: boolean;
  toolTipText: string;
  Chart: any;
  height: string;
  width: string;
}

export const SLCFDetailsBarChartsStatComponent: FC<
  DetailsBarChartStatsProps
> = (props: DetailsBarChartStatsProps) => {
  const {
    id,
    title,
    options,
    series,
    loading,
    toolTipText,
    Chart,
    height,
    width,
  } = props;
  return (
    <div className="statistics-and-pie-card height-bar-rem project-details-bar-chart">
      <div className="pie-charts-top">
        <div className="pie-charts-title">{title}</div>
        <div className="info-container">
          <Tooltip
            arrowPointAtCenter
            placement="bottomRight"
            trigger="hover"
            title={toolTipText}
          >
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
                <li className="list-item">Pending</li>
                <li className="list-item">Approved</li>
                <li className="list-item">PDD Submitted</li>
                <li className="list-item">PDD Approved by Certifier</li>
                <li className="list-item">PDD Approved by DNA</li>
                <li className="list-item">Validation Report Submitted</li>
              </ul>
              <ul className="details-bar-chart-rejected-list">
                <li className="list-title">Rejected</li>
                <li className="list-item">Rejected</li>
                <li className="list-item">PDD Rejected by Certifier </li>
                <li className="list-item">PDD Rejected by DNA</li>
                <li className="list-item">Validation Report Rejected</li>
              </ul>
              <ul className="details-bar-chart-authorised-list">
                <li className="list-title">Authorised</li>
                <li className="list-item">Project Authorised</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
