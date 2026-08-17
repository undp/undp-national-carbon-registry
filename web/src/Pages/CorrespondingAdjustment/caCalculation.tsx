import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  message,
  Descriptions,
  Tag,
  Alert,
} from "antd";
import "./caManagement.scss";

const CaCalculation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "correspondingAdjust"]);
  const { post } = useConnection();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cooperativeApproaches, setCooperativeApproaches] = useState<
    { value: string; label: string }[]
  >([]);
  const [casLoading, setCasLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadCas = async () => {
      setCasLoading(true);
      try {
        const response = await post("national/cooperativeApproach/query", {
          page: 1,
          size: 200,
          sort: { key: "createdTime", order: "DESC" },
        });
        const rows: any[] = response?.data ?? [];
        setCooperativeApproaches(
          rows.map((ca) => ({
            value: ca.cooperativeApproachId,
            label: `${ca.cooperativeApproachId} — ${ca.title} (${ca.status})`,
          }))
        );
      } catch {
        // the calculation can still proceed registry-wide without a CA filter
      } finally {
        setCasLoading(false);
      }
    };
    loadCas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await post(
        "national/correspondingAdjustment/calculate",
        values
      );
      if (response?.data) {
        setResult(response.data);
        message.success("CA calculation completed");
      }
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to calculate corresponding adjustment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="corresponding-adjustment-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={t("correspondingAdjust:calculateCorrespondingAdjustment")}
          description={t(
            "correspondingAdjust:calculateCorrespondingAdjustmentDesc"
          )}
          infoButtonLabel={t(
            "correspondingAdjust:showCalculateCorrespondingAdjustmentDesc"
          )}
        />
      </div>
      <div className="content-card">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="year"
                label="Reporting Year"
                rules={[{ required: true, message: "Year is required" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={2021}
                  max={2050}
                  placeholder="e.g. 2025"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="ndcType"
                label="NDC Type"
                rules={[{ required: true }]}
                extra="Must match the NDC target defined for the selected year."
              >
                <Select placeholder="Select NDC type">
                  <Select.Option value="SingleYear">
                    Single-Year Target
                  </Select.Option>
                  <Select.Option value="MultiYear">
                    Multi-Year Target
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="caMethod"
                label="CA Method"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select method">
                  <Select.Option value="Trajectory">
                    Trajectory (para. 7a(i))
                  </Select.Option>
                  <Select.Option value="Averaging">
                    Averaging (para. 7a(ii))
                  </Select.Option>
                  <Select.Option value="MultiYear">
                    Multi-Year (para. 7b)
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="cooperativeApproachId"
                label="Cooperative Approach (optional)"
              >
                <Select
                  allowClear
                  showSearch
                  loading={casLoading}
                  placeholder="All approaches"
                  options={cooperativeApproaches}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={16}>
            <Col>
              <Button
                onClick={() =>
                  navigate("/correspondingAdjustments/viewAll")
                }
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                Calculate
              </Button>
            </Col>
          </Row>
        </Form>

        {result && (
          <div style={{ marginTop: 32 }}>
            <h3>Calculation Results</h3>
            {!result.safeguardCheckPassed && (
              <Alert
                type="warning"
                message="Safeguard Check Failed"
                description={result.safeguardNotes}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {result.safeguardCheckPassed && (
              <Alert
                type="success"
                message="Safeguard Check Passed"
                description={result.safeguardNotes}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Descriptions bordered column={2}>
              <Descriptions.Item label="CA ID">
                {result.caId}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{result.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Authorized ITMOs">
                {Number(result.authorizedItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="First Transferred ITMOs">
                {Number(result.firstTransferredItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Acquired ITMOs">
                {Number(result.acquiredItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Used Towards NDC (domestic + international)">
                {Number(result.usedTowardsNdcItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Cancelled ITMOs">
                {Number(result.cancelledItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Emissions Balance">
                {Number(result.emissionsBalance).toFixed(2)}
              </Descriptions.Item>
              {result.ndcType === "MultiYear" && (
                <>
                  <Descriptions.Item label="Cumulative First Transferred (period to date)">
                    {result.cumulativeFirstTransferred !== null &&
                    result.cumulativeFirstTransferred !== undefined
                      ? Number(result.cumulativeFirstTransferred).toFixed(2)
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Indicative Annual Adjustment">
                    {result.indicativeAnnualAdjustment !== null &&
                    result.indicativeAnnualAdjustment !== undefined
                      ? Number(result.indicativeAnnualAdjustment).toFixed(2)
                      : "N/A"}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Adjusted Emissions">
                {result.adjustedEmissions !== null &&
                result.adjustedEmissions !== undefined
                  ? Number(result.adjustedEmissions).toFixed(2)
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="NDC Target (resolved)">
                {result.ndcTarget !== null && result.ndcTarget !== undefined
                  ? result.ndcTarget
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaCalculation;
