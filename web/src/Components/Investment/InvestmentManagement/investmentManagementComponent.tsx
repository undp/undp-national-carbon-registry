/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { DownloadOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Row,
  Checkbox,
  message,
  Tag,
  PaginationProps,
  Col,
  Input,
  Table,
  Empty,
  Popover,
  List,
  Typography,
  Form,
  Tooltip,
  Button,
} from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import '../investmentComponent.scss';
import '../../../Styles/common.table.scss';
import * as Icon from 'react-bootstrap-icons';
import {
  InvestmentBGColor,
  InvestmentColor,
  TooltipColor,
} from '../../../Styles/role.color.constants';
import {
  InvestmentType,
  InvestmentLevel,
  InvestmentStream,
  InvestmentStatus,
  getStatusTagType,
} from '../../../Definitions/Enums/investment.enum';
// import InvestmentActionModel from '../../Common/Investment/investmentActionModel';
import {
  addCommSepRound,
  addSpaces,
  getCompanyBgColor,
} from '../../../Definitions/Definitions/programme.definitions';
import { ProgrammeTransfer } from '../../../Definitions/Entities/programmeTransfer';
// import { RoleIcon } from '../../RoleIcon/role.icon';
// import { ProfileIcon } from '../../Common/ProfileIcon/profile.icon';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { Role } from '../../../Definitions/Enums/role.enum';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useSettingsContext } from '../../../Context/SettingsContext/settingsContext';
import { RoleIcon } from '../../IconComponents/RoleIcon/role.icon';
import { ProfileIcon } from '../../IconComponents/ProfileIcon/profile.icon';
import InvestmentActionModel from '../../Models/investmentActionModel';
// import { PlusOutlined } from '@ant-design/icons';
// import { useConnection, useUserContext, useSettingsContext } from '../../../Context';

type PopupInfo = {
  title: string;
  icon: any;
  actionBtnText: string;
  okAction: any;
  type: 'primary' | 'danger';
  remarkRequired: boolean;
};

export const InvestmentManagementComponent = (props: any) => {
  const { translator, onNavigateToProgrammeView, onClickAddOwnership, enableAddOwnership } = props;

  const t = translator.t;
  const statusOptions = Object.keys(InvestmentStatus).map((k, index) => ({
    label: addSpaces(Object.values(InvestmentStatus)[index]),
    value: Object.values(InvestmentStatus)[index],
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);
  const { userInfoState } = useUserContext();

  const { post, get } = useConnection();
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [dataFilter, setDataFilter] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>();
  const [searchText, setSearchText] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<any>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedReq, setSelectedReq] = useState<ProgrammeTransfer>();
  const [popupInfo, setPopupInfo] = useState<PopupInfo>();
  const { isTransferFrozen, setTransferFrozen } = useSettingsContext();
  const [ministrySectoralScope, setMinistrySectoralScope] = useState<any[]>([]);
  const [ministryLevelFilter, setMinistryLevelFilter] = useState<boolean>(false);
  const [dataQuery, setDataQuery] = useState<any>();

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
  const [formModal] = Form.useForm();
  const { Search } = Input;

  const onCheckAllChange = (e: any) => {
    const nw = e.target.checked ? statusOptions.map((el) => el.value) : [];
    setSelectedStatus(nw);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    onStatusQuery(nw);
  };

  const getInvestmentData = async () => {
    setLoading(true);
    const filter: any[] = [];
    if (statusFilter) {
      filter.push(statusFilter);
    }

    if (search && search !== '') {
      const interFilterOr = [
        {
          key: 'programmeTitle',
          operation: 'like',
          value: `%${search}%`,
        },
      ];
      if (!isNaN(Number(search))) {
        interFilterOr.push({
          key: 'requestId',
          operation: '=',
          value: `${search}`,
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
        key: 'requestId',
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
      const response: any = await post('national/programme/investmentQuery', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: dataFilter,
        sort: sort,
        filterBy: filterBy,
      });

      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setDataQuery({
        filterAnd: filter,
        filterOr: dataFilter,
        sort: sort,
        filterBy: filterBy,
      });
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting programme investment', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const downloadInvestmentData = async () => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/investments/download', {
        filterAnd: dataQuery.filterAnd,
        filterOr: dataQuery.filterOr?.length > 0 ? dataQuery.filterOr : undefined,
        sort: dataQuery.sort,
        filterBy: dataQuery.filterBy,
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
      console.log('Error in exporting investments', error);
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

  useEffect(() => {
    if (userInfoState?.companyRole === CompanyRole.MINISTRY) {
      getUserDetails();
    }
  }, []);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      getInvestmentData();
    }
  }, [statusFilter, dataFilter]);

  useEffect(() => {
    getInvestmentData();
  }, [currentPage, pageSize, sortField, sortOrder, search, ministryLevelFilter]);

  const handleRequestOk = async (
    reqId: number,
    remarks: string,
    endpoint: string,
    successText?: string,
    isRetire?: boolean
  ) => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/' + endpoint, {
        requestId: reqId,
        comment: remarks,
      });
      let successMsg = response.message;
      if (isRetire) {
        successMsg = t('creditTransfer:internationalTransferReqCancelled');
      }
      message.open({
        type: 'success',
        content: successText ? successText : successMsg,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
      getInvestmentData();
      setModalVisible(false);
    } catch (error: any) {
      console.log('Error in Cancelling transfer request', error);
      setLoading(false);
      return error.message;
    }
  };

  const showModalOnAction = (record: any, info: PopupInfo) => {
    setSelectedReq(record);
    setModalVisible(true);
    setPopupInfo(info);
  };

  const getSendCreditBalance = (record: ProgrammeTransfer) => {
    const idx = record.companyId!.map((e) => Number(e)).indexOf(record.fromCompanyId!);
    if (idx < 0) {
      return 0;
    }
    if (!record.creditOwnerPercentage) {
      return record.creditBalance;
    }
    return (Number(record.creditBalance!) * Number(record.creditOwnerPercentage![idx])) / 100;
  };

  const actionMenu = (record: any) => {
    let isRetire = false;
    if (record.isRetirement === true) {
      isRetire = true;
    }
    if (record.status === 'Pending' && userInfoState?.userRole !== Role.ViewOnly) {
      return userInfoState?.companyId === record.initiatorCompanyId ? (
        <List
          className="action-menu"
          size="small"
          dataSource={[
            {
              text: t('creditTransfer:cancel'),
              icon: <Icon.ExclamationOctagon />,
              click: () => {
                showModalOnAction(record, {
                  title: t('creditTransfer:cancelTitle'),
                  icon: <Icon.ExclamationOctagon />,
                  actionBtnText: t('creditTransfer:proceed'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(requestId, comment, 'investmentCancel', undefined, isRetire),
                  type: 'danger',
                  remarkRequired: true,
                });
              },
            },
          ]}
          renderItem={(item: any) => (
            <List.Item onClick={item.click}>
              <Typography.Text className="action-icon color-error">{item.icon}</Typography.Text>
              <span>{item.text}</span>
            </List.Item>
          )}
        />
      ) : record.fromCompanyId === userInfoState?.companyId ? (
        <List
          className="action-menu"
          size="small"
          dataSource={[
            {
              text: t('creditTransfer:accept'),
              icon: <Icon.ClipboardCheck />,
              style: 'color-primary',
              click: () => {
                showModalOnAction(record, {
                  title: t('creditTransfer:acceptFinancingTitle'),
                  icon: <Icon.ClipboardCheck />,
                  actionBtnText: t('creditTransfer:proceed'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(
                      requestId,
                      comment,
                      'investmentApprove',
                      `${t('programme:investmentReqApproved')}`
                    ),
                  type: 'primary',
                  remarkRequired: false,
                });
              },
            },
            {
              text: t('creditTransfer:reject'),
              icon: <Icon.XOctagon />,
              style: 'color-error',
              click: () => {
                showModalOnAction(record, {
                  title: t('creditTransfer:rejectTitle'),
                  icon: <Icon.XOctagon />,
                  actionBtnText: t('creditTransfer:reject'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(requestId, comment, 'investmentReject'),
                  type: 'danger',
                  remarkRequired: true,
                });
              },
            },
          ]}
          renderItem={(item: any) => (
            <List.Item onClick={item.click}>
              <Typography.Text className={`action-icon ${item.style}`}>{item.icon}</Typography.Text>
              <span>{item.text}</span>
            </List.Item>
          )}
        />
      ) : null;
    }
  };

  const columns = [
    {
      title: t('programme:requestId'),
      dataIndex: 'requestId',
      key: 'requestId',
      sorter: true,
    },
    {
      title: t('programme:date'),
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
      title: t('programme:programmeName'),
      dataIndex: 'programmeTitle',
      key: 'programmeTitle',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        if (item) {
          return <span className="clickable">{item}</span>;
        }
        return <span>-</span>;
      },
      onCell: (record: any, rowIndex: any) => {
        return {
          onClick: (ev: any) => {
            onNavigateToProgrammeView(record.programmeId);
          },
        };
      },
    },
    {
      title: t('programme:type'),
      key: 'type',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        if (!Obj.type) {
          return <span>-</span>;
        }
        return (
          <Tooltip title={addSpaces(Obj.type)} color={TooltipColor} key={TooltipColor}>
            <div>
              <RoleIcon
                icon={Obj.type === InvestmentType.PUBLIC ? <Icon.Eye /> : <Icon.EyeSlash />}
                bg={InvestmentBGColor}
                color={InvestmentColor}
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('programme:level'),
      key: 'level',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        if (!Obj.level) {
          return <span>-</span>;
        }
        return (
          <Tooltip title={addSpaces(Obj.level)} color={TooltipColor} key={TooltipColor}>
            <div>
              <RoleIcon
                icon={Obj.level === InvestmentLevel.INTERNATIONAL ? <Icon.Globe2 /> : <Icon.Flag />}
                bg={InvestmentBGColor}
                color={InvestmentColor}
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('programme:stream'),
      key: 'stream',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        if (!Obj.stream) {
          return <span>-</span>;
        }
        return (
          <Tooltip title={addSpaces(Obj.stream)} color={TooltipColor} key={TooltipColor}>
            <div>
              <RoleIcon
                icon={
                  Obj.stream === InvestmentStream.CLIMATE_FINANCE ? (
                    <Icon.Bank />
                  ) : (
                    <Icon.GraphUpArrow />
                  )
                }
                bg={InvestmentBGColor}
                color={InvestmentColor}
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('programme:sector'),
      dataIndex: 'programmeSector',
      key: 'programmeSector',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        if (item) {
          return <span>{item}</span>;
        }
        return <span>-</span>;
      },
    },
    {
      title: t('programme:investor'),
      key: 'toCompanyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.receiver &&
              itemObj.receiver.map((v: any, i: any) => {
                return (
                  <Tooltip title={v.name} color={TooltipColor} key={TooltipColor}>
                    <div>
                      <ProfileIcon
                        icon={v.logo}
                        bg={getCompanyBgColor(v.companyRole)}
                        name={v.name}
                      />
                    </div>
                  </Tooltip>
                );
              })}
          </div>
        );
      },
    },
    {
      title: t('programme:owner'),
      key: 'fromCompanyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.sender &&
              itemObj.sender.map((v: any, i: any) => {
                return (
                  <Tooltip title={v.name} color={TooltipColor} key={TooltipColor}>
                    <div>
                      <ProfileIcon
                        icon={v.logo}
                        bg={getCompanyBgColor(v.companyRole)}
                        name={v.name}
                      />
                    </div>
                  </Tooltip>
                );
              })}
          </div>
        );
      },
    },
    {
      title: t('programme:status'),
      key: 'status',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        return (
          <Tooltip title={Obj.serialNo} color={TooltipColor} key={TooltipColor}>
            <Tag className="clickable" color={getStatusTagType(Obj.status)}>
              {addSpaces(Obj.status)}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: t('programme:amount'),
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      align: 'right' as const,
      render: (item: any) => {
        return <span className="clickable">{addCommSepRound(item)}</span>;
      },
    },
    {
      align: 'right' as const,
      render: (_: any, record: any) => {
        const menu = actionMenu(record);
        return menu && !isTransferFrozen ? (
          <Popover placement="bottomRight" content={menu} trigger="click">
            <EllipsisOutlined
              rotate={90}
              style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
            />
          </Popover>
        ) : (
          <span></span>
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
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
    // setCurrentPage(1);
  };

  return (
    <div className="investment-management content-container">
      <div className="investment-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('programme:investmentTitle')}</div>
        </div>
        <div className="actions">
          {enableAddOwnership &&
            (userInfoState?.companyRole == CompanyRole.MINISTRY ||
              userInfoState?.companyRole == CompanyRole.GOVERNMENT ||
              userInfoState?.companyRole == CompanyRole.PROGRAMME_DEVELOPER) &&
            userInfoState.userRole != Role.ViewOnly && (
              <div className="action-bar">
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlusOutlined />}
                  onClick={onClickAddOwnership}
                >
                  {t('programme:addOwnership')}
                </Button>
              </div>
            )}
        </div>
      </div>
      <div className="content-card">
        <Row>
          <Col lg={{ span: 15 }} md={{ span: 14 }}>
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
                    {t('programme:ministryLevel')}
                  </Checkbox>
                </div>
              )}
              <div className="search-bar">
                <Search
                  onPressEnter={onSearch}
                  placeholder={'Search'}
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
                <a onClick={downloadInvestmentData}>
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
                      description={tableData.length === 0 ? t('programme:noinvestment') : null}
                    />
                  ),
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
      {popupInfo && selectedReq && (
        <InvestmentActionModel
          investment={selectedReq!}
          onCancel={() => {
            setModalVisible(false);
            setSelectedReq(undefined);
          }}
          actionBtnText={popupInfo!.actionBtnText}
          onFinish={popupInfo?.okAction}
          subText={''}
          openModal={modalVisible}
          icon={popupInfo!.icon}
          title={popupInfo!.title}
          type={popupInfo!.type}
          remarkRequired={popupInfo.remarkRequired}
          translator={translator}
        />
      )}
    </div>
  );
};
