/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Col,
  Empty,
  message,
  PaginationProps,
  Row,
  Table,
  Popover,
  List,
  Typography,
  Modal,
  Spin,
} from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { API_PATHS } from "../../../Config/apiConfig";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import * as Icon from "react-bootstrap-icons";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { CreditIssuanceInterface } from "../Interfaces/creditIssuance.interface";
import { CreditHistoryEntry } from "../../../Components/CreditHistoryGraph/creditHistoryGraph.types";
import { CreditHistoryGraph } from "../../../Components/CreditHistoryGraph/CreditHistoryGraph";
import { ProjectDetailsLink } from "../../../Components/ProjectDetailsLink/projectDetailsLink";
import {
  FilterBar,
  FilterValue,
  FilterValues,
  usePaginatedEntityFilter,
} from "../../../Components/Common/FilterBar";

enum CreditIssuanceColumns {
  SERIAL_NO = "serialNo",
  ORGANIZATION_NAME = "organization",
  PROJECT_NAME = "projectName",
  CREDITS = "noOfCredits",
  ISSUANCE_DATE = "issuanceDate",
}

// Raw row from POST .../queryIssuances (CreditBlockIssuancesViewEntity).
interface IssuanceQueryRow {
  id: string;
  serialNumber: string;
  creditAmount: number;
  issuanceDate: number | string;
  projectId: string;
  projectName: string;
  projectOwnerId: number;
  organizationId: number;
  organizationName: string;
  organizationLogo: string | null;
}

// Vintage is the serial number's trailing segment, e.g.
// "CA0NNN-NG-XX-1-1-14-2023" -> "2023".
const vintageFromSerial = (serialNumber: string): string | undefined => {
  const parts = serialNumber.split("-");
  return parts.length >= 7 ? parts[6] : undefined;
};

const mapIssuanceRow = (row: IssuanceQueryRow): CreditIssuanceInterface => ({
  id: row.id,
  serialNumber: row.serialNumber,
  creditAmount: row.creditAmount,
  issuanceDate: String(row.issuanceDate),
  projectId: row.projectId,
  projectName: row.projectName,
  projectOwnerId: row.projectOwnerId,
  organizationId: row.organizationId,
  organizationName: row.organizationName,
  organizationLogo: row.organizationLogo,
  vintage: vintageFromSerial(row.serialNumber),
});

// The block's own creditBlockId is its serial's first 5 segments (matches
// SerialNumberManagementService.getCreditBlockId) — the issuance row's own
// `id` is the credit-transaction id, not the block id creditBlockHistory needs.
const creditBlockIdFromSerial = (serialNumber: string): string =>
  serialNumber.split("-").slice(0, 5).join("-");

const INITIAL_FILTER_VALUES: FilterValues = {
  organization: [],
  project: [],
  vintage: undefined,
};

interface CreditIssuanceTableProps {
  t: (key: string) => string;
}

export const CreditIssuanceTableComponent = ({ t }: CreditIssuanceTableProps) => {
  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const isProjectDeveloper = userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER;
  const isInitialRender = useRef(false);
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CreditIssuanceInterface[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [viewModalRecord, setViewModalRecord] = useState<CreditIssuanceInterface | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyEntries, setHistoryEntries] = useState<CreditHistoryEntry[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>(INITIAL_FILTER_VALUES);

  // Org & Project dropdowns load lazily, page-by-page, and search server-side
  // (see usePaginatedEntityFilter) rather than preloading the whole list.
  const orgFilter = usePaginatedEntityFilter({
    endpoint: API_PATHS.ORGANIZATION_NAME_IDS,
    id: "organization",
    mode: "multiple",
    placeholder: t("filterByOrganization"),
    labelKey: "name",
    valueKey: "companyId",
    sortKey: "name",
    extraFilters: [
      { key: "companyRole", operation: "=", value: CompanyRole.PROJECT_DEVELOPER },
      { key: "state", operation: "in", value: ["0", "1"] },
    ],
    selectedValues: filterValues.organization as FilterValue[],
  });

  // The issuances view's projectId column is the project's refId; only
  // projects with at least one issued credit are worth offering here.
  const projectFilter = usePaginatedEntityFilter({
    endpoint: API_PATHS.PROJECT_NAME_IDS,
    id: "project",
    mode: "multiple",
    placeholder: t("filterByProject"),
    labelKey: "title",
    valueKey: "refId",
    sortKey: "title",
    extraFilters: [{ key: "creditIssued", operation: ">", value: 0 }],
    selectedValues: filterValues.project as FilterValue[],
  });

  const getQueryData = async () => {
    setLoading(true);

    try {
      const orgIds = filterValues.organization as number[];
      const projectIds = filterValues.project as string[];
      const filterAnd: any[] = [];
      if (orgIds.length > 0) {
        filterAnd.push({ key: "organizationId", operation: "in", value: orgIds });
      }
      if (projectIds.length > 0) {
        filterAnd.push({ key: "projectId", operation: "in", value: projectIds });
      }
      const vintageYear = filterValues.vintage as number | undefined;
      if (vintageYear !== undefined) {
        filterAnd.push({
          key: "vintageRange",
          operation: "=",
          value: { from: vintageYear, to: vintageYear },
        });
      }
      const sort = sortField && sortOrder
        ? { key: sortField, order: sortOrder, nullFirst: false }
        : { key: "issuanceDate", order: "DESC" };

      const response: any = await post(API_PATHS.CREDIT_ISSUANCES_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd,
        sort,
      });

      const rows: IssuanceQueryRow[] = response?.data ?? [];
      setTableData(rows.map(mapIssuanceRow));
      setTotalProgramme(response?.response?.data?.total ?? 0);
    } catch (error: any) {
      console.error("Error in getting credit issuances", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const onNavigateToProgrammeView = async (record: CreditIssuanceInterface) => {
    setViewModalRecord(record);
    setHistoryEntries([]);
    setHistoryLoading(true);
    try {
      const response: any = await post(API_PATHS.CREDIT_BLOCK_HISTORY, {
        blockId: creditBlockIdFromSerial(record.serialNumber),
      });
      setHistoryEntries(response?.data?.history ?? []);
    } catch (error: any) {
      console.error("Error in getting credit block history", error);
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const actionMenu = (record: CreditIssuanceInterface) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t("projectList:view"),
            icon: <Icon.InfoCircle />,
            click: () => {
              onNavigateToProgrammeView(record);
            },
          },
        ]}
        renderItem={(item) => (
          <List.Item onClick={item.click}>
            <Typography.Text className="action-icon color-primary">
              {item.icon}
            </Typography.Text>
            <span>{item.text}</span>
          </List.Item>
        )}
      />
    );
  };

  const columns = [
    {
      title: t(CreditIssuanceColumns.PROJECT_NAME),
      key: "projectName",
      sorter: true,
      align: "left" as const,
      render: (record: CreditIssuanceInterface) => {
        return (
          <ProjectDetailsLink
            projectId={record.projectId}
            projectName={record.projectName}
            projectOwnerId={record.projectOwnerId}
          />
        );
      },
    },
    {
      title: t(CreditIssuanceColumns.ORGANIZATION_NAME),
      key: "organizationName",
      sorter: true,
      align: "left" as const,
      render: (record: CreditIssuanceInterface) => {
        return (
          <div className="org-list">
            <Row>
              <ProfileIcon
                icon={record.organizationLogo}
                bg={"rgba(185, 226, 244, 0.56)"}
                name={record.organizationName}
              />
              <span style={{ marginTop: "6px" }}>{record.organizationName}</span>
            </Row>
          </div>
        );
      },
    },
    {
      title: t(CreditIssuanceColumns.SERIAL_NO),
      key: "serialNumber",
      sorter: true,
      align: "left" as const,
      render: (record: CreditIssuanceInterface) => {
        return <span>{record?.serialNumber}</span>;
      },
    },
    {
      title: t(CreditIssuanceColumns.ISSUANCE_DATE),
      key: "issuanceDate",
      sorter: true,
      align: "center" as const,
      render: (record: CreditIssuanceInterface) => {
        return <span>{moment(Number(record?.issuanceDate)).format("YYYY-MM-DD HH:mm:ss")}</span>;
      },
    },
    {
      title: t(CreditIssuanceColumns.CREDITS),
      key: "creditAmount",
      sorter: true,
      align: "right" as const,
      render: (record: CreditIssuanceInterface) => {
        return <span>{addCommSep(String(record?.creditAmount))}</span>;
      },
    },
    {
      title: '',
      width: 6,
      align: "right" as const,
      key: "action",
      render: (_: unknown, record: CreditIssuanceInterface) => {
        return (
          <Popover placement="bottomRight" content={actionMenu(record)} trigger="click">
            <EllipsisOutlined
              rotate={90}
              style={{ fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
            />
          </Popover>
        );
      },
    },
  ];

  const onPaginationChange: PaginationProps["onChange"] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onHandleTableChange = (
    _pagination: any,
    _filters: any,
    sorter: any
  ) => {
    setSortOrder(
      sorter.order === "ascend"
        ? "ASC"
        : sorter.order === "descend"
        ? "DESC"
        : undefined
    );
    setSortField(sorter.columnKey);
  };

  useEffect(() => {
    getQueryData();
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      getQueryData();
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (isInitialRender.current) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        getQueryData();
      }
    }
  }, [sortField, sortOrder, filterValues.organization, filterValues.project, filterValues.vintage]);

  // Declared last so it runs after the two effects above on the initial
  // mount pass (effects fire in declaration order within the same commit) —
  // flipping this here, rather than inside the first effect, is what keeps
  // their `isInitialRender.current` check false during that mount pass, so
  // they don't also redundantly re-fetch alongside the unconditional mount
  // fetch above.
  useEffect(() => {
    isInitialRender.current = true;
  }, []);

  return (
    <div className="content-card">
      <FilterBar
        controls={[
          { ...orgFilter.control, visible: !isProjectDeveloper },
          projectFilter.control,
          {
            id: "vintage",
            type: "year",
            placeholder: t("filterByVintage"),
            width: 180,
          },
        ]}
        values={filterValues}
        onChange={(id, value) => setFilterValues((prev) => ({ ...prev, [id]: value }))}
        onClearAll={() => setFilterValues(INITIAL_FILTER_VALUES)}
        disabled={loading}
        appliedFiltersLabel={t("appliedFilters")}
        clearAllLabel={t("clearAll")}
        selectAllLabel={t("selectAll")}
      />
      <Row>
        <Col span={24}>
          <div className="credit-table-container">
            <Table
              dataSource={tableData}
              columns={columns}
              className="common-table-class"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalProgramme,
                showQuickJumper: true,
                showSizeChanger: true,
                onChange: onPaginationChange,
              }}
              onChange={onHandleTableChange}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={tableData.length === 0 ? t("noCredits") : null}
                  />
                ),
              }}
            />
          </div>
        </Col>
      </Row>
      <Modal
        className="credit-info-modal"
        title="Credit Information"
        open={!!viewModalRecord}
        onCancel={() => setViewModalRecord(null)}
        footer={null}
        width={900}
        centered
        destroyOnClose
      >
        {viewModalRecord && (
          <>
            <div className="credit-view-overview-title">Overview</div>
            <div className="credit-view-overview">
              {[
                { label: "Project Name", value: viewModalRecord.projectName },
                { label: "Organization", value: viewModalRecord.organizationName },
                { label: "Serial Number", value: viewModalRecord.serialNumber },
                {
                  label: "Issuance Date",
                  value: moment(Number(viewModalRecord.issuanceDate)).format("MMM DD, YYYY"),
                },
                { label: "No. of Credits", value: addCommSep(String(viewModalRecord.creditAmount)) },
              ].map((f) => (
                <div className="credit-view-overview-row" key={f.label}>
                  <div className="credit-view-overview-label">{f.label}</div>
                  <div className="credit-view-overview-value">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="credit-view-history-title">History</div>
            {historyLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Spin />
              </div>
            ) : historyEntries.length ? (
              <CreditHistoryGraph
                entries={historyEntries}
                serial={viewModalRecord.serialNumber}
                interactiveSelection
                collapseStrategy="depth"
                defaultSelection="none"
                defaultMode="binary"
                height="50vh"
              />
            ) : (
              <Empty description="No history available" />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};
