import { Button, Col, Row, Table, Tag } from "antd";
import { TFunction } from "i18next";

import "./ReportingComponent.scss";

import { UploadOutlined } from "@ant-design/icons";

import { REPORT_TYPES } from "./reportTypes";

interface IReportCard {
  t: TFunction<string[], undefined, string[]>;

  title: string;

  reportType: REPORT_TYPES;

  /**
   * ISO 3166-1 alpha-3 code of the reporting Party — not a display name.
   *
   * Omitted by the Submission card, which already carries Party and Reported
   * year as columns; repeating them above the table says nothing new.
   */
  party?: string;

  year?: string | number;

  /**
   * Figures are live and still moving, as opposed to a frozen 31 December
   * snapshot. Holdings for the open year only.
   */
  provisional?: boolean;

  columns: Record<string, unknown>[];

  data: Record<string, unknown>[];

  /**
   * Export handlers.
   *
   * Only the Submission card supplies these, and they export the **whole**
   * report rather than that one table — a CARP submission is the five tables
   * together, so a per-table file was never the deliverable.
   */
  downloadCSV?: () => void;

  downloadExcel?: () => void;

  pagination: {
    total: number;
    current: number;
    pageSize: number;
    pageSizeOptions: number[];
  };

  handlePaginationChange: (page: number, pageSize: number, reportType: REPORT_TYPES) => void;
}

const ReportCard = (props: IReportCard) => {
  const {
    t,
    title,
    reportType,
    party,
    year,
    provisional,
    columns,
    data,
    downloadCSV,
    downloadExcel,
    handlePaginationChange,
    pagination,
  } = props;

  return (
    <div className="report-card">
      <Row gutter={20} justify={"space-between"} align={"middle"} className="header-row">
        <Col>
          <p className="title">{title}</p>
          {provisional && (
            // Presenting live figures identically to a filed snapshot is how a
            // half-year balance gets mistaken for a year-end one.
            <Tag color="orange" className="provisional-tag">
              {t("reporting:provisional")}
            </Tag>
          )}
        </Col>

        {(downloadExcel || downloadCSV) && (
          <Col className="export-btns">
            {downloadExcel && (
              <Button className="btn" type="primary" size="large" block onClick={downloadExcel}>
                {t("reporting:exportAsExcel")} <UploadOutlined className="icon" />
              </Button>
            )}

            {downloadCSV && (
              <Button className="btn" type="primary" size="large" block onClick={downloadCSV}>
                {t("reporting:exportAsCsv")} <UploadOutlined className="icon" />
              </Button>
            )}
          </Col>
        )}
      </Row>

      {(party || year) && (
        <div className="info">
          {party && (
            <span>
              {t("reporting:partyLabel")}: {party}
            </span>
          )}

          {year && (
            <span>
              {t("reporting:reportedYearLabel")}: {year}
            </span>
          )}
        </div>
      )}

      <div className="table">
        <Table
          dataSource={data}
          columns={columns}
          // Submission/Authorizations/Actions rows always come from stored
          // records (always carry an `id`). Holdings/Authorized-entities rows
          // for a reporting year with no frozen snapshot yet come straight
          // from the live provider instead — a CreateInput shape with no
          // `id` at all. Falling through to `record.id` alone would collapse
          // every one of those rows onto the same "undefined" key, which
          // breaks React's reconciliation across re-renders (year switches,
          // refetches) rather than just failing to look unique on paper.
          rowKey={(record, index) => (record.id ? String(record.id) : `row-${index}`)}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            style: { textAlign: "center" },
            position: ["bottomLeft"],
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          bordered={true}
          onChange={(value) => {
            handlePaginationChange(value?.current as number, value?.pageSize as number, reportType);
          }}
        />
      </div>
    </div>
  );
};

export default ReportCard;
