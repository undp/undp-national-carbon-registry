import { i18n } from 'i18next';
import { useEffect, useState } from 'react';
import './VerificationReport.scss';
import StepperComponent from './StepperComponent';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useParams, useLocation } from 'react-router-dom';
import { DocumentTypeEnum } from '../../Definitions/Enums/document.type';
import { Col, Row, Select, Tag, Form } from 'antd';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { getDocumentStatusColor } from '../../Definitions/Definitions/programme.definitions';
import { API_PATHS } from '../../Config/apiConfig';

export const VerificationReportComponent = (props: { translator: i18n }) => {
  const [countries, setCountries] = useState<[]>([]);
  const { put, get, post } = useConnection();
  const [form] = Form.useForm();
  const { translator } = props;
  const { id, verificationRequestId } = useParams();
  const { state } = useLocation();
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [documentStatus, setDocumentStatus] = useState('');

  const t = translator.t;

  const mode = state?.mode;

  const onVersionSelect = async (value: number) => {
    console.log('selected value', value);
    setSelectedVersion(value);
  };

  const getDocVersions = async () => {
    try {
      const { data } = await post(API_PATHS.VERIFICATION_DOC_VERSIONS, {
        programmeId: id,
        verificationRequestId: Number(verificationRequestId),
        docType: DocumentTypeEnum.VERIFICATION_REPORT,
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
    if (mode === FormMode.VIEW || mode === FormMode.EDIT) {
      getDocVersions();
    }
  }, []);

  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[0]);
    }
  }, [versions]);

  const getCountryList = async () => {
    const response = await get(API_PATHS.COUNTRY_LIST);
    if (response.data) {
      const alpha2Names = response.data.map((item: any) => {
        return item.alpha2;
      });
      setCountries(alpha2Names);
    }
  };

  useEffect(() => {
    // getCountryList();
  }, []);

  return (
    <div className="add-programme-main-container">
      <div className="title-container">
        <Row className="row" justify={'space-between'}>
          <Col xl={12} md={12}>
            <div className="main">{t('verificationReport:verificationReport')}</div>
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
            countries={countries}
            current={0}
            handleValuesUpdate={() => {}}
            form={form}
            // selectedVersion={selectedVersion}
            // handleDocumentStatus={handleDocumentStatus}
          />
        </div>
      </div>
    </div>
  );
};
