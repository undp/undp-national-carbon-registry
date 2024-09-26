import {
  Button,
  Checkbox,
  Col,
  Empty,
  Input,
  message,
  PaginationProps,
  Row,
  Table,
  Popover,
  List,
  Typography,
  Tag,
  Tooltip,
} from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import './programmeManagementComponent.scss';
import '../../../Styles/common.table.scss';
import { UserTableDataType } from '../../../Definitions/Definitions/userManagement.definitions';
import { TooltipColor } from '../../../Styles/role.color.constants';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import {
  addCommSep,
  getCompanyBgColor,
  getStageEnumVal,
  getStageTagType,
  getStageTagTypeMRV,
  sumArray,
} from '../../../Definitions/Definitions/programme.definitions';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ProgrammeManagementColumns } from '../../../Definitions/Enums/programme.management.columns.enum';
import { Action } from '../../../Definitions/Enums/action.enum';
import { DownloadOutlined, PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import * as Icon from 'react-bootstrap-icons';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { ProgrammeStageMRV, ProgrammeStageR } from '../../../Definitions/Enums/programmeStage.enum';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';
import { ProgrammeEntity } from '../../../Definitions/Entities/programme';

const { Search } = Input;

export const ProgrammeManagementComponent = (props: any) => {
  const {
    t,
    visibleColumns,
    onNavigateToProgrammeView,
    onClickAddProgramme,
    enableAddProgramme,
    useAbilityContext,
  } = props;
  const { get, delete: del, post } = useConnection();
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<UserTableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<any>();
  const [dataFilter, setDataFilter] = useState<any>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);
  const [ministryLevelFilter, setMinistryLevelFilter] = useState<boolean>(false);
  const { userInfoState } = useUserContext();
  const ability = useAbilityContext();
  const [dataQuery, setDataQuery] = useState<any>();

  const stageObject = enableAddProgramme ? ProgrammeStageMRV : ProgrammeStageR;

  const statusOptions = Object.keys(stageObject).map((k, index) => ({
    label: Object.values(stageObject)[index],
    value: k,
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));

  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
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

  const actionMenu = (record: any) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t('programme:view'),
            icon: <Icon.InfoCircle />,
            click: () => {
              onNavigateToProgrammeView(record);
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

  const columns = [
    {
      title: t('programme:title'),
      dataIndex: 'title',
      key: ProgrammeManagementColumns.title,
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            onNavigateToProgrammeView(record);
          },
        };
      },
    },
    {
      title: t('common:company'),
      dataIndex: 'company',
      key: ProgrammeManagementColumns.company,
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
        return <div className="org-list">{elements}</div>;
      },
    },
    {
      title: t('programme:sector'),
      dataIndex: 'sector',
      sorter: true,
      key: ProgrammeManagementColumns.sector,
      align: 'left' as const,
    },
    {
      title: t('programme:status'),
      dataIndex: 'currentStage',
      key: ProgrammeManagementColumns.currentStage,
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return (
          <Tag className="clickable" color={getStageTagTypeMRV(item)}>
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
      key: ProgrammeManagementColumns.creditIssued,
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(Number(item)) : '-';
      },
    },
    {
      title: t('programme:balance'),
      dataIndex: 'creditBalance',
      key: ProgrammeManagementColumns.creditBalance,
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(Number(item)) : '-';
      },
    },
    {
      title: t('programme:transferred'),
      dataIndex: 'creditTransferred',
      key: ProgrammeManagementColumns.creditTransferred,
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(sumArray(item)) : '-';
      },
    },
    {
      title: t('programme:emissionsReductionExpected'),
      dataIndex: 'emissionReductionExpected',
      key: ProgrammeManagementColumns.emissionReductionExpected,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(item) : '-';
      },
    },
    {
      title: t('programme:emissionsReductionAchieved'),
      dataIndex: 'emissionReductionAchieved',
      key: ProgrammeManagementColumns.emissionReductionAchieved,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(item) : '-';
      },
    },
    {
      title: t('programme:emissionReductionAchievedandCreditIssued'),
      dataIndex: 'emissionReductionAchieved',
      key: ProgrammeManagementColumns.emissionReductionAchievedandCreditIssued,
      align: 'right' as const,
      render: (item: any) => {
        return item ? addCommSep(item) : '-';
      },
    },
    {
      title: t('programme:certifiers'),
      dataIndex: 'certifierId',
      key: ProgrammeManagementColumns.certifierId,
      align: 'left' as const,
      sorter: true,
      render: (item: any, itemObj: any) => {
        if (item === null) {
          return '-';
        }
        const cMap: any = {};
        for (const c of itemObj.certifier) {
          cMap[c.companyId] = c;
        }

        const elements = item.map((id: any) => {
          const obj = cMap[id];
          if (!obj) {
            return;
          }
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
      key: ProgrammeManagementColumns.serialNo,
      align: 'left' as const,
    },
    {
      title: t(''),
      width: 6,
      align: 'right' as const,
      key: ProgrammeManagementColumns.action,
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
  ].filter((column) => visibleColumns.includes(column.key));

  const getAllProgramme = async () => {
    setLoading(true);

    const filter: any[] = [];
    const filterOr: any[] = [];

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
        value: `%${search}%`,
      });
    }

    if (ministryLevelFilter) {
      ministrySectoralScope?.map((secScope: any) => {
        filterOr.push({
          key: 'sectoralScope',
          operation: '=',
          value: secScope,
        });
      });
    }

    let sort: any;
    if (sortOrder && sortField) {
      sort = {
        key: sortField === 'certifierId' ? 'certifierId[1]' : sortField,
        order: sortOrder,
        nullFirst: false,
      };
    } else {
      sort = {
        key: 'createdTime',
        order: 'DESC',
      };
    }

    try {
      const response: any = await post('national/programme/query', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setLoading(false);
      setDataQuery({
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
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

  const downloadProgrammeData = async () => {
    setLoading(true);

    try {
      const response: any = await post('national/programme/download', {
        filterAnd: dataQuery.filterAnd,
        filterOr: dataQuery.filterOr?.length > 0 ? dataQuery.filterOr : undefined,
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
      console.log('Error in exporting programmes', error);
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
  }, [currentPage, pageSize, sortField, sortOrder, search, ministryLevelFilter]);

  useEffect(() => {
    if (userInfoState?.companyRole === CompanyRole.MINISTRY) {
      getUserDetails();
    }
  }, []);

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleTableChange = (pag: any, sorter: any) => {
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
    // setCurrentPage(1);
  };

  return (
    <div className="content-container programme-management">
      <div className="programme-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('programme:viewProgrammes')}</div>
        </div>
        <div className="actions">
          {ability.can(Action.Manage, ProgrammeEntity) && enableAddProgramme && (
            <div className="action-bar">
              <Button
                type="primary"
                size="large"
                block
                icon={<PlusOutlined />}
                onClick={onClickAddProgramme}
              >
                {t('programme:addProgramme')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="content-card">
        <Row className="table-actions-section">
          <Col lg={{ span: 15 }} md={{ span: 14 }}>
            <div className="action-bar">
              <Checkbox
                className="all-check"
                disabled={loading}
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
                defaultChecked={true}
              >
                {t('programme:all')}
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
          <Col lg={{ span: 9 }} md={{ span: 10 }}>
            <div className="filter-section">
              <div className="search-filter">
                <Checkbox
                  className="label"
                  onChange={(v) => {
                    if (userInfoState?.companyRole === CompanyRole.MINISTRY) {
                      if (v.target.checked) {
                        setMinistryLevelFilter(true);
                      } else {
                        setMinistryLevelFilter(false);
                      }
                    } else if (userInfoState?.companyRole === CompanyRole.CERTIFIER) {
                      setDataFilter(
                        v.target.checked
                          ? {
                              key: 'certifierId',
                              operation: 'ANY',
                              value: userInfoState?.companyId,
                            }
                          : undefined
                      );
                    } else {
                      setDataFilter(
                        v.target.checked
                          ? {
                              key: 'companyId',
                              operation: 'ANY',
                              value: userInfoState?.companyId,
                            }
                          : undefined
                      );
                    }
                  }}
                >
                  {userInfoState?.companyRole === CompanyRole.MINISTRY
                    ? t('view:ministryLevel')
                    : t('view:seeMine')}
                </Checkbox>
              </div>
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={`${t('programme:searchByName')}`}
                  allowClear
                  // onChange={(e) => setSearchText(e.target.value)}
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
                <a onClick={downloadProgrammeData}>
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
