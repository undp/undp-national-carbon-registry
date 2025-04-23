/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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
} from "antd";
import { EllipsisOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../../Config/apiConfig";
import { CreditBalanceInterface } from "../Interfaces/creditBalance.interface";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import { IssuedOrReceivedOptions } from "../Enums/creditEventEnum";
import { CreditActionType } from "../Enums/creditActionType.enum";
import { CreditActionModal } from "./creditActionModal";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { HttpStatusCode } from "axios";
import { ActionResponseModal } from "../../../Components/Models/actionResponseModal";
import { ActionResponseType } from "../../../Definitions/Enums/actionResponse.enum";
import * as Icon from "react-bootstrap-icons";
import { CreditRetirementProceedAction } from "../Enums/creditRetirementProceedType.enum";
import { CreditRetirementTypeEmnum } from "../Enums/creditRetirementType.enum";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { Role } from "../../../Definitions/Enums/role.enum";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";

const { Search } = Input;

enum CrediBalanceColumns {
  ORGANIZATION_NAME = "organizationName",
  PROJECT_NAME = "projectName",
  SERIAL_NO = "serialNo",
  ISSUE_OR_RECEIVED = "issueOrReceived",
  CREDITS = "credits",
  ACTION = "action",
  DATE = "date",
}

export const getIssuedReceivedTagColor = (status: IssuedOrReceivedOptions) => {
  switch (status) {
    case IssuedOrReceivedOptions.ISSUED:
      return "processing";
    case IssuedOrReceivedOptions.RECEIVED:
      return "success";
    default:
      return "default";
  }
};

export const CreditBalanceTableComponent = (props: any) => {
  const { t } = props;

  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const isInitialRender = useRef(false);
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CreditBalanceInterface[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAllBox, setCheckAllBox] = useState<boolean>(true);
  const checkBoxMenu = Object.keys(IssuedOrReceivedOptions).map((k, index) => ({
    label: t(Object.values(IssuedOrReceivedOptions)[index]),
    value: Object.values(IssuedOrReceivedOptions)[index],
  }));
  const [checkBoxOptions, setCheckBoxOptions] = useState<any[]>(
    checkBoxMenu.map((e) => e.value)
  );
  const [modalActionVisible, setModalActionVisible] = useState<boolean>(false);
  const [modalActionLoading, setModalActionLoading] = useState<boolean>(false);
  const [modalActionData, setModalActionData] = useState<{
    icon: any;
    title: string;
    type: CreditActionType;
    actionBtnText?: string;
    remarkRequired: boolean;
    data: CreditBalanceInterface;
    proceedAction: CreditRetirementProceedAction;
  }>();
  const [modalResponseVisible, setModalResponseVisible] =
    useState<boolean>(false);
  const [modalResponseData, setModalResponseData] = useState<{
    type: ActionResponseType;
    icon: any;
    title: string;
    buttonText: string;
  }>();
  const getQueryData = async () => {
    setLoading(true);

    const filterAnd: any[] = [];
    const filterOr: any[] = [];

    if (checkBoxOptions) {
      filterAnd.push({
        key: "type",
        operation: "in",
        value: checkBoxOptions,
      });
    }

    if (search && search !== "") {
      filterOr.push({
        key: "receiver.name",
        operation: "like",
        value: `%${search}%`,
      });
      filterOr.push({
        key: "project.title",
        operation: "like",
        value: `%${search}%`,
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
        key: "createdDate",
        order: "DESC",
      };
    }

    try {
      const response: any = await post(API_PATHS.CREDIT_BALANCE_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd: filterAnd,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      setTableData(response?.data ? response.data : []);
      setTotalProgramme(
        response.response?.data?.total ? response.response?.data?.total : 0
      );
      isInitialRender.current = true;
    } catch (error: any) {
      console.log("Error in getting Credit Balances", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const actionMenu = (record: CreditBalanceInterface) => {
    return (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t("transfer"),
            icon: (
              <Icon.ArrowLeftRight color={COLOR_CONFIGS.PRIMARY_THEME_COLOR} />
            ),
            click: () => {
              setModalActionData({
                icon: (
                  <Icon.BoxArrowRight
                    color={COLOR_CONFIGS.PRIMARY_THEME_COLOR}
                  />
                ),
                title: t("tranferCredit"),
                type: CreditActionType.TRANSFER,
                actionBtnText: t("transfer"),
                remarkRequired: false,
                proceedAction: CreditRetirementProceedAction.ACCEPT,
                data: record,
              });
              setModalActionVisible(true);
            },
          },
          {
            text: t("retire"),
            icon: <Icon.ClockHistory color="#FF4D4F" />,
            click: () => {
              setModalActionData({
                icon: (
                  <Icon.BoxArrowDown
                    color={COLOR_CONFIGS.PRIMARY_THEME_COLOR}
                  />
                ),
                title: t("areYouWantToRetireCredit"),
                type: CreditActionType.RETIREMENT,
                actionBtnText: t("retire"),
                remarkRequired: false,
                proceedAction: CreditRetirementProceedAction.ACCEPT,
                data: record,
              });
              setModalActionVisible(true);
            },
          },
        ]}
        renderItem={(item: any) => (
          <List.Item onClick={item.click}>
            <Typography.Text className="action-icon color-primary">
              {item.icon}
            </Typography.Text>
            <span>{item.text}</span>
          </List.Item>
        )}
      />
    );
  };

  const columns = [
    {
      title: t(CrediBalanceColumns.ORGANIZATION_NAME),
      key: "receiver.name",
      sorter: true,
      align: "left" as const,
      render: (record: CreditBalanceInterface) => {
        const elements = (
          <Row>
            <ProfileIcon
              icon={record.receiverLogo}
              bg={"rgba(185, 226, 244, 0.56)"}
              name={record.receiverName}
            />
            <span style={{ marginTop: "6px" }}>{record.receiverName}</span>
          </Row>
        );
        return <div className="org-list">{elements}</div>;
      },
    },
    {
      title: t(CrediBalanceColumns.PROJECT_NAME),
      key: "project.title",
      sorter: true,
      align: "left" as const,
      render: (record: CreditBalanceInterface) => {
        return <span>{record?.projectName}</span>;
      },
    },
    {
      title: t(CrediBalanceColumns.SERIAL_NO),
      key: CrediBalanceColumns.SERIAL_NO,
      align: "left" as const,
      render: (record: CreditBalanceInterface) => {
        return <span>{record?.serialNumber}</span>;
      },
    },
    {
      title: t(CrediBalanceColumns.DATE),
      key: "createdDate",
      sorter: true,
      align: "left" as const,
      render: (item: CreditBalanceInterface) => {
        return (
          <span>
            {moment(parseInt(String(item?.createdDate))).format(
              "YYYY-MM-DD HH:mm:ss"
            )}
          </span>
        );
      },
    },
    ...(userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER
      ? [
          {
            title: t(CrediBalanceColumns.ISSUE_OR_RECEIVED),
            key: CrediBalanceColumns.ISSUE_OR_RECEIVED,
            align: "center" as const,
            render: (record: CreditBalanceInterface) => {
              return (
                <Tag color={getIssuedReceivedTagColor(record?.type)}>
                  {t(record?.type)}
                </Tag>
              );
            },
          },
        ]
      : []),
    {
      title: t(CrediBalanceColumns.CREDITS),
      key: "creditAmount",
      sorter: true,
      align: "left" as const,
      render: (record: CreditBalanceInterface) => {
        return (
          <span style={{ marginLeft: "20px" }}>
            {addCommSep(String(record?.creditAmount))}
          </span>
        );
      },
    },
    ...(userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole === Role.Admin
      ? [
          {
            title: t(""),
            width: 6,
            align: "right" as const,
            key: CrediBalanceColumns.ACTION,
            render: (record: any) => {
              const menu = actionMenu(record);
              return (
                menu && (
                  <Popover
                    placement="bottomRight"
                    content={menu}
                    trigger="click"
                  >
                    <EllipsisOutlined
                      rotate={90}
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        cursor: "pointer",
                      }}
                    />
                  </Popover>
                )
              );
            },
          },
        ]
      : []),
  ];

  const onSearch = async (value: string) => {
    if (value) {
      setSearch(value.toLowerCase());
    } else {
      setSearch("");
    }
  };

  const onStatusQuery = async (checkedValues: CheckboxValueType[]) => {
    setCheckBoxOptions(checkedValues as string[]);
    setIndeterminate(
      !!checkedValues.length && checkedValues.length < checkBoxMenu.length
    );
    setCheckAllBox(checkedValues.length === checkBoxMenu.length);
  };

  const onCheckBoxesChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    setCheckAllBox(checked);
    setIndeterminate(false);
    if (checked) {
      const allValues = Object.values(IssuedOrReceivedOptions);
      setCheckBoxOptions(allValues);
    } else {
      setCheckBoxOptions([]);
    }
  };

  const onPaginationChange: PaginationProps["onChange"] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onHandleTableChange = (
    _pagination: any,
    _filters: any,
    sorter: any
  ) => {
    setSortOrder(
      sorter.order === "ascend"
        ? "ASC"
        : sorter.order === "descend"
        ? "DESC"
        : undefined
    );
    setSortField(sorter.columnKey);
  };

  useEffect(() => {
    getQueryData();
    isInitialRender.current = true;
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      getQueryData();
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (isInitialRender.current) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        getQueryData();
      }
    }
  }, [
    sortField,
    sortOrder,
    search,
    checkBoxOptions,
    modalActionVisible,
    modalResponseVisible,
  ]);

  const onFinishAction = async (
    reciveParty: any,
    blockId: any,
    creditAmount: number,
    remark?: string,
    retirementType?: CreditRetirementTypeEmnum
  ) => {
    try {
      let response: any;
      setModalActionLoading(true);

      if (modalActionData?.type === CreditActionType.TRANSFER) {
        response = await post(API_PATHS.CREDIT_TRANSFER_REQUEST, {
          receiverOrgId: reciveParty,
          blockId: blockId,
          amount: Number(creditAmount),
          remarks: remark,
        });
      } else {
        response = await post(API_PATHS.CREDIT_RETIREMENT_REQUEST, {
          blockId: blockId,
          remarks: remark,
          retirementType: retirementType,
          ...(retirementType ===
          CreditRetirementTypeEmnum.CROSS_BORDER_TRANSACTIONS
            ? {
                country: reciveParty.country,
                organizationName: reciveParty.organization,
              }
            : {}),

          amount: Number(creditAmount),
        });
      }
      if (response.status === HttpStatusCode.Created) {
        setModalResponseData({
          type: ActionResponseType.SUCCESS,
          icon: (
            <Icon.CheckCircle color={COLOR_CONFIGS.SUCCESS_RESPONSE_COLOR} />
          ),
          title: t(
            modalActionData?.type === CreditActionType.TRANSFER
              ? "creditTransferInitiated"
              : "creditRetirementSubmitted"
          ),
          buttonText: t("okay"),
        });
      } else {
        setModalResponseData({
          type: ActionResponseType.FAILED,
          icon: (
            <ExclamationCircleOutlined
              color={COLOR_CONFIGS.FAILED_RESPONSE_COLOR}
            />
          ),
          title: t(
            modalActionData?.type === CreditActionType.TRANSFER
              ? "creditTransferInitiatedFailed"
              : "creditRetirementSubmittedFailed"
          ),
          buttonText: t("okay"),
        });
      }
    } catch (error: any) {
      message.error(error.message || t("somethingWentWrong"));
      setModalResponseData({
        type: ActionResponseType.FAILED,
        icon: (
          <Icon.ExclamationCircle color={COLOR_CONFIGS.FAILED_RESPONSE_COLOR} />
        ),
        title: t("somethingWentWrong"),
        buttonText: t("okay"),
      });
    } finally {
      setModalResponseVisible(true);
      setModalActionLoading(false);
      setModalActionVisible(false);
    }
  };

  return (
    <div className="content-card">
      <Row
        justify={
          userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER
            ? "space-between"
            : "end"
        }
        className="table-actions-section"
      >
        {userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER && (
          <Col lg={{ span: 13 }} md={{ span: 12 }}>
            <div className="action-bar">
              <Checkbox
                className="all-check"
                disabled={loading}
                indeterminate={indeterminate}
                onChange={onCheckBoxesChange}
                checked={checkAllBox}
                defaultChecked={true}
              >
                {t("all")}
              </Checkbox>
              <Checkbox.Group
                disabled={loading}
                options={checkBoxMenu}
                defaultValue={checkBoxMenu.map((e) => e.value)}
                value={checkBoxOptions}
                onChange={onStatusQuery}
              />
            </div>
          </Col>
        )}
        <Col lg={{ span: 11 }} md={{ span: 12 }}>
          <div className="filter-section">
            <div className="search-bar">
              <Search
                onPressEnter={(e) =>
                  onSearch((e.target as HTMLInputElement).value)
                }
                placeholder={`${t("searchByProjectOrOrg")}`}
                allowClear
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 285 }}
              />
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <div className="credit-table-container">
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
                onChange: onPaginationChange,
              }}
              // eslint-disable-next-line no-unused-vars
              onChange={onHandleTableChange}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={tableData.length === 0 ? t("noCredits") : null}
                  />
                ),
              }}
            />
          </div>
        </Col>
      </Row>
      <CreditActionModal
        onFinish={onFinishAction}
        onCancel={() => setModalActionVisible(false)}
        t={t}
        actionBtnText={modalActionData?.actionBtnText}
        openModal={modalActionVisible}
        loading={modalActionLoading}
        icon={modalActionData?.icon}
        title={modalActionData?.title}
        isProceed={false}
        type={modalActionData?.type}
        remarkRequired={modalActionData?.remarkRequired}
        proceedAction={modalActionData?.proceedAction}
        data={modalActionData?.data}
      />
      <ActionResponseModal
        type={modalResponseData?.type}
        icon={modalResponseData?.icon}
        title={modalResponseData?.title}
        buttonText={modalResponseData?.buttonText || ""}
        onCancel={() => {
          setModalResponseVisible(false);
        }}
        openModal={modalResponseVisible}
      />
    </div>
  );
};
