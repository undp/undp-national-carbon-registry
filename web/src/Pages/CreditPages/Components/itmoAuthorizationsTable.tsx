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
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { API_PATHS } from "../../../Config/apiConfig";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { ActionResponseType } from "../../../Definitions/Enums/actionResponse.enum";
import { ProjectDetailsLink } from "../../../Components/ProjectDetailsLink/projectDetailsLink";
import * as Icon from "react-bootstrap-icons";
import { ItmoAuthProceedModal } from "./itmoAuthProceedModal";
import { ActionResponseModal } from "../../../Components/Models/actionResponseModal";
import { HttpStatusCode } from "axios";
import {
  CreditRetirementProceedAction,
  RetirementActionEnum,
} from "../Enums/creditRetirementProceedType.enum";
import { CreditItmoAuthorizationInterface } from "../Interfaces/creditItmoAuthorization.interface";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { Role } from "../../../Definitions/Enums/role.enum";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";
import { getStatusColor } from "./creditRetirementsTable";
import {
  AUTHORIZATION_PURPOSE_LABELS,
  AuthorizationPurpose,
} from "../../../Definitions/Enums/authorizationPurpose.enum";

const { Search } = Input;

enum CreditItmoAuthColumns {
  PROJECT_NAME = "projectName",
  ORGANIZATION_NAME = "organizationName",
  ITMO_SERIAL = "itmoSerial",
  PURPOSE_OF_AUTHORIZATION = "purposeOfAuthorization",
  REFERENCE = "reference",
  DATE = "date",
  CREDITS = "credits",
  STATUS = "status",
  COOPERATIVE_APPROACH = "cooperativeApproach",
  ACTION = "action",
}

enum StatusOptions {
  ACCEPTED = "Completed",
  REJECTED = "Rejected",
  PENDING = "Pending",
  CANCELLED = "Cancelled",
}

export const CreditItmoAuthorizationsTableComponent = (props: any) => {
  const { t } = props;

  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const isInitialRender = useRef(false);
  const [totalRecords, setTotalRecords] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<CreditItmoAuthorizationInterface[]>(
    []
  );
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
    actionBtnText?: string;
    remarkRequired: boolean;
    proceedAction: CreditRetirementProceedAction;
    data: CreditItmoAuthorizationInterface;
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
      const response: any = await post(API_PATHS.ITMO_AUTH_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      if (checkBoxOptions?.length <= 0) {
        setTableData([]);
        setTotalRecords(0);
        return true;
      }
      setTableData(response?.data ? response.data : []);
      setTotalRecords(
        response.response?.data?.total ? response.response?.data?.total : 0
      );
      isInitialRender.current = true;
    } catch (error: any) {
      console.log("Error in getting ITMO Authorizations", error);
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

  const actionMenu = (record: CreditItmoAuthorizationInterface) => {
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
                title: t("areYouSureWantToAcceptItmoAuthorization"),
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
                title: t("areYouSureWantToRejectItmoAuthorization"),
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
      title: t(CreditItmoAuthColumns.REFERENCE),
      key: CreditItmoAuthColumns.REFERENCE,
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return <span style={{ marginLeft: "20px" }}>{item?.id}</span>;
      },
    },
    {
      title: t(CreditItmoAuthColumns.PROJECT_NAME),
      key: "projectName",
      sorter: true,
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return (
          <ProjectDetailsLink
            projectId={item.projectId}
            projectName={item.projectName}
            projectOwnerId={item.projectOwnerId}
          />
        );
      },
    },
    {
      title: t(CreditItmoAuthColumns.ORGANIZATION_NAME),
      key: "senderName",
      sorter: true,
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
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
      title: t(CreditItmoAuthColumns.ITMO_SERIAL),
      key: CreditItmoAuthColumns.ITMO_SERIAL,
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return <span>{item?.itmoSerial || "—"}</span>;
      },
    },
    {
      // Not sortable: the column stores the raw AuthorizationPurpose wire
      // value, so a server-side sort would order by "OtherPurposes" /
      // "UseTowardsNDC" rather than by the labels shown here.
      title: t(CreditItmoAuthColumns.PURPOSE_OF_AUTHORIZATION),
      key: CreditItmoAuthColumns.PURPOSE_OF_AUTHORIZATION,
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return (
          <span>
            {item?.authorizationPurpose
              ? AUTHORIZATION_PURPOSE_LABELS[
                  item.authorizationPurpose as AuthorizationPurpose
                ] ?? item.authorizationPurpose
              : "—"}
          </span>
        );
      },
    },
    {
      title: t(CreditItmoAuthColumns.COOPERATIVE_APPROACH),
      key: "cooperativeApproachId",
      align: "left" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return <span>{item?.caReferenceNumber || "—"}</span>;
      },
    },
    {
      title: t(CreditItmoAuthColumns.DATE),
      key: "createdDate",
      sorter: true,
      align: "center" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
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
      title: t(CreditItmoAuthColumns.CREDITS),
      key: CreditItmoAuthColumns.CREDITS,
      align: "right" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return <span>{addCommSep(String(item?.creditAmount))}</span>;
      },
    },
    {
      title: t(CreditItmoAuthColumns.STATUS),
      key: "status",
      sorter: true,
      align: "center" as const,
      render: (item: CreditItmoAuthorizationInterface) => {
        return <Tag color={getStatusColor(item.status)}>{item.status}</Tag>;
      },
    },
    {
      title: t(""),
      width: 6,
      align: "right" as const,
      key: CreditItmoAuthColumns.ACTION,
      render: (record: CreditItmoAuthorizationInterface) => {
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
  };

  useEffect(() => {
    getQueryData();
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      getQueryData();
    }
  }, [currentPage, pageSize, modalActionVisible, modalResponseVisible]);

  useEffect(() => {
    if (isInitialRender.current) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        getQueryData();
      }
    }
  }, [sortField, sortOrder, search, checkBoxOptions]);

  // See creditRetirementsTable.tsx for why this effect is declared last.
  useEffect(() => {
    isInitialRender.current = true;
  }, []);

  const onFinishAction = async (
    transactionId: any,
    action: RetirementActionEnum,
    remark?: string
  ) => {
    try {
      setModalActionLoading(true);

      const response = await post(API_PATHS.ITMO_AUTH_PERFORM, {
        transactionId: transactionId,
        action: action,
        remarks: remark,
      });

      if (response.status === HttpStatusCode.Created) {
        setModalResponseData({
          type:
            action === RetirementActionEnum.ACCEPT
              ? ActionResponseType.SUCCESS
              : ActionResponseType.PROCESSSED,
          icon:
            action === RetirementActionEnum.ACCEPT ? (
              <Icon.CheckCircle color={COLOR_CONFIGS.SUCCESS_RESPONSE_COLOR} />
            ) : (
              <Icon.CheckCircle
                color={COLOR_CONFIGS.PROCESSED_RESPONSE_COLOR}
              />
            ),
          title: t(
            action === RetirementActionEnum.ACCEPT
              ? "itmoAuthAcceptedSuccessfully"
              : action === RetirementActionEnum.REJECT
              ? "itmoAuthRejectedSuccessfully"
              : "itmoAuthCancelledSuccessfully"
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
          title: t("itmoAuthorizationRequestSubmittedFailed"),
          buttonText: t("okay"),
        });
      }
    } catch (error: any) {
      setModalResponseData({
        type: ActionResponseType.FAILED,
        icon: (
          <Icon.ExclamationCircle color={COLOR_CONFIGS.FAILED_RESPONSE_COLOR} />
        ),
        title: error.message || t("somethingWentWrong"),
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
                total: totalRecords,
                showQuickJumper: true,
                showSizeChanger: true,
                onChange: onPaginationChange,
              }}
               
              onChange={(val: any, _: any, sorter: any) =>
                onHandleTableChange(val, sorter)
              }
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      tableData.length === 0 ? t("noItmoAuthorizations") : null
                    }
                  />
                ),
              }}
            />
          </div>
        </Col>
      </Row>
      <ItmoAuthProceedModal
        onFinish={onFinishAction}
        onCancel={() => setModalActionVisible(false)}
        t={t}
        actionBtnText={modalActionData?.actionBtnText}
        openModal={modalActionVisible}
        loading={modalActionLoading}
        icon={modalActionData?.icon}
        title={modalActionData?.title}
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
