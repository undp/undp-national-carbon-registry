import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { useCountryOptions } from "../../Components/Common/hooks/useCountryOptions";
import { Button, Row, Col, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { CA_STATUS_COLORS } from "../../Definitions/Enums/cooperativeApproachStatus.enum";
import "./cooperativeApproaches.scss";
import "../../Styles/common.table.scss";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";

const CooperativeApproaches = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common","coopApproach"]);
  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const { byCode: countryNameByCode } = useCountryOptions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Sorting is server-side (the columns declare `sorter: true`), so the
  // chosen column/direction has to be fed back into the query — the
  // table can't reorder a page it only holds one slice of.
  const [sortField, setSortField] = useState("createdTime");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const canCreate =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const columns = [
    {
      title: t("coopApproach:columnId"),
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
      sorter: true,
    },
    {
      title: t("coopApproach:columnCaReference"),
      dataIndex: "caReferenceNumber",
      key: "caReferenceNumber",
      render: (ref: string) =>
        ref ? <Tag color="green">{ref}</Tag> : <span>—</span>,
    },
    {
      title: t("coopApproach:columnTitle"),
      dataIndex: "title",
      key: "title",
      sorter: true,
    },
    {
      title: t("coopApproach:columnHostParty"),
      dataIndex: "hostParty",
      key: "hostParty",
      render: (code: string) => countryNameByCode.get(code) ?? code,
    },
    {
      title: t("coopApproach:columnParticipatingParties"),
      dataIndex: "participatingParties",
      key: "participatingParties",
      render: (parties: string[]) => (
        <>
          {parties?.map((p) => (
            <Tag key={p}>{countryNameByCode.get(p) ?? p}</Tag>
          ))}
        </>
      ),
    },
    {
      title: t("coopApproach:columnStatus"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={CA_STATUS_COLORS[status] || "default"}>{status}</Tag>
      ),
    },
  ];

  const fetchData = async (
    page: number,
    size: number,
    field: string,
    order: "ASC" | "DESC"
  ) => {
    setLoading(true);
    try {
      const response = await post("national/cooperativeApproach/query", {
        page,
        size,
        sort: { key: field, order },
      });
      if (response?.data) {
        setData(response.data);
        setTotalRecords(response.response?.data?.total || response.data.length);
      }
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to load cooperative approaches"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize, sortField, sortOrder);
  }, [currentPage, pageSize, sortField, sortOrder]);

  // Clearing the sort (antd's third click) drops back to the default
  // newest-first ordering rather than leaving the list unordered.
  const handleTableChange = (sorter: any) => {
    const nextField =
      sorter?.order === "ascend" || sorter?.order === "descend"
        ? sorter.field ?? sorter.columnKey
        : "createdTime";
    const nextOrder: "ASC" | "DESC" =
      sorter?.order === "ascend" ? "ASC" : "DESC";

    // antd fires onChange for pagination too, so only jump back to the
    // first page when the ordering itself actually changed — otherwise
    // paging forward would bounce straight back to page 1.
    if (nextField !== sortField || nextOrder !== sortOrder) {
      setSortField(nextField);
      setSortOrder(nextOrder);
      setCurrentPage(1);
    }
  };

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={t('coopApproach:cooperativeApproaches')}
          description={t('coopApproach:coopApproachDescription', {
            defaultValue:
              'Article 6.2 bilateral and multilateral cooperative approaches',
          })}
          infoButtonLabel={t('coopApproach:showCoopApproachDescription', {
            defaultValue: 'Show information about Cooperative Approaches',
          })}
        />
      </div>
      <div className="content-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate("/cooperativeApproaches/add")
                }
              >
                {t('coopApproach:addNew')}
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          className="common-table-class"
          rowKey="cooperativeApproachId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalRecords,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          onChange={(_pagination, _filters, sorter) =>
            handleTableChange(sorter)
          }
          onRow={(record) => ({
            onClick: () =>
              navigate(`/cooperativeApproaches/view/${record.cooperativeApproachId}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
  );
};

export default CooperativeApproaches;
