import { i18n } from "i18next";
import React from "react";
import "./ReportingComponent.scss";
import { DatePicker, Row, Select } from "antd";

const REPORT_TYPES = {
  ACTIONS: 'ACTIONS',
  HOLDINGS: 'HOLDINGS'
}
const ReportingComponent = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;

  return (
    <div className="reporting-form-container">
      <div className="title-container">
        <Row justify={"space-between"}>
          <div className="main">{t("reporting:reportsTitle")}</div>
        </Row>
        <Row justify={"end"}>
          <DatePicker size="large" picker="year" />
        </Row>

        <Row className="mg-top-2">
          <Select
            size="large"
            placeholder="click to select the Reports to display"
            mode={"multiple"}
            className="report-type-selector"
          >
            {Object.keys(REPORT_TYPES).map((type: keyof typeof REPORT_TYPES ) => (
              <Select.Option value={type}>{t(`reporting:${type}`)}</Select.Option>
            ))}
          </Select>
        </Row>
      </div>
    </div>
  );
};

export default ReportingComponent;
