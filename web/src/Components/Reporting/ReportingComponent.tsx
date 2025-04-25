import { i18n } from "i18next";
import React, { useEffect, useState } from "react";
import "./ReportingComponent.scss";
import { DatePicker, Empty, Row, Select } from "antd";
import moment, { Moment } from "moment";
import ReportCard from "./ReportCard";
import {
  getActionsReportColumns,
  getHoldingsReportColumns,
} from "./reportingColumns";
import { FILE_TYPES, REPORT_TYPES } from "./reportTypes";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { Loading } from "../Loading/loading";

const ReportingComponent = (props: { translator: i18n }) => {
  const { translator } = props;

  const t = translator.t;

  const { post } = useConnection();

  const [actionsLoading, setActionsLoading] = useState<boolean>(false);
  const [holdingsLoading, setHoldingsLoading] = useState<boolean>(false);

  const [selectedYearsArr, setSelectedYearsArr] = useState([
    REPORT_TYPES.ACTIONS,
    REPORT_TYPES.HOLDINGS,
  ]);

  const [selectedReports, setSelectedReports] = useState<{
    [REPORT_TYPES.ACTIONS]: boolean;
    [REPORT_TYPES.HOLDINGS]: boolean;
  }>({
    [REPORT_TYPES.ACTIONS]: true,
    [REPORT_TYPES.HOLDINGS]: true,
  });

  const [actionsData, setActionsData] = useState<any[]>([]);
  const [holdingsData, setHoldingsData] = useState<any[]>([]);

  const [paginationInfo, setPaginationInfo] = useState<
    Partial<
      Record<keyof typeof REPORT_TYPES, { page: number; pageSize: number }>
    >
  >({
    [REPORT_TYPES.ACTIONS]: {
      page: 1,
      pageSize: 10,
    },
    [REPORT_TYPES.HOLDINGS]: {
      page: 1,
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

  const [selectedYear, setSelectedYear] = useState<Moment>(moment());

  const getActionsReports = async () => {
    try {
      setActionsLoading(true)
      const res = await post(API_PATHS.QUERY_AEF_RECORDS, {
        page: paginationInfo[REPORT_TYPES.ACTIONS]?.page,
        size: paginationInfo[REPORT_TYPES.ACTIONS]?.pageSize,
        filterAnd: [
          {
            key: "actionTime",
            operation: ">",
            value: selectedYear.startOf("year").valueOf(),
          },
          {
            key: "actionTime",
            operation: "<",
            value: selectedYear.endOf("year").valueOf(),
          },
        ],
      });

      if (res?.statusText === "SUCCESS") {
        setActionsData(res?.data);
      }
    } catch (error: any) {
      console.log("error:", error)
    }
    finally {
      setActionsLoading(false)
    }
  };

  const getHoldingReports = async () => {
    try {
      setHoldingsLoading(true);
      const res = await post(API_PATHS.QUERY_AEF_RECORDS, {
        page: paginationInfo[REPORT_TYPES.HOLDINGS]?.page,
        size: paginationInfo[REPORT_TYPES.HOLDINGS]?.pageSize,
        filterAnd: [
          {
            key: "actionTime",
            operation: ">",
            value: selectedYear.startOf("year").valueOf(),
          },
          {
            key: "actionTime",
            operation: "<",
            value: selectedYear.endOf("year").valueOf(),
          },
          {
            key: "actionType",
            operation: "=",
            value: "authorization",
          },
        ],
      });

      console.log("---------------res--------------", res);
      if (res?.statusText === "SUCCESS") {
        setHoldingsData(res?.data);
      }
    } catch (error) {
      console.log("error:", error)
    }
    finally {
      setHoldingsLoading(false);
    }
  };

  useEffect(() => {
    getActionsReports();
    getHoldingReports();
  }, [selectedYear]);

  const checkIfAnyReportIsSelected = () => {
    let isReportSelected = Object.values(selectedReports).some(Boolean);
    console.log("---------isReportSelected---------", isReportSelected);
    return isReportSelected;
  };
  
  const downloadActionCSV = async () => {
    try {
      setActionsLoading(true)
      const res = await post(API_PATHS.DOWNLOAD_AEF_RECORDS, {
        reportType: REPORT_TYPES.ACTIONS,
        fileType: FILE_TYPES.csv
      })

      console.log("--------res--------", res);

      if (res?.statusText === "SUCCESS") {
        const url = res.data.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.log("error:", error)
    } finally {
      setActionsLoading(false);
    }
  }

  const downloadActionExcell = async () => {
    try {
      setActionsLoading(true)
      const res = await post(API_PATHS.DOWNLOAD_AEF_RECORDS, {
        reportType: REPORT_TYPES.ACTIONS,
        fileType: FILE_TYPES.xlsx
      })

      console.log("--------res--------", res);

      if (res?.statusText === "SUCCESS") {
        const url = res.data.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.log("error:", error)
    } finally {
      setActionsLoading(false);
    }
  }

  const downloadHoldingsCSV = async () => {
    try {
      setHoldingsLoading(true)
      const res = await post(API_PATHS.DOWNLOAD_AEF_RECORDS, {
        reportType: REPORT_TYPES.HOLDINGS,
        fileType: FILE_TYPES.csv
      })

      console.log("--------res--------", res);

      if (res?.statusText === "SUCCESS") {
        const url = res.data.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.log("error:", error)
    } finally {
      setHoldingsLoading(false);
    }
  }

  const downloadHoldingsExcell = async () => {
    try {
      setHoldingsLoading(true)
      const res = await post(API_PATHS.DOWNLOAD_AEF_RECORDS, {
        reportType: REPORT_TYPES.HOLDINGS,
        fileType: FILE_TYPES.csv
      })

      console.log("--------res--------", res);

      if (res?.statusText === "SUCCESS") {
        const url = res.data.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.log("error:", error)
    } finally {
      setHoldingsLoading(false);
    }
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
            value={selectedYear}
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
            value={[...selectedYearsArr]}
            className="report-type-selector"
            onSelect={(value) => {
              setSelectedYearsArr((prev) => [...prev, value]);
              setSelectedReports((prev) => ({
                ...prev,
                [value]: true,
              }));
            }}
            onDeselect={(value) => {
              setSelectedYearsArr((prev) => [
                ...prev.filter((item) => item !== value),
              ]);
              setSelectedReports((prev) => ({
                ...prev,
                [value]: false,
              }));
            }}
          >
            {Object.keys(REPORT_TYPES).map(
              (type: keyof typeof REPORT_TYPES) => (
                <Select.Option value={type}>
                  {t(`reporting:${String(type)}`)}
                </Select.Option>
              )
            )}
          </Select>
        </Row>
      </div>
      
      {(actionsLoading || holdingsLoading) && (<Loading />)}
      
      {selectedReports[REPORT_TYPES.ACTIONS] && (
        <ReportCard
          title={"Actions Report"}
          reportType={REPORT_TYPES.ACTIONS}
          host={"Sri lanka"}
          year={String(selectedYear.year())}
          columns={getActionsReportColumns(t)}
          handlePaginationChange={handlePaginationInfoChange}
          pagination={{
            total: 10,
            current: paginationInfo[REPORT_TYPES.ACTIONS].page || 1,
            pageSize: paginationInfo[REPORT_TYPES.ACTIONS].pageSize || 1,
            pageSizeOptions: [10, 20, 30],
          }}
          data={actionsData || []}
          downloadCSV={downloadActionCSV}
          downloadExcel={downloadActionExcell}
        />
      )}

      {selectedReports[REPORT_TYPES.HOLDINGS] && (
        <ReportCard
          title={"Holdings Report"}
          reportType={REPORT_TYPES.HOLDINGS}
          host={"Sri lanka"}
          year={String(selectedYear.year())}
          columns={getHoldingsReportColumns(t)}
          handlePaginationChange={handlePaginationInfoChange}
          pagination={{
            total: 10,
            current: paginationInfo[REPORT_TYPES.HOLDINGS].page || 1,
            pageSize: paginationInfo[REPORT_TYPES.HOLDINGS].pageSize || 1,
            pageSizeOptions: [10, 20, 30],
          }}
          data={holdingsData || []}
          downloadCSV={downloadHoldingsCSV}
          downloadExcel={downloadHoldingsExcell}
        />
      )}

      {!checkIfAnyReportIsSelected() && (
        <div className="no-reports">
          <Empty
            description={<span className="description">No report found !</span>}
          />
        </div>
      )}
    </div>
  );
};

export default ReportingComponent;
