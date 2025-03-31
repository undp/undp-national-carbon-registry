import { FC } from 'react';
import { Row, Skeleton, Tooltip } from 'antd';
import { InfoCircle } from 'react-bootstrap-icons';

export interface SideBarChartStatsProps {
  id: string;
  title: any;
  options: any;
  series: any;
  loading: boolean;
  width: string;
  toolTipText: string;
  Chart: any;
}

export const SLCFSideBarChartsStatComponent: FC<SideBarChartStatsProps> = (
  props: SideBarChartStatsProps
) => {
  const { id, title, options, series, loading, toolTipText, Chart, width } = props;
  return (
    <div className="statistics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <Row justify={'space-between'} align={'middle'} className="pie-charts-top">
            <Row align={'middle'}>
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
            </Row>
          </Row>
          <div className="pie-charts-section">
            <Chart
              id={id}
              options={options}
              series={series}
              type="bar"
              width={width}
              height="400px"
            />
          </div>
        </>
      )}
    </div>
  );
};
