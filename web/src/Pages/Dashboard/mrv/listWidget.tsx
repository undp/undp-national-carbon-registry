import { FC, useEffect } from 'react';
import { Progress, Skeleton, Tooltip } from 'antd';
import './dashboard.scss';
import { addCommSepRound, addRoundNumber } from '@undp/carbon-library';
import { HandThumbsUp, XCircle, InfoCircle } from 'react-bootstrap-icons';

export interface ListWidgetProps {
  data: any[];
  icon: any;
  subTitle: string;
  total: number;
  totalText: string;
  updatedDate: any;
  loading: boolean;
  toolTipText: string;
  title: string;
}

const ListWidget: FC<ListWidgetProps> = (props: ListWidgetProps) => {
  const { title, total, data, icon, totalText, updatedDate, loading, toolTipText, subTitle } =
    props;

  useEffect(() => {});
  return (
    <div className="stastics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="title-section">
            <div className="title">
              {title}
              {subTitle && <div className="unit">{subTitle}</div>}
            </div>
            <div className="info-container">
              <Tooltip
                arrowPointAtCenter
                placement="bottomRight"
                trigger="hover"
                title={toolTipText}
                overlayClassName="custom-tooltip"
              >
                <InfoCircle color="#000000" size={17} />
              </Tooltip>
            </div>
          </div>
          <div className="total-programme-details">
            <div className="details">
              <div className="detail">{totalText}</div>
              <div className="value">{addCommSepRound(total)}</div>
            </div>
            <div className="icon">{icon}</div>
          </div>
          <div className="total-programme-extra-details">
            {data.map((item, index) => (
              <div className="transfered-details margin-top-1">
                <div className="icon">
                  <div className="icon-container" style={{ backgroundColor: item.startColor }}>
                    {item.icon}
                  </div>
                </div>
                <div className="details">
                  <div className="label-and-value">
                    <div className="label">{item.label}</div>
                    <div className="value">{addCommSepRound(item.value)}</div>
                  </div>
                  <div className="stastic-bar">
                    <Progress
                      showInfo={false}
                      percent={(item.value / total) * 100}
                      status="active"
                      strokeColor={{ from: item.startColor, to: item.endColor }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="updated-on margin-top-6">
            {updatedDate !== '0' && <div className="updated-moment-container">{updatedDate}</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default ListWidget;
