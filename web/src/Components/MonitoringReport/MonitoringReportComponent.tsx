import { useEffect, useState } from 'react';
import './MonitoringReport.scss';
import StepperComponent from './StepperComponent';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useParams, useLocation } from 'react-router-dom';
import { Col, Row, Select, Tag, Form } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { getDocumentStatusColor } from '../../Definitions/Definitions/programme.definitions';
import { API_PATHS } from '../../Config/apiConfig';
import { i18n } from 'i18next';

export const MonitoringReportComponent = (props: { translator: i18n }) => {
  const { state } = useLocation();
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [documentStatus, setDocumentStatus] = useState('');
  const mode = state?.mode;
  const [form] = Form.useForm();
  const { translator } = props;
  const t = translator.t;

  const onVersionSelect = async (value: number) => {
    setSelectedVersion(value);
  };



  const handleDocumentStatus = (value: string) => {
    setDocumentStatus(value);
  };

  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[0]);
    }
  }, [versions]);


  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <Row className="row" justify={'space-between'}>
          <Col xl={12} md={12}>
            <div className="main">{t('monitoringReport:monitoringReport')}</div>
          </Col>
          {mode === FormMode.VIEW ? (
            <Col xl={12} md={12} style={{ textAlign: 'right' }}>
              <Select
                size="large"
                onChange={onVersionSelect}
                value={selectedVersion}
                autoFocus={false}
                className="version-selector"
              >
                {versions.map((version: number, index: number) => (
                  <Select.Option value={version} key={index}>
                    {'Version ' + version}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          ) : (
            ''
          )}
        </Row>
      </div>
      <div className="adding-section">
        {mode === FormMode.VIEW ? (
          <Row className="row" justify={'space-between'}>
            <Col xl={12} md={12}></Col>
            <Col xl={12} md={12} style={{ textAlign: 'right' }}>
              <Tag
                style={{ fontSize: 14, fontWeight: 500, padding: '4px 22px' }}
                color={getDocumentStatusColor(documentStatus)}
              >
                {documentStatus}
              </Tag>
            </Col>
          </Row>
        ) : (
          ''
        )}
        <div className="form-section">
          <StepperComponent
            translator={translator}
            t={t}
            current={0}
            handleValuesUpdate={() => {}}
            form={form}
          ></StepperComponent>
        </div>
      </div>
    </div>
  );
};
