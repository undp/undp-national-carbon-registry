import { Button, Col, Row, Table } from "antd";
import "./ReportingComponent.scss";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { REPORT_TYPES } from "./reportTypes";

interface IReportCard {
  title: string;
  reportType: REPORT_TYPES;
  host: string;
  year: string | number;
  totalRecords?: number;
  columns: any[];
  data: any[];
  downloadCSV: () => void;
  downloadExcel: () => void;
  pagination: {
    total: number;
    current: number;
    pageSize: number;
    pageSizeOptions: number[];
  };
  handlePaginationChange: (
    page: number,
    pageSize: number,
    reportType: REPORT_TYPES
  ) => void;
}

const ReportCard = (props: IReportCard) => {
  const {
    title,
    reportType,
    host,
    year,
    columns,
    data,
    downloadCSV,
    downloadExcel,
    handlePaginationChange,
    pagination,
  } = props;

  return (
    <div className="report-card">
      <Row
        gutter={20}
        justify={"space-between"}
        align={"middle"}
        className="header-row"
      >
        <Col>
          <p className="title">{title}</p>
        </Col>

        <Col className="export-btns">
          <Button
            className="btn"
            type="primary"
            size="large"
            block
            onClick={() => {
              downloadExcel();
            }}
          >
            Export AS EXCELL <UploadOutlined className="icon" />
          </Button>

          <Button
            className="btn"
            type="primary"
            size="large"
            block
            onClick={() => {
              downloadCSV();
            }}
          >
            Export AS CSV <UploadOutlined className="icon" />
          </Button>
        </Col>
      </Row>

      <div className="info">
        <span>Party: {host}</span>
        <span>Reported Year: {year}</span>
      </div>

      <div className="table">
        <Table
          dataSource={data}
          columns={columns}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            style: { textAlign: "center" },
            position: ["bottomLeft"],
            showSizeChanger: true,
          }}
          bordered={true}
          onChange={(value) => {
            handlePaginationChange(value?.current, value?.pageSize, reportType);
          }}
        />
      </div>
    </div>
  );
};

export default ReportCard;
