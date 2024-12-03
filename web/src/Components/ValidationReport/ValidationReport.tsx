import React, { useEffect, useState } from 'react';
import ValidationStepperComponent from './ValidationStepperComponent';
import { i18n } from 'i18next';
import './ValidationReport.scss';
import { useLocation, useParams } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { DocumentTypeEnum } from '../../Definitions/Enums/document.type';
import { Col, Row, Select, Tag } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { getDocumentStatusColor } from '../../Definitions/Definitions/programme.definitions';

const ValidationReport = (props: { translator: i18n }) => {
  const { translator } = props;
  const { post } = useConnection();
  const { id } = useParams();
  const { state } = useLocation();
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [documentStatus, setDocumentStatus] = useState('');

  const mode = state?.mode;

  const t = translator.t;

  const onVersionSelect = async (value: number) => {
    console.log('selected value', value);
    setSelectedVersion(value);
  };

  const getDocVersions = async () => {
    try {
      const { data } = await post('national/programmeSl/getDocVersions', {
        programmeId: id,
        docType: DocumentTypeEnum.VALIDATION_REPORT,
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
    <div className="validation-form-container ">
      <div className="title-container">
        <Row className="row" justify={'space-between'}>
          <Col xl={12} md={12}>
            <div className="main">{t('validationReport:validationTitle')}</div>
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

      <div className="forms-container">
        {mode === FormMode.VIEW ? (
          <Row className="row" justify={'space-between'}>
            <Col xl={12} md={12}></Col>
            <Col xl={12} md={12} style={{ textAlign: 'right' }}>
              <Tag color={getDocumentStatusColor(documentStatus)}>{documentStatus}</Tag>
            </Col>
          </Row>
        ) : (
          ''
        )}
        <div className="stepper-container">
          <ValidationStepperComponent
            t={t}
            selectedVersion={selectedVersion}
            handleDocumentStatus={handleDocumentStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default ValidationReport;
