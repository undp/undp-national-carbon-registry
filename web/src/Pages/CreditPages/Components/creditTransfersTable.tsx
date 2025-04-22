import {
  Col,
  Empty,
  Input,
  message,
  PaginationProps,
  Row,
  Table,
  Tag,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { UserTableDataType } from "../../../Definitions/Definitions/userManagement.definitions";
import { API_PATHS } from "../../../Config/apiConfig";
import { ProfileIcon } from "../../../Components/IconComponents/ProfileIcon/profile.icon";
import "../creditPageStyles.scss";
import { CreditTransfersInterface } from "../Interfaces/creditTransfers.interface";
import moment from "moment";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";

const { Search } = Input;

enum CrediTransferColumns {
  PROJECT_NAME = "projectName",
  TRANSFER_ID = "transferId",
  DATE = "date",
  SERIAL_NO = "serialNo",
  CREDIT_SENDER = "creditSender",
  CREDIT_RECEIVER = "creditReceiver",
  CREDIT_TRANSFERRED = "credits",
  STATUS = "status",
}
enum TransferStatus {
  SENT = "Sent",
  RECEIVED = "Received",
}

export const getStatusColor = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.SENT:
      return "success";
    case TransferStatus.RECEIVED:
      return "gold";
    default:
      return "default";
  }
};

export const CreditTransfersTableComponent = (props: any) => {
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

  const getQueryData = async () => {
    setLoading(true);

    const filter: any[] = [];
    const filterOr: any[] = [];

    if (search && search !== "") {
      filter.push({
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
      const response: any = await post(API_PATHS.CREDIT_TRANSFERS_QUERY, {
        page: currentPage,
        size: pageSize,
        filterAnd: filter,
        filterOr: filterOr?.length > 0 ? filterOr : undefined,
        sort: sort,
      });
      setTableData(response?.data ? response.data : []);
      setTotalProgramme(
        response.response?.data?.total ? response.response?.data?.total : 0
      );
      setLoading(false);
      isInitialRender.current = true;
    } catch (error: any) {
      console.log("Error in getting Credit Transfer List", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t(CrediTransferColumns.TRANSFER_ID),
      key: "id",
      sorter: true,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
        return <span style={{ marginLeft: "20px" }}>{item?.id}</span>;
      },
    },
    {
      title: t(CrediTransferColumns.PROJECT_NAME),
      key: "project.title",
      sorter: true,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
        return <span>{item?.projectName}</span>;
      },
    },
    {
      title: t(CrediTransferColumns.DATE),
      key: "createdDate",
      sorter: true,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
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
      title: t(CrediTransferColumns.SERIAL_NO),
      key: CrediTransferColumns.SERIAL_NO,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
        return <span>{item?.serialNumber}</span>;
      },
    },
    {
      title: t(CrediTransferColumns.CREDIT_SENDER),
      key: "sender.name",
      sorter: true,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
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
      title: t(CrediTransferColumns.CREDIT_RECEIVER),
      key: "receiver.name",
      sorter: true,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
        const elements = (
          <Row>
            <ProfileIcon
              icon={item.receiverLogo}
              bg={"rgba(185, 226, 244, 0.56)"}
              name={item.receiverName}
            />
            <span style={{ marginTop: "6px" }}>{item.receiverName}</span>
          </Row>
        );
        return <div className="org-list">{elements}</div>;
      },
    },
    {
      title: t(CrediTransferColumns.CREDIT_TRANSFERRED),
      key: CrediTransferColumns.CREDIT_TRANSFERRED,
      align: "left" as const,
      render: (item: CreditTransfersInterface) => {
        return (
          <span style={{ marginLeft: "20px" }}>
            {addCommSep(String(item?.creditAmount))}
          </span>
        );
      },
    },
    ...(userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER
      ? [
          {
            title: t(CrediTransferColumns.STATUS),
            key: CrediTransferColumns.STATUS,
            align: "center" as const,
            render: (item: CreditTransfersInterface) => {
              return (
                <Tag
                  color={getStatusColor(
                    item?.senderName &&
                      item?.senderName === userInfoState?.companyName
                      ? TransferStatus.SENT
                      : TransferStatus.RECEIVED
                  )}
                >
                  {t(
                    item?.senderName &&
                      item?.senderName === userInfoState?.companyName
                      ? TransferStatus.SENT
                      : TransferStatus.RECEIVED
                  )}
                </Tag>
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
    if (!isInitialRender.current) return;

    getQueryData();
  }, [currentPage, pageSize, sortField, sortOrder, search]);

  // MARK: Main JSX START

  return (
    <div className="content-card">
      <Row justify={"end"} className="table-actions-section">
        <Col lg={{ span: 9 }} md={{ span: 10 }}>
          <div className="filter-section">
            <div className="search-bar">
              <Search
                onPressEnter={(e) =>
                  onSearch((e.target as HTMLInputElement).value)
                }
                placeholder={`${t("search")}`}
                allowClear
                onSearch={onSearch}
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
              style={{ width: "200%" }}
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
                      tableData.length === 0 ? t("noTransfers") : null
                    }
                  />
                ),
              }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};
