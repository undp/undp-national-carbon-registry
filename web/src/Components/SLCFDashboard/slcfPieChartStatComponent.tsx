import { FC } from "react";
import { Col, Row, Skeleton, Tooltip } from "antd";
import { InfoCircle } from "react-bootstrap-icons";
import { ProjectSectorEnum } from "../../Definitions/Enums/projectSector.enum";
import { INF_SECTOR } from "../AddNewProgramme/ProgrammeCreationComponent";

export interface SideBarChartStatsProps {
  id: string;
  title: any;
  options: any;
  series: any;
  loading: boolean;
  width: string;
  toolTipText: string;
  Chart: any;
  sector: ProjectSectorEnum;
}

export const SLCFSideBarChartsStatComponent: FC<SideBarChartStatsProps> = (
  props: SideBarChartStatsProps
) => {
  const {
    id,
    title,
    options,
    series,
    loading,
    toolTipText,
    Chart,
    width,
    sector,
  } = props;

  console.log("------------ bar series-------------", series, options);

  return (
    <div className="statistics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <Row
            align={"middle"}
            justify={"space-between"}
            className="pie-charts-top sectoral-scope-chart"
          >
            <Col md={16} className="pie-chart-col-1">
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
            </Col>
            <Col md={3}>
              {sector && (
                <span className="sector-badge">{INF_SECTOR[sector]}</span>
              )}
            </Col>
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
