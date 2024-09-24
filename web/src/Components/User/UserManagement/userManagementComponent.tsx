/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  AuditOutlined,
  BankOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExperimentOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Dropdown,
  Empty,
  Input,
  List,
  MenuProps,
  message,
  PaginationProps,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Form,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { PersonDash } from 'react-bootstrap-icons';
import './userManagementComponent.scss';
import '../../../Styles/common.table.scss';
import { UserTableDataType } from '../../../Definitions/Definitions/userManagement.definitions';
import { RoleIcon } from '../../IconComponents/RoleIcon/role.icon';
import {
  AdminBGColor,
  AdminColor,
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
  ManagerBGColor,
  ManagerColor,
  MinBGColor,
  MinColor,
  RootBGColor,
  RootColor,
  ViewBGColor,
  ViewColor,
} from '../../../Styles/role.color.constants';
import { User } from '../../../Definitions/Entities/user';
import { plainToClass } from 'class-transformer';
import { Action } from '../../../Definitions/Enums/action.enum';
import UserActionConfirmationModel from '../../Models/userActionConfirmationModel';
import { UserManagementColumns } from '../../../Definitions/Enums/user.management.columns.enum';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
// import { useConnection, useUserContext } from '../../../Context';

const { Search } = Input;

export const UserManagementComponent = (props: any) => {
  const { t, useAbilityContext, visibleColumns, onNavigateToUpdateUser, onClickAddUser } = props;
  const [formModal] = Form.useForm();
  const { post, delete: del } = useConnection();
  const [totalUser, setTotalUser] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<UserTableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchByTermUser, setSearchByTermUser] = useState<any>('name');
  const [searchValueUsers, setSearchValueUsers] = useState<string>('');
  const [networksearchUsers, setNetworkSearchUsers] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [filterByOrganisationType, setFilterByOrganisationType] = useState<string>('All');
  const [filterByRole, setFilterByRole] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [deleteUserModalRecord, setDeleteUserModalRecord] = useState<any>();
  //   const { i18n, t } = useTranslation(["user"]);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [errorMsg, setErrorMsg] = useState<any>('');
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] = useState(false);
  const [dataQuery, setDataQuery] = useState<any>();
  const ability = useAbilityContext();
  const { userInfoState } = useUserContext();

  document.addEventListener('mousedown', (event: any) => {
    const userFilterArea1 = document.querySelector('.filter-bar');
    const userFilterArea2 = document.querySelector('.filter-dropdown');

    if (userFilterArea1 !== null && userFilterArea2 !== null) {
      if (userFilterArea1.contains(event.target) || userFilterArea2.contains(event.target)) {
        setFilterVisible(true);
      } else {
        setFilterVisible(false);
      }
    }
  });

  const getCompanyBgColor = (item: string) => {
    if (item === 'Government') {
      return GovBGColor;
    } else if (item === 'Certifier') {
      return CertBGColor;
    }
    return DevBGColor;
  };

  const getRoleComponent = (item: UserTableDataType) => {
    const role = item?.role;
    return (
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
        {role === 'Admin' ? (
          <RoleIcon icon={<StarOutlined />} bg={AdminBGColor} color={AdminColor} />
        ) : role === 'Root' ? (
          <RoleIcon icon={<SearchOutlined />} bg={RootBGColor} color={RootColor} />
        ) : role === 'Manager' ? (
          <RoleIcon icon={<ToolOutlined />} bg={ManagerBGColor} color={ManagerColor} />
        ) : (
          <RoleIcon icon={<EyeOutlined />} bg={ViewBGColor} color={ViewColor} />
        )}
        <div>{role === 'ViewOnly' ? 'Viewer' : role}</div>
      </div>
    );
  };

  const getCompanyRoleComponent = (item: UserTableDataType) => {
    const role = item?.company?.companyRole
      ? item?.company?.companyRole
      : item?.companyRole
      ? item?.companyRole
      : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {role === CompanyRole.GOVERNMENT ? (
          <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
        ) : role === CompanyRole.CERTIFIER ? (
          <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
        ) : role === CompanyRole.MINISTRY ? (
          <RoleIcon icon={<AuditOutlined />} bg={MinBGColor} color={MinColor} />
        ) : (
          <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
        )}
        {role === CompanyRole.PROGRAMME_DEVELOPER ? <div>{'Developer'}</div> : <div>{role}</div>}
      </div>
    );
  };

  const deleteUser = async (record: UserTableDataType) => {
    setLoading(true);
    try {
      const response = await del(`national/user/delete?userId=${record?.id}`);
      if (response.status === 200) {
        message.open({
          type: 'success',
          content: response.message,
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        const temp = [...tableData];
        const index = temp.findIndex((value) => value.id === record?.id);
        if (index > -1) {
          temp.splice(index, 1);
          setTableData(temp);
        }
        setLoading(false);
        setOpenDeleteConfirmationModal(false);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleOk = () => {
    deleteUser(deleteUserModalRecord);
  };

  const handleCancel = () => {
    setOpenDeleteConfirmationModal(false);
  };

  const actionMenu = (record: UserTableDataType) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: 'Edit',
            icon: <EditOutlined />,
            isDisabled: !ability.can(Action.Update, plainToClass(User, record)),
            click: () => {
              onNavigateToUpdateUser(record);
            },
          },
          {
            text: 'Delete',
            icon: <DeleteOutlined />,
            isDisabled: !ability.can(Action.Delete, plainToClass(User, record)),
            click: () => {
              setDeleteUserModalRecord(record);
              setActionInfo({
                action: 'Delete',
                headerText: `${t('user:deleteConfirmHeaderText')}`,
                text: `${t('user:deleteConfirmText')}`,
                type: 'danger',
                icon: <PersonDash />,
              });
              setErrorMsg('');
              setOpenDeleteConfirmationModal(true);
            },
          },
        ]}
        renderItem={(item) =>
          !item.isDisabled && (
            <List.Item onClick={item.click}>
              <Typography.Text className="action-icon">{item.icon}</Typography.Text>
              <span>{item.text}</span>
            </List.Item>
          )
        }
      />
    );
  };

  const columns = [
    {
      title: '',
      dataIndex: 'logo',
      key: UserManagementColumns.logo,
      width: '20px',
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj?.company?.logo}
              bg={getCompanyBgColor(itemObj.companyRole)}
              name={itemObj?.company?.name}
            />
          </div>
        );
      },
    },
    {
      title: t('user:name'),
      dataIndex: 'name',
      key: UserManagementColumns.name,
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>{item}</div>
          </div>
        );
      },
    },
    {
      title: t('user:email'),
      dataIndex: 'email',
      key: UserManagementColumns.email,
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('user:phone'),
      dataIndex: 'phoneNo',
      key: UserManagementColumns.phoneNo,
      align: 'left' as const,
      render: (item: any, itemObj: UserTableDataType) => {
        return item ? item : '-';
      },
    },
    {
      title: t('user:company'),
      dataIndex: 'company',
      key: UserManagementColumns.company,
      render: (item: any, itemObj: UserTableDataType) => {
        return itemObj?.company?.name ? itemObj?.company?.name : '-';
      },
      align: 'left' as const,
    },
    {
      title: t('user:companyRole'),
      dataIndex: 'companyRole',
      key: UserManagementColumns.companyRole,
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: UserTableDataType) => {
        return getCompanyRoleComponent(itemObj);
      },
    },
    {
      title: t('user:role'),
      dataIndex: 'role',
      key: UserManagementColumns.role,
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: UserTableDataType) => {
        return getRoleComponent(itemObj);
      },
    },
    {
      title: '',
      key: UserManagementColumns.actions,
      width: 6,
      align: 'right' as const,
      render: (_: any, record: UserTableDataType) => {
        return (
          (ability.can(Action.Update, plainToClass(User, record)) ||
            ability.can(Action.Delete, plainToClass(User, record))) &&
          record.id !== userInfoState?.id && (
            <Popover placement="bottomRight" content={actionMenu(record)} trigger="click">
              <EllipsisOutlined
                rotate={90}
                style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
              />
            </Popover>
          )
        );
      },
    },
  ].filter((column: any) => visibleColumns.includes(column.key));

  const filterOr = () => {
    if (
      searchByTermUser !== null &&
      searchByTermUser !== '' &&
      networksearchUsers !== null &&
      networksearchUsers !== '' &&
      filterByOrganisationType === 'All' &&
      filterByRole === 'All'
    ) {
      return [
        {
          key: searchByTermUser,
          operation: 'like',
          value: '%' + networksearchUsers + '%',
        },
      ];
    } else return undefined;
  };

  const filterAnd = () => {
    if (
      searchByTermUser !== null &&
      searchByTermUser !== '' &&
      networksearchUsers !== null &&
      networksearchUsers !== '' &&
      filterByRole !== 'All' &&
      filterByOrganisationType !== 'All'
    ) {
      return [
        {
          key: searchByTermUser,
          operation: 'like',
          value: '%' + networksearchUsers + '%',
        },
        {
          key: 'role',
          operation: '=',
          value: filterByRole,
        },
        {
          key: 'companyRole',
          operation: '=',
          value: filterByOrganisationType,
        },
      ];
    } else if (
      searchByTermUser !== null &&
      searchByTermUser !== '' &&
      networksearchUsers !== null &&
      networksearchUsers !== '' &&
      filterByRole !== 'All'
    ) {
      return [
        {
          key: searchByTermUser,
          operation: 'like',
          value: '%' + networksearchUsers + '%',
        },
        {
          key: 'role',
          operation: '=',
          value: filterByRole,
        },
      ];
    } else if (
      searchByTermUser !== null &&
      searchByTermUser !== '' &&
      networksearchUsers !== null &&
      networksearchUsers !== '' &&
      filterByOrganisationType !== 'All'
    ) {
      return [
        {
          key: searchByTermUser,
          operation: 'like',
          value: '%' + networksearchUsers + '%',
        },
        {
          key: 'companyRole',
          operation: '=',
          value: filterByOrganisationType,
        },
      ];
    } else if (filterByOrganisationType !== 'All' && filterByRole !== 'All') {
      return [
        {
          key: 'companyRole',
          operation: '=',
          value: filterByOrganisationType,
        },
        {
          key: 'role',
          operation: '=',
          value: filterByRole,
        },
      ];
    } else if (filterByOrganisationType !== 'All') {
      return [
        {
          key: 'companyRole',
          operation: '=',
          value: filterByOrganisationType,
        },
      ];
    } else if (filterByRole !== 'All') {
      return [
        {
          key: 'role',
          operation: '=',
          value: filterByRole,
        },
      ];
    } else return undefined;
  };

  const sort = () => {
    if (sortOrder !== '' && sortField !== '') {
      return {
        key: sortField,
        order: sortOrder,
      };
    } else
      return {
        key: 'id',
        order: 'DESC',
      };
  };

  const getAllUserParams = () => {
    return {
      page: currentPage,
      size: pageSize,
      filterOr: filterOr(),
      filterAnd: filterAnd(),
      sort: sort(),
    };
  };

  const getAllUser = async () => {
    setLoading(true);
    try {
      const response: any = await post('national/user/query', getAllUserParams());
      if (response && response.data) {
        const availableUsers = response.data.filter(
          (user: any) => user.companyRole !== CompanyRole.API
        );
        setTableData(availableUsers);
        setTotalUser(response?.response?.data?.total);
      }
      setDataQuery({
        filterAnd: filterAnd(),
        filterOr: filterOr(),
        sort: sort(),
      });
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const downloadUserData = async () => {
    setLoading(true);
    try {
      const response: any = await post('national/user/download', {
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
      console.log('Error in exporting users', error);
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
    getAllUser();
  }, [
    currentPage,
    pageSize,
    searchByTermUser,
    networksearchUsers,
    filterByRole,
    filterByOrganisationType,
    sortField,
    sortOrder,
  ]);

  const onChange: PaginationProps['onChange'] = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleFilterVisibleChange = () => {
    setFilterVisible(true);
  };

  const searchByTermHandler = (event: any) => {
    setSearchByTermUser(event?.target?.value);
  };

  const onFilterOrganisationType = (checkedValue: any) => {
    setCurrentPage(1);
    setFilterByOrganisationType(checkedValue?.target?.value);
  };

  const onFilterRole = (checkedValue: any) => {
    setCurrentPage(1);
    setFilterByRole(checkedValue?.target?.value);
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      title: 'Search by',
      label: (
        <div className="filter-menu-item">
          <div className="filter-title">{t('user:searchBy')}</div>
          <Radio.Group onChange={searchByTermHandler} value={searchByTermUser}>
            <Space direction="vertical">
              <Radio value="name">Name</Radio>
              <Radio value="email">Email</Radio>
            </Space>
          </Radio.Group>
        </div>
      ),
    },
    {
      key: '2',
      title: 'Filter by',
      label: (
        <div className="filter-menu-item">
          <div className="filter-title">{t('user:filterByRole')}</div>
          <Radio.Group onChange={onFilterRole} value={filterByRole}>
            <Space direction="vertical">
              <Radio value="All">All</Radio>
              <Radio value="Admin">Admin</Radio>
              <Radio value="Manager">Manager</Radio>
              <Radio value="ViewOnly">Viewer</Radio>
            </Space>
          </Radio.Group>
        </div>
      ),
    },
    {
      key: '3',
      title: 'Filter by',
      label: (
        <div className="filter-menu-item">
          <div className="filter-title">{t('user:filterByCompanyRole')}</div>
          <Radio.Group onChange={onFilterOrganisationType} value={filterByOrganisationType}>
            <Space direction="vertical">
              <Radio value="All">All</Radio>
              <Radio value="Government">Government</Radio>
              <Radio value="Ministry">Ministry</Radio>
              <Radio value="ProgrammeDeveloper">Developer</Radio>
              <Radio value="Certifier">Certifier</Radio>
            </Space>
          </Radio.Group>
        </div>
      ),
    },
  ];

  const onSearch = () => {
    setCurrentPage(1);
    setNetworkSearchUsers(searchValueUsers);
  };

  const handleTableChange = (pag: any, sorter: any) => {
    if (sorter.order === 'ascend') {
      setSortOrder('ASC');
    } else if (sorter.order === 'descend') {
      setSortOrder('DESC');
    } else if (sorter.order === undefined) {
      setSortOrder('');
    }
    if (sorter.columnKey !== undefined) {
      if (sorter.columnKey === 'company') {
        setSortField('company.name');
      } else {
        setSortField(sorter.field);
      }
    } else {
      setSortField('id');
      setSortOrder('DESC');
    }
  };

  return (
    <div className="content-container">
      <div className="title-bar">
        <div className="body-title">{t('user:viewUsers')}</div>
      </div>
      <div className="content-card">
        <Row className="table-actions-section">
          <Col md={8} xs={24}>
            <div className="action-bar">
              {ability.can(Action.Create, User) && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlusOutlined />}
                  onClick={onClickAddUser}
                >
                  {t('user:addUser')}
                </Button>
              )}
            </div>
          </Col>
          <Col md={16} xs={24}>
            <div className="filter-section">
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={searchByTermUser === 'email' ? 'Search by email' : 'Search by name'}
                  allowClear
                  onChange={(e) =>
                    e.target.value === ''
                      ? setNetworkSearchUsers(e.target.value)
                      : setSearchValueUsers(e.target.value)
                  }
                  onSearch={onSearch}
                  style={{ width: 265 }}
                />
              </div>
              <div className="filter-bar">
                <Dropdown
                  arrow={false}
                  menu={{ items }}
                  placement="bottomRight"
                  open={filterVisible}
                  onOpenChange={handleFilterVisibleChange}
                  overlayClassName="filter-dropdown"
                  trigger={['click']}
                >
                  <a
                    className="ant-dropdown-link"
                    onClick={(e) => setFilterVisible(!filterVisible)}
                  >
                    <FilterOutlined
                      style={{
                        color: 'rgba(58, 53, 65, 0.3)',
                        fontSize: '20px',
                      }}
                    />
                  </a>
                </Dropdown>
              </div>
              <div className="download-data-btn user-data-download">
                <a onClick={downloadUserData}>
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
            <div className="userManagement-table-container">
              <Table
                dataSource={tableData}
                columns={columns}
                className="common-table-class"
                loading={loading}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalUser,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  onChange: onChange,
                }}
                onChange={(val: any, filter: any, sorter: any) => handleTableChange(val, sorter)}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tableData.length === 0 ? 'No Users' : null}
                    />
                  ),
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={handleOk}
        onActionCanceled={handleCancel}
        openModal={openDeleteConfirmationModal}
        errorMsg={errorMsg}
        loading={loading}
      />
    </div>
  );
};
