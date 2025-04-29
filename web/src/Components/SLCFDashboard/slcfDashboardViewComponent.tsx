import { useEffect, useState } from "react";
import { Button, Col, DatePicker, Row, Tooltip, message, Select } from "antd";
import "./dashboard.scss";
import { AppstoreOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  ClockHistory,
  BoxArrowRight,
  InfoCircle,
  FileEarmarkCheck,
  CreditCard2Back,
  HandThumbsUp,
} from "react-bootstrap-icons";
import {
  creditsByDateOptions,
  optionSideBar,
  retirementsByDateOptions,
  sectorPieChartOptions,
  totalProgrammesOptions,
} from "./slcfChartOptions";
import { ProgrammeRejectAndTransferComponent } from "./programmeRejectAndTransferComponent";
import { SLCFSideBarChartsStatComponent } from "./slcfPieChartStatComponent";
import { SLCFBarChartsStatComponent } from "./slcfBarChartStatsComponent";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { addCommSep } from "../../Definitions/Definitions/programme.definitions";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { SLStatisticsCard } from "./SlStatisticsCard/slStatisticsCard";
import { SLCFDetailsBarChartsStatComponent } from "./slcfDetailsBarChartStatsComponent";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { OverallMineButtons } from "../../Definitions/Enums/overallMineButton.enum";
import { ProjectEntityResponse } from "../../Definitions/InterfacesAndType/dashboard.interface";
import { ProjectSectorEnum } from "../../Definitions/Enums/projectSector.enum";
import { PendingActionsComponent } from "./pendingActionsComponent";
import { SectorPieChart } from "./SectorPieChart";
import { SECTOR_TO_SCOPES_MAP } from "../AddNewProgramme/ProgrammeCreationComponent";
const { RangePicker } = DatePicker;

export const SLCFDashboardComponent = (props: any) => {
  const {
    Chart,
    t,
    ButtonGroup,
    Link,
    isMultipleDashboardsVisible = false,
  } = props;
  const { post, get } = useConnection();
  const { userInfoState } = useUserContext();

  // Dashboard Endpoint Data
  const [pendingActions, setPendingActions] =
    useState<ProjectEntityResponse[]>();
  const [projectSummary, setProjectSummary] = useState<{
    total_pending_projects: number;
    total_credits_issued: number;
    total_credits_retired: number;
  }>({
    total_pending_projects: 0,
    total_credits_issued: 0,
    total_credits_retired: 0,
  });
  const [projectStatusSummary, setProjectStatusSummary] = useState<{
    totalProjects: number;
    authorisedCount: number;
    pendingCount: number;
    rejectedCount: number;
  }>({
    totalProjects: 0,
    authorisedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  });

  const [projectsByStatusDetail, setProjectsByStatusDetail] = useState<any[]>([
    {
      name: "Project",
      data: [],
    },
  ]);

  const [projectCountBySector, setProjectCountBySector] = useState<any>({
    name: "Project",
    data: [],
  });

  const [projectCountBySectoralScope, setProjectCountBySectoralScope] =
    useState<any>([
      {
        name: "Project",
        data: [],
      },
    ]);

  const [creditSummary, setCreditSummary] = useState<{
    authorisedAmount: number;
    issuedAmount: number;
    transferredAmount: number;
    retiredAmount: number;
  }>({
    authorisedAmount: 0,
    issuedAmount: 0,
    transferredAmount: 0,
    retiredAmount: 0,
  });
  const [creditsAllSummaryByDate, setCreditsAllSummaryByDate] =
    useState<any[]>();
  const [creditsTrRtSummaryByDate, setCreditsTrRtSummaryByDate] =
    useState<any[]>();

  // Endpoint Last Update Epoch
  const [projectSummaryLastUpdatedEpoch, setProjectSummaryLastUpdatedEpoch] =
    useState<{
      last_pending_project_time: number;
      last_credit_issued_time: number;
      last_retire_approved_time: number;
    }>({
      last_pending_project_time: 0,
      last_credit_issued_time: 0,
      last_retire_approved_time: 0,
    });

  const [
    projectStatusSummaryLastUpdatedEpoch,
    setProjectStatusSummaryLastUpdatedEpoch,
  ] = useState<number>(0);
  const [creditSummaryLastUpdatedEpoch, setCreditSummaryLastUpdatedEpoch] =
    useState<{
      lastAuthorisedTime: number;
      lastIssuedTime: number;
      lastTransferredTime: number;
      lastRetiredTime: number;
    }>({
      lastAuthorisedTime: 0,
      lastIssuedTime: 0,
      lastTransferredTime: 0,
      lastRetiredTime: 0,
    });

  // Endpoint Last Update Epoch Timer
  const [projectSummaryLastUpdated, setProjectSummaryLastUpdated] = useState<{
    last_pending_project_time: string;
    last_credit_issued_time: string;
    last_retire_approved_time: string;
  }>({
    last_pending_project_time: "0",
    last_credit_issued_time: "0",
    last_retire_approved_time: "0",
  });
  const [projectStatusSummaryLastUpdated, setProjectStatusSummaryLastUpdated] =
    useState<string>("0");
  const [creditSummaryLastUpdated, setCreditSummaryLastUpdated] = useState<{
    lastAuthorisedTime: string;
    lastIssuedTime: string;
    lastTransferredTime: string;
    lastRetiredTime: string;
  }>({
    lastAuthorisedTime: "0",
    lastIssuedTime: "0",
    lastTransferredTime: "0",
    lastRetiredTime: "0",
  });

  // Loading Flags
  const [loadingPendingActions, setLoadingPendingActions] =
    useState<boolean>(false);
  const [loadingProjectSummary, setLoadingProjectSummary] =
    useState<boolean>(false);
  const [loadingProjectStatusSummary, setLoadingProjectStatusSummary] =
    useState<boolean>(false);
  const [loadingProjectsByStatusDetail, setLoadingProjectsByStatusDetail] =
    useState<boolean>(false);
  const [loadingProjectCountBySector, setLoadingProjectCountBySector] =
    useState<boolean>(false);
  const [
    loadingProjectCountBySectoralScope,
    setLoadingProjectCountBySectoralScope,
  ] = useState<boolean>(false);
  const [loadingCreditSummary, setLoadingCreditSummary] =
    useState<boolean>(false);
  const [loadingCreditsSummaryByDate, setLoadingCreditsSummaryByDate] =
    useState<boolean>(false);

  // Filters
  const [overallMineButton, setOverallMineButton] =
    useState<OverallMineButtons>(OverallMineButtons.OVERALL);
  const [startTime, setStartTime] = useState<number>(
    Date.parse(String(moment().subtract("13", "days").startOf("day")))
  );
  const [endTime, setEndTime] = useState<number>(
    Date.parse(String(moment().endOf("day")))
  );
  const [sector, setSector] = useState<ProjectSectorEnum>();

  // Chart Components Width
  const [statusBarchartWidth, setStatusBarChartWidth] = useState(
    window.innerWidth > 1600 ? "300%" : "200%"
  );
  const [scopeBarchartWidth, setScopeBarChartWidth] = useState(
    window.innerWidth > 1600 ? "270%" : "220%"
  );
  const [creditChartsWidth, setCreditChartsWidth] = useState(
    window.innerWidth > 1600 ? "510%" : "390%"
  );

  const [sectorPieChartWidth, setSectorPieChartWidth] = useState(
    window?.innerWidth > 1600 ? "150%" : "90%"
  );

  const getPendingActions = async () => {
    setLoadingPendingActions(true);
    try {
      const response = await get(API_PATHS.GET_PENDING_ACTIONS);
      if (response) {
        setPendingActions(response?.data);
      }
    } catch (error: any) {
      console.log("Error in getting Pending Actions", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingPendingActions(false);
    }
  };

  const getProjectSummary = async () => {
    setLoadingProjectSummary(true);
    try {
      const response = await get(API_PATHS.GET_PROJECT_SUMMARY);
      if (response && response.data) {
        setProjectSummary({
          total_pending_projects: response.data.total_pending_projects || 0,
          total_credits_issued: response.data.total_credits_issued || 0,
          total_credits_retired: response.data.total_credits_retired || 0,
        });
        setProjectSummaryLastUpdatedEpoch({
          last_pending_project_time:
            Number(response.data.last_pending_project_time) || 0,
          last_credit_issued_time:
            Number(response.data.last_credit_issued_time) || 0,
          last_retire_approved_time:
            Number(response.data.last_retire_approved_time) || 0,
        });
      }
    } catch (error: any) {
      console.log("Error in getting Total Data Counts", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingProjectSummary(false);
    }
  };

  const getProjectStatusSummary = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingProjectStatusSummary(true);
    try {
      const response = await post(API_PATHS.GET_PROJECT_STATUS_SUMMARY, {
        isMine: isMine || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sector: sector || undefined,
      });
      if (response && response.data) {
        setProjectStatusSummary({
          totalProjects: response.data.totalProjects || 0,
          authorisedCount: response.data.authorisedCount || 0,
          pendingCount: response.data.pendingCount || 0,
          rejectedCount: response.data.rejectedCount || 0,
        });
        setProjectStatusSummaryLastUpdatedEpoch(
          response.data.lastStatusUpdateTime || 0
        );
      }
    } catch (error: any) {
      console.log("Error in getting Project Status Summary", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingProjectStatusSummary(false);
    }
  };

  const getProjectsByStatusDetail = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingProjectsByStatusDetail(true);
    try {
      const response = await post(API_PATHS.GET_PROJECTS_BY_STATUS_DETAIL, {
        isMine: isMine || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sector: sector || undefined,
      });
      if (response && response.data) {
        const projectStatusWithColor = [
          {
            key: "PENDING",
            name: "Pending",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "REJECTED",
            name: "Rejected",
            statusColor: "rgba(255, 99, 97, 1)",
          },
          {
            key: "APPROVED",
            name: "Approved",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "PDD_SUBMITTED",
            name: "PDD Submitted",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "PDD_REJECTED_BY_CERTIFIER",
            name: "PDD Rejected by Certifier",
            statusColor: "rgba(255, 99, 97, 1)",
          },
          {
            key: "PDD_APPROVED_BY_CERTIFIER",
            name: "PDD Approved by Certifier",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "PDD_REJECTED_BY_DNA",
            name: "PDD Rejected by DNA",
            statusColor: "rgba(255, 99, 97, 1)",
          },
          {
            key: "PDD_APPROVED_BY_DNA",
            name: "PDD Approved by DNA",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "VALIDATION_REPORT_SUBMITTED",
            name: "Validation Report Submitted",
            statusColor: "rgba(22, 177, 255, 1)",
          },
          {
            key: "VALIDATION_REPORT_REJECTED",
            name: "Validation Report Rejected",
            statusColor: "rgba(255, 99, 97, 1)",
          },
          {
            key: "AUTHORISED",
            name: "Authorised",
            statusColor: "rgba(22, 200, 199, 1)",
          },
        ];

        const statusCount: number[] = [];
        const statusColorMap: string[] = [];
        const xAxis: string[] = [];

        projectStatusWithColor.forEach(({ key, name, statusColor }) => {
          const data = response?.data;

          if (data && key in data) {
            statusCount.push(data[key as keyof typeof data]);
            statusColorMap.push(statusColor);
            xAxis.push(name);
          }
        });
        totalProgrammesOptions.xaxis.categories = xAxis;
        totalProgrammesOptions.fill.colors = statusColorMap;
        totalProgrammesOptions.legend.markers.fillColors = statusColorMap;

        setProjectsByStatusDetail([
          {
            name: "Projects",
            data: statusCount,
          },
        ]);
      }
    } catch (error: any) {
      console.log("Error in getting Project Count by Status", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingProjectsByStatusDetail(false);
    }
  };

  const getProjectCountBySector = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingProjectCountBySector(true);
    try {
      const response = await post(API_PATHS.GET_PROJECT_COUNT_BY_SECTOR, {
        isMine: isMine || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sector: sector || undefined,
      });
      if (response && response.data) {
        const sectorWithColor = [
          {
            key: "ENERGY",
            name: "Energy",
            statusColor: "rgba(42, 47, 150, 1)",
          },
          {
            key: "AGRICULTURE",
            name: "Agriculture",
            statusColor: "rgba(93, 39, 107, 1)",
          },
          {
            key: "HEALTH",
            name: "Health",
            statusColor: "rgba(128, 103, 4, 1)",
          },
          {
            key: "TRANSPORT",
            name: "Transport",
            statusColor: "rgba(205, 129, 224, 1)",
          },
          {
            key: "EDUCATION",
            name: "Education",
            statusColor: "rgba(140, 113, 108, 1)",
          },
          {
            key: "MANUFACTURING",
            name: "Manufacturing",
            statusColor: "rgba(249, 203, 51, 1)",
          },
          {
            key: "HOSPITALITY",
            name: "Hospitality",
            statusColor: "rgba(49, 115, 115, 1)",
          },
          {
            key: "FORESTRY",
            name: "Forestry",
            statusColor: "rgba(127, 140, 141, 1)",
          },
          {
            key: "WASTE",
            name: "Waste",
            statusColor: "rgba(195, 54, 106, 1)",
          },
          {
            key: "OTHER",
            name: "Other",
            statusColor: "rgba(135, 51, 52, 1)",
          },
        ];

        const sectorCount: number[] = [];
        const sectorColor: string[] = [];
        const sectorLabels: string[] = [];

        const sectorData = response?.data;

        sectorWithColor.forEach(({ key, name, statusColor }) => {
          if (sectorData && key in sectorData) {
            sectorCount.push(sectorData[key as keyof typeof sectorData]);
            sectorColor.push(statusColor);
            sectorLabels.push(name);
          }
        });

        setProjectCountBySector({
          name: "Projects",
          data: sectorCount,
        });

        sectorPieChartOptions.labels = sectorLabels;
        sectorPieChartOptions.colors = sectorColor;
        sectorPieChartOptions.legend.markers.fillColors = sectorColor;
      }
    } catch (error: any) {
      console.log("Error in getting Project Count By Sector", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingProjectCountBySector(false);
    }
  };

  const getProjectCountBySectoralScope = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingProjectCountBySectoralScope(true);
    try {
      const response = await post(
        API_PATHS.GET_PROJECT_COUNT_BY_SECTORAL_SCOPE,
        {
          isMine: isMine || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sector: sector || undefined,
        }
      );
      if (response && response.data) {
        const sectorMap = SECTOR_TO_SCOPES_MAP[sector];

        const sectoralScopeWithColor = [
          {
            key: "ENERGY_INDUSTRIES",
            name: "Energy Industries (Renewable, Non-Renewable Sources)",
            statusColor: "rgba(35, 43, 184, 1)",
          },
          {
            key: "ENERGY_DISTRIBUTION",
            name: "Energy Distribution",
            statusColor: "rgba(77, 85, 249, 1)",
          },
          {
            key: "ENERGY_DEMAND",
            name: "Energy Demand",
            statusColor: "rgba(156, 160, 217, 1)",
          },
          {
            key: "MANUFACTURING_INDUSTRIES",
            name: "Manufacturing Industries",
            statusColor: "rgba(175, 134, 0, 1)",
          },
          {
            key: "CHEMICAL_INDUSTRIES",
            name: "Chemical Industries",
            statusColor: "rgba(167, 151, 99, 1)",
          },
          {
            key: "CONSTRUCTION",
            name: "Construction",
            statusColor: "rgba(131, 62, 63, 1)",
          },
          {
            key: "TRANSPORT",
            name: "Transport",
            statusColor: "rgba(46, 139, 87, 1)",
          },
          {
            key: "MINING_MINERAL_PRODUCTION",
            name: "Mining/Mineral Production",
            statusColor: "rgba(130, 62, 131, 1)",
          },
          {
            key: "METAL_PRODUCTION",
            name: "Metal Production",
            statusColor: "rgba(229, 217, 126, 1)",
          },
          {
            key: "WASTE_FROM_FUELS",
            name: "Fugitive Emissions from fuels (Solid, Oil and Gas)",
            statusColor: "rgba(27, 79, 114, 1)",
          },
          {
            key: "FUGITIVE_EMISSIONS_PRODUCTION",
            name: "Fugitive Emissions (Halocarbons & SF6)",
            statusColor: "rgba(244, 72, 135, 1)",
          },
          {
            key: "SOLVENT_USE",
            name: "Solvent Use",
            statusColor: "rgba(63, 32, 64, 1)",
          },
          {
            key: "WASTE_HANDLING_AND_DISPOSAL",
            name: "Waste Handling and Disposal",
            statusColor: "rgba(255, 164, 198, 1)",
          },
          {
            key: "AFFORESTATION_AND_REFORESTATION",
            name: "Afforestation and Reforestation",
            statusColor: "rgba(65, 131, 57, 1)",
          },
          {
            key: "AGRICULTURE",
            name: "Agriculture",
            statusColor: "rgba(115, 41, 134, 1)",
          },
          {
            key: undefined,
            name: "Other",
            statusColor: "rgba(87, 85, 81, 1)",
          },
        ].filter((item: any) => {
          if (sectorMap) {
            console.log(
              "-------sectorMap----------",
              sectorMap.includes(String(item?.key)),
              item?.key
            );
            return sectorMap.includes(item?.key);
          } else if (sector) {
            return false;
          } else {
            return true;
          }
        });

        const sectoralCount: number[] = [];
        const sectoralColor: string[] = [];
        const sectoralXAxis: string[] = [];

        const sectorData = response?.data;

        console.log(
          "---------sectoralScopeWithColor-------",
          sectoralScopeWithColor
        );
        sectoralScopeWithColor.forEach(({ key, name, statusColor }) => {
          if (sectorData && key in sectorData) {
            sectoralCount.push(sectorData[key as keyof typeof sectorData]);
            sectoralColor.push(statusColor);
            sectoralXAxis.push(name);
          }
        });

        setProjectCountBySectoralScope([
          {
            name: "Projects",
            data: sectoralCount,
          },
        ]);

        optionSideBar.xaxis.categories = sectoralXAxis;
        optionSideBar.colors = sectoralColor;
        optionSideBar.legend.markers.fillColors = sectoralColor;
      }
    } catch (error: any) {
      console.log("Error in getting Project Count By Sector", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingProjectCountBySectoralScope(false);
    }
  };

  const getCreditSummary = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingCreditSummary(true);
    try {
      const response = await post(API_PATHS.GET_CREDIT_SUMMARY, {
        isMine: isMine || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sector: sector || undefined,
      });
      if (response && response.data) {
        setCreditSummary({
          authorisedAmount: response.data.authorisedAmount || 0,
          issuedAmount: response.data.issuedAmount || 0,
          transferredAmount: response.data.transferredAmount || 0,
          retiredAmount: response.data.retiredAmount || 0,
        });
        setCreditSummaryLastUpdatedEpoch({
          lastAuthorisedTime: response.data.lastAuthorisedTime || 0,
          lastIssuedTime: response.data.lastIssuedTime || 0,
          lastTransferredTime: response.data.lastTransferredTime || 0,
          lastRetiredTime: response.data.lastRetiredTime || 0,
        });
      }
    } catch (error: any) {
      console.log("Error in getting Credit Summary", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingCreditSummary(false);
    }
  };

  const getCreditsSummaryByDate = async (
    isMine?: boolean,
    startDate?: number,
    endDate?: number,
    sector?: ProjectSectorEnum
  ) => {
    setLoadingCreditsSummaryByDate(true);
    try {
      const response = await post(API_PATHS.GET_CREDIT_SUMMARY_BY_DATE, {
        isMine: isMine || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sector: sector || undefined,
        timeZone: new Date().getTimezoneOffset(),
      });
      if (response && response.data) {
        const creditRetirementAndTranserStatuses = [
          { key: "RETIRE_APPROVED", name: "Retired" },
          { key: "CREDIT_TRANSFERED", name: "Transferred" },
        ];
        const categoriesRetirement = [
          ...new Set(
            response.data
              ?.filter((item: any) =>
                creditRetirementAndTranserStatuses.some(
                  ({ key }) => key in item
                )
              )
              .map((item: any) => item.date)
          ),
        ];
        const categoriesAll = [
          ...new Set(response.data?.map((item: any) => item.date)),
        ];
        const creditByRetirementSeries = creditRetirementAndTranserStatuses.map(
          (creditStatusObj) => {
            return {
              name: creditStatusObj.name,
              data: categoriesRetirement.map((date) => {
                const entry = response.data?.find(
                  (item: any) => item.date === date
                );
                return entry && entry[creditStatusObj.key]
                  ? parseFloat(entry[creditStatusObj.key])
                  : 0; // Use value or default to 0
              }),
            };
          }
        );

        const creditStatuses = [
          { key: "CREDITS_AUTHORISED", name: "Authorised" },
          { key: "CREDITS_ISSUED", name: "Issued" },
          { key: "CREDIT_TRANSFERED", name: "Transferred" },
          { key: "RETIRE_APPROVED", name: "Retired" },
        ];

        const creditByStatusSeries = creditStatuses.map((creditStatusObj) => {
          return {
            name: creditStatusObj.name,
            data: categoriesAll.map((date) => {
              const entry = response.data?.find(
                (item: any) => item.date === date
              );
              return entry && entry[creditStatusObj.key]
                ? parseFloat(entry[creditStatusObj.key])
                : 0; // Use value or default to 0
            }),
          };
        });

        const hasValidRetireData = creditByRetirementSeries.some(
          (series) =>
            Array.isArray(series.data) &&
            series.data.length > 0 &&
            series.data.some((v) => v !== 0)
        );

        if (hasValidRetireData) {
          retirementsByDateOptions.xaxis.categories = categoriesRetirement;

          // Set total of stacked bars as annotations on top of each bar
          const retireNTransfertotals = creditByRetirementSeries?.[0].data.map(
            (_: any, index: any) =>
              creditByRetirementSeries?.reduce(
                (sum: any, seriesArr: any) => sum + seriesArr.data[index],
                0
              )
          );
          const retireNTransfertotalAnnotations = retireNTransfertotals.map(
            (total: any, index: any) => ({
              x: retirementsByDateOptions.xaxis.categories[index],
              y: total,
              marker: {
                size: 0, // Remove the circle marker
              },
              label: {
                text:
                  total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
                style: {
                  fontSize: "12px",
                  color: "#000",
                  background: "transparent",
                  stroke: "none !important",
                  borderRadius: 0, // No rounded corners
                  borderColor: "transparent", // Remove the border
                },
              },
            })
          );

          retirementsByDateOptions.annotations = {
            ...(retirementsByDateOptions.annotations || {}),
            points: retireNTransfertotalAnnotations,
          };

          // Add totals as annotations

          setCreditsTrRtSummaryByDate(creditByRetirementSeries);
        } else {
          setCreditsTrRtSummaryByDate([
            {
              name: "Credit",
              data: [],
            },
          ]);
        }

        const hasValidAllData = creditByStatusSeries.some(
          (series) =>
            Array.isArray(series.data) &&
            series.data.length > 0 &&
            series.data.some((v) => v !== 0)
        );

        if (hasValidAllData) {
          creditsByDateOptions.xaxis.categories = categoriesAll;

          // Set total of stacked bars as annotations on top of each bar
          const totals = creditByStatusSeries?.[0].data.map(
            (_: any, index: any) =>
              creditByStatusSeries?.reduce(
                (sum: any, seriesArr: any) => sum + seriesArr.data[index],
                0
              )
          );
          const totalAnnotations = totals.map((total: any, index: any) => ({
            x: creditsByDateOptions.xaxis.categories[index],
            y: total,
            marker: {
              size: 0,
            },
            label: {
              text:
                total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
              style: {
                fontSize: "12px",
                color: "#000",
                background: "transparent",
                stroke: "none !important",
                borderRadius: 0,
                borderColor: "transparent",
              },
            },
          }));

          creditsByDateOptions.annotations = {
            ...(creditsByDateOptions.annotations || {}),
            points: totalAnnotations,
          };

          setCreditsAllSummaryByDate(creditByStatusSeries);
        } else {
          setCreditsAllSummaryByDate([
            {
              name: "Credit",
              data: [],
            },
          ]);
        }
      }
    } catch (error: any) {
      console.log("Error in getting Credit Summary By Date", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingCreditsSummaryByDate(false);
    }
  };

  const onOverallMineClick = async (
    clickedButton: OverallMineButtons
  ): Promise<void> => {
    setOverallMineButton(clickedButton);
  };

  const onChangeRange = async (dateMoment: any) => {
    try {
      if (!dateMoment) {
        setStartTime(0);
        setEndTime(0);
      }
      if (dateMoment !== null && dateMoment[1] !== null) {
        setStartTime(
          Date.parse(String(moment(dateMoment[0]?._d).startOf("day")))
        );
        setEndTime(Date.parse(String(moment(dateMoment[1]?._d).endOf("day"))));
      } else {
        setStartTime(0);
        setEndTime(0);
      }
    } catch (e: any) {
      setStartTime(0);
      setEndTime(0);
    }
  };

  const onSectorChange = (value: ProjectSectorEnum) => {
    setSector(value);
  };

  //MARK: Update the chart width on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1600) {
        setScopeBarChartWidth("270%");
        setStatusBarChartWidth("300%");
        setCreditChartsWidth("510%");
        setSectorPieChartWidth("150%");
      } else if (window.innerWidth > 1200) {
        setScopeBarChartWidth("220%");
        setStatusBarChartWidth("200%");
        setCreditChartsWidth("390%");
        setSectorPieChartWidth("90%");
      } else {
        setScopeBarChartWidth("220%");
        setStatusBarChartWidth("300%");
        setCreditChartsWidth("390%");
        setSectorPieChartWidth("90%");
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [window.innerWidth]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProjectSummaryLastUpdated((prev) => ({
        last_pending_project_time:
          projectSummaryLastUpdatedEpoch.last_pending_project_time
            ? moment(
                projectSummaryLastUpdatedEpoch.last_pending_project_time
              ).fromNow()
            : prev.last_pending_project_time,
        last_credit_issued_time:
          projectSummaryLastUpdatedEpoch.last_credit_issued_time
            ? moment(
                projectSummaryLastUpdatedEpoch.last_credit_issued_time
              ).fromNow()
            : prev.last_credit_issued_time,
        last_retire_approved_time:
          projectSummaryLastUpdatedEpoch.last_retire_approved_time
            ? moment(
                projectSummaryLastUpdatedEpoch.last_retire_approved_time
              ).fromNow()
            : prev.last_retire_approved_time,
      }));

      if (projectStatusSummaryLastUpdatedEpoch) {
        setProjectStatusSummaryLastUpdated(
          moment(projectStatusSummaryLastUpdatedEpoch).fromNow()
        );
      }

      setCreditSummaryLastUpdated((prev) => ({
        lastAuthorisedTime: creditSummaryLastUpdatedEpoch.lastAuthorisedTime
          ? moment(creditSummaryLastUpdatedEpoch.lastAuthorisedTime).fromNow()
          : prev.lastAuthorisedTime,
        lastIssuedTime: creditSummaryLastUpdatedEpoch.lastIssuedTime
          ? moment(creditSummaryLastUpdatedEpoch.lastIssuedTime).fromNow()
          : prev.lastIssuedTime,
        lastTransferredTime: creditSummaryLastUpdatedEpoch.lastTransferredTime
          ? moment(creditSummaryLastUpdatedEpoch.lastTransferredTime).fromNow()
          : prev.lastTransferredTime,
        lastRetiredTime: creditSummaryLastUpdatedEpoch.lastRetiredTime
          ? moment(creditSummaryLastUpdatedEpoch.lastRetiredTime).fromNow()
          : prev.lastRetiredTime,
      }));
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [
    projectSummaryLastUpdatedEpoch,
    projectStatusSummaryLastUpdatedEpoch,
    creditSummaryLastUpdatedEpoch,
  ]);

  useEffect(() => {
    getPendingActions();
    getProjectSummary();
  }, []);

  useEffect(() => {
    const isMine = overallMineButton === OverallMineButtons.MINE;

    getProjectStatusSummary(isMine, startTime, endTime, sector);
    getProjectsByStatusDetail(isMine, startTime, endTime, sector);
    getProjectCountBySectoralScope(isMine, startTime, endTime, sector);
    getProjectCountBySector(isMine, startTime, endTime, sector);
    getCreditSummary(isMine, startTime, endTime, sector);
    getCreditsSummaryByDate(isMine, startTime, endTime, sector);
  }, [overallMineButton, startTime, endTime, sector]);

  //MARK: HTML
  return (
    <div className="slcf-dashboard-main-container">
      <div className="dashboard-inner-container">
        {isMultipleDashboardsVisible && (
          <div
            className="systemchange-container"
            style={{ marginLeft: `20px` }}
          >
            <ButtonGroup>
              <Button type="primary" className="slcf-primary">
                SLCF PROJECTS
              </Button>
              <Link to={ROUTES.REGISTRY_DASHBOARD}>
                <Button className="slcf-default">ARTICLE 6.4 PROJECTS</Button>
              </Link>
            </ButtonGroup>
          </div>
        )}
        <div
          className="statistics-cards-container"
          style={{ marginTop: `50px` }}
        >
          <Row gutter={[40, 40]} className="statistics-card-row">
            <Col xxl={8} xl={8} md={12} className="statistics-card-col">
              <SLStatisticsCard
                value={String(projectSummary.total_pending_projects)}
                title={t("totalProjects")}
                updatedDate={
                  projectSummaryLastUpdated.last_pending_project_time
                }
                icon={<AppstoreOutlined />}
                loading={loadingProjectSummary}
                backgroundColorClass="background-purple"
                tooltip={t("totalProjectsTooltip")}
                t={t}
              />
            </Col>
            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <SLStatisticsCard
                value={String(addCommSep(projectSummary.total_credits_issued))}
                title={t("totalCredits")}
                updatedDate={projectSummaryLastUpdated.last_credit_issued_time}
                icon={<CreditCard2Back />}
                loading={loadingProjectSummary}
                backgroundColorClass="background-blue"
                tooltip={t("totalCreditsTooltip")}
                t={t}
              />
            </Col>
            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <SLStatisticsCard
                value={String(addCommSep(projectSummary.total_credits_retired))}
                title={t("totalRetiredCredits")}
                updatedDate={
                  projectSummaryLastUpdated.last_retire_approved_time
                }
                icon={<ClockHistory />}
                loading={loadingProjectSummary}
                backgroundColorClass="background-green"
                tooltip={t("totalRetiredCreditsTooltip")}
                t={t}
              />
            </Col>
          </Row>
        </div>
        <div className="statistics-and-charts-container center">
          <Row className="statistic-card-row">
            <Col
              className="statistic-card-col retirements-by-date-chart-col"
              style={{ width: "100%" }}
            >
              <PendingActionsComponent
                pendingActionData={pendingActions}
                loading={loadingPendingActions}
                toolTipText={t("pendingTaskTooltip")}
                t={t}
              />
            </Col>
          </Row>
        </div>
        <div className="filter-container">
          <Row>
            <div className="systemchange-container">
              {userInfoState?.companyRole !==
              CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ? (
                <ButtonGroup>
                  <Button
                    size="large"
                    onClick={() =>
                      onOverallMineClick(OverallMineButtons.OVERALL)
                    }
                    type={
                      overallMineButton === OverallMineButtons.OVERALL
                        ? "primary"
                        : "default"
                    }
                    className="slcf-primary"
                  >
                    {OverallMineButtons.OVERALL}
                  </Button>
                  <Button
                    onClick={() => onOverallMineClick(OverallMineButtons.MINE)}
                    type={
                      overallMineButton === OverallMineButtons.MINE
                        ? "primary"
                        : "default"
                    }
                    className="slcf-default"
                  >
                    MY ORGANISATION
                  </Button>
                </ButtonGroup>
              ) : (
                <></>
              )}
            </div>
          </Row>
          <Row>
            <div className="date-filter">
              <RangePicker
                ranges={{
                  Today: [moment(), moment()],
                  "Last 7 days": [moment().subtract("6", "days"), moment()],
                  "Last 14 days": [moment().subtract("13", "days"), moment()],
                }}
                defaultValue={[moment().subtract("6", "months"), moment()]}
                showTime
                allowClear={true}
                format="DD:MM:YYYY"
                onChange={onChangeRange}
              />
            </div>
            <div className="category-filter">
              <Select
                style={{ width: 270 }}
                placeholder={t("selectProjectSector")}
                options={Object.keys(ProjectSectorEnum).map((key) => ({
                  value: key,
                  label: (
                    ProjectSectorEnum as Record<string, ProjectSectorEnum>
                  )[key],
                }))}
                onChange={onSectorChange}
                allowClear
              />
            </div>
          </Row>
        </div>
        <div className="statistics-and-charts-container center">
          {/* <Row className="statistic-card-row">
            <Col
              className="statistic-card-col retirements-by-date-chart-col"
              style={{ width: "100%" }}
            >
              <SLCFDetailsBarChartsStatComponent
                id="total-programmes"
                title={t("totalProgrammesByStatusSLCF")}
                options={totalProgrammesOptions}
                series={projectsByStatusDetail}
                loading={loadingProjectsByStatusDetail}
                toolTipText={t("totalProgrammesByStatusTooltip")}
                Chart={Chart}
                height="440px"
                // width="600px"
                width={statusBarchartWidth}
              />
            </Col>
          </Row> */}
        </div>
        <div className="statistics-and-charts-container center">
          <Row gutter={[20, 20]} className="statistic-card-row">
            <Col xxl={7} xl={7} md={11} className="statistic-card-col">
              <ProgrammeRejectAndTransferComponent
                totalProgrammes={projectStatusSummary?.totalProjects}
                pending={projectStatusSummary?.pendingCount}
                rejected={projectStatusSummary?.rejectedCount}
                authorized={projectStatusSummary?.authorisedCount}
                updatedDate={projectStatusSummaryLastUpdated}
                loading={loadingProjectStatusSummary}
                toolTipText={t("projectSummaryTooltip")}
                t={t}
              />
            </Col>
            <Col
              xxl={17}
              xl={17}
              md={13}
              className="statistic-card-col"
              style={{ paddingRight: "0px" }}
            >
              <SLCFDetailsBarChartsStatComponent
                id="total-programmes"
                title={t("totalProgrammesByStatusSLCF")}
                options={totalProgrammesOptions}
                series={projectsByStatusDetail}
                loading={loadingProjectsByStatusDetail}
                toolTipText={t("totalProgrammesByStatusTooltip")}
                Chart={Chart}
                height="440px"
                // width="600px"
                width={statusBarchartWidth}
              />
            </Col>

            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <SectorPieChart
                id="credits"
                title={t("projectsBySectoralScope")}
                options={sectorPieChartOptions}
                series={projectCountBySector}
                loading={loadingProjectCountBySector}
                toolTipText={t("projectsBySectoralScopeTooltip")}
                width={sectorPieChartWidth}
                Chart={Chart}
              />
            </Col>
            <Col
              xxl={16}
              xl={16}
              md={12}
              className="statistic-card-col"
              style={{ paddingRight: "0px" }}
            >
              <SLCFSideBarChartsStatComponent
                id="credits"
                title={t("projectsBySectoralScope")}
                options={optionSideBar}
                series={projectCountBySectoralScope}
                loading={loadingProjectCountBySectoralScope}
                toolTipText={t("projectsBySectoralScopeTooltip")}
                sector={sector}
                width={scopeBarchartWidth}
                Chart={Chart}
              />
            </Col>
          </Row>
        </div>
        <div className="statistics-and-charts-container center retirement-by-date-container">
          <Row className="statistic-card-row">
            <Col className="statistic-card-col retirements-by-date-chart-col">
              <SLCFBarChartsStatComponent
                id="total-retirement-by-date"
                title={t("retirementsByDateSLCF")}
                options={retirementsByDateOptions}
                series={creditsTrRtSummaryByDate}
                lastUpdate={undefined}
                loading={loadingCreditsSummaryByDate}
                toolTipText={t("retirementsByDateTooltip")}
                Chart={Chart}
                height="400px"
                // width="650px"
                width={creditChartsWidth}
              />
            </Col>
          </Row>
        </div>
        <div className="statistics-and-charts-container center credits-by-status-container">
          <div className="credits-by-status-row">
            <div className="credits-by-status-top">
              <div className="credits-by-status-title">
                {t("creditsByStatusSLCF")}
              </div>
              <div className="info-container">
                <Tooltip
                  arrowPointAtCenter
                  placement="bottomRight"
                  trigger="hover"
                  title={t("creditByStatusTooltip")}
                >
                  <InfoCircle color="#000000" size={17} />
                </Tooltip>
              </div>
            </div>
            <Row gutter={[20, 20]} className="statistic-card-row">
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={String(addCommSep(creditSummary.authorisedAmount))}
                  title={t("authorisedCreditsTotal")}
                  updatedDate={creditSummaryLastUpdated.lastAuthorisedTime}
                  icon={<HandThumbsUp />}
                  loading={loadingCreditSummary}
                  backgroundColorClass="background-green"
                  tooltip={t("authorisedCreditsTotalTooltip")}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={String(addCommSep(creditSummary.issuedAmount))}
                  title={t("issuedCreditsTotal")}
                  updatedDate={creditSummaryLastUpdated.lastIssuedTime}
                  icon={<FileEarmarkCheck />}
                  loading={loadingCreditSummary}
                  backgroundColorClass="background-blue"
                  tooltip={t("issuedCreditsTotalTooltip")}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={String(addCommSep(creditSummary.transferredAmount))}
                  title={t("transferredCreditsTotal")}
                  updatedDate={creditSummaryLastUpdated.lastTransferredTime}
                  icon={<BoxArrowRight />}
                  loading={loadingCreditSummary}
                  backgroundColorClass="background-purple"
                  tooltip={t("transferredCreditsTotalTooltip")}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={String(addCommSep(creditSummary.retiredAmount))}
                  title={t("retiredCreditsTotal")}
                  updatedDate={creditSummaryLastUpdated.lastRetiredTime}
                  icon={<ClockHistory />}
                  loading={loadingCreditSummary}
                  backgroundColorClass="background-red"
                  tooltip={t("retiredCreditsTotalTooltip")}
                  t={t}
                />
              </Col>
            </Row>
          </div>
        </div>
        <div className="statistics-and-charts-container center">
          <Row className="statistic-card-row">
            <Col className="statistic-card-col credits-by-date-chart-col">
              <SLCFBarChartsStatComponent
                id="total-credits"
                title={t("totalCreditsByDateSLCF")}
                options={creditsByDateOptions}
                series={creditsAllSummaryByDate}
                lastUpdate={"0"}
                loading={loadingCreditsSummaryByDate}
                toolTipText={t("totalCreditsByDateTooltip")}
                Chart={Chart}
                height="400px"
                width={creditChartsWidth}
              />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};
