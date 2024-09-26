import { Col, Row } from 'antd';
import { DateTime } from 'luxon';
import React, { FC } from 'react';
import './info.view.scss';
import { dateFormat } from '../../Definitions/Definitions/common.definitions';

export interface InfoViewProps {
  data: any;
  title?: any;
  icon?: any;
  hiddenColumns?: any;
}

export const InfoView: FC<InfoViewProps> = (props: InfoViewProps) => {
  const { title, data, icon, hiddenColumns } = props;
  return (
    <div className="info-view">
      <div className="title">
        <span className="title-icon">{icon}</span>
        <span className="title-text">{title}</span>
      </div>
      <div>
        {Object.keys(data).map((k: any) => {
          if (hiddenColumns.indexOf(k) < 0) {
            return (
              <Row className="field" key={k}>
                <Col span={12} className="field-key">
                  {k}
                </Col>
                <Col span={12} className="field-value">
                  {k.includes('GHG Emissions') ? (
                    Object.values(data[k])?.length > 0 ? (
                      Object.entries(data[k]).map(([key, value]) => {
                        return (
                          <div className="row">
                            <div className="key">{key}</div>
                            <div className="data">{data[k][key]}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div>-</div>
                    )
                  ) : (
                    <span>
                      {data[k] instanceof DateTime
                        ? data[k].toFormat(dateFormat)
                        : data[k] === '' || !data[k] || data[k] === 'NaN'
                        ? '-'
                        : data[k]}
                    </span>
                  )}
                </Col>
              </Row>
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
};

InfoView.defaultProps = {
  hiddenColumns: [],
};
