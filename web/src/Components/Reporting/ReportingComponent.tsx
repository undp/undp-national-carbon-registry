import { i18n } from "i18next";
import React, { useState } from "react";
import "./ReportingComponent.scss";
import { DatePicker, Empty, Row, Select } from "antd";
import moment from "moment";
import ReportCard from "./ReportCard";
import {
  getActionsReportColumns,
  getHoldingsReportColumns,
} from "./reportingColumns";
import { REPORT_TYPES } from "./reportTypes";

const ReportingComponent = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;

  const [selectedReports, setSelectedReports] = useState<{
    [REPORT_TYPES.ACTIONS]: boolean;
    [REPORT_TYPES.HOLDINGS]: boolean;
  }>({
    [REPORT_TYPES.ACTIONS]: false,
    [REPORT_TYPES.HOLDINGS]: false,
  });

  const [paginationInfo, setPaginationInfo] = useState<
    Partial<
      Record<keyof typeof REPORT_TYPES, { page: number; pageSize: number }>
    >
  >({
    [REPORT_TYPES.ACTIONS]: {
      page: 0,
      pageSize: 10,
    },
    [REPORT_TYPES.HOLDINGS]: {
      page: 0,
      pageSize: 10,
    },
  });

  const handlePaginationInfoChange = (
    page: number,
    pageSize: number,
    reportType: REPORT_TYPES
  ) => {
    setPaginationInfo((prev) => ({
      ...prev,
      [reportType]: {
        page: page,
        pageSize: pageSize,
      },
    }));

    console.log("-----paginationInfo--------", paginationInfo);
  };

  const [selectedYear, setSelectedYear] = useState<any>();

  const checkIfAnyReportIsSelected = () => {
    let isReportSelected = Object.values(selectedReports).some(Boolean)
    console.log("---------isReportSelected---------", isReportSelected);
    return isReportSelected
  }

  return (
    <div className="reporting-container">
      <div className="title-container">
        <Row justify={"space-between"}>
          <div className="main">{t("reporting:reportsTitle")}</div>
        </Row>
        <Row justify={"end"}>
          <DatePicker
            size="large"
            picker="year"
            onChange={(value: any) => {
              console.log("---------value-----------", value);
              const date = moment(value).local();
              setSelectedYear(date);
            }}
          />
        </Row>

        <Row className="mg-top-2">
          <Select
            size="large"
            placeholder="click to select the Reports to display"
            mode={"multiple"}
            className="report-type-selector"
            onSelect={(value) =>
              setSelectedReports((prev) => ({
                ...prev,
                [value]: true,
              }))
            }
            onDeselect={(value) =>
              setSelectedReports((prev) => ({
                ...prev,
                [value]: false,
              }))
            }
          >
            {Object.keys(REPORT_TYPES).map(
              (type: keyof typeof REPORT_TYPES) => (
                <Select.Option value={type}>
                  {t(`reporting:${type}`)}
                </Select.Option>
              )
            )}
          </Select>
        </Row>
      </div>

      {selectedReports[REPORT_TYPES.ACTIONS] && (
        <ReportCard
          title={"Actions Report"}
          reportType={REPORT_TYPES.ACTIONS}
          host={"Sri lanka"}
          year="2025"
          columns={getActionsReportColumns(t)}
          handlePaginationChange={handlePaginationInfoChange}
          pagination={{
            total: 10,
            current: paginationInfo[REPORT_TYPES.ACTIONS].page || 1,
            pageSize: paginationInfo[REPORT_TYPES.ACTIONS].pageSize || 1,
            pageSizeOptions: [10, 20, 30],
          }}
          data={[]}
          downloadCSV={() => {}}
          downloadExcel={() => {}}
        />
      )}

      {selectedReports[REPORT_TYPES.HOLDINGS] && (
        <ReportCard
          title={"Holdings Report"}
          reportType={REPORT_TYPES.ACTIONS}
          host={"Sri lanka"}
          year="2025"
          columns={getHoldingsReportColumns(t)}
          handlePaginationChange={handlePaginationInfoChange}
          pagination={{
            total: 10,
            current: paginationInfo[REPORT_TYPES.HOLDINGS].page || 1,
            pageSize: paginationInfo[REPORT_TYPES.HOLDINGS].pageSize || 1,
            pageSizeOptions: [10, 20, 30],
          }}
          data={[]}
          downloadCSV={() => {}}
          downloadExcel={() => {}}
        />
      )}

      {!checkIfAnyReportIsSelected() && (
        <div className="no-reports">
          <Empty description={<span className="description">No report found !</span>} />
        </div>
      )}
    </div>
  );
};

export default ReportingComponent;
