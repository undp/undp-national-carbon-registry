import { Col, Row } from "antd";
import { useTranslation } from "react-i18next";
import SLCFSignatureComponent from "../../Components/SlcfSignatures/slcfSignatureComponent";

const Settings = (props: any) => {
  const { t } = useTranslation(["settings"]);
  const maximumImageSize = import.meta.env.MAXIMUM_IMAGE_SIZE
    ? parseInt(import.meta.env.MAXIMUM_IMAGE_SIZE)
    : 3145728;

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
        <SLCFSignatureComponent
          t={t}
          maximumImageSize={maximumImageSize}
        ></SLCFSignatureComponent>
      </div>
    </div>
  );
};
export default Settings;
