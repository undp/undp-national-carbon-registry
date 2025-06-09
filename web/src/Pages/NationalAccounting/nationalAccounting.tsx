/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  Checkbox,
  Col,
  DatePicker,
  Empty,
  message,
  PaginationProps,
  Row,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { StasticCard } from '../../Components/StatisticsCard/statisticsCard';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useEffect, useState } from 'react';
import { Archive, CheckCircle, ShieldCheck } from 'react-bootstrap-icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import './nationalAccounting.scss';
import moment from 'moment';
import { DateTime } from 'luxon';
import { TooltipColor } from '../../Styles/role.color.constants';
import { getCreditAuditStageTagType } from '../../Definitions/Definitions/nationalAccounting.definition';
import { creditUnit } from '../../Definitions/Definitions/common.definitions';
import { addCommSepRound } from '../../Definitions/Definitions/programme.definitions';
import { ProfileIcon } from '../../Components/IconComponents/ProfileIcon/profile.icon';
import { CircleFlag } from 'react-circle-flags';
import { CreditAuditLogType } from '../../Definitions/Enums/creditAuditLogType.enum';
import Search from 'antd/lib/input/Search';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';

const NationalAccountingDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['nationalAccounting']);
  const { userInfoState } = useUserContext();
  const { get, post, statServerUrl } = useConnection();
  const [loadingTotals, setLoadingTotals] = useState<boolean>(false);
  const [loadingTransactionRecords, setLoadingTransactionRecords] = useState<boolean>(false);
  const [loadingCountryRecords, setLoadingCountryRecords] = useState<boolean>(false);
  const [totalsWithoutTimeRange, setTotalsWithoutTimeRange] = useState<any>();
  const [transactionRecordData, setTransactionRecordData] = useState<any>();
  const [totalTransactionRecords, setTotalTransactionRecords] = useState<number>();
  const [countryRecordData, setCountryRecordData] = useState<any>();
  const [totalCountryRecords, setTotalCountryRecords] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [sortOrderCountryRecords, setSortOrderCountryRecords] = useState<string>();
  const [sortFieldCountryRecords, setSortFieldCountryRecords] = useState<string>();
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const typeOptions = Object.keys(CreditAuditLogType).map((k, index) => ({
    label: t(Object.values(CreditAuditLogType)[index]),
    value: k,
  }));

  const [selectedType, setSelectedType] = useState<any>(typeOptions.map((e) => e.value));
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);
  const [typeFilter, setTypeFilter] = useState<any>();

  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();

  const [currentPageCountryTable, setCurrentPageCountryTable] = useState<number>(1);
  const [pageSizeCountryTable, setPageSizeCountryTable] = useState<number>(10);

  const { RangePicker } = DatePicker;

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate('/programmeManagement/view/' + programmeId);
  };

  const recordsTableColumns = [
    {
      title: t('nationalAccounting:date'),
      key: 'createdTime',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {DateTime.fromISO(itemObj.createdTime).toFormat('dd LLLL yyyy')}
          </div>
        );
      },
    },
    {
      title: t('nationalAccounting:programmeTitle'),
      dataIndex: 'programmeTitle',
      key: 'programmeTitle',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            onNavigateToProgrammeView(record.programmeId);
          },
        };
      },
    },
    {
      title: t('nationalAccounting:sector'),
      dataIndex: 'programmeSector',
      key: 'programmeSector',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('nationalAccounting:type'),
      key: 'type',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        return (
          <Tag className="clickable" color={getCreditAuditStageTagType(Obj.type)}>
            {t(Obj.type)}
          </Tag>
        );
      },
    },
    {
      title: t('nationalAccounting:creditAmount') + ` (${creditUnit})`,
      dataIndex: 'credits',
      key: 'credits',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return <span className="clickable">{addCommSepRound(item)}</span>;
      },
    },
    {
      title: t('nationalAccounting:organisation'),
      dataIndex: 'programmeCompanyId',
      key: 'programmeCompanyId',
      sorter: true,
      align: 'center' as const,
      render: (item: any, itemObj: any) => {
        if (item === null) {
          return;
        }
        const cMap: any = {};
        for (const c of itemObj.company) {
          cMap[c.companyId] = c;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {itemObj.programmeCompanyId &&
              itemObj.programmeCompanyId.map((id: any, i: any) => {
                const v = cMap[id];
                if (!v) {
                  return;
                }
                return (
                  <Tooltip
                    title={v.name}
                    color={TooltipColor}
                    key={'organisationTTKey' + itemObj.id + v.name}
                  >
                    <div>
                      <ProfileIcon icon={v.logo} bg="rgba(128, 255, 0, 0.12)" name={v.name} />
                    </div>
                  </Tooltip>
                );
              })}
          </div>
        );
      },
    },
    {
      title: t('nationalAccounting:creditReceiver'),
      dataIndex: 'country',
      key: 'country',
      sorter: true,
      align: 'center' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {itemObj.country && (
              <Tooltip
                title={
                  t('creditTransfer:iaccount') +
                  `${itemObj.countryName ? ' - ' + itemObj.countryName : ''}`
                }
                color={TooltipColor}
                key={TooltipColor}
              >
                {itemObj.country && (
                  <CircleFlag
                    className="profile-icon flag-ret-icon"
                    countryCode={itemObj.country.toLowerCase()}
                  />
                )}
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  const countryTableColumns = [
    {
      title: '',
      dataIndex: 'country',
      key: 'country',
      sorter: false,
      align: 'center' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {itemObj.country && (
              <CircleFlag
                className="profile-icon flag-ret-icon"
                countryCode={itemObj.country.toLowerCase()}
              />
            )}
          </div>
        );
      },
    },
    {
      title: t('nationalAccounting:country'),
      dataIndex: 'countryName',
      key: 'countryName',
      sorter: false,
      align: 'left' as const,
    },
    {
      title: t('nationalAccounting:creditAmount') + ` (${creditUnit})`,
      dataIndex: 'credits',
      key: 'credits',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return <span className="clickable">{addCommSepRound(item)}</span>;
      },
    },
    {
      title: t('nationalAccounting:transactionCount'),
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      sorter: false,
      align: 'center' as const,
    },

    {
      title: t('nationalAccounting:latestTransaction'),
      key: 'latestTime',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {DateTime.fromISO(itemObj.latestTime).toFormat('dd LLLL yyyy')}
          </div>
        );
      },
    },
  ];

  const getTotalCredits = async () => {
    setLoadingTotals(true);
    try {
      const response: any = await get('stats/national-accounting/total', undefined, statServerUrl);
      setTotalsWithoutTimeRange(response?.data);
    } catch (error: any) {
      console.log('Error in getting credit totals', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingTotals(false);
    }
  };

  const getTransactionRecordsDefaultParams = () => {
    return {
      page: currentPage,
      size: pageSize,
    };
  };

  const getTransactionRecordsWithParams = () => {
    const filterAndArray = [];
    let sort: any;

    if (startTime !== 0) {
      filterAndArray.push({
        key: 'created_epoch',
        operation: '>',
        value: startTime,
      });
    }

    if (endTime !== 0) {
      filterAndArray.push({
        key: 'created_epoch',
        operation: '<',
        value: endTime,
      });
    }

    if (sortOrder && sortField) {
      sort = {
        key: sortField,
        order: sortOrder,
        nullFirst: false,
      };
    } else {
      sort = {
        key: 'createdTime',
        order: 'DESC',
      };
    }

    if (typeFilter) {
      filterAndArray.push(typeFilter);
    }

    if (search && search !== '') {
      const interFilterOr = [
        {
          key: 'programmeTitle',
          operation: 'like',
          value: `%${search}%`,
        },
      ];
      if (!isNaN(Number(search))) {
        interFilterOr.push({
          key: 'programmeId',
          operation: '=',
          value: `${search}`,
        });
      }
      filterAndArray.push({
        value: {
          page: currentPage,
          size: pageSize,
          filterOr: interFilterOr,
        },
      });
    }

    return {
      page: currentPage,
      size: pageSize,
      filterAnd: filterAndArray,
      sort: sort,
    };
  };

  const getCountryRecordsWithParams = () => {
    const filterAndArray = [];
    let sort: any;

    if (startTime !== 0) {
      filterAndArray.push({
        key: 'created_epoch',
        operation: '>',
        value: startTime,
      });
    }

    if (endTime !== 0) {
      filterAndArray.push({
        key: 'created_epoch',
        operation: '<',
        value: endTime,
      });
    }

    if (sortFieldCountryRecords && sortOrderCountryRecords) {
      sort = {
        key: sortFieldCountryRecords === 'credits' ? 'totalCredits' : sortFieldCountryRecords,
        order: sortOrderCountryRecords,
        nullFirst: false,
      };
    } else {
      sort = {
        key: 'totalCredits',
        order: 'DESC',
      };
    }

    return {
      page: currentPageCountryTable,
      size: pageSizeCountryTable,
      filterAnd: filterAndArray.length > 0 ? filterAndArray : null,
      sort: sort,
    };
  };

  const getTransactionRecordsWithoutTimeRange = async (queryParams: () => any) => {
    setLoadingTransactionRecords(true);
    try {
      const response: any = await post(
        'stats/national-accounting/query',
        queryParams(),
        undefined,
        statServerUrl
      );
      setTransactionRecordData(response?.data);
      setTotalTransactionRecords(response?.response?.data?.total);
    } catch (error: any) {
      console.log('Error in getting credit transaction records', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingTransactionRecords(false);
    }
  };

  const getCountryCreditRecords = async (queryParams: () => any) => {
    setLoadingCountryRecords(true);
    try {
      const response: any = await post(
        'stats/national-accounting/query-by-country',
        queryParams(),
        undefined,
        statServerUrl
      );
      setCountryRecordData(response?.data);
      setTotalCountryRecords(response?.response?.data?.total);
    } catch (error: any) {
      console.log('Error in getting credit transaction records', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingCountryRecords(false);
    }
  };

  const onChangeRange = async (dateMoment: any, dateString: any) => {
    try {
      if (!dateMoment) {
        setStartTime(0);
        setEndTime(0);
      }
      if (dateMoment !== null && dateMoment[1] !== null) {
        setStartTime(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))) / 1000);
        setEndTime(Date.parse(String(moment(dateMoment[1]?._d).endOf('day'))) / 1000);
      } else {
        setStartTime(0);
        setEndTime(0);
      }
    } catch (e: any) {
      setStartTime(0);
      setEndTime(0);
    }
  };

  useEffect(() => {
    getTotalCredits();
    getTransactionRecordsWithoutTimeRange(getTransactionRecordsDefaultParams);
    getCountryCreditRecords(getTransactionRecordsDefaultParams);
  }, []);

  useEffect(() => {
    getTransactionRecordsWithoutTimeRange(getTransactionRecordsWithParams);
  }, [startTime, endTime, currentPage, pageSize, sortField, sortOrder, typeFilter, search]);

  useEffect(() => {
    getCountryCreditRecords(getCountryRecordsWithParams);
  }, [
    startTime,
    endTime,
    sortFieldCountryRecords,
    sortOrderCountryRecords,
    currentPageCountryTable,
    pageSizeCountryTable,
  ]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [typeFilter, search]);

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onChangeCountryTable: PaginationProps['onChange'] = (page, size) => {
    setCurrentPageCountryTable(page);
    setPageSizeCountryTable(size);
  };

  const handleTableChange = (pag: any, sorter: any) => {
    console.log(pag, sorter);
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
  };

  const handleTableChangeCountryTable = (pag: any, sorter: any) => {
    console.log(pag, sorter);
    setSortOrderCountryRecords(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortFieldCountryRecords(sorter.columnKey);
  };

  const onTypeQuery = async (checkedValues: CheckboxValueType[]) => {
    console.log(checkedValues);

    if (checkedValues !== selectedType) {
      setSelectedType(checkedValues);
    }

    if (checkedValues.length === 0) {
      setTransactionRecordData([]);
      setTotalTransactionRecords(0);
      return;
    }
    setTypeFilter({
      key: 'type',
      operation: 'in',
      value: checkedValues,
    });
  };

  const onCheckAllChange = (e: any) => {
    const nw = e.target.checked ? typeOptions.map((el) => el.value) : [];
    setSelectedType(nw);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    onTypeQuery(nw);
  };

  const onSearch = async () => {
    setSearch(searchText);
  };

  return (
    <div className="dashboard-main-container national-accounting-dashboard content-container">
      <div className="national-accounting-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('nationalAccounting:nationalAccounting')}</div>
        </div>
      </div>
      <div className="stastics-cards-container">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                totalsWithoutTimeRange?.CREDIT_AUTHORIZED?.credits
                  ? totalsWithoutTimeRange?.CREDIT_AUTHORIZED?.credits
                  : 0
              }
              title="creditAuthorized"
              updatedDate={
                totalsWithoutTimeRange?.CREDIT_AUTHORIZED?.lastUpdated
                  ? moment(totalsWithoutTimeRange?.CREDIT_AUTHORIZED?.lastUpdated).fromNow()
                  : '0'
              }
              icon={<ShieldCheck color="#16B1FF" size={80} />}
              loading={loadingTotals}
              companyRole={userInfoState?.companyRole}
              tooltip={t('tCreditAuthorized')}
              t={t}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                totalsWithoutTimeRange?.CREDIT_ISSUED?.credits
                  ? totalsWithoutTimeRange?.CREDIT_ISSUED?.credits
                  : 0
              }
              title="creditIssued"
              updatedDate={
                totalsWithoutTimeRange?.CREDIT_ISSUED?.lastUpdated
                  ? moment(totalsWithoutTimeRange?.CREDIT_ISSUED?.lastUpdated).fromNow()
                  : '0'
              }
              icon={<CheckCircle color="#16B1FF" size={80} />}
              loading={loadingTotals}
              companyRole={userInfoState?.companyRole}
              tooltip={t('tCreditIssued')}
              t={t}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                totalsWithoutTimeRange?.CREDIT_RETIRED?.credits
                  ? totalsWithoutTimeRange?.CREDIT_RETIRED?.credits
                  : 0
              }
              title="creditRetired"
              updatedDate={
                totalsWithoutTimeRange?.CREDIT_RETIRED?.lastUpdated
                  ? moment(totalsWithoutTimeRange?.CREDIT_RETIRED?.lastUpdated).fromNow()
                  : '0'
              }
              icon={<Archive color="#16B1FF" size={80} />}
              loading={loadingTotals}
              companyRole={userInfoState?.companyRole}
              tooltip={t('tCreditRetired')}
              t={t}
            />
          </Col>
        </Row>
      </div>
      <div className="filter-container">
        <div className="date-filter">
          <RangePicker
            ranges={{
              Today: [moment(), moment()],
              'Last 7 days': [moment().subtract('6', 'days'), moment()],
              'Last 14 days': [moment().subtract('13', 'days'), moment()],
            }}
            showTime
            allowClear={true}
            format="DD:MM:YYYY"
            onChange={onChangeRange}
          />
        </div>
      </div>

      <div className="country-record-management content-container">
        <div className="title-bar title-bar-transfer-country">
          <Row justify="space-between" align="middle">
            <Col span={20}>
              <div className="body-title">{t('nationalAccounting:crossBorderTransfer')}</div>
            </Col>
          </Row>
        </div>
        <div className="content-card">
          <Row>
            <Col span={24}>
              <div className="nationalAccounting-records-table-container">
                <Table
                  dataSource={countryRecordData}
                  columns={countryTableColumns}
                  className="common-table-class"
                  loading={loadingCountryRecords}
                  scroll={{ x: 1150 }}
                  pagination={{
                    current: currentPageCountryTable,
                    pageSize: pageSizeCountryTable,
                    total: totalCountryRecords,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    onChange: onChangeCountryTable,
                  }}
                  onChange={(val: any, filter: any, sorter: any) =>
                    handleTableChangeCountryTable(val, sorter)
                  }
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          transactionRecordData?.length === 0
                            ? t('nationalAccounting:noRecords')
                            : null
                        }
                      />
                    ),
                  }}
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="national-transfer-record-management content-container">
        <div className="title-bar title-bar-transfer-records">
          <Row justify="space-between" align="middle">
            <Col span={20}>
              <div className="body-title">{t('nationalAccounting:creditTransactions')}</div>
            </Col>
          </Row>
        </div>
        <div className="content-card">
          <Row>
            <Col lg={{ span: 16 }} md={{ span: 16 }}>
              <div className="action-bar">
                <Checkbox
                  className="all-check"
                  indeterminate={indeterminate}
                  onChange={onCheckAllChange}
                  checked={checkAll}
                  defaultChecked={true}
                >
                  All
                </Checkbox>
                <Checkbox.Group
                  options={typeOptions}
                  defaultValue={typeOptions.map((e) => e.value)}
                  value={selectedType}
                  onChange={onTypeQuery}
                />
              </div>
            </Col>
            <Col lg={{ span: 8 }} md={{ span: 8 }}>
              <div className="filter-section">
                <div className="search-bar">
                  <Search
                    onPressEnter={onSearch}
                    placeholder={'Search'}
                    allowClear
                    onChange={(e) =>
                      e.target.value === ''
                        ? setSearch(e.target.value)
                        : setSearchText(e.target.value)
                    }
                    onSearch={setSearch}
                    style={{ width: 265 }}
                  />
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <div className="nationalAccounting-records-table-container">
                <Table
                  dataSource={transactionRecordData}
                  columns={recordsTableColumns}
                  className="common-table-class"
                  loading={loadingTransactionRecords}
                  scroll={{ x: 1150 }}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalTransactionRecords,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    onChange: onChange,
                  }}
                  onChange={(val: any, filter: any, sorter: any) => handleTableChange(val, sorter)}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          transactionRecordData?.length === 0
                            ? t('nationalAccounting:noRecords')
                            : null
                        }
                      />
                    ),
                  }}
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default NationalAccountingDashboard;
