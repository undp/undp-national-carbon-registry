import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  message,
} from "antd";
import "./cooperativeApproaches.scss";

const { TextArea } = Input;
const { Option } = Select;

const AddCooperativeApproach = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(["common"]);
  const { post, put } = useConnection();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const existingRecord = (location.state as any)?.record;
  const isEdit = !!existingRecord;

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate
          ? values.startDate.valueOf()
          : undefined,
        endDate: values.endDate ? values.endDate.valueOf() : undefined,
      };

      if (isEdit) {
        payload.cooperativeApproachId =
          existingRecord.cooperativeApproachId;
        await put("national/cooperativeApproach/update", payload);
        message.success("Cooperative approach updated successfully");
      } else {
        await post("national/cooperativeApproach/create", payload);
        message.success("Cooperative approach created successfully");
      }
      navigate("/cooperativeApproaches/viewAll");
    } catch (error) {
      message.error(
        `Failed to ${isEdit ? "update" : "create"} cooperative approach`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <div className="body-title">
          {isEdit ? "Edit" : "Add"} Cooperative Approach
        </div>
        <div className="body-sub-title">
          Define a bilateral or multilateral cooperative approach under Article
          6.2
        </div>
      </div>
      <div className="content-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={
            existingRecord
              ? {
                  ...existingRecord,
                  startDate: undefined,
                  endDate: undefined,
                }
              : { hostParty: import.meta.env.VITE_APP_COUNTRY_CODE || "" }
          }
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[
                  {
                    required: true,
                    message: "Title is required",
                  },
                ]}
              >
                <Input placeholder="e.g. Ghana-Switzerland Cooperative Approach" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hostParty"
                label="Host Party (Country Code)"
                rules={[
                  {
                    required: true,
                    message: "Host party is required",
                  },
                ]}
              >
                <Input placeholder="e.g. GH" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="participatingParties"
                label="Participating Parties (Country Codes)"
                rules={[
                  {
                    required: true,
                    message: "At least one participating party is required",
                  },
                ]}
              >
                <Select mode="tags" placeholder="Enter country codes (e.g. CH, SE)">
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ndcLink" label="NDC Link">
                <Input placeholder="URL or reference to relevant NDC" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <TextArea
                  rows={4}
                  placeholder="Describe the cooperative approach, its objectives, and scope"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="expectedMitigationOutcomes"
                label="Expected Mitigation Outcomes"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe expected ITMO volumes, sectors, and timeframes"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="environmentalIntegrityAssessment"
                label="Environmental Integrity Assessment"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe how environmental integrity is maintained (per para. 18(h) of Decision 2/CMA.3)"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={() => navigate("/cooperativeApproaches/viewAll")}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default AddCooperativeApproach;
