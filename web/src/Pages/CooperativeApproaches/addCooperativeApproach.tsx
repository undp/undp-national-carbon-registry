import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useCountryOptions } from "../../Components/Common/hooks/useCountryOptions";
import { API_PATHS } from "../../Config/apiConfig";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import "./cooperativeApproaches.scss";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import { RequireDnaManage } from "../../Components/Common/AccessControl/RequireDnaAccess";

const { TextArea } = Input;

// One row of the Authorized Entities Form.List, as antd hands it back.
type AuthorizedEntityFormValues = {
  entityName: string;
  entityIdentifier?: string;
  countryOfIncorporation: string;
  authorizationDate?: moment.Moment;
  authorizationReference?: string;
};

const AddCooperativeApproach = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(["common", "coopApproach"]);
  const { get, post, put } = useConnection();
  const { options: countryOptions } = useCountryOptions();
  const [loading, setLoading] = useState(false);
  const [hostParty, setHostParty] = useState<{
    alpha2: string;
    name: string;
  } | null>(null);
  const [form] = Form.useForm();

  const existingRecord = (location.state as any)?.record;
  const isEdit = !!existingRecord;

  // Participating parties drive the country-of-incorporation options for
  // the authorized entities below, so this has to be a watched value.
  const participatingParties: string[] =
    Form.useWatch("participatingParties", form) ?? [];

  // Host party is derived server-side from the registry's own country
  // (systemCountry) — it isn't user-editable. Fetched for display, and
  // (in create mode) to pre-select/lock it in Participating Parties.
  useEffect(() => {
    const loadHostParty = async () => {
      const response = await get(API_PATHS.CA_HOST_PARTY);
      const host = response?.data;
      if (!host) return;
      setHostParty(host);
      if (!isEdit) {
        form.setFieldValue("participatingParties", [host.alpha2]);
      }
    };
    loadHostParty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The host party can never be removed from Participating Parties.
  const handlePartiesChange = (values: string[]) => {
    const next =
      hostParty && !values.includes(hostParty.alpha2)
        ? [...values, hostParty.alpha2]
        : values;
    form.setFieldValue("participatingParties", next);
  };

  const partiesTagRender = (props: {
    label: ReactNode;
    value: string;
    closable: boolean;
    onClose: () => void;
  }) => {
    const { label, value, closable, onClose } = props;
    const isHost = hostParty?.alpha2 === value;
    return (
      <Tag
        closable={!isHost && closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate
          ? values.startDate.valueOf()
          : undefined,
        endDate: values.endDate ? values.endDate.valueOf() : undefined,
        // Authorized entities are submitted together with the approach.
        // The update endpoint takes no entities array — amending a draft
        // goes through the details page instead.
        authorizedEntities: (
          (values.authorizedEntities ?? []) as AuthorizedEntityFormValues[]
        )
          .filter((entity) => entity)
          .map((entity) => ({
            entityName: entity.entityName,
            entityIdentifier: entity.entityIdentifier || undefined,
            countryOfIncorporation: entity.countryOfIncorporation,
            authorizationDate: entity.authorizationDate?.valueOf(),
            authorizationReference: entity.authorizationReference || undefined,
          })),
      };

      if (isEdit) {
        delete payload.authorizedEntities;
        payload.cooperativeApproachId =
          existingRecord.cooperativeApproachId;
        await put("national/cooperativeApproach/update", payload);
        message.success("Cooperative approach updated successfully");
        // Back to the approach that was actually edited, not the list —
        // Edit was launched from its detail page, so Update should
        // return there.
        navigate(
          `/cooperativeApproaches/view/${existingRecord.cooperativeApproachId}`
        );
      } else {
        await post("national/cooperativeApproach/create", payload);
        message.success("Cooperative approach created successfully");
        navigate("/cooperativeApproaches/viewAll");
      }
    } catch (error) {
      const fallback = t(
        isEdit
          ? "common:cooperativeApproachUpdateFailed"
          : "common:cooperativeApproachCreateFailed"
      );
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string" ? serverMsg : fallback
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireDnaManage>
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={
            isEdit
              ? t("coopApproach:editCoopApproach")
              : t("coopApproach:addCoopApproach")
          }
          description={t("coopApproach:addCoopApproachDescription")}
          infoButtonLabel={t("coopApproach:showAddCoopApproachDescription")}
        />
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
                  // The record carries epoch millis; the DatePicker needs
                  // moments. Leaving these undefined blanked both dates on
                  // every save.
                  startDate: existingRecord.startDate
                    ? moment(Number(existingRecord.startDate))
                    : undefined,
                  endDate: existingRecord.endDate
                    ? moment(Number(existingRecord.endDate))
                    : undefined,
                }
              : undefined
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
              <Form.Item label="Host Party">
                <Input
                  disabled
                  value={
                    hostParty
                      ? `${hostParty.name} (${hostParty.alpha2})`
                      : "Loading…"
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="participatingParties"
                label="Participating Parties"
                rules={[
                  {
                    required: true,
                    message: "At least one participating party is required",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  placeholder="Select participating countries"
                  options={countryOptions}
                  tagRender={partiesTagRender}
                  onChange={handlePartiesChange}
                />
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
          {/* Authorized entities can be set here at creation, or added
              later from the approach's details page — including after
              it's Submitted or Active, as an amendment. This form only
              ever creates the approach, so on edit they're managed from
              the details page instead. */}
          {!isEdit && (
            <>
              <Row gutter={24}>
                <Col span={24}>
                  <div className="table-title" style={{ marginBottom: 8 }}>
                    Authorized Entities
                  </div>
                  <div className="body-sub-title" style={{ marginBottom: 16 }}>
                    Entities authorized to act under this cooperative
                    approach. More can be added later from the approach's
                    details page, including after it's Submitted or Active.
                  </div>
                </Col>
              </Row>
              <Form.List name="authorizedEntities">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Row gutter={16} key={field.key} align="bottom">
                        <Col span={5}>
                          <Form.Item
                            name={[field.name, "entityName"]}
                            label="Entity Name"
                            rules={[
                              {
                                required: true,
                                message: "Entity name is required",
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name={[field.name, "entityIdentifier"]}
                            label="Identifier"
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            name={[field.name, "countryOfIncorporation"]}
                            label="Country of Incorporation"
                            rules={[
                              {
                                required: true,
                                message:
                                  "Country of incorporation is required",
                              },
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Select country"
                              // Must be one of the approach's participating
                              // parties — the server rejects anything else.
                              options={countryOptions.filter((option) =>
                                participatingParties.includes(option.value)
                              )}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name={[field.name, "authorizationDate"]}
                            label="Authorization Date"
                            rules={[
                              {
                                required: true,
                                message: "Authorization date is required",
                              },
                            ]}
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              disabledDate={(currentDate: moment.Moment) =>
                                currentDate > moment().endOf("day")
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name={[field.name, "authorizationReference"]}
                            label="Reference"
                          >
                            <Input placeholder="Document reference or URL" />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item>
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}
                    <Row>
                      <Col span={24}>
                        <Button
                          type="dashed"
                          block
                          icon={<PlusOutlined />}
                          onClick={() => add()}
                        >
                          Add Authorized Entity
                        </Button>
                      </Col>
                    </Row>
                  </>
                )}
              </Form.List>
            </>
          )}
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
    </RequireDnaManage>
  );
};

export default AddCooperativeApproach;
