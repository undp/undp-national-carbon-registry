import {
  BankOutlined,
  DeleteOutlined,
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
  Menu,
  MenuProps,
  message,
  Modal,
  PaginationProps,
  Popconfirm,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Form,
} from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import './userManagement.scss';
import '../Common/common.table.scss';
import { useNavigate } from 'react-router-dom';
import { TableDataType } from '../../Definitions/InterfacesAndType/userManagement.definitions';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import RoleIcon from '../../Components/RoleIcon/role.icon';
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
  RootBGColor,
  RootColor,
  ViewBGColor,
  ViewColor,
} from '../Common/role.color.constants';
import ProfileIcon from '../../Components/ProfileIcon/profile.icon';
import { useTranslation } from 'react-i18next';
import { AbilityContext } from '../../Casl/Can';
import { User } from '../../Casl/entities/User';
import { plainToClass } from 'class-transformer';
import { Action } from '../../Casl/enums/action.enum';

const { Search } = Input;
const { Option } = Select;

const UserManagement = () => {
  const navigate = useNavigate();
  const [formModal] = Form.useForm();
  const { get, post, delete: del } = useConnection();
  const [totalUser, setTotalUser] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchByTermUser, setSearchByTermUser] = useState<any>('name');
  const [searchValueUsers, setSearchValueUsers] = useState<string>('');
  const [networksearchUsers, setNetworkSearchUsers] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [filterByOrganisationType, setFilterByOrganisationType] = useState<string>('All');
  const [filterByRole, setFilterByRole] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [deleteUserModalVisible, setDeleteUserModalVisible] = useState<boolean>(false);
  const [deleteUserModalRecord, setDeleteUserModalRecord] = useState<any>();
  const { i18n, t } = useTranslation(['user']);
  const ability = useContext(AbilityContext);

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

  const getRoleComponent = (item: TableDataType) => {
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

  const getCompanyRoleComponent = (item: TableDataType) => {
    const role = item?.company?.companyRole
      ? item?.company?.companyRole
      : item?.companyRole
      ? item?.companyRole
      : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {role === 'Government' ? (
          <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
        ) : role === 'Certifier' ? (
          <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
        ) : (
          <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
        )}
        {role === 'ProgrammeDeveloper' ? <div>{'Developer'}</div> : <div>{role}</div>}
      </div>
    );
  };

  const deleteUser = async (record: TableDataType) => {
    setLoading(true);
    try {
      const response = await del(`national/user/delete?email=${record?.email}`);
      if (response.status === 200) {
        message.open({
          type: 'success',
          content: response.message,
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        const temp = [...tableData];
        const index = temp.findIndex((value) => value.email === record?.email);
        if (index > -1) {
          temp.splice(index, 1);
          setTableData(temp);
        }
        setLoading(false);
      }
    } catch (error: any) {
      console.log('Error in deleting user', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const handleOk = () => {
    deleteUser(deleteUserModalRecord);
    setDeleteUserModalVisible(false);
  };

  const handleCancel = () => {
    setDeleteUserModalVisible(false);
  };

  const actionMenu = (record: TableDataType) => {
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
              navigate('/userManagement/updateUser', { state: { record } });
            },
          },
          {
            text: 'Delete',
            icon: <DeleteOutlined />,
            isDisabled: !ability.can(Action.Delete, plainToClass(User, record)),
            click: () => {
              setDeleteUserModalRecord(record);
              setDeleteUserModalVisible(true);
              // deleteUser(record);
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
      key: 'logo',
      width: '20px',
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        console.log({ item, ...itemObj });
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
      key: 'name',
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
      key: 'email',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('user:phone'),
      dataIndex: 'phoneNo',
      key: 'phoneNo',
      align: 'left' as const,
      render: (item: any, itemObj: TableDataType) => {
        return item ? item : '-';
      },
    },
    {
      title: t('user:company'),
      dataIndex: 'company',
      key: 'company',
      render: (item: any, itemObj: TableDataType) => {
        return itemObj?.company?.name ? itemObj?.company?.name : '-';
      },
      align: 'left' as const,
    },
    {
      title: t('user:companyRole'),
      dataIndex: 'companyRole',
      key: 'companyRole',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: TableDataType) => {
        return getCompanyRoleComponent(itemObj);
      },
    },
    {
      title: t('user:role'),
      dataIndex: 'role',
      key: 'role',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: TableDataType) => {
        return getRoleComponent(itemObj);
      },
    },
    {
      title: '',
      width: 6,
      align: 'right' as const,
      render: (_: any, record: TableDataType) => {
        return (
          (ability.can(Action.Update, plainToClass(User, record)) ||
            ability.can(Action.Delete, plainToClass(User, record))) && (
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
  ];
  // }

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
          value: networksearchUsers + '%',
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
          value: networksearchUsers + '%',
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
          value: networksearchUsers + '%',
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
          value: networksearchUsers + '%',
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
      console.log('users data  -- > ', response?.data);
      setTableData(response?.data);
      setTotalUser(response?.response?.data?.total);
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

  const onChange: PaginationProps['onChange'] = (page, size) => {
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
          <div className="filter-title">Search by</div>
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
          <div className="filter-title">Filter by Role</div>
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
          <div className="filter-title">Filter by Organisation Type</div>
          <Radio.Group onChange={onFilterOrganisationType} value={filterByOrganisationType}>
            <Space direction="vertical">
              <Radio value="All">All</Radio>
              <Radio value="Government">Government</Radio>
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
    console.log(pag, sorter);
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
        setSortField(sorter.columnKey);
      }
    } else {
      setSortField('id');
      setSortOrder('DESC');
    }
    // setCurrentPage(1);
  };

  return (
    <div className="content-container">
      <Modal
        centered
        title=""
        okText="DELETE"
        open={deleteUserModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="400px"
      >
        <div className="delete-modal-container">
          <div className="confirm-message-details">
            <div className="icon">
              <Trash color="#FF4D4F" size={64} />
            </div>
            <div className="content">Are you sure you want to permanently delete this user?</div>
            <div className="sub-content">You can’t undo this action</div>
          </div>
          <div className="remarks">
            <Form
              name="delete-modal-details"
              className="delete-modal-form"
              layout={'vertical'}
              requiredMark={true}
              form={formModal}
              onFinish={handleOk}
            >
              <Form.Item
                className="remarks-label"
                label="Remarks"
                name="remarks"
                rules={[
                  {
                    required: true,
                    message: 'Remarks is required!',
                  },
                ]}
              >
                <Input.TextArea placeholder="" />
              </Form.Item>
              <Form.Item>
                <div className="delete-modal-btns">
                  <div className="center width-60">
                    <Button onClick={handleCancel}>CANCEL</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      DELETE
                    </Button>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Modal>
      <div className="title-bar">
        <div className="body-title">{t('user:viewUsers')}</div>
        <div className="body-sub-title">{t('user:viewDesc')}</div>
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
                  onClick={() => navigate('/userManagement/addUser')}
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
                // scroll={{ x: 1500 }}
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
    </div>
  );
};

export default UserManagement;
