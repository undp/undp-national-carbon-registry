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
  Tag,
  Tooltip,
  Modal,
  Spin,
} from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { API_PATHS } from "../../../Config/apiConfig";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import { CreditBlockStatus } from "../Enums/creditEventEnum";
import * as Icon from "react-bootstrap-icons";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { CreditBlockInterface } from "../Interfaces/creditBlock.interface";
import { CreditHistoryEntry } from "../../../Components/CreditHistoryGraph/creditHistoryGraph.types";
import { ProjectDetailsLink } from "../../../Components/ProjectDetailsLink/projectDetailsLink";
import { CreditHistoryGraph } from "../../../Components/CreditHistoryGraph/CreditHistoryGraph";
import {
  FilterBar,
  FilterValue,
  FilterValues,
  usePaginatedEntityFilter,
} from "../../../Components/Common/FilterBar";
import { getCreditBlockStatusTagColor } from "./creditTableHelpers";
import { CreditTypePill } from "./creditTypePill";
import { useCountryOptions } from "../../../Components/Common/hooks/useCountryOptions";

enum CreditBlockColumns {
  SERIAL_NO = "serialNo",
  ORGANIZATION_NAME = "organization",
  PROJECT_NAME = "projectName",
  CREDITS = "balance",
  RESERVED = "reservedCredits",
  CREDIT_TYPE = "creditType",
  UPDATE_DATE = "updateDate",
  CURRENT_STATUS = "currentStatus",
  FIRST_TRANSFER = "firstTransfer",
}

// Raw row from POST .../queryExplorer (CreditBlockExplorerViewEntity +
// `firstTransfer`: the acquiring Party's ISO alpha-2 code from the block's
// Article 6 first transfer, null until it's been first transferred).
interface ExplorerQueryRow {
  id: string;
  serialNumber: string;
  itmoSerial: string | null;
  itmoAuthorizationRecord: string | null;
  organizationId: number;
  organizationName: string;
  organizationLogo: string | null;
  projectId: string;
  projectName: string;
  balance: number;
  reserved: number;
  status: string;
  updatedTime: number | string;
  firstTransfer: string | null;
}

const mapExplorerRow = (row: ExplorerQueryRow): CreditBlockInterface => ({
  id: row.id,
  serialNumber: row.serialNumber,
  itmoSerial: row.itmoSerial,
  itmoAuthorizationRecord: row.itmoAuthorizationRecord,
  creditBalance: row.balance,
  reserved: row.reserved,
  updateDate: String(row.updatedTime),
  organizationId: row.organizationId,
  organizationName: row.organizationName,
  organizationLogo: row.organizationLogo,
  projectId: row.projectId,
  projectName: row.projectName,
  currentStatus: row.status as CreditBlockStatus,
  firstTransfer: row.firstTransfer ?? "-",
  vintage: vintageFromSerial(row.serialNumber),
});

// The block's range, encoded in its serial (…-start-end-vintage). Pins the
// history graph's path to this block rather than the deepest leaf.
const currentRangeFromSerial = (serialNumber: string): string | undefined => {
  const parts = serialNumber.split("-");
  return parts.length >= 6 ? `${parts[4]}-${parts[5]}` : undefined;
};

// Vintage is the serial number's trailing segment, e.g.
// "CA0NNN-NG-XX-1-1-14-2023" -> "2023".
const vintageFromSerial = (serialNumber: string): string | undefined => {
  const parts = serialNumber.split("-");
  return parts.length >= 7 ? parts[6] : undefined;
};

// FilterBar's "select all" pseudo-option for the status checkbox group —
// never sent to the backend (see the `statuses` filter in getQueryData).
const STATUS_ALL = "All";

const INITIAL_FILTER_VALUES: FilterValues = {
  status: [STATUS_ALL, ...Object.values(CreditBlockStatus)],
  organization: [],
  project: [],
  serialSearch: "",
};

const SerialSearchInfoContent = ({ t }: { t: (key: string) => string }) => (
  <div className="serial-search-info">
    <p className="serial-search-info__intro">
      {t("serialSearchInfo.intro")}
    </p>
    <div className="serial-search-info__grid">
      <section className="serial-search-info__card">
        <div className="serial-search-info__heading">
          <span className="serial-search-info__number">1</span>
          <strong>{t("serialSearchInfo.fullSerialTitle")}</strong>
        </div>
        <p>{t("serialSearchInfo.fullSerialDescription")}</p>
        <div className="serial-search-info__example">
          <span>{t("serialSearchInfo.example")}</span>
          <code>CA0NNN-NG-XX-32-3001-4000-2023</code>
        </div>
        <p>
          {t("serialSearchInfo.fullSerialRangeDescription")}
        </p>
        <div className="serial-search-info__example">
          <span>{t("serialSearchInfo.example")}</span>
          <code>CA0NNN-NG-XX-32-3500-3500-2023</code>
        </div>
      </section>
      <section className="serial-search-info__card">
        <div className="serial-search-info__heading">
          <span className="serial-search-info__number">2</span>
          <strong>{t("serialSearchInfo.singleCreditTitle")}</strong>
        </div>
        <p>{t("serialSearchInfo.singleCreditDescription")}</p>
        <div className="serial-search-info__example">
          <span>{t("serialSearchInfo.example")}</span>
          <code>3500</code>
          <span>{t("serialSearchInfo.singleCreditMatch")}</span>
        </div>
      </section>
      <section className="serial-search-info__card">
        <div className="serial-search-info__heading">
          <span className="serial-search-info__number">3</span>
          <strong>{t("serialSearchInfo.numberRangeTitle")}</strong>
        </div>
        <p>{t("serialSearchInfo.numberRangeDescription")}</p>
        <div className="serial-search-info__codes">
          <span>{t("serialSearchInfo.example")}</span>
          <code>3200-3600</code>
          <span>{t("serialSearchInfo.or")}</span>
          <code>3200-3600-2023</code>
        </div>
      </section>
      <section className="serial-search-info__card">
        <div className="serial-search-info__heading">
          <span className="serial-search-info__number">4</span>
          <strong>{t("serialSearchInfo.serialPrefixTitle")}</strong>
        </div>
        <p>{t("serialSearchInfo.serialPrefixDescription")}</p>
        <div className="serial-search-info__prefixes">
          <span>{t("serialSearchInfo.example")}</span>
          <code>CA0NNN-NG-XX-32</code>
          <span>({t("serialSearchInfo.byProject")}) {t("serialSearchInfo.or")}</span>
          <code>CA0NNN-NG-XX-32-3001</code>
          <span>({t("serialSearchInfo.byProjectAndCredit")})</span>
        </div>
      </section>
      <section className="serial-search-info__card serial-search-info__card--wide">
        <div className="serial-search-info__heading">
          <span className="serial-search-info__number">5</span>
          <strong>{t("serialSearchInfo.textFragmentTitle")}</strong>
        </div>
        <p>{t("serialSearchInfo.textFragmentDescription")}</p>
        <div className="serial-search-info__example">
          <span>{t("serialSearchInfo.example")}</span>
          <code>NG</code>
        </div>
      </section>
    </div>
  </div>
);

interface CreditBlockListTableProps {
  t: (key: string) => string;
}

export const CreditBlockListTableComponent = ({ t }: CreditBlockListTableProps) => {
  const { post } = useConnection();
  // Resolves the first-transfer column's stored ISO alpha-2 code to a country
  // name — same hook (and same code -> name convention) the Cooperative
  // Approaches tables use for host / participating parties.
  const { byCode: countryNameByCode } = useCountryOptions();
  const isInitialRender = useRef(false);
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CreditBlockInterface[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [filterValues, setFilterValues] = useState<FilterValues>(INITIAL_FILTER_VALUES);
  // The serial search only applies on Enter / the search icon (FilterBar's
  // onSearch), not per keystroke — `filterValues.serialSearch` holds what's
  // being typed, this holds what the table is actually filtered by.
  const [appliedSerialSearch, setAppliedSerialSearch] = useState<string>("");
  const [viewModalRecord, setViewModalRecord] = useState<CreditBlockInterface | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyEntries, setHistoryEntries] = useState<CreditHistoryEntry[]>([]);

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

  // The explorer view's projectId column is the project's refId; only
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
      const statuses = (filterValues.status as string[]).filter((s) => s !== STATUS_ALL);
      if (statuses.length === 0) {
        setTableData([]);
        setTotalProgramme(0);
        return;
      }

      const orgIds = filterValues.organization as number[];
      const projectIds = filterValues.project as string[];
      const filterAnd: any[] = [
        { key: "status", operation: "in", value: statuses },
      ];
      if (orgIds.length > 0) {
        filterAnd.push({ key: "organizationId", operation: "in", value: orgIds });
      }
      if (projectIds.length > 0) {
        filterAnd.push({ key: "projectId", operation: "in", value: projectIds });
      }
      if (appliedSerialSearch) {
        // Not a real column — the backend pulls this entry out
        // (extractSerialSearchPredicate) and builds its own prefix/fragment
        // serial predicate from the value; the operation is ignored.
        filterAnd.push({ key: "serialColumns", operation: "=", value: appliedSerialSearch });
      }
      const sort = sortField && sortOrder
        ? { key: sortField, order: sortOrder, nullFirst: false }
        : { key: "updatedTime", order: "DESC" };

      const response: any = await post(API_PATHS.CREDIT_EXPLORER_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd,
        sort,
      });

      const rows: ExplorerQueryRow[] = response?.data ?? [];
      setTableData(rows.map(mapExplorerRow));
      setTotalProgramme(response?.response?.data?.total ?? 0);
    } catch (error: any) {
      console.error("Error in getting credit blocks", error);
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

  const onNavigateToProgrammeView = async (record: CreditBlockInterface) => {
    setViewModalRecord(record);
    setHistoryEntries([]);
    setHistoryLoading(true);
    try {
      const response: any = await post(API_PATHS.CREDIT_BLOCK_HISTORY, {
        blockId: record.id,
      });
      setHistoryEntries(response?.data?.history ?? []);
    } catch (error: any) {
      console.error("Error in getting credit block history", error);
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const actionMenu = (record: CreditBlockInterface) => {
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
      title: t(CreditBlockColumns.SERIAL_NO),
      key: "serialNumber",
      sorter: true,
      align: "left" as const,
      render: (record: CreditBlockInterface) => {
        return <span>{record?.serialNumber}</span>;
      },
    },
    {
      title: t(CreditBlockColumns.ORGANIZATION_NAME),
      key: "organizationName",
      sorter: true,
      align: "center" as const,
      render: (record: CreditBlockInterface) => {
        if ( !record?.organizationName) {
          return (
            <div className="org-list">
              <Row justify="center" align="middle">
                <span>-</span>
              </Row>
            </div>
          );
        }
        return (
          <div className="org-list">
            <Row justify="center" align="middle">
              <Tooltip title={record.organizationName}>
                <span>
                  <ProfileIcon
                    icon={record.organizationLogo}
                    bg={"rgba(185, 226, 244, 0.56)"}
                    name={record.organizationName}
                  />
                </span>
              </Tooltip>
            </Row>
          </div>
        );
      },
    },
    {
      title: t(CreditBlockColumns.PROJECT_NAME),
      key: "projectName",
      sorter: true,
      align: "left" as const,
      render: (record: CreditBlockInterface) => {
        return (
          <ProjectDetailsLink
            projectId={record.projectId}
            projectName={record.projectName}
          />
        );
      },
    },
    {
      title: t(CreditBlockColumns.CREDITS),
      key: "balance",
      sorter: true,
      align: "right" as const,
      render: (record: CreditBlockInterface) => {
        return <span>{addCommSep(String(record?.creditBalance))}</span>;
      },
    },
    {
      title: t(CreditBlockColumns.RESERVED),
      key: "reserved",
      sorter: true,
      align: "right" as const,
      render: (record: CreditBlockInterface) => {
        return <span>{addCommSep(String(record?.reserved ?? 0))}</span>;
      },
    },
    {
      title: t(CreditBlockColumns.CURRENT_STATUS),
      key: "status",
      align: "center" as const,
      render: (record: CreditBlockInterface) => {
        return (
          <Tag color={getCreditBlockStatusTagColor(record?.currentStatus)}>
            {t(record?.currentStatus)}
          </Tag>
        );
      },
    },
    {
      title: t(CreditBlockColumns.CREDIT_TYPE),
      key: "creditType",
      align: "center" as const,
      render: (record: CreditBlockInterface) => (
        <CreditTypePill
          isItmo={!!record?.itmoAuthorizationRecord}
          itmoSerial={record?.itmoSerial}
          t={t}
        />
      ),
    },
    {
      title: t(CreditBlockColumns.FIRST_TRANSFER),
      // Not a real DB column (computed in-memory per page by the backend's
      // enrichExplorerRowsWithFirstTransferCountry) — not sortable server-side.
      key: "firstTransfer",
      align: "center" as const,
      // The acquiring Party of the block's Article 6 first transfer (an ITMO
      // crossing to another Party), as a country-name pill — "-" for every MO
      // block, and for an ITMO block not yet first transferred. The API sends
      // the stored ISO alpha-2 code; the name is resolved client-side via
      // `countryNameByCode`, falling back to the raw code if the country list
      // hasn't loaded yet or doesn't contain it.
      render: (record: CreditBlockInterface) => {
        const code = record?.firstTransfer;
        if (!code || code === "-") {
          return <span>-</span>;
        }
        return <Tag>{countryNameByCode.get(code) ?? code}</Tag>;
      },
    },
    {
      title: t(CreditBlockColumns.UPDATE_DATE),
      key: "updatedTime",
      sorter: true,
      align: "center" as const,
      render: (item: CreditBlockInterface) => {
        return (
          <span>
            {moment(Number(item?.updateDate)).format("YYYY-MM-DD HH:mm:ss")}
          </span>
        );
      },
    },
    {
      title: '',
      width: 6,
      align: "right" as const,
      key: "action",
      render: (_: unknown, record: CreditBlockInterface) => {
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
  }, [
    sortField,
    sortOrder,
    filterValues.status,
    filterValues.organization,
    filterValues.project,
    appliedSerialSearch,
  ]);

  // Declared last so it runs after the two effects above on the initial
  // mount pass (effects fire in declaration order within the same commit) —
  // flipping this here, rather than inside the first effect, is what keeps
  // their `isInitialRender.current` check false during that mount pass, so
  // they don't also redundantly re-fetch alongside the unconditional mount
  // fetch above.
  useEffect(() => {
    isInitialRender.current = true;
  }, []);

  const allStatusesSelected = (filterValues.status as string[]).includes(STATUS_ALL);

  // A bare-number serial search is the backend's "partial unit" rule: it
  // matches blocks whose range *contains* that single credit. When that's
  // what found the rows, the history popup calls the searched credit out
  // on the block's node (CreditHistoryGraph's highlightCredit chip). Any
  // other search shape (prefix, multi-number, text) targets blocks, not
  // one credit, so there's nothing to mark.
  const searchedCredit = /^\d+$/.test(appliedSerialSearch)
    ? Number(appliedSerialSearch)
    : undefined;

  return (
    <div className="content-card">
      <FilterBar
        radioGroup={{
          id: "status",
          multiple: true,
          selectAllValue: STATUS_ALL,
          clearValue: [],
          options: [
            { label: t("all"), value: STATUS_ALL },
            ...Object.values(CreditBlockStatus).map((status) => ({
              label: t(status),
              value: status,
            })),
          ],
          // "Every status" is the default, not a narrowing — don't show it
          // as an applied-filter chip.
          isApplied: () => !allStatusesSelected,
        }}
        controls={[
          {
            id: "serialSearch",
            type: "search",
            placeholder: t("searchBySerialNumber"),
            width: 260,
            onSearch: (value: string) => setAppliedSerialSearch(value.trim()),
            infoVisible: true,
            infoDescription: t("serialSearchInfo.infoDescription"),
            infoLearnMore: {
              title: t("searchBySerialNumber"),
              content: <SerialSearchInfoContent t={t} />,
            },
          },
          orgFilter.control,
          projectFilter.control,
        ]}
        values={filterValues}
        appliedValues={{ serialSearch: appliedSerialSearch }}
        onChange={(id, value) => setFilterValues((prev) => ({ ...prev, [id]: value }))}
        onClearAll={() => {
          setFilterValues(INITIAL_FILTER_VALUES);
          setAppliedSerialSearch("");
        }}
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
        // Without this, antd keeps the modal's content mounted (just
        // hidden) across close/reopen — CreditHistoryGraph's internal
        // "has the initial view been applied yet" state would then persist
        // too, so every reopen after the first would skip straight to
        // whatever state it was left in instead of showing the initial
        // (path-scoped) view again.
        destroyOnClose
      >
        {viewModalRecord && (
          <>
            <div className="credit-view-overview-title">Overview</div>
            <div className="credit-view-overview">
              {[
                { label: "Current Holder", value: viewModalRecord.organizationName?viewModalRecord.organizationName: "-" },
                { label: "Serial Number", value: viewModalRecord.serialNumber },
                { label: "Type", value: viewModalRecord.itmoAuthorizationRecord ? t("itmo") : t("mo") },
                { label: "ITMO Serial", value: viewModalRecord.itmoSerial || "-" },
                { label: "Current Status", value: t(viewModalRecord.currentStatus) },
                { label: "No. of Credits", value: addCommSep(String(viewModalRecord.creditBalance)) },
                { label: "Project Issued to", value: viewModalRecord.projectName },
                {
                  // Sourced from the ISSUE root of the fetched history tree
                  // (entries[0].info.timestamp) — queryExplorer's own
                  // response doesn't carry an issuance date.
                  label: "Issued date",
                  value: historyEntries[0]?.info?.timestamp
                    ? moment(historyEntries[0].info.timestamp).format("MMM DD, YYYY")
                    : "-",
                },
                { label: "Vintage", value: viewModalRecord.vintage || "-" },
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
                focusRange={currentRangeFromSerial(viewModalRecord.serialNumber)}
                interactiveSelection={false}
                collapseStrategy="pathOnly"
                showOpenInNewTab={true}
                showModeToggle={true}
                defaultMode="timeline"
                initialFitScope="path"
                height="50vh"
                highlightCredit={searchedCredit}
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
