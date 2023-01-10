import { MoreOutlined } from '@ant-design/icons';
import { Row, Checkbox, message, Tag, PaginationProps, Col, Input, Table, Empty } from 'antd';
// import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileIcon from '../../Components/ProfileIcon/profile.icon';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import {
  CreditTransferStage,
  getStageEnumVal,
  getTransferStageTagType,
} from '../../Definitions/InterfacesAndType/programme.definitions';
import './programmeTransferManagement.scss';
import '../Common/common.table.scss';

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation(['common', 'creditTransfer', 'programme']);

  const statusOptions = Object.keys(CreditTransferStage).map((k, index) => ({
    label: Object.values(CreditTransferStage)[index],
    value: k,
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);

  const { post } = useConnection();
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<any>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
    console.log(checkedValues);

    if (checkedValues !== selectedStatus) {
      setSelectedStatus(checkedValues);
    }

    if (checkedValues.length === 0) {
      setTableData([]);
      setTotalProgramme(0);
      return;
    }
    setStatusFilter({
      key: 'status',
      operation: 'in',
      value: checkedValues,
    });
  };

  const { Search } = Input;

  const onCheckAllChange = (e: any) => {
    const nw = e.target.checked ? statusOptions.map((el) => el.value) : [];
    setSelectedStatus(nw);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    onStatusQuery(nw);
  };

  const getAllProgramme = async () => {
    setLoading(true);
    const filter: any[] = [];
    if (statusFilter) {
      filter.push(statusFilter);
    }
    if (search && search !== '') {
      filter.push({
        key: 'programmeTitle',
        operation: 'like',
        value: `${search}%`,
      });
    }

    let sort;
    if (sortOrder && sortField) {
      sort = {
        key: sortField,
        order: sortOrder,
      };
    } else {
      sort = {
        key: 'requestId',
        order: 'ASC',
      };
    }

    try {
      const response: any = await post('national/programme/queryProgrammeTransfers', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        sort: sort,
      });

      console.log(response);
      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting programme transfers', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProgramme();
  }, [currentPage, pageSize, statusFilter, sortField, sortOrder, search]);

  const columns = [
    {
      title: t('creditTransfer:requestID'),
      dataIndex: 'requestId',
      key: 'requestId',
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
    },
    {
      title: t('creditTransfer:date'),
      key: 'txTime',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {DateTime.fromMillis(parseInt(itemObj.txTime)).toFormat('dd LLLL yyyy')}
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:pName'),
      dataIndex: 'programmeTitle',
      key: 'programmeTitle',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('creditTransfer:sector'),
      dataIndex: 'programmeSector',
      key: 'programmeSector',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('creditTransfer:certifier'),
      dataIndex: 'certifier',
      key: 'certifier',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj.certifier}
              bg="rgba(128, 255, 0, 0.12)"
              name={itemObj.programmeTitle}
            />
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:initiator'),
      dataIndex: 'requester',
      key: 'requester',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj.requester}
              bg="rgba(128, 255, 0, 0.12)"
              name={itemObj.programmeTitle}
            />
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:cSender'),
      dataIndex: 'cSender',
      key: 'cSender',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj.cSender}
              bg="rgba(128, 255, 0, 0.12)"
              name={itemObj.programmeTitle}
            />
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:cReceiver'),
      dataIndex: 'requester',
      key: 'requester',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj.requester}
              bg="rgba(128, 255, 0, 0.12)"
              name={itemObj.programmeTitle}
            />
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:cRequested'),
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
    },
    {
      title: t('creditTransfer:cBalance'),
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span>{item}</span>;
      },
    },
    {
      title: t('programme:status'),
      dataIndex: 'currentStage',
      key: 'currentStage',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        return (
          <Tag className="clickable" color={getTransferStageTagType(Obj.status)}>
            {getStageEnumVal(Obj.status)}
          </Tag>
        );
      },
    },
    {
      align: 'center' as const,
      render: () => {
        return (
          <div className="clickable">
            <MoreOutlined style={{ fontSize: '20px' }} />
          </div>
        );
      },
    },
  ];

  const onSearch = async () => {
    setSearch(searchText);
  };

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleTableChange = (pag: any, sorter: any) => {
    console.log(pag, sorter);
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
    // setCurrentPage(1);
  };

  return (
    <div className="content-container programme-management">
      <div className="title-bar">
        <div className="body-title">{t('creditTransfer:viewCreditsTransfers')}</div>
        <div className="body-sub-title">{t('creditTransfer:desc')}</div>
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
                options={statusOptions}
                defaultValue={statusOptions.map((e) => e.value)}
                value={selectedStatus}
                onChange={onStatusQuery}
              />
            </div>
          </Col>
          <Col lg={{ span: 8 }} md={{ span: 8 }}>
            <div className="filter-section">
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={'Search by programme name'}
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  onSearch={setSearch}
                  style={{ width: 265 }}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <div className="programmeManagement-table-container">
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
                  onChange: onChange,
                }}
                onChange={(val: any, filter: any, sorter: any) => handleTableChange(val, sorter)}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tableData.length === 0 ? t('creditTransfer:noTransfer') : null}
                    />
                  ),
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CreditTransfer;
