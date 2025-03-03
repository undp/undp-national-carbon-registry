import React from 'react';
import { Typography, Row, Col, Table, List } from 'antd';

const { Title, Text } = Typography;

const revisions = [
  {
    version: '01.0',
    date: '21-08-2019',
    description: ['Initial Issuance'],
  },
  {
    version: '01.1',
    date: '13-01-2023',
    description: [
      'Add a new section specifying the "Proposed Project Capacity" to Section I;',
      'Change official address.',
    ],
  },
  {
    version: '01.2',
    date: '19-05-2023',
    description: [
      'Add new sections specifying the Afforestation and Reforestation project activities.',
      'Add new sections to gather more project details.',
    ],
  },
];

const InfDocumentInformation = (props: any) => {
  const { t } = props;
  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: '15%',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (descriptions: string[]) => (
        <div>
          {descriptions.map((desc, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              {index === 0 && descriptions.length === 1 ? (
                <Text>{desc}</Text>
              ) : (
                <>
                  {index === 0 && descriptions.length > 1 && <Text>Revision to:</Text>}
                  {index >= 0 && (
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                      <li>
                        <Text>{desc}</Text>
                      </li>
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title className="document-info-title-row">{t('addProgramme:documentInfoTitle')}</Title>
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={8}>
          <Text strong>{t('addProgramme:titleOfDoc')}</Text>
        </Col>
        <Col span={16}>
          <Text strong>{t('addProgramme:titleOfDocValue')}</Text>
        </Col>
        <Col span={8}>
          <Text>{t('addProgramme:docNoTitle')}</Text>
        </Col>
        <Col span={16}>
          <Text>SLCCS-INP-FRM</Text>
        </Col>
        <Col span={8}>
          <Text>{t('addProgramme:docTypeTitle')}</Text>
        </Col>
        <Col span={16}>
          <Text>{t('addProgramme:docTypeValue')}</Text>
        </Col>
        <Col span={8}>
          <Text>{t('addProgramme:businessFunctionTitle')}</Text>
        </Col>
        <Col span={16}>
          <Text>{t('addProgramme:businessFunctionValue')}</Text>
        </Col>
        <Col span={8}>
          <Text>{t('addProgramme:versionTitle')}</Text>
        </Col>
        <Col span={16}>
          <Text>01.2</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '25px' }}>
        <Col span={24}>
          <Title className="document-info-title-row">{t('addProgramme:revision')}</Title>
          <Table
            className="revisions-table"
            columns={columns}
            dataSource={revisions}
            pagination={false}
            rowKey="version"
            bordered={false} // Disable table borders
            style={{ border: 'none' }} // Ensure no borders are applied
          />
        </Col>
      </Row>
    </div>
  );
};

export default InfDocumentInformation;
