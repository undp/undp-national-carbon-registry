import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
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

const CaCalculation = () => {
  const navigate = useNavigate();
  const { post } = useConnection();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
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
      message.error("Failed to calculate corresponding adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
          Calculate Corresponding Adjustment
        </div>
        <div style={{ fontSize: "0.875rem", color: "rgba(58,53,65,0.6)" }}>
          Per Decision 2/CMA.3 Chapter III — Application of corresponding
          adjustments
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          boxShadow:
            "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px rgba(0,0,0,0.14), 0px 1px 3px rgba(0,0,0,0.12)",
        }}
      >
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
              <Form.Item name="ndcTarget" label="NDC Target (tCO2eq)">
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="e.g. 500000"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="cooperativeApproachId"
                label="Cooperative Approach ID (optional)"
              >
                <Select allowClear placeholder="All approaches">
                  {/* Populated dynamically in a full implementation */}
                </Select>
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
              <Descriptions.Item label="Used Towards NDC">
                {Number(result.usedTowardsNdcItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Cancelled ITMOs">
                {Number(result.cancelledItmos).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Emissions Balance">
                {Number(result.emissionsBalance).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Adjusted Emissions">
                {result.adjustedEmissions !== null
                  ? Number(result.adjustedEmissions).toFixed(2)
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="NDC Target">
                {result.ndcTarget || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaCalculation;
