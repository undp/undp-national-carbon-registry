/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  PaginationProps,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  TabsProps,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
// import { EditableCell } from '../Common/AntComponents/antTableComponents';
import './ndcDetailsComponent.scss';
// import { CompanyRole, Role, addSpaces } from '../../Definitions';
import {
  DateRange,
  NdcDetailsActionType,
  NdcDetail,
  NdcDetailsActionStatus,
  Period,
  getNdcActionStatusTagType,
  PopupInfo,
} from '../../Definitions/Definitions/ndcDetails.definitions';
// import { TooltipColor } from '../../Styles';
import { EllipsisOutlined, LockOutlined } from '@ant-design/icons';
import * as Icon from 'react-bootstrap-icons';
import UserActionConfirmationModel from '../Models/userActionConfirmationModel';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { Role } from '../../Definitions/Enums/role.enum';
import { TooltipColor } from '../../Styles/role.color.constants';
import { addSpaces } from '../../Definitions/Definitions/programme.definitions';
import { EditableCell } from '../AntComponents/antTableComponents';
// import { useUserContext, useConnection } from '../../Context';

export const NdcDetailsComponent = (props: any) => {
  const { t } = props;
  const { RangePicker } = DatePicker;
  const [ndcActionsList, setNdcActionsList] = useState([] as NdcDetail[]);
  const [loading, setLoading] = useState<boolean>(false);
  const [periodItems, setPeriodItems] = useState([] as Period[]);
  const [selectedPeriod, setSelectedPeriod] = useState({} as Period);
  const selectedDateRangeRef = useRef({} as DateRange | null);
  const [tableKey, setTableKey] = useState(0);
  const { get, post, put } = useConnection();
  const [ministryOrgList, setMinistryOrgList] = useState([] as any);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [nextAvailableActionId, setNextAvailableActionId] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState([] as any[]);
  const [subNdcActionsForPeriod, setSubNdcActionsForPeriod] = useState([] as NdcDetail[]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const isEditing = (record: NdcDetail) => record.id === editingKey;

  const isMainActionInEditMode = () => {
    const unsavedMainActions = ndcMainDetailsForPeriod.filter(
      (item: NdcDetail) =>
        item.status === NdcDetailsActionStatus.New &&
        item.actionType === NdcDetailsActionType.MainAction
    );

    return unsavedMainActions.length > 0 ? true : false;
  };

  const { userInfoState } = useUserContext();

  useEffect(() => {
    if (expandedRowKeys && expandedRowKeys.length > 0) {
      const expandedKey = expandedRowKeys[0];
      setNdcSubActionsForMainAction(expandedKey);
    }
  }, ndcActionsList);

  const loginMinistry: any =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT
      ? process.env.REACT_APP_GOVERNMENT_MINISTRY
        ? process.env.REACT_APP_GOVERNMENT_MINISTRY
        : 'Ministry Of Environment'
      : userInfoState?.companyRole === CompanyRole.MINISTRY
      ? userInfoState?.companyName
      : undefined;

  const isGovernmentUser =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
    userInfoState?.userRole !== Role.ViewOnly;

  const isMainNdcActionsEditable =
    selectedPeriod &&
    !selectedPeriod.finalized &&
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
    userInfoState?.userRole !== Role.ViewOnly;

  const isSubNdcActionsEditable = (record: NdcDetail) => {
    return (
      selectedPeriod &&
      !selectedPeriod.finalized &&
      record.status !== NdcDetailsActionStatus.Approved &&
      (userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
        (userInfoState?.companyRole === CompanyRole.MINISTRY &&
          userInfoState?.companyName === record.ministryName)) &&
      userInfoState?.userRole !== Role.ViewOnly
    );
  };

  const checkSubNdcActionCreatePermission = () => {
    return (
      selectedPeriod &&
      !selectedPeriod.finalized &&
      (userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
        userInfoState?.companyRole === CompanyRole.MINISTRY) &&
      userInfoState?.userRole !== Role.ViewOnly
    );
  };

  const isNdcActionEditable = (record: NdcDetail) => {
    if (record.actionType === NdcDetailsActionType.MainAction) {
      return isMainNdcActionsEditable;
    } else if (record.actionType === NdcDetailsActionType.SubAction) {
      return isSubNdcActionsEditable(record);
    }
  };

  const ndcMainDetailsForPeriod =
    selectedPeriod && selectedPeriod.key !== 'add_new'
      ? ndcActionsList.filter((ndcDetail: NdcDetail) => {
          return (
            ndcDetail.periodId === parseInt(selectedPeriod.key) &&
            ndcDetail.actionType === NdcDetailsActionType.MainAction
          );
        })
      : [];

  const setNdcSubActionsForMainAction = (mainActionId: number) => {
    let subNdcDetails = ndcActionsList.filter((ndcDetail: NdcDetail) => {
      return (
        ndcDetail.parentActionId === mainActionId &&
        ndcDetail.actionType === NdcDetailsActionType.SubAction
      );
    });

    const emptySubNdcRow = {
      id: nextAvailableActionId,
      actionType: NdcDetailsActionType.SubAction,
      nationalPlanObjective: '',
      kpi: '',
      kpiUnit: '',
      ministryName: loginMinistry,
      status: NdcDetailsActionStatus.New,
      parentActionId: mainActionId,
    };

    if (checkSubNdcActionCreatePermission()) {
      subNdcDetails = [...subNdcDetails, emptySubNdcRow];
      setEditingKey(nextAvailableActionId);
      setNextAvailableActionId((value) => value + 1);

      form.setFieldsValue({
        nationalPlanObjective: '',
        kpi: '',
        kpiUnit: '',
      });
    }

    setSubNdcActionsForPeriod(subNdcDetails);
  };

  const inRange = (num: number, min: number, max: number) => num >= min && num <= max;

  const ClearEditMode = () => {
    const unsavedMainActions = ndcActionsList.filter(
      (item: NdcDetail) =>
        item.status === NdcDetailsActionStatus.New &&
        item.actionType === NdcDetailsActionType.MainAction
    );

    if (unsavedMainActions && unsavedMainActions.length) {
      const updatedActions = ndcActionsList.filter(
        (item: NdcDetail) => !unsavedMainActions.includes(item)
      );
      setNdcActionsList(updatedActions);
    }
    setEditingKey(null);
  };

  const handleSave = async (row: NdcDetail) => {
    try {
      let updatedFields;
      try {
        updatedFields = (await form.validateFields()) as NdcDetail;
      } catch (exception) {
        return;
      }

      if (!updatedFields) {
        ClearEditMode();
        return;
      } else if (
        updatedFields.kpi === row.kpi &&
        updatedFields.kpiUnit === row.kpiUnit &&
        updatedFields.nationalPlanObjective === row.nationalPlanObjective
      ) {
        ClearEditMode();
        return;
      }

      const updatedItem = {
        ...row,
        ...updatedFields,
      };

      if (updatedItem.status === NdcDetailsActionStatus.New) {
        if (isGovernmentUser && updatedItem.actionType === NdcDetailsActionType.SubAction) {
          updatedItem.status = NdcDetailsActionStatus.Approved;
        } else {
          updatedItem.status = NdcDetailsActionStatus.Pending;
        }
        const response = await post('national/programme/addNdcDetailsAction', {
          ...updatedItem,
          kpi: parseFloat(updatedItem.kpi.toString()),
        });
      } else {
        updatedItem.status = NdcDetailsActionStatus.Pending;
        const response = await put('national/programme/updateNdcDetailsAction', {
          ...updatedItem,
          kpi: parseFloat(updatedItem.kpi.toString()),
        });
      }
      fetchNdcDetailActions();
      ClearEditMode();
    } catch (exception: any) {
      ClearEditMode();
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
  };

  const actionMenu = (record: NdcDetail) => {
    if (
      record.status === NdcDetailsActionStatus.Pending &&
      isGovernmentUser &&
      selectedPeriod &&
      !selectedPeriod.finalized
    ) {
      return (
        <List
          className="action-menu"
          size="small"
          dataSource={[
            {
              text: t('ndc:approve'),
              icon: <Icon.BoxArrowInDown />,
              style: 'color-primary',
              click: () => {
                setActionInfo({
                  action: 'Approve',
                  headerText: t('ndc:actionApproveTitle'),
                  type: 'primary',
                  icon: <Icon.BoxArrowInDown />,
                  recordId: record.id,
                });
                setOpenConfirmationModal(true);
              },
            },
            {
              text: t('ndc:reject'),
              icon: <Icon.XOctagon />,
              style: 'color-error',
              click: () => {
                setActionInfo({
                  action: 'Reject',
                  headerText: t('ndc:rejectApproveTitle'),
                  type: 'danger',
                  icon: <Icon.XOctagon />,
                  recordId: record.id,
                });
                setOpenConfirmationModal(true);
              },
            },
          ]}
          renderItem={(item: any) => (
            <List.Item onClick={item.click}>
              <Typography.Text className={`action-icon ${item.style}`}>{item.icon}</Typography.Text>
              <span>{item.text}</span>
            </List.Item>
          )}
        ></List>
      );
    } else {
      return null;
    }
  };

  const defaultColumns: any = [
    {
      title: t('ndc:ndcColumnsNationalPlanObj'),
      dataIndex: 'nationalPlanObjective',
      key: 'nationalPlanObjective',
      align: 'left' as const,
      width: 400,
      editable: true,
      render: (_: any, record: NdcDetail) => (
        <Space size="middle">
          {record.nationalPlanObjective ? (
            <Tooltip title={isNdcActionEditable(record) ? '' : t('ndc:ndcUnauthorisedMsg')}>
              <span>{record.nationalPlanObjective}</span>
            </Tooltip>
          ) : (
            <Input placeholder={t('ndc:nationalPlanObjectivePlaceHolder')} />
          )}
        </Space>
      ),
    },
    {
      title: t('ndc:ndcColumnsKpi'),
      dataIndex: 'kpi',
      key: 'kpi',
      align: 'left' as const,
      width: 100,
      editable: true,
      render: (_: any, record: NdcDetail) => (
        <Space size="middle">
          {record.kpi ? (
            <Tooltip title={isNdcActionEditable(record) ? '' : t('ndc:ndcUnauthorisedMsg')}>
              <span>{record.kpi}</span>
            </Tooltip>
          ) : (
            <Input placeholder={t('ndc:kpiPlaceHolder')} />
          )}
        </Space>
      ),
    },
    {
      title: t('ndc:ndcColumnsKpiUnit'),
      dataIndex: 'kpiUnit',
      key: 'kpiUnit',
      align: 'left' as const,
      width: 100,
      editable: true,
      render: (_: any, record: NdcDetail) => (
        <Space size="middle">
          {record.kpiUnit ? (
            <Tooltip title={isNdcActionEditable(record) ? '' : t('ndc:ndcUnauthorisedMsg')}>
              <span>{record.kpiUnit}</span>
            </Tooltip>
          ) : (
            <Input placeholder={t('ndc:kpiUnitPlaceHolder')} />
          )}
        </Space>
      ),
    },
    {
      title: t('ndc:ndcColumnsMinistry'),
      dataIndex: 'ministryName',
      key: 'ministryName',
      align: 'left' as const,
      width: 300,
      editable: false,
      render: (_: any, record: any) => (
        <Tooltip title={isSubNdcActionsEditable(record) ? '' : t('ndc:ndcUnauthorisedMsg')}>
          <Select
            disabled={!(isSubNdcActionsEditable(record) && isEditing(record))}
            defaultValue={record.ministryName ? record.ministryName : loginMinistry}
            style={{ width: 220 }}
            onChange={(value: any, option: any) => {
              record.ministryName = option.label;
              handleSave(record);
            }}
            options={ministryOrgList}
          />
        </Tooltip>
      ),
    },
    {
      title: t('ndc:ndcColumnsStatus'),
      dataIndex: 'status',
      key: 'status',
      align: 'left' as const,
      width: 200,
      editable: false,
      render: (_: any, record: any) => {
        const menu = actionMenu(record);
        return (
          <div onClick={(event: any) => event.stopPropagation()}>
            {record.actionType === NdcDetailsActionType.SubAction &&
            record.status !== NdcDetailsActionStatus.New ? (
              <Tooltip title={record.status} color={TooltipColor} key={TooltipColor}>
                <Tag className="clickable" color={getNdcActionStatusTagType(record.status)}>
                  {addSpaces(record.status)}
                </Tag>
              </Tooltip>
            ) : (
              ''
            )}
            {record.actionType === NdcDetailsActionType.SubAction && menu ? (
              <Popover placement="bottomRight" content={menu} trigger="click">
                <EllipsisOutlined
                  rotate={90}
                  style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                />
              </Popover>
            ) : (
              <span></span>
            )}
          </div>
        );
      },
    },
  ];

  const columns = defaultColumns.map((col: any) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: NdcDetail) => {
        return {
          record,
          editing: isEditing(record),
          dataIndex: col.dataIndex,
          title: col.title,
          onBlurHandler: (record: NdcDetail) => {
            if (isEditing(record)) {
              handleSave(record);
            }
          },
          t: t,
        };
      },
    };
  });

  async function onClickedAddNewNdcDetail() {
    if (selectedPeriod.key !== 'add_new') {
      form.setFieldsValue({
        nationalPlanObjective: '',
        kpi: '',
        kpiUnit: '',
      });
      const periodId: number = parseInt(selectedPeriod.key);
      const newData: NdcDetail = {
        id: nextAvailableActionId,
        actionType: NdcDetailsActionType.MainAction,
        nationalPlanObjective: '',
        kpi: '',
        kpiUnit: '',
        ministryName: loginMinistry,
        periodId: periodId,
        status: NdcDetailsActionStatus.New,
      };

      setEditingKey(nextAvailableActionId);

      setNextAvailableActionId((value) => value + 1);

      setNdcActionsList((ndcActionsList: NdcDetail[]) => [...ndcActionsList, newData]);
      setTableKey((key: any) => key + 1);
      if (ndcMainDetailsForPeriod.length + 1 > pageSize) {
        const lastPage = Math.ceil(ndcMainDetailsForPeriod.length / pageSize);
        setCurrentPage(lastPage);
      }
    }
  }

  const components = {
    body: {
      cell: EditableCell,
    },
  };

  const onClickedDeletePeriod = async () => {
    setActionInfo({
      action: 'Delete',
      headerText: t('ndc:periodDeleteConfirmTitle'),
      type: 'danger',
      icon: <Icon.XCircle />,
      recordId: selectedPeriod.key,
    });
    setOpenConfirmationModal(true);
  };

  const onClickedFinalizePeriod = async () => {
    if (ndcMainDetailsForPeriod.length === 0) {
      message.open({
        type: 'error',
        content: t('ndc:finalizeNdcEmptyErrorText'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      return;
    }

    let isPendingActionAvailable = false;

    ndcMainDetailsForPeriod.forEach((mainAction: NdcDetail) => {
      const pendingActions = ndcActionsList.filter((action: NdcDetail) => {
        return (
          action.status === NdcDetailsActionStatus.Pending &&
          action.actionType === NdcDetailsActionType.SubAction &&
          action.parentActionId === mainAction.id
        );
      });
      if (pendingActions && pendingActions.length > 0) {
        isPendingActionAvailable = true;
        return;
      }
    });

    if (isPendingActionAvailable) {
      message.open({
        type: 'error',
        content: t('ndc:finalizeErrorText'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } else {
      setActionInfo({
        action: 'Finalise',
        headerText: t('ndc:finalizeApproveTitle'),
        text: t('ndc:finalizeApproveSubTitle'),
        type: 'primary',
        icon: <Icon.Clipboard2Check />,
        recordId: selectedPeriod.key,
      });
      setOpenConfirmationModal(true);
    }
  };

  const onMainTableRowExpand = (expanded: any, record: any) => {
    const keys = [];
    if (expanded) {
      keys.push(record.id);
    }

    setExpandedRowKeys(keys);
    setNdcSubActionsForMainAction(record.id);
  };

  function addNewPeriodContent() {
    return (
      <div>
        <Row justify="start" align="middle" gutter={[16, 16]}>
          <Col flex="340px">
            <RangePicker
              disabledDate={(current: any) => moment(current).year() < 1900}
              onChange={onDateRangeChanged}
              picker="year"
            />
          </Col>
          <Col flex="auto">
            <Button type="primary" onClick={onAddNewPeriod} htmlType="submit" loading={loading}>
              {t('ndc:submit')}
            </Button>
          </Col>
        </Row>
      </div>
    );
  }

  const onChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  function mainNdcActionTableContent() {
    return (
      <div>
        <Row>
          <Col span={24}>
            <Form form={form} component={false}>
              <Table
                tableLayout="fixed"
                key={tableKey}
                className="common-table-class"
                rowKey="id"
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: ndcMainDetailsForPeriod.length,
                  showQuickJumper: true,
                  showSizeChanger: true,
                  onChange: onChange,
                }}
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                loading={loading}
                dataSource={ndcMainDetailsForPeriod}
                columns={columns}
                expandedRowKeys={expandedRowKeys}
                onExpand={onMainTableRowExpand}
                expandable={{
                  expandedRowRender: (record) => subNdcActionTableContent(record),
                  columnWidth: 40,
                }}
                onRow={(record: NdcDetail, rowIndex) => {
                  return {
                    onClick: (event: any) => {
                      if (record.id && isNdcActionEditable(record) && !isEditing(record)) {
                        form.setFieldsValue({ ...record });
                        setEditingKey(record.id);
                      }
                    },
                    onMouseLeave: () => {
                      if (isEditing(record)) {
                        handleSave(record);
                      }
                    },
                  };
                }}
                footer={() =>
                  isGovernmentUser &&
                  selectedPeriod &&
                  !selectedPeriod.finalized && (
                    <Row justify={'center'}>
                      <Button
                        className="btnAddNewMainAct"
                        disabled={isMainActionInEditMode()}
                        onClick={onClickedAddNewNdcDetail}
                        type="default"
                      >
                        {t('ndc:addNdcAction')}
                      </Button>
                    </Row>
                  )
                }
              />
            </Form>
          </Col>
        </Row>
        {isGovernmentUser && selectedPeriod && !selectedPeriod.finalized ? (
          <Row justify="end" className="ndc-button-row">
            {isMainActionInEditMode() ? (
              <>
                <Button className="mg-left-1" disabled>
                  {t('ndc:delete')}
                </Button>
                <Button className="mg-left-1" disabled>
                  {t('ndc:finalize')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="mg-left-1 btn-danger"
                  onClick={onClickedDeletePeriod}
                  htmlType="submit"
                  loading={loading}
                >
                  {t('ndc:delete')}
                </Button>
                <Button
                  className="mg-left-1"
                  type="primary"
                  onClick={onClickedFinalizePeriod}
                  htmlType="submit"
                  loading={loading}
                >
                  {t('ndc:finalize')}
                </Button>
              </>
            )}
          </Row>
        ) : (
          ''
        )}
      </div>
    );
  }

  function subNdcActionTableContent(record: any) {
    return (
      <Table
        tableLayout="fixed"
        rowKey="id"
        components={components}
        rowClassName={() => 'editable-row'}
        className="common-table-class"
        bordered
        dataSource={subNdcActionsForPeriod}
        loading={loading}
        onRow={(record: NdcDetail, rowIndex) => {
          return {
            onClick: (event: any) => {
              if (record.id && isNdcActionEditable(record) && !isEditing(record)) {
                form.setFieldsValue({ ...record });
                setEditingKey(record.id);
              }
            },
            onMouseLeave: () => {
              if (isEditing(record)) {
                handleSave(record);
              }
            },
          };
        }}
        columns={columns}
        showHeader={false}
        pagination={false}
      />
    );
  }

  const onAddNewPeriod = async () => {
    if (
      !selectedDateRangeRef ||
      !selectedDateRangeRef.current ||
      !selectedDateRangeRef.current.startYear ||
      !selectedDateRangeRef.current.endYear
    ) {
      message.open({
        type: 'error',
        content: t('ndc:invalidYearsSelected'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      return;
    }
    try {
      const periodItem = {
        startYear: selectedDateRangeRef.current.startYear,
        endYear: selectedDateRangeRef.current.endYear,
        finalized: false,
      };

      const existingIndex = periodItems.findIndex(
        (item: any) =>
          inRange(periodItem.startYear, item.startYear, item.endYear) ||
          inRange(periodItem.endYear, item.startYear, item.endYear)
      );

      if (existingIndex === -1) {
        const response = await post('national/programme/addNdcDetailsPeriod', {
          ...periodItem,
        });

        if (response && response.data) {
          const addedPeriodItem = response.data;
          const updatedPeriodItem = {
            ...addedPeriodItem,
            key: addedPeriodItem.id,
            label: `${addedPeriodItem.startYear}-${addedPeriodItem.endYear}`,
          };
          setPeriodItems((items: any) => [...items, updatedPeriodItem]);
          setSelectedPeriod(updatedPeriodItem);
          selectedDateRangeRef.current = null;
        }
      } else {
        message.open({
          type: 'error',
          content: t('ndc:rangeAlreadyExists'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
  };

  const onDateRangeChanged = (range: any) => {
    if (range) {
      const period = {
        startYear: Number(moment(range[0]).year()),
        endYear: Number(moment(range[1]).year()),
      };
      if (period.startYear === period.endYear) {
        message.open({
          type: 'error',
          content: t('ndc:sameStartEndDates'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      } else {
        selectedDateRangeRef.current = period;
      }
    } else {
      selectedDateRangeRef.current = {
        startYear: range,
        endYear: range,
      };
    }
  };

  const onTabChange = (key: string) => {
    const selectedPeriod = periodItems.find((item: any) => item.key === key);
    if (selectedPeriod) {
      setSelectedPeriod(selectedPeriod);
    }
  };

  const onActionConfirmed = async () => {
    setLoading(true);
    let actionResponse;
    try {
      if (actionInfo.action === 'Approve') {
        actionResponse = await post('national/programme/approveNdcDetailsAction', {
          id: actionInfo.recordId,
        });
      } else if (actionInfo.action === 'Reject') {
        actionResponse = await post('national/programme/rejectNdcDetailsAction', {
          id: actionInfo.recordId,
        });
      } else if (actionInfo.action === 'Finalise') {
        actionResponse = await post('national/programme/finalizeNdcDetailsPeriod', {
          id: selectedPeriod.key,
        });
      } else if (actionInfo.action === 'Delete') {
        actionResponse = await post('national/programme/deleteNdcDetailsPeriod', {
          id: selectedPeriod.key,
        });
      }
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
    if (actionResponse) {
      if (actionInfo.action === 'Delete') {
        message.open({
          type: 'success',
          content: t('ndc:deletePeriodSuccessMsg'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        fetchNdcDetailPeriods();
      } else if (actionInfo.action === 'Finalise') {
        message.open({
          type: 'success',
          content: t('ndc:finalizeSuccessMsg'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        fetchNdcDetailPeriods();
        setExpandedRowKeys([]);
        ClearEditMode();
      } else if (actionInfo.action === 'Approve') {
        message.open({
          type: 'success',
          content: t('ndc:approveSuccessMsg'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        fetchNdcDetailActions();
      } else if (actionInfo.action === 'Reject') {
        message.open({
          type: 'success',
          content: t('ndc:rejectSuccessMsg'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        fetchNdcDetailActions();
      }
    }
    setOpenConfirmationModal(false);
    setLoading(false);
  };

  const onActionCanceled = () => {
    setOpenConfirmationModal(false);
  };

  const fetchNdcDetailPeriods = async () => {
    setLoading(true);
    try {
      let periods = [];
      let addNewTab: Period = {
        key: 'add_new',
        label: 'Add New',
        startYear: 0,
        endYear: 0,
        finalized: false,
        deleted: false,
      };
      const response = await get('national/programme/queryNdcDetailsPeriod');
      if (response && response.data) {
        periods = response.data.map((period: any) => {
          return {
            ...period,
            key: period.id,
            label: period.finalized ? (
              <span>
                <LockOutlined /> {period.startYear}-{period.endYear}{' '}
              </span>
            ) : (
              `${period.startYear}-${period.endYear}`
            ),
          };
        });
      }
      if (isGovernmentUser) {
        periods.unshift(addNewTab);
      }

      setPeriodItems(periods);
      if (isGovernmentUser) {
        setSelectedPeriod(addNewTab);
      } else {
        setSelectedPeriod(periods[0]);
      }
      setLoading(false);
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNdcDetailActions = async () => {
    setLoading(true);
    try {
      const response = await get('national/programme/queryNdcDetailsAction');
      if (response && response.data) {
        const maxActionId = Math.max(...response.data.map((item: NdcDetail) => item.id));
        setNextAvailableActionId(maxActionId + 1);
        setNdcActionsList(response.data);
      }
      setLoading(false);
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const response = await get('national/organisation/getMinistries');
      if (response && response.data) {
        const ministryOrgDetails = response.data.map((value: any) => {
          return {
            value: value.company_companyId,
            label: value.company_name,
          };
        });
        setMinistryOrgList(ministryOrgDetails);
      }
      setLoading(false);
    } catch (exception: any) {
      message.open({
        type: 'error',
        content: exception.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNdcDetailPeriods();
    fetchNdcDetailActions();
    fetchMinistries();
  }, []);

  return (
    <div className="ndc-details content-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col span={20}>
            <div className="body-title">{t('ndc:ndcTitle')}</div>
          </Col>
        </Row>
      </div>
      <div>
        <Tabs
          centered={false}
          defaultActiveKey="1"
          items={periodItems}
          activeKey={selectedPeriod ? selectedPeriod.key : '1'}
          onChange={onTabChange}
        />
      </div>
      <div>
        {selectedPeriod
          ? selectedPeriod.key === 'add_new'
            ? addNewPeriodContent()
            : mainNdcActionTableContent()
          : ''}
      </div>
      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onActionConfirmed}
        onActionCanceled={onActionCanceled}
        openModal={openConfirmationModal}
        errorMsg=""
        loading={loading}
      />
    </div>
  );
};
