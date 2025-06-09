import {
  AuditOutlined,
  BankOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FilterOutlined,
  PlusOutlined,
  SafetyOutlined,
  EllipsisOutlined,
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
  List,
  Typography,
  Popover,
  Select,
  Space,
  Table,
} from 'antd';
import React, { useEffect, useState } from 'react';
import './companyManagementComponent.scss';
import '../../../Styles/common.table.scss';
import {
  CertBGColor,
  CertColor,
  DevBGColor,
  DevColor,
  GovBGColor,
  GovColor,
  MinBGColor,
  MinColor,
} from '../../../Styles/role.color.constants';
import { addCommSep } from '../../../Definitions/Definitions/programme.definitions';
import { CompanyTableDataType } from '../../../Definitions/Definitions/companyManagement.definitions';
import { Action } from '../../../Definitions/Enums/action.enum';
import { Company } from '../../../Definitions/Entities/company';
import { CompanyManagementColumns } from '../../../Definitions/Enums/company.management.columns.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import * as Icon from 'react-bootstrap-icons';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { RoleIcon } from '../../IconComponents/RoleIcon/role.icon';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';
import { OrganisationStatus } from '../../OrganisationStatus/organisationStatus';

const { Search } = Input;

export const CompanyManagementComponent = (props: any) => {
  const { t, useAbilityContext, visibleColumns, onNavigateToCompanyProfile, onClickAddCompany } =
    props;
  const [totalCompany, setTotalCompany] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CompanyTableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchByTermOrganisation] = useState<any>('name');
  const [searchValueOrganisations, setSearchValueOrganisations] = useState<string>('');
  const [networksearchOrganisations, setNetworkSearchOrganisations] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [filterByOrganisationType, setFilterByOrganisationType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [dataQuery, setDataQuery] = useState<any>();
  const ability = useAbilityContext();
  const { post } = useConnection();

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
        {item === CompanyRole.GOVERNMENT ? (
          <RoleIcon icon={<BankOutlined />} bg={GovBGColor} color={GovColor} />
        ) : item === CompanyRole.CERTIFIER ? (
          <RoleIcon icon={<SafetyOutlined />} bg={CertBGColor} color={CertColor} />
        ) : item === CompanyRole.MINISTRY ? (
          <RoleIcon icon={<AuditOutlined />} bg={MinBGColor} color={MinColor} />
        ) : (
          <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
        )}
        {item === CompanyRole.PROGRAMME_DEVELOPER ? (
          <div>{t('company:developer')}</div>
        ) : (
          <div>{item}</div>
        )}
      </div>
    );
  };

  const getCompanyStateComponent = (item: string) => {
    return (
      <div style={{ display: 'flex', alignItems: 'left' }}>
        <OrganisationStatus t={t} organisationStatus={parseInt(item)}></OrganisationStatus>
      </div>
    );
  };

  const handleFilterVisibleChange = () => {
    setFilterVisible(true);
  };

  const actionMenu = (record: any) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t('company:view'),
            icon: <Icon.InfoCircle />,
            click: () => {
              onNavigateToCompanyProfile(record);
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
      title: '',
      dataIndex: 'logo',
      key: CompanyManagementColumns.logo,
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
      key: CompanyManagementColumns.name,
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
            onNavigateToCompanyProfile(record);
          },
        };
      },
    },
    {
      title: t('company:taxId'),
      dataIndex: 'taxId',
      key: CompanyManagementColumns.taxId,
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? item : '-';
      },
    },
    {
      title: t('company:companyRole'),
      dataIndex: 'companyRole',
      key: CompanyManagementColumns.companyRole,
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return getCompanyRoleComponent(item);
      },
    },
    {
      title: t('company:numberOfProgrammes'),
      dataIndex: 'programmeCount',
      key: CompanyManagementColumns.programmeCount,
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item ? addCommSep(item) : '-';
      },
    },
    {
      title: t('company:creditBalance'),
      dataIndex: 'creditBalance',
      key: CompanyManagementColumns.creditBalance,
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return item !== null ? addCommSep(item) : '-';
      },
    },
    {
      title: t('company:companyState'),
      dataIndex: 'state',
      key: CompanyManagementColumns.companyState,
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return getCompanyStateComponent(item);
      },
    },
    {
      title: t(''),
      width: 6,
      align: 'right' as const,
      key: CompanyManagementColumns.action,
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
          value: '%' + networksearchOrganisations + '%',
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
          value: '%' + networksearchOrganisations + '%',
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
      if (response && response.data) {
        const availableCompanies = response.data.filter(
          (company: any) => company.companyRole !== CompanyRole.API
        );
        setTableData(availableCompanies);
        setTotalCompany(response?.response?.data?.total);
      }
      setDataQuery({
        filterAnd: filterAnd(),
        filterOr: filterOr(),
        sort: sort(),
      });
      setLoading(false);
    } catch (error: any) {
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const downloadCompanyData = async () => {
    setLoading(true);

    try {
      const response: any = await post('national/organisation/download', {
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
      console.log('Error in exporting organisations', error);
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
          <div className="filter-title">{t('company:filterByOrgType')}</div>
          <Radio.Group onChange={onFilterOrganisationType} value={filterByOrganisationType}>
            <Space direction="vertical">
              <Radio value="All">{t('company:all')}</Radio>
              <Radio value="Government">{t('company:gov')}</Radio>
              <Radio value="Ministry">{t('company:min')}</Radio>
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
        setSortField(sorter.field);
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
                  onClick={onClickAddCompany}
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
              <div className="download-data-btn company-data-download">
                <a onClick={downloadCompanyData}>
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
