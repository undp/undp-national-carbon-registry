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
  Empty,
  Input,
  List,
  message,
  PaginationProps,
  Popconfirm,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import './companyManagement.scss';
import '../Common/common.table.scss';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
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

const { Search } = Input;
const { Option } = Select;

const CompanyManagement = () => {
  const navigate = useNavigate();
  const { get, delete: del, post } = useConnection();
  const [totalCompany, setTotalCompany] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { i18n, t } = useTranslation(['company']);

  const getCompanyBgColor = (item: string) => {
    if (item === 'Government') {
      return GovBGColor;
    } else if (item === 'Certifier') {
      return CertBGColor;
    }
    return DevBGColor;
  };

  const getCompanyRoleComponent = (item: string) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {item === 'Government' ? (
          <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
        ) : item === 'Certifier' ? (
          <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
        ) : (
          <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
        )}
        {item === 'ProgrammeDeveloper' ? <div>{t('company:developer')}</div> : <div>{item}</div>}
      </div>
    );
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
            click: () => {
              navigate('/companyManagement/updateCompany', { state: { record } });
            },
          },
          { text: 'Delete', icon: <DeleteOutlined />, click: () => {} },
        ]}
        renderItem={(item) => (
          <List.Item onClick={item.click}>
            <Typography.Text className="action-icon">{item.icon}</Typography.Text>
            <span>{item.text}</span>
          </List.Item>
        )}
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
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ProfileIcon
              icon={itemObj.logo}
              bg={getCompanyBgColor(itemObj.companyRole)}
              name={itemObj.name}
            />
          </div>
        );
      },
    },
    {
      title: t('company:name'),
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
      title: t('company:taxId'),
      dataIndex: 'taxId',
      key: 'taxId',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('company:companyRole'),
      dataIndex: 'companyRole',
      key: 'companyRole',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return getCompanyRoleComponent(item);
      },
    },
    {
      title: t('company:numberOfProgrammes'),
      dataIndex: 'numberOfProgrammes',
      key: 'numberOfProgrammes',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? item : '-';
      },
    },
    {
      title: t('company:creditBalance'),
      dataIndex: 'credit',
      key: 'credit',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? item : '-';
      },
    },
    {
      title: '',
      width: 6,
      align: 'right' as const,
      render: (_: any, record: TableDataType) => {
        return (
          <Popover placement="bottomRight" content={actionMenu(record)} trigger="click">
            <EllipsisOutlined
              rotate={90}
              style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
            />
          </Popover>
        );
      },
    },
  ];
  // }

  const getAllCompany = async () => {
    setLoading(true);
    try {
      const response: any = await post('national/company/query', {
        page: currentPage,
        size: pageSize,
      });
      setTableData(response.data);
      setTotalCompany(response.response.data.total);
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting company', error);
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
    getAllCompany();
  }, [currentPage, pageSize]);

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  return (
    <div className="content-container">
      <div className="title-bar">
        <div className="body-title">{t('company:viewCompanies')}</div>
        <div className="body-sub-title">{t('company:viewDesc')}</div>
      </div>
      <div className="content-card">
        <Row className="table-actions-section">
          <Col md={8} xs={24}>
            <div className="action-bar">
              <Button
                type="primary"
                size="large"
                block
                icon={<PlusOutlined />}
                onClick={() => navigate('/companyManagement/addCompany')}
              >
                {t('company:addCompany')}
              </Button>
            </div>
          </Col>
          <Col md={16} xs={24}>
            <div className="filter-section">
              <div className="search-bar">
                <Search
                  placeholder="Search by Email"
                  allowClear
                  onSearch={() => {}}
                  style={{ width: 265 }}
                />
              </div>
              <div className="filter-bar">
                <FilterOutlined
                  style={{
                    color: 'rgba(58, 53, 65, 0.3)',
                    fontSize: '20px',
                  }}
                />
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
                  total: totalCompany,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  onChange: onChange,
                }}
                // scroll={{ x: 1500 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tableData.length === 0 ? 'No Companies' : null}
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

export default CompanyManagement;
