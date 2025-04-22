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
  Select,
} from 'antd';
import { useEffect, useState } from 'react';
import moment from 'moment';
import './ProgrammeManagementComponent.scss';
import '../../Styles/common.table.scss';
import { UserTableDataType } from '../../Definitions/Definitions/userManagement.definitions';
import { TooltipColor } from '../../Styles/role.color.constants';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import {
  addSpaces,
  getCompanyBgColor,
  getCreditTypeName,
  getCreditTypeTagType,
  getProjectProposalStage,
  getProjectProposalStageEnumVal,
} from '../../Definitions/Definitions/programme.definitions';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ProgrammeManagementSlColumns } from '../../Definitions/Enums/programme.management.sl.columns.enum';
import { PlusOutlined, EllipsisOutlined, DownloadOutlined } from '@ant-design/icons';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import * as Icon from 'react-bootstrap-icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import {
  getProjectCategory,
  ProgrammeStatus,
  ProjectProposalStage,
} from '../../Definitions/Enums/programmeStage.enum';
import { ProfileIcon } from '../IconComponents/ProfileIcon/profile.icon';
import { CreditTypeSl } from '../../Definitions/Enums/creditTypeSl.enum';
import { Role } from '../../Definitions/Enums/role.enum';
import { API_PATHS } from '../../Config/apiConfig';
import { APPLICATION_STAGE } from '../../Definitions/Constants/ApplicationStage';
import { downloadCSV } from '../../Utils/downloadCSV';
import { deepCopy } from '../../Utils/deepCopy';
import { toMoment } from '../../Utils/convertTime';

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
  // const [statusFilter, setStatusFilter] = useState<any>();
  const [dataFilter, setDataFilter] = useState<any>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);
  const [ministryLevelFilter, setMinistryLevelFilter] = useState<boolean>(false);
  const { userInfoState } = useUserContext();
  const ability = useAbilityContext();
  const [dataQuery, setDataQuery] = useState<any>();

  const [applicationStageFilter, setApplicationStageFilter] = useState<{
    key: string;
    operation: string;
    value: string;
  }>();

  const onSelectedApplicationStageChange = (value: string) => {
    if (value) {
      setApplicationStageFilter({
        key: 'projectProposalStage',
        operation: '=',
        value: value,
      });
    } else {
      setApplicationStageFilter(undefined);
    }
  };

  const statusOptions = Object.keys(ProgrammeStatus).map((k, index) => ({
    label: t(`projectList:${Object.values(ProgrammeStatus)[index]}`),
    value: k,
  }));

  const applicationStageOptions = Object.keys(APPLICATION_STAGE).map((k, index) => ({
    label: t(`projectList:${Object.values(APPLICATION_STAGE)[index]}`),
    value: k,
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));

  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);

  // const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
  //   if (checkedValues !== selectedStatus) {
  //     setSelectedStatus(checkedValues);

  //     setIndeterminate(
  //       !!checkedValues.length && checkedValues.length < Object.keys(statusOptions).length
  //     );
  //     setCheckAll(checkedValues.length === Object.keys(statusOptions).length);
  //   }

  //   if (checkedValues.length === 0) {
  //     setTableData([]);
  //     setTotalProgramme(0);
  //     return;
  //   }

  //   setStatusFilter({
  //     key: 'projectStatus',
  //     operation: 'in',
  //     value: checkedValues,
  //   });
  // };

  // const onCheckAllChange = (e: CheckboxChangeEvent) => {
  //   const nw = e.target.checked ? statusOptions.map((el) => el.value) : [];
  //   setSelectedStatus(nw);
  //   setIndeterminate(false);
  //   setCheckAll(e.target.checked);
  //   onStatusQuery(nw);
  // };

  const actionMenu = (record: any) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t('projectList:view'),
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
      title: t('projectList:title'),
      dataIndex: 'title',
      key: ProgrammeManagementSlColumns.title,
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
      title: t('projectList:orgName'),
      dataIndex: 'company',
      key: ProgrammeManagementSlColumns.company,
      align: 'left' as const,
      render: (item: any) => {
        const elements = (
          <Tooltip title={item.name} color={TooltipColor} key={TooltipColor}>
            <div>
              <ProfileIcon
                icon={item.logo}
                bg={getCompanyBgColor(item.companyRole)}
                name={item.name}
              />
            </div>
          </Tooltip>
        );
        return <div className="org-list">{elements}</div>;
      },
    },
    // {
    //   title: t('projectList:projectCategory'),
    //   dataIndex: 'projectCategory',
    //   sorter: true,
    //   key: ProgrammeManagementSlColumns.projectCategory,
    //   align: 'center' as const,
    //   render: (item: any) => {
    //     return <span>{getProjectCategory[item]}</span>;
    //   },
    // },
    {
      title: t('projectList:sector'),
      dataIndex: 'sector',
      key: ProgrammeManagementSlColumns.sector,
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return <>{item ? t(`projectList:${item}`): t('projectList:na')}</>;
      },
    },
    {
      title: t('projectList:sectoralScope'),
      dataIndex: 'sectoralScope',
      key: ProgrammeManagementSlColumns.sectoralScope,
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return <>{t(`projectList:${item}`)}</>;
      },
    },
    {
      title: t('projectList:proposalStage'),
      dataIndex: 'projectProposalStage',
      key: ProgrammeManagementSlColumns.projectProposalStage,
      sorter: true,
      align: 'center' as const,
      render: (item: any) => {
        return (
          <Tag color={getProjectProposalStage(item as ProjectProposalStage)}>
            {t(`projectList:${getProjectProposalStageEnumVal(item as string)}`)}
          </Tag>
        );
      },
    },
    {
      title: t('projectList:balance'),
      dataIndex: 'creditBalance',
      key: ProgrammeManagementSlColumns.creditBalance,
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return <span>{item}</span>;
      },
    },
    {
      title: t('projectList:creditRetired'),
      dataIndex: 'creditRetired',
      key: ProgrammeManagementSlColumns.creditRetired,
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return <span>{item}</span>;
      },
    },
    {
      title: t('projectList:authorizationId'),
      dataIndex: 'authorizationId',
      key: ProgrammeManagementSlColumns.authorizationId,
      align: 'center' as const,
      render: (item: any) => {
        return <span>{item ? item : t('projectList:na')}</span>
      }
    },
    {
      title: t('projectList:projectCreatedDate'),
      dataIndex: 'createdTime',
      key: ProgrammeManagementSlColumns.projectCreatedDate,
      align: 'center' as const,
      render: (item: any) => {
        console.log("-----------item-----------", item);
        return (
          <>{toMoment(Number(item)).format('YYYY/MM/DD HH:mm:ss')}</>
        )
      }
    },
    {
      title: t(''),
      width: 6,
      align: 'right' as const,
      key: ProgrammeManagementSlColumns.action,
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
    // if (statusFilter) {
    //   filter.push(statusFilter);
    // }

    if (applicationStageFilter) {
      filter.push(applicationStageFilter);
    }

    if (search && search !== '') {
      filter.push({
        key: 'title',
        operation: 'ilike',
        value: `%${search}%`,
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
      const response: any = await post(API_PATHS.GET_PROJECT, {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      setTableData(response?.data ? response.data : []);
      setTotalProgramme(response.response?.data?.total ? response.response?.data?.total : 0);
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
      const userId = userInfoState?.id;
      const response: any = await post(API_PATHS.USER_DETAILS, {
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

  // const downloadProgrammeData = async () => {
  //   setLoading(true);

  //   try {
  //     const response: any = await post('national/programme/download', {
  //       filterAnd: dataQuery.filterAnd,
  //       filterOr: dataQuery.filterOr?.length > 0 ? dataQuery.filterOr : undefined,
  //       sort: dataQuery.sort,
  //     });
  //     if (response && response.data) {
  //       const url = response.data.url;
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = response.data.csvFile; // Specify the filename for the downloaded file
  //       document.body.appendChild(a);
  //       a.click();
  //       document.body.removeChild(a); // Clean up the created <a> element
  //       window.URL.revokeObjectURL(url);
  //     }
  //     setLoading(false);
  //   } catch (error: any) {
  //     console.log('Error in exporting programmes', error);
  //     message.open({
  //       type: 'error',
  //       content: error.message,
  //       duration: 3,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //     setLoading(false);
  //   }
  // };

  const onSearch = async () => {
    if (searchText) {
      setSearch(searchText?.toLowerCase());
    }
  };

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      getAllProgramme();
    }
  }, [dataFilter, applicationStageFilter]);

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

  const mapBase64ToFields = (fileUrls: string[]) => {
    let fileObjs: any[] = [];

    if (fileUrls !== undefined && fileUrls.length > 0) {
      fileObjs = fileUrls.map((item: any, index) => {
        const nameParts = item.split('/');
        const name = nameParts[nameParts.length - 1];
        const tempObj = {
          uid: name,
          name: name,
          status: 'done',
          url: item,
        };
        return tempObj;
      });
    }

    return fileObjs;
  };

  const downloadData = async () => {
    try {
      const res = await post(API_PATHS.GET_PROJECT, {
        page: 1,
        size: totalProgramme,
      });

      if (res?.data) {
        console.log('--------res--------', res);
        delete res.data.additionalDocuments;
        res.data = {
          ...res.data,
          ...res.data.company,
        };
        downloadCSV(deepCopy(res.data), 'projectList.csv', [
          'additionalDocuments',
          'geographicalLocationCoordinates',
          'documents',
          'infRefId',
          'refId',
          'company',
        ]);
      }
    } catch (error) {
      console.log('------error--------', error);
    }
  };
  // MARK: Main JSX START

  return (
    <div className="content-container programme-management">
      <div className="programme-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('projectList:slcfViewProgrammes')}</div>
        </div>
        <div className="actions">
          {userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
            userInfoState.userRole !== Role.ViewOnly &&
            userInfoState.userRole !== Role.Manager &&
            enableAddProgramme && (
              <div className="action-bar">
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlusOutlined />}
                  onClick={onClickAddProgramme}
                >
                  {t('projectList:addProgramme')}
                </Button>
              </div>
            )}
        </div>
      </div>
      <div className="content-card">
        <Row className="table-actions-section">
          <Col lg={{ span: 15 }} md={{ span: 14 }}>
            <div className="action-bar">
              <Select
                className="application-stage-selector"
                options={applicationStageOptions}
                onChange={onSelectedApplicationStageChange}
                placeholder={t('projectList:proposalStage')}
                allowClear
              />
              {/* <Checkbox
                className="all-check"
                disabled={loading}
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
                defaultChecked={true}
              >
                {t('projectList:all')}
              </Checkbox>
              <Checkbox.Group
                disabled={loading}
                options={statusOptions}
                defaultValue={statusOptions.map((e) => e.value)}
                value={selectedStatus}
                onChange={onStatusQuery}
              /> */}
            </div>
          </Col>
          <Col lg={{ span: 9 }} md={{ span: 10 }}>
            <div className="filter-section">
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={`${t('projectList:searchByName')}`}
                  allowClear
                  onChange={(e) => {}}
                  onSearch={(value: string) => {
                    console.log('----------value-----------', value);
                    setSearch(value);
                  }}
                  style={{ width: 265 }}
                />
              </div>
              <div className="download-icon" onClick={downloadData}>
                <DownloadOutlined />
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <div className="programmeManagement-table-container">
              <Table
                dataSource={tableData.length ? tableData : []}
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
                      description={tableData.length === 0 ? t('projectList:noProgrammes') : null}
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
