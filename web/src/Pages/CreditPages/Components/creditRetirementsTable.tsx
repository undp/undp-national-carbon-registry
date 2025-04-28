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
import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { UserTableDataType } from "../../../Definitions/Definitions/userManagement.definitions";
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../../Config/apiConfig";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { CreditActionType } from "../Enums/creditActionType.enum";
import { ActionResponseType } from "../../../Definitions/Enums/actionResponse.enum";
import * as Icon from "react-bootstrap-icons";
import { CreditActionModal } from "./creditActionModal";
import { ActionResponseModal } from "../../../Components/Models/actionResponseModal";
import { HttpStatusCode } from "axios";
import {
  CreditRetirementProceedAction,
  RetirementActionEnum,
} from "../Enums/creditRetirementProceedType.enum";
import { CreditRetirementInterface } from "../Interfaces/creditRetirement.interface";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { Role } from "../../../Definitions/Enums/role.enum";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";

const { Search } = Input;

enum CrediRetirementsColumns {
  PROJECT_NAME = "projectName",
  ORGANIZATION_NAME = "organizationName",
  SERIAL_NO = "serialNo",
  REFERENCE = "reference",
  DATE = "date",
  CREDITS = "credits",
  STATUS = "status",
  RETIREMENT_TYPE = "retirementType",
  ACTION = "action",
}
enum StatusOptions {
  ACCEPTED = "Completed",
  REJECTED = "Rejected",
  PENDING = "Pending",
  CANCELLED = "Cancelled",
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case StatusOptions.ACCEPTED:
      return "processing";
    case StatusOptions.REJECTED:
      return "orange";
    case StatusOptions.PENDING:
      return "purple";
    case StatusOptions.CANCELLED:
      return "error";
    default:
      return "default";
  }
};

export const CreditRetirementsTableComponent = (props: any) => {
  const { t } = props;

  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const isInitialRender = useRef(false);
  const [totalProgramme, setTotalProgramme] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<UserTableDataType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [sortField, setSortField] = useState<string>();
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAllBox, setCheckAllBox] = useState<boolean>(true);
  const checkBoxMenu = Object.keys(StatusOptions).map((k, index) => ({
    label: Object.values(StatusOptions)[index],
    value: Object.values(StatusOptions)[index],
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
    proceedAction: CreditRetirementProceedAction;
    data: CreditRetirementInterface;
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

    const filter: any[] = [];
    const filterOr: any[] = [];

    if (checkBoxOptions && checkBoxOptions?.length > 0) {
      filter.push({
        key: 'creditTx"."status',
        operation: "in",
        value: checkBoxOptions,
      });
    }

    if (search && search.trim() !== "") {
      filter.push({
        key: "projectName",
        operation: "like",
        value: `%${search.trim()}%`,
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
      const response: any = await post(API_PATHS.CREDIT_RETIREMENT_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      if (checkBoxOptions?.length <= 0) {
        setTableData([]);
        setTotalProgramme(0);
        return true;
      }
      setTableData(response?.data ? response.data : []);
      setTotalProgramme(
        response.response?.data?.total ? response.response?.data?.total : 0
      );
      isInitialRender.current = true;
    } catch (error: any) {
      console.log("Error in getting Credit Retirements", error);
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

  const actionMenu = (record: CreditRetirementInterface) => {
    return userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ? (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t("accept"),
            icon: <Icon.Clipboard color="#6ACDFFFA" />,
            click: () => {
              setModalActionData({
                icon: (
                  <Icon.Clipboard2Check
                    color={COLOR_CONFIGS.PRIMARY_THEME_COLOR}
                  />
                ),
                title: t("acceptCreditRetireRequest"),
                type: CreditActionType.RETIREMENT,
                actionBtnText: t("proceed"),
                remarkRequired: false,
                proceedAction: CreditRetirementProceedAction.ACCEPT,
                data: record,
              });
              setModalActionVisible(true);
            },
          },
          {
            text: t("reject"),
            icon: <Icon.XCircle color="#FF4D4F" />,
            click: () => {
              setModalActionData({
                icon: <Icon.XOctagon color="#ff4d4f" />,
                title: t("areYouSureWantToReject"),
                type: CreditActionType.RETIREMENT,
                actionBtnText: t("reject"),
                remarkRequired: true,
                proceedAction: CreditRetirementProceedAction.REJECT,
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
    ) : (
      <List
        className="action-menu"
        size="small"
        dataSource={[
          {
            text: t("cancel"),
            icon: <Icon.XCircle color="#FF4D4F" />,
            click: () => {
              setModalActionData({
                icon: <Icon.XOctagon color="#ff4d4f" />,
                title: t("areYouSureWantToCancel"),
                type: CreditActionType.RETIREMENT,
                actionBtnText: t("proceed"),
                remarkRequired: true,
                proceedAction: CreditRetirementProceedAction.CANCEL,
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
      title: t(CrediRetirementsColumns.REFERENCE),
      key: CrediRetirementsColumns.REFERENCE,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        return <span style={{ marginLeft: "20px" }}>{item?.id}</span>;
      },
    },
    {
      title: t(CrediRetirementsColumns.PROJECT_NAME),
      key: "projectName",
      sorter: true,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        return <span>{item?.projectName}</span>;
      },
    },
    {
      title: t(CrediRetirementsColumns.ORGANIZATION_NAME),
      key: "senderName",
      sorter: true,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        const elements = (
          <Row>
            <ProfileIcon
              icon={item.senderLogo}
              bg={"rgba(185, 226, 244, 0.56)"}
              name={item.senderName}
            />
            <span style={{ marginTop: "6px" }}>{item.senderName}</span>
          </Row>
        );
        return <div className="org-list">{elements}</div>;
      },
    },
    {
      title: t(CrediRetirementsColumns.SERIAL_NO),
      key: CrediRetirementsColumns.SERIAL_NO,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        return <span>{item?.serialNumber}</span>;
      },
    },
    {
      title: t(CrediRetirementsColumns.DATE),
      key: "createdDate",
      sorter: true,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        return (
          <span>
            {moment(parseInt(String(item?.createdDate))).format(
              "YYYY-MM-DD HH:mm:ss"
            )}
          </span>
        );
      },
    },
    {
      title: t(CrediRetirementsColumns.CREDITS),
      key: CrediRetirementsColumns.CREDITS,
      align: "left" as const,
      render: (item: CreditRetirementInterface) => {
        return (
          <span style={{ marginLeft: "20px" }}>
            {addCommSep(String(item?.creditAmount))}
          </span>
        );
      },
    },
    {
      title: t(CrediRetirementsColumns.STATUS),
      key: "status",
      sorter: true,
      align: "center" as const,
      render: (item: CreditRetirementInterface) => {
        return <Tag color={getStatusColor(item.status)}>{item.status}</Tag>;
      },
    },
    {
      title: t(CrediRetirementsColumns.RETIREMENT_TYPE),
      key: "retirementType",
      sorter: true,
      align: "center" as const,
      render: (item: CreditRetirementInterface) => {
        return <span>{item?.retirementType}</span>;
      },
    },
    {
      title: t(""),
      width: 6,
      align: "right" as const,
      key: CrediRetirementsColumns.ACTION,
      render: (record: CreditRetirementInterface) => {
        const menu = actionMenu(record);
        return (
          record.status === StatusOptions.PENDING &&
          (userInfoState?.userRole === Role.Admin ||
            userInfoState?.userRole === Role.Root) &&
          menu && (
            <Popover placement="bottomRight" content={menu} trigger="click">
              <EllipsisOutlined
                rotate={90}
                style={{ fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
              />
            </Popover>
          )
        );
      },
    },
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
      const allValues = Object.values(StatusOptions);
      setCheckBoxOptions(allValues);
    } else {
      setCheckBoxOptions([]);
    }
  };

  const onPaginationChange: PaginationProps["onChange"] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const onHandleTableChange = (page: any, sorter: any) => {
    setSortOrder(
      sorter.order === "ascend"
        ? "ASC"
        : sorter.order === "descend"
        ? "DESC"
        : undefined
    );
    setSortField(sorter.columnKey);
    // setCurrentPage(1);
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
    transactionId: any,
    action: RetirementActionEnum,
    remark?: string
  ) => {
    try {
      setModalActionLoading(true);

      const response = await post(API_PATHS.CREDIT_RETIREMENT_PERFROM, {
        transactionId: transactionId,
        action: action,
        remarks: remark,
      });

      if (response.status === HttpStatusCode.Created) {
        setModalResponseData({
          type:
            action === RetirementActionEnum.ACCEPT
              ? ActionResponseType.SUCCESS
              : action === RetirementActionEnum.REJECT
              ? ActionResponseType.PROCESSSED
              : ActionResponseType.PROCESSSED,
          icon:
            action === RetirementActionEnum.ACCEPT ? (
              <Icon.CheckCircle color={COLOR_CONFIGS.SUCCESS_RESPONSE_COLOR} />
            ) : action === RetirementActionEnum.REJECT ? (
              <Icon.CheckCircle
                color={COLOR_CONFIGS.PROCESSED_RESPONSE_COLOR}
              />
            ) : (
              <Icon.CheckCircle
                color={COLOR_CONFIGS.PROCESSED_RESPONSE_COLOR}
              />
            ),
          title: t(
            action === RetirementActionEnum.ACCEPT
              ? "creditRetireAcceptedSuccessfully"
              : action === RetirementActionEnum.REJECT
              ? "creditRetireRejectedSuccessfully"
              : "creditRetireCancelledSuccessfully"
          ),
          buttonText: t("okay"),
        });
      } else {
        setModalResponseData({
          type: ActionResponseType.FAILED,
          icon: (
            <Icon.ExclamationCircle
              color={COLOR_CONFIGS.FAILED_RESPONSE_COLOR}
            />
          ),
          title: t("creditRetirementSubmittedFailed"),
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
      setModalActionVisible(false);
      setModalActionLoading(false);
      setModalResponseVisible(true);
    }
  };

  return (
    <div className="content-card">
      <Row className="table-actions-section">
        <Col lg={{ span: 15 }} md={{ span: 14 }}>
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
        <Col lg={{ span: 9 }} md={{ span: 10 }}>
          <div className="filter-section">
            <div className="search-bar">
              <Search
                onPressEnter={(e) =>
                  onSearch((e.target as HTMLInputElement).value)
                }
                placeholder={`${t("searchByNameProjectName")}`}
                allowClear
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 265 }}
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
              onChange={(val: any, _: any, sorter: any) =>
                onHandleTableChange(val, sorter)
              }
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      tableData.length === 0 ? t("noRetirements") : null
                    }
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
        isProceed={true}
        type={modalActionData?.type}
        remarkRequired={modalActionData?.remarkRequired}
        data={modalActionData?.data}
        proceedAction={modalActionData?.proceedAction}
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
