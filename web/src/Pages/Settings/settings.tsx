import { useEffect, useState } from "react";
import { Card, Col, message, Row, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import SLCFSignatureComponent from "../../Components/SlcfSignatures/slcfSignatureComponent";

const { Text } = Typography;

const CADT_EXPORT_SETTING_ID = 3;

const Settings = (props: any) => {
  const { t } = useTranslation(["settings"]);
  const { get, post } = useConnection();
  const [cadtEnabled, setCadtEnabled] = useState(false);
  const [cadtLoading, setCadtLoading] = useState(false);
  const maximumImageSize = import.meta.env.MAXIMUM_IMAGE_SIZE
    ? parseInt(import.meta.env.MAXIMUM_IMAGE_SIZE)
    : 3145728;

  useEffect(() => {
    get(`national/Settings/query?id=${CADT_EXPORT_SETTING_ID}`)
      .then((resp: any) => {
        if (resp?.data === "true") {
          setCadtEnabled(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleCadtToggle = async (checked: boolean) => {
    setCadtLoading(true);
    try {
      await post("national/Settings/update", {
        id: CADT_EXPORT_SETTING_ID,
        settingValue: String(checked),
      });
      setCadtEnabled(checked);
      message.success(
        checked ? "CAD Trust Export enabled" : "CAD Trust Export disabled"
      );
    } catch {
      message.error("Failed to update setting");
    } finally {
      setCadtLoading(false);
    }
  };

  return (
    <div className="credit-transfer-management content-container">
      <div className="title-bar title-bar-transfer">
        <Row justify="space-between" align="middle">
          <Col span={20}>
            <div className="body-title">{t("settings:settingsTitle")}</div>
          </Col>
        </Row>
      </div>
      <div className="content-card">
        <Card
          title="Feature Toggles"
          style={{ marginBottom: 24 }}
          bordered={false}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Text strong>CAD Trust v2 Export</Text>
              <br />
              <Text type="secondary">
                Enable the CAD Trust export page under Reports for DNA admins.
              </Text>
            </Col>
            <Col>
              <Switch
                checked={cadtEnabled}
                loading={cadtLoading}
                onChange={handleCadtToggle}
              />
            </Col>
          </Row>
        </Card>
        <SLCFSignatureComponent
          t={t}
          maximumImageSize={maximumImageSize}
        ></SLCFSignatureComponent>
      </div>
    </div>
  );
};
export default Settings;
