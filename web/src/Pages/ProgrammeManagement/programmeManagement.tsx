import {
  Checkbox,
  Col,
  Empty,
  Input,
  message,
  PaginationProps,
  Row,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useState } from 'react';
import './programmeManagement.scss';
import '../Common/common.table.scss';
import { useNavigate } from 'react-router-dom';
import { TableDataType } from '../../Definitions/InterfacesAndType/userManagement.definitions';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { CertBGColor, DevBGColor, GovBGColor, TooltipColor } from '../Common/role.color.constants';
import ProfileIcon from '../../Components/ProfileIcon/profile.icon';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { useTranslation } from 'react-i18next';
import {
  addCommSep,
  getCompanyBgColor,
  getStageEnumVal,
  getStageTagType,
  ProgrammeStage,
} from '../../Definitions/InterfacesAndType/programme.definitions';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';

const { Search } = Input;

const ProgrammeManagement = () => {
  const navigate = useNavigate();
  const { get, delete: del, post } = useConnection();
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  // const [filter, setFilter] = useState<any>([]);
  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<any>();
  const [dataFilter, setDataFilter] = useState<any>();
  const { i18n, t } = useTranslation(['common', 'programme']);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const { userInfoState } = useUserContext();

  const statusOptions = Object.keys(ProgrammeStage).map((k, index) => ({
    label: Object.values(ProgrammeStage)[index],
    value: k,
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));

  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
    console.log(checkedValues);

    if (checkedValues !== selectedStatus) {
      setSelectedStatus(checkedValues);

      setIndeterminate(
        !!checkedValues.length && checkedValues.length < Object.keys(statusOptions).length
      );
      setCheckAll(checkedValues.length === Object.keys(statusOptions).length);
    }

    if (checkedValues.length === 0) {
      setTableData([]);
      setTotalProgramme(0);
      return;
    }
    // setFilter([
    //   {
    //     key: 'currentStage',
    //     operation: 'in',
    //     value: checkedValues,
    //   },
    // ]);

    setStatusFilter({
      key: 'currentStage',
      operation: 'in',
      value: checkedValues,
    });
  };

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    const nw = e.target.checked ? statusOptions.map((el) => el.value) : [];
    setSelectedStatus(nw);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    onStatusQuery(nw);
  };

  const columns = [
    {
      title: t('programme:title'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            navigate('/programmeManagement/view', { state: { record } });
          },
        };
      },
    },
    {
      title: t('common:company'),
      dataIndex: 'company',
      key: 'company',
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        const elements = item.map((obj: any) => {
          return (
            <Tooltip title={obj.name} color={TooltipColor} key={TooltipColor}>
              <div>
                <ProfileIcon
                  icon={obj.logo}
                  bg={getCompanyBgColor(obj.companyRole)}
                  name={obj.name}
                />
              </div>
            </Tooltip>
          );
        });
        return <div style={{ display: 'flex', alignItems: 'center' }}>{elements}</div>;
      },
    },
    {
      title: t('programme:sector'),
      dataIndex: 'sector',
      sorter: true,
      key: 'sector',
      align: 'left' as const,
    },
    {
      title: t('programme:status'),
      dataIndex: 'currentStage',
      key: 'currentStage',
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return (
          <Tag className="clickable" color={getStageTagType(item)}>
            {getStageEnumVal(item)}
          </Tag>
        );
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            setSelectedStatus([record.currentStage]);
            onStatusQuery([record.currentStage]);
          },
        };
      },
    },
    {
      title: t('programme:issued'),
      dataIndex: 'creditIssued',
      key: 'creditIssued',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(Number(item)) : '-';
      },
    },
    {
      title: t('programme:balance'),
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(Number(item)) : '-';
      },
    },
    {
      title: t('programme:transferred'),
      dataIndex: 'creditTransferred',
      key: 'creditTransferred',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(Number(item)) : '-';
      },
    },
    {
      title: t('programme:certifiers'),
      dataIndex: 'certifier',
      key: 'certifier',
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        const elements = item.map((obj: any) => {
          return (
            <Tooltip title={obj.name} color={TooltipColor} key={TooltipColor}>
              <div>
                <ProfileIcon
                  icon={obj.logo}
                  bg={getCompanyBgColor(obj.companyRole)}
                  name={obj.name}
                />
              </div>
            </Tooltip>
          );
        });
        return <div className="certify-list">{elements}</div>;
      },
    },
    {
      title: t('programme:serialNoh'),
      dataIndex: 'serialNo',
      key: 'serialNo',
      align: 'left' as const,
    },
  ];
  // }

  const getAllProgramme = async () => {
    setLoading(true);

    const filter: any[] = [];

    if (dataFilter) {
      filter.push(dataFilter);
    }
    if (statusFilter) {
      filter.push(statusFilter);
    }
    if (search && search !== '') {
      filter.push({
        key: 'title',
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
        key: 'programmeId',
        order: 'DESC',
      };
    }

    try {
      const response: any = await post('national/programme/query', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        sort: sort,
      });
      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const onSearch = async () => {
    setSearch(searchText);
  };

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      getAllProgramme();
    }
  }, [statusFilter, dataFilter]);

  useEffect(() => {
    getAllProgramme();
  }, [currentPage, pageSize, statusFilter, sortField, sortOrder, search]);

  // useEffect(() => {
  //   setCurrentPage(0);
  // }, [statusFilter, dataFilter]);

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
        <div className="body-title">{t('programme:viewProgrammes')}</div>
        <div className="body-sub-title">{t('programme:desc')}</div>
      </div>
      <div className="content-card">
        <Row className="table-actions-section">
          <Col lg={{ span: 16 }} md={{ span: 16 }}>
            <div className="action-bar">
              <Checkbox
                className="all-check"
                disabled={loading}
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
                defaultChecked={true}
              >
                All
              </Checkbox>
              <Checkbox.Group
                disabled={loading}
                options={statusOptions}
                defaultValue={statusOptions.map((e) => e.value)}
                value={selectedStatus}
                onChange={onStatusQuery}
              />
            </div>
          </Col>
          <Col lg={{ span: 8 }} md={{ span: 8 }}>
            <div className="filter-section">
              <div className="search-filter">
                <Checkbox
                  className="label"
                  onChange={(v) =>
                    setDataFilter(
                      v.target.checked
                        ? {
                            key: 'companyId',
                            operation: 'ANY',
                            value: userInfoState?.companyId,
                          }
                        : undefined
                    )
                  }
                >
                  {t('view:seeMine')}
                </Checkbox>
              </div>
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
                // scroll={{ x: 1500 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tableData.length === 0 ? t('programme:noProgrammes') : null}
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

export default ProgrammeManagement;
