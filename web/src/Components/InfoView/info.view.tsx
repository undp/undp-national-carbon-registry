import { Col, Row } from 'antd';
import { DateTime } from 'luxon';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './info.view.scss';

export interface InfoViewProps {
  data: any;
  title: any;
  icon: any;
}

const InfoView: FC<InfoViewProps> = (props: InfoViewProps) => {
  const { title, data, icon } = props;

  return (
    <div className="info-view">
      <div className="title">
        <span className="title-icon">{icon}</span>
        <span className="title-text">{title}</span>
      </div>
      <div>
        {Object.keys(data).map((k: any) => {
          return (
            <Row className="field">
              <Col span={12} className="field-key">
                {k}
              </Col>
              <Col span={12} className="field-value">
                {data[k] instanceof DateTime
                  ? data[k].toLocaleString(DateTime.DATE_FULL)
                  : data[k] === '' || !data[k]
                  ? '-'
                  : data[k]}
              </Col>
            </Row>
          );
        })}
      </div>
    </div>
  );
};
export default InfoView;
