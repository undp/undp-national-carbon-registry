/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EllipsisOutlined } from '@ant-design/icons';
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
  Modal,
  Button,
  Form,
  Tooltip,
} from 'antd';
// import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProfileIcon from '../../Components/ProfileIcon/profile.icon';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import {
  CompanyRole,
  CreditTransferStage,
  getCompanyBgColor,
  getStageTransferEnumVal,
  getTransferStageTagType,
} from '../../Definitions/InterfacesAndType/programme.definitions';
import './programmeTransferManagement.scss';
import '../Common/common.table.scss';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import TransferActionModel from '../../Components/Models/TransferActionModel';
import { ProgrammeTransfer } from '../../Casl/entities/ProgrammeTransfer';
import * as Icon from 'react-bootstrap-icons';
import { TooltipColor } from '../Common/role.color.constants';
import { creditUnit } from '../Common/configs';

type CompanyInfo = {
  name: string;
  credit: number;
};

type PopupInfo = {
  title: string;
  icon: any;
  actionBtnText: string;
  okAction: any;
  type: 'primary' | 'danger';
};

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { userInfoState } = useUserContext();
  const { i18n, t } = useTranslation(['common', 'creditTransfer', 'programme']);

  const statusOptions = Object.keys(CreditTransferStage).map((k, index) => ({
    label: Object.values(CreditTransferStage)[index],
    value: k,
  }));

  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions.map((e) => e.value));
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(true);

  const { post } = useConnection();
  const [totalProgramme, setTotalProgramme] = useState<number>();
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
  const [companiesInfo, setCompaniesInfo] = useState<CompanyInfo[]>();
  const [totalComCredits, setTotalComCredits] = useState<number>(0);
  const [companyIdsVal, setCompanyIdsVal] = useState<number[]>();
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
    console.log(checkedValues);

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

  const getAllTransfers = async () => {
    setLoading(true);
    const filter: any[] = [];
    if (statusFilter) {
      filter.push(statusFilter);
    }
    if (search && search !== '') {
      filter.push({
        key: 'programmeTitle',
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
        key: 'requestId',
        order: 'DESC',
      };
    }

    try {
      const response: any = await post('national/programme/transferQuery', {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        sort: sort,
      });

      console.log(response);
      setTableData(response.data);
      setTotalProgramme(response.response.data.total);
      setLoading(false);
    } catch (error: any) {
      console.log('Error in getting programme transfers', error);
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
    getAllTransfers();
  }, [currentPage, pageSize, statusFilter, sortField, sortOrder, search]);

  const handleRequestOk = async (reqId: number, remarks: string, endpoint: string) => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/' + endpoint, {
        requestId: reqId,
        comment: remarks,
      });
      console.log(response);
      message.open({
        type: 'success',
        content: response.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
      getAllTransfers();
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

  const actionMenu = (record: any) => {
    if (record.status === 'Pending') {
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
                    handleRequestOk(requestId, comment, 'transferCancel'),
                  type: 'danger',
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
      ) : !record.isRetirement && record.fromCompanyId === userInfoState?.companyId ? (
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
                  title: t('creditTransfer:acceptTitle'),
                  icon: <Icon.ClipboardCheck />,
                  actionBtnText: t('creditTransfer:proceed'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(requestId, comment, 'transferApprove'),
                  type: 'primary',
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
                    handleRequestOk(requestId, comment, 'transferReject'),
                  type: 'danger',
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
      ) : record.isRetirement && userInfoState?.companyRole === CompanyRole.GOVERNMENT ? (
        <List
          className="action-menu"
          size="small"
          dataSource={[
            {
              text: t('creditTransfer:recognise'),
              icon: <Icon.Save />,
              style: 'color-primary',
              click: () => {
                showModalOnAction(record, {
                  title: t('creditTransfer:recogniseTitle'),
                  icon: <Icon.Save />,
                  actionBtnText: t('creditTransfer:recognise'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(requestId, comment, 'transferApprove'),
                  type: 'primary',
                });
              },
            },
            {
              text: t('creditTransfer:notrecognise'),
              icon: <Icon.XOctagon />,
              style: 'color-error',
              click: () => {
                showModalOnAction(record, {
                  title: t('creditTransfer:notRecogniseTitle'),
                  icon: <Icon.XOctagon />,
                  actionBtnText: t('creditTransfer:notrecognise'),
                  okAction: (requestId: any, comment: any) =>
                    handleRequestOk(requestId, comment, 'transferReject'),
                  type: 'danger',
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
      title: t('creditTransfer:requestID'),
      dataIndex: 'requestId',
      key: 'requestId',
      sorter: true,
    },
    {
      title: t('creditTransfer:date'),
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
      title: t('creditTransfer:pName'),
      dataIndex: 'programmeTitle',
      key: 'programmeTitle',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('creditTransfer:sector'),
      dataIndex: 'programmeSector',
      key: 'programmeSector',
      sorter: true,
      align: 'left' as const,
    },
    {
      title: t('creditTransfer:certifier'),
      dataIndex: 'certifier',
      key: 'certifier',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.certifier &&
              itemObj.certifier.map((v: any, i: any) => {
                return <ProfileIcon icon={v.logo} bg="rgba(128, 255, 0, 0.12)" name={v.name} />;
              })}
          </div>
        );
      },
    },
    {
      title: t('creditTransfer:initiator'),
      key: 'initiatorCompanyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.requester.map((v: any, i: any) => {
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
      title: t('creditTransfer:cSender'),
      key: 'fromCompanyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.sender.map((v: any, i: any) => {
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
      title: t('creditTransfer:cReceiver'),
      dataIndex: 'toCompanyId',
      key: 'toCompanyId',
      sorter: true,
      align: 'left' as const,
      render: (item: any, itemObj: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {itemObj.receiver.map((v: any, i: any) => {
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
      title: t('creditTransfer:cRequested') + ` (${creditUnit})`,
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span className="clickable">{item}</span>;
      },
    },
    {
      title: t('creditTransfer:cBalance') + ` (${creditUnit})`,
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      sorter: true,
      align: 'left' as const,
      render: (item: any) => {
        return <span>{item}</span>;
      },
    },
    {
      title: t('programme:status'),
      key: 'currentStage',
      sorter: true,
      align: 'center' as const,
      render: (item: any, Obj: any) => {
        return (
          <Tag className="clickable" color={getTransferStageTagType(Obj.status, Obj)}>
            {getStageTransferEnumVal(Obj.status, Obj)}
          </Tag>
        );
      },
    },
    {
      align: 'right' as const,
      render: (_: any, record: any) => {
        const menu = actionMenu(record);
        return menu ? (
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
      // render: () => {
      //   return (
      //     <div className="clickable">
      //       <MoreOutlined style={{ fontSize: '20px' }} />
      //     </div>
      //   );
      // },
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
    console.log(pag, sorter);
    setSortOrder(
      sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined
    );
    setSortField(sorter.columnKey);
    // setCurrentPage(1);
  };

  // const handleOk = (val: any) => {
  //   console.log(val);
  //   selectedReqId !== undefined && rejectTransfer(selectedReqId, val.remarks);
  //   formModal.resetFields();
  //   setSelectedReqId(undefined);
  // };

  // const handleCancel = () => {
  //   setRejectModalVisible(false);
  //   formModal.resetFields();
  //   setSelectedReqId(undefined);
  // };

  // const handleCancelOk = (val: any) => {
  //   console.log(val);
  //   selectedReqId !== undefined && cancelRequest(selectedReqId, val.remarks);
  //   formModal.resetFields();
  //   setCancelModalVisible(false);
  // };

  // const handleCancelCancel = () => {
  //   setSelectedReqId(undefined);
  //   formModal.resetFields();
  //   setCancelModalVisible(false);
  // };

  // const handleAcceptOk = (val: any) => {
  //   const arr = [];
  //   for (const key in val) {
  //     if (key.startsWith('credits') && val[key] !== undefined) {
  //       arr.push(parseInt(val[key]));
  //     } else if (key.startsWith('credits') && val[key] === undefined) {
  //       arr.push(0);
  //     }
  //   }
  //   const sum = arr.reduce((a, b) => a + b, 0);
  //   if (sum === creditAmount) {
  //     acceptRequestApi(arr, val.remarksApprove);
  //     formModal.resetFields();
  //     setAcceptModalVisible(false);
  //   } else {
  //     message.open({
  //       type: 'error',
  //       content: 'Sum of credits should be equal to total requested credits',
  //       duration: 3,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   }
  // };

  // const handleAcceptCancel = () => {
  //   setSelectedReqId(undefined);
  //   formModal.resetFields();
  //   setAcceptModalVisible(false);
  // };

  return (
    <div className="credit-transfer-management content-container">
      <div className="title-bar">
        <div className="body-title">{t('creditTransfer:viewCreditsTransfers')}</div>
        <div className="body-sub-title">{t('creditTransfer:desc')}</div>
      </div>
      <div className="content-card">
        <Row>
          <Col lg={{ span: 16 }} md={{ span: 16 }}>
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
          <Col lg={{ span: 8 }} md={{ span: 8 }}>
            <div className="filter-section">
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
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={tableData.length === 0 ? t('creditTransfer:noTransfer') : null}
                    />
                  ),
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
      {popupInfo && selectedReq && (
        <TransferActionModel
          transfer={selectedReq!}
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
        />
      )}
      {/* <Modal
        centered
        title=""
        okText="REJECT"
        open={rejectModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="credit-transfer-modal-container">
          <div className="icon-credit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              fill="currentColor"
              className="bi bi-envelope-slash"
              viewBox="0 0 16 16"
              color="#FF4C51"
            >
              <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z" />
              <path d="M14.975 10.025a3.5 3.5 0 1 0-4.95 4.95 3.5 3.5 0 0 0 4.95-4.95Zm-4.243.707a2.501 2.501 0 0 1 3.147-.318l-3.465 3.465a2.501 2.501 0 0 1 .318-3.147Zm.39 3.854 3.464-3.465a2.501 2.501 0 0 1-3.465 3.465Z" />
            </svg>
          </div>
          <div className="credit-transfer-details">
            <div className="content-credit-transfer">
              Are you sure you want to reject this project?
            </div>
            <div className="sub-content-credit-transfer">You can’t undo this action</div>
          </div>
          <div className="remarks-credit-transfer">
            <Form
              name="modal-details"
              className="modal-form"
              layout={'vertical'}
              requiredMark={true}
              form={formModal}
              onFinish={handleOk}
            >
              <Row>
                <Col offset={1} span={22}>
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
                </Col>
              </Row>
              <Form.Item>
                <div className="modal-credit-transfer-btns">
                  <div className="center width-60">
                    <Button onClick={handleCancel}>CANCEL</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      REJECT
                    </Button>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Modal>
      <Modal
        centered
        title=""
        okText="CANCEL"
        open={cancelModalVisible}
        onOk={handleCancelOk}
        onCancel={handleCancelCancel}
        footer={null}
      >
        <div className="credit-transfer-modal-container">
          <div className="icon-credit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              color="#FF4C51"
              width="100"
              height="100"
              fill="currentColor"
              className="bi bi-clipboard-x"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708z"
              />
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
            </svg>
          </div>
          <div className="credit-transfer-details">
            <div className="content-credit-transfer">
              Are you sure you want to cancel this request?
            </div>
            <div className="sub-content-credit-transfer">You can’t undo this action</div>
          </div>
          <div className="remarks-credit-transfer">
            <Form
              name="modal-details"
              className="modal-form"
              layout={'vertical'}
              requiredMark={true}
              form={formModal}
              onFinish={handleCancelOk}
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
                <div className="modal-credit-transfer-btns">
                  <div className="center width-60">
                    <Button onClick={handleCancelCancel}>CANCEL</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      CANCEL
                    </Button>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Modal>
      <Modal
        centered
        title=""
        okText="APPROVE"
        open={acceptModalVisible}
        onOk={handleAcceptOk}
        onCancel={handleAcceptCancel}
        footer={null}
      >
        <div className="credit-transfer-modal-container">
          <div className="icon-credit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="140"
              height="140"
              fill="currentColor"
              className="bi bi-hand-thumbs-up"
              viewBox="0 0 16 16"
              color="#16B1FF"
            >
              <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 0 1-.121.416c-.165.288-.503.56-1.066.56z" />
            </svg>
          </div>
          <div className="credit-transfer-details">
            <div className="content-credit-transfer">Accept Transfer Request</div>
          </div>
          <div className="remarks-credit-transfer">
            <Form
              name="modal-details"
              className="modal-form"
              layout={'vertical'}
              requiredMark={true}
              form={formModal}
              onFinish={handleAcceptOk}
            >
              {companiesInfo?.length !== 0 &&
                !loading &&
                companiesInfo?.map((v: any, i: any) => {
                  return (
                    <Row>
                      <Col offset={1} span={8}>
                        <Form.Item className="remarks-label" name="companyName">
                          {v.name}
                        </Form.Item>
                      </Col>
                      <Col offset={1} span={5}>
                        <Form.Item
                          className="remarks-label"
                          name={'credits' + i}
                          rules={[
                            {
                              pattern: new RegExp(/^[+]?([.]\d+|\d+[.]?\d*)$/g),
                              message: 'Credit Should be a positive number',
                            },
                            ({ getFieldValue }) => ({
                              validator(rule, value) {
                                if (getFieldValue('credits' + i) > v.credit) {
                                  // eslint-disable-next-line prefer-promise-reject-errors
                                  return Promise.reject(
                                    'Credit amount should not be greater than company credit'
                                  );
                                } else if (getFieldValue('credits' + i) > creditAmount) {
                                  // eslint-disable-next-line prefer-promise-reject-errors
                                  return Promise.reject(
                                    'Credit amount should not be greater than requested credit Amount'
                                  );
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <Input placeholder="" />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <div
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                          }}
                        >
                          <span>/</span>
                        </div>
                      </Col>
                      <Col span={4}>
                        <Form.Item className="remarks-label" name="totalCredit">
                          <Input placeholder={v.credit} disabled />
                        </Form.Item>
                      </Col>
                    </Row>
                  );
                })}
              <Row>
                <Col offset={1} span={8}>
                  <Form.Item className="remarks-label" name="companyName">
                    Requested Amount
                  </Form.Item>
                </Col>
                <Col offset={1} span={5}>
                  <Form.Item className="remarks-label" name="totalRequest">
                    <Input placeholder={creditAmount.toString()} disabled />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <div
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      display: 'flex',
                    }}
                  >
                    <span>/</span>
                  </div>
                </Col>
                <Col span={4}>
                  <Form.Item className="remarks-label" name="totalCredit">
                    <Input placeholder={parseInt(totalComCredits.toString()).toString()} disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col offset={1} span={22}>
                  <Form.Item
                    className="remarks-label"
                    label="Remarks"
                    name="remarksApprove"
                    rules={[
                      {
                        required: true,
                        message: 'Remarks is required!',
                      },
                    ]}
                  >
                    <Input.TextArea placeholder="" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <div className="modal-credit-transfer-btns">
                  <div className="center width-60">
                    <Button onClick={handleAcceptCancel}>CANCEL</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      ACCEPT
                    </Button>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Modal> */}
    </div>
  );
};

export default CreditTransfer;
