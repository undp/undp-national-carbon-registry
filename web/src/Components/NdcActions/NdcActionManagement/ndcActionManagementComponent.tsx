import {
  Checkbox,
  Col,
  Empty,
  Input,
  PaginationProps,
  Row,
  Table,
  Popover,
  Tag,
  List,
  Typography,
  Tooltip,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { DateTime } from 'luxon';
import './ndcActionManagementComponent.scss';
// import {
//   Company,
//   NdcActionStatus,
//   NdcActionTypes,
//   addSpaces,
//   getCompanyBgColor,
//   getNdcStatusTagType,
// } from '../../../Definitions';
// import React from 'react';
// import { ProfileIcon } from '../../Common/ProfileIcon/profile.icon';
import { TooltipColor } from '../../../Styles/role.color.constants';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
// import { useConnection, useUserContext } from '../../../Context';
import { DownloadOutlined, EllipsisOutlined } from '@ant-design/icons';
import * as Icon from 'react-bootstrap-icons';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import {
  getNdcStatusTagType,
  NdcActionStatus,
} from '../../../Definitions/Enums/ndcAction.status.enum';
import {
  addSpaces,
  getCompanyBgColor,
} from '../../../Definitions/Definitions/programme.definitions';
import { NdcActionTypes } from '../../../Definitions/Enums/ndcActionTypes.enum';
import { Company } from '../../../Definitions/Entities/company';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';

export const NdcActionManagementComponent = (props: any) => {
  const { t, onNavigateToNdcManagementView, onNavigateToProgrammeManagementView } = props;

  const [checkAll, setCheckAll] = useState(true);
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [statusFilter, setStatusFilter] = useState<any>();
  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [dataFilter, setDataFilter] = useState<any>();
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);
  const [ministryLevelFilter, setMinistryLevelFilter] = useState<boolean>(false);
  const [dataQuery, setDataQuery] = useState<any>();

  const { Search } = Input;
  const { post } = useConnection();
  const { userInfoState } = useUserContext();

  const statusOptions = Object.keys(NdcActionStatus).map((k, index) => ({
    label: addSpaces(Object.values(NdcActionStatus)[index]),
    value: Object.values(NdcActionStatus)[index],
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));

  const getNdcActionNames = (action: NdcActionTypes) => {
    switch (action) {
      case NdcActionTypes.Adaptation:
        return t('ndcAction:adaptation');
      case NdcActionTypes.Mitigation:
        return t('ndcAction:mitigation');
      case NdcActionTypes.CrossCutting:
        return t('ndcAction:crossCutting');
      case NdcActionTypes.Enablement:
        return t('ndcAction:enablement');
      default:
        return '';
    }
  };

  const getCompanyLogos = (companyId: any, itemObj: any) => {
    if (companyId && itemObj.company.length > 0) {
      const selectedCompany = itemObj.company.find(
        (c: Company) => c.companyId === parseInt(companyId)
      );
      if (selectedCompany) {
        return (
          <Tooltip title={selectedCompany.name} color={TooltipColor} key={TooltipColor}>
            <div>
              <ProfileIcon
                icon={selectedCompany.logo}
                bg={getCompanyBgColor(selectedCompany.companyRole)}
                name={selectedCompany.name}
              />
            </div>
          </Tooltip>
        );
      } else {
        return <div></div>;
      }
    }
  };

  const actionMenu = (record: any) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t('ndcAction:view'),
            icon: <Icon.InfoCircle />,
            click: () => {
              onNavigateToNdcManagementView(record);
            },
          },
        ]}
        renderItem={(item: any) => (
          <List.Item onClick={item.click}>
            <Typography.Text className="action-icon color-primary">{item.icon}</Typography.Text>
            <span>{item.text}</span>
          </List.Item>
        )}
      />
    );
  };

  const columns: any = [
    {
      title: t('ndcAction:ndcColumnsActionId'),
      dataIndex: 'id',
      key: 'id',
      align: 'left' as const,
      sorter: true,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            onNavigateToNdcManagementView(record);
          },
        };
      },
    },
    {
      title: t('ndcAction:ndcColumnsDate'),
      key: 'createdTime',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {DateTime.fromMillis(parseInt(itemObj.createdTime)).toFormat('dd LLLL yyyy')}
          </div>
        );
      },
    },
    {
      title: t('ndcAction:ndcColumnsNdcAction'),
      dataIndex: 'action',
      key: 'action',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return getNdcActionNames(item);
      },
    },
    {
      title: t('ndcAction:ndcColumnsProgrammeName'),
      dataIndex: 'programmeName',
      key: 'programmeName',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            onNavigateToProgrammeManagementView(record.programmeId);
          },
        };
      },
    },
    {
      title: t('ndcAction:ndcColumnsSector'),
      dataIndex: 'sector',
      key: 'sector',
      align: 'left' as const,
      sorter: true,
    },
    {
      title: t('ndcAction:ndcColumnsOwners'),
      key: 'companyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.companyId &&
              itemObj.companyId.map((v: any, i: any) => {
                return getCompanyLogos(v, itemObj);
              })}
          </div>
        );
      },
    },
    {
      title: t('ndcAction:ndcColumnsStatus'),
      dataIndex: 'status',
      align: 'center' as const,
      key: 'status',
      sorter: true,
      render: (item: any, Obj: any) => {
        return (
          <Tooltip title={Obj.status} color={TooltipColor} key={TooltipColor}>
            <Tag className="clickable" color={getNdcStatusTagType(Obj.status)}>
              {addSpaces(Obj.status)}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: t(''),
      width: 6,
      align: 'right' as const,
      key: 'action',
      render: (_: any, record: any) => {
        const menu = actionMenu(record);
        return (
          menu && (
            <Popover placement="bottomRight" content={menu} trigger="click">
              <EllipsisOutlined
                rotate={90}
                style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
              />
            </Popover>
          )
        );
      },
    },
  ];

  const getNdcActionData = async () => {
    setLoading(true);
    const filter: any[] = [];
    if (statusFilter) {
      filter.push(statusFilter);
    }

    if (dataFilter) {
      filter.push(dataFilter);
    }

    if (search && search !== '') {
      const interFilterOr = [
        {
          key: 'programmeName',
          operation: 'like',
          value: `%${search}%`,
        },
      ];
      if (!isNaN(Number(search))) {
        interFilterOr.push({
          key: 'id',
          operation: 'like',
          value: `%${search}%`,
        });
      }
      filter.push({
        value: {
          page: currentPage,
          size: pageSize,
          filterOr: interFilterOr,
        },
      });
    }

    let sort: any;
    if (sortOrder && sortField) {
      sort = {
        key: sortField,
        order: sortOrder,
        nullFirst: false,
      };
    } else {
      sort = {
        key: 'txTime',
        order: 'DESC',
      };
    }

    let filterBy: any;
    if (ministryLevelFilter) {
      filterBy = {
        key: 'ministryLevel',
        value: ministrySectoralScope,
      };
    }

    try {
      const response: any = await post('national/programme/queryNdcActions', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        sort: sort,
        filterBy: filterBy,
      });

      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setDataQuery({
        filterAnd: filter,
        filterBy: filterBy,
        sort: sort,
      });
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting ndc actions', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const getUserDetails = async () => {
    setLoading(true);
    try {
      const userId = userInfoState?.id ? parseInt(userInfoState.id) : userInfoState?.id;
      const response: any = await post('national/user/query', {
        page: 1,
        size: 10,
        filterAnd: [
          {
            key: 'id',
            operation: '=',
            value: userId,
          },
        ],
      });
      if (response && response.data) {
        if (
          response?.data[0]?.companyRole === CompanyRole.MINISTRY &&
          response?.data[0]?.company &&
          response?.data[0]?.company?.sectoralScope
        ) {
          setMinistrySectoralScope(response?.data[0]?.company?.sectoralScope);
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting users', error);
      setLoading(false);
    }
  };

  const downloadNdcData = async () => {
    setLoading(true);

    try {
      const response: any = await post('national/programme/queryNdcActions/download', {
        filterAnd: dataQuery.filterAnd,
        filterBy: dataQuery.filterBy,
        sort: dataQuery.sort,
      });
      if (response && response.data) {
        const url = response.data.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.csvFile; // Specify the filename for the downloaded file
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // Clean up the created <a> element
        window.URL.revokeObjectURL(url);
      }
      setLoading(false);
    } catch (error: any) {
      console.log('Error in exporting NDC Actions', error);
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
    if (userInfoState?.companyRole === CompanyRole.MINISTRY) {
      getUserDetails();
    }
  }, []);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      getNdcActionData();
    }
  }, [statusFilter, dataFilter]);

  useEffect(() => {
    getNdcActionData();
  }, [currentPage, pageSize, sortField, sortOrder, search, ministryLevelFilter]);

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
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

  const onCheckAllChange = (e: any) => {
    const nw = e.target.checked ? statusOptions.map((el) => el.value) : [];
    setSelectedStatus(nw);
    setCheckAll(e.target.checked);
    onStatusQuery(nw);
  };

  const onSearch = async () => {
    setSearch(searchText);
  };

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleTableChange = (page: any, sorter: any) => {
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
  };

  return (
    <div className="ndc-management content-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col span={20}>
            <div className="body-title">{t('ndcAction:NdcTitle')}</div>
          </Col>
        </Row>
      </div>
      <div className="content-card">
        <Row>
          <Col lg={{ span: 15 }} md={{ span: 14 }}>
            <div className="action-bar">
              <Checkbox
                className="all-check"
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
          <Col lg={{ span: 9 }} md={{ span: 10 }}>
            <div className="filter-section">
              {userInfoState?.companyRole === CompanyRole.MINISTRY && (
                <div className="search-filter">
                  <Checkbox
                    className="label"
                    onChange={(v) => {
                      if (userInfoState.companyRole === CompanyRole.MINISTRY) {
                        if (v.target.checked) {
                          setMinistryLevelFilter(true);
                        } else {
                          setMinistryLevelFilter(false);
                        }
                      }
                    }}
                  >
                    {t('ndcAction:ministryLevel')}
                  </Checkbox>
                </div>
              )}
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={`${t('ndcAction:searchByProgrammeName')}`}
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
              <div className="download-data-btn">
                <a onClick={downloadNdcData}>
                  <DownloadOutlined
                    style={{
                      color: 'rgba(58, 53, 65, 0.3)',
                      fontSize: '20px',
                    }}
                  />
                </a>
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
                      description={tableData.length === 0 ? t('ndcAction:noNdcActions') : null}
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
