import { Empty, message, Table } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { useEffect, useRef, useState } from 'react';
import { ProfileIcon } from '../../../Components/IconComponents/ProfileIcon/profile.icon';
import { API_PATHS } from '../../../Config/apiConfig';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { toSortOrder, type SortOrder } from './creditTableHelpers';
import '../creditPageStyles.scss';

interface OrganizationBalance {
  id: string;
  name: string;
  logo: string;
  avatarColor: string;
  // MO/ITMO are disjoint subsets that sum to the organization's total
  // balance/reserved amount — derived client-side from the API's
  // grand-total + ITMO-only figures.
  moBalance: number;
  moReserved: number;
  itmoBalance: number;
  itmoReserved: number;
  updatedAt: string;
}

export interface CreditBalanceByOrganizationTableProps {
  selectedOrganizationIds: string[];
  refreshGeneration: number;
}

interface OrganizationBalanceApiRow {
  organizationId: string;
  organizationName: string;
  organizationLogo: string | null;
  creditBalance: string | number;
  reservedCredits: string | number;
  itmoBalance: string | number;
  itmoReservedCredits: string | number;
  updatedTime: string | number;
}

interface ConnectionResponse<T> {
  data?: T;
  response?: { data?: { total?: number } };
}

interface OrganizationBalanceQuery {
  page: number;
  size: number;
  filterAnd?: Array<{
    key: 'organizationId';
    operation: 'in';
    value: string[];
  }>;
  sort: {
    key: string;
    order: SortOrder;
    nullFirst: boolean;
  };
}

const formatCredits = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatTimestamp = (value: string | number) => {
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('sv-SE', { hour12: false });
};

const avatarColor = (name: string) => {
  const colors = ['#dbeafe', '#fce7f3', '#fef9c3', '#dcfce7', '#ede9fe'];
  const hash = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const columns: ColumnsType<OrganizationBalance> = [
  {
    title: 'Credit Owner',
    dataIndex: 'name',
    key: 'organizationName',
    align: 'left',
    sorter: true,
    render: (name, row) => (
      <div className="credit-balance-organization-cell">
        <ProfileIcon icon={row.logo} bg={row.avatarColor} name={name} />
        <span>{name}</span>
      </div>
    ),
  },
  { title: 'MO Balance', dataIndex: 'moBalance', key: 'moBalance', align: 'right', sorter: true, render: formatCredits },
  { title: 'MO Reserved', dataIndex: 'moReserved', key: 'moReserved', align: 'right', sorter: true, render: formatCredits },
  { title: 'ITMO Balance', dataIndex: 'itmoBalance', key: 'itmoBalance', align: 'right', sorter: true, render: formatCredits },
  { title: 'ITMO Reserved', dataIndex: 'itmoReserved', key: 'itmoReservedCredits', align: 'right', sorter: true, render: formatCredits },
  { title: 'Updated Date & Time', dataIndex: 'updatedAt', key: 'updatedTime', align: 'center', sorter: true },
];

export const CreditBalanceByOrganizationTable = ({
  selectedOrganizationIds,
  refreshGeneration,
}: CreditBalanceByOrganizationTableProps) => {
  const { post } = useConnection();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [rows, setRows] = useState<OrganizationBalance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestGenerationRef = useRef(0);
  const selectedOrganizationsKey = selectedOrganizationIds.join('\u0000');

  useEffect(() => setCurrentPage(1), [selectedOrganizationsKey]);

  useEffect(() => {
    const requestGeneration = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestGeneration;
    const organizations = selectedOrganizationsKey
      ? selectedOrganizationsKey.split('\u0000')
      : [];
    const request: OrganizationBalanceQuery = {
      page: currentPage,
      size: pageSize,
      filterAnd: organizations.length > 0
        ? [{
          key: 'organizationId',
          operation: 'in',
          value: organizations,
        }]
        : undefined,
      sort: sortField && sortOrder
        ? { key: sortField, order: sortOrder, nullFirst: false }
        : { key: 'updatedTime', order: 'DESC', nullFirst: false },
    };

    setLoading(true);
    void (post(
      API_PATHS.CREDIT_BALANCE_BY_ORGANIZATION_QUERY,
      request,
    ) as Promise<ConnectionResponse<OrganizationBalanceApiRow[]>>)
      .then((response) => {
        if (requestGenerationRef.current !== requestGeneration) return;
        const mappedRows = (response.data ?? []).map((row): OrganizationBalance => {
          const creditBalance = Number(row.creditBalance) || 0;
          const reservedCredits = Number(row.reservedCredits) || 0;
          const itmoBalance = Number(row.itmoBalance) || 0;
          const itmoReserved = Number(row.itmoReservedCredits) || 0;
          return {
            id: row.organizationId,
            name: row.organizationName,
            logo: row.organizationLogo ?? '',
            avatarColor: avatarColor(row.organizationName),
            moBalance: creditBalance - itmoBalance,
            moReserved: reservedCredits - itmoReserved,
            itmoBalance,
            itmoReserved,
            updatedAt: formatTimestamp(row.updatedTime),
          };
        });
        setRows(mappedRows);
        setTotal(response.response?.data?.total ?? mappedRows.length);
      })
      .catch((error: { message?: string }) => {
        if (requestGenerationRef.current !== requestGeneration) return;
        setRows([]);
        setTotal(0);
        message.error(error.message ?? 'Unable to load organization credit balances');
      })
      .finally(() => {
        if (requestGenerationRef.current === requestGeneration) setLoading(false);
      });

    return () => {
      if (requestGenerationRef.current === requestGeneration) {
        requestGenerationRef.current += 1;
      }
    };
  }, [
    currentPage,
    pageSize,
    post,
    refreshGeneration,
    selectedOrganizationsKey,
    sortField,
    sortOrder,
  ]);

  return (
    <div className="credit-table-container credit-balance-organization-table">
      <Table<OrganizationBalance>
        className="common-table-class"
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={loading}
        scroll={{ x: 960 }}
        onChange={(_pagination, _filters, sorter, extra) => {
          if (extra.action !== 'sort') return;
          const sorted = Array.isArray(sorter) ? sorter[0] : sorter;
          const order = toSortOrder(sorted?.order);
          setSortOrder(order);
          setSortField(order ? String(sorted.columnKey) : undefined);
          setCurrentPage(1);
        }}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showQuickJumper: true,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          onChange: (page, size) => {
            setCurrentPage(size !== pageSize ? 1 : page);
            setPageSize(size);
          },
        }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No organization credit balances match the selected filters" /> }}
      />
    </div>
  );
};
