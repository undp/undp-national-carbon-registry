import {
  BankOutlined,
  ExperimentOutlined,
  FilterOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Dropdown,
  Empty,
  Input,
  MenuProps,
  message,
  PaginationProps,
  Radio,
  Row,
  Select,
  Space,
  Table,
} from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import './companyManagement.scss';
import '../Common/common.table.scss';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import RoleIcon from '../../Components/RoleIcon/role.icon';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
} from '../Common/role.color.constants';
import ProfileIcon from '../../Components/ProfileIcon/profile.icon';
import { useTranslation } from 'react-i18next';
import { CompanyRole, addCommSep } from '../../Definitions/InterfacesAndType/programme.definitions';
import { CompanyTableDataType } from '../../Definitions/InterfacesAndType/companyManagement.definitions';
import { AbilityContext } from '../../Casl/Can';
import { Action } from '../../Casl/enums/action.enum';
import { Company } from '../../Casl/entities/Company';

const { Search } = Input;
const { Option } = Select;

const CompanyManagement = () => {
  const navigate = useNavigate();
  const { get, delete: del, post } = useConnection();
  const [totalCompany, setTotalCompany] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CompanyTableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchByTermOrganisation, setSearchByTermOrganisation] = useState<any>('name');
  const [searchValueOrganisations, setSearchValueOrganisations] = useState<string>('');
  const [networksearchOrganisations, setNetworkSearchOrganisations] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [filterByOrganisationType, setFilterByOrganisationType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const { i18n, t } = useTranslation(['company']);
  const ability = useContext(AbilityContext);

  document.addEventListener('mousedown', (event: any) => {
    const organisationFilterArea1 = document.querySelector('.filter-bar');
    const organisationFilterArea2 = document.querySelector('.filter-dropdown');

    if (organisationFilterArea1 !== null && organisationFilterArea2 !== null) {
      if (
        organisationFilterArea1.contains(event.target) ||
        organisationFilterArea2.contains(event.target)
      ) {
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

  const handleFilterVisibleChange = () => {
    setFilterVisible(true);
  };

  const searchByTermHandler = (event: any) => {
    setSearchByTermOrganisation(event?.target?.value);
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
          <div style={{ display: 'flex', alignItems: 'center' }} className="clickable">
            <div style={{ fontWeight: 600 }}>{item}</div>
          </div>
        );
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            navigate('/companyProfile/view', { state: { record } });
          },
        };
      },
    },
    {
      title: t('company:taxId'),
      dataIndex: 'taxId',
      key: 'taxId',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? item : '-';
      },
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
      dataIndex: 'programmeCount',
      key: 'programmeCount',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? item : '-';
      },
    },
    {
      title: t('company:creditBalance'),
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item !== null ? addCommSep(item) : '-';
      },
    },
  ];
  // }

  const filterOr = () => {
    if (
      searchByTermOrganisation !== null &&
      searchByTermOrganisation !== '' &&
      networksearchOrganisations !== null &&
      networksearchOrganisations !== '' &&
      filterByOrganisationType === 'All'
    ) {
      return [
        {
          key: searchByTermOrganisation,
          operation: 'like',
          value: networksearchOrganisations + '%',
        },
      ];
    } else return undefined;
  };

  const filterAnd = () => {
    if (
      searchByTermOrganisation !== null &&
      searchByTermOrganisation !== '' &&
      networksearchOrganisations !== null &&
      networksearchOrganisations !== '' &&
      filterByOrganisationType !== 'All'
    ) {
      return [
        {
          key: searchByTermOrganisation,
          operation: 'like',
          value: networksearchOrganisations + '%',
        },
        {
          key: 'companyRole',
          operation: '=',
          value: filterByOrganisationType,
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
    } else return undefined;
  };

  const sort = () => {
    if (sortOrder !== '' && sortField !== '') {
      return {
        key: sortField,
        order: sortOrder,
        nullFirst: false,
      };
    } else
      return {
        key: 'companyId',
        order: 'DESC',
      };
  };

  const getAllOrganisationParams = () => {
    return {
      page: currentPage,
      size: pageSize,
      filterOr: filterOr(),
      filterAnd: filterAnd(),
      sort: sort(),
    };
  };

  const getAllCompany = async () => {
    setLoading(true);
    try {
      const response: any = await post('national/organisation/query', getAllOrganisationParams());
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
  }, [
    currentPage,
    pageSize,
    searchByTermOrganisation,
    networksearchOrganisations,
    filterByOrganisationType,
    sortField,
    sortOrder,
  ]);

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onFilterOrganisationType = (checkedValue: any) => {
    setCurrentPage(1);
    setFilterByOrganisationType(checkedValue?.target?.value);
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      title: 'Filter by',
      label: (
        <div className="filter-menu-item">
          <div className="filter-title">{t('company:filterByCompany')}</div>
          <Radio.Group onChange={onFilterOrganisationType} value={filterByOrganisationType}>
            <Space direction="vertical">
              <Radio value="All">{t('company:all')}</Radio>
              <Radio value="Government">{t('company:gov')}</Radio>
              <Radio value="ProgrammeDeveloper">{t('company:developer')}</Radio>
              <Radio value="Certifier">{t('company:certifier')}</Radio>
            </Space>
          </Radio.Group>
        </div>
      ),
    },
  ];

  const onSearch = () => {
    setCurrentPage(1);
    setNetworkSearchOrganisations(searchValueOrganisations);
  };

  const handleTableChange = (val: any, sorter: any) => {
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
      setSortField('companyId');
      setSortOrder('DESC');
    }
    // setCurrentPage(1);
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
              {ability.can(Action.Create, Company) && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/companyManagement/addCompany')}
                >
                  {t('company:addCompany')}
                </Button>
              )}
            </div>
          </Col>
          <Col md={16} xs={24}>
            <div className="filter-section">
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={
                    searchByTermOrganisation === 'email'
                      ? `${t('company:searchMail')}`
                      : `${t('company:searchName')}`
                  }
                  allowClear
                  onChange={(e) =>
                    e.target.value === ''
                      ? setNetworkSearchOrganisations(e.target.value)
                      : setSearchValueOrganisations(e.target.value)
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
                rowClassName={(record) =>
                  parseInt(record.state as string) === 0 ? 'table-row-gray' : ''
                }
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalCompany,
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
                      description={tableData.length === 0 ? 'No data' : null}
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
