import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  message,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  CloudSyncOutlined,
  DownloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import "./CadtExport.scss";

const { Title, Text } = Typography;

interface SyncStatus {
  lastSyncTime: number | null;
  projectCount: number;
  failedCount: number;
}

const CadtExport = () => {
  const { get, post } = useConnection();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const resp = await get(API_PATHS.CADT_V2_STATUS);
      if (resp?.data) {
        setSyncStatus(resp.data);
      }
    } catch {
      // Status endpoint may not be available if disabled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const resp = await post(API_PATHS.CADT_V2_SYNC, {});
      if (resp?.data) {
        message.success(
          `Sync completed: ${resp.data.synced} synced, ${resp.data.failed} failed`
        );
        fetchStatus();
      }
    } catch (err: any) {
      message.error(err?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownload = async (format: string) => {
    setDownloading(true);
    try {
      const resp = await get(
        `${API_PATHS.CADT_V2_DOWNLOAD}?format=${format}`
      );
      if (resp?.data?.url) {
        window.open(resp.data.url, "_blank");
        message.success(`Export downloaded: ${resp.data.outputFileName}`);
      }
    } catch (err: any) {
      message.error(err?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (epoch: number | null) => {
    if (!epoch) return "Never";
    return new Date(epoch).toLocaleString();
  };

  return (
    <div className="cadt-export-container">
      <div className="cadt-export-header">
        <Title level={3}>
          <CloudSyncOutlined /> CAD Trust v2 Export
        </Title>
        <Text type="secondary">
          Export project data to CAD Trust v2 format or sync directly to a CADT
          node.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Last Sync"
                value={formatDate(syncStatus?.lastSyncTime ?? null)}
                prefix={
                  syncStatus?.lastSyncTime ? (
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                  )
                }
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Projects Synced"
                value={syncStatus?.projectCount ?? 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Failed"
                value={syncStatus?.failedCount ?? 0}
                valueStyle={{
                  color:
                    (syncStatus?.failedCount ?? 0) > 0
                      ? "#cf1322"
                      : undefined,
                }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}>
            <Card title="File Export" bordered>
              <Text>
                Download all project data as a CADT v2 compatible file for
                manual upload.
              </Text>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={() => handleDownload("xlsx")}
                  >
                    Download XLSX
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={() => handleDownload("csv")}
                  >
                    Download CSV
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Live Sync" bordered>
              <Text>
                Push all project data directly to a connected CADT v2 node.
              </Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<SyncOutlined spin={syncing} />}
                  loading={syncing}
                  onClick={handleSync}
                >
                  Sync to CADT
                </Button>
              </div>
              {syncing && (
                <Tag
                  color="processing"
                  style={{ marginTop: 8 }}
                  icon={<SyncOutlined spin />}
                >
                  Syncing in progress...
                </Tag>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default CadtExport;
