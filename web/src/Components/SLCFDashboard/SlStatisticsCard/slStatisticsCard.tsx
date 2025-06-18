import { FC } from 'react';
import './slStatisticsCard.scss';
import { Skeleton, Tooltip } from 'antd';
import { InfoCircle } from 'react-bootstrap-icons';

export interface SLStatisticsCardItemProps {
  value: string;
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
              <div className="value">{value}</div>
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
