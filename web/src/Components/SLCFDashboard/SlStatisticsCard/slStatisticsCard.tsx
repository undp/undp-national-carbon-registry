import React, { FC } from 'react';
import './slStatisticsCard.scss';
import { Skeleton, Tooltip } from 'antd';
import { ClockHistory, BoxArrowRight, Diamond, Gem, InfoCircle } from 'react-bootstrap-icons';
import { addCommSep } from '../../../Definitions/Definitions/programme.definitions';

export interface SLStatisticsCardItemProps {
  value: number;
  title: string;
  updatedDate: any;
  icon: any;
  loading: boolean;
  backgroundColorClass: string;
  tooltip: any;
  t: any;
}

export const SLStatisticsCard: FC<SLStatisticsCardItemProps> = (
  props: SLStatisticsCardItemProps
) => {
  const { value, title, updatedDate, icon, loading, backgroundColorClass, tooltip, t } = props;

  return (
    <div className={`statistic-card-main-container ${backgroundColorClass}`}>
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <div className="title-section">
            <div className="title">
              {t(title)}
              <span className="info-container">
                <Tooltip arrowPointAtCenter placement="bottomRight" trigger="hover" title={tooltip}>
                  <InfoCircle color="#000000" size={17} />
                </Tooltip>
              </span>
            </div>

            <div className="icon-section">{icon}</div>
          </div>
          <div className="values-section">
            <div className="values-and-unit">
              <div className="value">
                {title.includes('credit')
                  ? value === 0 || String(value) === 'NaN'
                    ? 0
                    : addCommSep(value)
                  : value}
              </div>
            </div>
          </div>
          {updatedDate !== '0' && (
            <div className="updated-on-container">
              <div className="updated-on">{updatedDate}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
