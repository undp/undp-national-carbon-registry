import React, { FC } from 'react';
import moment from 'moment';
import './stasticCard.scss';
import { FieldTimeOutlined } from '@ant-design/icons';
import clockHistory from '../../Assets/Images/clockHistory.svg';
import envelopeCheck from '../../Assets/Images/envelopeCheck.svg';
import coin from '../../Assets/Images/coin.svg';
import { Skeleton } from 'antd';
import { addCommSep } from '../../Definitions/InterfacesAndType/programme.definitions';
import { ClockHistory, BoxArrowRight, Diamond, Gem } from 'react-bootstrap-icons';

export interface StasticCardItemProps {
  value: number;
  title: string;
  updatedDate: any;
  icon: any;
  loading: boolean;
}

const StasticCard: FC<StasticCardItemProps> = (props: StasticCardItemProps) => {
  const { value, title, updatedDate, icon, loading } = props;

  const cardBackgroundColor = (type: string) => {
    switch (type) {
      case '1':
        return '#023c66';
      case '2':
        return '#034b7f';
      case '3':
        return '#035998';
      case '4':
        return '#0468b1';
      case '5':
        return '#0577ca';
      case '6':
        return '#0585e3';
      default:
        return '#0894f9';
    }
  };

  return (
    <div className="stastic-card-main-container">
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <div className="values-section">
            <div className="title">{title}</div>
            {(title.includes('Credit') && value === 0) || String(value) === 'NaN' ? (
              <div className="details-section value">NaN</div>
            ) : (
              <>
                {title.includes('Credit') && <div className="unit">ITMOs</div>}
                <div className="details-section value">{addCommSep(value)}</div>
              </>
            )}
            <div className="updated-on">{moment(updatedDate * 1000).fromNow()}</div>
          </div>
          <div className="icon-section">{icon}</div>
        </>
      )}
    </div>
  );
};

export default StasticCard;
