import { i18n } from 'i18next';
import { useEffect, useState } from 'react';
import './PDD.scss';
import StepperComponent from './StepperComponent';
import { Col, Row, Select, Tag } from 'antd';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useParams } from 'react-router-dom';
import { DocumentTypeEnum } from '../../Definitions/Enums/document.type';
import { getDocumentStatusColor } from '../../Definitions/Definitions/programme.definitions';
import { API_PATHS } from '../../Config/apiConfig';

const PDD = (props: { translator: i18n }) => {
  const { translator } = props;
  const { post } = useConnection();
  const { id } = useParams();
  const { state } = useLocation();
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [documentStatus, setDocumentStatus] = useState('');

  const isView = !!state?.isView;

  const t = translator.t;

  const onVersionSelect = async (value: number) => {
    setSelectedVersion(value);
  };

  const getDocVersions = async () => {
    try {
      const { data } = await post(API_PATHS.LAST_DOC_VERSIONS, {
        programmeId: id,
        docType: DocumentTypeEnum.CMA,
      });
      setVersions(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDocumentStatus = (value: string) => {
    setDocumentStatus(value);
  };

  useEffect(() => {
    getDocVersions();
  }, []);

  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[0]);
    }
  }, [versions]);

  return (
    <div className="cma-form-container">
      <div className="title-container">
        <Row className="row" justify={'space-between'}>
          <Col xl={12} md={12}>
            <div className="main">{t('PDD:pddFormTitle')}</div>
          </Col>
          {isView ? (
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

      <div className="forms-container">
        {isView ? (
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
        <div className="stepper-container">
          <StepperComponent
            t={t}
            selectedVersion={selectedVersion}
            handleDocumentStatus={handleDocumentStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default PDD;
