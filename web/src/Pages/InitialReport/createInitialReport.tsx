import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { Button, Col, Form, Input, Row, message } from "antd";

const { TextArea } = Input;

const CreateInitialReport = () => {
  const navigate = useNavigate();
  const { post } = useConnection();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await post("national/initialReport/generate", {
        cooperativeApproachId: values.cooperativeApproachId,
        caMethodDescription: values.caMethodDescription,
        ndcQuantification: {
          ndcTarget: values.ndcTarget ? Number(values.ndcTarget) : null,
          baseYear: values.baseYear ? Number(values.baseYear) : null,
          targetYear: values.targetYear ? Number(values.targetYear) : null,
          sectors: values.sectors
            ? values.sectors.split(",").map((s: string) => s.trim())
            : [],
          ghgs: ["CO2"],
        },
      });
      message.success("Initial report draft generated");
      navigate("/initialReports/viewAll");
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          "Failed to generate initial report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
          Generate Initial Report
        </div>
        <div style={{ fontSize: "0.875rem", color: "rgba(58,53,65,0.6)" }}>
          Per Decision 2/CMA.3 para. 18 — required before first ITMO
          authorization under a cooperative approach
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
            <Col span={12}>
              <Form.Item
                name="cooperativeApproachId"
                label="Cooperative Approach ID"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. CA-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="ndcTarget" label="NDC Target (tCO2eq)">
                <Input placeholder="e.g. 500000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="baseYear" label="Base Year">
                <Input placeholder="e.g. 2015" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetYear" label="Target Year">
                <Input placeholder="e.g. 2030" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="sectors" label="Sectors (comma-separated)">
                <Input placeholder="e.g. Energy, Forestry, Waste" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="caMethodDescription"
                label="Corresponding Adjustment Method Description"
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the chosen CA method (trajectory, averaging, or multi-year) and rationale"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={() => navigate("/initialReports/viewAll")}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Draft
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default CreateInitialReport;
