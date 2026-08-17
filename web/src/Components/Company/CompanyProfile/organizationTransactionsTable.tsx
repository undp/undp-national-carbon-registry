/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwapOutlined } from '@ant-design/icons';
import { Card, Empty, message, PaginationProps, Row, Table, Tag, Tooltip } from 'antd';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../Styles/common.table.scss';
import { addCommSep } from '../../../Definitions/Definitions/programme.definitions';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';
import { ProjectDetailsLink } from '../../ProjectDetailsLink/projectDetailsLink';
import { CreditTypePill } from '../../../Pages/CreditPages/Components/creditTypePill';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { API_PATHS } from '../../../Config/apiConfig';
import {
  FilterBar,
  FilterValue,
  FilterValues,
  usePaginatedEntityFilter,
} from '../../Common/FilterBar';

export enum OrganizationTransactionStatus {
  ISSUED = 'Issued',
  TRANSFERRED = 'Transferred',
  RECEIVED = 'Received',
  RETIRED = 'Retired',
  ITMO_AUTHORIZED = 'ITMO Authorized',
}

export interface OrganizationTransactionInterface {
  id: string;
  projectId: string;
  projectName: string;
  projectOwnerId: number;
  serialNumber: string;
  currentStatus: OrganizationTransactionStatus;
  senderName?: string | null;
  senderLogo?: string | null;
  receiverName?: string | null;
  receiverLogo?: string | null;
  updatedDate: string;
  creditAmount: number;
  // Non-null ⇒ these units are ITMOs (see credit.block.org.transactions.view.entity.ts).
  itmoAuthorizationRecord?: string | null;
  // Derived server-side from this row's own frozen serialNumber — never
  // from a live join, which would drift as the block keeps getting
  // re-split by later actions. Null for MO rows.
  itmoSerial?: string | null;
}

// Raw row from POST .../orgCreditBlocks (CreditBlockOrgTransactionsViewEntity).
interface OrgTransactionQueryRow {
  id: string;
  currentStatus: string;
  organizationId: number;
  serialNumber: string;
  projectId: string;
  projectName: string;
  projectOwnerId: number;
  senderName: string | null;
  senderLogo: string | null;
  receiverName: string | null;
  receiverLogo: string | null;
  updatedDate: number | string;
  creditAmount: number;
  itmoAuthorizationRecord: string | null;
  itmoSerial: string | null;
}

const mapRow = (row: OrgTransactionQueryRow): OrganizationTransactionInterface => ({
  id: row.id,
  projectId: row.projectId,
  projectName: row.projectName,
  projectOwnerId: row.projectOwnerId,
  serialNumber: row.serialNumber,
  currentStatus: row.currentStatus as OrganizationTransactionStatus,
  senderName: row.senderName,
  senderLogo: row.senderLogo,
  receiverName: row.receiverName,
  receiverLogo: row.receiverLogo,
  updatedDate: String(row.updatedDate),
  creditAmount: row.creditAmount,
  itmoAuthorizationRecord: row.itmoAuthorizationRecord,
  itmoSerial: row.itmoSerial,
});

const getTransactionStatusTagColor = (status: OrganizationTransactionStatus) => {
  switch (status) {
    case OrganizationTransactionStatus.ISSUED:
      return 'processing';
    case OrganizationTransactionStatus.TRANSFERRED:
      return 'purple';
    case OrganizationTransactionStatus.RECEIVED:
      return 'success';
    case OrganizationTransactionStatus.RETIRED:
      return 'warning';
    case OrganizationTransactionStatus.ITMO_AUTHORIZED:
      return 'cyan';
    default:
      return 'default';
  }
};

// Hex equivalents of the antd Tag colors above (antd doesn't expose these as
// tokens) — keeps the status filter's checkbox fill matching its table pill.
const getTransactionStatusHexColor = (status: OrganizationTransactionStatus) => {
  switch (status) {
    case OrganizationTransactionStatus.ISSUED:
      return '#1890ff';
    case OrganizationTransactionStatus.TRANSFERRED:
      return '#722ed1';
    case OrganizationTransactionStatus.RECEIVED:
      return '#52c41a';
    case OrganizationTransactionStatus.RETIRED:
      return '#faad14';
    case OrganizationTransactionStatus.ITMO_AUTHORIZED:
      return '#13c2c2';
    default:
      return undefined;
  }
};

// FilterBar's "select all" pseudo-option for the status checkbox group —
// never sent to the backend (stripped in getQueryData).
const STATUS_ALL = 'All';

const INITIAL_FILTER_VALUES: FilterValues = {
  status: [STATUS_ALL, ...Object.values(OrganizationTransactionStatus)],
  project: [],
};

interface OrganizationTransactionsTableProps {
  t: (key: string) => string;
  companyId: number;
}

export const OrganizationTransactionsTable = ({
  t,
  companyId,
}: OrganizationTransactionsTableProps) => {
  // CreditTypePill's keys ("itmo"/"mo"/"itmoSerial"/...) live in the
  // creditPages namespace, but this page's own `t` prop is bound to
  // companyProfile — load creditPages locally rather than repurposing the
  // shared `t`, so every other column stays on companyProfile unchanged.
  const { t: tCreditPages } = useTranslation('creditPages');
  const { post } = useConnection();
  const isInitialRender = useRef(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<OrganizationTransactionInterface[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [filterValues, setFilterValues] = useState<FilterValues>(INITIAL_FILTER_VALUES);

  // Project dropdown loads lazily, page-by-page, and searches server-side
  // (see usePaginatedEntityFilter) rather than preloading the whole list.
  // The transactions view's projectId column is the project's refId; only
  // projects with at least one issued credit are worth offering here.
  const projectFilter = usePaginatedEntityFilter({
    endpoint: API_PATHS.PROJECT_NAME_IDS,
    id: 'project',
    mode: 'multiple',
    placeholder: t('filterByProject'),
    labelKey: 'title',
    valueKey: 'refId',
    sortKey: 'title',
    extraFilters: [{ key: 'creditIssued', operation: '>', value: 0 }],
    selectedValues: filterValues.project as FilterValue[],
  });

  const getQueryData = async () => {
    if (!companyId) {
      return;
    }
    setLoading(true);
    try {
      const statuses = (filterValues.status as string[]).filter((s) => s !== STATUS_ALL);
      if (statuses.length === 0) {
        setTableData([]);
        setTotal(0);
        return;
      }

      const projectIds = filterValues.project as string[];
      const filterAnd: any[] = [
        { key: 'currentStatus', operation: 'in', value: statuses },
      ];
      if (projectIds.length > 0) {
        filterAnd.push({ key: 'projectId', operation: 'in', value: projectIds });
      }

      const sort =
        sortField && sortOrder
          ? { key: sortField, order: sortOrder, nullFirst: false }
          : { key: 'updatedDate', order: 'DESC' };

      const response: any = await post(API_PATHS.ORG_CREDIT_BLOCKS, {
        organizationId: companyId,
        page: currentPage,
        size: pageSize,
        filterAnd,
        sort,
      });

      const rows: OrgTransactionQueryRow[] = response?.data ?? [];
      setTableData(rows.map(mapRow));
      setTotal(response?.response?.data?.total ?? 0);
    } catch (error: any) {
      console.error('Error in getting organisation transactions', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOrganization = (name?: string | null, logo?: string | null) => {
    if (!name) {
      return <span>-</span>;
    }
    return (
      <Row justify="center" align="middle">
        <Tooltip title={name}>
          <span>
            <ProfileIcon icon={logo ?? null} bg={'rgba(185, 226, 244, 0.56)'} name={name} />
          </span>
        </Tooltip>
      </Row>
    );
  };

  const columns = [
    {
      title: t('companyProfile:projectName'),
      key: 'projectName',
      sorter: true,
      align: 'left' as const,
      render: (record: OrganizationTransactionInterface) => (
      <ProjectDetailsLink
        projectId={record.projectId}
        projectName={record.projectName}
        projectOwnerId={record.projectOwnerId}
      />
    ),
    },
    {
      title: t('companyProfile:serialNo'),
      key: 'serialNumber',
      align: 'left' as const,
      render: (record: OrganizationTransactionInterface) => <span>{record.serialNumber}</span>,
    },
    {
      title: t('companyProfile:currentStatus'),
      key: 'currentStatus',
      align: 'center' as const,
      render: (record: OrganizationTransactionInterface) => (
        <Tag color={getTransactionStatusTagColor(record.currentStatus)}>
          {t(record.currentStatus)}
        </Tag>
      ),
    },
    {
      title: t('companyProfile:creditType'),
      key: 'creditType',
      align: 'center' as const,
      render: (record: OrganizationTransactionInterface) => (
        <CreditTypePill
          isItmo={!!record.itmoAuthorizationRecord}
          itmoSerial={record.itmoSerial}
          t={tCreditPages}
        />
      ),
    },
    {
      title: t('companyProfile:sender'),
      key: 'senderName',
      align: 'center' as const,
      render: (record: OrganizationTransactionInterface) =>
        renderOrganization(record.senderName, record.senderLogo),
    },
    {
      title: t('companyProfile:receiver'),
      key: 'receiverName',
      align: 'center' as const,
      render: (record: OrganizationTransactionInterface) =>
        renderOrganization(record.receiverName, record.receiverLogo),
    },
    {
      title: t('companyProfile:updatedDateTime'),
      key: 'updatedDate',
      sorter: true,
      // No defaultSortOrder: antd would report this column as already
      // actively sorted on the very first table interaction (including a
      // plain page turn), which falsely looks like a user-driven sort
      // change to the effect below and resets currentPage back to 1 —
      // breaking the first pagination click. The default DESC ordering is
      // already applied server-side (see getQueryData's `sort` fallback)
      // without needing this visual hint.
      align: 'left' as const,
      render: (record: OrganizationTransactionInterface) => (
        <span>{moment(Number(record.updatedDate)).format('YYYY-MM-DD HH:mm:ss')}</span>
      ),
    },
    {
      title: t('companyProfile:noOfCredits'),
      key: 'creditAmount',
      sorter: true,
      align: 'left' as const,
      render: (record: OrganizationTransactionInterface) => (
        <span style={{ marginLeft: '20px' }}>{addCommSep(record.creditAmount)}</span>
      ),
    },
  ];

  const onPaginationChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onHandleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
  };

  useEffect(() => {
    getQueryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      getQueryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (isInitialRender.current) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        getQueryData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, companyId, filterValues.status, filterValues.project]);

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

  return (
    <Card className="card-container">
      <div className="info-view">
        <div className="title">
          <span className="title-icon">
            <SwapOutlined />
          </span>
          <span className="title-text">{t('companyProfile:transactions')}</span>
        </div>
      </div>
      <FilterBar
        radioGroup={{
          id: 'status',
          multiple: true,
          selectAllValue: STATUS_ALL,
          clearValue: [],
          options: [
            { label: t('all'), value: STATUS_ALL },
            ...Object.values(OrganizationTransactionStatus).map((status) => ({
              label: t(status),
              value: status,
              color: getTransactionStatusHexColor(status),
            })),
          ],
          // "Every status" is the default, not a narrowing — don't show it
          // as an applied-filter chip.
          isApplied: () => !allStatusesSelected,
        }}
        controls={[projectFilter.control]}
        values={filterValues}
        onChange={(id, value) => setFilterValues((prev) => ({ ...prev, [id]: value }))}
        onClearAll={() => setFilterValues(INITIAL_FILTER_VALUES)}
        disabled={loading}
        appliedFiltersLabel={t('appliedFilters')}
        clearAllLabel={t('clearAll')}
        selectAllLabel={t('selectAll')}
      />
      <div className="credit-table-container">
        <Table
          dataSource={tableData}
          columns={columns}
          className="common-table-class"
          loading={loading}
          rowKey={(record) => `${record.currentStatus}:${record.id}`}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showQuickJumper: true,
            showSizeChanger: true,
            onChange: onPaginationChange,
          }}
          onChange={onHandleTableChange}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={tableData.length === 0 ? t('companyProfile:noTransactions') : null}
              />
            ),
          }}
        />
      </div>
    </Card>
  );
};
